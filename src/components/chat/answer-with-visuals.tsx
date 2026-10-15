import type { Spec } from '@json-render/core'

import { splitBlocks } from '@/lib/answer-format'
import { Markdown } from './markdown'
import { VisualBlock } from './visual-block'

function Visual({ spec, id }: { spec: Spec; id: string }) {
  return (
    <div className="my-5">
      <VisualBlock spec={spec} id={id} />
    </div>
  )
}

// Respostas salvas antes desta versão marcavam a posição no texto: [[visual:id]].
function LegacyMarkers({ content, spec, units }: { content: string; spec: Spec; units: string[] }) {
  const placed = new Set<string>()
  const pieces = content.split(/\[\[visual:([\w-]+)\]\]/)
  return (
    <div>
      {pieces.map((piece, i) => {
        if (i % 2 === 0) return piece.trim() ? <Markdown key={i}>{piece}</Markdown> : null
        if (!units.includes(piece) || placed.has(piece)) return null
        placed.add(piece)
        return <Visual key={i} spec={spec} id={piece} />
      })}
      {units
        .filter((id) => !placed.has(id))
        .map((id) => (
          <Visual key={id} spec={spec} id={id} />
        ))}
    </div>
  )
}

// Os visuais aparecem no fim assim que ficam prontos. Quando chegam as
// posições (anchors), cada um vai para depois do trecho escolhido.
export function AnswerWithVisuals({
  content,
  spec,
  anchors,
  isStreaming,
}: {
  content: string
  spec: Spec
  anchors?: Record<string, number>
  isStreaming: boolean
}) {
  const units = spec.elements[spec.root]?.children ?? []
  if (/\[\[visual:[\w-]+\]\]/.test(content)) return <LegacyMarkers content={content} spec={spec} units={units} />

  const blocks = splitBlocks(content)
  const last = blocks.length - 1
  const after = new Map<number, string[]>()
  const unplaced: string[] = []
  for (const id of units) {
    const index = anchors?.[id]
    if (anchors && index !== undefined && !isStreaming) {
      const at = Math.min(Math.max(index, 0), last)
      after.set(at, [...(after.get(at) ?? []), id])
    } else {
      unplaced.push(id)
    }
  }

  // Junta os trechos entre um visual e outro num só markdown
  const segments: { text: string; visuals: string[] }[] = []
  let buffer: string[] = []
  blocks.forEach((block, i) => {
    buffer.push(block)
    const here = after.get(i)
    if (here || i === last) {
      segments.push({ text: buffer.join('\n\n'), visuals: here ?? [] })
      buffer = []
    }
  })

  return (
    <div>
      {segments.map((segment, i) => (
        <div key={i}>
          <Markdown isStreaming={isStreaming}>{segment.text}</Markdown>
          {segment.visuals.map((id) => (
            <Visual key={id} spec={spec} id={id} />
          ))}
        </div>
      ))}
      {unplaced.map((id) => (
        <Visual key={id} spec={spec} id={id} />
      ))}
    </div>
  )
}
