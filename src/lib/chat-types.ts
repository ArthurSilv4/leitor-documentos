import type { Spec } from '@json-render/core'

import type { VisualStatus } from '@/lib/chat-protocol'

export type ChatDocument = {
  id: string
  name: string
  size: number
  text: string
}

export type Visual = {
  status: VisualStatus
  spec?: Spec
  evaluator?: string
  elapsedMs?: number
  message?: string
  /** inline: dentro do texto; panel: bloco depois da resposta (botão ou conversas antigas) */
  placement?: 'inline' | 'panel'
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachments?: { id: string; name: string; size: number }[]
  visual?: Visual
  error?: string
  stopped?: boolean
}

export type Conversation = {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: Message[]
  documents: ChatDocument[]
}
