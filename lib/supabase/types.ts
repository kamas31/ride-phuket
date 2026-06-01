// Matches supabase/schema.sql exactly.
// Regenerate with: npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRole = 'rider' | 'shop_owner'
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'
export type DeliveryMethod = 'delivery' | 'pickup'
export type ScooterCategory = 'automatic' | 'manual' | 'electric'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          role: UserRole
          shop_id: string | null
          avatar_url: string | null
          phone: string | null
          nationality: string | null
          passport_number: string | null
          license_number: string | null
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          role?: UserRole
          shop_id?: string | null
          avatar_url?: string | null
          phone?: string | null
          nationality?: string | null
          passport_number?: string | null
          license_number?: string | null
          verified?: boolean
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      shops: {
        Row: {
          id: string
          owner_id: string | null
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          location: string
          address: string | null
          lat: number | null
          lng: number | null
          phone: string | null
          whatsapp: string | null
          verified: boolean
          active: boolean
          response_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          slug: string
          location: string
          owner_id?: string | null
          description?: string | null
          logo_url?: string | null
          address?: string | null
          lat?: number | null
          lng?: number | null
          phone?: string | null
          whatsapp?: string | null
          verified?: boolean
          active?: boolean
          response_time?: string | null
        }
        Update: Partial<Database['public']['Tables']['shops']['Insert']>
      }
      scooters: {
        Row: {
          id: string
          shop_id: string
          name: string
          brand: string
          model: string
          year: number | null
          category: ScooterCategory
          images: string[]
          cover_image: string | null
          price_per_day: number
          price_per_week: number | null
          price_per_month: number | null
          location: string | null
          lat: number | null
          lng: number | null
          specs: Json
          features: string[]
          delivery_available: boolean
          delivery_fee: number
          helmet_included: boolean
          insurance_included: boolean
          min_rental_days: number
          available: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          shop_id: string
          name: string
          brand: string
          model: string
          category: ScooterCategory
          price_per_day: number
          year?: number | null
          images?: string[]
          cover_image?: string | null
          price_per_week?: number | null
          price_per_month?: number | null
          location?: string | null
          lat?: number | null
          lng?: number | null
          specs?: Json
          features?: string[]
          delivery_available?: boolean
          delivery_fee?: number
          helmet_included?: boolean
          insurance_included?: boolean
          min_rental_days?: number
          available?: boolean
          description?: string | null
        }
        Update: Partial<Database['public']['Tables']['scooters']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          scooter_id: string
          shop_id: string
          status: BookingStatus
          start_date: string
          end_date: string
          total_days: number
          daily_rate: number
          delivery_fee: number
          total_amount: number
          delivery_method: DeliveryMethod
          delivery_address: string | null
          pickup_location: string | null
          payment_status: PaymentStatus
          payment_method: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          scooter_id: string
          shop_id: string
          start_date: string
          end_date: string
          daily_rate: number
          total_amount: number
          delivery_method: DeliveryMethod
          status?: BookingStatus
          delivery_fee?: number
          delivery_address?: string | null
          pickup_location?: string | null
          payment_status?: PaymentStatus
          payment_method?: string | null
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          booking_id: string | null
          scooter_id: string | null
          shop_id: string | null
          rating: number
          comment: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          rating: number
          booking_id?: string | null
          scooter_id?: string | null
          shop_id?: string | null
          comment?: string | null
          verified?: boolean
        }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      conversations: {
        Row: {
          id: string
          scooter_id: string | null
          shop_id: string | null
          client_id: string
          owner_id: string
          created_at: string
        }
        Insert: {
          scooter_id?: string | null
          shop_id?: string | null
          client_id: string
          owner_id: string
        }
        Update: Partial<Database['public']['Tables']['conversations']['Insert']>
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          conversation_id: string
          sender_id: string
          content: string
          read_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
      push_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          platform: 'ios' | 'android'
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          token: string
          platform: 'ios' | 'android'
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['push_tokens']['Insert']>
      }
      blocked_users: {
        Row: {
          id: string
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          blocker_id: string
          blocked_id: string
        }
        Update: Partial<Database['public']['Tables']['blocked_users']['Insert']>
      }
      message_reports: {
        Row: {
          id: string
          reporter_id: string
          conversation_id: string
          reason: 'spam' | 'scam' | 'harassment' | 'other'
          details: string | null
          created_at: string
        }
        Insert: {
          reporter_id: string
          conversation_id: string
          reason: 'spam' | 'scam' | 'harassment' | 'other'
          details?: string | null
        }
        Update: Partial<Database['public']['Tables']['message_reports']['Insert']>
      }
    }
  }
}
