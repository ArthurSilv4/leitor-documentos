import type { Experimental_CompositionCandidate } from '@json-render/core'
import type { OpenRouter } from '@openrouter/sdk'

import type { ChatRequestBody } from '../src/lib/chat-protocol.ts'
import {
  blocksToCandidates,
  extractionInput,
  extractionInstructions,
  parseJson,
} from '../src/lib/visual-extract.ts'

export async function extractCandidates(
  client: OpenRouter,
  model: string,
  body: ChatRequestBody,
  signal: AbortSignal,
): Promise<Experimental_CompositionCandidate[]> {
  const result = await client.chat.send(
    {
      chatRequest: {
        model,
        stream: false,
        responseFormat: { type: 'json_object' },
        messages: [
          { role: 'system', content: extractionInstructions(body.documents.length > 0) },
          { role: 'user', content: extractionInput(body) },
        ],
      },
    },
    { signal },
  )

  if (!('choices' in result)) throw new Error('Resposta inesperada do modelo extrator')
  const content = result.choices[0]?.message?.content
  if (typeof content !== 'string') return []
  return blocksToCandidates(parseJson(content))
}
