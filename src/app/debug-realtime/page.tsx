"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { parseEmpresaId } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function DebugRealtimePage() {
  const [empresaId, setEmpresaId] = useState("999")
  const [data, setData] = useState<any[]>([])
  const [realtimeStatus, setRealtimeStatus] = useState<string>('DISCONNECTED')
  const [logs, setLogs] = useState<string[]>([])
  const [allData, setAllData] = useState<any[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  const fetchSpecificData = async () => {
    try {
      addLog(`🔍 Buscando dados para empresa_id: ${empresaId}`)
      const empresaIdNumber = parseEmpresaId(empresaId)
      addLog(`🔢 Empresa ID convertido: ${empresaIdNumber}`)
      
      const { data, error } = await supabase
        .from('aniversariantes')
        .select('*')
        .eq('empresa_id', empresaIdNumber)
        .order('created_at', { ascending: false })

      if (error) {
        addLog(`❌ Erro: ${error.message}`)
        console.error(error)
      } else {
        addLog(`✅ Encontrados ${data?.length || 0} registros`)
        setData(data || [])
      }
    } catch (error) {
      addLog(`💥 Erro inesperado: ${error}`)
    }
  }

  const fetchAllData = async () => {
    try {
      addLog(`🌐 Buscando TODOS os dados da tabela`)
      
      const { data, error } = await supabase
        .from('aniversariantes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        addLog(`❌ Erro ao buscar todos: ${error.message}`)
        console.error(error)
      } else {
        addLog(`🗂️ Total na tabela: ${data?.length || 0} registros`)
        setAllData(data || [])
        
        // Mostrar quantos registros por empresa
        const empresas = data?.reduce((acc: any, item) => {
          const empId = item.empresa_id
          acc[empId] = (acc[empId] || 0) + 1
          return acc
        }, {})
        addLog(`📊 Por empresa: ${JSON.stringify(empresas)}`)
      }
    } catch (error) {
      addLog(`💥 Erro inesperado ao buscar todos: ${error}`)
    }
  }

  const insertTestData = async () => {
    try {
      addLog(`➕ Inserindo dados de teste para empresa ${empresaId}`)
      const empresaIdNumber = parseEmpresaId(empresaId)
      
      const testData = {
        codigo: `TEST-${Date.now()}`,
        nome: `Teste Aniversariante ${new Date().toLocaleTimeString()}`,
        dataNascimento: '1990-01-01',
        celular: '66999999999',
        empresa_id: empresaIdNumber,
        enviou_msg: false,
        mensagem: 'Teste Realtime!'
      }
      
      addLog(`📝 Dados a inserir: ${JSON.stringify(testData)}`)

      const { data, error } = await supabase
        .from('aniversariantes')
        .insert(testData)
        .select()

      if (error) {
        addLog(`❌ Erro ao inserir: ${error.message}`)
        console.error(error)
      } else {
        addLog(`✅ Dados inseridos com sucesso!`)
        console.log('Dados inseridos:', data)
      }
    } catch (error) {
      addLog(`💥 Erro inesperado ao inserir: ${error}`)
    }
  }

  useEffect(() => {
    const empresaIdNumber = parseEmpresaId(empresaId)
    addLog(`🔔 Configurando Realtime para empresa_id: ${empresaIdNumber}`)

    const subscription = supabase
      .channel(`debug-aniversariantes-${empresaIdNumber}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aniversariantes',
          filter: `empresa_id=eq.${empresaIdNumber}`
        },
        (payload) => {
          addLog(`🔔 Realtime evento: ${payload.eventType}`)
          addLog(`📦 Payload: ${JSON.stringify(payload, null, 2)}`)
          
          // Atualizar dados após evento
          setTimeout(() => {
            fetchSpecificData()
          }, 1000)
        }
      )
      .subscribe((status) => {
        addLog(`📡 Status Realtime: ${status}`)
        setRealtimeStatus(status)
      })

    return () => {
      addLog(`🔌 Desconectando Realtime`)
      subscription.unsubscribe()
    }
  }, [empresaId])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug - Realtime Aniversariantes</h1>
      
      {/* Controles */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Controles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Empresa ID</Label>
              <Input
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                placeholder="ID da empresa"
              />
            </div>
            
            <div className="space-y-2">
              <Button onClick={fetchSpecificData} className="w-full">
                🔍 Buscar Dados da Empresa
              </Button>
              <Button onClick={fetchAllData} variant="outline" className="w-full">
                🌐 Buscar Todos os Dados
              </Button>
              <Button onClick={insertTestData} variant="secondary" className="w-full">
                ➕ Inserir Dados de Teste
              </Button>
            </div>
            
            <div className="p-3 bg-gray-100 rounded">
              <strong>Status Realtime:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${
                realtimeStatus === 'SUBSCRIBED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {realtimeStatus}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Logs do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 overflow-y-auto bg-black text-green-400 p-3 rounded font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
            <Button 
              onClick={() => setLogs([])} 
              variant="outline" 
              className="mt-2"
            >
              🗑️ Limpar Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dados da Empresa Específica */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa {empresaId} ({data.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length > 0 ? (
            <div className="space-y-2">
              {data.map((item) => (
                <div key={item.id} className="p-3 border rounded">
                  <div className="font-semibold">{item.nome}</div>
                  <div className="text-sm text-gray-600">
                    Código: {item.codigo} | Empresa ID: {item.empresa_id}
                  </div>
                  <div className="text-xs text-gray-500">
                    Criado: {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum dado encontrado para empresa {empresaId}</p>
          )}
        </CardContent>
      </Card>

      {/* Todos os Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Todos os Dados da Tabela ({allData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {allData.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allData.map((item) => (
                <div key={item.id} className="p-2 border rounded text-sm">
                  <strong>{item.nome}</strong> (Empresa: {item.empresa_id})
                  <br />
                  <span className="text-gray-500">{item.codigo}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum dado na tabela</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 