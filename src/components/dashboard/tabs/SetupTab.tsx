"use client"

import { DashboardTab } from "../DashboardTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Clock, MessageSquare, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import type { Empresa, Regra, RegraDetalhe } from "@/lib/types"

interface SetupTabProps {
  empresaId: string
  isLoading?: boolean
}

interface RegraCompleta extends Regra {
  pacote_detalhes?: {
    id: number
    item: string
    ativo: boolean
  }
  regras_detalhes?: RegraDetalhe[]
}

export function SetupTab({ empresaId, isLoading }: SetupTabProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [regras, setRegras] = useState<RegraCompleta[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string>('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info')

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message)
    setToastType(type)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const closeToast = () => {
    setToastMessage('')
  }

  // Buscar dados da empresa e regras
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        console.log('🔄 SetupTab: Carregando dados para empresa ID:', empresaId)
        
        const [empresaResult, regrasResult] = await Promise.all([
          api.getEmpresaData(empresaId),
          api.getRegrasCompletas(empresaId)
        ])
        
        if (empresaResult.success && empresaResult.data) {
          setEmpresa(empresaResult.data)
          console.log('✅ Empresa carregada:', empresaResult.data.empresa)
        }
        
        if (regrasResult.success && regrasResult.data) {
          setRegras(regrasResult.data)
          console.log('✅ Regras carregadas:', regrasResult.data.length, 'regras')
        } else {
          console.warn('⚠️ Nenhuma regra encontrada ou erro:', regrasResult.error)
        }
      } catch (error) {
        console.error('💥 Erro ao carregar dados:', error)
        showToast('Erro ao carregar configurações', 'error')
      } finally {
        setLoading(false)
      }
    }
    
    if (empresaId) {
      fetchData()
    }
  }, [empresaId])

  // Atualizar regra principal
  const atualizarRegra = async (regraId: number, campo: keyof Regra, valor: any) => {
    try {
      const dados = { [campo]: valor }
      const result = await api.atualizarRegra(regraId, dados)
      
      if (result.success) {
        // Atualizar estado local
        setRegras(prev => prev.map(regra => 
          regra.id === regraId ? { ...regra, [campo]: valor } : regra
        ))
        showToast('Configuração atualizada!', 'success')
      } else {
        showToast(`Erro ao atualizar: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Erro ao atualizar regra:', error)
      showToast('Erro ao salvar alteração', 'error')
    }
  }

  // Atualizar detalhe da regra
  const atualizarRegraDetalhe = async (detalheId: number, campo: keyof RegraDetalhe, valor: any) => {
    try {
      const dados = { [campo]: valor }
      const result = await api.atualizarRegraDetalhe(detalheId, dados)
      
      if (result.success) {
        // Atualizar estado local
        setRegras(prev => prev.map(regra => ({
          ...regra,
          regras_detalhes: regra.regras_detalhes?.map(detalhe =>
            detalhe.id === detalheId ? { ...detalhe, [campo]: valor } : detalhe
          )
        })))
        showToast('Configuração atualizada!', 'success')
      } else {
        showToast(`Erro ao atualizar: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Erro ao atualizar detalhe:', error)
      showToast('Erro ao salvar alteração', 'error')
    }
  }

  // Função para formatar horário
  const formatTime = (time: string | null) => {
    if (!time) return '08:00'
    return time.substring(0, 5) // Remove segundos
  }

  // Função para obter ícone baseado no tipo de regra
  const getRegraIcon = (item: string) => {
    switch (item?.toLowerCase()) {
      case 'aniversário':
        return '🎂'
      case 'pós-venda':
        return '📦'
      case 'cobranças vencidas':
        return '💰'
      case 'cobranças a vencer':
        return '⏰'
      case 'clientes sem comprar':
        return '🛒'
      default:
        return '⚙️'
    }
  }

  return (
    <DashboardTab 
      title="Configurações de Automação" 
      description={`Configure as regras de envio automático para ${empresa?.empresa || 'sua empresa'}`}
      isLoading={isLoading || loading}
    >
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toastType === 'success' ? 'bg-green-500' : 
          toastType === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          <div className="flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={closeToast} className="ml-4 text-white hover:text-gray-200">×</button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* Header com informações da empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
            <CardDescription>
              Configurações aplicadas ao sistema de automação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Empresa</Label>
                <p className="text-lg font-semibold">{empresa?.empresa || 'Carregando...'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">CNPJ</Label>
                <p className="text-lg font-semibold">{empresa?.cnpj || 'Carregando...'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">WhatsApp</Label>
                <p className="text-lg font-semibold">{empresa?.whatsapp || 'Carregando...'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regras de Automação */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Regras de Automação</h2>
          
          {regras.length === 0 && !loading && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma regra de automação configurada para esta empresa.</p>
              </CardContent>
            </Card>
          )}

          {regras.map((regra) => (
            <Card key={regra.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getRegraIcon(regra.pacote_detalhes?.item || '')}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{regra.pacote_detalhes?.item || 'Regra'}</h3>
                      <p className="text-sm text-muted-foreground">ID: {regra.id}</p>
                    </div>
                  </div>
                  <Switch
                    checked={regra.habilitado || false}
                    onCheckedChange={(checked: boolean) => atualizarRegra(regra.id, 'habilitado', checked)}
                  />
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Configurações gerais da regra */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`hr_inicial_${regra.id}`}>Horário Inicial</Label>
                    <Input
                      id={`hr_inicial_${regra.id}`}
                      type="time"
                      value={formatTime(regra.hr_inicial)}
                      onChange={(e) => atualizarRegra(regra.id, 'hr_inicial', e.target.value + ':00')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`hr_final_${regra.id}`}>Horário Final</Label>
                    <Input
                      id={`hr_final_${regra.id}`}
                      type="time"
                      value={formatTime(regra.hr_final)}
                      onChange={(e) => atualizarRegra(regra.id, 'hr_final', e.target.value + ':00')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`limite_dia_${regra.id}`}>Limite por Dia</Label>
                    <Input
                      id={`limite_dia_${regra.id}`}
                      type="number"
                      min="1"
                      max="50"
                      value={regra.limite_repeticoes_dia || 1}
                      onChange={(e) => atualizarRegra(regra.id, 'limite_repeticoes_dia', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`limite_total_${regra.id}`}>Limite Total</Label>
                    <Input
                      id={`limite_total_${regra.id}`}
                      type="number"
                      min="1"
                      max="1000"
                      value={regra.limite_repeticoes_total || 30}
                      onChange={(e) => atualizarRegra(regra.id, 'limite_repeticoes_total', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`nao_executar_${regra.id}`}>Não executar após (dias)</Label>
                  <Input
                    id={`nao_executar_${regra.id}`}
                    type="number"
                    min="1"
                    max="365"
                    value={regra.nao_executar_apos_dias || 90}
                    onChange={(e) => atualizarRegra(regra.id, 'nao_executar_apos_dias', parseInt(e.target.value))}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sistema não executará a regra após este período de inatividade
                  </p>
                </div>

                {/* Detalhes da regra */}
                {regra.regras_detalhes && regra.regras_detalhes.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Configurações Específicas
                    </h4>
                    
                    <div className="grid gap-4">
                      {regra.regras_detalhes.map((detalhe) => (
                        <div key={detalhe.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={detalhe.habilitado || false}
                                onCheckedChange={(checked: boolean) => atualizarRegraDetalhe(detalhe.id, 'habilitado', checked)}
                              />
                              <div>
                                <p className="font-medium">{detalhe.descricao}</p>
                                <p className="text-sm text-muted-foreground">
                                  Valor: {detalhe.valor} dia(s) | 
                                  Automático: {detalhe.auto ? 'Sim' : 'Não'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="365"
                              value={detalhe.valor || 0}
                              onChange={(e) => atualizarRegraDetalhe(detalhe.id, 'valor', parseInt(e.target.value))}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">dias</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardTab>
  )
} 