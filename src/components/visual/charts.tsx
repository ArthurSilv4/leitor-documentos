import { useState } from 'react'
import { BarChart3, Table2 } from 'lucide-react'
import {
  Bar,
  BarChart as RBarChart,
  CartesianGrid,
  LabelList,
  Line,
  LineChart as RLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { VisualFrame } from './frame'
import { formatCompact, formatValue } from './format'

type Point = { label: string; value: number }

type ChartProps = {
  title: string
  description: string | null
  unit: string | null
  data: Point[]
}

const axisTick = { fill: 'var(--muted-foreground)', fontSize: 12 }

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: ReadonlyArray<{ value?: unknown }>
  label?: unknown
  unit: string | null
}) {
  const value = payload?.[0]?.value
  if (!active || typeof value !== 'number') return null
  return (
    <div className="bg-popover text-popover-foreground rounded-md border px-2.5 py-1.5 text-xs shadow-md">
      <p className="text-muted-foreground">{String(label)}</p>
      <p className="font-medium tabular-nums">{formatValue(value, unit)}</p>
    </div>
  )
}

// Alternativa acessível ao gráfico: os mesmos dados em tabela.
function DataTable({ data, unit }: { data: Point[]; unit: string | null }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {data.map((d) => (
          <tr key={d.label} className="border-b last:border-0">
            <td className="text-muted-foreground py-1.5 pr-4">{d.label}</td>
            <td className="py-1.5 text-right tabular-nums">{formatValue(d.value, unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ViewToggle({ table, onToggle }: { table: boolean; onToggle: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onToggle}
      aria-label={table ? 'Ver gráfico' : 'Ver tabela'}
      title={table ? 'Ver gráfico' : 'Ver tabela'}
    >
      {table ? <BarChart3 /> : <Table2 />}
    </Button>
  )
}

export function BarChart({ title, description, unit, data }: ChartProps) {
  const [table, setTable] = useState(false)

  return (
    <VisualFrame
      title={title}
      description={description}
      action={<ViewToggle table={table} onToggle={() => setTable((t) => !t)} />}
    >
      {table ? (
        <DataTable data={data} unit={unit} />
      ) : (
        <ResponsiveContainer width="100%" height={data.length * 36 + 8}>
          <RBarChart data={data} layout="vertical" margin={{ top: 0, right: 64, bottom: 0, left: 0 }}>
            <XAxis type="number" hide domain={[(min: number) => Math.min(0, min), 'auto']} />
            <YAxis
              type="category"
              dataKey="label"
              width={128}
              tickLine={false}
              axisLine={false}
              tick={axisTick}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              content={(p) => <ChartTooltip {...p} unit={unit} />}
            />
            <Bar
              dataKey="value"
              fill="var(--viz-series-1)"
              barSize={20}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v) => (typeof v === 'number' ? formatValue(v, unit) : '')}
                style={{ fill: 'var(--foreground)', fontSize: 12 }}
              />
            </Bar>
          </RBarChart>
        </ResponsiveContainer>
      )}
    </VisualFrame>
  )
}

export function LineChart({ title, description, unit, data }: ChartProps) {
  const [table, setTable] = useState(false)

  return (
    <VisualFrame
      title={title}
      description={description}
      action={<ViewToggle table={table} onToggle={() => setTable((t) => !t)} />}
    >
      {table ? (
        <DataTable data={data} unit={unit} />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <RLineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={axisTick}
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={48}
              tick={axisTick}
              tickFormatter={(v: number) => formatCompact(v)}
            />
            <Tooltip
              cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
              content={(p) => <ChartTooltip {...p} unit={unit} />}
            />
            <Line
              type="linear"
              dataKey="value"
              stroke="var(--viz-series-1)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              dot={{ r: 4, fill: 'var(--viz-series-1)', stroke: 'var(--card)', strokeWidth: 2 }}
              activeDot={{ r: 5, fill: 'var(--viz-series-1)', stroke: 'var(--card)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </RLineChart>
        </ResponsiveContainer>
      )}
    </VisualFrame>
  )
}
