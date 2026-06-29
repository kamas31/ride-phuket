'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, ChevronRight, RotateCcw, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  recommendScooters,
  type QuizAnswers,
} from '@/lib/recommend-scooter'
import type { BudgetKey, ExperienceKey, PriorityKey, UsageKey } from '@/constants/scooter-categories'

interface ScooterQuizProps {
  /** slug -> live available scooter count, pre-fetched server-side. */
  modelCounts: Record<string, number>
}

interface Option<T> {
  value: T
  label: string
  hint?: string
}

const RIDERS_OPTIONS: Option<1 | 2>[] = [
  { value: 1, label: 'Just me', hint: 'Solo rider' },
  { value: 2, label: 'Me + a passenger', hint: 'Riding two-up' },
]

const EXPERIENCE_OPTIONS: Option<ExperienceKey>[] = [
  { value: 'beginner', label: 'Beginner', hint: 'New to scooters' },
  { value: 'some', label: 'Some experience', hint: "I've ridden before" },
  { value: 'experienced', label: 'Experienced', hint: 'Confident on two wheels' },
]

const USAGE_OPTIONS: Option<UsageKey>[] = [
  { value: 'city', label: 'City & errands' },
  { value: 'beach', label: 'Beach hopping' },
  { value: 'touring', label: 'Long day trips' },
  { value: 'hills', label: 'Mountain & hill roads' },
  { value: 'mixed', label: 'A mix of everything' },
]

const BUDGET_OPTIONS: Option<BudgetKey>[] = [
  { value: 'budget', label: 'Budget', hint: '~฿150–250/day' },
  { value: 'mid', label: 'Mid-range', hint: '~฿250–400/day' },
  { value: 'premium', label: 'Premium', hint: '฿400+/day' },
]

const PRIORITY_OPTIONS: Option<PriorityKey>[] = [
  { value: 'comfort', label: 'Comfort' },
  { value: 'storage', label: 'Storage' },
  { value: 'performance', label: 'Performance' },
  { value: 'fuelEconomy', label: 'Fuel economy' },
  { value: 'style', label: 'Style' },
]

const MAX_PRIORITIES = 3
const TOTAL_STEPS = 5

type PartialAnswers = {
  riders?: 1 | 2
  experience?: ExperienceKey
  usage?: UsageKey
  budget?: BudgetKey
  priorities: PriorityKey[]
}

const INITIAL_ANSWERS: PartialAnswers = { priorities: [] }

function OptionCard<T extends string | number>({
  option,
  selected,
  onSelect,
}: {
  option: Option<T>
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'w-full flex items-center justify-between gap-3 px-5 py-4 rounded-[14px] border text-left transition-all active:scale-[0.98]',
        selected
          ? 'bg-[#fff4f0] border-[#FF6B35]'
          : 'bg-white border-[#e8e8e4] hover:border-[#d0d0cc]',
      )}
    >
      <span>
        <span className={cn('block font-semibold text-[15px]', selected ? 'text-[#FF6B35]' : 'text-[#0f0f0e]')}>
          {option.label}
        </span>
        {option.hint && <span className="block text-xs text-[#9c9c98] mt-0.5">{option.hint}</span>}
      </span>
      <span
        className={cn(
          'w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0',
          selected ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-[#d0d0cc]',
        )}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </span>
    </button>
  )
}

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-7">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 flex-1 rounded-full transition-colors',
            i <= step ? 'bg-[#FF6B35]' : 'bg-[#e8e8e4]',
          )}
        />
      ))}
    </div>
  )
}

