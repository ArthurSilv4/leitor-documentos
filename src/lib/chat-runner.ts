import {
  experimental_composeSpec,
  type Experimental_CompositionCandidate,
  type Experimental_CompositionEvaluator,
  type Spec,
} from '@json-render/core'

import { parseAnswer, splitBlocks } from './answer-format.ts'
import type { ChatEvent, ChatRequestBody } from './chat-protocol.ts'
import { catalog } from './visual-catalog.ts'
import { layoutCandidates } from './visual-extract.ts'

// Fluxo de uma pergunta, igual no servidor (OpenRouter + Jev) e na versão
// artifact (Claude). Cada lado só fornece os adaptadores de modelo.
export type ChatAdapters = {
  /** Resposta em texto, em streaming */
  streamAnswer: (emitDelta: (delta: string) => void) => Promise<void>
  /** Blocos visuais extraídos dos documentos */
  extract: () => Promise<Experimental_CompositionCandidate[]>
  /** Modelo de decisão (Jev ou substituto) */
  evaluate: Experimental_CompositionEvaluator
  evaluatorLabel: string
  errorMessage: (err: unknown) => string
}

// Classificação antes da parte cara: vale a pena desenhar algo aqui?
export function visualGateQuestions(body: ChatRequestBody) {
  const recent = body.messages.slice(-4).map((m) => `${m.role === 'user' ? 'Pessoa' : 'Assistente'}: ${m.content.slice(0, 600)}`)
  return {
    state: {
      pergunta: body.messages.findLast((m) => m.role === 'user')?.content ?? '',
      conversa_recente: recent,
      documentos: body.documents.map((d) => d.name),
    },
    questions: {
      visual: {
        type: 'choice' as const,
        instructions:
          'A pessoa fez uma pergunta, geralmente sobre documentos anexados. Decida se, além da resposta em texto, um painel visual ajudaria de verdade a entender a resposta. ' +
          'Escolha "visual" só quando um explicador interativo ajudaria a entender: processo com etapas ou status, dúvida que depende da situação da pessoa, o que cada perfil pode fazer, consequências de uma ação, regra com exemplos, prazo ou conta que a pessoa pode testar, uma tela do sistema, comparação entre opções ou números. ' +
          'Escolha "texto" para perguntas pontuais ou factuais, sim ou não, uma definição curta, pedidos de redação ou resumo corrido, saudações e conversa. Na dúvida, escolha "texto".',
        criteria: {
          visual: 'Um painel visual ajuda de verdade a entender a resposta',
          texto: 'A resposta em texto basta; um painel seria só enfeite',
        },
      },
    },
  }
}

type PreparedVisual = { spec: Spec; units: { id: string; description: string }[] }

// Visuais de primeiro nível (filhos da raiz), com uma descrição de cada um.
function describeUnits(spec: Spec, descriptions: Map<string, string>) {
  const describe = (id: string): string => {
    const element = spec.elements[id]
    const known = descriptions.get(`${element.type}:${JSON.stringify(element.props)}`)
    if (known) return known
    const children = element.children ?? []
    return children.length ? `Grade com: ${children.map(describe).join('; ')}` : element.type
  }
  return (spec.elements[spec.root]?.children ?? []).map((id) => ({ id, description: describe(id) }))
}

async function prepareVisual(
  body: ChatRequestBody,
  adapters: ChatAdapters,
  signal: AbortSignal,
  emit: (e: ChatEvent) => void,
): Promise<PreparedVisual | null> {
  const mode = body.visual ?? 'auto'
  if (mode === 'never') return null
  const placement = body.answer === false ? 'panel' : 'inline'

  if (mode === 'auto') {
    emit({ type: 'visual', status: 'deciding' })
    const { state, questions } = visualGateQuestions(body)
    const { answers } = await adapters.evaluate({ state, questions, signal })
    if (answers.visual?.choice !== 'visual') {
      emit({ type: 'visual', status: 'skipped' })
      return null
    }
  }

  emit({ type: 'visual', status: 'extracting' })
  const content = await adapters.extract()
  if (!content.length) {
    emit({ type: 'visual', status: 'skipped' })
    return null
  }

  emit({ type: 'visual', status: 'composing', evaluator: adapters.evaluatorLabel, candidates: content.length })

  const question = body.messages.findLast((m) => m.role === 'user')?.content ?? ''
  for await (const event of experimental_composeSpec({
    catalog,
    candidates: [...layoutCandidates(content), ...content],
    prompt: question,
    evaluate: adapters.evaluate,
    context: {
      objetivo: 'Visuais que ajudam a pessoa a entender a resposta à pergunta sobre os documentos',
      documentos: body.documents.map((d) => d.name),
    },
    instructions: {
      next: 'Inclua só os blocos que ajudam a responder a pergunta; poucos e bons. Conceito e jornada primeiro, depois guias, papéis, causas e efeitos e regras, depois números, e o teste rápido por último.',
    },
    maxElements: 12,
    signal,
  })) {
    // No painel, mostra a montagem; no texto, só o resultado final.
    if (event.type === 'step') {
      if (placement === 'panel') emit({ type: 'spec', spec: event.spec })
      continue
    }
    if (!event.spec || event.stopReason === 'unavailable') {
      emit({ type: 'visual', status: 'skipped' })
      return null
    }
    emit({ type: 'spec', spec: event.spec })
    emit({
      type: 'visual',
      status: 'done',
      evaluator: adapters.evaluatorLabel,
      stopReason: event.stopReason,
      elapsedMs: event.elapsedMs,
      placement,
    })
    const descriptions = new Map(content.map((c) => [`${c.element.type}:${JSON.stringify(c.element.props)}`, c.description]))
    return { spec: event.spec, units: describeUnits(event.spec, descriptions) }
  }
  return null
}

