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
  return `Você prepara explicadores visuais para pessoas que NÃO são da área técnica entenderem a resposta à pergunta delas.
Leia ${hasDocuments ? 'os documentos e ' : ''}a conversa e extraia de 0 a ${MAX_BLOCKS} blocos usando os componentes abaixo.
Outro modelo vai escolher quais blocos usar, então cada bloco precisa fazer sentido sozinho.

O texto da resposta já cobre listas, tabelas e fluxogramas simples. Os blocos existem para ir ALÉM do texto:
deixar a pessoa explorar, simular a própria situação, ver causa e efeito e conferir se entendeu.
Não crie um bloco que seria só uma lista ou uma tabela.

Escolha o componente pelo que ajuda a entender:
- um processo ou ciclo de situações (status) → Journey: o caminho principal em etapas, com os desvios "E se…?" de cada etapa
- dúvidas do tipo "posso…?", "o que faço se…?", em que a resposta depende da situação → DecisionGuide
- perfis ou papéis de pessoas → RoleExplorer (o que cada um pode e não pode, em frases simples)
- consequências de uma ação (muda a situação, quem é avisado, o que fica registrado, prazos) → ActionEffect
- uma regra com condições ou limites → RuleExamples, com situações concretas do dia a dia que pode e que não pode
- descrição de uma tela do sistema → ScreenMap
- um conceito central → Concept, sempre com uma analogia do cotidiano
- duas ou três alternativas → Comparison
- um prazo de antecedência ("marcar com pelo menos X horas") → DeadlineCheck, para a pessoa testar a própria data
- uma conta ou regra com números que a pessoa pode querer testar (valores, taxas, limites, quantidades) → Simulator, com fórmulas simples sobre as entradas
- quando a explicação é longa ou cheia de regras → um Quiz curto (no máximo um, 2 ou 3 perguntas)
- números comparáveis → Metric, BarChart ou LineChart; partes de um todo → PieChart; datas → Timeline

Regras:
- Use apenas informações ${hasDocuments ? 'presentes nos documentos' : 'amplamente conhecidas e estáveis'}. Nunca invente números, datas, regras, perfis ou exemplos que contradigam o documento.
- Exemplos de RuleExamples e opções de DecisionGuide devem ser situações reais e concretas ("Agendar para amanhã às 10h"), não abstrações.
- Em Simulator, as fórmulas só podem usar os ids das entradas, números e as operações permitidas; as regras e valores vêm do documento.
- Quem vai ver NÃO é da área técnica: palavras do dia a dia, frases curtas, português do Brasil.
- Não use nomes internos de sistema, parâmetros, códigos ou nomes de campos técnicos. Siglas, só se explicadas.
- Foque no que responde à pergunta. Menos blocos bons valem mais que muitos blocos.
- Se a pergunta é simples, uma saudação ou não há nada que um explicador acrescente, retorne "blocks": [].
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
