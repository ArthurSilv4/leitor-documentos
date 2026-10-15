import type { Spec } from '@json-render/core'

// Contrato entre o navegador e POST /api/chat.

export type ChatRole = 'user' | 'assistant'

// auto: o Jev decide se a pergunta pede um painel; always/never: a pessoa escolheu.
export type VisualMode = 'auto' | 'always' | 'never'

export type ChatRequestBody = {
  messages: { role: ChatRole; content: string }[]
  documents: { name: string; text: string }[]
  /** Padrão: auto */
  visual?: VisualMode
  /** false gera só o painel (botão "Mostrar visual" numa resposta já dada) */
  answer?: boolean
}

export type VisualStatus = 'deciding' | 'extracting' | 'composing' | 'done' | 'skipped' | 'error'

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
      /** inline: dentro do texto, pelos marcadores; panel: num bloco depois da resposta */
      placement?: 'inline' | 'panel'
    }
  | { type: 'spec'; spec: Spec }
  | { type: 'error'; message: string }
  | { type: 'done' }
