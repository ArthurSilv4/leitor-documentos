# Leitor de Documentos

Chat no estilo do Claude para conversar com documentos. Você anexa arquivos (PDF, DOCX, TXT, MD, CSV, JSON), faz perguntas, e cada resposta vem com um painel visual (métricas, gráficos, linha do tempo, etapas, tabelas) montado com [json-render](https://json-render.dev).

## Como funciona

Para cada pergunta, duas tarefas rodam em paralelo:

1. **Resposta em texto**: um modelo da OpenRouter responde em streaming, com base nos documentos.
2. **Painel visual**:
   - outro modelo lê os documentos e extrai até 8 blocos visuais com dados reais (validados contra os schemas do catálogo);
   - o **Jev** (`typesafe-ai/jev`), um modelo de decisão, escolhe quais blocos respondem à pergunta e como organizá-los (`experimental_composeSpec` do json-render);
   - o json-render renderiza o painel com componentes shadcn/ui.

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
| `JEV_MODEL` | Modelo de decisão que compõe o painel | `typesafe-ai/jev` |
| `AI_GATEWAY_API_KEY` | Opcional: roda o Jev pelo Vercel AI Gateway em vez da OpenRouter | — |

A rota `POST /api/chat` existe só no servidor de desenvolvimento do Vite (`vite.config.ts`). Para produção, use a lógica de `server/chat.ts` num backend ou função serverless.

## Versão artifact (claude.ai)

`npm run build:artifact` gera em `dist-artifact/` uma versão estática que roda como Artifact no claude.ai. Nela não há servidor: as respostas vêm do próprio Claude (capacidade `sample` do artifact), que também faz o papel de classificador no lugar do Jev. O catálogo, a extração e a composição são os mesmos.

## Estrutura

- `server/chat.ts`: orquestra resposta e painel e emite eventos NDJSON
- `server/extract.ts`: extração dos blocos via OpenRouter
- `server/evaluator.ts`: o Jev, via OpenRouter Decisions ou Vercel AI Gateway
- `src/lib/visual-catalog.ts`: componentes que o painel pode usar (schemas Zod)
- `src/lib/visual-extract.ts`: prompt de extração e validação dos blocos
- `src/lib/browser-chat.ts`: o mesmo fluxo no navegador, para a versão artifact
- `src/hooks/use-chat.ts`: estado do chat e conversas salvas
- `src/components/chat/`: interface do chat
- `src/components/visual/`: blocos visuais (gráficos com Recharts)

## Stack

React 19, Vite, TypeScript, Tailwind CSS v4, shadcn/ui, json-render, OpenRouter SDK, Recharts.
