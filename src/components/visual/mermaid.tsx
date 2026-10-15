import { useEffect, useId, useState } from 'react'

// Renderiza código Mermaid com as cores do tema atual da página.

// O Mermaid não entende oklch: converte a cor do token para hex,
// compondo sobre o fundo para resolver transparências.
function tokenToHex(token: string, ctx: CanvasRenderingContext2D, base: string): string {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  document.body.appendChild(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 1, 1)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function themeColors() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const card = tokenToHex('--card', ctx, '#ffffff')
  const hex = (token: string) => tokenToHex(token, ctx, card)
  return {
    card,
    foreground: hex('--foreground'),
    muted: hex('--muted'),
    mutedForeground: hex('--muted-foreground'),
    border: hex('--border'),
    primary: hex('--primary'),
  }
}

export type ThemeColors = ReturnType<typeof themeColors>

// Muda quando a página troca entre claro e escuro.
function useDarkClass() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setDark(root.classList.contains('dark')))
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

// O Mermaid tem configuração global: uma renderização por vez.
let queue: Promise<unknown> = Promise.resolve()

async function renderSvg(id: string, code: string, colors: ThemeColors) {
  const { default: mermaid } = await import('mermaid')
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    look: 'classic',
    theme: 'base',
    fontFamily: getComputedStyle(document.body).fontFamily,
    themeVariables: {
      fontSize: '13px',
      background: colors.card,
      primaryColor: colors.card,
      primaryTextColor: colors.foreground,
      primaryBorderColor: colors.mutedForeground,
      secondaryColor: colors.muted,
      tertiaryColor: colors.muted,
      lineColor: colors.mutedForeground,
      textColor: colors.foreground,
      edgeLabelBackground: colors.card,
      actorBkg: colors.muted,
      actorBorder: colors.border,
      actorTextColor: colors.foreground,
      actorLineColor: colors.border,
      signalColor: colors.mutedForeground,
      signalTextColor: colors.foreground,
      sequenceNumberColor: colors.card,
    },
    flowchart: { curve: 'basis', padding: 12 },
    sequence: { showSequenceNumbers: true, mirrorActors: false },
  })
  const { svg } = await mermaid.render(id, code)
  return svg
}

export function MermaidDiagram({
  build,
  label,
}: {
  /** Gera o código Mermaid a partir das cores do tema */
  build: (colors: ThemeColors) => string
  label: string
}) {
  const dark = useDarkClass()
  const id = 'mmd-' + useId().replace(/[^a-zA-Z0-9]/g, '')
  const [state, setState] = useState<{ svg?: string; error?: string }>({})

  useEffect(() => {
    let cancelled = false
    const colors = themeColors()
    const code = build(colors)
    const job = queue.then(() =>
      renderSvg(id, code, colors)
        .then((svg) => !cancelled && setState({ svg }))
        .catch((err: unknown) => {
          console.warn('Mermaid:', err, '\n' + code)
          if (!cancelled) setState({ error: err instanceof Error ? err.message : String(err) })
        }),
    )
    queue = job
    return () => {
      cancelled = true
    }
    // build é recriado a cada render; o conteúdo do diagrama muda junto com label
  }, [id, dark, label])

  if (state.error) {
    return <p className="text-muted-foreground text-xs">Não foi possível desenhar o diagrama.</p>
  }
  if (!state.svg) {
    return <div className="bg-muted h-40 animate-pulse rounded-lg" aria-hidden />
  }
  return (
    <div
      role="img"
      aria-label={label}
      className="overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  )
}
