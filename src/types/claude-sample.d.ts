// Parte do runtime de artifacts do claude.ai usada pela versão artifact.
// Referência: capacidade `sample` (pedir respostas ao Claude pela página).

type SampleMessage = { role: 'user' | 'assistant'; content: string }

type SampleOptions = {
  onText?: (update: { text: string; delta: string }) => void
  signal?: AbortSignal
  modelTier?: 'default' | 'complex' | 'quick'
  cache?: boolean
}

type SampleFn = {
  (input: string | SampleMessage[], options?: SampleOptions): Promise<{ text: string; truncated: boolean }>
  json<T = unknown>(input: string | SampleMessage[], options?: SampleOptions): Promise<T>
}

interface Window {
  claude?: { use(name: 'sample'): Promise<SampleFn | null> }
}
