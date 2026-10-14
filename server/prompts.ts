import type { ChatRequestBody } from '../src/lib/chat-protocol.ts'

// Limite total de texto dos documentos enviado aos modelos (~100k tokens).
const MAX_DOCUMENT_CHARS = 400_000

export function documentsContext(documents: ChatRequestBody['documents']): string {
  if (!documents.length) return ''

  let budget = MAX_DOCUMENT_CHARS
  const parts: string[] = []
  for (const doc of documents) {
    const text = doc.text.slice(0, Math.max(0, budget))
    budget -= text.length
    const cut = text.length < doc.text.length ? '\n[... documento truncado ...]' : ''
    parts.push(`<documento nome="${doc.name}">\n${text}${cut}\n</documento>`)
  }
  return parts.join('\n\n')
}

export function answerSystemPrompt(documents: ChatRequestBody['documents']): string {
  const base = `Você é um assistente que ajuda a pessoa a entender documentos.
Responda em português do Brasil, em markdown, de forma clara e direta.
Use títulos curtos e listas quando ajudarem. Cite o nome do documento quando usar informação dele.
Se a resposta não estiver nos documentos, diga isso claramente em vez de inventar.
Um painel visual (gráficos, linha do tempo, métricas) é gerado separadamente ao lado da sua resposta, então não desenhe gráficos em texto.`

  const context = documentsContext(documents)
  return context ? `${base}\n\nDocumentos anexados:\n\n${context}` : base
}
