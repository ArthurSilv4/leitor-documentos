// Traduz erros técnicos em mensagens para quem não é da área técnica.
// A mensagem original continua disponível em "Detalhes" para o suporte.
const rules: [RegExp, string][] = [
  [/não autorizou|not_granted/i, 'Você não autorizou esta página a usar o assistente. Recarregue a página e permita para continuar.'],
  [/OPENROUTER_API_KEY|api.?key|401|unauthori[sz]ed|forbidden|403/i, 'O assistente ainda não está configurado. Avise quem administra o sistema.'],
  [/does not exist|not found|404|invalid model|modelo/i, 'O assistente está com um problema de configuração. Avise quem administra o sistema.'],
  [/429|rate.?limit|muitas solicitações|rate_limited/i, 'Muitas perguntas em pouco tempo. Espere um minuto e tente de novo.'],
  [/too large|prompt_too_large|grandes demais|context length|maximum context/i, 'O documento é grande demais para esta pergunta. Tente com um arquivo menor.'],
  [/failed to fetch|networkerror|network|econn|fetch failed|timed? ?out|timeout|502|503|504/i, 'Não consegui me conectar ao assistente. Verifique sua internet e tente de novo.'],
]

export function friendlyError(raw: string): string {
  for (const [pattern, message] of rules) if (pattern.test(raw)) return message
  return 'Algo deu errado ao gerar a resposta. Tente de novo.'
}
