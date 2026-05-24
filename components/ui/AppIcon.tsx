// Centralized icon registry — all product icons go through here.
// Using strokeWidth 1.5 for a premium, lighter feel vs Lucide default 2.
// When switching icon libraries, update this file only.

import {
  Phone, MessageCircle, Mail, WholeWord,
  MapPin, Navigation, Map,
  Bike, Truck, Car,
  Shield, ShieldCheck, Lock, Unlock, Eye, EyeOff,
  Check, CheckCircle2, X, XCircle,
  Star, Sparkles, Zap, Flame,
  Clock, Calendar, Timer,
  User, Users, Store, Building2,
  Camera, Image, Upload, Download,
  Settings, SlidersHorizontal, Filter,
  Search, Bell, Info, AlertCircle, HelpCircle,
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Plus, Minus, Edit, Trash2, Copy,
  Heart, Bookmark, Share2,
  TrendingUp, TrendingDown, BarChart2,
  CreditCard, HardHat, IdCard, Fingerprint,
  Globe, ExternalLink, Link2,
  Sun, Moon, Wind,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Registry ──────────────────────────────────────────────────
export const ICON_REGISTRY = {
  // Communication
  phone:          Phone,
  whatsapp:       MessageCircle,
  mail:           Mail,
  message:        MessageCircle,

  // Location
  pin:            MapPin,
  navigation:     Navigation,
  map:            Map,

  // Vehicles
  bike:           Bike,
  truck:          Truck,
  car:            Car,

  // Trust & safety
  shield:         Shield,
  shield_check:   ShieldCheck,
  lock:           Lock,
  unlock:         Unlock,
  eye:            Eye,
  eye_off:        EyeOff,
  no_passport:    IdCard,
  helmet:         HardHat,
  fingerprint:    Fingerprint,

  // Status
  check:          Check,
  check_circle:   CheckCircle2,
  close:          X,
  close_circle:   XCircle,

  // Highlight
  star:           Star,
  sparkles:       Sparkles,
  zap:            Zap,
  flame:          Flame,

  // Time
  clock:          Clock,
  calendar:       Calendar,
  timer:          Timer,

  // People & places
  user:           User,
  users:          Users,
  shop:           Store,
  building:       Building2,

  // Media
  camera:         Camera,
  image:          Image,
  upload:         Upload,
  download:       Download,

  // Controls
  settings:       Settings,
  filters:        SlidersHorizontal,
  filter:         Filter,
  search:         Search,
  bell:           Bell,

  // Info
  info:           Info,
  alert:          AlertCircle,
  help:           HelpCircle,

  // Navigation
  chevron_right:  ChevronRight,
  chevron_left:   ChevronLeft,
  chevron_down:   ChevronDown,
  chevron_up:     ChevronUp,
  arrow_right:    ArrowRight,
  arrow_left:     ArrowLeft,
  arrow_up:       ArrowUp,
  arrow_down:     ArrowDown,

  // Actions
  plus:           Plus,
  minus:          Minus,
  edit:           Edit,
  delete:         Trash2,
  copy:           Copy,

  // Social
  heart:          Heart,
  bookmark:       Bookmark,
  share:          Share2,

  // Analytics
  trending_up:    TrendingUp,
  trending_down:  TrendingDown,
  chart:          BarChart2,

  // Payment
  card:           CreditCard,

  // Web
  globe:          Globe,
  external:       ExternalLink,
  link:           Link2,

  // Misc
  sun:            Sun,
  moon:           Moon,
  wind:           Wind,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICON_REGISTRY

// ── Size tokens ───────────────────────────────────────────────
const SIZE: Record<'xs' | 'sm' | 'md' | 'lg', number> = {
  xs:  12,
  sm:  16,
  md:  20,
  lg:  24,
}

// ── Color tokens ──────────────────────────────────────────────
const COLOR: Record<'muted' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'inherit', string> = {
  muted:   'text-[#9c9c98]',
  primary: 'text-[#0f0f0e]',
  accent:  'text-[#FF6B35]',
  success: 'text-[#22c55e]',
  warning: 'text-[#f59e0b]',
  error:   'text-[#ef4444]',
  inherit: '',
}

// ── Component ─────────────────────────────────────────────────
interface AppIconProps {
  name: IconName
  size?: keyof typeof SIZE
  color?: keyof typeof COLOR
  strokeWidth?: number
  className?: string
  'aria-hidden'?: boolean
}

export function AppIcon({
  name,
  size = 'sm',
  color = 'inherit',
  strokeWidth = 1.5,
  className,
  'aria-hidden': ariaHidden = true,
}: AppIconProps) {
  const Icon = ICON_REGISTRY[name]
  const px = SIZE[size]

  return (
    <Icon
      width={px}
      height={px}
      strokeWidth={strokeWidth}
      aria-hidden={ariaHidden}
      className={cn(COLOR[color], className)}
    />
  )
}
