import { useEffect, useRef, useState } from 'react'
import { FileText, Menu } from 'lucide-react'

import { Composer } from '@/components/chat/composer'
import { ChatMessage } from '@/components/chat/message'
import { Sidebar } from '@/components/chat/sidebar'
import { Button } from '@/components/ui/button'
import { useChat } from '@/hooks/use-chat'
import { cn } from '@/lib/utils'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function App() {
  const chat = useChat()
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
        setSidebarOpen(false)
      }}
      onSelect={(id) => {
        chat.select(id)
        setSidebarOpen(false)
      }}
      onRemove={chat.remove}
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

        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
            <h2 className="mb-2 text-center font-serif text-3xl sm:text-4xl">{greeting()}!</h2>
            <p className="text-muted-foreground mb-8 text-center text-sm">
              Anexe um documento e pergunte. Eu respondo e monto um painel visual para ajudar a entender.
            </p>
            <div className="w-full max-w-2xl">
              <Composer onSend={chat.send} onStop={chat.stop} isStreaming={chat.isStreaming} />
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
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
            <div className={cn('mx-auto w-full max-w-3xl px-4 pb-4')}>
              <Composer onSend={chat.send} onStop={chat.stop} isStreaming={chat.isStreaming} placeholder="Responder…" />
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
