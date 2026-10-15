import { JSONUIProvider, Renderer } from '@json-render/react'
import { LayoutDashboard, Loader2 } from 'lucide-react'

import type { Visual } from '@/lib/chat-types'
import { registry } from '@/lib/visual-registry'

const statusText = {
  extracting: 'Procurando dados para visualizar…',
  composing: 'Escolhendo e organizando os componentes…',
}

export function VisualPanel({ visual, isStreaming }: { visual: Visual; isStreaming: boolean }) {
  // Enquanto o Jev decide, nada aparece: a maioria das respostas não terá painel.
  if (visual.status === 'skipped' || visual.status === 'deciding') return null

  if (visual.status === 'error') {
    return (
      <p className="text-muted-foreground mt-4 text-xs">
        Não foi possível gerar o painel visual: {visual.message}
      </p>
    )
  }

  const working = visual.status === 'extracting' || visual.status === 'composing'
  const spec = visual.spec?.root ? visual.spec : null

  return (
    <div className="bg-muted/40 mt-5 rounded-2xl border p-3">
      <div className="text-muted-foreground mb-3 flex items-center gap-2 px-1 text-xs">
        {working && isStreaming ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <LayoutDashboard className="size-3.5" />
        )}
        <span>
          {working
            ? statusText[visual.status as keyof typeof statusText]
            : `Painel visual · composto por ${visual.evaluator ?? 'Jev'}${
                visual.elapsedMs ? ` em ${(visual.elapsedMs / 1000).toFixed(1)}s` : ''
              }`}
        </span>
      </div>

      {spec ? (
        <JSONUIProvider registry={registry} initialState={spec.state ?? {}}>
          <Renderer spec={spec} registry={registry} loading={working} />
        </JSONUIProvider>
      ) : (
        <div className="space-y-2" aria-hidden>
          <div className="bg-muted h-20 animate-pulse rounded-xl" />
          <div className="bg-muted h-36 animate-pulse rounded-xl" />
        </div>
      )}
    </div>
  )
}
