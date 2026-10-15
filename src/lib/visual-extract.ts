import type { Experimental_CompositionCandidate } from '@json-render/core'
import { z } from 'zod'

import type { ChatRequestBody } from './chat-protocol.ts'
import { documentsContext, MAX_DOCUMENT_CHARS } from './prompts.ts'
import { contentComponents, visualComponents, type ContentComponent } from './visual-catalog.ts'

// Extração dos blocos visuais: prompt e validação, usados tanto pelo
// servidor (OpenRouter) quanto pela versão artifact (Claude).

const MAX_BLOCKS = 8

function componentGuide(): string {
  return contentComponents
    .map((name) => {
      const def = visualComponents[name]
      return `### ${name}\n${def.description}\nprops: ${JSON.stringify(z.toJSONSchema(def.props))}`
    })
    .join('\n\n')
}

export function extractionInstructions(hasDocuments: boolean): string {
  return `Você prepara blocos visuais e didáticos que ajudam a pessoa a entender a resposta para a pergunta dela.
Pense como um professor: o objetivo é explicar visualmente, não só mostrar números.
Leia ${hasDocuments ? 'os documentos e ' : ''}a conversa e extraia de 0 a ${MAX_BLOCKS} blocos usando os componentes abaixo.
Outro modelo vai escolher quais blocos mostrar e em que ordem, então cada bloco precisa fazer sentido sozinho.

Escolha o componente pelo tipo de informação:
- status, ciclo de vida, fluxo de processo ou caminhos de decisão → Flow (use rótulos nas setas com a ação e quem faz)
- troca entre vários atores ou sistemas, em ordem (quem pede, quem aprova, quem é avisado) → Sequence
- o que cada perfil pode ou não fazer → PermissionMatrix
- um conceito central que a pessoa precisa entender → Concept (com exemplo e analogia simples)
- duas ou três alternativas, modos ou perfis → Comparison
- visão geral de módulos, telas ou seções → FeatureMap
- termos técnicos e siglas → Glossary
- procedimento passo a passo → Steps
- regras, restrições e avisos importantes → Alert ou KeyPoints
- números comparáveis → Metric, BarChart ou LineChart; datas → Timeline

Regras:
- Use apenas informações ${hasDocuments ? 'presentes nos documentos' : 'amplamente conhecidas e estáveis'}. Nunca invente números, datas, regras, perfis ou citações.
- Prefira variedade e foque no que responde à pergunta. Diagramas com no máximo 16 nós: agrupe ou simplifique, sem perder o essencial.
- Textos curtos, em português do Brasil. Rótulos de diagrama com poucas palavras.
- Se a pergunta é simples, uma saudação ou não tem nada que valha a pena visualizar, retorne "blocks": [].
- Campos que aceitam null devem ser enviados como null quando não houver valor.

Responda somente com JSON neste formato:
{"blocks":[{"component":"<nome>","description":"<o que o bloco mostra, em uma frase>","props":{...}}]}

Componentes disponíveis:

${componentGuide()}`
}

const blockSchema = z.object({
  component: z.string(),
  description: z.string(),
  props: z.record(z.string(), z.unknown()),
})

export function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '')
  return JSON.parse(cleaned)
}

// Campos nullable omitidos pelo modelo viram null para passar na validação,
// inclusive dentro de listas e objetos aninhados.
function fillNulls(value: unknown, schema: z.ZodType): unknown {
  if (schema instanceof z.ZodArray && Array.isArray(value)) {
    return value.map((item) => fillNulls(item, schema.element as z.ZodType))
  }
  if (schema instanceof z.ZodObject && value && typeof value === 'object' && !Array.isArray(value)) {
    const filled: Record<string, unknown> = { ...value }
    for (const [key, field] of Object.entries(schema.shape as Record<string, z.ZodType>)) {
      if (filled[key] === undefined) {
        if (field.safeParse(null).success) filled[key] = null
      } else {
        filled[key] = fillNulls(filled[key], field)
      }
    }
    return filled
  }
  return value
}

export function extractionInput(body: ChatRequestBody, maxChars = MAX_DOCUMENT_CHARS): string {
  const conversation = body.messages
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Pessoa' : 'Assistente'}: ${m.content}`)
    .join('\n\n')
  const docs = documentsContext(body.documents, maxChars)
  return `${docs ? `Documentos:\n\n${docs}\n\n` : ''}Conversa:\n\n${conversation}`
}

// Valida a resposta do extrator e transforma cada bloco em candidato do Jev.
export function blocksToCandidates(value: unknown): Experimental_CompositionCandidate[] {
  const parsed = z.object({ blocks: z.array(z.unknown()) }).safeParse(value)
  if (!parsed.success) throw new Error('O modelo extrator retornou um JSON inválido')

  const candidates: Experimental_CompositionCandidate[] = []
  for (const raw of parsed.data.blocks.slice(0, MAX_BLOCKS)) {
    const block = blockSchema.safeParse(raw)
    if (!block.success) continue
    const type = block.data.component as ContentComponent
    if (!contentComponents.includes(type)) continue

    const propsSchema = visualComponents[type].props as z.ZodType
    const props = propsSchema.safeParse(fillNulls(block.data.props, propsSchema))
    if (!props.success) continue

    candidates.push({
      id: `block_${candidates.length + 1}`,
      description: `${type}: ${block.data.description}`,
      element: { type, props: props.data as Record<string, unknown> },
      root: false,
    })
  }
  return candidates
}

// Estruturas de layout que o Jev pode usar para organizar os blocos.
export function layoutCandidates(content: Experimental_CompositionCandidate[]) {
  const layout: Experimental_CompositionCandidate[] = [
    {
      id: 'panel',
      description: 'Painel vertical que empilha os blocos visuais da resposta',
      element: {
        type: 'Stack',
        props: { direction: 'vertical', gap: 'md', align: 'stretch', justify: null, className: null },
      },
    },
  ]

  const metrics = content.filter((c) => c.element.type === 'Metric').length
  if (metrics >= 2) {
    layout.push({
      id: 'metrics_grid',
      description: 'Grade de colunas que coloca métricas lado a lado',
      element: { type: 'Grid', props: { columns: Math.min(metrics, 3), gap: 'md', className: null } },
      root: false,
    })
  }
  return layout
}
