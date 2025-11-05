"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { DashboardTab } from "../DashboardTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Search, Send, RefreshCw, AlertTriangle, Users, X, CheckCircle, AlertCircle, Info, Clock, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { LoadingSpinner, LoadingOverlay } from "@/components/ui/loading-spinner"

import { supabase } from "@/lib/supabase"
import type { Cobranca, Empresa } from "@/lib/types"

interface CobrancasTabProps {
  empresaChave: string
  isLoading?: boolean
}

export function CobrancasTab({ empresaChave, isLoading }: CobrancasTabProps) {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [empresaAtual, setEmpresaAtual] = useState<Empresa | null>(null)
  const [loadingColeta, setLoadingColeta] = useState(false)
  const [loadingEnvio, setLoadingEnvio] = useState(false)
  const [loadingIndividual, setLoadingIndividual] = useState<string | null>(null)
  const [loadingRefresh, setLoadingRefresh] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [dataInicial, setDataInicial] = useState(new Date().toISOString().split('T')[0])
  const [dataFinal, setDataFinal] = useState(new Date().toISOString().split('T')[0])
  const [tipoCobranca, setTipoCobranca] = useState<'vencidas' | 'vencehoje' | 'venceamanha' | 'custom'>('vencidas')
  const [mensagemPadrao, setMensagemPadrao] = useState("Olá [nome], lembrete sobre suas notas vencidas. Por favor, regularize o mais breve possível! Se você já fez o pagamento, por favor, desconsidere essa mensagem.")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para filtros de estatísticas
  const [filtroEstatisticas, setFiltroEstatisticas] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos')

  // Estados para seleção de cobranças
  const [cobrancasSelecionadas, setCobrancasSelecionadas] = useState<Set<string>>(new Set())
  // Contador para forçar re-renderização quando o Set mudar
  const [versaoSelecao, setVersaoSelecao] = useState(0)

  // Estado para controlar toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info')

  // Função para toast melhorada
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', autoHide: boolean = true) => {
    console.log(`${type.toUpperCase()}: ${message}`)
    setToastMessage(message)
    setToastType(type)
    
    // Auto-hide após 5 segundos se autoHide for true
    if (autoHide) {
      setTimeout(() => {
        setToastMessage(null)
      }, 5000)
    }
  }

  // Função para fechar toast manualmente
  const closeToast = () => {
    setToastMessage(null)
  }

  // Função auxiliar para formatar data no timezone do Brasil
  // Converte string "YYYY-MM-DD" para data local (não UTC) e formata
  const formatarDataBrasil = (dataString: string | null): string => {
    if (!dataString) return '-'
    
    // Se a string tem apenas data (sem hora), tratar como data local
    if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dataString.split('-').map(Number)
      const dataLocal = new Date(year, month - 1, day) // month - 1 porque Date usa índice 0-11
      return dataLocal.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    }
    
    // Se for timestamp ISO, converter para timezone do Brasil
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  }

  // Função auxiliar para formatar data e hora no timezone do Brasil
  const formatarDataHoraBrasil = (timestamp: string | null): { data: string; hora: string } => {
    if (!timestamp) return { data: '-', hora: '-' }
    
    const data = new Date(timestamp)
    const dataFormatada = data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const horaFormatada = data.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    
    return { data: dataFormatada, hora: horaFormatada }
  }

  // Função auxiliar para obter data atual no timezone do Brasil (sem horas)
  const getDataAtualBrasil = (): Date => {
    // Obter componentes da data atual no timezone do Brasil
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
    const partes = formatter.formatToParts(new Date())
    const dia = parseInt(partes.find(p => p.type === 'day')?.value || '1', 10)
    const mes = parseInt(partes.find(p => p.type === 'month')?.value || '1', 10) - 1 // mês 0-indexed
    const ano = parseInt(partes.find(p => p.type === 'year')?.value || '2025', 10)
    
    // Criar data local (não UTC) com os componentes obtidos
    return new Date(ano, mes, dia, 0, 0, 0, 0)
  }

  // Função para buscar dados da empresa atual
  const buscarEmpresaAtual = async () => {
    try {
      console.log('🏢 Buscando dados da empresa para chave:', empresaChave)
      const result = await api.getEmpresaData(empresaChave)
      
      if (result.success && result.data) {
        setEmpresaAtual(result.data)
        console.log('✅ Empresa carregada:', result.data)
      } else {
        console.error('❌ Erro ao buscar empresa:', result.error)
        showToast(`Erro ao carregar dados da empresa: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('💥 Erro inesperado ao buscar empresa:', error)
      showToast("Erro ao carregar dados da empresa", 'error')
    }
  }

  // Função para processar variáveis na mensagem
  const processarMensagem = (mensagem: string, cobranca: Cobranca): string => {
    if (!mensagem) return mensagem

    // Extrair o primeiro nome (antes do primeiro espaço)
    const primeiroNome = cobranca.nome?.split(' ')[0] || 'Cliente'
    
    // Substituir as variáveis
    return mensagem
      .replace(/\[nome\]/gi, primeiroNome)
      .replace(/\[nome_completo\]/gi, cobranca.nome || 'Cliente')
      .replace(/\[valor\]/gi, `R$ ${(cobranca.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      .replace(/\[vencimento\]/gi, cobranca.vencimento ? formatarDataBrasil(cobranca.vencimento) : 'Data não informada')
  }

  // Funções para calcular estatísticas por período
  const getDataLimite = (filtro: typeof filtroEstatisticas) => {
    switch (filtro) {
      case 'hoje':
        // Usar data atual no timezone do Brasil (sem horas)
        return getDataAtualBrasil()
      case 'semana':
        const semana = new Date()
        // Calcular 7 dias atrás usando timezone do Brasil
        const dataAtualBrasil = getDataAtualBrasil()
        semana.setTime(dataAtualBrasil.getTime())
        semana.setDate(semana.getDate() - 7)
        return semana
      case 'mes':
        const mes = new Date()
        // Calcular 1 mês atrás usando timezone do Brasil
        const dataAtualBrasilMes = getDataAtualBrasil()
        mes.setTime(dataAtualBrasilMes.getTime())
        mes.setMonth(mes.getMonth() - 1)
        return mes
      case 'todos':
      default:
        return new Date(0) // Início dos tempos
    }
  }

  const calcularEstatisticas = (filtro: typeof filtroEstatisticas) => {
    const dataLimite = getDataLimite(filtro)
    
    // Função auxiliar para extrair apenas a data (sem horas) no timezone do Brasil
    const getDataBrasilSemHora = (timestamp: string | Date): Date => {
      const data = timestamp instanceof Date ? timestamp : new Date(timestamp)
      const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
      const partes = formatter.formatToParts(data)
      const dia = parseInt(partes.find(p => p.type === 'day')?.value || '1', 10)
      const mes = parseInt(partes.find(p => p.type === 'month')?.value || '1', 10) - 1
      const ano = parseInt(partes.find(p => p.type === 'year')?.value || '2025', 10)
      return new Date(ano, mes, dia, 0, 0, 0, 0)
    }

    // Garantir que apenas dados da empresa atual sejam considerados nas estatísticas
    // Converter ambos para número para garantir comparação correta
    const empresaId = empresaAtual?.id ? Number(empresaAtual.id) : null
    const cobrancasDaEmpresa = empresaId !== null
      ? cobrancas.filter(c => {
          const cobrancaEmpresaId = c.empresa_id !== null ? Number(c.empresa_id) : null
          return cobrancaEmpresaId === empresaId
        })
      : []
    
    // Debug: Log removido para evitar recálculos desnecessários durante digitação

    // Se filtro for "todos", não filtrar por data - contar todos
    const isFiltroTodos = filtro === 'todos'
    
    // Converter created_at para data no timezone do Brasil para comparação
    const coletadosNoPeriodo = cobrancasDaEmpresa.filter(c => {
      if (!c.created_at) {
        console.log('⚠️ Cobrança sem created_at:', c.id, c.nome)
        return false
      }
      
      // Se filtro é "todos", aceitar todas as cobranças que têm created_at
      if (isFiltroTodos) return true
      
      const dataCreatedBrasil = getDataBrasilSemHora(c.created_at)
      const dataLimiteBrasil = getDataBrasilSemHora(dataLimite)
      return dataCreatedBrasil >= dataLimiteBrasil
    })
    
    const enviadosNoPeriodo = cobrancasDaEmpresa.filter(c => {
      if (!c.data_envio) return false
      
      // Se filtro é "todos", aceitar todas as cobranças que têm data_envio
      if (isFiltroTodos) return true
      
      const dataEnvioBrasil = getDataBrasilSemHora(c.data_envio)
      const dataLimiteBrasil = getDataBrasilSemHora(dataLimite)
      return dataEnvioBrasil >= dataLimiteBrasil
    })
    
    const pendentesPeriodo = cobrancasDaEmpresa.filter(c => {
      if (!c.created_at || c.enviou) return false
      
      // Se filtro é "todos", aceitar todas as cobranças pendentes
      if (isFiltroTodos) return true
      
      const dataCreatedBrasil = getDataBrasilSemHora(c.created_at)
      const dataLimiteBrasil = getDataBrasilSemHora(dataLimite)
      return dataCreatedBrasil >= dataLimiteBrasil
    })

    const valorTotalPeriodo = coletadosNoPeriodo.reduce((sum, c) => sum + (c.valor || 0), 0)
    const valorEnviadoPeriodo = enviadosNoPeriodo.reduce((sum, c) => sum + (c.valor || 0), 0)
    const valorPendentePeriodo = pendentesPeriodo.reduce((sum, c) => sum + (c.valor || 0), 0)
    
    return {
      coletados: coletadosNoPeriodo.length,
      enviados: enviadosNoPeriodo.length,
      pendentes: pendentesPeriodo.length,
      total: cobrancasDaEmpresa.length,
      valorTotal: valorTotalPeriodo,
      valorEnviado: valorEnviadoPeriodo,
      valorPendente: valorPendentePeriodo
    }
  }

  // Memoizar apenas os campos relevantes para estatísticas (não incluir celular/mensagem que mudam durante digitação)
  const cobrancasStatsKey = useMemo(() => {
    return JSON.stringify(cobrancas.map(c => ({
      id: c.id,
      empresa_id: c.empresa_id,
      valor: c.valor,
      enviou: c.enviou,
      data_envio: c.data_envio,
      created_at: c.created_at
    })).sort((a, b) => a.id.localeCompare(b.id))) // Ordenar para garantir comparação estável
  }, [cobrancas])

  // Calcular estatísticas apenas quando campos relevantes mudarem (não quando celular/mensagem mudarem)
  const estatisticas = useMemo(() => {
    return calcularEstatisticas(filtroEstatisticas)
  }, [filtroEstatisticas, cobrancasStatsKey, empresaAtual?.id])

  // Função para buscar cobranças (1ª chamada)
  const coletarCobrancas = async () => {
    if (!empresaAtual?.cnpj) {
      showToast("CNPJ da empresa não encontrado. Aguarde o carregamento dos dados.", 'warning')
      return
    }

    setLoadingColeta(true)
    try {
      console.log('🚀 Iniciando coleta de cobranças para CNPJ:', empresaAtual.cnpj)
      
      // Se for período customizado, limpar cache local primeiro
      if (tipoCobranca === 'custom') {
        console.log('🧹 Limpando cache local para período customizado...')
        setCobrancas([])
        setCobrancasSelecionadas(new Set())
        showToast("🧹 Cache limpo para nova consulta personalizada", 'info')
      }
      
      const result = await api.coletarCobrancas(empresaAtual.cnpj, tipoCobranca, empresaAtual.nome_sistema || '', dataInicial, dataFinal)
      
      if (result.success) {
        console.log('✅ Webhook chamado com sucesso:', result.data)
        showToast("🔄 Processando cobranças... Os dados aparecerão automaticamente quando prontos.", 'info', false)
        
        // Verificação automática após 3 segundos
        setTimeout(() => {
          console.log('🔄 Verificação automática após webhook...')
          buscarCobrancasSupabase(false, true) // silentMode = true
        }, 3000)
        
        // Verificação automática após 8 segundos
        setTimeout(() => {
          console.log('🔄 Segunda verificação automática...')
          buscarCobrancasSupabase(false, true) // silentMode = true
        }, 8000)
        
        // Aguardar um tempo para ver se chegam dados via realtime
        setTimeout(() => {
          if (loadingColeta) {
            showToast("⏳ Processamento pode demorar alguns minutos. Os dados aparecerão automaticamente.", 'warning')
          }
        }, 10000)
      } else {
        console.error('❌ Erro no webhook:', result.error)
        showToast(`Erro: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('💥 Erro na comunicação:', error)
      showToast("Erro na comunicação com o webhook", 'error')
    } finally {
      setLoadingColeta(false)
    }
  }

  // Função para buscar cobranças do Supabase (após webhook processar)
  const buscarCobrancasSupabase = async (showLoadingState = false, silentMode = false) => {
    if (showLoadingState) setLoadingRefresh(true)
    try {
      console.log('🔄 Iniciando busca de cobranças para empresa:', empresaChave)
      
      const result = await api.getCobrancas(empresaChave)
      
      console.log('📋 Resultado completo da API:', result)
      
      if (result.success && result.data) {
        // Verificar se os dados realmente mudaram antes de atualizar o estado
        // Isso evita re-renderizações desnecessárias que travam o input
        const dadosNovos = result.data
        const dadosAtuais = cobrancas
        
        // Comparar por IDs e principais campos para evitar atualizações desnecessárias
        // Criar um mapa de IDs para comparação mais eficiente
        const mapaAtual = new Map(dadosAtuais.map(c => [c.id, c]))
        const dadosMudaram = dadosNovos.length !== dadosAtuais.length || 
          dadosNovos.some((nova: Cobranca) => {
            const atual = mapaAtual.get(nova.id)
            if (!atual) return true // Nova cobrança
            // Comparar apenas campos relevantes para estatísticas (não incluir celular/mensagem que mudam durante digitação)
            return nova.enviou !== atual.enviou ||
                   nova.vencimento !== atual.vencimento ||
                   nova.valor !== atual.valor ||
                   nova.data_envio !== atual.data_envio ||
                   nova.created_at !== atual.created_at
          })
        
        // Se há linhas em edição, não atualizar para evitar interromper digitação
        if (linhasEmEdicao.current.size > 0) {
          console.log('⏸️ Linhas em edição detectadas, pulando atualização para não interromper digitação')
          return
        }
        
        // Só atualizar se os dados realmente mudaram (ignorar mudanças em celular/mensagem para evitar re-render durante digitação)
        if (dadosMudaram) {
          setCobrancas(result.data)
        } else {
          console.log('⏭️ Dados não mudaram, pulando atualização para evitar re-render')
          return
        }
        
        // Mensagem diferente para dados mockados vs dados reais
        const isMockData = result.data.some(c => 
          c.nome?.includes('Mock') || 
          c.nome?.includes('Teste') || 
          c.nome?.includes('Fallback') ||
          c.codigo?.includes('MOCK') ||
          c.codigo?.includes('ERROR')
        )
        
        if (isMockData) {
          if (!silentMode) showToast(`${result.data.length} cobranças carregadas (dados de teste)`, 'info')
          console.log('⚠️ Dados mockados carregados:', result.data)
        } else {
          if (!silentMode) showToast(`${result.data.length} cobranças carregadas do banco`, 'success')
          console.log('✅ Dados reais carregados:', result.data)
        }
      } else if (result.success && (!result.data || result.data.length === 0)) {
        console.log('⚠️ Nenhuma cobrança encontrada')
        setCobrancas([])
      } else {
        console.error('❌ Erro da API:', result.error)
        showToast(`Erro ao buscar cobranças: ${result.error || 'Erro desconhecido'}`, 'error')
        
        // Em caso de erro, carrega dados mockados para teste
        const mockData: Cobranca[] = [
          {
            id: "fallback-001",
            empresa: "Empresa Teste",
            codigo: "CLI999",
            nome: "Cliente de Emergência",
            celular: "66999999999",
            codcobranca: "COB999",
            vencimento: new Date().toISOString().split('T')[0],
            valor: 150.00,
            parcela: 1,
            created_at: new Date().toISOString(),
            empresa_id: 1,
            enviou: false,
            mensagem: mensagemPadrao,
            data_envio: null
          }
        ]
        setCobrancas(mockData)
        if (!silentMode) showToast('Carregados dados de fallback para teste', 'warning')
      }
    } catch (error) {
      console.error('💥 Erro inesperado:', error)
      if (!silentMode) showToast("Erro crítico - usando dados de emergência", 'error')
      
      // Dados de emergência em caso de erro crítico
      const emergencyData: Cobranca[] = [
        {
          id: "emergency-001",
          empresa: "Dados de Emergência",
          codigo: "EMERGENCY01",
          nome: "Cliente de Emergência",
          celular: "66999999999",
          codcobranca: "EMERGENCY01",
          vencimento: new Date().toISOString().split('T')[0],
          valor: 100.00,
          parcela: 1,
          created_at: new Date().toISOString(),
          empresa_id: 1,
          enviou: false,
          mensagem: mensagemPadrao,
          data_envio: null
        }
      ]
      setCobrancas(emergencyData)
    } finally {
      if (showLoadingState) setLoadingRefresh(false)
    }
  }

  // Função específica para o botão de refresh
  const refreshCobrancas = async () => {
    await buscarCobrancasSupabase(true)
  }

  // Wrapper para o botão de refresh
  const handleRefreshClick = () => {
    refreshCobrancas()
  }

  // Função para enviar mensagens (2ª chamada)
  const enviarMensagens = async () => {
    if (!empresaAtual?.cnpj) {
      showToast("CNPJ da empresa não encontrado. Aguarde o carregamento dos dados.", 'warning')
      return
    }

    setLoadingEnvio(true)
    try {
      // Filtra apenas cobranças que não foram enviadas E que estão selecionadas
      const cobrancasSelecionadasParaEnvio = cobrancas
        .filter(c => !c.enviou && cobrancasSelecionadas.has(c.id))
      
      const cobrancasComNumeroValido = cobrancasSelecionadasParaEnvio
        .filter(c => {
          // Só incluir cobranças que tenham número válido
          return c.celular && c.celular.trim().length > 0
        })

      const cobrancasParaEnvio = cobrancasComNumeroValido
        .map(cobranca => {
          const mensagemBase = cobranca.mensagem || mensagemPadrao
          const mensagemProcessada = processarMensagem(mensagemBase, cobranca)
          return {
            ...cobranca,
            mensagem: mensagemProcessada
          }
        })

      if (cobrancasSelecionadasParaEnvio.length === 0) {
        showToast("Nenhuma cobrança selecionada para envio", 'info')
        return
      }

      if (cobrancasParaEnvio.length === 0) {
        showToast("Nenhuma das cobranças selecionadas possui número válido para envio", 'warning')
        return
      }

      // Informar se algumas cobranças foram filtradas
      const cobrancasFiltradas = cobrancasSelecionadasParaEnvio.length - cobrancasParaEnvio.length
      if (cobrancasFiltradas > 0) {
        showToast(`⚠️ ${cobrancasFiltradas} cobrança(s) ignorada(s) por não ter número válido`, 'warning')
      }

      // Salvar celular e mensagem no banco antes de enviar (garantir que está salvo)
      const savePromises = cobrancasParaEnvio.map(async (c) => {
        await salvarCelularNoBanco(c.id, c.celular || '')
        await salvarMensagemNoBanco(c.id, c.mensagem || mensagemPadrao)
      })
      await Promise.all(savePromises)
      
      // Remover da lista de linhas em edição após salvar
      cobrancasParaEnvio.forEach(c => {
        linhasEmEdicao.current.delete(c.id)
      })

      // Chama o webhook para envio das mensagens
      const result = await api.enviarMensagensCobrancas(empresaAtual.cnpj, cobrancasParaEnvio, empresaAtual.nome_sistema || '', empresaAtual.id)
      
      if (result.success) {
        // Verificar se algumas cobranças foram filtradas antes do envio
        const metadata = (result.data as any)?._metadata
        const cobrancasFiltradas = metadata?.cobrancasFiltradas || 0
        const cobrancasEnviadasCount = metadata?.cobrancasEnviadas || cobrancasParaEnvio.length

        // Filtrar cobranças inválidas da lista de atualização (usar apenas as que foram realmente enviadas)
        const idsInvalidas = new Set(metadata?.cobrancasInvalidas?.map((c: any) => c.id) || [])
        const cobrancasEnviadas = cobrancasParaEnvio.filter(c => !idsInvalidas.has(c.id))

        if (cobrancasFiltradas > 0) {
          showToast(`⚠️ ${cobrancasFiltradas} cobrança(s) filtrada(s) por serem inválidas (sem codcobranca ou empresa_id). ${cobrancasEnviadasCount} mensagem(s) enviada(s).`, 'warning')
        } else {
          showToast(`🎉 ${cobrancasEnviadasCount} mensagens de cobrança enviadas e removidas da lista!`, 'success')
        }
        
        // Atualiza o status no Supabase apenas para cobranças realmente enviadas
        const updatePromises = cobrancasEnviadas.map(cobranca => 
          api.atualizarStatusEnvio('cobranca', cobranca.id, true, cobranca.mensagem)
        )
        
        const updateResults = await Promise.all(updatePromises)
        const successCount = updateResults.filter(r => r.success).length
        
        if (successCount === cobrancasEnviadas.length && cobrancasEnviadas.length > 0) {
          // Atualiza o estado local apenas para cobranças realmente enviadas
          setCobrancas(prev => prev.map(c => 
            cobrancasEnviadas.find(cp => cp.id === c.id) 
              ? { ...c, enviou: true, mensagem: c.mensagem || mensagemPadrao, data_envio: new Date().toISOString() }
              : c
          ))
          
          // Remove as cobranças enviadas da seleção
          setCobrancasSelecionadas(prev => {
            const newSet = new Set(prev)
            cobrancasEnviadas.forEach(c => newSet.delete(c.id))
            return newSet
          })
          
          // Forçar atualização da versão de seleção para garantir re-renderização
          setVersaoSelecao((v: number) => v + 1)
          
          if (cobrancasFiltradas === 0) {
            showToast("Status atualizado no banco de dados", 'success')
          }
        } else if (cobrancasEnviadas.length > 0) {
          // Mesmo com falha parcial, atualizar as que foram enviadas com sucesso
          const idsEnviadasComSucesso = new Set(
            updateResults
              .map((r, idx) => r.success ? cobrancasEnviadas[idx].id : null)
              .filter(id => id !== null)
          )
          
          if (idsEnviadasComSucesso.size > 0) {
            setCobrancas(prev => prev.map(c => 
              idsEnviadasComSucesso.has(c.id)
                ? { ...c, enviou: true, mensagem: c.mensagem || mensagemPadrao, data_envio: new Date().toISOString() }
                : c
            ))
            
            // Remove da seleção apenas as que foram enviadas com sucesso
            setCobrancasSelecionadas(prev => {
              const newSet = new Set(prev)
              idsEnviadasComSucesso.forEach(id => newSet.delete(id))
              return newSet
            })
            
            // Forçar atualização da versão de seleção
            setVersaoSelecao((v: number) => v + 1)
          }
          
          showToast(`Mensagens enviadas, mas apenas ${successCount}/${cobrancasEnviadas.length} status atualizados no banco`, 'warning')
        }
      } else {
        showToast(`Erro ao enviar mensagens: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Erro:', error)
      showToast("Erro na comunicação com o webhook", 'error')
    } finally {
      setLoadingEnvio(false)
    }
  }

  // Função para salvar mensagem no banco
  const salvarMensagemNoBanco = async (id: string, novaMensagem: string) => {
    try {
      // Marcar como atualização própria ANTES de salvar (importante para evitar race condition)
      atualizacoesPropriasMensagem.current.add(id)
      console.log('📝 Marcando atualização de mensagem como própria:', id)
      
      const result = await api.atualizarMensagem('cobranca', id, novaMensagem)
      if (result.success) {
        console.log('✅ Mensagem atualizada no banco:', id)
        
        // Remover da lista de atualizações próprias após 5 segundos (tempo suficiente para Realtime processar)
        setTimeout(() => {
          atualizacoesPropriasMensagem.current.delete(id)
          console.log('🗑️ Removendo marcação de atualização própria de mensagem:', id)
        }, 5000)
      } else {
        console.error('❌ Erro ao atualizar mensagem:', result.error)
        showToast(`Erro ao salvar mensagem: ${result.error}`, 'error')
        atualizacoesPropriasMensagem.current.delete(id)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar mensagem:', error)
      showToast('Erro ao salvar mensagem no banco de dados', 'error')
      atualizacoesPropriasMensagem.current.delete(id)
    }
  }
  
  const atualizarMensagem = (id: string, novaMensagem: string) => {
    // Marcar linha como em edição (para evitar que Realtime interfira durante digitação)
    linhasEmEdicao.current.add(id)
    
    // Atualizar estado local imediatamente usando função de atualização
    // Isso evita recálculo de estatísticas pois não cria novo array se apenas mensagem mudou
    setCobrancas(prev => {
      const index = prev.findIndex(c => c.id === id)
      if (index === -1) return prev
      
      // Se apenas a mensagem mudou, não recriar o array inteiro (otimização)
      const atual = prev[index]
      if (atual.mensagem === novaMensagem) return prev
      
      // Criar novo array apenas com a cobrança modificada
      const novasCobrancas = [...prev]
      novasCobrancas[index] = { ...atual, mensagem: novaMensagem }
      return novasCobrancas
    })
    
    // Remover da lista de edição após 1 segundo de inatividade (debounce)
    setTimeout(() => {
      linhasEmEdicao.current.delete(id)
    }, 1000)
  }

  // Rastrear atualizações de celular que fizemos para evitar recarregar tudo via Realtime
  const atualizacoesPropriasCelular = useRef<Set<string>>(new Set())
  // Rastrear atualizações de mensagem que fizemos para evitar recarregar tudo via Realtime
  const atualizacoesPropriasMensagem = useRef<Set<string>>(new Set())
  // Rastrear linhas que estão sendo editadas (para evitar recarregar enquanto o usuário está editando)
  const linhasEmEdicao = useRef<Set<string>>(new Set())
  
  // Função para salvar celular no banco
  const salvarCelularNoBanco = async (id: string, novoCelular: string) => {
    try {
      // Marcar como atualização própria ANTES de salvar (importante para evitar race condition)
      atualizacoesPropriasCelular.current.add(id)
      console.log('📝 Marcando atualização de celular como própria:', id)
      
      const result = await api.atualizarCelular('cobranca', id, novoCelular)
      if (result.success) {
        console.log('✅ Celular atualizado no banco:', id, novoCelular)
        
        // Remover da lista de atualizações próprias após 5 segundos (tempo suficiente para Realtime processar)
        setTimeout(() => {
          atualizacoesPropriasCelular.current.delete(id)
          console.log('🗑️ Removendo marcação de atualização própria de celular:', id)
        }, 5000)
      } else {
        console.error('❌ Erro ao atualizar celular:', result.error)
        showToast(`Erro ao salvar celular: ${result.error}`, 'error')
        atualizacoesPropriasCelular.current.delete(id)
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar celular:', error)
      showToast('Erro ao salvar celular no banco de dados', 'error')
      atualizacoesPropriasCelular.current.delete(id)
    }
  }
  
  const atualizarCelular = (id: string, novoCelular: string) => {
    // Marcar linha como em edição (para evitar que Realtime interfira durante digitação)
    linhasEmEdicao.current.add(id)
    
    // Atualizar estado local imediatamente usando função de atualização
    // Isso evita recálculo de estatísticas pois não cria novo array se apenas celular mudou
    setCobrancas(prev => {
      const index = prev.findIndex(c => c.id === id)
      if (index === -1) return prev
      
      // Se apenas o celular mudou, não recriar o array inteiro (otimização)
      const atual = prev[index]
      if (atual.celular === novoCelular) return prev
      
      // Criar novo array apenas com a cobrança modificada
      const novasCobrancas = [...prev]
      novasCobrancas[index] = { ...atual, celular: novoCelular }
      return novasCobrancas
    })
    
    // Remover da lista de edição após 1 segundo de inatividade (debounce)
    setTimeout(() => {
      linhasEmEdicao.current.delete(id)
    }, 1000)
  }

  // Função para enviar mensagem individual
  const enviarMensagemIndividual = async (cobranca: Cobranca) => {
    if (!empresaAtual?.cnpj) {
      showToast("CNPJ da empresa não encontrado. Aguarde o carregamento dos dados.", 'warning')
      return
    }

    setLoadingIndividual(cobranca.id)
    try {
      // Verificar se há um número válido para envio
      if (!cobranca.celular || cobranca.celular.trim().length === 0) {
        showToast("Não há número válido para envio desta cobrança", 'error')
        setLoadingIndividual(null)
        return
      }

      // Salvar celular e mensagem no banco antes de enviar (garantir que está salvo)
      await salvarCelularNoBanco(cobranca.id, cobranca.celular)
      await salvarMensagemNoBanco(cobranca.id, cobranca.mensagem || mensagemPadrao)
      
      // Remover da lista de linhas em edição após salvar
      linhasEmEdicao.current.delete(cobranca.id)

      const mensagemBase = cobranca.mensagem || mensagemPadrao
      const mensagemProcessada = processarMensagem(mensagemBase, cobranca)
      
      const cobrancaComMensagem = {
        ...cobranca,
        mensagem: mensagemProcessada
      }

      const result = await api.enviarMensagensCobrancas(empresaAtual.cnpj, [cobrancaComMensagem], empresaAtual.nome_sistema || '', empresaAtual.id)
      
      if (result.success) {
        // Verificar se a cobrança foi realmente enviada (não foi filtrada)
        const metadata = (result.data as any)?._metadata
        const cobrancasFiltradas = metadata?.cobrancasFiltradas || 0
        const cobrancaFoiFiltrada = metadata?.cobrancasInvalidas?.some((c: any) => c.id === cobranca.id) || false

        if (cobrancaFoiFiltrada) {
          const motivo = metadata?.cobrancasInvalidas?.find((c: any) => c.id === cobranca.id)?.motivo || 'dados inválidos'
          showToast(`⚠️ Cobrança não enviada: ${motivo}`, 'warning')
          setLoadingIndividual(null)
          return
        }

        // Atualiza o status no Supabase apenas se foi realmente enviada
        const updateResult = await api.atualizarStatusEnvio('cobranca', cobranca.id, true, cobrancaComMensagem.mensagem)
        
        if (updateResult.success) {
          // Atualiza o estado local imediatamente
          setCobrancas(prev => prev.map(c => 
            c.id === cobranca.id 
              ? { ...c, enviou: true, mensagem: cobrancaComMensagem.mensagem, data_envio: new Date().toISOString() }
              : c
          ))
          // Remove a cobrança da seleção quando enviada
          setCobrancasSelecionadas(prev => {
            const newSet = new Set(prev)
            newSet.delete(cobranca.id)
            return newSet
          })
          
          // Forçar atualização da versão de seleção para garantir re-renderização
          setVersaoSelecao((v: number) => v + 1)
          
          showToast(`✅ Mensagem enviada para ${cobranca.nome} - removido da lista`, 'success')
        } else {
          showToast("Mensagem enviada, mas erro ao atualizar status no banco", 'warning')
        }
      } else {
        showToast(`Erro ao enviar mensagem: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Erro:', error)
      showToast("Erro ao enviar mensagem individual", 'error')
    } finally {
      setLoadingIndividual(null)
    }
  }

  // Função para excluir cobrança da lista e do banco
  const excluirCobranca = async (id: string) => {
    try {
      console.log('🗑️ Excluindo cobrança ID:', id)
      
      // Excluir do banco de dados
      const { error } = await supabase
        .from('cobranca')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('❌ Erro ao excluir do banco:', error)
        showToast(`Erro ao excluir do banco: ${error.message}`, 'error')
        return
      }
      
      // Se excluiu com sucesso do banco, remove da lista local
      setCobrancas(prev => prev.filter(c => c.id !== id))
      setCobrancasSelecionadas(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      
      // Forçar atualização da versão de seleção para garantir re-renderização
      setVersaoSelecao((v: number) => v + 1)
      
      console.log('✅ Cobrança excluída com sucesso')
      showToast("Cobrança excluída permanentemente", 'success')
      
    } catch (error) {
      console.error('💥 Erro inesperado ao excluir:', error)
      showToast("Erro inesperado ao excluir cobrança", 'error')
    }
  }

  // Função para marcar/desmarcar cobrança individual
  const toggleCobranca = (id: string) => {
    setCobrancasSelecionadas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Função para marcar/desmarcar todas as cobranças
  const toggleTodas = () => {
    console.log('🔄 toggleTodas chamado')
    const cobrancasPendentes = cobrancasFiltradas.map(c => c.id)
    const todasSelecionadasAtual = cobrancasPendentes.length > 0 && cobrancasPendentes.every(id => cobrancasSelecionadas.has(id))
    
    console.log('📊 Estado atual:', {
      cobrancasPendentes: cobrancasPendentes.length,
      todasSelecionadasAtual,
      selecionadasAtual: cobrancasSelecionadas.size
    })
    
    // Usar função de atualização que garante que o React detecte a mudança
    setCobrancasSelecionadas(prev => {
      const newSet = new Set(prev)
      
      if (todasSelecionadasAtual) {
        // Desmarcar todas
        console.log('❌ Desmarcando todas')
        cobrancasPendentes.forEach(id => newSet.delete(id))
      } else {
        // Marcar todas
        console.log('✅ Marcando todas')
        cobrancasPendentes.forEach(id => newSet.add(id))
      }
      
      console.log('✅ Novo estado:', newSet.size, 'IDs:', Array.from(newSet))
      return newSet
    })
    
    // Forçar re-renderização incrementando o contador
    setVersaoSelecao((v: number) => v + 1)
  }

  // Função para excluir todas as cobranças selecionadas
  const excluirTodasSelecionadas = async () => {
    const selecionadas = Array.from(cobrancasSelecionadas)
    
    if (selecionadas.length === 0) {
      showToast("Nenhuma cobrança selecionada para exclusão", 'warning')
      return
    }

    const confirmacao = window.confirm(`Tem certeza que deseja excluir ${selecionadas.length} cobrança(s) permanentemente?`)
    if (!confirmacao) return

    try {
      console.log('🗑️ Excluindo cobranças selecionadas:', selecionadas)
      
      // Excluir todas do banco de dados
      const { error } = await supabase
        .from('cobranca')
        .delete()
        .in('id', selecionadas)
      
      if (error) {
        console.error('❌ Erro ao excluir do banco:', error)
        showToast(`Erro ao excluir do banco: ${error.message}`, 'error')
        return
      }
      
      // Se excluiu com sucesso do banco, remove da lista local
      setCobrancas(prev => prev.filter(c => !selecionadas.includes(c.id)))
      setCobrancasSelecionadas(new Set())
      
      // Forçar atualização da versão de seleção para garantir re-renderização
      setVersaoSelecao((v: number) => v + 1)
      
      console.log('✅ Cobranças excluídas com sucesso')
      showToast(`${selecionadas.length} cobrança(s) excluída(s) permanentemente`, 'success')
      
    } catch (error) {
      console.error('💥 Erro inesperado ao excluir:', error)
      showToast("Erro inesperado ao excluir cobranças", 'error')
    }
  }

  // Filtrar cobranças por busca e status de envio
  const cobrancasFiltradas = cobrancas
    .filter(c => !c.enviou) // Só mostra as que ainda não foram enviadas
    .filter(c => {
      // Se não há termo de busca, mostrar todos
      if (!searchTerm || searchTerm.trim() === '') {
        return true
      }
      
      // Verificar se o nome ou celular contém o termo de busca
      const nomeMatch = c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false
      const celularMatch = c.celular?.includes(searchTerm) || false
      
      return nomeMatch || celularMatch
    })

  // Calcular se todas as cobranças filtradas estão selecionadas
  const todasSelecionadas = cobrancasFiltradas.length > 0 && cobrancasFiltradas.every(c => cobrancasSelecionadas.has(c.id))
  
  // Log para debug (remover depois)
  console.log('🔍 Render - todasSelecionadas:', todasSelecionadas, 'versao:', versaoSelecao, 'size:', cobrancasSelecionadas.size)

  // Carregar dados da empresa e cobranças automaticamente ao inicializar
  useEffect(() => {
    if (empresaChave) {
      buscarEmpresaAtual()
      buscarCobrancasSupabase()
    }
  }, [empresaChave])

  // Memoizar os IDs das cobranças para evitar recálculos desnecessários
  const cobrancasIds = useMemo(() => {
    return cobrancas.map(c => c.id).sort().join(',')
  }, [cobrancasStatsKey])

  // Marcar todas as novas cobranças por padrão (apenas quando cobranças mudam, não quando seleção muda)
  useEffect(() => {
    // Verificar se há linhas em edição antes de atualizar seleções
    if (linhasEmEdicao.current.size > 0) {
      return
    }
    
    const novasPendentes = cobrancas
      .filter(c => !c.enviou && !cobrancasSelecionadas.has(c.id))
      .map(c => c.id)
    
    if (novasPendentes.length > 0) {
      console.log('🆕 Marcando novas cobranças automaticamente:', novasPendentes.length)
      setCobrancasSelecionadas(prev => {
        const newSet = new Set(prev)
        novasPendentes.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }, [cobrancasIds]) // Usar IDs memoizados em vez do array completo, SEM cobrancasSelecionadas

  // Memoizar o tamanho das cobranças para evitar recálculos desnecessários
  const cobrancasLength = useMemo(() => cobrancas.length, [cobrancasStatsKey])
  
  // Monitorar mudanças na lista de cobranças para fechar toast de processamento
  useEffect(() => {
    if (cobrancasLength > 0 && toastMessage?.includes('Processando')) {
      console.log('✅ Dados carregados, fechando toast de processamento')
      closeToast()
      showToast(`✨ ${cobrancasLength} cobranças carregadas com sucesso!`, 'success')
    }
  }, [cobrancasLength, toastMessage])

  // Realtime subscription para cobranças + Polling de backup
  useEffect(() => {
    if (!empresaChave) return

    console.log('🔔 Configurando Realtime para cobranças empresa chave:', empresaChave)

    let subscription: any = null
    let pollingInterval: NodeJS.Timeout | null = null

    try {
      // Criar subscription para mudanças na tabela cobranca
      subscription = supabase
        .channel(`cobranca-${empresaChave}`)
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'cobranca'
            // Nota: filtro por UUID será implementado quando tivermos a estrutura correta
          },
          (payload) => {
            console.log('🔔 Mudança detectada na tabela cobranca:', payload)
            
            // Verificar se é uma inserção de novos dados
            const isInsert = payload.eventType === 'INSERT'
            const isUpdate = payload.eventType === 'UPDATE'
            
            // Se for UPDATE, verificar se é apenas atualização de celular ou mensagem que fizemos
            if (isUpdate && payload.new) {
              const updatedId = payload.new.id as string
              const oldData = payload.old as any
              const newData = payload.new as any
              
              // PRIMEIRA VERIFICAÇÃO: Se a linha está sendo editada (usuário pode estar digitando), ignorar completamente
              // Isso deve ser a primeira verificação para evitar sobrescrever valores durante a digitação
              if (linhasEmEdicao.current.has(updatedId)) {
                console.log('✏️ Linha em edição detectada, ignorando Realtime para não interromper digitação')
                return // Não recarregar tudo e não atualizar estado
              }
              
              // Verificar se foi uma atualização própria (independente de quais campos mudaram)
              const isCelularUpdate = atualizacoesPropriasCelular.current.has(updatedId)
              const isMensagemUpdate = atualizacoesPropriasMensagem.current.has(updatedId)
              
              // Verificar quais campos mudaram
              const celularMudou = oldData?.celular !== newData?.celular
              const mensagemMudou = oldData?.mensagem !== newData?.mensagem
              
              // Verificar se apenas celular ou mensagem mudaram (ignorar outros campos como timestamps)
              const camposMudaram = Object.keys(newData).filter(key => {
                // Ignorar campos que podem mudar automaticamente
                if (key === 'updated_at' || key === 'created_at' || key === 'data_envio') return false
                return oldData?.[key] !== newData?.[key]
              })
              
              // Se é uma atualização própria de celular e apenas o celular mudou
              if (isCelularUpdate && celularMudou && camposMudaram.length === 1 && camposMudaram[0] === 'celular') {
                console.log('📱 Atualização de celular própria detectada, ignorando Realtime')
                // NÃO atualizar estado local aqui - a linha pode estar sendo editada
                // O estado local já está atualizado pelo onChange
                return // Não recarregar tudo
              }
              
              // Se é uma atualização própria de mensagem e apenas a mensagem mudou
              if (isMensagemUpdate && mensagemMudou && camposMudaram.length === 1 && camposMudaram[0] === 'mensagem') {
                console.log('💬 Atualização de mensagem própria detectada, ignorando Realtime')
                // NÃO atualizar estado local aqui - a linha pode estar sendo editada
                // O estado local já está atualizado pelo onChange
                return // Não recarregar tudo
              }
              
              // Se é uma atualização própria mas outros campos também mudaram, ainda assim ignorar para evitar recarregar
              if ((isCelularUpdate || isMensagemUpdate) && (celularMudou || mensagemMudou)) {
                console.log('📝 Atualização própria detectada (celular ou mensagem), ignorando Realtime para evitar recarregar')
                return // Não recarregar tudo
              }
            }
            
            // Para INSERT ou outros UPDATEs, recarregar normalmente
            // MAS: Não recarregar se houver linhas em edição (usuário digitando)
            if (linhasEmEdicao.current.size > 0) {
              console.log('✏️ Linhas em edição detectadas no Realtime, ignorando atualização para não interromper digitação')
              return
            }
            
            setTimeout(() => {
              // Verificar novamente antes de recarregar (pode ter mudado durante o delay)
              if (linhasEmEdicao.current.size > 0) {
                console.log('✏️ Linhas em edição detectadas após delay, ignorando atualização')
                return
              }
              
              console.log('🔄 Atualizando dados após mudança no Realtime...')
              buscarCobrancasSupabase(false, true) // silentMode = true
              
              // Fechar toast de processamento se estiver aberto
              if (toastMessage?.includes('Processando') || toastMessage?.includes('processamento')) {
                closeToast()
              }
              
              if (isInsert) {
                showToast('✨ Novas cobranças carregadas!', 'success')
              } else if (isUpdate) {
                showToast('🔄 Dados atualizados!', 'info')
              } else {
                showToast('📝 Dados modificados!', 'info')
              }
            }, 500) // Pequeno delay para garantir que os dados foram persistidos
          }
        )
        .subscribe((status) => {
          console.log('📡 Status da conexão Realtime cobranças:', status)
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Conectado ao Realtime para cobranças')
            setRealtimeConnected(true)
            // Se Realtime funcionou, não precisa do polling
            if (pollingInterval) {
              clearInterval(pollingInterval)
              pollingInterval = null
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('⚠️ Problema na conexão Realtime cobranças:', status)
            setRealtimeConnected(false)
            
            // Se Realtime falhou, ativar polling de backup
            if (!pollingInterval) {
              console.log('🔄 Ativando polling de backup para cobranças...')
              pollingInterval = setInterval(() => {
                // Não fazer polling se houver linhas em edição (usuário digitando)
                if (linhasEmEdicao.current.size > 0) {
                  console.log('⏸️ Polling pausado: linhas em edição')
                  return
                }
                console.log('🔄 Polling: Verificando mudanças na tabela cobranca...')
                buscarCobrancasSupabase(false, true) // silentMode = true
              }, 15000) // Verificar a cada 15 segundos (reduzido de 3s para evitar travamento)
            }
          }
        })
    } catch (error) {
      console.warn('⚠️ Erro ao configurar Realtime cobranças (modo fallback ativo):', error)
      setRealtimeConnected(false)
      
      // Se Realtime falhou completamente, ativar polling
      if (!pollingInterval) {
        console.log('🔄 Ativando polling de backup para cobranças...')
        pollingInterval = setInterval(() => {
          // Não fazer polling se houver linhas em edição (usuário digitando)
          if (linhasEmEdicao.current.size > 0) {
            console.log('⏸️ Polling pausado: linhas em edição')
            return
          }
          console.log('🔄 Polling: Verificando mudanças na tabela cobranca...')
          buscarCobrancasSupabase(false, true) // silentMode = true
        }, 15000) // Verificar a cada 15 segundos (reduzido de 3s para evitar travamento)
      }
    }

    // Cleanup: remover subscription e polling quando componente for desmontado
    return () => {
      console.log('🔌 Desconectando Realtime subscription e polling cobranças')
      setRealtimeConnected(false)
      
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.warn('⚠️ Erro ao desconectar subscription cobranças:', error)
        }
      }
      
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [empresaChave]) // Recriar subscription se empresaChave mudar

  // Componente Toast
  const ToastComponent = () => {
    if (!toastMessage) return null
    
    const getToastIcon = () => {
      switch (toastType) {
        case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />
        case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />
        case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
        case 'info': return <Info className="h-5 w-5 text-blue-600" />
        default: return <Info className="h-5 w-5 text-blue-600" />
      }
    }
    
    const getToastBg = () => {
      switch (toastType) {
        case 'success': return 'bg-green-50 border-green-200'
        case 'error': return 'bg-red-50 border-red-200'
        case 'warning': return 'bg-yellow-50 border-yellow-200'
        case 'info': return 'bg-blue-50 border-blue-200'
        default: return 'bg-blue-50 border-blue-200'
      }
    }
    
    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg flex items-center gap-3 max-w-md ${getToastBg()}`}>
        {getToastIcon()}
        <span className="flex-1 text-sm font-medium">{toastMessage}</span>
        <button 
          onClick={closeToast}
          className="p-1 hover:bg-black/10 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Determinar se está carregando (coleta ou refresh)
  const isLoadingData = loadingColeta || loadingRefresh

  return (
    <>
      <ToastComponent />
      <LoadingOverlay 
        isLoading={isLoadingData} 
        text={loadingColeta ? "Coletando cobranças..." : "Atualizando lista..."} 
      />
      <DashboardTab 
        title="Cobranças" 
        description="Gerencie cobranças e envio de mensagens de cobrança"
        isLoading={isLoading}
      >
        {/* Filtro de período para estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle>Período das Estatísticas</CardTitle>
            <CardDescription>
              Selecione o período para visualizar as métricas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={filtroEstatisticas === 'hoje' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstatisticas('hoje')}
              >
                Hoje
              </Button>
              <Button 
                variant={filtroEstatisticas === 'semana' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstatisticas('semana')}
              >
                7 dias
              </Button>
              <Button 
                variant={filtroEstatisticas === 'mes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstatisticas('mes')}
              >
                30 dias
              </Button>
              <Button 
                variant={filtroEstatisticas === 'todos' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFiltroEstatisticas('todos')}
              >
                Todos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cards de métricas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coletadas no Período</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.coletados}</div>
              <p className="text-xs text-muted-foreground">
                {filtroEstatisticas === 'todos' ? 'Total geral' : 
                 filtroEstatisticas === 'hoje' ? 'Coletadas hoje' :
                 filtroEstatisticas === 'semana' ? 'Últimos 7 dias' :
                 'Últimos 30 dias'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enviadas no Período</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estatisticas.enviados}
              </div>
              <p className="text-xs text-muted-foreground">
                {estatisticas.coletados > 0 ? Math.round((estatisticas.enviados / estatisticas.coletados) * 100) : 0}% das coletadas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes no Período</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {estatisticas.pendentes}
              </div>
              <p className="text-xs text-muted-foreground">
                Aguardando envio
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Pendente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {estatisticas.valorPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor em aberto
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controles de período e coleta */}
        <Card>
          <CardHeader>
            <CardTitle>Coletar Cobranças</CardTitle>
            <CardDescription>
              Selecione o tipo de cobrança e período para coleta
              {empresaAtual && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm">
                    <strong>Empresa:</strong> {empresaAtual.empresa}
                  </div>
                  <div className="text-sm">
                    <strong>CNPJ:</strong> {empresaAtual.cnpj}
                  </div>
                </div>
              )}
              {tipoCobranca === 'custom' && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-sm text-blue-700">
                    💡 <strong>Período Customizado:</strong> Defina um período específico para coleta de cobranças.
                  </div>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-6 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tipo-cobranca">Tipo de Cobrança</Label>
                <Select value={tipoCobranca} onValueChange={(value: any) => setTipoCobranca(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vencidas">Cobranças Vencidas</SelectItem>
                    <SelectItem value="vencehoje">Vence Hoje</SelectItem>
                    <SelectItem value="venceamanha">Vence Amanhã</SelectItem>
                    <SelectItem value="custom">Período Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {tipoCobranca === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="data-inicial">Data Inicial</Label>
                    <Input
                      id="data-inicial"
                      type="date"
                      value={dataInicial}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataInicial(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data-final">Data Final</Label>
                    <Input
                      id="data-final"
                      type="date"
                      value={dataFinal}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDataFinal(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <Button 
                onClick={coletarCobrancas}
                disabled={isLoadingData || toastMessage?.includes('Processando') || !empresaAtual?.cnpj}
                className="flex items-center gap-2"
              >
                {loadingColeta || toastMessage?.includes('Processando') ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                {loadingColeta ? "Enviando solicitação..." : 
                 toastMessage?.includes('Processando') ? "Processando..." : 
                 !empresaAtual?.cnpj ? "Aguardando dados da empresa..." : 
                 "Coletar Cobranças"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={handleRefreshClick}
                disabled={isLoadingData}
                className="flex items-center gap-2"
              >
                {loadingRefresh ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {loadingRefresh ? 'Atualizando...' : 'Atualizar Lista'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mensagem padrão e controles de envio */}
        <Card>
          <CardHeader>
            <CardTitle>Configurar Mensagens</CardTitle>
            <CardDescription>
              Defina a mensagem padrão e personalize individualmente se necessário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mensagem-padrao">Mensagem Padrão</Label>
                <Textarea
                  id="mensagem-padrao"
                  placeholder="Digite a mensagem padrão para todas as cobranças..."
                  value={mensagemPadrao}
                  onChange={(e) => setMensagemPadrao(e.target.value)}
                  rows={3}
                />
                <div className="text-xs text-muted-foreground">
                  💡 <strong>Variáveis disponíveis:</strong> [nome] = primeiro nome, [nome_completo] = nome completo, [valor] = valor da cobrança, [vencimento] = data de vencimento
                </div>
              </div>
              
              {/* Preview da mensagem */}
              {cobrancas.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview da Mensagem</Label>
                  <div className="p-3 bg-gray-50 border rounded-md">
                    <div className="text-sm">
                      <strong>Exemplo com "{cobrancas[0]?.nome || 'João Silva'}":</strong>
                    </div>
                    <div className="text-sm mt-1 italic">
                      "{processarMensagem(mensagemPadrao, cobrancas[0] || { nome: 'João Silva', valor: 150.00, vencimento: '2024-01-15' } as Cobranca)}"
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setCobrancas(prev => 
                      prev.map(c => ({ ...c, mensagem: mensagemPadrao }))
                    )
                    showToast("Mensagem padrão aplicada a todas! Use [nome], [valor] e [vencimento] para personalizar.", 'success')
                  }}
                  variant="outline"
                >
                  Aplicar a Todas
                </Button>
                <Button 
                  onClick={enviarMensagens}
                  disabled={loadingEnvio || cobrancasSelecionadas.size === 0}
                  className="flex items-center gap-2"
                >
                  {loadingEnvio ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {loadingEnvio ? "Enviando..." : `Enviar Mensagens Selecionadas (${cobrancasSelecionadas.size})`}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de cobranças */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cobranças Pendentes</CardTitle>
                <CardDescription>
                  Apenas cobranças que ainda não foram enviadas (enviadas são removidas automaticamente)
                  <br />
                  💡 <strong>Números:</strong> Você pode editar o número do celular. Certifique-se de que há um número válido antes do envio.
                </CardDescription>
              </div>
              
              {/* Indicador de Conexão Realtime */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50">
                <div 
                  className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
                  title={realtimeConnected ? 'Conectado em tempo real' : 'Desconectado'}
                />
                <span className={`text-xs ${realtimeConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {realtimeConnected ? '🔴 Ao Vivo' : '⚫ Offline'}
                </span>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou celular..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {cobrancasFiltradas.length > 0 ? (
              <>
                {/* Controles de seleção */}
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="select-all-cobrancas"
                        checked={todasSelecionadas}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleTodas()
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                      />
                      <label 
                        htmlFor="select-all-cobrancas" 
                        className="text-sm font-medium text-gray-700 cursor-pointer select-none"
                      >
                        Selecionar todas ({cobrancasFiltradas.length})
                      </label>
                    </div>
                    <div className="text-sm text-gray-600">
                      {cobrancasSelecionadas.size} de {cobrancasFiltradas.length} selecionadas
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={excluirTodasSelecionadas}
                    disabled={cobrancasSelecionadas.size === 0}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-3 w-3" />
                    Excluir Selecionadas ({cobrancasSelecionadas.size})
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Seleção</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Celular</TableHead>
                      <TableHead>Data Coleta</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cobrancasFiltradas.map((cobranca) => (
                      <TableRow key={cobranca.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={cobrancasSelecionadas.has(cobranca.id)}
                            onChange={() => toggleCobranca(cobranca.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{cobranca.nome}</TableCell>
                      <TableCell>
                        R$ {(cobranca.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {formatarDataBrasil(cobranca.vencimento)}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="tel"
                          value={cobranca.celular || ''}
                          onChange={(e) => atualizarCelular(cobranca.id, e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="min-w-[140px]"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {cobranca.celular ? (
                            <span className="text-blue-600 font-medium">
                              📱 Número válido para envio
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">
                              ⚠️ Sem número para envio
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatarDataHoraBrasil(cobranca.created_at).data}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatarDataHoraBrasil(cobranca.created_at).hora}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] md:max-w-[400px] lg:max-w-[500px]">
                        <div className="space-y-2">
                          <Textarea
                            value={cobranca.mensagem || ''}
                            onChange={(e) => atualizarMensagem(cobranca.id, e.target.value)}
                            rows={2}
                            className="w-full min-w-[200px] max-w-full resize-y overflow-auto text-sm md:text-base"
                            placeholder={mensagemPadrao}
                          />
                          {(cobranca.mensagem || mensagemPadrao).includes('[') && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded break-words max-w-full overflow-hidden whitespace-pre-wrap">
                              <strong>Preview:</strong><br />
                              <span className="break-words block mt-1">{processarMensagem(cobranca.mensagem || mensagemPadrao, cobranca)}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={cobranca.enviou === true || loadingIndividual === cobranca.id}
                            onClick={() => enviarMensagemIndividual(cobranca)}
                            className="flex items-center gap-2"
                          >
                            {loadingIndividual === cobranca.id ? (
                              <>
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Enviando...
                              </>
                            ) : cobranca.enviou === true ? (
                              'Enviado'
                            ) : (
                              'Enviar'
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => excluirCobranca(cobranca.id)}
                            className="flex items-center gap-1"
                            title="Excluir da lista"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma cobrança pendente</p>
                <p className="text-muted-foreground">
                  {cobrancas.length === 0 
                    ? "Realize uma coleta para visualizar os dados" 
                    : cobrancas.filter(c => !c.enviou).length === 0
                    ? "Todas as mensagens já foram enviadas! 🎉"
                    : "Nenhum resultado para o termo pesquisado"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </DashboardTab>
    </>
  )
}