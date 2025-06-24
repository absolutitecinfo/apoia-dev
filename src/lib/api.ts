// API para integração com Supabase e Webhooks

import { useState } from 'react'
import { supabase } from './supabase'
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

// URLs dos webhooks
const WEBHOOK_ANIVERSARIANTES_COLETA = process.env.WEBHOOK_ANIVERSARIANTES_COLETA || 'https://webhooks.grupotopmarketingzap.com.br/webhook/c77f9b60-9a4d-4ca2-8146-bedf4eebb7ca-aniversariantes-coleta-dashboard'
const WEBHOOK_ANIVERSARIANTES_ENVIO = process.env.WEBHOOK_ANIVERSARIANTES_ENVIO || 'https://webhooks.grupotopmarketingzap.com.br/webhook/7791d206-c9c5-4683-9061-f2253252f744-aniversariantes-atualizados-dashboard'
const WEBHOOK_COBRANCAS_COLETA = process.env.WEBHOOK_COBRANCAS_COLETA
const WEBHOOK_COBRANCAS_ENVIO = process.env.WEBHOOK_COBRANCAS_ENVIO

// Funções específicas para cada tipo de dados
export const api = {
  // Dados gerais da empresa
  async getEmpresaData(empresaId: string): Promise<ApiResponse<Empresa>> {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', parseInt(empresaId))
        .single()

      if (error) {
        console.error('Erro ao buscar empresa:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao buscar empresa:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Configurações da empresa (view completa)
  async getEmpresaConfiguracoes(empresaId: string): Promise<ApiResponse<VwPacoteDetalhesRegras[]>> {
    try {
      const { data, error } = await supabase
        .from('vw_pacote_detalhes_regras')
        .select('*')
        .eq('empresa_id', parseInt(empresaId))

      if (error) {
        console.error('Erro ao buscar configurações:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Aniversariantes - Buscar do Supabase
  async getAniversariantes(empresaId: string): Promise<ApiResponse<Aniversariante[]>> {
    try {
      const { data, error } = await supabase
        .from('aniversariantes')
        .select('*')
        .eq('empresa_id', parseInt(empresaId))
        .order('dataNascimento', { ascending: true })

      if (error) {
        console.error('Erro ao buscar aniversariantes:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Erro ao buscar aniversariantes:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Aniversariantes - Coleta (1ª chamada webhook)
  async coletarAniversariantes(cnpj: string, dataInicial: string, dataFinal: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(WEBHOOK_ANIVERSARIANTES_COLETA, {
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
      const response = await fetch(WEBHOOK_ANIVERSARIANTES_ENVIO, {
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
    try {
      const { data, error } = await supabase
        .from('cobranca')
        .select('*')
        .eq('empresa_id', parseInt(empresaId))
        .order('vencimento', { ascending: true })

      if (error) {
        console.error('Erro ao buscar cobranças:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Erro ao buscar cobranças:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Cobranças - Coleta (webhook - quando você enviar os curls)
  async coletarCobrancas(cnpj: string, dataInicial?: string, dataFinal?: string): Promise<ApiResponse<any>> {
    if (!WEBHOOK_COBRANCAS_COLETA) {
      return { 
        success: false, 
        error: 'URL do webhook de coleta de cobranças não configurada. Configure WEBHOOK_COBRANCAS_COLETA no .env' 
      }
    }

    try {
      const response = await fetch(WEBHOOK_COBRANCAS_COLETA, {
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
    if (!WEBHOOK_COBRANCAS_ENVIO) {
      return { 
        success: false, 
        error: 'URL do webhook de envio de cobranças não configurada. Configure WEBHOOK_COBRANCAS_ENVIO no .env' 
      }
    }

    try {
      const response = await fetch(WEBHOOK_COBRANCAS_ENVIO, {
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
    try {
      const tabela = tipo === 'aniversariante' ? 'aniversariantes' : 'cobranca'
      const campo = tipo === 'aniversariante' ? 'enviou_msg' : 'enviou'
      
      const updateData: any = { [campo]: enviou }
      if (mensagem) {
        updateData.mensagem = mensagem
      }

      const { data, error } = await supabase
        .from(tabela)
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.error('Erro ao atualizar status:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Métricas gerais (calculadas dinamicamente)
  async getMetricas(empresaId: string): Promise<ApiResponse<DashboardMetrics>> {
    try {
      const [aniversariantesResult, cobrancasResult] = await Promise.all([
        this.getAniversariantes(empresaId),
        this.getCobrancas(empresaId)
      ])

      if (!aniversariantesResult.success || !cobrancasResult.success) {
        return { 
          success: false, 
          error: 'Erro ao buscar dados para métricas' 
        }
      }

      const aniversariantes = aniversariantesResult.data || []
      const cobrancas = cobrancasResult.data || []

      const metrics: DashboardMetrics = {
        totalAniversariantes: aniversariantes.length,
        aniversariantesEnviados: aniversariantes.filter(a => a.enviou_msg === true).length,
        aniversariantesPendentes: aniversariantes.filter(a => a.enviou_msg !== true).length,
        totalCobrancas: cobrancas.length,
        cobrancasEnviadas: cobrancas.filter(c => c.enviou === true).length,
        cobrancasPendentes: cobrancas.filter(c => c.enviou !== true).length,
        valorTotalCobrancas: cobrancas.reduce((sum, c) => sum + (c.valor || 0), 0),
        valorCobrancasVencidas: cobrancas
          .filter(c => c.vencimento && new Date(c.vencimento) < new Date())
          .reduce((sum, c) => sum + (c.valor || 0), 0)
      }

      return { success: true, data: metrics }
    } catch (error) {
      console.error('Erro ao calcular métricas:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Relatórios (placeholder - implementar conforme necessário)
  async getRelatorios(empresaId: string): Promise<ApiResponse<any[]>> {
    // Por enquanto retorna lista vazia, implementar conforme necessário
    return { success: true, data: [] }
  },

  // Configurações (busca configurações da view)
  async getConfiguracoes(empresaId: string): Promise<ApiResponse<VwPacoteDetalhesRegras[]>> {
    return this.getEmpresaConfiguracoes(empresaId)
  },

  // Salvar configurações (placeholder - implementar conforme necessário)
  async saveConfiguracoes(empresaId: string, dados: any): Promise<ApiResponse<any>> {
    // Implementar salvamento de configurações no Supabase conforme necessário
    console.log('Salvando configurações para empresa:', empresaId, dados)
    return { success: true, data: null }
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