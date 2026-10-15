import { useMemo } from 'react'
import type { Spec } from '@json-render/core'
import { JSONUIProvider, Renderer } from '@json-render/react'

import { registry } from '@/lib/visual-registry'

// Um visual (e seus filhos) de uma spec maior, renderizado sozinho.
export function VisualBlock({ spec, id, loading }: { spec: Spec; id: string; loading?: boolean }) {
  const subtree = useMemo(() => ({ ...spec, root: id }), [spec, id])
  return (
    <JSONUIProvider registry={registry} initialState={spec.state ?? {}}>
      <Renderer spec={subtree} registry={registry} loading={loading} />
    </JSONUIProvider>
  )
}
