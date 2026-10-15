import { defineRegistry } from '@json-render/react'
import { shadcnComponents } from '@json-render/shadcn'

import { KeyPoints, Metric, Quote, Steps, Timeline } from '@/components/visual/blocks'
import { BarChart, LineChart, PieChart } from '@/components/visual/charts'
import { Flow, Sequence } from '@/components/visual/diagrams'
import { Comparison, Concept, FeatureMap, Glossary, PermissionMatrix } from '@/components/visual/didactic'
import {
  ActionEffect,
  DecisionGuide,
  Journey,
  Quiz,
  RoleExplorer,
  RuleExamples,
  ScreenMap,
} from '@/components/visual/explainers'
import { DeadlineCheck, Simulator } from '@/components/visual/simulator'
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
    Flow: ({ props }) => <Flow {...props} />,
    Sequence: ({ props }) => <Sequence {...props} />,
    PermissionMatrix: ({ props }) => <PermissionMatrix {...props} />,
    Glossary: ({ props }) => <Glossary {...props} />,
    Comparison: ({ props }) => <Comparison {...props} />,
    Concept: ({ props }) => <Concept {...props} />,
    FeatureMap: ({ props }) => <FeatureMap {...props} />,
    Journey: ({ props }) => <Journey {...props} />,
    DecisionGuide: ({ props }) => <DecisionGuide {...props} />,
    RoleExplorer: ({ props }) => <RoleExplorer {...props} />,
    ActionEffect: ({ props }) => <ActionEffect {...props} />,
    RuleExamples: ({ props }) => <RuleExamples {...props} />,
    ScreenMap: ({ props }) => <ScreenMap {...props} />,
    Quiz: ({ props }) => <Quiz {...props} />,
    Simulator: ({ props }) => <Simulator {...props} />,
    DeadlineCheck: ({ props }) => <DeadlineCheck {...props} />,
    PieChart: ({ props }) => <PieChart {...props} />,
  },
})
