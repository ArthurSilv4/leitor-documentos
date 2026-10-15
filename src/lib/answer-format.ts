// Formato da resposta em texto, compartilhado entre servidor e tela.

// A resposta termina com as próximas perguntas sugeridas:
// [[sugestoes: Pergunta 1 | Pergunta 2 | Pergunta 3]]
const SUGGESTIONS = /\[\[sugest(?:o|õ)es:([^\]]*)\]\]/i

export function parseAnswer(content: string): { body: string; suggestions: string[] } {
  const match = content.match(SUGGESTIONS)
  const suggestions = match
    ? match[1]
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3)
    : []
  // Tira o marcador completo e um marcador ainda incompleto no fim (streaming)
  const body = content.replace(SUGGESTIONS, '').replace(/\[\[[^\]\n]*\]?\s*$/, '').trimEnd()
  return { body, suggestions }
}

const LIST_ITEM = /^\s*([-*+]|\d+[.)])\s/

// Divide o texto em trechos onde um visual pode entrar: separa por linha em
// branco, sem quebrar blocos de código, listas ou tabelas.
export function splitBlocks(text: string): string[] {
  const blocks: string[] = []
  let current: string[] = []
  let inFence = false

  const flush = () => {
    if (current.length) blocks.push(current.join('\n'))
    current = []
  }

  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) inFence = !inFence
    if (!inFence && line.trim() === '') {
      flush()
      continue
    }
    current.push(line)
  }
  flush()

  // Itens de lista separados por linha em branco continuam na mesma lista
  const merged: string[] = []
  for (const block of blocks) {
    const previous = merged[merged.length - 1]
    const continues = previous !== undefined && LIST_ITEM.test(block) && LIST_ITEM.test(previous.split('\n').pop() ?? '')
    const indented = previous !== undefined && /^\s{2,}\S/.test(block)
    // Um título fica junto do trecho que ele apresenta
    const afterHeading = previous !== undefined && /^#{1,6}\s[^\n]*$/.test(previous)
    if (continues || indented || afterHeading) merged[merged.length - 1] = `${previous}\n\n${block}`
    else merged.push(block)
  }
  return merged
}
