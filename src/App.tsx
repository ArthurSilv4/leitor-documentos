import { useEffect, useRef, useState } from 'react'
import { FileText, Menu } from 'lucide-react'

import { Composer } from '@/components/chat/composer'
import { Gallery } from '@/components/gallery'
import { ChatMessage } from '@/components/chat/message'
import { Sidebar } from '@/components/chat/sidebar'
import { Button } from '@/components/ui/button'
import { useChat } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'

const SUGGESTIONS = [
  'Resuma este documento em linguagem simples',
  'Quais são as etapas principais do processo?',
  'Quem pode fazer o quê?',
  'Explique os termos difíceis do documento',
]

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

// A galeria abre pelo endereço com #galeria (funciona também no artifact).
function useGalleryRoute() {
  const [open, setOpen] = useState(() => window.location.hash === '#galeria')
  useEffect(() => {
    const onHash = () => setOpen(window.location.hash === '#galeria')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const set = (value: boolean) => {
    window.location.hash = value ? 'galeria' : ''
    setOpen(value)
  }
  return [open, set] as const
}

function App() {
  const chat = useChat()
  const [galleryOpen, setGalleryOpen] = useGalleryRoute()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const messages = chat.active?.messages ?? []
  const lastContent = messages.at(-1)?.content

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, lastContent])

  const sidebar = (
    <Sidebar
      conversations={chat.conversations}
      activeId={chat.active?.id ?? null}
      onNew={() => {
        chat.newChat()
        setGalleryOpen(false)
        setSidebarOpen(false)
      }}
      onSelect={(id) => {
        chat.select(id)
        setGalleryOpen(false)
        setSidebarOpen(false)
      }}
      onRemove={chat.remove}
      onOpenGallery={() => {
        setGalleryOpen(true)
        setSidebarOpen(false)
      }}
    />
  )

  return (
    <div className="flex h-full">
      <div className="hidden md:block">{sidebar}</div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 px-3">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir conversas"
          >
            <Menu />
          </Button>
          <h1 className="truncate text-sm font-medium">{chat.active?.title}</h1>
          {chat.active && chat.active.documents.length > 0 && (
            <span className="text-muted-foreground ml-auto flex shrink-0 items-center gap-1 text-xs">
              <FileText className="size-3.5" />
              {chat.active.documents.length} documento{chat.active.documents.length > 1 ? 's' : ''}
            </span>
          )}
        </header>

        {galleryOpen ? (
          <Gallery onClose={() => setGalleryOpen(false)} />
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
            <h2 className="mb-2 text-center font-serif text-3xl sm:text-4xl">{greeting()}!</h2>
            <p className="text-muted-foreground mb-8 text-center text-sm">
              Anexe um documento (PDF ou Word) pelo clipe e faça sua pergunta. Eu explico em linguagem simples e,
              quando ajudar, com desenhos.
            </p>
            <div className="w-full max-w-2xl">
              <Composer
                onSend={chat.send}
                onStop={chat.stop}
                isStreaming={chat.isStreaming}
                visualMode={chat.visualMode}
                onVisualModeChange={chat.setVisualMode}
                suggestions={SUGGESTIONS}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl space-y-8 px-4 py-6">
                {messages.map((m, i) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    isStreaming={chat.isStreaming && i === messages.length - 1}
                    onVisualize={chat.isStreaming ? undefined : () => chat.visualize(m.id)}
                    onRetry={chat.isStreaming ? undefined : () => chat.retry(m.id)}
                    onAsk={chat.isStreaming || i !== messages.length - 1 ? undefined : (q) => chat.send(q, [])}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
            <div className={cn('mx-auto w-full max-w-3xl px-4 pb-4')}>
              <Composer
                onSend={chat.send}
                onStop={chat.stop}
                isStreaming={chat.isStreaming}
                visualMode={chat.visualMode}
                onVisualModeChange={chat.setVisualMode}
                placeholder="Responder…"
              />
              <p className="text-muted-foreground mt-2 text-center text-[11px]">
                A IA pode cometer erros. Confira as informações importantes no documento.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
