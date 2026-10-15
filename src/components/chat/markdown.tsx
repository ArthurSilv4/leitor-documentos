import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { MermaidDiagram } from '@/components/visual/mermaid'

type HastNode = { type: string; value?: string; tagName?: string; properties?: { className?: unknown }; children?: HastNode[] }

function textOf(node: HastNode): string {
  return node.value ?? (node.children ?? []).map(textOf).join('')
}

// Blocos ```mermaid da resposta viram diagrama; durante o streaming,
// esperam o bloco terminar para não desenhar código incompleto.
function components(isStreaming: boolean): Components {
  return {
    pre({ node, children }) {
      const code = (node as HastNode | undefined)?.children?.find((c) => c.tagName === 'code')
      const classes = code?.properties?.className
      const isMermaid = Array.isArray(classes) && classes.includes('language-mermaid')
      if (!code || !isMermaid) return <pre>{children}</pre>
      if (isStreaming) return <div className="bg-muted not-prose my-4 h-32 animate-pulse rounded-lg" aria-hidden />
      const source = textOf(code)
      return (
        <div className="not-prose bg-card my-4 rounded-xl border p-4">
          <MermaidDiagram label="Diagrama" build={() => source} />
        </div>
      )
    },
  }
}

export function Markdown({ children, isStreaming = false }: { children: string; isStreaming?: boolean }) {
  return (
    <div className="prose prose-neutral dark:prose-invert prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-foreground prose-headings:font-semibold prose-th:text-left max-w-none text-[15px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components(isStreaming)}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
