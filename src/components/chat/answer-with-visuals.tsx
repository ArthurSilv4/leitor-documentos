import type { Spec } from '@json-render/core'

import { Markdown } from './markdown'
import { VisualBlock } from './visual-block'

type Part = { type: 'text'; text: string } | { type: 'visual'; id: string }

// Separa o texto nos marcadores [[visual:id]]. Um marcador ainda
// incompleto no fim (durante o streaming) não aparece.
function splitAnswer(content: string): Part[] {
  const cleaned = content.replace(/\[\[[^\]\n]*\]?$/, '')
  const pieces = cleaned.split(/\[\[visual:([\w-]+)\]\]/)
  return pieces
    .map((piece, i): Part => (i % 2 ? { type: 'visual', id: piece } : { type: 'text', text: piece }))
    .filter((part) => part.type === 'visual' || part.text.trim())
}

export function AnswerWithVisuals({
  content,
  spec,
  isStreaming,
}: {
  content: string
  spec: Spec
  isStreaming: boolean
}) {
  const units = spec.elements[spec.root]?.children ?? []
  const placed = new Set<string>()
  const parts = splitAnswer(content)

  const rendered = parts.map((part, i) => {
    if (part.type === 'text') return <Markdown key={i} isStreaming={isStreaming}>{part.text}</Markdown>
    // Só visuais de primeiro nível, cada um uma vez
    if (!units.includes(part.id) || placed.has(part.id)) return null
    placed.add(part.id)
    return (
      <div key={i} className="my-5">
        <VisualBlock spec={spec} id={part.id} />
      </div>
    )
  })

  // O que o texto não posicionou entra no fim, quando a resposta termina.
  const remaining = isStreaming ? [] : units.filter((id) => !placed.has(id))

  return (
    <div>
      {rendered}
      {remaining.length > 0 && (
        <div className="mt-5 space-y-4">
          {remaining.map((id) => (
            <VisualBlock key={id} spec={spec} id={id} />
          ))}
        </div>
      )}
    </div>
  )
}
