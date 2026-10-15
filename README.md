# Leitor de Documentos

Chat no estilo do Claude para conversar com documentos. Você anexa arquivos (PDF, DOCX, TXT, MD, CSV, JSON), faz perguntas, e cada resposta vem com um painel visual didático montado com [json-render](https://json-render.dev): diagramas de fluxo e de sequência, matriz de permissões, conceitos, comparações, glossário, mapa de funcionalidades, etapas, além de métricas e gráficos quando há números.

## Como funciona

Para cada pergunta, duas tarefas rodam em paralelo:

1. **Resposta em texto**: um modelo da OpenRouter responde em streaming, com base nos documentos.
2. **Painel visual**, só quando ajuda:
   - o **Jev** primeiro classifica se a pergunta pede um visual (fluxos, papéis, comparações, números) ou se texto basta (pergunta pontual, definição curta, conversa). Na dúvida, fica só no texto;
   - se pedir, outro modelo lê os documentos e extrai até 8 blocos visuais com dados reais (validados contra os schemas do catálogo);
      - o json-render renderiza o painel com componentes shadcn/ui.

No campo de mensagem, o botão de modo alterna entre **Visual automático** (o Jev decide), **Sempre visual** e **Só texto**. Respostas sem painel ganham o botão **Mostrar visualmente**, que gera o painel sob demanda.

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
- `src/hooks/use-chat.ts`: estado do chat e conversas salvas
- `src/components/chat/`: interface do chat
- `src/components/visual/`: blocos visuais (gráficos com Recharts, diagramas com Mermaid)

## Stack

React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, json-render, OpenRouter SDK, Recharts, Mermaid.
