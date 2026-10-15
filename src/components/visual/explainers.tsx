import { useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  CornerDownRight,
  FileText,
  HardHat,
  Info,
  KeyRound,
  Monitor,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Users,
  XCircle,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { VisualFrame } from './frame'

// Explicadores interativos para quem não é da área técnica.
// Estados sempre com ícone e texto, nunca só com cor.

/* Jornada guiada ------------------------------------------------------- */

type JourneyStep = { id: string; title: string; who: string | null; detail: string | null }
type Detour = { from: string; label: string; result: string }

export function Journey({
  title,
  description,
  steps,
  detours,
}: {
  title: string
  description: string | null
  steps: JourneyStep[]
  detours: Detour[] | null
}) {
  const [index, setIndex] = useState(0)
  const current = steps[index]
  const exits = (detours ?? []).filter((d) => d.from === current.id)
  const hasExits = (id: string) => (detours ?? []).some((d) => d.from === id)

  return (
    <VisualFrame title={title} description={description}>
      <ol
        className="relative flex flex-col gap-2 sm:grid sm:gap-0"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => {
          const state = i === index ? 'current' : i < index ? 'done' : 'next'
          return (
            <li key={step.id} className="relative">
              {/* linha entre as etapas */}
              {i > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-4 right-1/2 left-[-50%] hidden h-0.5 sm:block',
                    i <= index ? 'bg-primary/60' : 'bg-border',
                  )}
                />
              )}
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={state === 'current' ? 'step' : undefined}
                className="group relative flex w-full items-center gap-3 rounded-lg p-1 text-left sm:flex-col sm:gap-1.5 sm:text-center"
              >
                <span
                  className={cn(
                    'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ring-4 ring-[var(--card)] transition-colors',
                    state === 'current' && 'bg-primary text-primary-foreground',
                    state === 'done' && 'bg-card text-primary border-primary border-2',
                    state === 'next' && 'bg-muted text-muted-foreground group-hover:bg-accent',
                  )}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className={cn('block text-xs leading-tight', state === 'current' ? 'font-semibold' : 'font-medium')}>
                    {step.title}
                  </span>
                  {hasExits(step.id) && (
                    <span className="text-muted-foreground mt-0.5 block text-[11px]">tem "e se…?"</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="bg-muted/60 mt-4 rounded-lg p-4" aria-live="polite">
        <p className="text-muted-foreground text-xs">
          Etapa {index + 1} de {steps.length}
          {current.who && <> · quem faz: <span className="text-foreground font-medium">{current.who}</span></>}
        </p>
        <p className="mt-1 text-base font-semibold">{current.title}</p>
        {current.detail && <p className="mt-1 text-sm leading-relaxed">{current.detail}</p>}

        {exits.length > 0 && (
          <div className="mt-3 space-y-2 border-t pt-3">
            <p className="text-xs font-medium">E se…?</p>
            {exits.map((exit, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <CornerDownRight className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                <p>
                  <span className="font-medium">{exit.label}</span>
                  <span className="text-muted-foreground"> → {exit.result}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-between gap-2">
          <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => setIndex(index - 1)}>
            <ArrowLeft /> Anterior
          </Button>
          <Button variant="ghost" size="sm" disabled={index === steps.length - 1} onClick={() => setIndex(index + 1)}>
            Próxima <ArrowRight />
          </Button>
        </div>
      </div>
    </VisualFrame>
  )
}

/* Guia "E se…?" -------------------------------------------------------- */

type GuideNode = {
  id: string
  question: string | null
  options: { label: string; next: string }[] | null
  answer: string | null
  tone: 'ok' | 'attention' | 'blocked' | null
}

const tones = {
  ok: { Icon: CheckCircle2, label: 'Pode seguir', className: 'text-success' },
  attention: { Icon: AlertTriangle, label: 'Atenção', className: 'text-warning' },
  blocked: { Icon: Ban, label: 'Não é possível', className: 'text-destructive' },
}

export function DecisionGuide({ title, start, nodes }: { title: string; start: string; nodes: GuideNode[] }) {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const [path, setPath] = useState<{ id: string; choice?: string }[]>([{ id: start }])
  const current = byId.get(path[path.length - 1].id)!
  const tone = tones[current.tone ?? 'ok']

  function choose(label: string, next: string) {
    setPath((p) => [...p.slice(0, -1), { ...p[p.length - 1], choice: label }, { id: next }])
  }

  return (
    <VisualFrame title={title}>
      {path.length > 1 && (
        <ol className="mb-3 flex flex-wrap gap-1.5">
          {path.slice(0, -1).map((step, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setPath((p) => [...p.slice(0, i), { id: p[i].id }])}
                className="bg-muted hover:bg-accent rounded-full px-2.5 py-1 text-xs"
                title="Voltar para esta pergunta"
              >
                {step.choice}
              </button>
            </li>
          ))}
        </ol>
      )}

      {current.options && current.question ? (
        <div aria-live="polite">
          <p className="text-base font-medium">{current.question}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {current.options.map((option) => (
              <Button
                key={option.label}
                variant="outline"
                className="h-auto justify-start py-2.5 text-left whitespace-normal"
                onClick={() => choose(option.label, option.next)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-muted/60 rounded-lg p-4" aria-live="polite">
          <p className={cn('flex items-center gap-2 text-sm font-semibold', tone.className)}>
            <tone.Icon className="size-5" aria-hidden />
            {tone.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed">{current.answer}</p>
        </div>
      )}

      {path.length > 1 && (
        <Button variant="ghost" size="sm" className="mt-3 -ml-2" onClick={() => setPath([{ id: start }])}>
          <RotateCcw /> Recomeçar
        </Button>
      )}
    </VisualFrame>
  )
}

/* Quem faz o quê ------------------------------------------------------- */

const roleIcons = {
  pessoa: User,
  autoridade: ShieldCheck,
  empresa: Building2,
  operador: HardHat,
  externo: Users,
  sistema: Monitor,
  celular: Smartphone,
}

type Role = {
  name: string
  icon: keyof typeof roleIcons | null
  summary: string | null
  can: string[]
  cannot: string[] | null
}

export function RoleExplorer({ title, roles }: { title: string; roles: Role[] }) {
  const [selected, setSelected] = useState(0)
  const role = roles[selected]

  return (
    <VisualFrame title={title}>
      <div className="flex flex-wrap gap-2" role="tablist">
        {roles.map((r, i) => {
          const Icon = roleIcons[r.icon ?? 'pessoa']
          return (
            <button
              key={r.name}
              type="button"
              role="tab"
              aria-selected={i === selected}
              onClick={() => setSelected(i)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                i === selected ? 'border-primary bg-primary/10 font-medium' : 'hover:bg-accent',
              )}
            >
              <Icon className={cn('size-4', i === selected ? 'text-primary' : 'text-muted-foreground')} aria-hidden />
              {r.name}
            </button>
          )
        })}
      </div>

      <div className="mt-4" role="tabpanel" aria-live="polite">
        {role.summary && <p className="text-muted-foreground mb-3 text-sm">{role.summary}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-muted/60 rounded-lg p-3">
            <p className="text-success flex items-center gap-1.5 text-sm font-semibold">
              <CheckCircle2 className="size-4" aria-hidden /> Pode
            </p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {role.can.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          {role.cannot && role.cannot.length > 0 && (
            <div className="bg-muted/60 rounded-lg p-3">
              <p className="text-destructive flex items-center gap-1.5 text-sm font-semibold">
                <XCircle className="size-4" aria-hidden /> Não pode
              </p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {role.cannot.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </VisualFrame>
  )
}

/* O que acontece quando… ---------------------------------------------- */

const effectIcons = {
  status: { Icon: RefreshCw, label: 'Situação' },
  aviso: { Icon: Bell, label: 'Aviso' },
  registro: { Icon: FileText, label: 'Registro' },
  acesso: { Icon: KeyRound, label: 'Acesso' },
  prazo: { Icon: Clock, label: 'Prazo' },
  outro: { Icon: Sparkles, label: 'Também' },
}

export function ActionEffect({
  actor,
  action,
  effects,
  note,
}: {
  actor: string | null
  action: string
  effects: { kind: keyof typeof effectIcons; text: string }[]
  note: string | null
}) {
  return (
    <VisualFrame>
      <p className="flex items-start gap-2.5">
        <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
          <Zap className="size-4" aria-hidden />
        </span>
        <span className="pt-1 text-base">
          Quando {actor && <span className="font-semibold">{actor}</span>} <span className="font-semibold">{action}</span>…
        </span>
      </p>

      <ol className="mt-3 ml-4 space-y-3 border-l-2 border-dashed pl-6">
        {effects.map((effect, i) => {
          const { Icon, label } = effectIcons[effect.kind]
          return (
            <li key={i} className="relative">
              <span className="bg-card text-primary absolute top-0 -left-[37px] flex size-6 items-center justify-center rounded-full border">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <p className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">{label}</p>
              <p className="text-sm">{effect.text}</p>
            </li>
          )
        })}
      </ol>

      {note && (
        <p className="text-muted-foreground mt-4 flex gap-2 border-t pt-3 text-xs">
          <Info className="size-3.5 shrink-0" aria-hidden /> {note}
        </p>
      )}
    </VisualFrame>
  )
}

/* Regra com exemplos --------------------------------------------------- */

export function RuleExamples({
  rule,
  why,
  examples,
}: {
  rule: string
  why: string | null
  examples: { situation: string; allowed: boolean; explanation: string | null }[]
}) {
  return (
    <VisualFrame>
      <p className="text-muted-foreground text-xs font-medium">Regra</p>
      <p className="mt-0.5 font-serif text-lg leading-snug">{rule}</p>
      {why && <p className="text-muted-foreground mt-1 text-sm">Por quê: {why}</p>}

      <p className="mt-4 mb-2 text-xs font-medium">Na prática</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {examples.map((example, i) => {
          const Icon = example.allowed ? CheckCircle2 : XCircle
          return (
            <div key={i} className="bg-muted/60 flex gap-2.5 rounded-lg p-3">
              <Icon
                className={cn('mt-0.5 size-5 shrink-0', example.allowed ? 'text-success' : 'text-destructive')}
                aria-hidden
              />
              <div className="min-w-0 text-sm">
                <p>
                  <span className={cn('font-semibold', example.allowed ? 'text-success' : 'text-destructive')}>
                    {example.allowed ? 'Pode: ' : 'Não pode: '}
                  </span>
                  {example.situation}
                </p>
                {example.explanation && <p className="text-muted-foreground mt-1">{example.explanation}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </VisualFrame>
  )
}

/* Mapa da tela --------------------------------------------------------- */

type Area = 'topo' | 'esquerda' | 'centro' | 'direita' | 'rodape'

export function ScreenMap({
  title,
  regions,
}: {
  title: string
  regions: { label: string; area: Area; description: string }[]
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const has = (area: Area) => regions.some((r) => r.area === area)
  const left = has('esquerda')
  const right = has('direita')
  const columns = [left && 'esquerda', 'centro', right && 'direita'].filter(Boolean) as string[]
  const template = [
    has('topo') && `"${columns.map(() => 'topo').join(' ')}"`,
    `"${columns.join(' ')}"`,
    has('rodape') && `"${columns.map(() => 'rodape').join(' ')}"`,
  ]
    .filter(Boolean)
    .join(' ')

  const areas: Area[] = ['topo', 'esquerda', 'centro', 'direita', 'rodape']

  return (
    <VisualFrame title={title}>
      <div
        className="bg-muted/60 grid gap-2 rounded-lg border p-2"
        style={{
          gridTemplateAreas: template,
          gridTemplateColumns: columns.map((c) => (c === 'centro' ? 'minmax(0, 3fr)' : 'minmax(0, 1fr)')).join(' '),
        }}
        aria-hidden
      >
        {areas
          .filter(has)
          .map((area) => (
            <div
              key={area}
              style={{ gridArea: area }}
              className={cn(
                'bg-card flex flex-wrap content-start gap-1.5 rounded-md border border-dashed p-2',
                area === 'centro' && 'min-h-28',
              )}
            >
              {regions.map((region, i) =>
                region.area === area ? (
                  <button
                    key={i}
                    type="button"
                    tabIndex={-1}
                    onClick={() => setSelected(i)}
                    onMouseEnter={() => setSelected(i)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs transition-colors',
                      selected === i ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent',
                    )}
                  >
                    <span className="font-semibold tabular-nums">{i + 1}</span>
                    <span className="truncate">{region.label}</span>
                  </button>
                ) : null,
              )}
            </div>
          ))}
      </div>

      <ol className="mt-3 space-y-1">
        {regions.map((region, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setSelected(i)}
              onMouseEnter={() => setSelected(i)}
              className={cn(
                'flex w-full gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                selected === i ? 'bg-primary/10' : 'hover:bg-accent/60',
              )}
            >
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
                  selected === i ? 'bg-primary text-primary-foreground' : 'bg-muted',
                )}
              >
                {i + 1}
              </span>
              <span>
                <span className="font-medium">{region.label}:</span>{' '}
                <span className="text-muted-foreground">{region.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </VisualFrame>
  )
}

/* Teste rápido --------------------------------------------------------- */

type QuizQuestion = { question: string; options: string[]; correct: number; explanation: string }

export function Quiz({ title, questions }: { title: string | null; questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const answered = answers.filter((a) => a !== null).length
  const score = answers.filter((a, i) => a === questions[i].correct).length

  return (
    <VisualFrame title={title ?? 'Teste seu entendimento'}>
      <div className="space-y-5">
        {questions.map((q, qi) => {
          const chosen = answers[qi]
          return (
            <fieldset key={qi}>
              <legend className="text-sm font-medium">
                {questions.length > 1 && <span className="text-muted-foreground mr-1 tabular-nums">{qi + 1}.</span>}
                {q.question}
              </legend>
              <div className="mt-2 grid gap-1.5">
                {q.options.map((option, oi) => {
                  const isCorrect = oi === q.correct
                  const show = chosen !== null
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={show}
                      onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                      className={cn(
                        'flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                        !show && 'hover:bg-accent',
                        show && isCorrect && 'border-success bg-success/10',
                        show && chosen === oi && !isCorrect && 'border-destructive bg-destructive/10',
                        show && !isCorrect && chosen !== oi && 'opacity-60',
                      )}
                    >
                      {show && isCorrect && <CheckCircle2 className="text-success size-4 shrink-0" aria-label="Certa" />}
                      {show && chosen === oi && !isCorrect && (
                        <XCircle className="text-destructive size-4 shrink-0" aria-label="Errada" />
                      )}
                      {option}
                    </button>
                  )
                })}
              </div>
              {chosen !== null && (
                <p className="text-muted-foreground mt-2 text-sm" aria-live="polite">
                  <span className={cn('font-medium', chosen === q.correct ? 'text-success' : 'text-destructive')}>
                    {chosen === q.correct ? 'Isso mesmo! ' : 'Quase. '}
                  </span>
                  {q.explanation}
                </p>
              )}
            </fieldset>
          )
        })}
      </div>

      {answered === questions.length && questions.length > 1 && (
        <div className="mt-4 flex items-center justify-between border-t pt-3 text-sm">
          <span>
            Você acertou <span className="font-semibold tabular-nums">{score}</span> de {questions.length}.
          </span>
          <Button variant="ghost" size="sm" onClick={() => setAnswers(questions.map(() => null))}>
            <RotateCcw /> Refazer
          </Button>
        </div>
      )}
    </VisualFrame>
  )
}
