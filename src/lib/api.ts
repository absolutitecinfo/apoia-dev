// API para integração com Supabase e Webhooks

import { useState } from 'react'
import type { 
  ApiResponse, 
  Empresa, 
  Aniversariante, 
  Cobranca, 
  VwPacoteDetalhesRegras,
  WebhookAniversariantesRequest,
  WebhookAniversariantesEnvioRequest,
  WebhookCobrancaRequest,
  WebhookCobrancaEnvioRequest,
  DashboardMetrics
} from './types'

// Base URL da API (configure conforme necessário)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.topautomacoes.com'

// Função auxiliar para fazer requisições
async function apiRequest<T>(endpoint: string, empresaId: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}?empresa_id=${empresaId}`, {
      headers: {
        'Content-Type': 'application/json',
        // Adicione headers de autenticação conforme necessário
        // 'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('API Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

// Funções específicas para cada tipo de dados
export const api = {
  // Dados gerais da empresa
  async getEmpresaData(empresaId: string): Promise<ApiResponse<Empresa>> {
    return apiRequest<Empresa>(`/empresas/${empresaId}`, empresaId)
  },

  // Configurações da empresa (view completa)
  async getEmpresaConfiguracoes(empresaId: string): Promise<ApiResponse<VwPacoteDetalhesRegras[]>> {
    return apiRequest<VwPacoteDetalhesRegras[]>(`/vw_pacote_detalhes_regras?empresa_id=eq.${empresaId}`, empresaId)
  },

  // Aniversariantes - Buscar do Supabase
  async getAniversariantes(empresaId: string): Promise<ApiResponse<Aniversariante[]>> {
    return apiRequest<Aniversariante[]>(`/aniversariantes?empresa_id=eq.${empresaId}`, empresaId)
  },

  // Aniversariantes - Coleta (1ª chamada webhook)
  async coletarAniversariantes(cnpj: string, dataInicial: string, dataFinal: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('https://webhooks.grupotopmarketingzap.com.br/webhook/c77f9b60-9a4d-4ca2-8146-bedf4eebb7ca-aniversariantes-coleta-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnpj,
          comando: "aniversariantes",
          data_inicial: dataInicial,
          data_final: dataFinal
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Aniversariantes - Envio de mensagens (2ª chamada webhook)
  async enviarMensagensAniversariantes(cnpj: string, aniversariantes: any[]): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('https://webhooks.grupotopmarketingzap.com.br/webhook/7791d206-c9c5-4683-9061-f2253252f744-aniversariantes-atualizados-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnpj,
          comando: "mensagem_aniversariantes",
          aniversariantes
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Cobranças - Buscar do Supabase
  async getCobrancas(empresaId: string): Promise<ApiResponse<Cobranca[]>> {
    return apiRequest<Cobranca[]>(`/cobranca?empresa_id=eq.${empresaId}`, empresaId)
  },

  // Cobranças - Coleta (webhook - quando você enviar os curls)
  async coletarCobrancas(cnpj: string, dataInicial?: string, dataFinal?: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('URL_DO_WEBHOOK_COBRANCAS_COLETA', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnpj,
          comando: "cobrancas",
          data_inicial: dataInicial,
          data_final: dataFinal
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Cobranças - Envio de mensagens (webhook)
  async enviarMensagensCobrancas(cnpj: string, cobrancas: Cobranca[]): Promise<ApiResponse<any>> {
    try {
      const response = await fetch('URL_DO_WEBHOOK_COBRANCAS_ENVIO', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnpj,
          comando: "mensagem_cobrancas",
          cobrancas
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Atualizar status de envio (Supabase)
  async atualizarStatusEnvio(
    tipo: 'aniversariante' | 'cobranca', 
    id: string | number, 
    enviou: boolean,
    mensagem?: string
  ): Promise<ApiResponse<any>> {
    const tabela = tipo === 'aniversariante' ? 'aniversariantes' : 'cobranca'
    const campo = tipo === 'aniversariante' ? 'enviou_msg' : 'enviou'
    
    try {
      const response = await fetch(`${API_BASE_URL}/${tabela}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          [campo]: enviou,
          ...(mensagem && { mensagem })
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return { success: true, data: null }
    } catch (error) {
      console.error('API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Métricas gerais
  async getMetricas(empresaId: string): Promise<ApiResponse<any>> {
    return apiRequest('/metricas', empresaId)
  },

  // Relatórios
  async getRelatorios(empresaId: string): Promise<ApiResponse<any[]>> {
    return apiRequest('/relatorios', empresaId)
  },

  // Configurações
  async getConfiguracoes(empresaId: string): Promise<ApiResponse<any>> {
    return apiRequest('/configuracoes', empresaId)
  },

  // Salvar configurações
  async saveConfiguracoes(empresaId: string, dados: any): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/configuracoes?empresa_id=${empresaId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('API Error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
}

// Hook personalizado para usar com React (opcional)
export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const request = async <T>(apiCall: () => Promise<ApiResponse<T>>): Promise<T | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await apiCall()
      
      if (response.success && response.data) {
        return response.data
      } else {
        setError(response.error || 'Erro desconhecido')
        return null
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { request, loading, error }
} 