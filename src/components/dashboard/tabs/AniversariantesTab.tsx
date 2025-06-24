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
import { Calendar, Search, Send, RefreshCw, MessageSquare, Users } from "lucide-react"
import { api } from "@/lib/api"
import { parseEmpresaId } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import type { Aniversariante } from "@/lib/types"

interface AniversariantesTabProps {
  empresaId: string
  isLoading?: boolean
}

export function AniversariantesTab({ empresaId, isLoading }: AniversariantesTabProps) {
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

  // Função para toast (simples alert se toast não estiver disponível)
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`)
    alert(`${type.toUpperCase()}: ${message}`)
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
      const result = await api.coletarAniversariantes("00184385000194", dataInicial, dataFinal)
      
      if (result.success) {
        showToast("✅ Solicitação enviada! Os dados aparecerão automaticamente quando processados.", 'success')
      } else {
        showToast(`Erro: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Erro:', error)
      showToast("Erro na comunicação com o webhook", 'error')
    } finally {
      setLoadingColeta(false)
    }
  }

  // Função para buscar aniversariantes do Supabase (após webhook processar)
  const buscarAniversariantesSupabase = async (showLoadingState = false) => {
    if (showLoadingState) setLoadingRefresh(true)
    try {
      console.log('🔄 Iniciando busca de aniversariantes para empresa:', empresaId)
      console.log('🔢 parseEmpresaId resultado:', parseEmpresaId(empresaId))
      
      // Debug: primeiro vamos ver quantos registros existem na tabela total
      const debugResult = await supabase
        .from('aniversariantes')
        .select('empresa_id, id, nome')
        .limit(10)
      console.log('🗂️ Debug - primeiros 10 registros da tabela:', debugResult.data)
      
      const result = await api.getAniversariantes(empresaId)
      
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
          showToast(`${result.data.length} aniversariantes carregados (dados de teste)`, 'info')
          console.log('⚠️ Dados mockados carregados:', result.data)
        } else {
          showToast(`${result.data.length} aniversariantes carregados do banco`, 'success')
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
            showToast(`${todosOsDados.length} aniversariantes encontrados (todos da tabela)`, 'warning')
            
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
            empresa_id: parseEmpresaId(empresaId),
            enviou_msg: false,
            mensagem: 'Feliz aniversário! 🎉',
            whatsapp_msg: null
          }
        ]
        setAniversariantes(mockData)
        showToast('Carregados dados de fallback para teste', 'warning')
      }
    } catch (error) {
      console.error('💥 Erro inesperado:', error)
      showToast("Erro crítico - usando dados de emergência", 'error')
      
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
          empresa_id: parseEmpresaId(empresaId),
          enviou_msg: false,
          mensagem: 'Feliz aniversário! 🎉',
          whatsapp_msg: null
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
      // Filtra apenas aniversariantes que não foram enviados
      const aniversariantesParaEnvio = aniversariantes
        .filter(a => !a.enviou_msg)
        .map(aniversariante => {
          const mensagemBase = aniversariante.mensagem || mensagemPadrao
          const mensagemProcessada = processarMensagem(mensagemBase, aniversariante)
          return {
            ...aniversariante,
            mensagem: mensagemProcessada
          }
        })

      if (aniversariantesParaEnvio.length === 0) {
        showToast("Não há mensagens pendentes para envio", 'info')
        return
      }

      // Chama o webhook para envio das mensagens
      const result = await api.enviarMensagensAniversariantes("00184385000194", aniversariantesParaEnvio)
      
      if (result.success) {
        showToast(`${aniversariantesParaEnvio.length} mensagens enviadas com sucesso!`, 'success')
        
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
              ? { ...a, enviou_msg: true, mensagem: a.mensagem || mensagemPadrao }
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
              ? { ...a, enviou_msg: true, mensagem: aniversarianteComMensagem.mensagem }
              : a
          ))
          showToast(`Mensagem enviada para ${aniversariante.nome}`, 'success')
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

  // Filtrar aniversariantes por busca
  const aniversariantesFiltrados = aniversariantes.filter(a =>
    (a.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (a.celular?.includes(searchTerm) || false)
  )

  // Carregar dados automaticamente ao inicializar
  useEffect(() => {
    if (empresaId) {
      buscarAniversariantesSupabase()
    }
  }, [empresaId])

  // Realtime subscription para aniversariantes
  useEffect(() => {
    if (!empresaId) return

    const empresaIdNumber = parseEmpresaId(empresaId)
    console.log('🔔 Configurando Realtime para empresa_id:', empresaIdNumber)

    // Criar subscription para mudanças na tabela aniversariantes
    const subscription = supabase
      .channel(`aniversariantes-${empresaIdNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'aniversariantes',
          filter: `empresa_id=eq.${empresaIdNumber}`
        },
        (payload) => {
          console.log('🔔 Mudança detectada na tabela aniversariantes:', payload)
          
          // Atualizar dados automaticamente quando houver mudanças
          setTimeout(() => {
            console.log('🔄 Atualizando dados após mudança no Realtime...')
            buscarAniversariantesSupabase()
            showToast('✨ Novos dados disponíveis!', 'success')
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
  }, [empresaId]) // Recriar subscription se empresaId mudar

  return (
    <DashboardTab 
      title="Aniversariantes" 
      description="Gerencie campanhas de aniversário e envio de mensagens"
      isLoading={isLoading}
    >
      {/* Cards de métricas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aniversariantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aniversariantes.length}</div>
            <p className="text-xs text-muted-foreground">
              Período selecionado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {aniversariantes.filter(a => a.enviou_msg).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {aniversariantes.length > 0 ? Math.round((aniversariantes.filter(a => a.enviou_msg).length / aniversariantes.length) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {aniversariantes.filter(a => !a.enviou_msg).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando envio
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Sistema</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Empresa: {empresaId}</div>
            <div className="text-sm">
              Realtime: <span className={`px-2 py-1 rounded text-xs ${
                realtimeConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {realtimeConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ID numérico: {parseEmpresaId(empresaId)}
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
              disabled={loadingColeta}
              className="flex items-center gap-2"
            >
              {loadingColeta ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              {loadingColeta ? "Coletando..." : "Coletar Aniversariantes"}
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
                disabled={loadingEnvio || aniversariantes.length === 0}
                className="flex items-center gap-2"
              >
                {loadingEnvio ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {loadingEnvio ? "Enviando..." : `Enviar Mensagens (${aniversariantes.filter(a => !a.enviou_msg).length})`}
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
              <CardTitle>Lista de Aniversariantes</CardTitle>
              <CardDescription>
                Visualize e edite as mensagens individuais
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Data Nascimento</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aniversariantesFiltrados.map((aniversariante) => (
                  <TableRow key={aniversariante.id}>
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum aniversariante encontrado</p>
              <p className="text-muted-foreground">
                {aniversariantes.length === 0 
                  ? "Realize uma coleta para visualizar os dados" 
                  : "Nenhum resultado para o termo pesquisado"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardTab>
  )
} 