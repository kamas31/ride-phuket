'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreVertical, X } from 'lucide-react'
import { blockUser, unblockUser, reportConversation, deleteConversation } from '@/app/actions/moderation'
import { cn } from '@/lib/utils'

interface ThreadMenuProps {
  conversationId: string
  blockedByMe: boolean
  onBlockChange: (blocked: boolean) => void
  onDelete?: () => void
}

const REPORT_REASONS = [
  { value: 'spam',       label: 'Spam' },
  { value: 'scam',       label: 'Scam or fraud' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other',      label: 'Other' },
] as const

type ReportReason = (typeof REPORT_REASONS)[number]['value']

export default function ThreadMenu({ conversationId, blockedByMe, onBlockChange, onDelete }: ThreadMenuProps) {
  const [open, setOpen] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [reportReason, setReportReason] = useState<ReportReason>('spam')
  const [reportDetails, setReportDetails] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [reportDone, setReportDone] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [open])

  async function handleBlock() {
    setIsPending(true)
    const result = await blockUser(conversationId)
    setIsPending(false)
    if ('ok' in result) {
      onBlockChange(true)
      setShowBlockConfirm(false)
    }
  }

  async function handleUnblock() {
    setIsPending(true)
    const result = await unblockUser(conversationId)
    setIsPending(false)
    if ('ok' in result) {
      onBlockChange(false)
      setOpen(false)
    }
  }

  async function handleDelete() {
    setIsPending(true)
    const result = await deleteConversation(conversationId)
    setIsPending(false)
    if ('ok' in result) {
      setShowDeleteConfirm(false)
      onDelete?.()
    }
  }

  async function handleReport() {
    setIsPending(true)
    const result = await reportConversation(conversationId, reportReason, reportDetails || undefined)
    setIsPending(false)
    if ('ok' in result) setReportDone(true)
  }

  return (
    <>
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="More options"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f2] active:bg-[#eeeeed] transition-colors"
        >
          <MoreVertical className="w-[17px] h-[17px] text-[#9c9c98]" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 bg-white border border-[#e8e8e4] rounded-[14px] shadow-[0_4px_20px_rgba(0,0,0,0.10)] overflow-hidden z-10 min-w-[168px]">
            <button
              onClick={() => {
                setOpen(false)
                if (blockedByMe) handleUnblock()
                else setShowBlockConfirm(true)
              }}
              className="w-full text-left px-4 py-3 text-[13px] text-[#0f0f0e] hover:bg-[#fafaf8] transition-colors"
            >
              {blockedByMe ? 'Unblock user' : 'Block user'}
            </button>
            <div className="h-px bg-[#f0f0ec]" />
            <button
              onClick={() => { setOpen(false); setShowReport(true) }}
              className="w-full text-left px-4 py-3 text-[13px] text-[#ef4444] hover:bg-[#fafaf8] transition-colors"
            >
              Report conversation
            </button>
            <div className="h-px bg-[#f0f0ec]" />
            <button
              onClick={() => { setOpen(false); setShowDeleteConfirm(true) }}
              className="w-full text-left px-4 py-3 text-[13px] text-[#ef4444] hover:bg-[#fafaf8] transition-colors"
            >
              Delete conversation
            </button>
          </div>
        )}
      </div>

      {/* Block confirmation */}
      {showBlockConfirm && (
        <Modal onClose={() => setShowBlockConfirm(false)}>
          <p className="text-[16px] font-bold text-[#0f0f0e] mb-1.5">Block this user?</p>
          <p className="text-[13px] text-[#5c5c58] leading-relaxed mb-6">
            They won&apos;t be able to send you messages in this conversation, and you won&apos;t see theirs.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowBlockConfirm(false)}
              className="flex-1 h-11 rounded-full border border-[#e8e8e4] text-[14px] text-[#5c5c58] font-medium hover:bg-[#f8f8f6] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              disabled={isPending}
              className="flex-1 h-11 rounded-full bg-[#0f0f0e] text-white text-[14px] font-semibold disabled:opacity-50 hover:bg-[#2a2a28] transition-colors"
            >
              {isPending ? 'Blocking…' : 'Block'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(false)}>
          <p className="text-[16px] font-bold text-[#0f0f0e] mb-1.5">Delete conversation?</p>
          <p className="text-[13px] text-[#5c5c58] leading-relaxed mb-6">
            This will permanently delete the conversation and all its messages. This action cannot be undone.
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 h-11 rounded-full border border-[#e8e8e4] text-[14px] text-[#5c5c58] font-medium hover:bg-[#f8f8f6] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 h-11 rounded-full bg-[#ef4444] text-white text-[14px] font-semibold disabled:opacity-50 hover:bg-[#dc2626] transition-colors"
            >
              {isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {/* Report */}
      {showReport && (
        <Modal onClose={() => { setShowReport(false); setReportDone(false); setReportDetails('') }}>
          {reportDone ? (
            <>
              <p className="text-[16px] font-bold text-[#0f0f0e] mb-1.5">Report submitted</p>
              <p className="text-[13px] text-[#5c5c58] leading-relaxed mb-6">
                Thanks for letting us know. We&apos;ll review this conversation.
              </p>
              <button
                onClick={() => { setShowReport(false); setReportDone(false) }}
                className="w-full h-11 rounded-full bg-[#FF6B35] text-white text-[14px] font-semibold hover:bg-[#e85d29] transition-colors"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <p className="text-[16px] font-bold text-[#0f0f0e] mb-4">Report conversation</p>
              <div className="space-y-2 mb-4">
                {REPORT_REASONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setReportReason(r.value)}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-[12px] border text-[14px] transition-colors',
                      reportReason === r.value
                        ? 'border-[#FF6B35] bg-[#fff4f0] text-[#FF6B35] font-medium'
                        : 'border-[#e8e8e4] text-[#0f0f0e] hover:bg-[#fafaf8]',
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <textarea
                value={reportDetails}
                onChange={e => setReportDetails(e.target.value)}
                placeholder="Additional details (optional)"
                maxLength={500}
                rows={2}
                className="w-full resize-none rounded-[12px] border border-[#e8e8e4] bg-[#f8f8f6] px-4 py-3 text-[13px] text-[#0f0f0e] placeholder-[#c8c8c4] focus:outline-none focus:border-[#FF6B35]/60 transition-colors mb-4"
              />
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowReport(false)}
                  className="flex-1 h-11 rounded-full border border-[#e8e8e4] text-[14px] text-[#5c5c58] font-medium hover:bg-[#f8f8f6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReport}
                  disabled={isPending}
                  className="flex-1 h-11 rounded-full bg-[#FF6B35] text-white text-[14px] font-semibold disabled:opacity-50 hover:bg-[#e85d29] transition-colors"
                >
                  {isPending ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-[24px] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f5f5f2] transition-colors"
        >
          <X className="w-4 h-4 text-[#9c9c98]" />
        </button>
        {children}
      </div>
    </div>
  )
}
