import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Ban, CheckCircle2, Clock } from 'lucide-react'

import { compileFormula } from '@/lib/formula'
import { cn } from '@/lib/utils'
import { VisualFrame } from './frame'
import { formatValue } from './format'

const tones = {
  ok: { Icon: CheckCircle2, className: 'text-success' },
  attention: { Icon: AlertTriangle, className: 'text-warning' },
  blocked: { Icon: Ban, className: 'text-destructive' },
}

/* Simulador ------------------------------------------------------------ */

type SimInput = {
  id: string
  label: string
  kind: 'number' | 'choice'
  unit: string | null
  min: number | null
  max: number | null
  step: number | null
  initial: number
  options: { label: string; value: number }[] | null
}

export function Simulator({
  title,
  description,
  inputs,
  outputs,
  messages,
}: {
  title: string
  description: string | null
  inputs: SimInput[]
  outputs: { label: string; formula: string; unit: string | null }[]
  messages: { when: string; text: string; tone: keyof typeof tones }[] | null
}) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(inputs.map((i) => [i.id, i.initial])),
  )
  const compiled = useMemo(
    () => ({
      outputs: outputs.map((o) => ({ ...o, run: compileFormula(o.formula).run })),
      messages: (messages ?? []).map((m) => ({ ...m, test: compileFormula(m.when).run })),
    }),
    [outputs, messages],
  )
  const message = compiled.messages.find((m) => m.test(values))
  const set = (id: string, value: number) => setValues((v) => ({ ...v, [id]: value }))

  return (
    <VisualFrame title={title} description={description}>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {inputs.map((input) => (
            <div key={input.id}>
              <label htmlFor={`sim-${input.id}`} className="text-sm font-medium">
                {input.label}
              </label>
              {input.kind === 'choice' && input.options ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label={input.label}>
                  {input.options.map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      role="radio"
                      aria-checked={values[input.id] === option.value}
                      onClick={() => set(input.id, option.value)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-sm transition-colors',
                        values[input.id] === option.value ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-accent',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id={`sim-${input.id}`}
                    type="number"
                    inputMode="decimal"
                    value={Number.isFinite(values[input.id]) ? values[input.id] : ''}
                    min={input.min ?? undefined}
                    max={input.max ?? undefined}
                    step={input.step ?? 'any'}
                    onChange={(e) => set(input.id, e.target.value === '' ? NaN : Number(e.target.value))}
                    className="border-input focus-visible:ring-ring/50 h-9 w-32 rounded-md border bg-transparent px-3 text-sm tabular-nums outline-none focus-visible:ring-[3px]"
                  />
                  {input.unit && <span className="text-muted-foreground text-sm">{input.unit}</span>}
                </div>
              )}
              {input.kind === 'number' && input.min !== null && input.max !== null && (
                <input
                  type="range"
                  aria-label={`${input.label} (controle deslizante)`}
                  min={input.min}
                  max={input.max}
                  step={input.step ?? 1}
                  value={Number.isFinite(values[input.id]) ? values[input.id] : input.min}
                  onChange={(e) => set(input.id, Number(e.target.value))}
                  className="accent-primary mt-2 w-full"
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-muted/60 space-y-3 rounded-lg p-4" aria-live="polite">
          {compiled.outputs.map((output) => {
            const value = output.run(values)
            return (
              <div key={output.label}>
                <p className="text-muted-foreground text-xs font-medium">{output.label}</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums">
                  {Number.isFinite(value) ? formatValue(value, output.unit) : '—'}
                </p>
              </div>
            )
          })}
          {message && (
            <p className={cn('flex gap-2 border-t pt-3 text-sm', tones[message.tone].className)}>
              {(() => {
                const { Icon } = tones[message.tone]
                return <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
              })()}
              <span className="text-foreground">{message.text}</span>
            </p>
          )}
        </div>
      </div>
    </VisualFrame>
  )
}

/* Verificador de prazo ------------------------------------------------- */

// Valor para <input type="datetime-local"> no fuso da pessoa.
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function describeGap(hours: number) {
  const abs = Math.abs(hours)
  if (abs < 1) return `${Math.round(abs * 60)} minutos`
  if (abs < 48) return `${Math.floor(abs)} hora${Math.floor(abs) === 1 ? '' : 's'}`
  const days = Math.floor(abs / 24)
  return `${days} dias`
}

export function DeadlineCheck({
  title,
  rule,
  minHoursAhead,
  maxDaysAhead,
  okText,
  tooSoonText,
  tooLateText,
}: {
  title: string
  rule: string
  minHoursAhead: number
  maxDaysAhead: number | null
  okText: string
  tooSoonText: string
  tooLateText: string | null
}) {
  const [value, setValue] = useState(() => {
    const tomorrow = new Date(Date.now() + 24 * 3600_000)
    tomorrow.setHours(10, 0, 0, 0)
    return toLocalInput(tomorrow)
  })
  // Relógio que anda sozinho: "faltam X horas" continua certo com a página aberta
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])
  const target = new Date(value)
  const hours = (target.getTime() - now) / 3600_000
  const earliest = new Date(now + minHoursAhead * 3600_000)

  const status = !Number.isFinite(hours)
    ? null
    : hours < 0
      ? ({ tone: 'blocked', text: 'Essa data e hora já passaram.' } as const)
      : hours < minHoursAhead
        ? ({ tone: 'blocked', text: tooSoonText } as const)
        : maxDaysAhead !== null && hours > maxDaysAhead * 24
          ? ({ tone: 'attention', text: tooLateText ?? `Passa do limite de ${maxDaysAhead} dias.` } as const)
          : ({ tone: 'ok', text: okText } as const)

  return (
    <VisualFrame title={title}>
      <p className="text-sm">{rule}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <label htmlFor="deadline-input" className="text-sm font-medium">
            Quando você quer marcar?
          </label>
          <input
            id="deadline-input"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="border-input focus-visible:ring-ring/50 mt-1.5 block h-9 w-full max-w-60 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
          />
          <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <Clock className="size-3.5" aria-hidden />
            O mais cedo possível agora: {earliest.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>

        {status && (
          <div className="bg-muted/60 rounded-lg p-4" aria-live="polite">
            <p className="text-muted-foreground text-xs">
              {hours >= 0 ? `Faltam ${describeGap(hours)}` : `Foi há ${describeGap(hours)}`}
            </p>
            <p className={cn('mt-1 flex items-center gap-2 text-sm font-semibold', tones[status.tone].className)}>
              {(() => {
                const { Icon } = tones[status.tone]
                return <Icon className="size-5" aria-hidden />
              })()}
              {status.tone === 'ok' ? 'Pode marcar' : status.tone === 'attention' ? 'Atenção' : 'Não pode marcar'}
            </p>
            <p className="mt-1 text-sm">{status.text}</p>
          </div>
        )}
      </div>
    </VisualFrame>
  )
}
