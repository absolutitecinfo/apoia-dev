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
  DashboardMetrics,
  Regra,
  RegraDetalhe
} from './types'

// URLs dos webhooks
const WEBHOOK_ANIVERSARIANTES_COLETA = process.env.WEBHOOK_ANIVERSARIANTES_COLETA || 'https://webhooks.grupotopmarketingzap.com.br/webhook/c77f9b60-9a4d-4ca2-8146-bedf4eebb7ca-aniversariantes-coleta-dashboard'
const WEBHOOK_ANIVERSARIANTES_ENVIO = process.env.WEBHOOK_ANIVERSARIANTES_ENVIO || 'https://webhooks.grupotopmarketingzap.com.br/webhook/7791d206-c9c5-4683-9061-f2253252f744-aniversariantes-atualizados-dashboard'
const WEBHOOK_COBRANCAS_COLETA = process.env.WEBHOOK_COBRANCAS_COLETA || 'https://webhooks.grupotopmarketingzap.com.br/webhook/22fe2493-8aa7-4e43-800a-5c3a1166daf2-cobrancas-vencidas-coleta-dashboard'
const WEBHOOK_COBRANCAS_ENVIO = process.env.WEBHOOK_COBRANCAS_ENVIO || 'https://webhooks.grupotopmarketingzap.com.br/webhook/d5d3cf5b-1bbf-492b-a28c-b50cd52acf23-cobrancas-vencidas-atualizado-dashboard'

// Função para buscar empresa por chave UUID e retornar empresa_id numérico
async function getEmpresaIdByChave(chave: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('id, empresa, cnpj')
      .eq('chave', chave)
      .single()

    if (error || !data) {
      console.error('❌ Erro ao buscar empresa por chave:', error)
      return null
    }

    return data.id
  } catch (error) {
    console.error('💥 Erro inesperado ao buscar empresa por chave:', error)
    return null
  }
}

