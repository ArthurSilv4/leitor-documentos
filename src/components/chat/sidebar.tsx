import { FileText, MessageSquare, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { Conversation } from '@/lib/chat-types'
import { cn } from '@/lib/utils'

export function Sidebar({
  conversations,
  activeId,
  onNew,
  onSelect,
  onRemove,
}: {
  conversations: Conversation[]
  activeId: string | null
  onNew: () => void
  onSelect: (id: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <aside className="bg-sidebar text-sidebar-foreground flex h-full w-64 flex-col border-r">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-lg">
          <FileText className="size-4" />
        </span>
        <span className="font-serif text-lg">Leitor</span>
      </div>

      <div className="px-3">
        <Button variant="ghost" className="w-full justify-start" onClick={onNew}>
          <Plus /> Nova conversa
        </Button>
      </div>

      <p className="text-muted-foreground mt-4 px-5 pb-1 text-xs font-medium">Recentes</p>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {conversations.map((c) => (
          <div
            key={c.id}
            className={cn(
              'group hover:bg-sidebar-accent flex items-center rounded-md',
              c.id === activeId && 'bg-sidebar-accent',
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(c.id)}
              className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-sm"
            >
              <MessageSquare className="text-muted-foreground size-3.5 shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              className="text-muted-foreground hover:text-foreground mr-1 rounded p-1.5 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              aria-label={`Apagar ${c.title}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {conversations.length === 0 && (
          <p className="text-muted-foreground px-2.5 py-2 text-sm">Nenhuma conversa ainda.</p>
        )}
      </nav>
    </aside>
  )
}
