import { experimental_composeSpec } from '@json-render/core'
import { OpenRouter } from '@openrouter/sdk'

import type { ChatEvent, ChatRequestBody } from '../src/lib/chat-protocol.ts'
import { catalog } from '../src/lib/visual-catalog.ts'
import type { ServerConfig } from './config.ts'
import { createJevEvaluator } from './evaluator.ts'
import { extractCandidates, layoutCandidates } from './extract.ts'
import { answerSystemPrompt } from './prompts.ts'

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err)
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

async function streamAnswer(
  client: OpenRouter,
  config: ServerConfig,
  body: ChatRequestBody,
  signal: AbortSignal,
  emit: (event: ChatEvent) => void,
) {
  const stream = await client.chat.send(
    {
      chatRequest: {
        model: config.chatModel,
        stream: true,
        messages: [{ role: 'system', content: answerSystemPrompt(body.documents) }, ...body.messages],
      },
    },
    { signal },
  )
  if (!(Symbol.asyncIterator in stream)) throw new Error('Resposta inesperada da OpenRouter')

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (delta) emit({ type: 'text', delta })
  }
}

async function composeVisual(
  client: OpenRouter,
  config: ServerConfig,
  body: ChatRequestBody,
  signal: AbortSignal,
  emit: (event: ChatEvent) => void,
) {
  emit({ type: 'visual', status: 'extracting' })
  const content = await extractCandidates(client, config.extractModel, body, signal)
  if (!content.length) {
    emit({ type: 'visual', status: 'skipped' })
    return
  }

  const jev = createJevEvaluator(config, client)
  emit({ type: 'visual', status: 'composing', evaluator: jev.label, candidates: content.length })

  const question = body.messages.findLast((m) => m.role === 'user')?.content ?? ''
  for await (const event of experimental_composeSpec({
    catalog,
    candidates: [...layoutCandidates(content), ...content],
    prompt: question,
    evaluate: jev.evaluate,
    context: {
      objetivo: 'Painel visual que ajuda a pessoa a entender a resposta à pergunta sobre os documentos',
      documentos: body.documents.map((d) => d.name),
    },
    instructions: {
      next: 'Inclua só os blocos que ajudam a responder a pergunta. Métricas primeiro, depois gráficos e tabelas, depois detalhes e citações.',
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
        evaluator: jev.label,
        stopReason: event.stopReason,
        elapsedMs: event.elapsedMs,
      })
    }
  }
}

// Resposta em texto e painel visual rodam em paralelo; os eventos
// dos dois são intercalados num único stream NDJSON.
export async function* handleChat(
  body: ChatRequestBody,
  config: ServerConfig,
  signal: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const client = new OpenRouter({ apiKey: config.openRouterApiKey, appTitle: 'Chat com documentos' })
  const channel = createChannel<ChatEvent>()
  const emit = (event: ChatEvent) => channel.push(event)

  const answer = streamAnswer(client, config, body, signal, emit).catch((err) => {
    if (!signal.aborted) emit({ type: 'error', message: errorMessage(err) })
  })
  const visual = composeVisual(client, config, body, signal, emit).catch((err) => {
    if (!signal.aborted) emit({ type: 'visual', status: 'error', message: errorMessage(err) })
  })
  Promise.all([answer, visual]).finally(() => channel.close())

  yield* channel
  yield { type: 'done' }
}
