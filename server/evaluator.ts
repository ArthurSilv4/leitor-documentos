import {
  experimental_createEvaluator,
  type Experimental_CompositionEvaluator,
} from '@json-render/core'
import type { OpenRouter } from '@openrouter/sdk'

import type { ServerConfig } from './config.ts'

// Jev é um modelo de decisão: recebe perguntas de múltipla escolha
// ("quais blocos entram?", "em que ordem?") e responde com as escolhas.
// Roda pelo Vercel AI Gateway quando AI_GATEWAY_API_KEY existe;
// caso contrário, pela API Decisions da OpenRouter.
export function createJevEvaluator(
  config: ServerConfig,
  client: OpenRouter,
): { evaluate: Experimental_CompositionEvaluator; label: string } {
  if (config.aiGatewayApiKey) {
    return {
      label: `${config.jevModel} · Vercel AI Gateway`,
      evaluate: experimental_createEvaluator({
        model: config.jevModel,
        apiKey: config.aiGatewayApiKey,
        timeoutMs: 20_000,
      }),
    }
  }

  return {
    label: `${config.jevModel} · OpenRouter`,
    evaluate: async ({ state, questions, signal }) => {
      const response = await client.alpha.decisions.create(
        { decisionsRequest: { model: config.jevModel, state, questions } },
        { signal },
      )

      const answers = Object.fromEntries(
        Object.entries(questions).map(([name, question]) => {
          const answer = response.answers[name]
          if (
            !answer ||
            answer.type !== 'choice' ||
            !('choice' in answer) ||
            typeof answer.choice !== 'string' ||
            !Object.hasOwn(question.criteria, answer.choice)
          ) {
            throw new Error(`Jev retornou uma escolha inválida para "${name}"`)
          }
          const confidence = 'confidence' in answer ? answer.confidence : undefined
          return [name, { choice: answer.choice, confidence: typeof confidence === 'number' ? confidence : undefined }]
        }),
      )
      return { answers, usage: { inputTokens: response.usage.inputTokens } }
    },
  }
}
