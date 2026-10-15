import { AlertCircle, LayoutDashboard, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { Message } from '@/lib/chat-types'
import { AnswerWithVisuals } from './answer-with-visuals'
import { FileChip } from './file-chip'
import { Markdown } from './markdown'
import { VisualPanel } from './visual-panel'

export function ChatMessage({
  message,
  isStreaming,
  onVisualize,
}: {
  message: Message
  isStreaming: boolean
  /** Ausente enquanto outra resposta está sendo gerada */
  onVisualize?: () => void
}) {
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

  const visual = message.visual
  const working = visual && ['deciding', 'extracting', 'composing'].includes(visual.status)
  // Visuais dentro do texto; o painel separado fica para o botão "Mostrar
  // visualmente" e para conversas salvas antes desta mudança.
  const inlineSpec = visual?.placement === 'inline' && visual.spec?.root ? visual.spec : null
  const asPanel = visual && (visual.placement === 'panel' || (!visual.placement && visual.status === 'done'))

  const preparing =
    isStreaming && !message.content && working && visual.placement !== 'panel' && visual.status !== 'deciding'
  const thinking = isStreaming && !message.content && !message.error && !preparing

  return (
    <div>
      {preparing && (
        <p className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {visual.status === 'extracting'
            ? 'Lendo o documento para preparar os visuais…'
            : `Escolhendo os visuais que ajudam a explicar…`}
        </p>
      )}

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
        message.content &&
        (inlineSpec ? (
          <AnswerWithVisuals content={message.content} spec={inlineSpec} isStreaming={isStreaming} />
        ) : (
          <Markdown>{message.content}</Markdown>
        ))
      )}

      {inlineSpec && !isStreaming && (
        <p className="text-muted-foreground mt-4 text-xs">Visuais escolhidos por {visual?.evaluator ?? 'Jev'}</p>
      )}

      {visual?.status === 'error' && visual.placement !== 'panel' && (
        <p className="text-muted-foreground mt-3 text-xs">Não foi possível preparar os visuais: {visual.message}</p>
      )}

      {message.error && (
        <div className="border-destructive/40 text-destructive mt-2 flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{message.error}</span>
        </div>
      )}

      {message.stopped && <p className="text-muted-foreground mt-2 text-xs">Resposta interrompida.</p>}

      {asPanel && <VisualPanel visual={visual} isStreaming={isStreaming} />}

      {onVisualize && !isStreaming && message.content && (!message.visual || message.visual.status === 'skipped') && (
        <Button variant="ghost" size="sm" className="text-muted-foreground mt-2 -ml-2 h-8 text-xs" onClick={onVisualize}>
          <LayoutDashboard className="size-3.5" />
          Mostrar visualmente
        </Button>
      )}
    </div>
  )
}
