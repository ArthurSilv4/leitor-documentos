const number = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const compact = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })

export function formatValue(value: number, unit?: string | null) {
  const text = number.format(value)
  if (!unit) return text
  if (unit === '%') return `${text}%`
  // "R$ mi" vira "R$ 6,1 mi": símbolo de moeda antes do número
  const currency = unit.match(/^(R\$|US\$|\$|€|£)\s*(.*)$/)
  if (currency) return [currency[1], text, currency[2]].filter(Boolean).join(' ')
  return `${text} ${unit}`
}

export function formatCompact(value: number) {
  return compact.format(value)
}
