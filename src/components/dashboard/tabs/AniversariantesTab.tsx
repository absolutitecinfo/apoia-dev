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
import { Calendar, Search, Send, RefreshCw, MessageSquare, Users, X, CheckCircle, AlertCircle, Info, AlertTriangle, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

import { supabase } from "@/lib/supabase"
import type { Aniversariante } from "@/lib/types"

interface AniversariantesTabProps {
  empresaChave: string
  isLoading?: boolean
}

export function AniversariantesTab({ empresaChave, isLoading }: AniversariantesTabProps) {
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([])
  const [loadingColeta, setLoadingColeta] = useState(false)
  const [loadingEnvio, setLoadingEnvio] = useState(false)
  const [loadingIndividual, setLoadingIndividual] = useState<number | null>(null)
  const [loadingRefresh, setLoadingRefresh] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [dataInicial, setDataInicial] = useState(new Date().toISOString().split('T')[0])
  const [dataFinal, setDataFinal] = useState(new Date().toISOString().split('T')[0])
  const [mensagemPadrao, setMensagemPadrao] = useState("Feliz aniversário, [nome]! 🎉")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para filtros de estatísticas
  const [filtroEstatisticas, setFiltroEstatisticas] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos')
  
  // Estados para seleção de aniversariantes
  const [aniversariantesSelecionados, setAniversariantesSelecionados] = useState<Set<number>>(new Set())

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

  // Função para processar variáveis na mensagem
  const processarMensagem = (mensagem: string, aniversariante: Aniversariante): string => {
    if (!mensagem) return mensagem

    // Extrair o primeiro nome (antes do primeiro espaço)
    const primeiroNome = aniversariante.nome?.split(' ')[0] || 'Amigo(a)'
    
    // Substituir as variáveis
    return mensagem
      .replace(/\[nome\]/gi, primeiroNome)
      .replace(/\[nome_completo\]/gi, aniversariante.nome || 'Aniversariante')
  }

  // Função para buscar aniversariantes (1ª chamada)
  const coletarAniversariantes = async () => {
    setLoadingColeta(true)
    try {
      console.log('🚀 Iniciando coleta de aniversariantes...')
      const result = await api.coletarAniversariantes("00184385000194", dataInicial, dataFinal)
      
      if (result.success) {
        console.log('✅ Webhook chamado com sucesso:', result.data)
        showToast("🔄 Processando... Os dados aparecerão automaticamente quando prontos.", 'info', false)
        
        // Aguardar um tempo para ver se chegam dados via realtime
        setTimeout(() => {
          // Se ainda estiver carregando após 10 segundos, mostrar aviso
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

  // Função para buscar aniversariantes do Supabase (após webhook processar)
  const buscarAniversariantesSupabase = async (showLoadingState = false, silentMode = false) => {
    if (showLoadingState) setLoadingRefresh(true)
    try {
      console.log('🔄 Iniciando busca de aniversariantes para empresa chave:', empresaChave)
      
      // Debug: primeiro vamos ver quantos registros existem na tabela total
      const debugResult = await supabase
        .from('aniversariantes')
        .select('empresa_id, id, nome')
        .limit(10)
      console.log('🗂️ Debug - primeiros 10 registros da tabela:', debugResult.data)
      
      const result = await api.getAniversariantes(empresaChave)
      
      console.log('📋 Resultado completo da API:', result)
      
      if (result.success && result.data) {
        setAniversariantes(result.data)
        
        // Mensagem diferente para dados mockados vs dados reais
        const isMockData = result.data.some(a => 
          a.nome?.includes('Mock') || 
          a.nome?.includes('Teste') || 
          a.nome?.includes('Fallback') ||
          a.codigo?.includes('MOCK') ||
          a.codigo?.includes('ERROR')
        )
        
        if (isMockData) {
          if (!silentMode) showToast(`${result.data.length} aniversariantes carregados (dados de teste)`, 'info')
          console.log('⚠️ Dados mockados carregados:', result.data)
        } else {
          if (!silentMode) showToast(`${result.data.length} aniversariantes carregados do banco`, 'success')
          console.log('✅ Dados reais carregados:', result.data)
        }
      } else if (result.success && (!result.data || result.data.length === 0)) {
        // Se não encontrou dados para a empresa específica, tenta buscar TODOS os dados
        console.log('⚠️ Nenhum dado encontrado para empresa específica, buscando todos...')
        try {
          const { data: todosOsDados, error: errorTodos } = await supabase
            .from('aniversariantes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20)
          
          if (todosOsDados && todosOsDados.length > 0) {
            console.log('📋 Dados encontrados na tabela (mostrando todos):', todosOsDados)
            setAniversariantes(todosOsDados)
            if (!silentMode) showToast(`${todosOsDados.length} aniversariantes encontrados (todos da tabela)`, 'warning')
            
            // Mostrar quais empresas têm dados
            const empresas = todosOsDados.reduce((acc: any, item) => {
              acc[item.empresa_id] = (acc[item.empresa_id] || 0) + 1
              return acc
            }, {})
            console.log('📊 Dados por empresa:', empresas)
          } else {
            console.log('❌ Tabela está vazia')
            setAniversariantes([])
          }
        } catch (error) {
          console.error('Erro ao buscar todos os dados:', error)
        }
      } else {
        console.error('❌ Erro da API:', result.error)
        showToast(`Erro ao buscar aniversariantes: ${result.error || 'Erro desconhecido'}`, 'error')
        
        // Em caso de erro, pelo menos carrega dados mockados para teste
        const mockData = [
          {
            id: 999,
            created_at: new Date().toISOString(),
            codigo: 'FALLBACK01',
            nome: 'Aniversariante de Emergência',
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
        setAniversariantes(mockData)
        if (!silentMode) showToast('Carregados dados de fallback para teste', 'warning')
      }
    } catch (error) {
      console.error('💥 Erro inesperado:', error)
      if (!silentMode) showToast("Erro crítico - usando dados de emergência", 'error')
      
      // Dados de emergência em caso de erro crítico
      const emergencyData = [
        {
          id: 888,
          created_at: new Date().toISOString(),
          codigo: 'EMERGENCY01',
          nome: 'Dados de Emergência',
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
      setAniversariantes(emergencyData)
    } finally {
      if (showLoadingState) setLoadingRefresh(false)
    }
  }

  // Função específica para o botão de refresh
  const refreshAniversariantes = async () => {
    await buscarAniversariantesSupabase(true)
  }

  // Função para enviar mensagens (2ª chamada)
  const enviarMensagens = async () => {
    setLoadingEnvio(true)
    try {
      // Filtra apenas aniversariantes que não foram enviados E que estão selecionados
      const aniversariantesParaEnvio = aniversariantes
        .filter(a => !a.enviou_msg && aniversariantesSelecionados.has(a.id))
        .map(aniversariante => {
          const mensagemBase = aniversariante.mensagem || mensagemPadrao
          const mensagemProcessada = processarMensagem(mensagemBase, aniversariante)
          return {
            ...aniversariante,
            mensagem: mensagemProcessada
          }
        })

      if (aniversariantesParaEnvio.length === 0) {
        showToast("Nenhum aniversariante selecionado para envio", 'info')
        return
      }

      // Chama o webhook para envio das mensagens
      const result = await api.enviarMensagensAniversariantes("00184385000194", aniversariantesParaEnvio)
      
      if (result.success) {
        showToast(`🎉 ${aniversariantesParaEnvio.length} mensagens enviadas e removidas da lista!`, 'success')
        
        // Atualiza o status no Supabase para cada aniversariante enviado
        const updatePromises = aniversariantesParaEnvio.map(aniversariante => 
          api.atualizarStatusEnvio('aniversariante', aniversariante.id, true, aniversariante.mensagem)
        )
        
        const updateResults = await Promise.all(updatePromises)
        const successCount = updateResults.filter(r => r.success).length
        
        if (successCount === aniversariantesParaEnvio.length) {
          // Atualiza o estado local
          setAniversariantes(prev => prev.map(a => 
            aniversariantesParaEnvio.find(ap => ap.id === a.id) 
              ? { ...a, enviou_msg: true, mensagem: a.mensagem || mensagemPadrao, data_envio: new Date().toISOString() }
              : a
          ))
          showToast("Status atualizado no banco de dados", 'success')
        } else {
          showToast(`Mensagens enviadas, mas apenas ${successCount}/${aniversariantesParaEnvio.length} status atualizados no banco`, 'warning')
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
  const atualizarMensagem = (id: number, novaMensagem: string) => {
    setAniversariantes(prev => 
      prev.map(a => a.id === id ? { ...a, mensagem: novaMensagem } : a)
    )
  }

  // Função para enviar mensagem individual
  const enviarMensagemIndividual = async (aniversariante: Aniversariante) => {
    setLoadingIndividual(aniversariante.id)
    try {
      const mensagemBase = aniversariante.mensagem || mensagemPadrao
      const mensagemProcessada = processarMensagem(mensagemBase, aniversariante)
      
      const aniversarianteComMensagem = {
        ...aniversariante,
        mensagem: mensagemProcessada
      }

      const result = await api.enviarMensagensAniversariantes("00184385000194", [aniversarianteComMensagem])
      
      if (result.success) {
        // Atualiza o status no Supabase
        const updateResult = await api.atualizarStatusEnvio('aniversariante', aniversariante.id, true, aniversarianteComMensagem.mensagem)
        
        if (updateResult.success) {
          // Atualiza o estado local
          setAniversariantes(prev => prev.map(a => 
            a.id === aniversariante.id 
              ? { ...a, enviou_msg: true, mensagem: aniversarianteComMensagem.mensagem, data_envio: new Date().toISOString() }
              : a
          ))
          // Remove o aniversariante da seleção quando enviado
          setAniversariantesSelecionados(prev => {
            const newSet = new Set(prev)
            newSet.delete(aniversariante.id)
            return newSet
          })
          showToast(`✅ Mensagem enviada para ${aniversariante.nome} - removido da lista`, 'success')
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

  // Função para excluir aniversariante da lista e do banco
  const excluirAniversariante = async (id: number) => {
    try {
      console.log('🗑️ Excluindo aniversariante ID:', id)
      
      // Excluir do banco de dados
      const { error } = await supabase
        .from('aniversariantes')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('❌ Erro ao excluir do banco:', error)
        showToast(`Erro ao excluir do banco: ${error.message}`, 'error')
        return
      }
      
      // Se excluiu com sucesso do banco, remove da lista local
      setAniversariantes(prev => prev.filter(a => a.id !== id))
      setAniversariantesSelecionados(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      
      console.log('✅ Aniversariante excluído com sucesso')
      showToast("Aniversariante excluído permanentemente", 'success')
      
    } catch (error) {
      console.error('💥 Erro inesperado ao excluir:', error)
      showToast("Erro inesperado ao excluir aniversariante", 'error')
    }
  }

  // Função para marcar/desmarcar aniversariante individual
  const toggleAniversariante = (id: number) => {
    setAniversariantesSelecionados(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Função para marcar/desmarcar todos os aniversariantes
  const toggleTodos = () => {
    const aniversariantesPendentes = aniversariantesFiltrados.map(a => a.id)
    const todosSelecionados = aniversariantesPendentes.every(id => aniversariantesSelecionados.has(id))
    
    if (todosSelecionados) {
      // Desmarcar todos
      setAniversariantesSelecionados(prev => {
        const newSet = new Set(prev)
        aniversariantesPendentes.forEach(id => newSet.delete(id))
        return newSet
      })
    } else {
      // Marcar todos
      setAniversariantesSelecionados(prev => {
        const newSet = new Set(prev)
        aniversariantesPendentes.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }

  // Função para excluir todos os aniversariantes selecionados
  const excluirTodosSelecionados = async () => {
    const selecionados = Array.from(aniversariantesSelecionados)
    
    if (selecionados.length === 0) {
      showToast("Nenhum aniversariante selecionado para exclusão", 'warning')
      return
    }

    const confirmacao = window.confirm(`Tem certeza que deseja excluir ${selecionados.length} aniversariante(s) permanentemente?`)
    if (!confirmacao) return

    try {
      console.log('🗑️ Excluindo aniversariantes selecionados:', selecionados)
      
      // Excluir todos do banco de dados
      const { error } = await supabase
        .from('aniversariantes')
        .delete()
        .in('id', selecionados)
      
      if (error) {
        console.error('❌ Erro ao excluir do banco:', error)
        showToast(`Erro ao excluir do banco: ${error.message}`, 'error')
        return
      }
      
      // Se excluiu com sucesso do banco, remove da lista local
      setAniversariantes(prev => prev.filter(a => !selecionados.includes(a.id)))
      setAniversariantesSelecionados(new Set())
      
      console.log('✅ Aniversariantes excluídos com sucesso')
      showToast(`${selecionados.length} aniversariante(s) excluído(s) permanentemente`, 'success')
      
    } catch (error) {
      console.error('💥 Erro inesperado ao excluir:', error)
      showToast("Erro inesperado ao excluir aniversariantes", 'error')
    }
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
    
    const coletadosNoPeriodo = aniversariantes.filter(a => 
      new Date(a.created_at) >= dataLimite
    )
    
    const enviadosNoPeriodo = aniversariantes.filter(a => 
      a.data_envio && new Date(a.data_envio) >= dataLimite
    )
    
    const pendentesPeriodo = aniversariantes.filter(a => 
      !a.enviou_msg && new Date(a.created_at) >= dataLimite
    )
    
    return {
      coletados: coletadosNoPeriodo.length,
      enviados: enviadosNoPeriodo.length,
      pendentes: pendentesPeriodo.length,
      total: aniversariantes.length
    }
  }

  const estatisticas = calcularEstatisticas(filtroEstatisticas)

  // Filtrar aniversariantes por busca e status de envio
  const aniversariantesFiltrados = aniversariantes
    .filter(a => !a.enviou_msg) // Só mostra os que ainda não foram enviados
    .filter(a =>
      (a.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (a.celular?.includes(searchTerm) || false)
    )

  // Carregar dados automaticamente ao inicializar
  useEffect(() => {
    if (empresaChave) {
      buscarAniversariantesSupabase()
    }
  }, [empresaChave])

  // Marcar todos os novos aniversariantes por padrão
  useEffect(() => {
    const novosPendentes = aniversariantes
      .filter(a => !a.enviou_msg && !aniversariantesSelecionados.has(a.id))
      .map(a => a.id)
    
    if (novosPendentes.length > 0) {
      setAniversariantesSelecionados(prev => {
        const newSet = new Set(prev)
        novosPendentes.forEach(id => newSet.add(id))
        return newSet
      })
    }
  }, [aniversariantes])

  // Monitorar mudanças na lista de aniversariantes para fechar toast de processamento
  useEffect(() => {
    if (aniversariantes.length > 0 && toastMessage?.includes('Processando')) {
      console.log('✅ Dados carregados, fechando toast de processamento')
      closeToast()
      showToast(`✨ ${aniversariantes.length} aniversariantes carregados com sucesso!`, 'success')
    }
  }, [aniversariantes.length, toastMessage])

  // Realtime subscription para aniversariantes
  useEffect(() => {
    if (!empresaChave) return

    console.log('🔔 Configurando Realtime para empresa chave:', empresaChave)

    // Criar subscription para mudanças na tabela aniversariantes
    const subscription = supabase
      .channel(`aniversariantes-${empresaChave}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'aniversariantes'
          // Nota: filtro por UUID será implementado quando tivermos a estrutura correta
        },
        (payload) => {
          console.log('🔔 Mudança detectada na tabela aniversariantes:', payload)
          
          // Verificar se é uma inserção de novos dados
          const isInsert = payload.eventType === 'INSERT'
          const isUpdate = payload.eventType === 'UPDATE'
          
          // Atualizar dados automaticamente quando houver mudanças
          setTimeout(() => {
            console.log('🔄 Atualizando dados após mudança no Realtime...')
            buscarAniversariantesSupabase(false, true) // silentMode = true
            
            // Fechar toast de processamento se estiver aberto
            if (toastMessage?.includes('Processando') || toastMessage?.includes('processamento')) {
              closeToast()
            }
            
            if (isInsert) {
              showToast('✨ Novos aniversariantes carregados!', 'success')
            } else if (isUpdate) {
              showToast('🔄 Dados atualizados!', 'info')
            } else {
              showToast('📝 Dados modificados!', 'info')
            }
          }, 500) // Pequeno delay para garantir que os dados foram persistidos
        }
      )
      .subscribe((status) => {
        console.log('📡 Status da conexão Realtime:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Conectado ao Realtime para aniversariantes')
          setRealtimeConnected(true)
          // Removendo toast chato - apenas log no console
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na conexão Realtime')
          setRealtimeConnected(false)
          showToast('⚠️ Falha na conexão em tempo real', 'warning')
        }
      })

    // Cleanup: remover subscription quando componente for desmontado
    return () => {
      console.log('🔌 Desconectando Realtime subscription')
      setRealtimeConnected(false)
      subscription.unsubscribe()
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
        title="Aniversariantes" 
        description="Gerencie campanhas de aniversário e envio de mensagens"
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coletados no Período</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.coletados}</div>
            <p className="text-xs text-muted-foreground">
              {filtroEstatisticas === 'todos' ? 'Total geral' : 
               filtroEstatisticas === 'hoje' ? 'Coletados hoje' :
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
              {estatisticas.coletados > 0 ? Math.round((estatisticas.enviados / estatisticas.coletados) * 100) : 0}% dos coletados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes no Período</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
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
        

      </div>

      {/* Controles de período e coleta */}
      <Card>
        <CardHeader>
          <CardTitle>Coletar Aniversariantes</CardTitle>
          <CardDescription>
            Defina o período e solicite a coleta de aniversariantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 items-end">
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
            <Button 
              onClick={coletarAniversariantes}
              disabled={loadingColeta || toastMessage?.includes('Processando')}
              className="flex items-center gap-2"
            >
              {loadingColeta || toastMessage?.includes('Processando') ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              {loadingColeta ? "Enviando solicitação..." : 
               toastMessage?.includes('Processando') ? "Processando..." : 
               "Coletar Aniversariantes"}
            </Button>
                        <Button 
              variant="outline"
              onClick={refreshAniversariantes}
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
                placeholder="Digite a mensagem padrão para todos os aniversariantes..."
                value={mensagemPadrao}
                onChange={(e) => setMensagemPadrao(e.target.value)}
                rows={3}
              />
              <div className="text-xs text-muted-foreground">
                💡 <strong>Variáveis disponíveis:</strong> [nome] = primeiro nome, [nome_completo] = nome completo
              </div>
            </div>
            
            {/* Preview da mensagem */}
            {aniversariantes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Preview da Mensagem</Label>
                <div className="p-3 bg-gray-50 border rounded-md">
                  <div className="text-sm">
                    <strong>Exemplo com "{aniversariantes[0]?.nome || 'João Silva'}":</strong>
                  </div>
                  <div className="text-sm mt-1 italic">
                    "{processarMensagem(mensagemPadrao, aniversariantes[0] || { nome: 'João Silva' } as Aniversariante)}"
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setAniversariantes(prev => 
                    prev.map(a => ({ ...a, mensagem: mensagemPadrao }))
                  )
                  showToast("Mensagem padrão aplicada a todos! Use [nome] para personalizar.", 'success')
                }}
                variant="outline"
              >
                Aplicar a Todos
              </Button>
              <Button 
                onClick={enviarMensagens}
                disabled={loadingEnvio || aniversariantesSelecionados.size === 0}
                className="flex items-center gap-2"
              >
                {loadingEnvio ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {loadingEnvio ? "Enviando..." : `Enviar Mensagens Selecionadas (${aniversariantesSelecionados.size})`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de aniversariantes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Aniversariantes Pendentes</CardTitle>
              <CardDescription>
                Apenas aniversariantes que ainda não receberam mensagem (enviados são removidos automaticamente)
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
              placeholder="Buscar por nome ou telefone..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {aniversariantesFiltrados.length > 0 ? (
            <>
              {/* Controles de seleção */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={aniversariantesFiltrados.length > 0 && aniversariantesFiltrados.every(a => aniversariantesSelecionados.has(a.id))}
                      onChange={toggleTodos}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="select-all" className="text-sm font-medium text-gray-700">
                      Selecionar todos ({aniversariantesFiltrados.length})
                    </label>
                  </div>
                  <div className="text-sm text-gray-600">
                    {aniversariantesSelecionados.size} de {aniversariantesFiltrados.length} selecionados
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={excluirTodosSelecionados}
                  disabled={aniversariantesSelecionados.size === 0}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-3 w-3" />
                  Excluir Selecionados ({aniversariantesSelecionados.size})
                </Button>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Seleção</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Data Nascimento</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Coleta</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aniversariantesFiltrados.map((aniversariante) => (
                    <TableRow key={aniversariante.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={aniversariantesSelecionados.has(aniversariante.id)}
                          onChange={() => toggleAniversariante(aniversariante.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{aniversariante.nome}</TableCell>
                    <TableCell>
                      {aniversariante.dataNascimento ? new Date(aniversariante.dataNascimento).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>{aniversariante.celular || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={aniversariante.enviou_msg === true ? 'default' : 'secondary'}
                      >
                        {aniversariante.enviou_msg === true ? 'Enviado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(aniversariante.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(aniversariante.created_at).toLocaleTimeString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Textarea
                          value={aniversariante.mensagem || ''}
                          onChange={(e) => atualizarMensagem(aniversariante.id, e.target.value)}
                          rows={2}
                          className="min-w-[200px]"
                          placeholder={mensagemPadrao}
                        />
                        {(aniversariante.mensagem || mensagemPadrao).includes('[nome]') && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            <strong>Preview:</strong> "{processarMensagem(aniversariante.mensagem || mensagemPadrao, aniversariante)}"
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={aniversariante.enviou_msg === true || loadingIndividual === aniversariante.id}
                          onClick={() => enviarMensagemIndividual(aniversariante)}
                          className="flex items-center gap-2"
                        >
                          {loadingIndividual === aniversariante.id ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" />
                              Enviando...
                            </>
                          ) : aniversariante.enviou_msg === true ? (
                            'Enviado'
                          ) : (
                            'Enviar'
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => excluirAniversariante(aniversariante.id)}
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
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum aniversariante pendente</p>
              <p className="text-muted-foreground">
                {aniversariantes.length === 0 
                  ? "Realize uma coleta para visualizar os dados" 
                  : aniversariantes.filter(a => !a.enviou_msg).length === 0
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