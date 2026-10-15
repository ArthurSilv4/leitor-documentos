# Prompt: componentes visuais didáticos no chat existente

> Cole tudo abaixo da linha no agente de código (Claude Code, Cursor etc.), aberto no repositório do seu chat.
> Antes, preencha os campos marcados com `<<…>>`. Se o agente não tiver acesso ao repositório de referência, anexe a pasta `src/` e `server/` do `leitor-documentos`.

---

## Contexto

Tenho um chat com IA que já funciona: responde perguntas usando RAG (busca em documentos) e chama outras ferramentas. Quero acrescentar **componentes visuais didáticos** nas respostas, para pessoas **não técnicas** entenderem o conteúdo: explicadores interativos que vão além do texto (jornada de um processo, guia "E se…?", quem faz o quê, simuladores etc.), escolhidos por um modelo de decisão (Jev) e desenhados com json-render.

Já existe uma implementação de referência funcionando, que você deve usar como base e adaptar:

- Repositório: `https://github.com/ArthurSilv4/leitor-documentos` (branch `main`)
- Galeria com todos os componentes funcionando: `src/components/gallery.tsx` (no app, link "Componentes visuais" ou endereço com `#galeria`)

Informações do meu ambiente:

- Provedor de modelos do chat: `<<ex.: OpenRouter / Anthropic / OpenAI / Azure>>`
- Onde acontece a busca do RAG: `<<arquivo/função, se souber>>`
- Público: pessoas não técnicas, português do Brasil
- Chave do Jev: OpenRouter (`OPENROUTER_API_KEY`, modelo `typesafe/jev-1.14`) `<<ou Vercel AI Gateway: AI_GATEWAY_API_KEY, modelo typesafe-ai/jev>>`

## Como trabalhar

1. **Primeiro entenda o meu chat, sem mudar nada.** Descubra e me mostre num resumo curto:
   - stack do front e do back, e se o front é React (o renderer do json-render é para React);
   - como a resposta chega ao navegador (SSE, WebSocket, fetch com stream, resposta inteira) e o formato dos eventos;
   - onde o RAG busca os trechos, o que volta de cada trecho (texto, fonte, página, id) e quantos trechos entram no prompt;
   - como as ferramentas são chamadas (tool calling do modelo, agente próprio, LangChain etc.);
   - onde as mensagens são salvas e como são renderizadas (markdown? qual biblioteca?).
2. **Proponha um plano** de integração com base no que encontrou, apontando os pontos de encaixe (arquivos e funções) e qualquer diferença em relação à referência. Espere minha aprovação antes de implementar.
3. **Implemente em fases pequenas**, cada uma funcionando e testada antes da próxima (fases no fim deste prompt).
4. Siga o estilo do código que já existe (nomes, organização, comentários). Não reescreva partes do chat que não precisam mudar.

## O que construir

### Fluxo de cada pergunta

O texto da resposta **não pode ficar mais lento**. Em paralelo a ele:

1. **Decisão (Jev):** uma pergunta de escolha `visual` ou `texto`: "um explicador interativo ajudaria de verdade a entender a resposta?". Visual só para processo/status, dúvida que depende da situação da pessoa, o que cada perfil pode fazer, consequências de uma ação, regra com exemplos, prazo ou conta que a pessoa pode testar, tela do sistema, comparação, números. Texto para perguntas pontuais, sim/não, definição curta, pedidos de redação, conversa. **Na dúvida, texto.** Referência: `visualGateQuestions` em `src/lib/chat-runner.ts`.
2. **Extração:** se for visual, um modelo de linguagem lê **os trechos que o RAG já recuperou para esta pergunta** (não o documento inteiro) e a conversa, e devolve até 8 blocos em JSON `{"blocks":[{"component","description","props"}]}`. Referência: `extractionInstructions`, `extractionInput` e `blocksToCandidates` em `src/lib/visual-extract.ts`. Inclua no contexto a fonte de cada trecho, para o bloco não misturar documentos.
3. **Validação:** cada bloco passa pelo schema Zod do componente; nulls omitidos são preenchidos (`fillNulls` recursivo); **bloco inválido é descartado, nunca "consertado" à força**.
4. **Composição (Jev):** `experimental_composeSpec` do `@json-render/core` escolhe quais blocos entram e como agrupar. Referência: `prepareVisual` em `src/lib/chat-runner.ts` e o avaliador em `server/evaluator.ts` (Decisions API da OpenRouter ou Vercel AI Gateway).
5. **Exibição progressiva:** os visuais aparecem no fim da resposta assim que ficam prontos, mesmo com o texto ainda chegando.
6. **Posicionamento (Jev):** quando texto e visuais terminam, uma pergunta de escolha por visual: "depois de qual trecho ele mais ajuda?" (trechos de `splitBlocks` em `src/lib/answer-format.ts`). O front move cada visual para lá. Se falhar, ficam no fim. Referência: `placeVisuals`.
7. **Próximas perguntas:** o prompt da resposta pede, na última linha, `[[sugestoes: P1? | P2? | P3?]]`. O front tira esse marcador do texto e do histórico enviado ao modelo e mostra botões que enviam a pergunta. Referência: `parseAnswer`.

Se o seu chat já tem um agente com ferramentas, **não transforme os visuais numa ferramenta do agente principal**: rodar em paralelo, como acima, não atrasa a resposta nem deixa o agente decidir desenhar o tempo todo. Se houver um motivo forte para fazer diferente, explique antes.

### Eventos para o navegador

Acrescente ao stream existente (adaptando ao formato que já existe), como em `src/lib/chat-protocol.ts`:

