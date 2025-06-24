'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PageProps {
  params: { empresa_id: string }
}

export default function TestAniversariantesPage({ params }: PageProps) {
  const [realtimeStatus, setRealtimeStatus] = useState('Disconnected')
  const [data, setData] = useState<any[]>([])
  const [newName, setNewName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Buscar dados iniciais
    fetchData()

    // Setup Realtime
    const subscription = supabase
      .channel(`test-aniversariantes-${params.empresa_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aniversariantes',
          filter: `empresa_id=eq.${params.empresa_id}`
        },
        (payload) => {
          console.log('🔔 Realtime update:', payload)
          fetchData()
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status)
        setRealtimeStatus(status)
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [params.empresa_id])

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('aniversariantes')
      .select('*')
      .eq('empresa_id', params.empresa_id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching data:', error)
    } else {
      setData(data || [])
    }
  }

  const insertTestData = async () => {
    if (!newName.trim()) return

    setIsLoading(true)
    const { error } = await supabase
      .from('aniversariantes')
      .insert({
        codigo: `TEST-${Date.now()}`,
        nome: newName,
        dataNascimento: '1990-01-01',
        celular: '66999999999',
        empresa_id: parseInt(params.empresa_id),
        enviou_msg: false,
        mensagem: 'Teste Realtime!'
      })

    if (error) {
      console.error('Error inserting:', error)
    } else {
      setNewName('')
    }
    setIsLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Teste Realtime - Empresa {params.empresa_id}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Status da Conexão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full ${
                realtimeStatus === 'SUBSCRIBED' ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span>{realtimeStatus}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inserir Dados de Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nome do aniversariante"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && insertTestData()}
            />
            <Button onClick={insertTestData} disabled={isLoading}>
              {isLoading ? 'Inserindo...' : 'Inserir'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Tabela ({data.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.id} className="p-2 border rounded">
                <strong>{item.nome}</strong> - {item.codigo}
                <br />
                <small className="text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </small>
              </div>
            ))}
            {data.length === 0 && (
              <p className="text-gray-500">Nenhum dado encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 