#!/usr/bin/env node
/**
 * Adds the 2 scooters missing from the initial seed (Wave 125 + Aerox 155)
 * Also adds the review rows linked to seeded scooters.
 * Safe to run multiple times (checks for existing records first).
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function run() {
  // Get shops we need
  const { data: shops } = await supabase.from('shops').select('id,name,slug')
  const rawai = shops.find(s => s.slug === 'rawai-scooter-co')
  if (!rawai) { console.error('❌ rawai-scooter-co shop not found — run migrate --seed first'); process.exit(1) }

  // Check which scooters already exist
  const { data: existing } = await supabase.from('scooters').select('name')
  const names = existing.map(s => s.name)

  const toInsert = []

  if (!names.includes('Honda Wave 125')) {
    toInsert.push({
      shop_id: rawai.id,
      name: 'Honda Wave 125',
      brand: 'Honda',
      model: 'Wave 125',
      year: 2022,
      category: 'manual',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&sat=-30',
               'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=800&q=80'],
      price_per_day: 180,
      price_per_week: 1050,
      price_per_month: 3500,
      location: 'Rawai',
      lat: 7.7781, lng: 98.3281,
      specs: { engine:'125cc', power:'8.4 hp', fuelCapacity:'4.6L', consumption:'55 km/L', weight:'102 kg', storage:'Rear rack' },
      features: ['Fuel efficient','Manual gears','Lightweight'],
      delivery_available: false,
      delivery_fee: 0,
      helmet_included: true,
      insurance_included: false,
      min_rental_days: 1,
      available: true,
      description: "The workhorse of Thailand. Manual transmission, ultra fuel-efficient, and virtually indestructible. Great for locals-style riding and tight budget adventures.",
    })
  }

  if (!names.includes('Yamaha Aerox 155')) {
    toInsert.push({
      shop_id: rawai.id,
      name: 'Yamaha Aerox 155',
      brand: 'Yamaha',
      model: 'Aerox 155',
      year: 2024,
      category: 'automatic',
      images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&q=80&hue=200',
               'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
      price_per_day: 420,
      price_per_week: 2600,
      price_per_month: 9000,
      location: 'Rawai',
      lat: 7.7795, lng: 98.3295,
      specs: { engine:'155cc', power:'14.8 hp', fuelCapacity:'5.5L', consumption:'37 km/L', weight:'126 kg', storage:'22L under seat' },
      features: ['Helmet included','ABS','Sport design','Y-Connect app','Smart key'],
      delivery_available: true,
      delivery_fee: 200,
      helmet_included: true,
      insurance_included: true,
      min_rental_days: 1,
      available: true,
      description: "Yamaha's sporty maxi-scooter. Aggressive looks, powerful 155cc engine, and full connectivity via the Y-Connect app. Perfect for riders who want performance and style.",
    })
  }

  if (toInsert.length === 0) {
    console.log('✅ All 6 scooters already in DB — nothing to insert.')
    return
  }

  const { data, error } = await supabase.from('scooters').insert(toInsert).select('id,name')
  if (error) { console.error('❌ Insert failed:', error.message); process.exit(1) }
  data.forEach(s => console.log(`✅ Added: ${s.name} (${s.id.slice(0,8)}...)`))

  // Verify final count
  const { count } = await supabase.from('scooters').select('*', { count: 'exact', head: true })
  console.log(`\n📊 Total scooters in DB: ${count}`)
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
