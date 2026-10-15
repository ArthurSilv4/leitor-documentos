import { useMemo } from 'react'
import type { Spec } from '@json-render/core'
import { ArrowLeft } from 'lucide-react'

import { Markdown } from '@/components/chat/markdown'
import { VisualBlock } from '@/components/chat/visual-block'
import { Button } from '@/components/ui/button'
import { gallerySections, textSamples, type GallerySample } from '@/lib/gallery-samples'
import { blocksToCandidates } from '@/lib/visual-extract'

// Monta cada exemplo pelo mesmo caminho dos blocos da IA:
// validação do catálogo e renderização pelo json-render.
function SampleBlock({ sample }: { sample: GallerySample }) {
  const spec = useMemo<Spec | null>(() => {
    const [candidate] = blocksToCandidates({
      blocks: [{ component: sample.component, description: sample.name, props: sample.props }],
    })
    if (!candidate) return null
    return { root: 'sample', elements: { sample: { ...candidate.element, children: [] } }, state: {} } as Spec
  }, [sample])

  return spec ? (
    <VisualBlock spec={spec} id="sample" />
  ) : (
    <p className="text-destructive text-sm">Exemplo inválido para {sample.component}.</p>
  )
}

function Item({ name, when, children }: { name: string; when: string; children: React.ReactNode }) {
  return (
    <article className="space-y-3">
      <header>
        <h3 className="text-base font-semibold">{name}</h3>
        <p className="text-muted-foreground text-sm">{when}</p>
      </header>
      {children}
    </article>
  )
}

export function Gallery({ onClose }: { onClose: () => void }) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={onClose}>
          <ArrowLeft /> Voltar para a conversa
        </Button>

        <h1 className="mt-4 font-serif text-3xl">Componentes visuais</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Tudo o que o assistente pode usar para explicar um documento. Os exemplos usam o documento do iCONFERE e
          funcionam de verdade: clique, escolha e explore. Nas respostas, o assistente só usa um visual quando ele ajuda
          a entender.
        </p>

        {gallerySections.map((section) => (
          <section key={section.title} className="mt-10">
            <h2 className="border-b pb-2 text-xl font-semibold">{section.title}</h2>
            <p className="text-muted-foreground mt-2 text-sm">{section.description}</p>
            <div className="mt-6 space-y-10">
              {section.samples.map((sample) => (
                <Item key={sample.component} name={sample.name} when={sample.when}>
                  <SampleBlock sample={sample} />
                </Item>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-10 pb-10">
          <h2 className="border-b pb-2 text-xl font-semibold">No próprio texto</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Recursos simples que a resposta escreve direto no texto, sem componente.
          </p>
          <div className="mt-6 space-y-10">
            <Item name="Tabela" when="Organizar poucas informações em linhas e colunas.">
              <Markdown>{textSamples.table}</Markdown>
            </Item>
            <Item name="Fluxograma simples" when="Um fluxo curto, de até 8 caixas.">
              <Markdown>{textSamples.mermaid}</Markdown>
            </Item>
          </div>
        </section>
      </div>
    </div>
  )
}
