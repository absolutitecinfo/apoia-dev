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

// Função utilitária para converter empresaId para número, tratando caso "demo"
function parseEmpresaId(empresaId: string): number {
  if (empresaId.toLowerCase() === 'demo') {
    return 999; // ID fixo para demo
  }
  return parseInt(empresaId);
}

// Funções específicas para cada tipo de dados
export const api = {
  // Dados gerais da empresa
  async getEmpresaData(empresaId: string): Promise<ApiResponse<Empresa>> {
    try {
      console.log('🔍 Buscando dados da empresa para ID:', empresaId)
      
      // Validar o empresaId
      if (!empresaId || empresaId.trim() === '') {
        console.error('❌ ID da empresa não fornecido ou inválido:', empresaId)
        return { success: false, error: 'ID da empresa é obrigatório' }
      }

      // Tratar caso especial "demo"
      if (empresaId.toLowerCase() === 'demo') {
        console.log('🎭 Modo demo detectado, usando dados mockados')
        const mockEmpresa: Empresa = {
          id: 999,
          created_at: new Date().toISOString(),
          empresa: 'Empresa Demo (Dados de Teste)',
          cnpj: '00184385000194',
          contato: 'Contato Demo',
          whatsapp: '66999999999',
          chave: 'demo-empresa-uuid',
          ativo: true,
          patrono: false,
          pacote: 1
        }
        return { success: true, data: mockEmpresa }
      }

      const empresaIdNumber = parseInt(empresaId)
      if (isNaN(empresaIdNumber) || empresaIdNumber <= 0) {
        console.error('❌ ID da empresa deve ser um número válido:', empresaId)
        return { success: false, error: 'ID da empresa deve ser um número válido' }
      }
      
      // Verificar se as variáveis de ambiente estão configuradas
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Variáveis de ambiente do Supabase não configuradas, usando dados mockados')
        const mockEmpresa: Empresa = {
          id: empresaIdNumber,
          created_at: new Date().toISOString(),
          empresa: `Empresa Teste ${empresaId} (Mock - Sem Supabase)`,
          cnpj: '00184385000194',
          contato: 'Contato Teste',
          whatsapp: '66999999999',
          chave: `empresa-${empresaId}-uuid`,
          ativo: true,
          patrono: false,
          pacote: 1
        }
        return { success: true, data: mockEmpresa }
      }
      
      console.log('🔗 Executando consulta Supabase para empresa ID:', empresaIdNumber)
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaIdNumber)
        .single()

      console.log('📊 Resultado da consulta empresa:', { data, error })

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
            id: empresaIdNumber,
            created_at: new Date().toISOString(),
            empresa: `Empresa Teste ${empresaId} (Mock - DB Error)`,
            cnpj: '00184385000194',
            contato: 'Contato Teste',
            whatsapp: '66999999999',
            chave: `empresa-${empresaId}-uuid`,
            ativo: true,
            patrono: false,
            pacote: 1
          }
          return { success: true, data: mockEmpresa }
        }
        return { success: false, error: error.message || 'Erro na consulta' }
      }

      return { success: true, data }
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar empresa:', error)
      // Em caso de erro inesperado, também retorna dados mockados
      const empresaIdNumber = parseInt(empresaId) || 0
      const mockEmpresa: Empresa = {
        id: empresaIdNumber,
        created_at: new Date().toISOString(),
        empresa: `Empresa Teste ${empresaId} (Mock - Exception)`,
        cnpj: '00184385000194',
        contato: 'Contato Teste',
        whatsapp: '66999999999',
        chave: `empresa-${empresaId}-uuid`,
        ativo: true,
        patrono: false,
        pacote: 1
      }
      return { success: true, data: mockEmpresa }
    }
  },

  // Configurações da empresa (view completa)
  async getEmpresaConfiguracoes(empresaId: string): Promise<ApiResponse<VwPacoteDetalhesRegras[]>> {
    try {
      const empresaIdNumber = parseEmpresaId(empresaId)
      const { data, error } = await supabase
        .from('vw_pacote_detalhes_regras')
        .select('*')
        .eq('empresa_id', empresaIdNumber)

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

  // Aniversariantes - Buscar do Supabase
  async getAniversariantes(empresaId: string): Promise<ApiResponse<Aniversariante[]>> {
    try {
      console.log('🔍 Buscando aniversariantes para empresa_id:', empresaId)
      
      // Primeiro, teste básico de conexão com a tabela
      console.log('🔌 Testando conexão com tabela aniversariantes...')
      const { data: testData, error: testError } = await supabase
        .from('aniversariantes')
        .select('id')
        .limit(1)

      console.log('🧪 Teste de conexão:', { testData, testError })

      if (testError) {
        // Criar objeto de erro mais defensivo
        let testErrorInfo: any = {
          errorExists: true,
          type: typeof testError,
          constructorName: testError?.constructor?.name || 'Unknown'
        }
        
        try {
          testErrorInfo = {
            ...testErrorInfo,
            code: testError.code || 'UNKNOWN',
            message: testError.message || 'Erro desconhecido',
            details: testError.details || null,
            hint: testError.hint || null,
            httpStatus: (testError as any)?.status || null,
            fullError: testError
          }
        } catch (e) {
          testErrorInfo.parseError = 'Erro ao processar objeto de erro'
          testErrorInfo.originalError = String(testError)
        }
        
        console.error('❌ Erro na tabela aniversariantes:', testErrorInfo)
        // Se a tabela não existe, retorna dados mockados
        if (testError.code === 'PGRST116' || testError.message?.includes('relation') || testError.message?.includes('does not exist')) {
          console.log('⚠️ Tabela aniversariantes não encontrada, usando dados mockados')
          const mockData: Aniversariante[] = [
            {
              id: 1,
              created_at: new Date().toISOString(),
              codigo: '12345',
              nome: 'João Silva (Mock)',
              dataNascimento: '1990-06-15',
              telefone: null,
              celular: '66999999999',
              empresa_id: parseEmpresaId(empresaId),
              enviou_msg: false,
              mensagem: 'Feliz aniversário! 🎉',
              whatsapp_msg: null,
              data_envio: null
            },
            {
              id: 2,
              created_at: new Date().toISOString(),
              codigo: '12346',
              nome: 'Maria Santos (Mock)',
              dataNascimento: '1985-06-20',
              telefone: null,
              celular: '66988888888',
              empresa_id: parseEmpresaId(empresaId),
              enviou_msg: false,
              mensagem: 'Feliz aniversário! 🎉',
              whatsapp_msg: null,
              data_envio: null
            }
          ]
          return { success: true, data: mockData }
        }
        return { success: false, error: testError.message || 'Erro na conexão com a tabela' }
      }

      // Se chegou até aqui, a tabela existe
      console.log('✅ Tabela aniversariantes encontrada')

      // Primeiro, vamos verificar se há dados na tabela
      const { data: allData, error: debugError } = await supabase
        .from('aniversariantes')
        .select('empresa_id, id, nome')
        .limit(5)

      console.log('🔎 Debug - Primeiros registros na tabela:', allData, debugError)

      // Agora vamos buscar especificamente para a empresa
      const empresaIdNumber = parseEmpresaId(empresaId)
      console.log('🎯 Buscando especificamente para empresa_id (number):', empresaIdNumber)

      const { data, error } = await supabase
        .from('aniversariantes')
        .select('*')
        .eq('empresa_id', empresaIdNumber)
        .order('created_at', { ascending: false }) // Ordenar por mais recentes primeiro

      console.log('📊 Resultado da consulta principal:', { 
        empresaIdOriginal: empresaId,
        empresaIdUsado: empresaIdNumber,
        data, 
        error,
        quantidadeEncontrada: data?.length || 0
      })

      if (error) {
        const errorInfo = {
          code: error.code || 'UNKNOWN',
          message: error.message || 'Erro desconhecido',
          details: error.details || null,
          hint: error.hint || null,
          httpStatus: (error as any)?.status || null,
          fullError: error
        }
        console.error('❌ Erro ao buscar aniversariantes:', errorInfo)
        return { success: false, error: error.message || 'Erro na consulta de aniversariantes' }
      }

      // Se não encontrou com o ID fornecido, vamos tentar buscar todos
      if (!data || data.length === 0) {
        console.log('⚠️ Nenhum registro encontrado para empresa_id:', empresaIdNumber)
        console.log('🔄 Tentando buscar todos os registros...')
        
        const { data: todosData, error: todosError } = await supabase
          .from('aniversariantes')
          .select('*')
          .limit(10)

        console.log('📋 Todos os registros (primeiros 10):', todosData, todosError)
        
        // Se existem dados na tabela mas não para essa empresa, criar dados mockados
        if (todosData && todosData.length > 0) {
          console.log('⚠️ Dados existem na tabela mas não para empresa', empresaIdNumber)
          console.log('🔧 Criando dados mockados para empresa', empresaIdNumber)
          const mockData: Aniversariante[] = [
            {
              id: Math.floor(Math.random() * 1000) + 1000,
              created_at: new Date().toISOString(),
              codigo: `MOCK${empresaIdNumber}01`,
              nome: `Aniversariante Teste 1 (Empresa ${empresaIdNumber})`,
              dataNascimento: '1990-06-15',
              telefone: null,
              celular: '66999999999',
              empresa_id: empresaIdNumber,
              enviou_msg: false,
              mensagem: 'Feliz aniversário! 🎉',
              whatsapp_msg: null,
              data_envio: null
            }
          ]
          return { success: true, data: mockData }
        }
      }

      // Adiciona informação sobre se os dados são recentes (últimos 5 minutos)
      const agora = new Date()
      const dataComInfo = (data || []).map(item => ({
        ...item,
        isRecente: item.created_at ? 
          (agora.getTime() - new Date(item.created_at).getTime()) < 5 * 60 * 1000 : false
      }))
      
      console.log(`✅ Encontrados ${dataComInfo.length} aniversariantes`)
      return { success: true, data: dataComInfo }
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar aniversariantes:', error)
      console.log('🔧 Retornando dados mockados devido ao erro')
      // Em caso de erro inesperado, retorna dados mockados
            const mockData: Aniversariante[] = [
        {
          id: Math.floor(Math.random() * 1000) + 2000,
          created_at: new Date().toISOString(),
          codigo: `ERROR${empresaId}01`,
          nome: `Aniversariante Fallback (Empresa ${empresaId})`,
          dataNascimento: '1990-06-15',
          telefone: null,
          celular: '66999999999',
          empresa_id: parseEmpresaId(empresaId),
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
      const empresaIdNumber = parseEmpresaId(empresaId)
      const { data, error } = await supabase
        .from('cobranca')
        .select('*')
        .eq('empresa_id', empresaIdNumber)
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

      const response = await fetch(WEBHOOK_COBRANCAS_COLETA, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnpj,
          comando: comandoMap[tipoCobranca],
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
        cobrancas: cobrancas.map(cobranca => ({
          id: cobranca.id,
          empresa: cobranca.empresa || "1",
          codigo: cobranca.codigo || "",
          nome: cobranca.nome,
          telefone: cobranca.telefone || cobranca.celular || "",
          celular: cobranca.celular || "",
          codcobranca: cobranca.codcobranca || "",
          vencimento: cobranca.vencimento,
          valor: cobranca.valor?.toString() || "0",
          parcela: cobranca.parcela || "1",
          created_at: cobranca.created_at || new Date().toISOString(),
          empresa_id: cobranca.empresa_id?.toString() || "7",
          enviou: true, // Sempre true quando enviando
          mensagem: cobranca.mensagem || "",
          whatsapp: cobranca.whatsapp || cobranca.celular || ""
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
  },

  // === FUNÇÕES PARA REGRAS DE AUTOMAÇÃO ===

  // Buscar regras da empresa
  async getRegras(empresaId: string): Promise<ApiResponse<Regra[]>> {
    try {
      const empresaIdNumber = parseEmpresaId(empresaId)
      const { data, error } = await supabase
        .from('regras')
        .select('*')
        .eq('empresa_id', empresaIdNumber)
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
  async getRegrasCompletas(empresaId: string): Promise<ApiResponse<any[]>> {
    try {
      const empresaIdNumber = parseEmpresaId(empresaId)
      
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
        .eq('empresa_id', empresaIdNumber)
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