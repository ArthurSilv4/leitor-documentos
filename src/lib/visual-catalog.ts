import { defineCatalog } from '@json-render/core'
import { schema } from '@json-render/react/schema'
import { shadcnComponentDefinitions as shadcn } from '@json-render/shadcn/catalog'
import { z } from 'zod'

// Catálogo do painel visual que acompanha as respostas do chat.
// Só contém schemas Zod: é usado no navegador (renderização) e no
// servidor (extração dos blocos e composição com o Jev).

const point = z.object({ label: z.string(), value: z.number() })

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
}

export const catalog = defineCatalog(schema, {
  components: visualComponents,
  actions: {},
})

// Componentes que o extrator pode preencher com conteúdo dos documentos.
// Stack e Grid são estruturas de layout adicionadas pelo servidor.
export const contentComponents = [
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
