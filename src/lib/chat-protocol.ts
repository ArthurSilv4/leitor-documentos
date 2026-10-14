import type { Spec } from '@json-render/core'

// Contrato entre o navegador e POST /api/chat.

export type ChatRole = 'user' | 'assistant'

export type ChatRequestBody = {
  messages: { role: ChatRole; content: string }[]
  documents: { name: string; text: string }[]
}

export type VisualStatus = 'extracting' | 'composing' | 'done' | 'skipped' | 'error'

// A resposta é NDJSON: um ChatEvent por linha.
export type ChatEvent =
  | { type: 'text'; delta: string }
  | {
      type: 'visual'
      status: VisualStatus
      evaluator?: string
      candidates?: number
      stopReason?: string
      elapsedMs?: number
      message?: string
    }
  | { type: 'spec'; spec: Spec }
  | { type: 'error'; message: string }
  | { type: 'done' }
