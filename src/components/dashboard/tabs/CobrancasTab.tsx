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
import { DollarSign, Search, Send, RefreshCw, AlertTriangle, Users, X, CheckCircle, AlertCircle, Info, Clock } from "lucide-react"
import { api } from "@/lib/api"
import { parseEmpresaId } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import type { Cobranca } from "@/lib/types"

interface CobrancasTabProps {
  empresaId: string
  isLoading?: boolean
}

export function CobrancasTab({ empresaId, isLoading }: CobrancasTabProps) {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
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
    setLoadingColeta(true)
    try {
      console.log('🚀 Iniciando coleta de cobranças...')
      const result = await api.coletarCobrancas("00184385000194", tipoCobranca, dataInicial, dataFinal)
      
      if (result.success) {
        console.log('✅ Webhook chamado com sucesso:', result.data)
        showToast("🔄 Processando cobranças... Os dados aparecerão automaticamente quando prontos.", 'info', false)
        
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
      console.log('🔄 Iniciando busca de cobranças para empresa:', empresaId)
      
      const result = await api.getCobrancas(empresaId)
      
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
            empresa_id: parseEmpresaId(empresaId),
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
          empresa_id: parseEmpresaId(empresaId),
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

  // Função para enviar mensagens (2ª chamada)
  const enviarMensagens = async () => {
    setLoadingEnvio(true)
    try {
      // Filtra apenas cobranças que não foram enviadas
      const cobrancasParaEnvio = cobrancas
        .filter(c => !c.enviou)
        .map(cobranca => {
          const mensagemBase = cobranca.mensagem || mensagemPadrao
          const mensagemProcessada = processarMensagem(mensagemBase, cobranca)
          return {
            ...cobranca,
            mensagem: mensagemProcessada,
            enviou: true,
            whatsapp: cobranca.celular
          }
        })

      if (cobrancasParaEnvio.length === 0) {
        showToast("Não há mensagens pendentes para envio", 'info')
        return
      }

      // Chama o webhook para envio das mensagens
      const result = await api.enviarMensagensCobrancas("00184385000194", cobrancasParaEnvio)
      
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

  // Função para enviar mensagem individual
  const enviarMensagemIndividual = async (cobranca: Cobranca) => {
    setLoadingIndividual(cobranca.id)
    try {
      const mensagemBase = cobranca.mensagem || mensagemPadrao
      const mensagemProcessada = processarMensagem(mensagemBase, cobranca)
      
      const cobrancaComMensagem = {
        ...cobranca,
        mensagem: mensagemProcessada,
        enviou: true,
        whatsapp: cobranca.celular
      }

      const result = await api.enviarMensagensCobrancas("00184385000194", [cobrancaComMensagem])
      
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

  // Filtrar cobranças por busca e status de envio
  const cobrancasFiltradas = cobrancas
    .filter(c => !c.enviou) // Só mostra as que ainda não foram enviadas
    .filter(c =>
      (c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (c.celular?.includes(searchTerm) || false) ||
      (c.whatsapp?.includes(searchTerm) || false)
    )

  // Carregar dados automaticamente ao inicializar
  useEffect(() => {
    if (empresaId) {
      buscarCobrancasSupabase()
    }
  }, [empresaId])

  // Monitorar mudanças na lista de cobranças para fechar toast de processamento
  useEffect(() => {
    if (cobrancas.length > 0 && toastMessage?.includes('Processando')) {
      console.log('✅ Dados carregados, fechando toast de processamento')
      closeToast()
      showToast(`✨ ${cobrancas.length} cobranças carregadas com sucesso!`, 'success')
    }
  }, [cobrancas.length, toastMessage])

  // Realtime subscription para cobranças
  useEffect(() => {
    if (!empresaId) return

    const empresaIdNumber = parseEmpresaId(empresaId)
    console.log('🔔 Configurando Realtime para cobranças empresa_id:', empresaIdNumber)

    // Criar subscription para mudanças na tabela cobranca
    const subscription = supabase
      .channel(`cobranca-${empresaIdNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'cobranca',
          filter: `empresa_id=eq.${empresaIdNumber}`
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
        console.log('📡 Status da conexão Realtime:', status)
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Conectado ao Realtime para cobranças')
          setRealtimeConnected(true)
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
  }, [empresaId]) // Recriar subscription se empresaId mudar

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
                disabled={loadingColeta || toastMessage?.includes('Processando')}
                className="flex items-center gap-2"
              >
                {loadingColeta || toastMessage?.includes('Processando') ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <DollarSign className="h-4 w-4" />
                )}
                {loadingColeta ? "Enviando solicitação..." : 
                 toastMessage?.includes('Processando') ? "Processando..." : 
                 "Coletar Cobranças"}
              </Button>
              
              <Button 
                variant="outline"
                onClick={refreshCobrancas}
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
                  disabled={loadingEnvio || cobrancas.filter(c => !c.enviou).length === 0}
                  className="flex items-center gap-2"
                >
                  {loadingEnvio ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {loadingEnvio ? "Enviando..." : `Enviar Mensagens (${cobrancas.filter(c => !c.enviou).length})`}
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
                  💡 <strong>WhatsApp:</strong> Você pode adicionar um número alternativo para envio da cobrança
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
                placeholder="Buscar por nome, telefone ou WhatsApp..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {cobrancasFiltradas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Celular</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Data Coleta</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cobrancasFiltradas.map((cobranca) => (
                    <TableRow key={cobranca.id}>
                      <TableCell className="font-medium">{cobranca.nome}</TableCell>
                      <TableCell>
                        R$ {(cobranca.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {cobranca.vencimento ? new Date(cobranca.vencimento).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>{cobranca.celular || '-'}</TableCell>
                      <TableCell>
                        <Input
                          type="tel"
                          value={cobranca.whatsapp || ''}
                          onChange={(e) => atualizarWhatsapp(cobranca.id, e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="min-w-[140px]"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Número adicional para envio
                        </div>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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