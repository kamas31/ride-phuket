'use server'

import { getScooterById as _getById } from '@/lib/supabase/queries'
import type { Scooter } from '@/types'

export async function getScooterAction(id: string): Promise<Scooter | null> {
  return _getById(id)
}
