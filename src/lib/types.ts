// Interfaces baseadas na estrutura real do Supabase

export interface Empresa {
  id: number
  created_at: string
  empresa: string | null
  cnpj: string | null
  contato: string | null
  whatsapp: string | null
  chave: string | null // UUID
  ativo: boolean | null
  patrono: boolean | null
  pacote: number | null
}

export interface Aniversariante {
  id: number
  created_at: string
  codigo: string | null
  nome: string | null
  dataNascimento: string | null // date
  telefone: string | null
  celular: string | null
  empresa_id: number | null
  enviou_msg: boolean | null
  mensagem: string | null
  whatsapp_msg: string | null
  data_envio: string | null // timestamptz
}

export interface Cobranca {
  id: string // UUID
  empresa: string | null
  codigo: string | null
  nome: string | null
  telefone: string | null
  celular: string | null
  codcobranca: string | null
  vencimento: string | null // date
  valor: number | null
  parcela: number | null
  created_at: string
  empresa_id: number | null
  enviou: boolean | null
  mensagem: string | null
  whatsapp: string | null
}

export interface Pacote {
  id: number
  created_at: string
  pacote: string | null
  valor: number | null
}

export interface PacoteDetalhe {
  id: number
  created_at: string
  pacote_id: number | null
  item: string | null
  ativo: boolean | null
}

export interface Regra {
  id: number
  created_at: string
  empresa_id: number | null
  pacote_det_id: number | null
  habilitado: boolean | null
  hr_inicial: string | null // time
  hr_final: string | null // time
  limite_repeticoes_dia: number | null
  limite_repeticoes_total: number | null
  nao_executar_apos_dias: number | null
}

export interface RegraDetalhe {
  id: number
  created_at: string
  habilitado: boolean | null
  valor: number | null
  regra_id: number | null
  descricao: string | null
  auto: boolean | null
}

// View que combina informações de pacotes, detalhes e regras
export interface VwPacoteDetalhesRegras {
  empresa_id: number | null
  nome_empresa: string | null
  cnpj: string | null
  chave: string | null // UUID
  pacote_id: number | null
  nome_pacote: string | null
  valor_pacote: number | null
  pacote_detalhe_id: number | null
  item_pacote: string | null
  pacote_detalhe_ativo: boolean | null
  regra_id: number | null
  regra_habilitada: boolean | null
  hr_inicial: string | null
  hr_final: string | null
  limite_repeticoes_dia: number | null
  limite_repeticoes_total: number | null
  nao_executar_apos_dias: number | null
  regra_criada_em: string | null
  detalhes_regras: any[] | null // JSONB array
}

// Interfaces para as requisições dos webhooks
export interface WebhookAniversariantesRequest {
  cnpj: string
  comando: "aniversariantes"
  data_inicial: string
  data_final: string
}

export interface WebhookAniversariantesEnvioRequest {
  cnpj: string
  comando: "mensagem_aniversariantes"
  aniversariantes: Aniversariante[]
}

export interface WebhookCobrancaRequest {
  cnpj: string
  comando: "cobrancas"
  data_inicial?: string
  data_final?: string
}

export interface WebhookCobrancaEnvioRequest {
  cnpj: string
  comando: "mensagem_cobrancas"
  cobrancas: Cobranca[]
}

// Interface genérica para respostas da API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Tipos para métricas do dashboard
export interface DashboardMetrics {
  totalAniversariantes: number
  aniversariantesEnviados: number
  aniversariantesPendentes: number
  totalCobrancas: number
  cobrancasEnviadas: number
  cobrancasPendentes: number
  valorTotalCobrancas: number
  valorCobrancasVencidas: number
} 