export type ServerConfig = {
  openRouterApiKey: string
  /** Modelo que responde no chat */
  chatModel: string
  /** Modelo que extrai os blocos visuais dos documentos */
  extractModel: string
  /** Modelo de decisão que compõe o painel (Jev) */
  jevModel: string
  /** Se definido, o Jev roda pelo Vercel AI Gateway em vez da OpenRouter */
  aiGatewayApiKey: string | null
}

export function readConfig(env: Record<string, string | undefined>): ServerConfig | null {
  const openRouterApiKey = env.OPENROUTER_API_KEY?.trim()
  if (!openRouterApiKey) return null

  const chatModel = env.OPENROUTER_MODEL?.trim() || 'anthropic/claude-sonnet-4.5'
  const aiGatewayApiKey = env.AI_GATEWAY_API_KEY?.trim() || null
  return {
    openRouterApiKey,
    chatModel,
    extractModel: env.OPENROUTER_EXTRACT_MODEL?.trim() || chatModel,
    // O Jev tem IDs diferentes em cada provedor
    jevModel: env.JEV_MODEL?.trim() || (aiGatewayApiKey ? 'typesafe-ai/jev' : 'typesafe/jev-1.14'),
    aiGatewayApiKey,
  }
}
