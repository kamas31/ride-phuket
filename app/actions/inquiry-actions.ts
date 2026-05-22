'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateInquiry } from '@/lib/moderation'
import { WA_LABELS, type WATemplate } from '@/lib/whatsapp'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface InquiryRow {
  id: string
  scooter_id: string
  shop_id: string
  rider_id: string | null
  question_type: string
  question: string
  answer: string | null
  answered_at: string | null
  is_public: boolean
  created_at: string
}

export interface SubmitInquiryResult {
  success: boolean
  inquiryId?: string
  error?: string
}

export interface AnswerInquiryResult {
  success: boolean
  error?: string
}

// ── submitInquiry ─────────────────────────────────────────────────────────────
// Called when a rider submits a question via InquiryChips on the scooter page.

export async function submitInquiry(
  scooterId: string,
  shopId: string,
  questionType: WATemplate,
  question: string,
): Promise<SubmitInquiryResult> {
  // Content moderation
  const validationError = validateInquiry(question)
  if (validationError) return { success: false, error: validationError }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Allow anonymous submissions (guests can also ask questions)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('inquiries')
    .insert({
      scooter_id:    scooterId,
      shop_id:       shopId,
      rider_id:      user?.id ?? null,
      question_type: questionType,
      question:      question.trim(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('[submitInquiry]', error.message)
    return { success: false, error: 'Could not send your question. Please try again.' }
  }

  revalidatePath(`/scooter/${scooterId}`)
  return { success: true, inquiryId: data.id }
}

// ── answerInquiry ─────────────────────────────────────────────────────────────
// Called from the partner dashboard when a shop owner answers a question.

export async function answerInquiry(
  inquiryId: string,
  answer: string,
): Promise<AnswerInquiryResult> {
  if (!answer.trim()) return { success: false, error: 'Answer cannot be empty.' }
  if (answer.length > 1000) return { success: false, error: 'Answer too long.' }

  const userClient = await createClient()
  const { data: { user }, error: authErr } = await userClient.auth.getUser()
  if (authErr || !user) return { success: false, error: 'Not authenticated.' }

  const admin = createAdminClient()

  // Verify ownership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inquiry } = await (admin as any)
    .from('inquiries')
    .select('id, shop_id, scooter_id, shops(owner_id)')
    .eq('id', inquiryId)
    .single()

  if (!inquiry) return { success: false, error: 'Inquiry not found.' }
  if (inquiry.shops?.owner_id !== user.id) return { success: false, error: 'Unauthorized.' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateErr } = await (admin as any)
    .from('inquiries')
    .update({ answer: answer.trim(), answered_at: new Date().toISOString() })
    .eq('id', inquiryId)

  if (updateErr) return { success: false, error: updateErr.message }

  revalidatePath(`/scooter/${inquiry.scooter_id}`)
  revalidatePath('/partner/bookings')
  return { success: true }
}

// ── getPublicInquiries ────────────────────────────────────────────────────────
// Returns answered public inquiries for a scooter (the FAQ section).

export async function getPublicInquiries(scooterId: string): Promise<{
  questionType: string
  questionLabel: string
  answer: string
}[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('inquiries')
    .select('question_type, answer')
    .eq('scooter_id', scooterId)
    .eq('is_public', true)
    .not('answer', 'is', null)
    .order('answered_at', { ascending: false })
    .limit(10)

  return (data ?? []).map((r: { question_type: string; answer: string }) => ({
    questionType: r.question_type,
    questionLabel: WA_LABELS[r.question_type as WATemplate] ?? r.question_type,
    answer: r.answer,
  }))
}

// ── getPendingShopInquiries ───────────────────────────────────────────────────
// Returns unanswered inquiries for a shop (partner dashboard).

export async function getPendingShopInquiries(shopId: string): Promise<(InquiryRow & {
  scooter_name: string | null
})[]> {
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from('inquiries')
    .select('*, scooters(name)')
    .eq('shop_id', shopId)
    .is('answer', null)
    .order('created_at', { ascending: false })
    .limit(50)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((r: any) => ({
    ...r,
    scooter_name: r.scooters?.name ?? null,
  }))
}
