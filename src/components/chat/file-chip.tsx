import { AlertCircle, FileText, Loader2, X } from 'lucide-react'

import { formatBytes } from '@/lib/documents'
import { cn } from '@/lib/utils'

export function FileChip({
  name,
  size,
  status = 'ready',
  error,
  onRemove,
}: {
  name: string
  size: number
  status?: 'reading' | 'ready' | 'error'
  error?: string
  onRemove?: () => void
}) {
  return (
    <div
      className={cn(
        'bg-card flex max-w-60 items-center gap-2 rounded-lg border py-1.5 pr-2 pl-2.5 text-left',
        status === 'error' && 'border-destructive/50',
      )}
      title={error ?? name}
    >
      <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md">
        {status === 'reading' ? (
          <Loader2 className="size-4 animate-spin" />
        ) : status === 'error' ? (
          <AlertCircle className="text-destructive size-4" />
        ) : (
          <FileText className="size-4" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-medium">{name}</span>
        <span className={cn('block text-[11px]', status === 'error' ? 'text-destructive' : 'text-muted-foreground')}>
          {status === 'reading' ? 'Lendo…' : status === 'error' ? error : formatBytes(size)}
        </span>
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground ml-auto rounded p-0.5"
          aria-label={`Remover ${name}`}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
