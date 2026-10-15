# Leitor de Documentos

Chat no estilo do Claude para conversar com documentos. Você anexa arquivos (PDF, DOCX, TXT, MD, CSV, JSON), faz perguntas e recebe uma explicação em linguagem simples. O texto usa markdown, tabelas e fluxogramas Mermaid; quando ajuda, ganha também explicadores interativos montados com [json-render](https://json-render.dev): jornada guiada de um processo, guia "E se…?", quem faz o quê por perfil, o que acontece quando alguém faz uma ação, regra com exemplos do que pode e não pode, mapa de tela, conceito com analogia, comparação, teste rápido de entendimento, além de números e gráficos.

## Como funciona

Para cada pergunta:

1. O **Jev** (`typesafe/jev-1.14` na OpenRouter) classifica se a pergunta pede visuais (fluxos, papéis, comparações, números) ou se texto basta (pergunta pontual, definição curta, conversa). Na dúvida, fica só no texto e a resposta começa na hora.
2. Se pedir, um modelo da OpenRouter lê os documentos e extrai até 8 blocos visuais com dados reais (validados contra os schemas do catálogo), e o Jev escolhe quais respondem à pergunta e como agrupá-los (`experimental_composeSpec` do json-render).
3. A resposta em texto é gerada em streaming já sabendo quais visuais existem e posiciona cada um no ponto da explicação em que ele ajuda (marcadores `[[visual:id]]`). O json-render desenha cada visual ali, com componentes shadcn/ui; o que o texto não posicionar aparece no fim.

O público é não técnico: as respostas usam linguagem do dia a dia e explicam siglas, a interface não mostra nomes de modelos, e os erros aparecem em linguagem simples com um botão **Tentar de novo** (o detalhe técnico fica em "Detalhes para o suporte").

No campo de mensagem, o botão de modo alterna entre **Desenhos: automático** (o Jev decide), **sempre** e **nunca**. Respostas sem desenhos ganham o botão **Explicar com desenhos**, que gera os visuais sob demanda.

A galeria **Componentes visuais** (link na barra lateral, ou o endereço com `#galeria`) mostra todos os componentes funcionando, com exemplos do documento do iCONFERE.

O texto dos documentos é extraído no navegador (pdf.js e mammoth).

## Rodando

```bash
npm install
cp .env.example .env   # preencha OPENROUTER_API_KEY
npm run dev
```

Abra http://localhost:5173.

| Variável | Para quê | Padrão |
|---|---|---|
| `OPENROUTER_API_KEY` | Chave da OpenRouter (obrigatória) | — |
| `OPENROUTER_MODEL` | Modelo que responde no chat | `anthropic/claude-sonnet-4.5` |
| `OPENROUTER_EXTRACT_MODEL` | Modelo que extrai os blocos visuais | o mesmo do chat |
| `JEV_MODEL` | Modelo de decisão que compõe o painel | `typesafe/jev-1.14` (OpenRouter) ou `typesafe-ai/jev` (Vercel AI Gateway) |
| `AI_GATEWAY_API_KEY` | Opcional: roda o Jev pelo Vercel AI Gateway em vez da OpenRouter | — |

A rota `POST /api/chat` existe só no servidor de desenvolvimento do Vite (`vite.config.ts`). Para produção, use a lógica de `server/chat.ts` num backend ou função serverless.

## Versão artifact (claude.ai)

`npm run build:artifact` gera em `dist-artifact/` uma versão estática que roda como Artifact no claude.ai. Nela não há servidor: as respostas vêm do próprio Claude (capacidade `sample` do artifact), que também faz o papel de classificador no lugar do Jev. O catálogo, a extração e a composição são os mesmos.

## Estrutura

- `src/lib/chat-runner.ts`: fluxo de cada pergunta (classificação, resposta, extração e composição), usado pelo servidor e pelo artifact
- `server/chat.ts`: adaptadores da OpenRouter e do Jev para o fluxo
- `server/extract.ts`: extração dos blocos via OpenRouter
- `server/evaluator.ts`: o Jev, via OpenRouter Decisions ou Vercel AI Gateway
- `src/lib/visual-catalog.ts`: componentes que o painel pode usar (schemas Zod)
- `src/lib/visual-extract.ts`: prompt de extração e validação dos blocos
- `src/lib/browser-chat.ts`: adaptadores do Claude para a versão artifact
- `src/lib/gallery-samples.ts` e `src/components/gallery.tsx`: galeria de componentes com exemplos
- `src/hooks/use-chat.ts`: estado do chat e conversas salvas
- `src/components/chat/`: interface do chat
- `src/components/visual/explainers.tsx`: explicadores interativos (jornada, guia "E se…?", perfis, causa e efeito, regras, mapa de tela, teste)
- `src/components/visual/`: demais blocos (gráficos com Recharts, diagramas com Mermaid)

## Stack

React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, json-render, OpenRouter SDK, Recharts, Mermaid.
