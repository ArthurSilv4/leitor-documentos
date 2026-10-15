import {
  experimental_composeSpec,
  type Experimental_CompositionCandidate,
  type Experimental_CompositionEvaluator,
} from '@json-render/core'

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
          'Escolha "visual" só quando a resposta tiver uma estrutura que fica mais clara desenhada: processo com etapas ou status, troca entre vários atores, permissões por perfil, comparação entre opções, números comparáveis, cronologia, ou visão geral de muitas partes. ' +
          'Escolha "texto" para perguntas pontuais ou factuais, sim ou não, uma definição curta, pedidos de redação ou resumo corrido, saudações e conversa. Na dúvida, escolha "texto".',
        criteria: {
          visual: 'Um painel visual ajuda de verdade a entender a resposta',
          texto: 'A resposta em texto basta; um painel seria só enfeite',
        },
      },
    },
  }
}

async function composeVisual(body: ChatRequestBody, adapters: ChatAdapters, signal: AbortSignal, emit: (e: ChatEvent) => void) {
  const mode = body.visual ?? 'auto'
  if (mode === 'never') return

  if (mode === 'auto') {
    emit({ type: 'visual', status: 'deciding' })
    const { state, questions } = visualGateQuestions(body)
    const { answers } = await adapters.evaluate({ state, questions, signal })
    if (answers.visual?.choice !== 'visual') {
      emit({ type: 'visual', status: 'skipped' })
      return
    }
  }

  emit({ type: 'visual', status: 'extracting' })
  const content = await adapters.extract()
  if (!content.length) {
    emit({ type: 'visual', status: 'skipped' })
    return
  }

  emit({ type: 'visual', status: 'composing', evaluator: adapters.evaluatorLabel, candidates: content.length })

  const question = body.messages.findLast((m) => m.role === 'user')?.content ?? ''
  for await (const event of experimental_composeSpec({
    catalog,
    candidates: [...layoutCandidates(content), ...content],
    prompt: question,
    evaluate: adapters.evaluate,
    context: {
      objetivo: 'Painel visual que ajuda a pessoa a entender a resposta à pergunta sobre os documentos',
      documentos: body.documents.map((d) => d.name),
    },
    instructions: {
      next: 'Inclua só os blocos que ajudam a responder a pergunta. Conceitos e diagramas primeiro, depois matrizes, comparações, métricas e gráficos, depois detalhes e citações.',
    },
    maxElements: 12,
    signal,
  })) {
    if (event.type === 'step') {
      emit({ type: 'spec', spec: event.spec })
    } else if (!event.spec || event.stopReason === 'unavailable') {
      emit({ type: 'visual', status: 'skipped' })
    } else {
      emit({ type: 'spec', spec: event.spec })
      emit({
        type: 'visual',
        status: 'done',
        evaluator: adapters.evaluatorLabel,
        stopReason: event.stopReason,
        elapsedMs: event.elapsedMs,
      })
    }
  }
}

// Fila simples para juntar eventos de tarefas que rodam em paralelo.
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

// Resposta em texto e painel visual rodam em paralelo; os eventos dos
// dois saem intercalados num único stream.
export async function* runChat(
  body: ChatRequestBody,
  adapters: ChatAdapters,
  signal: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const channel = createChannel<ChatEvent>()
  const emit = (event: ChatEvent) => channel.push(event)

  const answer =
    body.answer === false
      ? Promise.resolve()
      : adapters.streamAnswer((delta) => emit({ type: 'text', delta })).catch((err) => {
          if (!signal.aborted) emit({ type: 'error', message: adapters.errorMessage(err) })
        })
  const visual = composeVisual(body, adapters, signal, emit).catch((err) => {
    if (!signal.aborted) emit({ type: 'visual', status: 'error', message: adapters.errorMessage(err) })
  })
  Promise.all([answer, visual]).finally(() => channel.close())

  yield* channel
  yield { type: 'done' }
}
