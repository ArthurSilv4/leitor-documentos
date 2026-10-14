// Extrai o texto dos arquivos anexados, no próprio navegador.

const MAX_FILE_BYTES = 25 * 1024 * 1024

const TEXT_EXTENSIONS = ['txt', 'md', 'markdown', 'csv', 'tsv', 'json', 'html', 'htm', 'xml', 'yaml', 'yml', 'log']

export const ACCEPTED_FILES = ['.pdf', '.docx', ...TEXT_EXTENSIONS.map((e) => `.${e}`)].join(',')

function extension(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

async function readPdf(file: File) {
  const pdfjs = await import('pdfjs-dist')
  const { default: workerUrl } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : '')).join('')
    pages.push(`[Página ${i}]\n${text.trim()}`)
  }
  return pages.join('\n\n')
}

async function readDocx(file: File) {
  const { default: mammoth } = await import('mammoth/mammoth.browser')
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return result.value
}

export async function extractText(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error('Arquivo maior que 25 MB')

  const ext = extension(file.name)
  let text: string
  if (ext === 'pdf') text = await readPdf(file)
  else if (ext === 'docx') text = await readDocx(file)
  else if (TEXT_EXTENSIONS.includes(ext) || file.type.startsWith('text/')) text = await file.text()
  else throw new Error('Formato não suportado')

  text = text.trim()
  if (!text) throw new Error(ext === 'pdf' ? 'PDF sem texto (talvez seja escaneado)' : 'Arquivo vazio')
  return text
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