// Fila simples para entregar eventos de callbacks como um stream.
function createChannel<T>() {
  const buffer: T[] = []
  let wake: (() => void) | null = null
  let closed = false
  return {
    push(item: T) {
      buffer.push(item)
      wake?.()
    },
    close() {
      closed = true
      wake?.()
    },
    async *[Symbol.asyncIterator]() {
      while (true) {
        if (buffer.length) yield buffer.shift()!
        else if (closed) return
        else await new Promise<void>((resolve) => (wake = resolve))
        wake = null
      }
    },
  }
}

// Com o texto pronto, o modelo de decisão escolhe depois de qual trecho
// cada visual ajuda mais o leitor.
async function placeVisuals(
  text: string,
  units: PreparedVisual['units'],
  adapters: ChatAdapters,
  signal: AbortSignal,
): Promise<Record<string, number>> {
  const blocks = splitBlocks(parseAnswer(text).body)
  const last = Math.max(blocks.length - 1, 0)
  if (blocks.length < 2) return Object.fromEntries(units.map((u) => [u.id, last]))

  const criteria = Object.fromEntries(
    blocks.map((block, i) => [`t${i}`, block.replace(/\s+/g, ' ').slice(0, 220)]),
  )
  const questions = Object.fromEntries(
    units.map((u) => [
      `local_${u.id}`,
      {
        type: 'choice' as const,
        instructions: `O visual "${u.description}" vai aparecer no meio da resposta. Escolha o trecho depois do qual ele mais ajuda o leitor: logo após o trecho que fala do mesmo assunto. Evite colocar logo depois de um título.`,
        criteria,
      },
    ]),
  )
  const { answers } = await adapters.evaluate({ state: { resposta: blocks }, questions, signal })
  return Object.fromEntries(
    units.map((u) => {
      const choice = answers[`local_${u.id}`]?.choice ?? ''
      const index = Number(choice.slice(1))
      return [u.id, Number.isInteger(index) && index >= 0 && index <= last ? index : last]
    }),
  )
}

// O texto começa na hora. Em paralelo, o modelo de decisão avalia se vale
// desenhar algo e, se sim, os visuais são preparados e aparecem assim que
// ficam prontos. No fim, cada um vai para o ponto certo da explicação.
export async function* runChat(
  body: ChatRequestBody,
  adapters: ChatAdapters,
  signal: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const channel = createChannel<ChatEvent>()
  const emit = (event: ChatEvent) => channel.push(event)

  const visualTask = prepareVisual(body, adapters, signal, emit).catch((err) => {
    if (!signal.aborted) emit({ type: 'visual', status: 'error', message: adapters.errorMessage(err) })
    return null
  })

  let text = ''
  const textTask =
    body.answer === false
      ? Promise.resolve(false)
      : adapters
          .streamAnswer((delta) => {
            text += delta
            emit({ type: 'text', delta })
          })
          .then(() => true)
          .catch((err) => {
            if (!signal.aborted) emit({ type: 'error', message: adapters.errorMessage(err) })
            return false
          })

  const run = async () => {
    const [visual, textOk] = await Promise.all([visualTask, textTask])
    if (!visual || !textOk || signal.aborted || visual.units.length === 0) return
    try {
      emit({ type: 'placement', anchors: await placeVisuals(text, visual.units, adapters, signal) })
    } catch (err) {
      // Sem posição escolhida, os visuais ficam no fim da resposta
      if (!signal.aborted) console.warn('Não foi possível posicionar os visuais:', adapters.errorMessage(err))
    }
  }
  run().finally(() => channel.close())

  yield* channel
  yield { type: 'done' }
}
