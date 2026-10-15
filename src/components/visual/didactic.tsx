import { Check, FileText, Lightbulb, Minus, Target, X } from 'lucide-react'

import { VisualFrame } from './frame'

const accessIcon = {
  yes: { Icon: Check, text: 'Pode', className: 'text-primary' },
  partial: { Icon: Minus, text: 'Em parte', className: 'text-foreground' },
  no: { Icon: X, text: 'Não pode', className: 'text-muted-foreground' },
}

export function PermissionMatrix({
  title,
  roles,
  actions,
}: {
  title: string
  roles: string[]
  actions: { action: string; access: ('yes' | 'no' | 'partial')[]; note: string | null }[]
}) {
  return (
    <VisualFrame title={title}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-muted-foreground py-2 pr-4 text-left text-xs font-medium">Ação</th>
              {roles.map((role) => (
                <th key={role} className="px-2 py-2 text-center text-xs font-medium">
                  {role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.action} className="border-b last:border-0">
                <td className="py-2 pr-4">
                  {a.action}
                  {a.note && <p className="text-muted-foreground text-xs">{a.note}</p>}
                </td>
                {a.access.map((value, i) => {
                  const { Icon, text, className } = accessIcon[value]
                  return (
                    <td key={i} className="px-2 py-2 text-center">
                      <Icon className={`mx-auto size-4 ${className}`} aria-hidden />
                      <span className="sr-only">
                        {roles[i]}: {text}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {Object.values(accessIcon).map(({ Icon, text, className }) => (
          <span key={text} className="flex items-center gap-1">
            <Icon className={`size-3.5 ${className}`} aria-hidden /> {text}
          </span>
        ))}
      </p>
    </VisualFrame>
  )
}

export function Glossary({
  title,
  terms,
}: {
  title: string
  terms: { term: string; aliases: string | null; definition: string }[]
}) {
  return (
    <VisualFrame title={title}>
      <dl className="divide-y">
        {terms.map((t) => (
          <div key={t.term} className="py-2.5 first:pt-0 last:pb-0 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-4">
            <dt className="text-sm font-medium">
              {t.term}
              {t.aliases && <span className="text-muted-foreground block text-xs font-normal">também: {t.aliases}</span>}
            </dt>
            <dd className="text-muted-foreground mt-0.5 text-sm sm:mt-0">{t.definition}</dd>
          </div>
        ))}
      </dl>
    </VisualFrame>
  )
}

export function Comparison({
  title,
  items,
}: {
  title: string
  items: { name: string; summary: string | null; points: string[] }[]
}) {
  return (
    <VisualFrame title={title}>
      <div className={`grid gap-3 ${items.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {items.map((item) => (
          <div key={item.name} className="bg-muted/50 min-w-0 rounded-lg p-3">
            <p className="text-sm font-semibold">{item.name}</p>
            {item.summary && <p className="text-muted-foreground mt-0.5 text-xs">{item.summary}</p>}
            <ul className="mt-2 space-y-1.5">
              {item.points.map((point, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="bg-muted-foreground mt-2 size-1 shrink-0 rounded-full" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </VisualFrame>
  )
}

export function Concept({
  term,
  definition,
  purpose,
  example,
  analogy,
}: {
  term: string
  definition: string
  purpose: string | null
  example: string | null
  analogy: string | null
}) {
  const rows = [
    { Icon: Target, label: 'Para que serve', text: purpose },
    { Icon: FileText, label: 'Exemplo', text: example },
  ].filter((r) => r.text)

  return (
    <VisualFrame>
      <p className="text-muted-foreground text-xs font-medium">O que é</p>
      <h3 className="mt-0.5 font-serif text-xl">{term}</h3>
      <p className="mt-1.5 text-sm leading-relaxed">{definition}</p>
      {analogy && (
        <div className="bg-primary/10 mt-3 flex gap-2.5 rounded-lg p-3">
          <Lightbulb className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">É como… </span>
            {analogy}
          </p>
        </div>
      )}
      {rows.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {rows.map(({ Icon, label, text }) => (
            <div key={label} className="flex gap-2.5">
              <Icon className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="min-w-0 text-sm">
                <span className="font-medium">{label}: </span>
                <span className="text-muted-foreground">{text}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </VisualFrame>
  )
}

export function FeatureMap({
  title,
  groups,
}: {
  title: string
  groups: { name: string; description: string | null; items: string[] }[]
}) {
  return (
    <VisualFrame title={title}>
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <div key={g.name} className="min-w-0 rounded-lg border p-3">
            <p className="text-sm font-semibold">{g.name}</p>
            {g.description && <p className="text-muted-foreground mt-0.5 text-xs">{g.description}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {g.items.map((item) => (
                <span key={item} className="bg-muted rounded-md px-2 py-0.5 text-xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </VisualFrame>
  )
}