export function ScooterQuiz({ modelCounts }: ScooterQuizProps) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<PartialAnswers>(INITIAL_ANSWERS)
  const [submitted, setSubmitted] = useState(false)

  const computed = useMemo(() => {
    if (!submitted) return null
    const { riders, experience, usage, budget, priorities } = answers
    if (!riders || !experience || !usage || !budget || !priorities.length) return null
    const full: QuizAnswers = { riders, experience, usage, budget, priorities }
    const result = recommendScooters(full, modelCounts)
    if (!result) return null
    return { result, answers: full }
  }, [submitted, answers, modelCounts])

  function goNext() {
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function goBack() {
    setStep(s => Math.max(s - 1, 0))
  }

  function selectSingle<K extends keyof PartialAnswers>(key: K, value: NonNullable<PartialAnswers[K]>) {
    setAnswers(prev => ({ ...prev, [key]: value }))
    goNext()
  }

  function togglePriority(value: PriorityKey) {
    setAnswers(prev => {
      const has = prev.priorities.includes(value)
      if (has) return { ...prev, priorities: prev.priorities.filter(p => p !== value) }
      if (prev.priorities.length >= MAX_PRIORITIES) return prev
      return { ...prev, priorities: [...prev.priorities, value] }
    })
  }

  function reset() {
    setAnswers(INITIAL_ANSWERS)
    setSubmitted(false)
    setStep(0)
  }

  if (submitted && computed) {
    return (
      <ResultsView
        result={computed.result}
        answers={computed.answers}
        modelCounts={modelCounts}
        onReset={reset}
      />
    )
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-[24px] border border-[#e8e8e4] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)] p-6 md:p-8">
      <ProgressBar step={step} />

      {step === 0 && (
        <fieldset>
          <legend className="text-[20px] font-bold text-[#0f0f0e] mb-5">How many riders?</legend>
          <div className="space-y-2.5">
            {RIDERS_OPTIONS.map(opt => (
              <OptionCard
                key={opt.value}
                option={opt}
                selected={answers.riders === opt.value}
                onSelect={() => selectSingle('riders', opt.value)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <fieldset>
          <legend className="text-[20px] font-bold text-[#0f0f0e] mb-5">What&apos;s your riding experience?</legend>
          <div className="space-y-2.5">
            {EXPERIENCE_OPTIONS.map(opt => (
              <OptionCard
                key={opt.value}
                option={opt}
                selected={answers.experience === opt.value}
                onSelect={() => selectSingle('experience', opt.value)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {step === 2 && (
        <fieldset>
          <legend className="text-[20px] font-bold text-[#0f0f0e] mb-5">What will you mainly use it for?</legend>
          <div className="space-y-2.5">
            {USAGE_OPTIONS.map(opt => (
              <OptionCard
                key={opt.value}
                option={opt}
                selected={answers.usage === opt.value}
                onSelect={() => selectSingle('usage', opt.value)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset>
          <legend className="text-[20px] font-bold text-[#0f0f0e] mb-5">What&apos;s your budget?</legend>
          <div className="space-y-2.5">
            {BUDGET_OPTIONS.map(opt => (
              <OptionCard
                key={opt.value}
                option={opt}
                selected={answers.budget === opt.value}
                onSelect={() => selectSingle('budget', opt.value)}
              />
            ))}
          </div>
        </fieldset>
      )}

      {step === 4 && (
        <fieldset>
          <legend className="text-[20px] font-bold text-[#0f0f0e] mb-2">What matters most to you?</legend>
          <p className="text-sm text-[#9c9c98] mb-5">Pick up to {MAX_PRIORITIES}.</p>
          <div className="grid grid-cols-2 gap-2.5 mb-7">
            {PRIORITY_OPTIONS.map(opt => (
              <OptionCard
                key={opt.value}
                option={opt}
                selected={answers.priorities.includes(opt.value)}
                onSelect={() => togglePriority(opt.value)}
              />
            ))}
          </div>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={answers.priorities.length === 0}
            onClick={() => setSubmitted(true)}
          >
            See My Recommendation
            <ArrowRight className="w-5 h-5" />
          </Button>
        </fieldset>
      )}

      {step > 0 && (
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1.5 text-sm font-medium text-[#9c9c98] hover:text-[#0f0f0e] transition-colors mt-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}
    </div>
  )
}

// Builds "Recommended because you selected: ..." from the same option-label
// arrays the questionnaire itself renders — no second copy of label strings.
function describeAnswers(answers: QuizAnswers): string {
  const parts: string[] = []
  const experience = EXPERIENCE_OPTIONS.find(o => o.value === answers.experience)?.label
  const riders = RIDERS_OPTIONS.find(o => o.value === answers.riders)?.label
  const usage = USAGE_OPTIONS.find(o => o.value === answers.usage)?.label
  const priorities = answers.priorities
    .map(p => PRIORITY_OPTIONS.find(o => o.value === p)?.label)
    .filter((label): label is string => Boolean(label))

  if (experience) parts.push(experience)
  if (riders) parts.push(riders)
  parts.push(...priorities)
  if (usage) parts.push(usage)

  return parts.join(', ')
}

function ResultsView({
  result,
  answers,
  modelCounts,
  onReset,
}: {
  result: NonNullable<ReturnType<typeof recommendScooters>>
  answers: QuizAnswers
  modelCounts: Record<string, number>
  onReset: () => void
}) {
  const { best, alternates } = result

  return (
    <div className="max-w-3xl mx-auto">
      {/* Best match */}
      <div className="bg-white rounded-[24px] border-2 border-[#FF6B35] shadow-[0_8px_32px_-8px_rgba(255,107,53,0.25)] p-6 md:p-8 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF6B35] text-white text-xs font-bold rounded-full">
            <Star className="w-3.5 h-3.5 fill-white" />
            Best Match
          </span>
          {(modelCounts[best.model.slug] ?? 0) > 0 && (
            <span className="text-xs font-medium text-[#16a34a]">
              {modelCounts[best.model.slug]} available now
            </span>
          )}
        </div>
        <h3 className="text-[26px] md:text-[32px] font-bold text-[#0f0f0e] tracking-tight mb-2">
          {best.model.name}
        </h3>
        <p className="text-[#5c5c58] text-[15px] leading-relaxed mb-1.5 max-w-xl">
          {best.category.summary}
        </p>
        <p className="text-xs text-[#9c9c98] mb-5">
          Recommended because you selected: {describeAnswers(answers)}.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
          {best.model.whyChooseIt.slice(0, 4).map(reason => (
            <div key={reason} className="flex items-center gap-2.5 text-sm text-[#5c5c58]">
              <div className="w-5 h-5 bg-[#f0fdf4] rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-[#22c55e]" />
              </div>
              {reason}
            </div>
          ))}
        </div>
        <Link
          href={`/models/${best.model.slug}`}
          className="inline-flex items-center gap-2 px-7 py-4 bg-[#FF6B35] text-white font-bold rounded-full hover:bg-[#e85d29] transition-all shadow-lg text-[15px]"
        >
          See {best.model.label} Rentals
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Alternates */}
      {alternates.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {alternates.map(({ model, category }) => (
            <Link
              key={model.slug}
              href={`/models/${model.slug}`}
              className="group flex flex-col p-5 bg-[#f8f8f6] rounded-[16px] border border-[#e8e8e4] hover:border-[#FF6B35] hover:bg-[#fff4f0] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-[#0f0f0e] group-hover:text-[#FF6B35] transition-colors">{model.name}</p>
                <ChevronRight className="w-4 h-4 text-[#9c9c98] group-hover:text-[#FF6B35] transition-colors flex-shrink-0" />
              </div>
              <p className="text-xs text-[#9c9c98] mb-2">{category.summary}</p>
              {(modelCounts[model.slug] ?? 0) > 0 && (
                <p className="text-xs font-medium text-[#16a34a] mt-auto">
                  {modelCounts[model.slug]} available now
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-1.5 text-sm font-medium text-[#9c9c98] hover:text-[#0f0f0e] transition-colors mx-auto"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Retake the quiz
      </button>
    </div>
  )
}
