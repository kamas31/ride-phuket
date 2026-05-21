'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User, Shield, BookOpen, Star, Bell, Globe, LogOut,
  ChevronRight, Check, Camera, Phone, Mail, LayoutDashboard
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile } from '@/app/actions/profile'
import { getInitials, formatPrice } from '@/lib/utils'
import type { Profile } from '@/hooks/useProfile'

interface ProfileClientProps {
  user: { id: string; email: string; created_at: string }
  profile: Profile | null
}

export default function ProfileClient({ user, profile }: ProfileClientProps) {
  const { signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
      title: 'Rentals',
      items: [
        { icon: BookOpen, label: 'My Bookings', href: '/bookings', badge: null },
        { icon: Star, label: 'My Reviews', href: '#', badge: null },
      ]
    },
    {
      title: 'Account',
      items: [
        { icon: Bell, label: 'Notifications', href: '#', badge: null },
        { icon: Globe, label: 'Language & Currency', href: '#', badge: 'EN · THB' },
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

  return (
    <div className="min-h-screen bg-[#f8f8f6]">
      {/* Header */}
      <div className="bg-white border-b border-[#e8e8e4]">
        <div className="max-w-xl mx-auto px-4 pt-20 pb-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-[#ff9a5c] rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {getInitials(profile?.name ?? user.email)}
              </div>
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-[#e8e8e4] rounded-full flex items-center justify-center shadow-sm hover:bg-[#f8f8f6] transition-colors">
                <Camera className="w-3.5 h-3.5 text-[#5c5c58]" />
              </button>
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
        ) : (
          <div className="flex items-center justify-between gap-4 px-5 py-4 bg-[#fffbeb] border border-[#f59e0b]/20 rounded-[20px]">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#f59e0b]" />
              <div>
                <p className="font-bold text-[#92400e] text-sm">Get Verified</p>
                <p className="text-xs text-[#92400e]/70">Upload ID to unlock all features</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-[#f59e0b] text-white text-xs font-bold rounded-full hover:bg-[#d97706] transition-colors flex-shrink-0">
              Verify
            </button>
          </div>
        )}

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

        <p className="text-center text-xs text-[#9c9c98] pb-4">
          Ride Phuket · <span className="capitalize">{profile?.role?.replace('_', ' ') ?? 'rider'}</span> account
        </p>
      </div>
    </div>
  )
}
