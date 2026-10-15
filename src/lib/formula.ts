// Calculadora de fórmulas para o Simulador. A IA descreve a conta em texto
// (ex.: "valor * 0.1 + taxa"), e ela é avaliada aqui, sem eval: só números,
// variáveis conhecidas, + - * / %, comparações, && || ! e min/max/round/
// floor/ceil/abs. Verdadeiro vale 1 e falso vale 0.

type Token = { type: 'num'; value: number } | { type: 'id'; value: string } | { type: 'op'; value: string }

const OPERATORS = ['<=', '>=', '==', '!=', '&&', '||', '<', '>', '+', '-', '*', '/', '%', '!', '(', ')', ',']
const FUNCTIONS: Record<string, (...args: number[]) => number> = {
  min: Math.min,
  max: Math.max,
  round: (x, digits = 0) => Math.round(x * 10 ** digits) / 10 ** digits,
  floor: Math.floor,
  ceil: Math.ceil,
  abs: Math.abs,
}

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  let i = 0
  while (i < source.length) {
    const ch = source[i]
    if (/\s/.test(ch)) {
      i++
    } else if (/[0-9.]/.test(ch)) {
      const match = source.slice(i).match(/^\d*\.?\d+/)
      if (!match) throw new Error(`Número inválido em "${source.slice(i, i + 8)}"`)
      tokens.push({ type: 'num', value: Number(match[0]) })
      i += match[0].length
    } else if (/[a-zA-Z_]/.test(ch)) {
      const match = source.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/)!
      tokens.push({ type: 'id', value: match[0] })
      i += match[0].length
    } else {
      const op = OPERATORS.find((o) => source.startsWith(o, i))
      if (!op) throw new Error(`Símbolo não permitido: "${ch}"`)
      tokens.push({ type: 'op', value: op })
      i += op.length
    }
  }
  return tokens
}

type Node =
  | { kind: 'num'; value: number }
  | { kind: 'var'; name: string }
  | { kind: 'unary'; op: string; arg: Node }
  | { kind: 'binary'; op: string; left: Node; right: Node }
  | { kind: 'call'; name: string; args: Node[] }

function parse(tokens: Token[]): Node {
  let pos = 0
  const peek = () => tokens[pos]
  const isOp = (...ops: string[]) => peek()?.type === 'op' && ops.includes(peek()!.value as string)
  const expect = (op: string) => {
    if (!isOp(op)) throw new Error(`Esperava "${op}"`)
    pos++
  }

  const binary = (next: () => Node, ops: string[]) => (): Node => {
    let left = next()
    while (isOp(...ops)) {
      const op = tokens[pos++].value as string
      left = { kind: 'binary', op, left, right: next() }
    }
    return left
  }

  const primary = (): Node => {
    const token = tokens[pos++]
    if (!token) throw new Error('Fórmula incompleta')
    if (token.type === 'num') return { kind: 'num', value: token.value }
    if (token.type === 'id') {
      if (isOp('(')) {
        if (!FUNCTIONS[token.value]) throw new Error(`Função desconhecida: ${token.value}`)
        pos++
        const args: Node[] = []
        if (!isOp(')')) {
          args.push(or())
          while (isOp(',')) {
            pos++
            args.push(or())
          }
        }
        expect(')')
        return { kind: 'call', name: token.value, args }
      }
      return { kind: 'var', name: token.value }
    }
    if (token.value === '(') {
      const inner = or()
      expect(')')
      return inner
    }
    throw new Error(`Símbolo inesperado: "${token.value}"`)
  }
  const unary = (): Node => {
    if (isOp('-', '!')) {
      const op = tokens[pos++].value as string
      return { kind: 'unary', op, arg: unary() }
    }
    return primary()
  }
  const mul = binary(unary, ['*', '/', '%'])
  const add = binary(mul, ['+', '-'])
  const cmp = binary(add, ['<', '<=', '>', '>=', '==', '!='])
  const and = binary(cmp, ['&&'])
  const or = binary(and, ['||'])

  const tree = or()
  if (pos < tokens.length) throw new Error(`Sobrou "${String(tokens[pos].value)}" no fim da fórmula`)
  return tree
}

function variables(node: Node, out = new Set<string>()): Set<string> {
  if (node.kind === 'var') out.add(node.name)
  if (node.kind === 'unary') variables(node.arg, out)
  if (node.kind === 'binary') {
    variables(node.left, out)
    variables(node.right, out)
  }
  if (node.kind === 'call') node.args.forEach((a) => variables(a, out))
  return out
}

function evaluate(node: Node, vars: Record<string, number>): number {
  switch (node.kind) {
    case 'num':
      return node.value
    case 'var':
      return Object.hasOwn(vars, node.name) ? vars[node.name] : NaN
    case 'unary': {
      const v = evaluate(node.arg, vars)
      return node.op === '-' ? -v : v ? 0 : 1
    }
    case 'call':
      return FUNCTIONS[node.name](...node.args.map((a) => evaluate(a, vars)))
    case 'binary': {
      const a = evaluate(node.left, vars)
      const b = evaluate(node.right, vars)
      switch (node.op) {
        case '+': return a + b
        case '-': return a - b
        case '*': return a * b
        case '/': return a / b
        case '%': return a % b
        case '<': return +(a < b)
        case '<=': return +(a <= b)
        case '>': return +(a > b)
        case '>=': return +(a >= b)
        case '==': return +(a === b)
        case '!=': return +(a !== b)
        case '&&': return +(!!a && !!b)
        default: return +(!!a || !!b)
      }
    }
  }
}

export type Formula = { variables: Set<string>; run: (vars: Record<string, number>) => number }

export function compileFormula(source: string): Formula {
  const tree = parse(tokenize(source))
  return { variables: variables(tree), run: (vars) => evaluate(tree, vars) }
}

/** true se a fórmula é válida e só usa as variáveis permitidas */
export function isValidFormula(source: string, allowed: string[]): boolean {
  try {
    const formula = compileFormula(source)
    return [...formula.variables].every((v) => allowed.includes(v))
  } catch {
    return false
  }
}
