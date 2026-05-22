'use client'

import { useState } from 'react'
import { MessageSquare, Send, Check, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WA_LABELS, buildWAMessage, type WATemplate, type WAContext } from '@/lib/whatsapp'
import { submitInquiry } from '@/app/actions/inquiry-actions'

// ─────────────────────────────────────────────────────────────────────────────
// InquiryChips — pre-booking question system (replaces direct WA)
//
// Rider clicks a topic chip → inline form expands with pre-filled question
// → submits to DB → shop sees & answers in their dashboard.
// No direct contact info exposed.
// ─────────────────────────────────────────────────────────────────────────────

interface InquiryChipsProps {
  scooterId: string
  shopId: string
  context?: WAContext
  questions?: WATemplate[]
  className?: string
}

const DEFAULT_QUESTIONS: WATemplate[] = [
  'ask_delivery',
  'ask_deposit',
  'ask_license',
  'ask_availability',
  'ask_monthly',
]

type State = 'idle' | 'open' | 'sending' | 'sent' | 'error'

export function InquiryChips({
  scooterId,
  shopId,
  context = {},
  questions = DEFAULT_QUESTIONS,
  className,
}: InquiryChipsProps) {
  const [activeTemplate, setActiveTemplate] = useState<WATemplate | null>(null)
  const [text, setText] = useState('')
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const openChip = (template: WATemplate) => {
    if (state === 'sent') return
    const prefilled = buildWAMessage(template, context)
    setActiveTemplate(template)
    setText(prefilled)
    setState('open')
  }

  const close = () => {
    setActiveTemplate(null)
    setText('')
    setState('idle')
  }

  const send = async () => {
    if (!activeTemplate || !text.trim() || state === 'sending') return
    setState('sending')
    const res = await submitInquiry(scooterId, shopId, activeTemplate, text)
    if (res.success) {
      setState('sent')
    } else {
      setErrorMsg(res.error ?? 'Failed to send. Please try again.')
      setState('error')
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Topic chips */}
      <div>
        <p className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3 h-3" />
          Ask the shop a question
        </p>
        <div className="flex flex-wrap gap-1.5">
          {questions.map(q => (
            <button
              key={q}
              type="button"
              onClick={() => activeTemplate === q ? close() : openChip(q)}
              disabled={state === 'sent'}
              className={cn(
                'px-3 py-1.5 text-[11px] font-medium rounded-full border transition-all active:scale-[0.96]',
                activeTemplate === q
                  ? 'bg-[#fff4f0] border-[#FF6B35] text-[#FF6B35]'
                  : 'bg-[#f8f8f6] border-[#e8e8e4] text-[#5c5c58] hover:border-[#FF6B35]/40 hover:text-[#FF6B35] hover:bg-[#fff4f0]',
                state === 'sent' && 'opacity-40 cursor-not-allowed',
              )}
            >
              {WA_LABELS[q]}
              {activeTemplate === q && <ChevronDown className="w-2.5 h-2.5 inline ml-1 rotate-180" />}
            </button>
          ))}
        </div>
      </div>

      {/* Inline form — expands below when a chip is selected */}
      {state === 'open' || state === 'sending' || state === 'error' ? (
        <div
          className="bg-[#f8f8f6] border border-[#e8e8e4] rounded-[14px] p-4 space-y-3"
          style={{ animation: 'fade-up 0.18s ease' }}
        >
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Edit your question if needed…"
            className="w-full bg-white border border-[#e8e8e4] rounded-[10px] px-3 py-2.5 text-sm text-[#0f0f0e] placeholder:text-[#9c9c98] focus:outline-none focus:border-[#FF6B35] resize-none"
            disabled={state === 'sending'}
          />
          {state === 'error' && (
            <p className="text-xs text-[#dc2626]">{errorMsg}</p>
          )}
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={close} className="text-xs text-[#9c9c98] hover:text-[#5c5c58] transition-colors">
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!text.trim() || state === 'sending'}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF6B35] text-white text-xs font-bold rounded-full hover:bg-[#e85d29] disabled:opacity-50 transition-colors active:scale-[0.97]"
            >
              {state === 'sending'
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
                : <><Send className="w-3.5 h-3.5" />Send question</>
              }
            </button>
          </div>
          <p className="text-[10px] text-[#9c9c98]">
            The shop will answer on this page, usually within a few hours.
          </p>
        </div>
      ) : state === 'sent' ? (
        <div
          className="flex items-center gap-2.5 px-4 py-3 bg-[#f0fdf4] border border-[#22c55e]/20 rounded-[12px]"
          style={{ animation: 'fade-up 0.2s ease' }}
        >
          <div className="w-6 h-6 bg-[#22c55e] rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#16a34a]">Question sent!</p>
            <p className="text-[10px] text-[#9c9c98] mt-0.5">The shop typically replies within a few hours.</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
