import { defineRegistry } from '@json-render/react'
import { shadcnComponents } from '@json-render/shadcn'

import { KeyPoints, Metric, Quote, Steps, Timeline } from '@/components/visual/blocks'
import { BarChart, LineChart } from '@/components/visual/charts'
import { VisualFrame } from '@/components/visual/frame'
import { catalog } from '@/lib/visual-catalog'

const ShadcnTable = shadcnComponents.Table
const ShadcnAccordion = shadcnComponents.Accordion

export const { registry } = defineRegistry(catalog, {
  components: {
    Stack: shadcnComponents.Stack,
    Grid: shadcnComponents.Grid,
    Alert: shadcnComponents.Alert,
    Table: (ctx) => (
      <VisualFrame className="overflow-x-auto">
        <ShadcnTable {...ctx} />
      </VisualFrame>
    ),
    Accordion: (ctx) => (
      <VisualFrame className="py-1">
        <ShadcnAccordion {...ctx} />
      </VisualFrame>
    ),
    Metric: ({ props }) => <Metric {...props} />,
    BarChart: ({ props }) => <BarChart {...props} />,
    LineChart: ({ props }) => <LineChart {...props} />,
    Timeline: ({ props }) => <Timeline {...props} />,
    KeyPoints: ({ props }) => <KeyPoints {...props} />,
    Steps: ({ props }) => <Steps {...props} />,
    Quote: ({ props }) => <Quote {...props} />,
  },
})
