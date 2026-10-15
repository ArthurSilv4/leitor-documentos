import { AlertCircle, CornerDownRight, LayoutDashboard, Loader2, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { parseAnswer } from '@/lib/answer-format'
import type { Message } from '@/lib/chat-types'
import { friendlyError } from '@/lib/friendly-error'
import { AnswerWithVisuals } from './answer-with-visuals'
import { FileChip } from './file-chip'
import { Markdown } from './markdown'
import { VisualPanel } from './visual-panel'

export function ChatMessage({
  message,
  isStreaming,
  onVisualize,
  onRetry,
  onAsk,
}: {
  message: Message
  isStreaming: boolean
  /** Ausentes enquanto outra resposta está sendo gerada */
  onVisualize?: () => void
  onRetry?: () => void
  /** Só na última resposta: envia uma das perguntas sugeridas */
  onAsk?: (question: string) => void
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

  const { body, suggestions } = parseAnswer(message.content)
  // Desenhos sendo preparados em paralelo ao texto (a decisão não aparece)
  const preparing = working && visual.placement !== 'panel' && visual.status !== 'deciding'
  const thinking = isStreaming && !body && !message.error

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
        body &&
        (inlineSpec ? (
          <AnswerWithVisuals content={body} spec={inlineSpec} anchors={visual?.anchors} isStreaming={isStreaming} />
        ) : (
          <Markdown isStreaming={isStreaming}>{body}</Markdown>
        ))
      )}

      {preparing && (
        <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {visual.status === 'extracting'
            ? 'Lendo o documento para preparar os desenhos…'
            : 'Escolhendo os desenhos que ajudam a explicar…'}
        </p>
      )}

      {visual?.status === 'error' && visual.placement !== 'panel' && (
        <p className="text-muted-foreground mt-3 text-xs">
          Não consegui preparar os desenhos desta vez; a resposta veio só em texto.
        </p>
      )}

      {message.error && (
        <div className="border-destructive/40 mt-2 rounded-lg border px-3 py-2.5 text-sm">
          <p className="text-destructive flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{friendlyError(message.error)}</span>
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 pl-6">
            {onRetry && (
              <Button variant="outline" size="sm" className="h-8" onClick={onRetry}>
                <RotateCcw className="size-3.5" />
                Tentar de novo
              </Button>
            )}
            <details className="text-muted-foreground text-xs">
              <summary className="cursor-pointer">Detalhes para o suporte</summary>
              <p className="mt-1 break-all">{message.error}</p>
            </details>
          </div>
        </div>
      )}

      {message.stopped && (
        <p className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
          Resposta interrompida.
          {onRetry && (
            <button type="button" className="hover:text-foreground underline underline-offset-2" onClick={onRetry}>
              Gerar de novo
            </button>
          )}
        </p>
      )}

      {asPanel && <VisualPanel visual={visual} isStreaming={isStreaming} />}

      {onVisualize && !isStreaming && message.content && (!message.visual || message.visual.status === 'skipped') && (
        <Button variant="ghost" size="sm" className="text-muted-foreground mt-2 -ml-2 h-8 text-xs" onClick={onVisualize}>
          <LayoutDashboard className="size-3.5" />
          Explicar com desenhos
        </Button>
      )}

      {onAsk && !isStreaming && suggestions.length > 0 && (
        <div className="mt-4 flex flex-col items-start gap-1.5">
          <p className="text-muted-foreground text-xs">Você também pode perguntar:</p>
          {suggestions.map((question) => (
            <button
              key={question}
              type="button"
              onClick={() => onAsk(question)}
              className="bg-card hover:bg-accent flex items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-sm transition-colors"
            >
              <CornerDownRight className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
