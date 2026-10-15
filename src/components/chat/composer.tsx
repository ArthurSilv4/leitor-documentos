import { useRef, useState, type KeyboardEvent } from 'react'
import { AlignLeft, ArrowUp, LayoutDashboard, Paperclip, Sparkles, Square } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { VisualMode } from '@/lib/chat-protocol'
import type { ChatDocument } from '@/lib/chat-types'
import { ACCEPTED_FILES, extractText } from '@/lib/documents'
import { FileChip } from './file-chip'

const visualModes: Record<VisualMode, { label: string; hint: string; Icon: typeof Sparkles; next: VisualMode }> = {
  auto: {
    label: 'Desenhos: automático',
    hint: 'O assistente mostra desenhos (fluxos, tabelas, gráficos) só quando eles ajudam a entender',
    Icon: Sparkles,
    next: 'always',
  },
  always: { label: 'Desenhos: sempre', hint: 'Toda resposta tenta vir com desenhos', Icon: LayoutDashboard, next: 'never' },
  never: { label: 'Desenhos: nunca', hint: 'Respostas só em texto', Icon: AlignLeft, next: 'auto' },
}

type PendingFile = {
  id: string
  name: string
  size: number
  status: 'reading' | 'ready' | 'error'
  text?: string
  error?: string
}

export function Composer({
  onSend,
  onStop,
  isStreaming,
  visualMode,
  onVisualModeChange,
  suggestions,
  placeholder = 'Pergunte algo sobre seus documentos…',
}: {
  onSend: (text: string, files: ChatDocument[]) => void
  onStop: () => void
  isStreaming: boolean
  visualMode: VisualMode
  onVisualModeChange: (mode: VisualMode) => void
  /** Perguntas de exemplo; ao clicar, preenchem a caixa */
  suggestions?: string[]
  placeholder?: string
}) {
  const mode = visualModes[visualMode]
  const [text, setText] = useState('')
  const [files, setFiles] = useState<PendingFile[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const reading = files.some((f) => f.status === 'reading')
  const ready = files.filter((f) => f.status === 'ready')
  const canSend = !isStreaming && !reading && (text.trim().length > 0 || ready.length > 0)

  function addFiles(list: FileList | null) {
    if (!list) return
    for (const file of Array.from(list)) {
      const id = crypto.randomUUID()
      setFiles((fs) => [...fs, { id, name: file.name, size: file.size, status: 'reading' }])
      extractText(file)
        .then((content) =>
          setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, status: 'ready', text: content } : f))),
        )
        .catch((err: unknown) =>
          setFiles((fs) =>
            fs.map((f) =>
              f.id === id ? { ...f, status: 'error', error: err instanceof Error ? err.message : 'Erro ao ler' } : f,
            ),
          ),
        )
    }
  }

  function submit() {
    if (!canSend) return
    onSend(
      text,
      ready.map((f) => ({ id: f.id, name: f.name, size: f.size, text: f.text! })),
    )
    setText('')
    setFiles([])
    textareaRef.current?.focus()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        className={
          'bg-card focus-within:border-ring/60 rounded-2xl border shadow-[0_2px_12px_-4px_rgb(0_0_0/0.08)] transition-colors ' +
          (dragging ? 'border-primary bg-primary/5' : '')
        }
      >
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3">
            {files.map((f) => (
              <FileChip
                key={f.id}
                name={f.name}
                size={f.size}
                status={f.status}
                error={f.error}
                onRemove={() => setFiles((fs) => fs.filter((x) => x.id !== f.id))}
              />
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          className="placeholder:text-muted-foreground field-sizing-content max-h-60 min-h-12 w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] outline-none"
        />

        <div className="flex items-center justify-between px-2.5 pb-2.5">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_FILES}
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = ''
            }}
          />
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => inputRef.current?.click()}
              aria-label="Anexar documentos"
              title="Anexar documento (PDF, Word ou texto)"
            >
              <Paperclip />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-8 gap-1.5 px-2 text-xs font-normal"
              onClick={() => onVisualModeChange(mode.next)}
              title={`${mode.hint}. Clique para trocar.`}
            >
              <mode.Icon className="size-3.5" />
              {mode.label}
            </Button>
          </div>

          {isStreaming ? (
            <Button type="button" size="icon-sm" onClick={onStop} aria-label="Parar">
              <Square className="fill-current" />
            </Button>
          ) : (
            <Button type="button" size="icon-sm" onClick={submit} disabled={!canSend} aria-label="Enviar">
              <ArrowUp />
            </Button>
          )}
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setText(suggestion)
                textareaRef.current?.focus()
              }}
              className="bg-card hover:bg-accent text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-xs transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
