// Converte dist-artifact/index.html no formato de página do Artifact:
// sem doctype/html/head/body (o claude.ai adiciona), só título, estilos,
// scripts e a raiz do React.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { Parser } from 'acorn'
import { transform } from 'esbuild'

const CONTROL = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/

// Troca cada caractere de controle cru por \xNN dentro de um trecho de
// string, template ou regex. "\<controle>" (escape sem efeito) vira só \xNN.
function escapeSegment(text) {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '\\' && i + 1 < text.length && CONTROL.test(text[i + 1])) {
      out += hex(text[++i])
    } else if (ch === '\\') {
      out += ch + (text[++i] ?? '')
    } else {
      out += CONTROL.test(ch) ? hex(ch) : ch
    }
  }
  return out
}
const hex = (ch) => '\\x' + ch.charCodeAt(0).toString(16).padStart(2, '0')

// esbuild escapa strings comuns, mas mantém templates e regexes byte a byte.
function escapeControlChars(code, file) {
  if (!CONTROL.test(code)) return code
  const ast = Parser.parse(code, { ecmaVersion: 'latest', sourceType: 'module' })
  const ranges = []
  const tagged = new Set()
  ;(function walk(node) {
    if (!node || typeof node.type !== 'string') return
    if (node.type === 'TaggedTemplateExpression') tagged.add(node.quasi)
    if (node.type === 'TemplateLiteral') {
      for (const q of node.quasis) {
        if (!CONTROL.test(code.slice(q.start, q.end))) continue
        if (tagged.has(node)) throw new Error(`${file}: caractere de controle em template com tag`)
        ranges.push([q.start, q.end])
      }
    }
    if (node.type === 'Literal' && CONTROL.test(code.slice(node.start, node.end))) {
      ranges.push([node.start, node.end])
    }
    for (const key in node) {
      const value = node[key]
      if (Array.isArray(value)) value.forEach(walk)
      else if (value && typeof value.type === 'string') walk(value)
    }
  })(ast)

  let out = ''
  let last = 0
  for (const [start, end] of ranges.sort((a, b) => a[0] - b[0])) {
    out += code.slice(last, start) + escapeSegment(code.slice(start, end))
    last = end
  }
  out += code.slice(last)
  if (CONTROL.test(out)) throw new Error(`${file}: sobrou caractere de controle fora de strings`)
  return out
}

// O publish de artifacts recusa caracteres de controle crus (o minificador
// deixa alguns dentro de strings do pdf.js). Reescreve os scripts só com
// ASCII, usando escapes equivalentes.
for (const file of readdirSync('dist-artifact/assets')) {
  if (!/\.m?js$/.test(file)) continue
  const path = `dist-artifact/assets/${file}`
  const { code } = await transform(readFileSync(path, 'utf8'), {
    loader: 'js',
    format: 'esm',
    charset: 'ascii',
    minifyWhitespace: true,
  })
  writeFileSync(path, escapeControlChars(code, file))
}

const html = readFileSync('dist-artifact/index.html', 'utf8')
const pick = (re) => [...html.matchAll(re)].map((m) => m[0])

const page = [
  ...pick(/<title>[\s\S]*?<\/title>/g),
  ...pick(/<link rel="(?:stylesheet|modulepreload)"[^>]*>/g),
  ...pick(/<script type="module"[^>]*><\/script>/g),
  '<div id="root"></div>',
].join('\n')

writeFileSync('dist-artifact/page.html', page + '\n')
console.log(page)
