import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function VisualFrame({
  title,
  description,
  action,
  className,
  children,
}: {
  title?: string | null
  description?: string | null
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('bg-card w-full min-w-0 rounded-xl border p-4', className)}>
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {description && <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
