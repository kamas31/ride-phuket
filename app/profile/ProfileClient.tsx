'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield, Heart, Star, LogOut,
  ChevronRight, Check, Phone, Mail, LayoutDashboard, Trash2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile, deleteAccount } from '@/app/actions/profile'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/hooks/useProfile'

interface ProfileClientProps {
  user: { id: string; email: string; created_at: string }
  profile: Profile | null
}

export default function ProfileClient({ user, profile }: ProfileClientProps) {
  const { signOut } = useAuth()
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const isShopOwner = profile?.role === 'shop_owner'
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const MENU_SECTIONS = [
    ...(isShopOwner ? [{
      title: 'Shop',
      items: [
        { icon: LayoutDashboard, label: 'Partner Dashboard', href: '/partner/dashboard', badge: null },
        { icon: Star, label: 'My Fleet', href: '/partner/dashboard', badge: null },
      ]
    }] : []),
    {
      title: 'Saved',
      items: [
        { icon: Heart, label: 'Saved Scooters', href: '/saved', badge: null },
      ]
    },
  ]

  const handleSave = async () => {
    setSaving(true)
    await updateProfile({ name, phone })
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleteStep('deleting')
    setDeleteError(null)
    const { error } = await deleteAccount()
    if (error) {
      setDeleteError(error)
      setDeleteStep('confirm')
      return
    }
    await signOut()
    router.replace('/')
  }

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-xl mx-auto px-4 pt-20 pb-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-[#ff9a5c] rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {getInitials(profile?.name ?? user.email)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] font-bold text-[#0f0f0e] truncate">
                  {profile?.name ?? user.email.split('@')[0]}
                </h1>
                {profile?.verified && (
                  <div className="w-5 h-5 bg-[#22c55e] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isShopOwner
                    ? 'bg-[#fff4f0] text-[#FF6B35]'
                    : 'bg-[#f0f0ec] text-[#5c5c58]'
                }`}>
                  {isShopOwner ? '🏪 Shop Owner' : '🛵 Rider'}
                </span>
                <span className="text-xs text-[#9c9c98]">·</span>
                <span className="text-xs text-[#9c9c98]">Since {memberSince}</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-1.5 mt-4 pl-0">
            <div className="flex items-center gap-2 text-sm text-[#5c5c58]">
              <Mail className="w-3.5 h-3.5 text-[#9c9c98] flex-shrink-0" />
              {user.email}
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-2 text-sm text-[#5c5c58]">
                <Phone className="w-3.5 h-3.5 text-[#9c9c98] flex-shrink-0" />
                {profile.phone}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Edit profile card */}
        <div className="bg-white rounded-[20px] border border-[#e8e8e4] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#0f0f0e] text-sm">Personal Information</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-semibold text-[#FF6B35] hover:underline"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setEditing(false)} className="text-xs text-[#9c9c98] hover:text-[#5c5c58]">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-xs font-bold text-[#FF6B35] hover:underline disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {saved && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#f0fdf4] rounded-[10px] mb-3 text-sm text-[#22c55e]">
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
              Profile updated
            </div>
          )}

          <div className="space-y-3">
            {[
              { label: 'Full Name', value: name, onChange: setName, type: 'text', placeholder: 'Your name' },
              { label: 'Phone / WhatsApp', value: phone, onChange: setPhone, type: 'tel', placeholder: '+66 or international' },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                  {field.label}
                </label>
                {editing ? (
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.onChange(e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[10px] text-sm focus:outline-none focus:border-[#FF6B35] transition-colors"
                  />
                ) : (
                  <p className="text-sm text-[#0f0f0e]">{field.value || <span className="text-[#9c9c98]">Not set</span>}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Verification */}
        {profile?.verified ? (
          <div className="flex items-center gap-4 px-5 py-4 bg-[#f0fdf4] border border-[#22c55e]/20 rounded-[20px]">
            <div className="w-10 h-10 bg-[#22c55e]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-[#22c55e]" />
            </div>
            <div>
              <p className="font-bold text-[#16a34a] text-sm">Verified {isShopOwner ? 'Shop Owner' : 'Rider'}</p>
              <p className="text-xs text-[#16a34a]/70 mt-0.5">Identity confirmed. Full platform access granted.</p>
            </div>
          </div>
        ) : null}

        {/* Menu sections */}
        {MENU_SECTIONS.map(section => (
          <div key={section.title}>
            <h2 className="text-[10px] font-semibold text-[#9c9c98] uppercase tracking-widest mb-3 px-1">
              {section.title}
            </h2>
            <div className="bg-white rounded-[20px] border border-[#e8e8e4] overflow-hidden divide-y divide-[#f0f0ec]">
              {section.items.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-[#f8f8f6] transition-colors"
                >
                  <div className="w-8 h-8 bg-[#f0f0ec] rounded-[10px] flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-[#5c5c58]" />
                  </div>
                  <span className="flex-1 text-sm font-medium text-[#0f0f0e]">{item.label}</span>
                  {item.badge && (
                    <span className="text-xs text-[#9c9c98]">{item.badge}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-[#9c9c98]" />
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Sign out */}
        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[14px] border border-[#e8e8e4] text-sm font-medium text-[#9c9c98] hover:bg-white hover:text-[#ef4444] hover:border-[#ef4444] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        {/* Delete account */}
        <div className="pt-2">
          {deleteStep === 'idle' && (
            <button
              onClick={() => setDeleteStep('confirm')}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-[#9c9c98] hover:text-[#ef4444] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Account
            </button>
          )}

          {(deleteStep === 'confirm' || deleteStep === 'deleting') && (
            <div className="bg-white border border-[#fecaca] rounded-[16px] p-5 space-y-3">
              <p className="text-sm font-semibold text-[#0f0f0e]">Delete your account?</p>
              <p className="text-xs text-[#5c5c58] leading-relaxed">
                This permanently deletes your account and all associated data. This action cannot be undone.
              </p>
              <div>
                <label className="block text-[10px] font-semibold text-[#9c9c98] uppercase tracking-wider mb-1.5">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2.5 bg-[#f8f8f6] border border-[#e8e8e4] rounded-[10px] text-sm focus:outline-none focus:border-[#ef4444] transition-colors"
                />
              </div>
              {deleteError && (
                <p className="text-xs text-[#ef4444]">{deleteError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteStep('idle'); setDeleteConfirmText(''); setDeleteError(null) }}
                  className="flex-1 py-2.5 text-sm text-[#5c5c58] border border-[#e8e8e4] rounded-full hover:bg-[#f8f8f6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE' || deleteStep === 'deleting'}
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-[#ef4444] rounded-full hover:bg-[#dc2626] transition-colors disabled:opacity-40"
                >
                  {deleteStep === 'deleting' ? 'Deleting…' : 'Delete Forever'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#9c9c98] pb-4">
          Ride Phuket · <span className="capitalize">{profile?.role?.replace('_', ' ') ?? 'rider'}</span> account
        </p>
      </div>
    </div>
  )
}
