// Real "most popular" locations/models for the footer — ranked by live scooter
// count, never a hand-picked list. The footer renders on EVERY page (root
// layout), so this is wrapped in unstable_cache with a real revalidate window
// rather than querying Supabase fresh on every single page view site-wide.

import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { normalizeScooter } from '@/lib/normalize/normalize-scooter'
import { AREAS } from '@/constants/areas'
import { MODELS } from '@/constants/models'

export interface FooterAreaStat { slug: string; label: string; count: number }
export interface FooterModelStat { slug: string; name: string; count: number }

// A plain, stateless (no cookies()) anon-key client — deliberately NOT the
// session-aware lib/supabase/server.ts client. unstable_cache forbids reading
// Dynamic APIs like cookies() inside the cached function (real error, hit
// during testing: "Route /faq used cookies() inside a function cached with
// unstable_cache()"). Footer stats are public aggregate data anyway, the
// same for every visitor regardless of session, so an anon client — same
// RLS-scoped read any anonymous visitor already gets — is the correct tool,
// not a workaround.
//
// Defensive on purpose: `next build` runs static generation across 5 parallel
// Turbopack workers, and a real, live-observed failure (2026-07-26,
// "Error: supabaseKey is required" thrown from THIS function, taking down the
// entire build) is consistent with env vars not yet being available to every
// worker at cold-cache evaluation time. This function used to assert both env
// vars non-null and let the Supabase client throw straight into the cached
// function with nothing to catch it. Now it degrades to an empty stats result
// (Footer already renders fine with 0 areas/models — see .map() calls, no
// crash on empty arrays) instead of ever throwing past this boundary, mirroring
// how lib/supabase/queries.ts's getScooters() already treats "not configured"
// as [] rather than a thrown error.
async function fetchAvailableScooters() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return []
  try {
    const supabase = createClient(url, key)
    const { data, error } = await supabase.from('scooters').select('*, shops(*)').eq('available', true)
    if (error || !data) return []
    return data.map(normalizeScooter)
  } catch {
    // Never let a transient/build-time client error escape this boundary —
    // this function runs inside unstable_cache, on every page, via the root
    // layout; an uncaught throw here takes down unrelated pages' builds.
    return []
  }
}

async function computeFooterStats(): Promise<{ areas: FooterAreaStat[]; models: FooterModelStat[] }> {
  const scooters = await fetchAvailableScooters()

  const areas = AREAS
    .map(area => ({
      slug: area.slug,
      label: area.label,
      count: scooters.filter(s => s.location.toLowerCase().includes(area.name.toLowerCase())).length,
    }))
    .filter(a => a.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const models = MODELS
    .map(model => ({
      slug: model.slug,
      name: model.name,
      // Exact match, no substring — mirrors getScooters({ model }) itself
      // (an ilike wildcard here would let "ADV" wrongly also count "XADV" rows).
      count: scooters.filter(s => s.model.toLowerCase() === model.modelQuery.toLowerCase()).length,
    }))
    .filter(m => m.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return { areas, models }
}

/** Cached 10 minutes — a popularity ranking doesn't need per-request freshness. */
export const getFooterStats = unstable_cache(computeFooterStats, ['footer-stats'], { revalidate: 600 })
