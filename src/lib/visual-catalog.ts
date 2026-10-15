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

  // Explicadores: vão além do que texto, tabela ou diagrama já mostram
  Journey: {
    props: z
      .object({
        title: z.string(),
        description: z.string().nullable(),
        steps: z
          .array(z.object({ id: z.string(), title: z.string(), who: z.string().nullable(), detail: z.string().nullable() }))
          .min(2)
          .max(8),
        detours: z
          .array(z.object({ from: z.string(), label: z.string(), result: z.string() }))
          .max(10)
          .nullable(),
      })
      .refine((j) => {
        const ids = new Set(j.steps.map((s) => s.id))
        return (j.detours ?? []).every((d) => ids.has(d.from))
      }, 'Desvio aponta para etapa inexistente'),
    description:
      'Jornada guiada de um processo: o caminho principal em etapas clicáveis (quem faz e o que acontece) e os desvios "E se…?" que saem de cada etapa. Use para processos e ciclos de status',
  },
  DecisionGuide: {
    props: z
      .object({
        title: z.string(),
        start: z.string(),
        nodes: z
          .array(
            z.object({
              id: z.string(),
              question: z.string().nullable(),
              options: z.array(z.object({ label: z.string(), next: z.string() })).min(2).max(4).nullable(),
              answer: z.string().nullable(),
              tone: z.enum(['ok', 'attention', 'blocked']).nullable(),
            }),
          )
          .min(3)
          .max(12),
      })
      .refine((g) => {
        const ids = new Set(g.nodes.map((n) => n.id))
        return (
          ids.has(g.start) &&
          g.nodes.every((n) =>
            n.options ? !!n.question && n.options.every((o) => ids.has(o.next)) : !!n.answer,
          )
        )
      }, 'Guia de decisão com caminhos quebrados'),
    description:
      'Guia "E se…?" interativo: a pessoa responde perguntas simples sobre a situação dela e chega à resposta certa. Cada nó tem pergunta com opções (2 a 4) ou uma resposta final (tone: ok, attention ou blocked)',
  },
  RoleExplorer: {
    props: z.object({
      title: z.string(),
      roles: z
        .array(
          z.object({
            name: z.string(),
            icon: z.enum(['pessoa', 'autoridade', 'empresa', 'operador', 'externo', 'sistema', 'celular']).nullable(),
            summary: z.string().nullable(),
            can: z.array(z.string()).min(1).max(8),
            cannot: z.array(z.string()).max(6).nullable(),
          }),
        )
        .min(2)
        .max(6),
    }),
    description: 'Quem faz o quê: a pessoa escolhe um perfil e vê, em linguagem simples, o que ele pode e o que não pode fazer',
  },
  ActionEffect: {
    props: z.object({
      actor: z.string().nullable(),
      action: z.string(),
      effects: z
        .array(z.object({ kind: z.enum(['status', 'aviso', 'registro', 'acesso', 'prazo', 'outro']), text: z.string() }))
        .min(1)
        .max(6),
      note: z.string().nullable(),
    }),
    description:
      'O que acontece quando alguém faz uma ação: mudança de situação, quem é avisado, o que fica registrado, prazos. actor e action formam a frase "Quando <actor> <action>"',
  },
  RuleExamples: {
    props: z.object({
      rule: z.string(),
      why: z.string().nullable(),
      examples: z
        .array(z.object({ situation: z.string(), allowed: z.boolean(), explanation: z.string().nullable() }))
        .min(2)
        .max(5),
    }),
    description: 'Uma regra explicada com situações concretas: exemplos do que pode e do que não pode, e por quê',
  },
  ScreenMap: {
    props: z.object({
      title: z.string(),
      regions: z
        .array(
          z.object({
            label: z.string(),
            area: z.enum(['topo', 'esquerda', 'centro', 'direita', 'rodape']),
            description: z.string(),
          }),
        )
        .min(2)
        .max(8),
    }),
    description: 'Mapa de uma tela: um esboço simples com as áreas numeradas e o que cada uma faz. Use quando o documento descreve telas',
  },
  Quiz: {
    props: z
      .object({
        title: z.string().nullable(),
        questions: z
          .array(
            z.object({
              question: z.string(),
              options: z.array(z.string()).min(2).max(4),
              correct: z.number().int().min(0),
              explanation: z.string(),
            }),
          )
          .min(1)
          .max(3),
      })
      .refine((q) => q.questions.every((x) => x.correct < x.options.length), 'Resposta certa fora das opções'),
    description: 'Teste rápido de entendimento: 1 a 3 perguntas de múltipla escolha com a explicação de cada resposta',
  },
}

export const catalog = defineCatalog(schema, {
  components: visualComponents,
  actions: {},
})

// Componentes que o extrator pode preencher com conteúdo dos documentos.
// Fluxogramas, listas, tabelas e glossários ficam no texto (markdown e
// Mermaid); os antigos continuam no catálogo para conversas já salvas.
export const contentComponents = [
  'Journey',
  'DecisionGuide',
  'RoleExplorer',
  'ActionEffect',
  'RuleExamples',
  'ScreenMap',
  'Concept',
  'Comparison',
  'Quiz',
  'Metric',
  'BarChart',
  'LineChart',
  'Timeline',
] as const satisfies readonly (keyof typeof visualComponents)[]

export type ContentComponent = (typeof contentComponents)[number]
