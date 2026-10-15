// Exemplos da galeria de componentes, com conteúdo do documento do iCONFERE.
// Cada exemplo passa pela mesma validação dos blocos gerados pela IA.

export type GallerySample = {
  component: string
  name: string
  when: string
  props: Record<string, unknown>
}

export type GallerySection = { title: string; description: string; samples: GallerySample[] }

export const gallerySections: GallerySection[] = [
  {
    title: 'Explicadores interativos',
    description: 'A pessoa clica, escolhe e explora. Vão além do que um texto ou uma tabela consegue mostrar.',
    samples: [
      {
        component: 'Journey',
        name: 'Jornada guiada',
        when: 'Processos e ciclos de situação (status), com os desvios "E se…?" de cada etapa.',
        props: {
          title: 'O caminho de um pedido',
          description: 'Clique em cada etapa para ver o que acontece',
          steps: [
            { id: 'criar', title: 'Pedido criado', who: 'Terminal', detail: 'O terminal pede a conferência e escolhe a data e os horários, com pelo menos 24 horas de antecedência.' },
            { id: 'aprovar', title: 'Aprovação', who: 'Fiscal do órgão', detail: 'O fiscal confere a data e os horários e aprova. O terminal recebe um e-mail com convite de calendário.' },
            { id: 'executar', title: 'Conferência', who: 'Fiscal e operador', detail: 'A sala de vídeo é aberta: o operador mostra a carga pelo celular e o fiscal tira fotos.' },
            { id: 'laudo', title: 'Laudo emitido', who: 'Fiscal', detail: 'O fiscal finaliza e registra o resultado. A conferência fica como Executada.' },
          ],
          detours: [
            { from: 'aprovar', label: 'O fiscal propõe outra data', result: 'já fica aprovada na nova data, sem precisar de aceite do terminal' },
            { from: 'aprovar', label: 'O fiscal recusa sem nova data', result: 'o pedido é cancelado de vez; é preciso criar outro' },
            { from: 'laudo', label: 'Precisa revisar algo', result: 'só o fiscal do órgão pode reabrir a conferência' },
          ],
        },
      },
      {
        component: 'DecisionGuide',
        name: 'Guia "E se…?"',
        when: 'Dúvidas em que a resposta depende da situação da pessoa ("posso…?", "o que faço se…?").',
        props: {
          title: 'Preciso mudar a data. E agora?',
          start: 'q1',
          nodes: [
            { id: 'q1', question: 'A conferência já foi realizada?', options: [{ label: 'Sim, já tem laudo', next: 'a1' }, { label: 'Não, ainda não aconteceu', next: 'q2' }] },
            { id: 'q2', question: 'O pedido já foi aprovado pelo fiscal?', options: [{ label: 'Sim, está aprovado', next: 'a2' }, { label: 'Não, está aguardando', next: 'a3' }] },
            { id: 'a1', answer: 'Não dá para editar uma conferência já realizada.', tone: 'blocked' },
            { id: 'a2', answer: 'Você pode editar a data, mas o pedido volta para Aguardando Aprovação e o fiscal precisa aprovar de novo.', tone: 'attention' },
            { id: 'a3', answer: 'Pode editar a data normalmente; o fiscal vai analisar com a data nova.', tone: 'ok' },
          ],
        },
      },
      {
        component: 'RoleExplorer',
        name: 'Quem faz o quê',
        when: 'Perfis e papéis: o que cada pessoa pode e não pode fazer.',
        props: {
          title: 'Quem faz o quê',
          roles: [
            { name: 'Fiscal do órgão', icon: 'autoridade', summary: 'Da Receita Federal, ANVISA ou MAPA.', can: ['Aprovar ou recusar pedidos do seu órgão', 'Propor outra data', 'Realizar a conferência e emitir o laudo', 'Reabrir uma conferência já realizada'], cannot: ['Ver pedidos de outros órgãos'] },
            { name: 'Funcionário do terminal', icon: 'empresa', can: ['Criar, editar e cancelar pedidos', 'Realizar a conferência'], cannot: ['Aprovar ou recusar pedidos', 'Reabrir conferência'] },
            { name: 'Despachante ou cliente', icon: 'externo', summary: 'Pessoas de fora vinculadas ao pedido.', can: ['Acompanhar a conferência pelo vídeo', 'Mandar mensagens'], cannot: ['Aprovar, cancelar ou editar', 'Abrir a sala sozinho'] },
          ],
        },
      },
      {
        component: 'ActionEffect',
        name: 'O que acontece quando…',
        when: 'Consequências de uma ação: muda a situação, quem é avisado, o que fica registrado.',
        props: {
          actor: 'o fiscal',
          action: 'aprova o pedido',
          effects: [
            { kind: 'status', text: 'O pedido passa para Aprovada.' },
            { kind: 'aviso', text: 'O terminal e quem criou o pedido recebem um e-mail com convite de calendário.' },
            { kind: 'registro', text: 'O histórico guarda quem aprovou e quando.' },
            { kind: 'acesso', text: 'A sala da conferência fica garantida para o horário.' },
          ],
          note: 'Quem aprovou não recebe o próprio e-mail.',
        },
      },
      {
        component: 'RuleExamples',
        name: 'Regra com exemplos',
        when: 'Regras com condições ou limites, explicadas com situações concretas.',
        props: {
          rule: 'Uma conferência só pode ser marcada com pelo menos 24 horas de antecedência.',
          why: 'Dá tempo para o fiscal analisar e se organizar.',
          examples: [
            { situation: 'Hoje às 9h, marcar para amanhã às 10h', allowed: true, explanation: 'Faltam 25 horas.' },
            { situation: 'Hoje às 9h, marcar para hoje às 15h', allowed: false, explanation: 'Faltam só 6 horas.' },
            { situation: 'Sexta às 17h, marcar para segunda às 8h', allowed: true, explanation: 'Faltam mais de 60 horas.' },
          ],
        },
      },
      {
        component: 'ScreenMap',
        name: 'Mapa da tela',
        when: 'Quando o documento descreve uma tela do sistema.',
        props: {
          title: 'Conhecendo a tela principal',
          regions: [
            { label: 'Abas', area: 'topo', description: 'Escolha o que ver: todas, pedidos, conferências ou laudos.' },
            { label: 'Busca e filtros', area: 'topo', description: 'Ache um pedido pelo documento ou pela data.' },
            { label: 'Lista de pedidos', area: 'centro', description: 'Cada linha é um pedido; clique para ver os detalhes.' },
            { label: 'Botões da linha', area: 'direita', description: 'Aprovar, recusar, cancelar ou entrar na conferência.' },
          ],
        },
      },
      {
        component: 'DeadlineCheck',
        name: 'Verificador de prazo',
        when: 'Regras de antecedência: a pessoa escolhe a própria data e hora e vê se pode.',
        props: {
          title: 'Posso marcar para essa data?',
          rule: 'A conferência precisa ser marcada com pelo menos 24 horas de antecedência.',
          minHoursAhead: 24,
          maxDaysAhead: null,
          okText: 'Dá para pedir a conferência nesse horário.',
          tooSoonText: 'Falta menos de 24 horas. Escolha um horário mais tarde.',
          tooLateText: null,
        },
      },
      {
        component: 'Simulator',
        name: 'Simulador',
        when: 'Contas e regras com números: a pessoa muda os valores e vê o resultado na hora.',
        props: {
          title: 'Cabe na observação?',
          description: 'A observação ao aprovar aceita até 1.000 caracteres',
          inputs: [
            { id: 'linhas', label: 'Quantas linhas você vai escrever', kind: 'number', unit: 'linhas', min: 1, max: 30, step: 1, initial: 8 },
            { id: 'por_linha', label: 'Tamanho das linhas', kind: 'choice', initial: 60, options: [{ label: 'Curtas (~40 letras)', value: 40 }, { label: 'Médias (~60)', value: 60 }, { label: 'Longas (~90)', value: 90 }] },
          ],
          outputs: [
            { label: 'Caracteres aproximados', formula: 'linhas * por_linha', unit: null },
            { label: 'Sobram', formula: 'max(1000 - linhas * por_linha, 0)', unit: null },
          ],
          messages: [
            { when: 'linhas * por_linha > 1000', text: 'Passa do limite: resuma o texto.', tone: 'blocked' },
            { when: 'linhas * por_linha > 850', text: 'Está perto do limite.', tone: 'attention' },
            { when: 'linhas * por_linha <= 850', text: 'Cabe tranquilo.', tone: 'ok' },
          ],
        },
      },
      {
        component: 'Quiz',
        name: 'Teste seu entendimento',
        when: 'Depois de explicações longas ou cheias de regras, para conferir se ficou claro.',
        props: {
          questions: [
            { question: 'Quem pode aprovar um pedido de conferência?', options: ['O funcionário do terminal', 'O fiscal do órgão', 'O despachante'], correct: 1, explanation: 'Só o fiscal do órgão aprova; o funcionário do terminal deixou de aprovar.' },
            { question: 'Um pedido cancelado pode voltar?', options: ['Sim, basta reabrir', 'Não, é preciso criar outro'], correct: 1, explanation: 'Cancelar é definitivo.' },
          ],
        },
      },
    ],
  },
  {
    title: 'Explicações de conceito',
    description: 'Para entender uma ideia ou escolher entre opções.',
    samples: [
      {
        component: 'Concept',
        name: 'Conceito com analogia',
        when: 'Um termo ou ideia central, sempre com uma comparação do dia a dia.',
        props: {
          term: 'Conferência remota',
          definition: 'É a inspeção de uma carga feita à distância: o fiscal acompanha por vídeo, pelo celular do operador do terminal.',
          purpose: 'O fiscal não precisa ir até o terminal para conferir a carga.',
          example: 'O fiscal da ANVISA vê a carga pelo vídeo e tira fotos como prova.',
          analogy: 'uma vistoria por videochamada: o operador mostra a carga e o fiscal orienta e registra.',
        },
      },
      {
        component: 'Comparison',
        name: 'Comparação',
        when: 'Duas ou três alternativas, modos ou perfis lado a lado.',
        props: {
          title: 'Recusar: simples ou com nova data',
          items: [
            { name: 'Recusa simples', summary: 'Sem nova data', points: ['O pedido é cancelado', 'É definitivo: não volta', 'O terminal precisa criar outro'] },
            { name: 'Com nova data', summary: 'O fiscal propõe outra data', points: ['Fica aprovado na nova data na hora', 'Não precisa de aceite do terminal'] },
          ],
        },
      },
    ],
  },
  {
    title: 'Números e tempo',
    description: 'Quando o documento tem valores comparáveis ou datas.',
    samples: [
      {
        component: 'Metric',
        name: 'Número em destaque',
        when: 'Um valor importante, como um prazo ou um limite.',
        props: { label: 'Antecedência mínima', value: '24 horas', detail: 'para marcar uma conferência', trend: null },
      },
      {
        component: 'BarChart',
        name: 'Gráfico de barras',
        when: 'Comparar valores entre categorias. Tem botão para ver em tabela.',
        props: {
          title: 'Pedidos por órgão',
          description: 'Números fictícios, só para mostrar o componente',
          unit: null,
          data: [{ label: 'Receita Federal', value: 42 }, { label: 'ANVISA', value: 18 }, { label: 'MAPA', value: 11 }],
        },
      },
      {
        component: 'LineChart',
        name: 'Gráfico de linha',
        when: 'Um valor que muda ao longo do tempo.',
        props: {
          title: 'Conferências por mês',
          description: 'Números fictícios, só para mostrar o componente',
          unit: null,
          data: [{ label: 'jan', value: 32 }, { label: 'fev', value: 41 }, { label: 'mar', value: 38 }, { label: 'abr', value: 52 }, { label: 'mai', value: 60 }],
        },
      },
      {
        component: 'PieChart',
        name: 'Gráfico de pizza',
        when: 'Partes de um todo (até 5 fatias). Tem legenda com porcentagens e botão para ver em tabela.',
        props: {
          title: 'Pedidos por situação',
          description: 'Números fictícios, só para mostrar o componente',
          unit: null,
          data: [{ label: 'Executada', value: 48 }, { label: 'Aprovada', value: 21 }, { label: 'Aguardando Aprovação', value: 17 }, { label: 'Cancelada', value: 9 }],
        },
      },
      {
        component: 'Timeline',
        name: 'Linha do tempo',
        when: 'Acontecimentos com data, em ordem.',
        props: {
          title: 'Histórico do documento',
          items: [
            { date: 'mai/2026', title: 'Funcionário deixa de aprovar pedidos', description: 'A aprovação passa a ser só do fiscal do órgão.' },
            { date: '06/10/2026', title: 'Versão 1.0 do documento', description: 'Descrição das telas e funcionalidades do iCONFERE.' },
          ],
        },
      },
    ],
  },
]

// Recursos que aparecem no próprio texto da resposta (markdown).
export const textSamples = {
  table: '| Situação | O que significa |\n|---|---|\n| Aguardando Aprovação | O fiscal ainda vai analisar |\n| Aprovada | Data confirmada |\n| Executada | Conferência feita, com laudo |',
  mermaid: '```mermaid\nflowchart LR\n  A["Aguardando"] --> B["Aprovada"] --> C["Em andamento"] --> D["Executada"]\n```',
}
