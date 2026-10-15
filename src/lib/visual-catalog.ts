import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { shadcnComponentDefinitions as shadcn } from '@json-render/shadcn/catalog'
import { z } from 'zod'

// Catálogo do painel visual que acompanha as respostas do chat.
// Só contém schemas Zod: é usado no navegador (renderização) e no
// servidor (extração dos blocos e composição com o Jev).

const point = z.object({ label: z.string(), value: z.number() })

// Diagramas: as arestas precisam apontar para nós que existem.
const flowProps = z
  .object({
    title: z.string(),
    description: z.string().nullable(),
    direction: z.enum(['TD', 'LR']).nullable(),
    nodes: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          kind: z.enum(['start', 'step', 'decision', 'end', 'legacy']).nullable(),
        }),
      )
      .min(2)
      .max(16),
    edges: z
      .array(z.object({ from: z.string(), to: z.string(), label: z.string().nullable() }))
      .min(1)
      .max(30),
  })
  .refine(
    (f) => {
      const ids = new Set(f.nodes.map((n) => n.id))
      return f.edges.every((e) => ids.has(e.from) && ids.has(e.to))
    },
    { message: 'Toda aresta precisa ligar nós existentes' },
  )

const sequenceProps = z
  .object({
    title: z.string(),
    description: z.string().nullable(),
    participants: z.array(z.string()).min(2).max(6),
    messages: z
      .array(z.object({ from: z.string(), to: z.string(), text: z.string(), reply: z.boolean().nullable() }))
      .min(1)
      .max(20),
  })
  .refine(
    (s) => s.messages.every((m) => s.participants.includes(m.from) && s.participants.includes(m.to)),
    { message: 'Mensagens só entre participantes listados' },
  )

export const visualComponents = {
  // Layout
  Stack: shadcn.Stack,
  Grid: shadcn.Grid,

  // Conteúdo (shadcn)
  Table: shadcn.Table,
  Alert: shadcn.Alert,
  Accordion: shadcn.Accordion,

  // Conteúdo (próprios)
  Metric: {
    props: z.object({
      label: z.string(),
      value: z.string(),
      detail: z.string().nullable(),
      trend: z.enum(['up', 'down', 'neutral']).nullable(),
    }),
    description: 'Número-chave em destaque (valor, total, percentual) com rótulo curto',
  },
  BarChart: {
    props: z.object({
      title: z.string(),
      description: z.string().nullable(),
      unit: z.string().nullable(),
      data: z.array(point).min(2).max(15),
    }),
    description: 'Gráfico de barras horizontais para comparar valores numéricos entre categorias',
  },
  LineChart: {
    props: z.object({
      title: z.string(),
      description: z.string().nullable(),
      unit: z.string().nullable(),
      data: z.array(point).min(3).max(40),
    }),
    description: 'Gráfico de linha para mostrar a evolução de um valor ao longo do tempo',
  },
  Timeline: {
    props: z.object({
      title: z.string(),
      items: z
        .array(z.object({ date: z.string(), title: z.string(), description: z.string().nullable() }))
        .min(2)
        .max(15),
    }),
    description: 'Linha do tempo com eventos em ordem cronológica',
  },
  KeyPoints: {
    props: z.object({
      title: z.string(),
      points: z.array(z.string()).min(2).max(8),
    }),
    description: 'Lista curta de pontos principais ou conclusões',
  },
  Steps: {
    props: z.object({
      title: z.string(),
      steps: z
        .array(z.object({ title: z.string(), description: z.string().nullable() }))
        .min(2)
        .max(12),
    }),
    description: 'Processo ou procedimento em etapas numeradas',
  },
  Quote: {
    props: z.object({
      text: z.string(),
      source: z.string().nullable(),
    }),
    description: 'Trecho literal do documento que embasa a resposta',
  },

  // Didáticos: explicam estrutura, fluxos, papéis e conceitos
  Flow: {
    props: flowProps,
    description:
      'Diagrama de fluxo com setas: ciclo de vida de status, fluxo de um processo ou caminhos de decisão. Cada aresta pode ter um rótulo com a ação e quem a faz',
  },
  Sequence: {
    props: sequenceProps,
    description:
      'Diagrama de sequência: quem envia o quê para quem, em ordem, num processo entre vários atores (pessoas ou sistemas)',
  },
  PermissionMatrix: {
    props: z.object({
      title: z.string(),
      roles: z.array(z.string()).min(2).max(6),
      actions: z
        .array(
          z.object({
            action: z.string(),
            access: z.array(z.enum(['yes', 'no', 'partial'])),
            note: z.string().nullable(),
          }),
        )
        .min(2)
        .max(20),
    }).refine((m) => m.actions.every((a) => a.access.length === m.roles.length), {
      message: 'Cada ação precisa de um acesso por perfil',
    }),
    description:
      'Matriz de permissões: o que cada perfil pode ou não fazer. access tem um valor por perfil, na mesma ordem de roles',
  },
  Glossary: {
    props: z.object({
      title: z.string(),
      terms: z
        .array(z.object({ term: z.string(), aliases: z.string().nullable(), definition: z.string() }))
        .min(2)
        .max(12),
    }),
    description: 'Glossário com termos, sinônimos e definições curtas',
  },
  Comparison: {
    props: z.object({
      title: z.string(),
      items: z
        .array(z.object({ name: z.string(), summary: z.string().nullable(), points: z.array(z.string()).min(1).max(6) }))
        .min(2)
        .max(3),
    }),
    description: 'Comparação lado a lado entre 2 ou 3 opções, perfis ou modos',
  },
  Concept: {
    props: z.object({
      term: z.string(),
      definition: z.string(),
      purpose: z.string().nullable(),
      example: z.string().nullable(),
      analogy: z.string().nullable(),
    }),
    description: 'Explicação didática de um conceito: o que é, para que serve, exemplo e uma analogia do dia a dia',
  },
  FeatureMap: {
    props: z.object({
      title: z.string(),
      groups: z
        .array(z.object({ name: z.string(), description: z.string().nullable(), items: z.array(z.string()).min(1).max(10) }))
        .min(2)
        .max(8),
    }),
    description: 'Mapa da estrutura de um sistema ou documento: grupos (módulos, áreas) e o que cada um contém',
  },
}

export const catalog = defineCatalog(schema, {
  components: visualComponents,
  actions: {},
})

// Componentes que o extrator pode preencher com conteúdo dos documentos.
// Stack e Grid são estruturas de layout adicionadas pelo servidor.
export const contentComponents = [
  'Flow',
  'Sequence',
  'PermissionMatrix',
  'Concept',
  'Comparison',
  'FeatureMap',
  'Glossary',
  'Metric',
  'BarChart',
  'LineChart',
  'Timeline',
  'KeyPoints',
  'Steps',
  'Table',
  'Alert',
  'Accordion',
  'Quote',
] as const satisfies readonly (keyof typeof visualComponents)[]

export type ContentComponent = (typeof contentComponents)[number]