// Funções específicas para cada tipo de dados
export const api = {
  // Dados gerais da empresa
  async getEmpresaData(empresaChave: string): Promise<ApiResponse<Empresa>> {
    try {
      console.log('🔍 Buscando dados da empresa para chave:', empresaChave)
      
      // Validar a chave
      if (!empresaChave || empresaChave.trim() === '') {
        console.error('❌ Chave da empresa não fornecida ou inválida:', empresaChave)
        return { success: false, error: 'Chave da empresa é obrigatória' }
      }
      
      // Verificar se as variáveis de ambiente estão configuradas
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas, usando dados mockados')
        const mockEmpresa: Empresa = {
          id: 1,
          created_at: new Date().toISOString(),
          empresa: `Empresa Teste (Mock - Sem Supabase)`,
          cnpj: '00184385000194',
          contato: 'Contato Teste',
          whatsapp: '66999999999',
          chave: empresaChave,
          ativo: true,
          patrono: false,
          pacote: 1,
          nome_sistema: 'ECOCENTAURO ACCESS'
        }
        return { success: true, data: mockEmpresa }
      }
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('chave', empresaChave)
        .single()

      if (error) {
        const errorInfo = {
          code: error.code || 'UNKNOWN',
          message: error.message || 'Erro desconhecido',
          details: error.details || null,
          hint: error.hint || null,
          httpStatus: (error as any)?.status || null,
          fullError: error
        }
        console.error('❌ Erro ao buscar empresa:', errorInfo)
        
        // Se a tabela não existe, não há dados, ou problemas de autenticação
        if (error.code === 'PGRST116' || 
            error.message?.includes('relation') || 
            error.message?.includes('does not exist') ||
            error.code === 'PGRST301' ||
            (error as any)?.status === 401) {
          console.log('⚠️ Problema com banco/autenticação, usando dados mockados')
          const mockEmpresa: Empresa = {
            id: 1,
            created_at: new Date().toISOString(),
            empresa: `Empresa Teste (Mock - DB Error)`,
            cnpj: '00184385000194',
            contato: 'Contato Teste',
            whatsapp: '66999999999',
            chave: empresaChave,
            ativo: true,
            patrono: false,
            pacote: 1,
            nome_sistema: 'ECOCENTAURO ACCESS'
          }
          return { success: true, data: mockEmpresa }
        }
        return { success: false, error: error.message || 'Erro na consulta' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar empresa:', error)
      // Em caso de erro inesperado, também retorna dados mockados
      const mockEmpresa: Empresa = {
        id: 1,
        created_at: new Date().toISOString(),
        empresa: `Empresa Teste (Mock - Exception)`,
        cnpj: '00184385000194',
        contato: 'Contato Teste',
        whatsapp: '66999999999',
        chave: empresaChave,
        ativo: true,
        patrono: false,
        pacote: 1,
        nome_sistema: 'ECOCENTAURO ACCESS'
      }
      return { success: true, data: mockEmpresa }
    }
  },

  // Configurações da empresa (view completa)
  async getEmpresaConfiguracoes(empresaChave: string): Promise<ApiResponse<VwPacoteDetalhesRegras[]>> {
    try {
      const empresaId = await getEmpresaIdByChave(empresaChave)
      if (!empresaId) {
        return { success: false, error: 'Empresa não encontrada' }
      }

      const { data, error } = await supabase
        .from('vw_pacote_detalhes_regras')
        .select('*')
        .eq('empresa_id', empresaId)

      if (error) {
        const errorInfo = {
          code: error.code || 'UNKNOWN',
          message: error.message || 'Erro desconhecido',
          details: error.details || null,
          hint: error.hint || null,
          httpStatus: (error as any)?.status || null,
          fullError: error
        }
        console.error('Erro ao buscar configurações:', errorInfo)
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

  // Listar todas as empresas disponíveis
  async getEmpresas(): Promise<ApiResponse<Empresa[]>> {
    try {
      console.log('🔍 Buscando lista de empresas')
      
      // Verificar se as variáveis de ambiente estão configuradas
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas, usando dados mockados')
        const mockEmpresas: Empresa[] = [
          {
            id: 1,
            created_at: new Date().toISOString(),
            empresa: 'Empresa Teste (Mock - Sem Supabase)',
            cnpj: '52121446000178',
            contato: 'Contato Teste',
            whatsapp: '66999999999',
            chave: 'f552a3d5-b400-4199-b852-e04deb4c36b1',
            ativo: true,
            patrono: false,
            pacote: 1,
            nome_sistema: 'ECOCENTAURO ACCESS'
          }
        ]
        return { success: true, data: mockEmpresas }
      }
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('empresa', { ascending: true })

      if (error) {
        const errorInfo = {
          code: error.code || 'UNKNOWN',
          message: error.message || 'Erro desconhecido',
          details: error.details || null,
          hint: error.hint || null,
          httpStatus: (error as any)?.status || null,
          fullError: error
        }
        console.error('❌ Erro ao buscar empresas:', errorInfo)
        
        // Se a tabela não existe, não há dados, ou problemas de autenticação
        if (error.code === 'PGRST116' || 
            error.message?.includes('relation') || 
            error.message?.includes('does not exist') ||
            error.code === 'PGRST301' ||
            (error as any)?.status === 401) {
          console.log('⚠️ Problema com banco/autenticação, usando dados mockados')
          const mockEmpresas: Empresa[] = [
            {
              id: 1,
              created_at: new Date().toISOString(),
              empresa: 'Empresa Teste (Mock - DB Error)',
              cnpj: '52121446000178',
              contato: 'Contato Teste',
              whatsapp: '66999999999',
              chave: 'f552a3d5-b400-4199-b852-e04deb4c36b1',
              ativo: true,
              patrono: false,
              pacote: 1,
              nome_sistema: 'ECOCENTAURO ACCESS'
            }
          ]
          return { success: true, data: mockEmpresas }
        }
        return { success: false, error: error.message || 'Erro na consulta' }
      }

      // Se não há dados na tabela, retornar empresa padrão
      if (!data || data.length === 0) {
        console.log('⚠️ Nenhuma empresa encontrada na tabela, usando empresa padrão')
        const empresaPadrao: Empresa[] = [
          {
            id: 1,
            created_at: new Date().toISOString(),
            empresa: 'Empresa Padrão (Sem dados)',
            cnpj: '52121446000178',
            contato: 'Contato Padrão',
            whatsapp: '66999999999',
            chave: 'f552a3d5-b400-4199-b852-e04deb4c36b1',
            ativo: true,
            patrono: false,
            pacote: 1,
            nome_sistema: 'ECOCENTAURO ACCESS'
          }
        ]
        return { success: true, data: empresaPadrao }
      }

      console.log(`✅ Encontradas ${data.length} empresas`)
      return { success: true, data }
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar empresas:', error)
      console.log('🔧 Retornando dados mockados devido ao erro')
      // Em caso de erro inesperado, retorna dados mockados
      const mockEmpresas: Empresa[] = [
        {
          id: 1,
          created_at: new Date().toISOString(),
          empresa: 'Empresa Teste (Mock - Exception)',
          cnpj: '52121446000178',
          contato: 'Contato Teste',
          whatsapp: '66999999999',
          chave: 'f552a3d5-b400-4199-b852-e04deb4c36b1',
          ativo: true,
          patrono: false,
          pacote: 1,
          nome_sistema: 'ECOCENTAURO ACCESS'
        }
      ]
      return { success: true, data: mockEmpresas }
    }
  },

  // Aniversariantes - Buscar do Supabase
  async getAniversariantes(empresaChave: string): Promise<ApiResponse<Aniversariante[]>> {
    try {
      // Buscar dados completos da empresa pela chave (usando a mesma fonte que a interface)
      const empresaResult = await this.getEmpresaData(empresaChave)
      if (!empresaResult.success || !empresaResult.data) {
        return { success: false, error: 'Empresa não encontrada' }
      }
      
      const empresaId = empresaResult.data.id
      console.log('🔍 Buscando aniversariantes para empresa:', empresaResult.data.empresa, 'ID:', empresaId)
      
      // Buscar aniversariantes para a empresa específica
      const { data, error } = await supabase
        .from('aniversariantes')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar aniversariantes:', error)
        return { success: false, error: error.message || 'Erro na consulta de aniversariantes' }
      }

      console.log(`✅ Encontrados ${data?.length || 0} aniversariantes`)
      return { success: true, data: data || [] }
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar aniversariantes:', error)
      console.log('🔧 Retornando dados mockados devido ao erro')
      // Em caso de erro inesperado, retorna dados mockados
      const mockData: Aniversariante[] = [
        {
          id: Math.floor(Math.random() * 1000) + 2000,
          created_at: new Date().toISOString(),
          codigo: `ERROR01`,
          nome: `Aniversariante Fallback`,
          dataNascimento: '1990-06-15',
          telefone: null,
          celular: '66999999999',
          empresa_id: 1,
          enviou_msg: false,
          mensagem: 'Feliz aniversário! 🎉',
          whatsapp_msg: null,
          data_envio: null
        }
      ]
      return { success: true, data: mockData }
    }
  },

  // Aniversariantes - Coleta (1ª chamada webhook)
  async coletarAniversariantes(cnpj: string, dataInicial: string, dataFinal: string, nomeSistema: string): Promise<ApiResponse<any>> {
    try {
      const payload = {
        cnpj,
        comando: "aniversariantes",
        data_inicial: dataInicial,
        data_final: dataFinal,
        nomeSistema
      }

      const response = await fetch(WEBHOOK_ANIVERSARIANTES_COLETA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro na resposta:', errorText)
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Webhook executado com sucesso:', data)
      return { success: true, data }
    } catch (error) {
      console.error('💥 Erro na requisição:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Aniversariantes - Envio de mensagens (2ª chamada webhook)
  async enviarMensagensAniversariantes(cnpj: string, aniversariantes: any[], nomeSistema: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(WEBHOOK_ANIVERSARIANTES_ENVIO, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnpj,
          comando: "mensagem_aniversariantes",
          aniversariantes,
          nomeSistema
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
  async getCobrancas(empresaChave: string): Promise<ApiResponse<Cobranca[]>> {
    try {
      // Buscar dados completos da empresa pela chave (usando a mesma fonte que a interface)
      const empresaResult = await this.getEmpresaData(empresaChave)
      if (!empresaResult.success || !empresaResult.data) {
        return { success: false, error: 'Empresa não encontrada' }
      }
      
      const empresaId = empresaResult.data.id

      const { data, error } = await supabase
        .from('cobranca')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('vencimento', { ascending: true })

      if (error) {
        const errorInfo = {
          code: error.code || 'UNKNOWN',
          message: error.message || 'Erro desconhecido',
          details: error.details || null,
          hint: error.hint || null,
          httpStatus: (error as any)?.status || null,
          fullError: error
        }
        console.error('Erro ao buscar cobranças:', errorInfo)
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
  async coletarCobrancas(
    cnpj: string, 
    tipoCobranca: 'vencidas' | 'vencehoje' | 'venceamanha' | 'custom',
    nomeSistema: string,
    dataInicial?: string, 
    dataFinal?: string
  ): Promise<ApiResponse<any>> {
    try {
      const comandoMap = {
        'vencidas': 'cobrancasvencidas',
        'vencehoje': 'cobrancasvencehoje', 
        'venceamanha': 'cobrancasvenceamanha',
        'custom': 'cobrancascustom'
      }

      // Para período customizado, adicionar timestamp para evitar cache
      const payload: any = {
        cnpj,
        comando: comandoMap[tipoCobranca],
        nomeSistema,
        data_inicial: dataInicial,
        data_final: dataFinal,
        // URL da Edge Function para callback após processamento
        callback_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bslsxolmfzrvprghxfrr.supabase.co'}/functions/v1/cobranca`
      }

      // Adicionar timestamp para quebrar cache em chamadas customizadas
      if (tipoCobranca === 'custom') {
        payload.timestamp = new Date().getTime()
        payload.cache_bust = Math.random().toString(36).substring(7)
      }

      console.log('🚀 Enviando requisição de coleta de cobranças:', payload)

      const response = await fetch(WEBHOOK_COBRANCAS_COLETA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Adicionar header para evitar cache no período customizado
          ...(tipoCobranca === 'custom' && {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          })
        },
        body: JSON.stringify(payload)
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
  async enviarMensagensCobrancas(cnpj: string, cobrancas: Cobranca[], nomeSistema: string): Promise<ApiResponse<any>> {
    try {
      console.log('🚀 Enviando mensagens de cobrança:', {
        cnpj,
        quantidade: cobrancas.length,
        webhook_url: WEBHOOK_COBRANCAS_ENVIO,
        ambiente: process.env.NODE_ENV,
        cobrancas: cobrancas.map(c => ({ id: c.id, nome: c.nome, valor: c.valor }))
      })

      // Formatar payload exatamente como no cURL fornecido
      const payload = {
        cnpj: cnpj || null, // Permitir null como no exemplo
        comando: "atualizar_cobranca",
        nomeSistema,
        cobrancas: cobrancas.map(cobranca => ({
          id: cobranca.id,
          empresa: cobranca.empresa || "1",
          codigo: cobranca.codigo || "",
          nome: cobranca.nome,
          celular: cobranca.celular || "",
          codcobranca: cobranca.codcobranca || "",
          vencimento: cobranca.vencimento,
          valor: cobranca.valor?.toString() || "0",
          parcela: cobranca.parcela || "1",
          created_at: cobranca.created_at || new Date().toISOString(),
          empresa_id: cobranca.empresa_id?.toString() || "7",
          enviou: true, // Sempre true quando enviando
          mensagem: cobranca.mensagem || ""
        }))
      }

      console.log('📤 Payload sendo enviado:', JSON.stringify(payload, null, 2))

      const response = await fetch(WEBHOOK_COBRANCAS_ENVIO, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      console.log('📥 Resposta do webhook:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Erro na resposta do webhook:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('✅ Resposta bem-sucedida do webhook:', data)
      return { success: true, data }
    } catch (error) {
      console.error('💥 Erro na função enviarMensagensCobrancas:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Atualizar celular (Supabase)
  async atualizarCelular(
    tipo: 'aniversariante' | 'cobranca', 
    id: string | number, 
    celular: string
  ): Promise<ApiResponse<any>> {
    try {
      const tabela = tipo === 'aniversariante' ? 'aniversariantes' : 'cobranca'
      
      const { data, error } = await supabase
        .from(tabela)
        .update({ celular: celular || null })
        .eq('id', id)
        .select()

      if (error) {
        console.error('Erro ao atualizar celular:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data?.[0] }
    } catch (error) {
      console.error('Erro ao atualizar celular:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Atualizar mensagem (Supabase)
  async atualizarMensagem(
    tipo: 'aniversariante' | 'cobranca', 
    id: string | number, 
    mensagem: string
  ): Promise<ApiResponse<any>> {
    try {
      const tabela = tipo === 'aniversariante' ? 'aniversariantes' : 'cobranca'
      
      const { data, error } = await supabase
        .from(tabela)
        .update({ mensagem: mensagem || null })
        .eq('id', id)
        .select()

      if (error) {
        console.error('Erro ao atualizar mensagem:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data?.[0] }
    } catch (error) {
      console.error('Erro ao atualizar mensagem:', error)
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
      
      // Se está marcando como enviado, salvar a data de envio
      if (enviou) {
        updateData.data_envio = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from(tabela)
        .update(updateData)
        .eq('id', id)

      if (error) {
        const errorInfo = {
          code: error.code || 'UNKNOWN',
          message: error.message || 'Erro desconhecido',
          details: error.details || null,
          hint: error.hint || null,
          httpStatus: (error as any)?.status || null,
          fullError: error
        }
        console.error('Erro ao atualizar status:', errorInfo)
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

  // Métricas do dashboard
  async getMetricas(empresaChave: string): Promise<ApiResponse<DashboardMetrics>> {
    try {
      const empresaId = await getEmpresaIdByChave(empresaChave)
      if (!empresaId) {
        return { success: false, error: 'Empresa não encontrada' }
      }

      const [aniversariantesResult, cobrancasResult] = await Promise.all([
        this.getAniversariantes(empresaChave),
        this.getCobrancas(empresaChave)
      ])

      const aniversariantes = aniversariantesResult.success ? aniversariantesResult.data || [] : []
      const cobrancas = cobrancasResult.success ? cobrancasResult.data || [] : []

      const metrics: DashboardMetrics = {
        totalAniversariantes: aniversariantes.length,
        aniversariantesEnviados: aniversariantes.filter(a => a.enviou_msg).length,
        aniversariantesPendentes: aniversariantes.filter(a => !a.enviou_msg).length,
        totalCobrancas: cobrancas.length,
        cobrancasEnviadas: cobrancas.filter(c => c.enviou).length,
        cobrancasPendentes: cobrancas.filter(c => !c.enviou).length,
        valorTotalCobrancas: cobrancas.reduce((sum, c) => sum + (c.valor || 0), 0),
        valorCobrancasVencidas: cobrancas
          .filter(c => c.vencimento && new Date(c.vencimento) < new Date())
          .reduce((sum, c) => sum + (c.valor || 0), 0)
      }

      return { success: true, data: metrics }
    } catch (error) {
      console.error('Erro ao buscar métricas:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Relatórios
  async getRelatorios(empresaChave: string): Promise<ApiResponse<any[]>> {
    // Por enquanto, retorna dados mockados
    return { success: true, data: [] }
  },

  // Configurações (busca configurações da view)
  async getConfiguracoes(empresaChave: string): Promise<ApiResponse<VwPacoteDetalhesRegras[]>> {
    return this.getEmpresaConfiguracoes(empresaChave)
  },

  // Salvar configurações
  async saveConfiguracoes(empresaChave: string, dados: any): Promise<ApiResponse<any>> {
    // Por enquanto, apenas simula o salvamento
    return { success: true, data: dados }
  },

  // === FUNÇÕES PARA REGRAS DE AUTOMAÇÃO ===

  // Buscar regras da empresa
  async getRegras(empresaChave: string): Promise<ApiResponse<Regra[]>> {
    try {
      const empresaId = await getEmpresaIdByChave(empresaChave)
      if (!empresaId) {
        return { success: false, error: 'Empresa não encontrada' }
      }

      const { data, error } = await supabase
        .from('regras')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('id', { ascending: true })

      if (error) {
        console.error('Erro ao buscar regras:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Erro ao buscar regras:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Buscar detalhes das regras
  async getRegrasDetalhes(regraId: number): Promise<ApiResponse<RegraDetalhe[]>> {
    try {
      const { data, error } = await supabase
        .from('regras_detalhes')
        .select('*')
        .eq('regra_id', regraId)
        .order('valor', { ascending: true })

      if (error) {
        console.error('Erro ao buscar detalhes das regras:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Erro ao buscar detalhes das regras:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Buscar regras completas com detalhes (para Setup)
  async getRegrasCompletas(empresaChave: string): Promise<ApiResponse<any[]>> {
    try {
      const empresaId = await getEmpresaIdByChave(empresaChave)
      if (!empresaId) {
        return { success: false, error: 'Empresa não encontrada' }
      }
      
      // Buscar regras com join nos pacote_detalhes
      const { data, error } = await supabase
        .from('regras')
        .select(`
          *,
          pacote_detalhes:pacote_det_id (
            id,
            item,
            ativo
          ),
          regras_detalhes (
            id,
            habilitado,
            valor,
            descricao,
            auto
          )
        `)
        .eq('empresa_id', empresaId)
        .order('id', { ascending: true })

      if (error) {
        console.error('Erro ao buscar regras completas:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Erro ao buscar regras completas:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Atualizar regra
  async atualizarRegra(regraId: number, dados: Partial<Regra>): Promise<ApiResponse<Regra>> {
    try {
      const { data, error } = await supabase
        .from('regras')
        .update(dados)
        .eq('id', regraId)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar regra:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar regra:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  },

  // Atualizar detalhe da regra
  async atualizarRegraDetalhe(detalheId: number, dados: Partial<RegraDetalhe>): Promise<ApiResponse<RegraDetalhe>> {
    try {
      const { data, error } = await supabase
        .from('regras_detalhes')
        .update(dados)
        .eq('id', detalheId)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar detalhe da regra:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      console.error('Erro ao atualizar detalhe da regra:', error)
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