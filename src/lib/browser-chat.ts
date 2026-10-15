import type { Experimental_CompositionEvaluator } from '@json-render/core'

import type { ChatEvent, ChatRequestBody } from './chat-protocol.ts'
import { runChat } from './chat-runner.ts'
import { answerSystemPrompt } from './prompts.ts'
import { blocksToCandidates, extractionInput, extractionInstructions } from './visual-extract.ts'

// Versão artifact: a página roda o mesmo fluxo do servidor, mas pede as
// respostas ao Claude (capacidade `sample` do claude.ai) em vez da
// OpenRouter. O Claude também faz o papel de classificador do Jev.

// O sample aceita até 256 KiB por chamada; deixa folga para instruções.
const MAX_DOCUMENT_CHARS = 150_000

export const EVALUATOR_LABEL = 'Claude (no papel do Jev)'

type SampleError = { code?: string; message?: string; text?: string }

function sampleErrorMessage(err: unknown): string {
  const code = (err as SampleError)?.code
  switch (code) {
    case 'not_granted':
      return 'Você não autorizou esta página a usar o Claude. Recarregue a página e permita para continuar.'
    case 'sampling_disabled':
      return 'O Claude não está disponível para esta conta.'
    case 'rate_limited':
      return 'Muitas solicitações seguidas. Espere um pouco e tente de novo.'
    case 'prompt_too_large':
      return 'Os documentos são grandes demais para esta versão. Tente com um arquivo menor.'
    case 'refused':
      return 'O Claude não quis responder a esta pergunta.'
    case 'invalid_json':
      return 'O Claude respondeu num formato inesperado.'
    default:
      return (err as SampleError)?.message ?? (err instanceof Error ? err.message : String(err))
  }
}

async function getSample(): Promise<SampleFn> {
  const sample = await window.claude?.use('sample')
  if (!sample) throw new Error('Esta página precisa ser aberta no claude.ai para conversar com o Claude.')
  return sample
}

// Mesma interface do Jev: recebe perguntas de múltipla escolha e devolve
// uma escolha válida para cada uma.
function claudeEvaluator(sample: SampleFn): Experimental_CompositionEvaluator {
  return async ({ state, questions, signal }) => {
    const prompt = `Você é um avaliador de decisões. Leia o estado e responda a cada pergunta escolhendo exatamente uma das chaves de "criteria" daquela pergunta.

Estado:
${JSON.stringify(state, null, 2)}

Perguntas:
${JSON.stringify(questions, null, 2)}

Responda somente com JSON no formato {"answers": {"<nome da pergunta>": {"choice": "<chave escolhida>"}}}, com uma entrada para cada pergunta.`

    const result = await sample.json<{ answers?: Record<string, { choice?: unknown }> }>(prompt, {
      signal,
      modelTier: 'quick',
      cache: false,
    })

    const answers = Object.fromEntries(
      Object.entries(questions).map(([name, question]) => {
        const choice = result?.answers?.[name]?.choice
        if (typeof choice !== 'string' || !Object.hasOwn(question.criteria, choice)) {
          throw new Error(`O classificador retornou uma escolha inválida para "${name}"`)
        }
        return [name, { choice }]
      }),
    )
    return { answers }
  }
}

export async function* runChatInBrowser(
  body: ChatRequestBody,
  signal: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const sample = await getSample()

  yield* runChat(
    body,
    {
      async streamAnswer(emitDelta) {
        // O sample não tem prompt de sistema: as instruções vão no primeiro turno.
        const [first, ...rest] = body.messages
        const turns: SampleMessage[] = [
          {
            role: 'user',
            content: `${answerSystemPrompt(body.documents, MAX_DOCUMENT_CHARS)}\n\n---\n\n${first.content}`,
          },
          ...rest,
        ]
        await sample(turns, { signal, cache: false, onText: ({ delta }) => emitDelta(delta) })
      },
      async extract() {
        const extracted = await sample.json(
          `${extractionInstructions(body.documents.length > 0)}\n\n---\n\n${extractionInput(body, MAX_DOCUMENT_CHARS)}`,
          { signal, cache: false },
        )
        return blocksToCandidates(extracted)
      },
      evaluate: claudeEvaluator(sample),
      evaluatorLabel: EVALUATOR_LABEL,
      errorMessage: sampleErrorMessage,
    },
    signal,
  )
}
