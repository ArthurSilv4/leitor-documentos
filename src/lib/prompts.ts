import type { ChatRequestBody } from './chat-protocol.ts'

// Limite padrão de texto dos documentos enviado aos modelos (~100k tokens).
export const MAX_DOCUMENT_CHARS = 400_000

export function documentsContext(
  documents: ChatRequestBody['documents'],
  maxChars = MAX_DOCUMENT_CHARS,
): string {
  if (!documents.length) return ''

  let budget = maxChars
  const parts: string[] = []
  for (const doc of documents) {
    const text = doc.text.slice(0, Math.max(0, budget))
    budget -= text.length
    const cut = text.length < doc.text.length ? '\n[... documento truncado ...]' : ''
    parts.push(`<documento nome="${doc.name}">\n${text}${cut}\n</documento>`)
  }
  return parts.join('\n\n')
}

export function answerSystemPrompt(
  documents: ChatRequestBody['documents'],
  maxChars = MAX_DOCUMENT_CHARS,
): string {
  const base = `Você é um assistente que ajuda a pessoa a entender documentos.
Responda em português do Brasil, em markdown, de forma clara e direta.
Explique de forma didática, como um bom professor: comece pela ideia principal, depois os detalhes.
Use títulos curtos e listas quando ajudarem. Cite o nome do documento (e a seção, quando houver) quando usar informação dele.
Se a resposta não estiver nos documentos, diga isso claramente em vez de inventar.
Um painel visual (diagramas de fluxo, matrizes de permissão, gráficos, glossário) é gerado separadamente ao lado da sua resposta, então não desenhe diagramas nem gráficos em texto.`

  const context = documentsContext(documents, maxChars)
  return context ? `${base}\n\nDocumentos anexados:\n\n${context}` : base
}