- `visual` com `status`: `deciding | extracting | composing | done | skipped | error` (e `placement: inline | panel`);
- `spec` com a spec do json-render;
- `placement` com `anchors: { idDoVisual: índiceDoTrecho }`.

Enquanto o status é `deciding`, nada aparece na tela. Em `extracting`/`composing`, uma linha discreta: "Lendo o documento para preparar os desenhos…". Salve `spec` e `anchors` junto da mensagem, para a conversa reabrir igual.

### Catálogo (o que a IA pode usar)

Copie `src/lib/visual-catalog.ts` e os componentes de `src/components/visual/`. Para a IA, use **só** estes (`contentComponents`):

| Componente | Para quê |
|---|---|
| `Journey` | Processo ou ciclo de status em etapas clicáveis, com desvios "E se…?" |
| `DecisionGuide` | Perguntas simples levam à resposta da situação da pessoa |
| `RoleExplorer` | Escolhe um perfil e vê o que pode e o que não pode |
| `ActionEffect` | "Quando X faz Y…": muda a situação, quem é avisado, o que fica registrado |
| `RuleExamples` | Uma regra com situações concretas de "pode" e "não pode" |
| `ScreenMap` | Esboço de uma tela com áreas numeradas |
| `Concept` | Conceito com analogia do dia a dia ("É como…") |
| `Comparison` | 2 ou 3 opções lado a lado |
| `Simulator` | A pessoa muda valores e vê o resultado (fórmulas seguras) |
| `DeadlineCheck` | A pessoa escolhe data e hora e vê se a antecedência permite |
| `Quiz` | 1 a 3 perguntas para conferir o entendimento |
| `Metric`, `BarChart`, `LineChart`, `PieChart`, `Timeline` | Números, partes de um todo, datas |

Tabelas e fluxogramas simples ficam **no texto** (markdown e blocos ```` ```mermaid ````), não viram componente. Os componentes antigos do catálogo (`Flow`, `Sequence`, `PermissionMatrix`, `Glossary` etc.) existem só para conversas antigas; não os ofereça à IA.

### Regras que não podem ser quebradas

- **Nada de código vindo da IA.** O `Simulator` usa a calculadora de `src/lib/formula.ts` (sem `eval`/`Function`): só números, ids das entradas, `+ - * / %`, comparações, `&& || !` e `min max round floor ceil abs`. Fórmula inválida = bloco descartado. Leve junto os testes da calculadora, incluindo tentativas como `alert(1)`, `constructor`, `window.location`.
- **Só conteúdo dos trechos recuperados.** Nada de inventar números, regras, perfis ou exemplos. Se o RAG não trouxe base, não há visual.
- **Linguagem para não técnicos** nos visuais e na resposta: palavras do dia a dia, siglas explicadas, sem nomes internos, parâmetros ou campos técnicos. Veja `answerSystemPrompt` em `src/lib/prompts.ts` e adapte ao prompt de sistema que já existe, sem apagar o que ele já faz.
- **Interface sem jargão:** não mostrar nomes de modelos ("Jev", "OpenRouter") para o usuário. Erros em linguagem simples com "Tentar de novo" e o detalhe técnico escondido em "Detalhes para o suporte" (`src/lib/friendly-error.ts`).
- **Acessibilidade e gráficos:** estado sempre com ícone e texto, nunca só cor; gráficos com botão "ver em tabela"; paleta categórica fixa e validada para daltonismo (tokens `--viz-series-1..5` em `src/index.css`, claro e escuro); funciona no celular (a jornada vira lista vertical).
- **Falhas não quebram a resposta:** se decisão, extração, composição ou posicionamento falharem, o texto chega normalmente e os visuais somem ou ficam no fim.
- **Chaves só no servidor.**

### Controles do usuário

- Botão no campo de mensagem: **Desenhos: automático / sempre / nunca** (salvo no navegador).
- Em respostas sem desenhos: botão **Explicar com desenhos**, que gera os visuais só para aquela resposta (`answer: false`, `visual: 'always'`).
- Galeria **Componentes visuais** acessível no app, com exemplos do nosso domínio, para o time conhecer o que existe.

## Fases

1. **Base visual:** dependências (`@json-render/core`, `@json-render/react`, `@json-render/shadcn`, `zod`, `recharts`, `mermaid`, Tailwind se ainda não houver), catálogo, componentes, registry e a galeria com exemplos. *Pronto quando:* a galeria abre e todos os componentes funcionam em claro, escuro e celular.
2. **Pipeline no servidor:** decisão, extração a partir dos trechos do RAG, validação, composição e posicionamento, rodando em paralelo ao texto. *Pronto quando:* testes com modelos simulados mostram a ordem `deciding → extracting → (texto já chegando) → composing → spec → done → placement`, e pergunta pontual não chama a extração.
3. **Front:** eventos novos no stream, visuais aparecendo aos poucos e mudando de lugar, sugestões, controles e mensagens de erro. *Pronto quando:* uma conversa salva reabre com visuais nos lugares certos.
4. **Ajuste com perguntas reais:** rode pelo menos 10 perguntas reais sobre os nossos documentos (metade pontuais, metade sobre processos/regras) e me mostre: quantas ganharam visual, quais componentes, tempo até o primeiro texto e até o visual, e qualquer bloco descartado e por quê.

## O que me entregar no fim

- Resumo do que mudou, arquivo por arquivo.
- Como rodar e quais variáveis de ambiente configurar.
- Resultado da fase 4, com prints.
- Riscos ou decisões em aberto (custo por pergunta, limites de contexto do Jev, desempenho).
