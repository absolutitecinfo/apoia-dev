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
import { Calendar, Search, Send, RefreshCw, MessageSquare, Users, X, CheckCircle, AlertCircle, Info, AlertTriangle, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { LoadingSpinner, LoadingOverlay } from "@/components/ui/loading-spinner"

import { supabase } from "@/lib/supabase"
import type { Aniversariante, Empresa } from "@/lib/types"

interface AniversariantesTabProps {
  empresaChave: string
  isLoading?: boolean
}

export function AniversariantesTab({ empresaChave, isLoading }: AniversariantesTabProps) {
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([])
  const [empresaAtual, setEmpresaAtual] = useState<Empresa | null>(null)
  const [loadingColeta, setLoadingColeta] = useState(false)
  const [loadingEnvio, setLoadingEnvio] = useState(false)
  const [loadingIndividual, setLoadingIndividual] = useState<number | null>(null)
  const [loadingRefresh, setLoadingRefresh] = useState(false)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const [dataInicial, setDataInicial] = useState('2025-01-01')
  const [dataFinal, setDataFinal] = useState('2025-12-31')
  const [mensagemPadrao, setMensagemPadrao] = useState("Feliz aniversário, [nome]! 🎉")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Estados para filtros de estatísticas
  const [filtroEstatisticas, setFiltroEstatisticas] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos')
  
  // Estados para seleção de aniversariantes
  const [aniversariantesSelecionados, setAniversariantesSelecionados] = useState<Set<number>>(new Set())
  // Contador para forçar re-renderização quando o Set mudar
  const [versaoSelecao, setVersaoSelecao] = useState(0)

  // Estado para controlar toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('info')

  // Função para toast melhorada
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', autoHide: boolean = true) => {
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
    
    // Parse da string "YYYY-MM-DD" como data local (não UTC)
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

  // Função auxiliar para converter string de data para Date no timezone do Brasil
  // Para strings "YYYY-MM-DD", cria data local (não UTC)
  // Para timestamps ISO, converte para timezone do Brasil
  const parseDataBrasil = (dataString: string | null): Date | null => {
    if (!dataString) return null
    
    // Se for apenas data (YYYY-MM-DD), criar como data local
    if (dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dataString.split('-').map(Number)
      return new Date(year, month - 1, day, 0, 0, 0, 0)
    }
    
    // Se for timestamp ISO, já vem com timezone e será convertido automaticamente
    return new Date(dataString)
  }

  // Função para buscar dados da empresa atual
  const buscarEmpresaAtual = async () => {
    try {
      const result = await api.getEmpresaData(empresaChave)
      
      if (result.success && result.data) {
        setEmpresaAtual(result.data)
      } else {
        showToast(`Erro ao carregar dados da empresa: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast("Erro ao carregar dados da empresa", 'error')
    }
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
    if (!empresaAtual?.cnpj) {
      showToast("CNPJ da empresa não encontrado. Aguarde o carregamento dos dados.", 'warning')
      return
    }


    setLoadingColeta(true)
    try {
      const result = await api.coletarAniversariantes(empresaAtual.cnpj, dataInicial, dataFinal, empresaAtual.nome_sistema || '')
      
      if (result.success) {
        showToast("🔄 Processando... Os dados aparecerão automaticamente quando prontos.", 'info', false)
        
        // Verificação automática após 3 segundos
        setTimeout(() => {
          console.log('🔄 Verificação automática após webhook...')
          buscarAniversariantesSupabase(false, true) // silentMode = true
        }, 3000)
        
        // Verificação automática após 8 segundos
        setTimeout(() => {
          console.log('🔄 Segunda verificação automática...')
          buscarAniversariantesSupabase(false, true) // silentMode = true
        }, 8000)
        
        // Aguardar um tempo para ver se chegam dados via realtime
        setTimeout(() => {
          if (loadingColeta) {
            showToast("⏳ Processamento pode demorar alguns minutos. Os dados aparecerão automaticamente.", 'warning')
          }
        }, 10000)
      } else {
        showToast(`Erro: ${result.error}`, 'error')
      }
    } catch (error) {
      showToast("Erro na comunicação com o webhook", 'error')
    } finally {
      setLoadingColeta(false)
    }
  }

  // Função para buscar aniversariantes do Supabase (após webhook processar)
  const buscarAniversariantesSupabase = async (showLoadingState = false, silentMode = false) => {
    if (showLoadingState) setLoadingRefresh(true)
    try {
      const result = await api.getAniversariantes(empresaChave)
      
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
        } else {
          if (!silentMode) showToast(`${result.data.length} aniversariantes carregados do banco`, 'success')
        }
      } else if (result.success && (!result.data || result.data.length === 0)) {
        // Se não encontrou dados para a empresa específica, apenas define lista vazia
        // Não buscamos dados de outras empresas para garantir que os cards informativos sejam corretos
        setAniversariantes([])
        if (!silentMode) showToast('Nenhum aniversariante encontrado para esta empresa', 'info')
      } else {
        showToast(`Erro ao buscar aniversariantes: ${result.error || 'Erro desconhecido'}`, 'error')
      }
    } catch (error) {
      if (!silentMode) showToast("Erro crítico ao buscar dados", 'error')
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
    if (!empresaAtual?.cnpj) {
      showToast("CNPJ da empresa não encontrado. Aguarde o carregamento dos dados.", 'warning')
      return
    }

    setLoadingEnvio(true)
    try {
      // Filtra apenas aniversariantes que não foram enviados E que estão selecionados
      const aniversariantesSelecionadosParaEnvio = aniversariantes
        .filter(a => !a.enviou_msg && aniversariantesSelecionados.has(a.id))
      
      const aniversariantesComNumeroValido = aniversariantesSelecionadosParaEnvio
        .filter(a => {
          // Só incluir aniversariantes que tenham número válido
          return a.celular && a.celular.trim().length > 0
        })

      const aniversariantesParaEnvio = aniversariantesComNumeroValido
        .map(aniversariante => {
          const mensagemBase = aniversariante.mensagem || mensagemPadrao
          const mensagemProcessada = processarMensagem(mensagemBase, aniversariante)
          return {
            ...aniversariante,
            mensagem: mensagemProcessada
          }
        })

      if (aniversariantesSelecionadosParaEnvio.length === 0) {
        showToast("Nenhum aniversariante selecionado para envio", 'info')
        return
      }

      if (aniversariantesParaEnvio.length === 0) {
        showToast("Nenhum dos aniversariantes selecionados possui número válido para envio", 'warning')
        return
      }

      // Informar se algumas aniversariantes foram filtradas
      const aniversariantesFiltradas = aniversariantesSelecionadosParaEnvio.length - aniversariantesParaEnvio.length
      if (aniversariantesFiltradas > 0) {
        showToast(`⚠️ ${aniversariantesFiltradas} aniversariante(s) ignorado(s) por não ter número válido`, 'warning')
      }

      // Salvar celular e mensagem no banco antes de enviar (garantir que está salvo)
      const savePromises = aniversariantesParaEnvio.map(async (a) => {
        await salvarCelularNoBanco(a.id, a.celular || '')
        await salvarMensagemNoBanco(a.id, a.mensagem || mensagemPadrao)
      })
      await Promise.all(savePromises)
      
      // Remover da lista de linhas em edição após salvar
      aniversariantesParaEnvio.forEach(a => {
        linhasEmEdicao.current.delete(a.id)
      })

      // Chama o webhook para envio das mensagens
      const result = await api.enviarMensagensAniversariantes(empresaAtual.cnpj, aniversariantesParaEnvio, empresaAtual.nome_sistema || '')
      
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
          
          // Remove os aniversariantes enviados da seleção
          setAniversariantesSelecionados(prev => {
            const newSet = new Set(prev)
            aniversariantesParaEnvio.forEach(a => newSet.delete(a.id))
            return newSet
          })
          
          // Forçar atualização da versão de seleção para garantir re-renderização
          setVersaoSelecao((v: number) => v + 1)
          
          showToast("Status atualizado no banco de dados", 'success')
        } else {
          // Mesmo com falha parcial, atualizar as que foram enviadas com sucesso
          const idsEnviadasComSucesso = new Set(
            updateResults
              .map((r, idx) => r.success ? aniversariantesParaEnvio[idx].id : null)
              .filter(id => id !== null)
          )
          
          if (idsEnviadasComSucesso.size > 0) {
            setAniversariantes(prev => prev.map(a => 
              idsEnviadasComSucesso.has(a.id)
                ? { ...a, enviou_msg: true, mensagem: a.mensagem || mensagemPadrao, data_envio: new Date().toISOString() }
                : a
            ))
            
            // Remove da seleção apenas as que foram enviadas com sucesso
            setAniversariantesSelecionados(prev => {
              const newSet = new Set(prev)
              idsEnviadasComSucesso.forEach(id => newSet.delete(id))
              return newSet
            })
            
            // Forçar atualização da versão de seleção
            setVersaoSelecao((v: number) => v + 1)
          }
          
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

  // Função para salvar mensagem no banco
  const salvarMensagemNoBanco = async (id: number, novaMensagem: string) => {
    try {
      // Marcar como atualização própria ANTES de salvar (importante para evitar race condition)
      atualizacoesPropriasMensagem.current.add(id)
      console.log('📝 Marcando atualização de mensagem como própria:', id)
      
      const result = await api.atualizarMensagem('aniversariante', id, novaMensagem)
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
  
  const atualizarMensagem = (id: number, novaMensagem: string) => {
    // Marcar linha como em edição (para evitar que Realtime interfira durante digitação)
    linhasEmEdicao.current.add(id)
    
    // Atualizar estado local imediatamente
    setAniversariantes(prev => 
      prev.map(a => a.id === id ? { ...a, mensagem: novaMensagem } : a)
    )
  }

  // Rastrear atualizações de celular que fizemos para evitar recarregar tudo via Realtime
  const atualizacoesPropriasCelular = useRef<Set<number>>(new Set())
  // Rastrear atualizações de mensagem que fizemos para evitar recarregar tudo via Realtime
  const atualizacoesPropriasMensagem = useRef<Set<number>>(new Set())
  // Rastrear linhas que estão sendo editadas (para evitar recarregar enquanto o usuário está editando)
  const linhasEmEdicao = useRef<Set<number>>(new Set())
  
  // Função para salvar celular no banco
  const salvarCelularNoBanco = async (id: number, novoCelular: string) => {
    try {
      // Marcar como atualização própria ANTES de salvar (importante para evitar race condition)
      atualizacoesPropriasCelular.current.add(id)
      console.log('📝 Marcando atualização de celular como própria:', id)
      
      const result = await api.atualizarCelular('aniversariante', id, novoCelular)
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
  
  const atualizarCelular = (id: number, novoCelular: string) => {
    // Marcar linha como em edição (para evitar que Realtime interfira durante digitação)
    linhasEmEdicao.current.add(id)
    
    // Atualizar estado local imediatamente
    setAniversariantes(prev => 
      prev.map(a => a.id === id ? { ...a, celular: novoCelular } : a)
    )
  }

  // Função para enviar mensagem individual
  const enviarMensagemIndividual = async (aniversariante: Aniversariante) => {
    if (!empresaAtual?.cnpj) {
      showToast("CNPJ da empresa não encontrado. Aguarde o carregamento dos dados.", 'warning')
      return
    }

    setLoadingIndividual(aniversariante.id)
    try {
      // Verificar se há um número válido para envio
      if (!aniversariante.celular || aniversariante.celular.trim().length === 0) {
        showToast("Não há número válido para envio desta mensagem", 'error')
        setLoadingIndividual(null)
        return
      }

      // Salvar celular e mensagem no banco antes de enviar (garantir que está salvo)
      await salvarCelularNoBanco(aniversariante.id, aniversariante.celular)
      await salvarMensagemNoBanco(aniversariante.id, aniversariante.mensagem || mensagemPadrao)
      
      // Remover da lista de linhas em edição após salvar
      linhasEmEdicao.current.delete(aniversariante.id)

      const mensagemBase = aniversariante.mensagem || mensagemPadrao
      const mensagemProcessada = processarMensagem(mensagemBase, aniversariante)
      
      const aniversarianteComMensagem = {
        ...aniversariante,
        mensagem: mensagemProcessada
      }

      const result = await api.enviarMensagensAniversariantes(empresaAtual.cnpj, [aniversarianteComMensagem], empresaAtual.nome_sistema || '')
      
      if (result.success) {
        // Atualiza o status no Supabase
        const updateResult = await api.atualizarStatusEnvio('aniversariante', aniversariante.id, true, aniversarianteComMensagem.mensagem)
        
        if (updateResult.success) {
          // Atualiza o estado local imediatamente
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
          
          // Forçar atualização da versão de seleção para garantir re-renderização
          setVersaoSelecao((v: number) => v + 1)
          
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
      
      // Forçar atualização da versão de seleção para garantir re-renderização
      setVersaoSelecao((v: number) => v + 1)
      
      showToast("Aniversariante excluído permanentemente", 'success')
      
    } catch (error) {
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
      
      // Forçar atualização da versão de seleção para garantir re-renderização
      setVersaoSelecao((v: number) => v + 1)
      
      showToast(`${selecionados.length} aniversariante(s) excluído(s) permanentemente`, 'success')
      
    } catch (error) {
      showToast("Erro inesperado ao excluir aniversariantes", 'error')
    }
  }

  // Funções para calcular estatísticas por período
  const getDataLimite = (filtro: typeof filtroEstatisticas) => {
    const agora = new Date()
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
    
    // Garantir que apenas dados da empresa atual sejam considerados nas estatísticas
    const aniversariantesDaEmpresa = empresaAtual?.id 
      ? aniversariantes.filter(a => a.empresa_id === empresaAtual.id)
      : aniversariantes // Se não houver empresaAtual ainda, usar todos (mas isso não deve acontecer)
    
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

    // Converter created_at para data no timezone do Brasil para comparação
    const coletadosNoPeriodo = aniversariantesDaEmpresa.filter(a => {
      if (!a.created_at) return false
      const dataCreatedBrasil = getDataBrasilSemHora(a.created_at)
      const dataLimiteBrasil = getDataBrasilSemHora(dataLimite)
      return dataCreatedBrasil >= dataLimiteBrasil
    })
    
    const enviadosNoPeriodo = aniversariantesDaEmpresa.filter(a => {
      if (!a.data_envio) return false
      const dataEnvioBrasil = getDataBrasilSemHora(a.data_envio)
      const dataLimiteBrasil = getDataBrasilSemHora(dataLimite)
      return dataEnvioBrasil >= dataLimiteBrasil
    })
    
    const pendentesPeriodo = aniversariantesDaEmpresa.filter(a => {
      if (!a.created_at || a.enviou_msg) return false
      const dataCreatedBrasil = getDataBrasilSemHora(a.created_at)
      const dataLimiteBrasil = getDataBrasilSemHora(dataLimite)
      return dataCreatedBrasil >= dataLimiteBrasil
    })
    
    return {
      coletados: coletadosNoPeriodo.length,
      enviados: enviadosNoPeriodo.length,
      pendentes: pendentesPeriodo.length,
      total: aniversariantesDaEmpresa.length
    }
  }

  // Calcular estatísticas apenas para a empresa atual, recalculando quando empresaAtual, aniversariantes ou filtroEstatisticas mudarem
  const estatisticas = useMemo(() => {
    return calcularEstatisticas(filtroEstatisticas)
  }, [filtroEstatisticas, aniversariantes, empresaAtual?.id])

  // Filtrar aniversariantes por busca e status de envio
  const aniversariantesFiltrados = aniversariantes
    .filter(a => !a.enviou_msg) // Só mostra os que ainda não foram enviados
    .filter(a => {
      // Se não há termo de busca, mostrar todos
      if (!searchTerm || searchTerm.trim() === '') {
        return true
      }
      
      // Verificar se o nome ou celular contém o termo de busca
      const nomeMatch = a.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false
      const celularMatch = a.celular?.includes(searchTerm) || false
      
      return nomeMatch || celularMatch
    })


  // Carregar dados da empresa e aniversariantes automaticamente ao inicializar
  useEffect(() => {
    if (empresaChave) {
      buscarEmpresaAtual()
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
      closeToast()
      showToast(`✨ ${aniversariantes.length} aniversariantes carregados com sucesso!`, 'success')
    }
  }, [aniversariantes.length, toastMessage])

  // Realtime subscription para aniversariantes + Polling de backup
  useEffect(() => {
    if (!empresaChave) return

    console.log('🔔 Configurando Realtime para aniversariantes empresa chave:', empresaChave)

    let subscription: any = null
    let pollingInterval: NodeJS.Timeout | null = null

    try {
      // Criar subscription para mudanças na tabela aniversariantes
      subscription = supabase
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
            const isDelete = payload.eventType === 'DELETE'
            
            // Se for UPDATE, verificar se é apenas atualização de celular ou mensagem que fizemos
            if (isUpdate && payload.new) {
              const updatedId = payload.new.id as number
              const oldData = payload.old as any
              const newData = payload.new as any
              
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
                // Atualizar apenas o estado local sem recarregar tudo
                setAniversariantes(prev => 
                  prev.map(a => a.id === updatedId ? { ...a, celular: newData.celular } : a)
                )
                return // Não recarregar tudo
              }
              
              // Se é uma atualização própria de mensagem e apenas a mensagem mudou
              if (isMensagemUpdate && mensagemMudou && camposMudaram.length === 1 && camposMudaram[0] === 'mensagem') {
                console.log('💬 Atualização de mensagem própria detectada, ignorando Realtime')
                // Atualizar apenas o estado local sem recarregar tudo
                setAniversariantes(prev => 
                  prev.map(a => a.id === updatedId ? { ...a, mensagem: newData.mensagem } : a)
                )
                return // Não recarregar tudo
              }
              
              // Se é uma atualização própria mas outros campos também mudaram, ainda assim ignorar para evitar recarregar
              if ((isCelularUpdate || isMensagemUpdate) && (celularMudou || mensagemMudou)) {
                console.log('📝 Atualização própria detectada (celular ou mensagem), ignorando Realtime para evitar recarregar')
                return // Não recarregar tudo
              }
              
              // Se a linha está sendo editada (usuário pode estar digitando), ignorar completamente
              if (linhasEmEdicao.current.has(updatedId)) {
                console.log('✏️ Linha em edição detectada, ignorando Realtime para não interromper digitação')
                return // Não recarregar tudo
              }
            }
            
            // Para INSERT, DELETE ou outros UPDATEs, recarregar normalmente
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
              } else if (isDelete) {
                showToast('🗑️ Dados removidos!', 'info')
              } else {
                showToast('📝 Dados modificados!', 'info')
              }
            }, 500) // Pequeno delay para garantir que os dados foram persistidos
          }
        )
        .subscribe((status) => {
          console.log('📡 Status da conexão Realtime aniversariantes:', status)
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Conectado ao Realtime para aniversariantes')
            setRealtimeConnected(true)
            // Se Realtime funcionou, não precisa do polling
            if (pollingInterval) {
              clearInterval(pollingInterval)
              pollingInterval = null
            }
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn('⚠️ Problema na conexão Realtime aniversariantes:', status)
            setRealtimeConnected(false)
            
            // Se Realtime falhou, ativar polling de backup
            if (!pollingInterval) {
              console.log('🔄 Ativando polling de backup para aniversariantes...')
              pollingInterval = setInterval(() => {
                console.log('🔄 Polling: Verificando mudanças na tabela aniversariantes...')
                buscarAniversariantesSupabase(false, true) // silentMode = true
              }, 3000) // Verificar a cada 3 segundos
            }
          }
        })
    } catch (error) {
      console.warn('⚠️ Erro ao configurar Realtime aniversariantes (modo fallback ativo):', error)
      setRealtimeConnected(false)
      
      // Se Realtime falhou completamente, ativar polling
      if (!pollingInterval) {
        console.log('🔄 Ativando polling de backup para aniversariantes...')
        pollingInterval = setInterval(() => {
          console.log('🔄 Polling: Verificando mudanças na tabela aniversariantes...')
          buscarAniversariantesSupabase(false, true) // silentMode = true
        }, 3000) // Verificar a cada 3 segundos
      }
    }

    // Cleanup: remover subscription e polling quando componente for desmontado
    return () => {
      console.log('🔌 Desconectando Realtime subscription e polling aniversariantes')
      setRealtimeConnected(false)
      
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.warn('⚠️ Erro ao desconectar subscription aniversariantes:', error)
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
        text={loadingColeta ? "Coletando aniversariantes..." : "Atualizando lista..."} 
      />
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
              disabled={isLoadingData || toastMessage?.includes('Processando') || !empresaAtual?.cnpj}
              className="flex items-center gap-2"
            >
              {loadingColeta || toastMessage?.includes('Processando') ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Calendar className="h-4 w-4" />
              )}
              {loadingColeta ? "Enviando solicitação..." : 
               toastMessage?.includes('Processando') ? "Processando..." : 
               !empresaAtual?.cnpj ? "Aguardando dados da empresa..." :
               "Coletar Aniversariantes"}
            </Button>
                        <Button 
              variant="outline"
              onClick={refreshAniversariantes}
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
              className="pl-8 pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
                      {formatarDataBrasil(aniversariante.dataNascimento)}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="tel"
                        value={aniversariante.celular || ''}
                        onChange={(e) => atualizarCelular(aniversariante.id, e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="min-w-[140px]"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        {aniversariante.celular ? (
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
                      <Badge 
                        variant={aniversariante.enviou_msg === true ? 'default' : 'secondary'}
                      >
                        {aniversariante.enviou_msg === true ? 'Enviado' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatarDataHoraBrasil(aniversariante.created_at).data}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatarDataHoraBrasil(aniversariante.created_at).hora}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px] md:max-w-[400px] lg:max-w-[500px]">
                      <div className="space-y-2">
                        <Textarea
                          value={aniversariante.mensagem || ''}
                          onChange={(e) => atualizarMensagem(aniversariante.id, e.target.value)}
                          rows={2}
                          className="w-full min-w-[200px] max-w-full resize-y overflow-auto text-sm md:text-base"
                          placeholder={mensagemPadrao}
                        />
                        {(aniversariante.mensagem || mensagemPadrao).includes('[nome]') && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded break-words overflow-wrap-anywhere">
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