import { useState } from 'react'
import { List, Workflow } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { VisualFrame } from './frame'
import { MermaidDiagram, type ThemeColors } from './mermaid'

// Texto seguro para rótulos do Mermaid (entidades no lugar de caracteres especiais).
function label(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/#/g, '#35;')
    .replace(/"/g, '#quot;')
    .replace(/</g, '#lt;')
    .replace(/>/g, '#gt;')
}

function ViewToggle({ list, onToggle }: { list: boolean; onToggle: () => void }) {
  const text = list ? 'Ver desenho' : 'Ver em lista'
  return (
    <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label={text} title={text}>
      {list ? <Workflow /> : <List />}
    </Button>
  )
}

type FlowNode = { id: string; label: string; kind: 'start' | 'step' | 'decision' | 'end' | 'legacy' | null }
type FlowEdge = { from: string; to: string; label: string | null }

function flowCode(
  { direction, nodes, edges }: { direction: 'TD' | 'LR' | null; nodes: FlowNode[]; edges: FlowEdge[] },
  c: ThemeColors,
) {
  const ids = new Map(nodes.map((n, i) => [n.id, `n${i}`]))
  const lines = [`flowchart ${direction ?? 'TD'}`]
  nodes.forEach((n, i) => {
    const text = `"${label(n.label)}"`
    const shape =
      n.kind === 'decision' ? `{${text}}` : n.kind === 'start' ? `([${text}])` : `(${text})`
    lines.push(`  n${i}${shape}`)
    // "end" é palavra reservada no Mermaid: as classes levam prefixo
    if (n.kind === 'start' || n.kind === 'end' || n.kind === 'legacy') lines.push(`  class n${i} k_${n.kind}`)
  })
  for (const e of edges) {
    const arrow = e.label ? `-->|"${label(e.label)}"|` : '-->'
    lines.push(`  ${ids.get(e.from)} ${arrow} ${ids.get(e.to)}`)
  }
  lines.push(
    `  classDef k_start fill:${c.muted},stroke:${c.primary},stroke-width:2px`,
    `  classDef k_end fill:${c.muted},stroke:${c.foreground},stroke-width:2.5px`,
    `  classDef k_legacy stroke-dasharray:4 3,color:${c.mutedForeground}`,
  )
  return lines.join('\n')
}

const kindText: Record<string, string> = {
  start: 'início',
  end: 'final',
  legacy: 'não é mais usado',
  decision: 'decisão',
}

export function Flow(props: {
  title: string
  description: string | null
  direction: 'TD' | 'LR' | null
  nodes: FlowNode[]
  edges: FlowEdge[]
}) {
  const [list, setList] = useState(false)
  const names = new Map(props.nodes.map((n) => [n.id, n.label]))

  return (
    <VisualFrame
      title={props.title}
      description={props.description}
      action={<ViewToggle list={list} onToggle={() => setList((v) => !v)} />}
    >
      {list ? (
        <ul className="space-y-3">
          {props.nodes.map((n) => {
            const out = props.edges.filter((e) => e.from === n.id)
            return (
              <li key={n.id} className="text-sm">
                <p className="font-medium">
                  {n.label}
                  {n.kind && kindText[n.kind] && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">({kindText[n.kind]})</span>
                  )}
                </p>
                {out.length > 0 ? (
                  <ul className="text-muted-foreground mt-1 space-y-0.5">
                    {out.map((e, i) => (
                      <li key={i}>
                        → {names.get(e.to)}
                        {e.label && <span> · {e.label}</span>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-1">Sem saídas.</p>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <MermaidDiagram
          label={`${props.title}. ${props.edges.map((e) => `${names.get(e.from)} para ${names.get(e.to)}`).join('; ')}`}
          build={(c) => flowCode(props, c)}
        />
      )}
    </VisualFrame>
  )
}

type SequenceMessage = { from: string; to: string; text: string; reply: boolean | null }

function sequenceCode({ participants, messages }: { participants: string[]; messages: SequenceMessage[] }) {
  const ids = new Map(participants.map((p, i) => [p, `p${i}`]))
  const lines = ['sequenceDiagram']
  participants.forEach((p, i) => lines.push(`  participant p${i} as ${label(p).replace(/[;:]/g, ' ')}`))
  for (const m of messages) {
    lines.push(`  ${ids.get(m.from)}${m.reply ? '-->>' : '->>'}${ids.get(m.to)}: ${label(m.text).replace(/;/g, ',')}`)
  }
  return lines.join('\n')
}

export function Sequence(props: {
  title: string
  description: string | null
  participants: string[]
  messages: SequenceMessage[]
}) {
  const [list, setList] = useState(false)

  return (
    <VisualFrame
      title={props.title}
      description={props.description}
      action={<ViewToggle list={list} onToggle={() => setList((v) => !v)} />}
    >
      {list ? (
        <ol className="space-y-2 text-sm">
          {props.messages.map((m, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-muted-foreground w-5 shrink-0 text-right tabular-nums">{i + 1}.</span>
              <span>
                <span className="font-medium">{m.from}</span> → <span className="font-medium">{m.to}</span>: {m.text}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <MermaidDiagram
          label={`${props.title}. ${props.messages.map((m) => `${m.from} para ${m.to}: ${m.text}`).join('; ')}`}
          build={() => sequenceCode(props)}
        />
      )}
    </VisualFrame>
  )
}
