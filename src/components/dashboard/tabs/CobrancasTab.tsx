"use client"

import { useState, useEffect } from "react"
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
      .replace(/\[vencimento\]/gi, cobranca.vencimento ? new Date(cobranca.vencimento).toLocaleDateString('pt-BR') : 'Data não informada')
  }

  // Funções para calcular estatísticas por período
  const getDataLimite = (filtro: typeof filtroEstatisticas) => {
    const agora = new Date()
    switch (filtro) {
      case 'hoje':
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)
        return hoje
      case 'semana':
        const semana = new Date()
        semana.setDate(agora.getDate() - 7)
        return semana
      case 'mes':
        const mes = new Date()
        mes.setMonth(agora.getMonth() - 1)
        return mes
      case 'todos':
      default:
        return new Date(0) // Início dos tempos
    }
  }

  const calcularEstatisticas = (filtro: typeof filtroEstatisticas) => {
    const dataLimite = getDataLimite(filtro)
    
    const coletadosNoPeriodo = cobrancas.filter(c => 
      new Date(c.created_at) >= dataLimite
    )
    
    const enviadosNoPeriodo = cobrancas.filter(c => 
      c.data_envio && new Date(c.data_envio) >= dataLimite
    )
    
    const pendentesPeriodo = cobrancas.filter(c => 
      !c.enviou && new Date(c.created_at) >= dataLimite
    )

    const valorTotalPeriodo = coletadosNoPeriodo.reduce((sum, c) => sum + (c.valor || 0), 0)
    const valorEnviadoPeriodo = enviadosNoPeriodo.reduce((sum, c) => sum + (c.valor || 0), 0)
    const valorPendentePeriodo = pendentesPeriodo.reduce((sum, c) => sum + (c.valor || 0), 0)
    
    return {
      coletados: coletadosNoPeriodo.length,
      enviados: enviadosNoPeriodo.length,
      pendentes: pendentesPeriodo.length,
      total: cobrancas.length,
      valorTotal: valorTotalPeriodo,
      valorEnviado: valorEnviadoPeriodo,
      valorPendente: valorPendentePeriodo
    }
  }

  const estatisticas = calcularEstatisticas(filtroEstatisticas)

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
        setCobrancas(result.data)
        
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
            telefone: "66999999999",
            celular: "66999999999",
            codcobranca: "COB999",
            vencimento: new Date().toISOString().split('T')[0],
            valor: 150.00,
            parcela: 1,
            created_at: new Date().toISOString(),
            empresa_id: 1,
            enviou: false,
            mensagem: mensagemPadrao,
            whatsapp: null,
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
          telefone: "66999999999",
          celular: "66999999999",
          codcobranca: "EMERGENCY01",
          vencimento: new Date().toISOString().split('T')[0],
          valor: 100.00,
          parcela: 1,
          created_at: new Date().toISOString(),
          empresa_id: 1,
          enviou: false,
          mensagem: mensagemPadrao,
          whatsapp: null,
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
          // Só incluir cobranças que tenham pelo menos um número válido
          const numeroParaEnvio = c.whatsapp?.trim() || c.celular
          return numeroParaEnvio && numeroParaEnvio.trim().length > 0
        })

      const cobrancasParaEnvio = cobrancasComNumeroValido
        .map(cobranca => {
          const mensagemBase = cobranca.mensagem || mensagemPadrao
          const mensagemProcessada = processarMensagem(mensagemBase, cobranca)
          // Usar o WhatsApp se estiver preenchido, senão usar o celular
          const numeroParaEnvio = cobranca.whatsapp?.trim() || cobranca.celular
          return {
            ...cobranca,
            mensagem: mensagemProcessada,
            enviou: true,
            whatsapp: numeroParaEnvio
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

      // Chama o webhook para envio das mensagens
      const result = await api.enviarMensagensCobrancas(empresaAtual.cnpj, cobrancasParaEnvio, empresaAtual.nome_sistema || '')
      
      if (result.success) {
        showToast(`🎉 ${cobrancasParaEnvio.length} mensagens de cobrança enviadas e removidas da lista!`, 'success')
        
        // Atualiza o status no Supabase para cada cobrança enviada
        const updatePromises = cobrancasParaEnvio.map(cobranca => 
          api.atualizarStatusEnvio('cobranca', cobranca.id, true, cobranca.mensagem)
        )
        
        const updateResults = await Promise.all(updatePromises)
        const successCount = updateResults.filter(r => r.success).length
        
        if (successCount === cobrancasParaEnvio.length) {
          // Atualiza o estado local
          setCobrancas(prev => prev.map(c => 
            cobrancasParaEnvio.find(cp => cp.id === c.id) 
              ? { ...c, enviou: true, mensagem: c.mensagem || mensagemPadrao, data_envio: new Date().toISOString() }
              : c
          ))
          showToast("Status atualizado no banco de dados", 'success')
        } else {
          showToast(`Mensagens enviadas, mas apenas ${successCount}/${cobrancasParaEnvio.length} status atualizados no banco`, 'warning')
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

  // Função para atualizar mensagem individual
  const atualizarMensagem = (id: string, novaMensagem: string) => {
    setCobrancas(prev => 
      prev.map(c => c.id === id ? { ...c, mensagem: novaMensagem } : c)
    )
  }

  const atualizarWhatsapp = (id: string, novoWhatsapp: string) => {
    setCobrancas(prev => 
      prev.map(c => c.id === id ? { ...c, whatsapp: novoWhatsapp } : c)
    )
  }

  const atualizarCelular = (id: string, novoCelular: string) => {
    setCobrancas(prev => 
      prev.map(c => c.id === id ? { ...c, celular: novoCelular } : c)
    )
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
      const numeroParaEnvio = cobranca.whatsapp?.trim() || cobranca.celular
      if (!numeroParaEnvio || numeroParaEnvio.trim().length === 0) {
        showToast("Não há número válido para envio desta cobrança", 'error')
        return
      }

      const mensagemBase = cobranca.mensagem || mensagemPadrao
      const mensagemProcessada = processarMensagem(mensagemBase, cobranca)
      
      // Usar o WhatsApp se estiver preenchido, senão usar o celular
      
      const cobrancaComMensagem = {
        ...cobranca,
        mensagem: mensagemProcessada,
        enviou: true,
        whatsapp: numeroParaEnvio
      }

      const result = await api.enviarMensagensCobrancas(empresaAtual.cnpj, [cobrancaComMensagem], empresaAtual.nome_sistema || '')
      
      if (result.success) {
        // Atualiza o status no Supabase
        const updateResult = await api.atualizarStatusEnvio('cobranca', cobranca.id, true, cobrancaComMensagem.mensagem)
        
        if (updateResult.success) {
          // Atualiza o estado local
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
    const cobrancasPendentes = cobrancasFiltradas.map(c => c.id)
    const todasSelecionadas = cobrancasPendentes.every(id => cobrancasSelecionadas.has(id))
    
    if (todasSelecionadas) {
      // Desmarcar todas
      setCobrancasSelecionadas(prev => {
        const newSet = new Set(prev)
        cobrancasPendentes.forEach(id => newSet.delete(id))
        return newSet
      })
    } else {
      // Marcar todas
      setCobrancasSelecionadas(prev => {
        const newSet = new Set(prev)
        cobrancasPendentes.forEach(id => newSet.add(id))
        return newSet
      })
    }
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
    .filter(c =>
      (c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (c.celular?.includes(searchTerm) || false) ||
      (c.whatsapp?.includes(searchTerm) || false)
    )

  // Carregar dados da empresa e cobranças automaticamente ao inicializar
  useEffect(() => {
    if (empresaChave) {
      buscarEmpresaAtual()
      buscarCobrancasSupabase()
    }
  }, [empresaChave])

  // Marcar todas as novas cobranças por padrão
  useEffect(() => {
    const novasPendentes = cobrancas
      .filter(c => !c.enviou && !cobrancasSelecionadas.has(c.id))
      .map(c => c.id)
    
    if (novasPendentes.length > 0) {
      setCobrancasSelecionadas(prev => {
        const newSet = new Set(prev)
        novasPendentes.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }, [cobrancas])

  // Monitorar mudanças na lista de cobranças para fechar toast de processamento
  useEffect(() => {
    if (cobrancas.length > 0 && toastMessage?.includes('Processando')) {
      console.log('✅ Dados carregados, fechando toast de processamento')
      closeToast()
      showToast(`✨ ${cobrancas.length} cobranças carregadas com sucesso!`, 'success')
    }
  }, [cobrancas.length, toastMessage])

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
            
            // Atualizar dados automaticamente quando houver mudanças
            setTimeout(() => {
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
                console.log('🔄 Polling: Verificando mudanças na tabela cobranca...')
                buscarCobrancasSupabase(false, true) // silentMode = true
              }, 3000) // Verificar a cada 3 segundos
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
          console.log('🔄 Polling: Verificando mudanças na tabela cobranca...')
          buscarCobrancasSupabase(false, true) // silentMode = true
        }, 3000) // Verificar a cada 3 segundos
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

  return (
    <>
      <ToastComponent />
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
                disabled={loadingColeta || toastMessage?.includes('Processando') || !empresaAtual?.cnpj}
                className="flex items-center gap-2"
              >
                {loadingColeta || toastMessage?.includes('Processando') ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
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
                disabled={loadingRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loadingRefresh ? 'animate-spin' : ''}`} />
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
                  💡 <strong>Números:</strong> Você pode editar o número original ou adicionar um alternativo. O envio usará o número alternativo se preenchido, senão usará o original.
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
                placeholder="Buscar por nome, celular original ou WhatsApp alternativo..."
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
                        checked={cobrancasFiltradas.length > 0 && cobrancasFiltradas.every(c => cobrancasSelecionadas.has(c.id))}
                        onChange={toggleTodas}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="select-all-cobrancas" className="text-sm font-medium text-gray-700">
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
                      <TableHead>Celular Original</TableHead>
                      <TableHead>WhatsApp Alternativo</TableHead>
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
                        {cobranca.vencimento ? new Date(cobranca.vencimento).toLocaleDateString('pt-BR') : '-'}
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
                          Número original da consulta
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="tel"
                          value={cobranca.whatsapp || ''}
                          onChange={(e) => atualizarWhatsapp(cobranca.id, e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="min-w-[140px]"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Número alternativo (opcional)
                        </div>
                        {(cobranca.whatsapp?.trim() || cobranca.celular) ? (
                          <div className="text-xs text-blue-600 mt-1 font-medium">
                            📱 Enviará para: {cobranca.whatsapp?.trim() || cobranca.celular}
                          </div>
                        ) : (
                          <div className="text-xs text-red-600 mt-1 font-medium">
                            ⚠️ Sem número para envio
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(cobranca.created_at).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(cobranca.created_at).toLocaleTimeString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Textarea
                            value={cobranca.mensagem || ''}
                            onChange={(e) => atualizarMensagem(cobranca.id, e.target.value)}
                            rows={2}
                            className="min-w-[250px]"
                            placeholder={mensagemPadrao}
                          />
                          {(cobranca.mensagem || mensagemPadrao).includes('[') && (
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                              <strong>Preview:</strong> "{processarMensagem(cobranca.mensagem || mensagemPadrao, cobranca)}"
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