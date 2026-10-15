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

// Marcador que a resposta usa para posicionar um visual no texto.
export const VISUAL_MARKER = /\[\[visual:([\w-]+)\]\]/g

export function answerSystemPrompt(
  documents: ChatRequestBody['documents'],
  maxChars = MAX_DOCUMENT_CHARS,
  /** Visuais já prontos, um por linha: "[[visual:id]] descrição" */
  visualGuide: string | null = null,
): string {
  const base = `Você é um assistente que ajuda pessoas a entender documentos.
Quem conversa com você NÃO é da área técnica: pode ser alguém da operação, do atendimento ou da gestão.

Como responder:
- Português do Brasil, em markdown, com palavras do dia a dia e frases curtas.
- Comece com a resposta direta em uma ou duas frases. Depois explique, como um bom professor: da ideia principal para os detalhes.
- Na primeira vez que aparecer uma sigla ou termo técnico do documento (ex.: DUE, janela de horário), explique em poucas palavras o que é.
- Use exemplos práticos do dia a dia de quem usa o sistema.
- Não cite nomes internos de sistema, parâmetros, códigos ou nomes de campos técnicos, a menos que a pessoa peça.
- Títulos curtos e listas só quando ajudarem. Diga de qual parte do documento veio a informação (ex.: "segundo a seção Perfis e Permissões").
- Se a resposta não estiver nos documentos, diga isso claramente em vez de inventar.
- Não desenhe diagramas, tabelas grandes nem gráficos em texto.`

  const visuals = visualGuide
    ? `

Estes elementos visuais já estão prontos e aparecem para a pessoa exatamente onde você colocar o marcador:
${visualGuide}

Como usar:
- Coloque cada marcador numa linha sozinha, no ponto da explicação em que o visual ajuda o leitor. Use cada um no máximo uma vez.
- Antes do marcador, uma frase curta que introduz o visual ("Veja o ciclo completo:"). Depois, se ajudar, comente o ponto principal que ele mostra.
- Não repita em texto o que o visual já mostra por inteiro; explique o raciocínio em volta dele.
- Escreva o marcador exatamente como está, por exemplo [[visual:node_1]].`
    : ''

  const context = documentsContext(documents, maxChars)
  return `${base}${visuals}${context ? `\n\nDocumentos anexados:\n\n${context}` : ''}`
}
