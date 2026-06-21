// Canonical brand → model → engine-size taxonomy for the partner/admin scooter forms.
// Writes already-clean values into the existing scooters.brand / scooters.model /
// scooters.specs.engine columns — no schema change, no migration (ADR pending).
//
// This list is intentionally broader than constants/models.ts (the SEO model pages).
// Picking a model here never creates or implies a /models/[slug] page — that stays a
// deliberate, hand-written addition. `seoSlug` only appears on the models that already
// have one, purely as a cross-reference.

export const OTHER = 'Other'

export interface EngineSizeOption {
  value: string   // canonical bare-number string, e.g. "160" — never "160cc"
  label: string   // display label, e.g. "160cc"
}

export interface ScooterModelOption {
  value: string             // canonical model code written to scooters.model
  label: string             // display label shown in the dropdown
  engineSizes: EngineSizeOption[]   // empty only for the brand's own "Other" entry
  defaultEngine?: string    // set only when exactly one real engine size exists
  seoSlug?: string          // present only when constants/models.ts already has this slug
}

export interface ScooterBrandOption {
  value: string              // canonical brand string written to scooters.brand
  label: string
  models: ScooterModelOption[]   // always ends with an "Other / Not listed" entry
}

function eng(value: string): EngineSizeOption {
  return { value, label: `${value}cc` }
}

function engines(...values: string[]): EngineSizeOption[] {
  return values.map(eng)
}

const OTHER_MODEL: ScooterModelOption = { value: OTHER, label: 'Other / Not listed', engineSizes: [] }

export const SCOOTER_BRANDS: ScooterBrandOption[] = [
  {
    value: 'Honda',
    label: 'Honda',
    models: [
      { value: 'PCX',          label: 'PCX',              engineSizes: engines('150', '160') },
      { value: 'ADV',          label: 'ADV',              engineSizes: engines('160', '350') },
      { value: 'XADV',         label: 'X-ADV',            engineSizes: engines('750'), defaultEngine: '750' },
      { value: 'FORZA',        label: 'Forza',            engineSizes: engines('300', '350') },
      { value: 'CLICK',        label: 'Click',            engineSizes: engines('125', '160') },
      { value: 'LEAD',         label: 'Lead',             engineSizes: engines('125'), defaultEngine: '125' },
      { value: 'SCOOPY',       label: 'Scoopy',           engineSizes: engines('110'), defaultEngine: '110' },
      { value: 'GIORNO',       label: 'Giorno+',          engineSizes: engines('110'), defaultEngine: '110' },
      { value: 'CB150R',       label: 'CB150R',           engineSizes: engines('150'), defaultEngine: '150' },
      { value: 'CB300R',       label: 'CB300R',           engineSizes: engines('300'), defaultEngine: '300' },
      { value: 'CB500X_NX500', label: 'CB500X / NX500',   engineSizes: engines('500'), defaultEngine: '500' },
      { value: 'REBEL300',     label: 'Rebel 300',        engineSizes: engines('300'), defaultEngine: '300' },
      { value: 'REBEL500',     label: 'Rebel 500',        engineSizes: engines('500'), defaultEngine: '500' },
      OTHER_MODEL,
    ],
  },
  {
    value: 'Yamaha',
    label: 'Yamaha',
    models: [
      { value: 'NMAX',         label: 'NMAX',             engineSizes: engines('155'), defaultEngine: '155' },
      { value: 'XMAX',         label: 'XMAX',             engineSizes: engines('300'), defaultEngine: '300' },
      { value: 'TMAX',         label: 'TMAX',             engineSizes: engines('530', '560') },
      { value: 'AEROX',        label: 'Aerox',            engineSizes: engines('155'), defaultEngine: '155' },
      { value: 'FAZZIO',       label: 'Fazzio',           engineSizes: engines('125'), defaultEngine: '125' },
      { value: 'GRAND_FILANO', label: 'Grand Filano',     engineSizes: engines('125'), defaultEngine: '125' },
      { value: 'MT03',         label: 'MT-03',            engineSizes: engines('321'), defaultEngine: '321' },
      { value: 'MT07',         label: 'MT-07',            engineSizes: engines('689'), defaultEngine: '689' },
      { value: 'YZF_R3',       label: 'YZF-R3',           engineSizes: engines('321'), defaultEngine: '321' },
      { value: 'TENERE700',    label: 'Ténéré 700',       engineSizes: engines('700'), defaultEngine: '700' },
      OTHER_MODEL,
    ],
  },
  {
    value: 'Kawasaki',
    label: 'Kawasaki',
    models: [
      { value: 'NINJA400',     label: 'Ninja 400',        engineSizes: engines('400'), defaultEngine: '400' },
      { value: 'NINJA650',     label: 'Ninja 650',        engineSizes: engines('650'), defaultEngine: '650' },
      { value: 'VERSYS300',    label: 'Versys-X 300',     engineSizes: engines('300'), defaultEngine: '300' },
      { value: 'VERSYS650',    label: 'Versys 650',       engineSizes: engines('650'), defaultEngine: '650' },
      OTHER_MODEL,
    ],
  },
  {
    value: 'Suzuki',
    label: 'Suzuki',
    models: [
      { value: 'BURGMAN200',   label: 'Burgman Street 200', engineSizes: engines('200'), defaultEngine: '200' },
      { value: 'ADDRESS110',   label: 'Address 110',        engineSizes: engines('110'), defaultEngine: '110' },
      OTHER_MODEL,
    ],
  },
  {
    value: 'Vespa',
    label: 'Vespa',
    models: [
      { value: 'PRIMAVERA',    label: 'Primavera',        engineSizes: engines('125', '150') },
      { value: 'SPRINT',       label: 'Sprint',           engineSizes: engines('125', '150') },
      { value: 'GTS',          label: 'GTS',              engineSizes: engines('300'), defaultEngine: '300' },
      OTHER_MODEL,
    ],
  },
  {
    value: 'BMW',
    label: 'BMW',
    models: [
      { value: 'GS310',        label: 'G 310 GS',         engineSizes: engines('310'), defaultEngine: '310' },
      { value: 'F750GS',       label: 'F 750 GS',         engineSizes: engines('750'), defaultEngine: '750' },
      OTHER_MODEL,
    ],
  },
  {
    value: 'Royal Enfield',
    label: 'Royal Enfield',
    models: [
      { value: 'HIMALAYAN',    label: 'Himalayan',        engineSizes: engines('411', '452') },
      { value: 'CLASSIC350',   label: 'Classic 350',      engineSizes: engines('349'), defaultEngine: '349' },
      { value: 'METEOR350',    label: 'Meteor 350',       engineSizes: engines('349'), defaultEngine: '349' },
      OTHER_MODEL,
    ],
  },
  {
    value: OTHER,
    label: 'Other',
    models: [],
  },
]

