import { OpenRouter } from '@openrouter/sdk'

import type { ChatEvent, ChatRequestBody } from '../src/lib/chat-protocol.ts'
import { runChat } from '../src/lib/chat-runner.ts'
import { answerSystemPrompt } from '../src/lib/prompts.ts'
import type { ServerConfig } from './config.ts'
import { createJevEvaluator } from './evaluator.ts'
import { extractCandidates } from './extract.ts'

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err)
}

// Servidor: OpenRouter responde e extrai; o Jev decide e compõe o painel.
export function handleChat(
  body: ChatRequestBody,
  config: ServerConfig,
  signal: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const client = new OpenRouter({ apiKey: config.openRouterApiKey, appTitle: 'Chat com documentos' })
  const jev = createJevEvaluator(config, client)

  return runChat(
    body,
    {
      async streamAnswer(emitDelta) {
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
          if (delta) emitDelta(delta)
        }
      },
      extract: () => extractCandidates(client, config.extractModel, body, signal),
      evaluate: jev.evaluate,
      evaluatorLabel: jev.label,
      errorMessage,
    },
    signal,
  )
}
