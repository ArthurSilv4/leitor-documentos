import { AlertCircle } from 'lucide-react'

import type { Message } from '@/lib/chat-types'
import { FileChip } from './file-chip'
import { Markdown } from './markdown'
import { VisualPanel } from './visual-panel'

export function ChatMessage({ message, isStreaming }: { message: Message; isStreaming: boolean }) {
  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-2">
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2">
            {message.attachments.map((a) => (
              <FileChip key={a.id} name={a.name} size={a.size} />
            ))}
          </div>
        )}
        <div className="bg-muted max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  const thinking = isStreaming && !message.content && !message.error

  return (
    <div>
      {thinking ? (
        <div className="flex items-center gap-1.5 py-2" aria-label="Pensando">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="bg-primary/70 size-2 animate-bounce rounded-full"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      ) : (
        message.content && <Markdown>{message.content}</Markdown>
      )}

      {message.error && (
        <div className="border-destructive/40 text-destructive mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{message.error}</span>
        </div>
      )}

      {message.stopped && <p className="text-muted-foreground mt-2 text-xs">Resposta interrompida.</p>}

      {message.visual && <VisualPanel visual={message.visual} isStreaming={isStreaming} />}
    </div>
  )
}
