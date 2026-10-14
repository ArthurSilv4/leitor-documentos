import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, Quote as QuoteIcon } from 'lucide-react'

import { VisualFrame } from './frame'

const trendIcon = {
  up: ArrowUpRight,
  down: ArrowDownRight,
  neutral: ArrowRight,
}

export function Metric({
  label,
  value,
  detail,
  trend,
}: {
  label: string
  value: string
  detail: string | null
  trend: 'up' | 'down' | 'neutral' | null
}) {
  const Icon = trend ? trendIcon[trend] : null
  return (
    <VisualFrame>
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {detail && (
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
          {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
          {detail}
        </p>
      )}
    </VisualFrame>
  )
}

export function Timeline({
  title,
  items,
}: {
  title: string
  items: { date: string; title: string; description: string | null }[]
}) {
  return (
    <VisualFrame title={title}>
      <ol className="relative ml-1.5 border-l">
        {items.map((item, i) => (
          <li key={i} className="relative pb-4 pl-5 last:pb-0">
            <span className="bg-primary ring-card absolute top-1.5 -left-[5px] size-2.5 rounded-full ring-2" />
            <p className="text-muted-foreground text-xs font-medium tabular-nums">{item.date}</p>
            <p className="text-sm font-medium">{item.title}</p>
            {item.description && <p className="text-muted-foreground mt-0.5 text-sm">{item.description}</p>}
          </li>
        ))}
      </ol>
    </VisualFrame>
  )
}

export function KeyPoints({ title, points }: { title: string; points: string[] }) {
  return (
    <VisualFrame title={title}>
      <ul className="space-y-2">
        {points.map((point, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </VisualFrame>
  )
}

export function Steps({
  title,
  steps,
}: {
  title: string
  steps: { title: string; description: string | null }[]
}) {
  return (
    <VisualFrame title={title}>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums">
              {i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-medium">{step.title}</p>
              {step.description && <p className="text-muted-foreground mt-0.5 text-sm">{step.description}</p>}
            </div>
          </li>
        ))}
      </ol>
    </VisualFrame>
  )
}

export function Quote({ text, source }: { text: string; source: string | null }) {
  return (
    <VisualFrame>
      <figure className="flex gap-3">
        <QuoteIcon className="text-primary size-4 shrink-0" aria-hidden />
        <div>
          <blockquote className="font-serif text-[15px] leading-relaxed">{text}</blockquote>
          {source && <figcaption className="text-muted-foreground mt-2 text-xs">{source}</figcaption>}
        </div>
      </figure>
    </VisualFrame>
  )
}