export function getBrand(value: string): ScooterBrandOption | undefined {
  return SCOOTER_BRANDS.find(b => b.value.toLowerCase() === value.toLowerCase())
}

export function getModel(brandValue: string, modelValue: string): ScooterModelOption | undefined {
  return getBrand(brandValue)?.models.find(m => m.value.toLowerCase() === modelValue.toLowerCase())
}

// "160cc" / "160 CC" / "160" all compare equal to canonical "160" — does not change
// what's stored, only what's matched against the taxonomy when resolving legacy rows.
export function normalizeEngineDigits(raw: string): string {
  return raw.trim().replace(/\s*cc$/i, '')
}

export interface ResolvedBrandModelEngine {
  brand: string
  brandCustom: string
  model: string
  modelCustom: string
  engine: string
  engineCustom: string
}

/**
 * Resolves an existing scooter's raw brand/model/engine strings against the taxonomy,
 * for pre-filling the edit form. Never throws, never drops data — anything unrecognized
 * resolves to the "Other" branch with the original raw value preserved in *Custom.
 */
export function resolveBrandModelEngine(
  rawBrand: string,
  rawModel: string,
  rawEngine: string
): ResolvedBrandModelEngine {
  const engineCustomFallback = rawEngine && rawEngine !== 'N/A' ? rawEngine : ''

  const brandOpt = getBrand(rawBrand)
  if (!brandOpt || brandOpt.value === OTHER) {
    return {
      brand: OTHER, brandCustom: rawBrand,
      model: OTHER, modelCustom: rawModel,
      engine: OTHER, engineCustom: engineCustomFallback,
    }
  }

  const modelOpt = brandOpt.models.find(m => m.value.toLowerCase() === rawModel.toLowerCase() && m.value !== OTHER)
  if (!modelOpt) {
    return {
      brand: brandOpt.value, brandCustom: '',
      model: OTHER, modelCustom: rawModel,
      engine: OTHER, engineCustom: engineCustomFallback,
    }
  }

  const normalizedEngine = normalizeEngineDigits(rawEngine)
  const engineOpt = modelOpt.engineSizes.find(e => e.value === normalizedEngine)
  if (!engineOpt) {
    return {
      brand: brandOpt.value, brandCustom: '',
      model: modelOpt.value, modelCustom: '',
      engine: OTHER, engineCustom: engineCustomFallback,
    }
  }

  return {
    brand: brandOpt.value, brandCustom: '',
    model: modelOpt.value, modelCustom: '',
    engine: engineOpt.value, engineCustom: '',
  }
}
