import { useCallback, useEffect, useRef, useState } from 'react'

import type { ChatEvent, ChatRequestBody, VisualMode } from '@/lib/chat-protocol'
import { runChatInBrowser } from '@/lib/browser-chat'
import type { ChatDocument, Conversation, Message } from '@/lib/chat-types'

const STORAGE_KEY = 'doc-chat:conversations'
const VISUAL_MODE_KEY = 'doc-chat:visual-mode'

function loadVisualMode(): VisualMode {
  try {
    const value = localStorage.getItem(VISUAL_MODE_KEY)
    return value === 'always' || value === 'never' ? value : 'auto'
  } catch {
    return 'auto'
  }
}

function load(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Conversation[]) : []
  } catch {
    return []
  }
}

function save(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch (err) {
    // Documentos grandes podem estourar a cota; a conversa continua em memória.
    console.warn('Não foi possível salvar as conversas', err)
  }
}

function titleFrom(text: string, docs: ChatDocument[]) {
  const base = text.trim() || docs[0]?.name || 'Nova conversa'
  return base.length > 48 ? `${base.slice(0, 48)}…` : base
}

// Na versão artifact não há servidor: o fluxo roda na própria página.
const IS_ARTIFACT = import.meta.env.MODE === 'artifact'

async function* fetchChat(body: ChatRequestBody, signal: AbortSignal): AsyncGenerator<ChatEvent> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new Error(data?.error ?? `Erro HTTP ${response.status}`)
  }
  yield* readNdjson(response)
}

async function* readNdjson(response: Response): AsyncGenerator<ChatEvent> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) if (line.trim()) yield JSON.parse(line) as ChatEvent
    if (done) break
  }
  if (buffer.trim()) yield JSON.parse(buffer) as ChatEvent
}

function applyEvent(message: Message, event: ChatEvent): Message {
  switch (event.type) {
    case 'text':
      return { ...message, content: message.content + event.delta }
    case 'spec':
      return { ...message, visual: { status: 'composing', ...message.visual, spec: event.spec } }
    case 'visual': {
      const { type: _type, ...visual } = event
      return { ...message, visual: { ...message.visual, ...visual } }
    }
    case 'error':
      return { ...message, error: event.message }
    default:
      return message
  }
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>(load)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [visualMode, setVisualModeState] = useState<VisualMode>(loadVisualMode)
  const abortRef = useRef<AbortController | null>(null)

  // Salva fora do streaming para não serializar a cada pedaço de texto.
  useEffect(() => {
    if (!isStreaming) save(conversations)
  }, [conversations, isStreaming])

  const active = conversations.find((c) => c.id === activeId) ?? null

  const updateMessage = useCallback((convId: string, msgId: string, fn: (m: Message) => Message) => {
    setConversations((cs) =>
      cs.map((c) =>
        c.id === convId ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? fn(m) : m)) } : c,
      ),
    )
  }, [])

  const setVisualMode = useCallback((mode: VisualMode) => {
    setVisualModeState(mode)
    try {
      localStorage.setItem(VISUAL_MODE_KEY, mode)
    } catch {
      // preferência só desta sessão
    }
  }, [])

  // Recebe os eventos de uma chamada e aplica na mensagem do assistente.
  const stream = useCallback(
    async (convId: string, msgId: string, body: ChatRequestBody) => {
      setIsStreaming(true)
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const events = IS_ARTIFACT
          ? runChatInBrowser(body, controller.signal)
          : fetchChat(body, controller.signal)
        for await (const event of events) {
          updateMessage(convId, msgId, (m) => applyEvent(m, event))
        }
      } catch (err) {
        if (controller.signal.aborted) {
          updateMessage(convId, msgId, (m) => ({
            ...m,
            stopped: body.answer !== false ? true : m.stopped,
            visual:
              m.visual && ['deciding', 'extracting', 'composing'].includes(m.visual.status)
                ? { ...m.visual, status: m.visual.spec ? 'done' : 'skipped' }
                : m.visual,
          }))
        } else {
          const message = err instanceof Error ? err.message : String(err)
          updateMessage(convId, msgId, (m) =>
            body.answer === false ? { ...m, visual: { status: 'error', message } } : { ...m, error: message },
          )
        }
      } finally {
        abortRef.current = null
        setIsStreaming(false)
      }
    },
    [updateMessage],
  )

  // Gera só o painel para uma resposta que veio sem ele.
  const visualize = useCallback(
    (msgId: string) => {
      if (isStreaming || !active) return
      const index = active.messages.findIndex((m) => m.id === msgId)
      if (index < 0) return
      const history = active.messages.slice(0, index + 1)
      updateMessage(active.id, msgId, (m) => ({ ...m, visual: { status: 'extracting' } }))
      void stream(active.id, msgId, {
        messages: history.filter((m) => m.content.trim()).map((m) => ({ role: m.role, content: m.content })),
        documents: active.documents.map(({ name, text }) => ({ name, text })),
        visual: 'always',
        answer: false,
      })
    },
    [active, isStreaming, stream, updateMessage],
  )

  const send = useCallback(
    async (text: string, files: ChatDocument[]) => {
      if (isStreaming) return

      const content = text.trim() || 'Resuma os pontos principais do documento anexado.'
      const now = Date.now()
      const conv: Conversation = active ?? {
        id: crypto.randomUUID(),
        title: titleFrom(text, files),
        createdAt: now,
        updatedAt: now,
        messages: [],
        documents: [],
      }
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        attachments: files.map(({ id, name, size }) => ({ id, name, size })),
      }
      const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' }
      const documents = [...conv.documents, ...files]
      const history = [...conv.messages, userMsg]

      const next: Conversation = {
        ...conv,
        documents,
        messages: [...history, assistantMsg],
        updatedAt: now,
      }
      setConversations((cs) => [next, ...cs.filter((c) => c.id !== conv.id)])
      setActiveId(conv.id)

      await stream(conv.id, assistantMsg.id, {
        messages: history
          .filter((m) => m.content.trim())
          .map((m) => ({ role: m.role, content: m.content })),
        documents: documents.map(({ name, text }) => ({ name, text })),
        visual: visualMode,
      })
    },
    [active, isStreaming, stream, visualMode],
  )

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    setActiveId(null)
  }, [])

  const select = useCallback((id: string) => {
    abortRef.current?.abort()
    setActiveId(id)
  }, [])

  const remove = useCallback(
    (id: string) => {
      if (id === activeId) {
        abortRef.current?.abort()
        setActiveId(null)
      }
      setConversations((cs) => cs.filter((c) => c.id !== id))
    },
    [activeId],
  )

  return {
    conversations,
    active,
    isStreaming,
    visualMode,
    setVisualMode,
    send,
    visualize,
    stop,
    newChat,
    select,
    remove,
  }
}
