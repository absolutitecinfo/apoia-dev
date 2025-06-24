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
import { toast } from "sonner"
import { api } from "@/lib/api"
import type { Aniversariante } from "@/lib/types"

interface AniversariantesTabProps {
  empresaId: string
  isLoading?: boolean
}

export function AniversariantesTab({ empresaId, isLoading }: AniversariantesTabProps) {
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([])
  const [loadingColeta, setLoadingColeta] = useState(false)
  const [loadingEnvio, setLoadingEnvio] = useState(false)
  const [dataInicial, setDataInicial] = useState(new Date().toISOString().split('T')[0])
  const [dataFinal, setDataFinal] = useState(new Date().toISOString().split('T')[0])
  const [mensagemPadrao, setMensagemPadrao] = useState("Feliz aniversário! 🎉")
  const [searchTerm, setSearchTerm] = useState("")

  // Função para buscar aniversariantes (1ª chamada)
  const coletarAniversariantes = async () => {
    setLoadingColeta(true)
    try {
      const response = await fetch('https://webhooks.grupotopmarketingzap.com.br/webhook/c77f9b60-9a4d-4ca2-8146-bedf4eebb7ca-aniversariantes-coleta-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnpj: "00184385000194",
          comando: "aniversariantes",
          data_inicial: dataInicial,
          data_final: dataFinal
        })
      })

      if (response.ok) {
        toast.success("Solicitação de coleta enviada com sucesso!")
        setTimeout(() => {
          buscarAniversariantesSupabase()
        }, 3000)
      } else {
        toast.error("Erro ao solicitar coleta de aniversariantes")
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error("Erro na comunicação com o webhook")
    } finally {
      setLoadingColeta(false)
    }
  }

  // Função para buscar aniversariantes do Supabase (após webhook processar)
  const buscarAniversariantesSupabase = async () => {
    try {
      // Aqui você fará a chamada para seu backend no Supabase
      // const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/aniversariantes?empresa_id=${empresaId}`)
      // const data = await response.json()
      // setAniversariantes(data)
      
      // Por enquanto, vou simular com dados mockados
      console.log("Buscando aniversariantes no Supabase para empresa:", empresaId)
    } catch (error) {
      console.error('Erro ao buscar aniversariantes:', error)
    }
  }

  // Função para enviar mensagens (2ª chamada)
  const enviarMensagens = async () => {
    setLoadingEnvio(true)
    try {
      const aniversariantesParaEnvio = aniversariantes.map(aniversariante => ({
        ...aniversariante,
        mensagem: aniversariante.mensagem || mensagemPadrao
      }))

      const response = await fetch('https://webhooks.grupotopmarketingzap.com.br/webhook/7791d206-c9c5-4683-9061-f2253252f744-aniversariantes-atualizados-dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cnpj: "00184385000194",
          comando: "mensagem_aniversariantes",
          aniversariantes: aniversariantesParaEnvio
        })
      })

      if (response.ok) {
        toast.success("Mensagens enviadas com sucesso!")
        setAniversariantes(prev => prev.map(a => ({ ...a, enviou_msg: true })))
      } else {
        toast.error("Erro ao enviar mensagens")
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error("Erro na comunicação com o webhook")
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

  // Filtrar aniversariantes por busca
  const aniversariantesFiltrados = aniversariantes.filter(a =>
    (a.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (a.celular?.includes(searchTerm) || false)
  )

  // Dados mockados para demonstração
  useEffect(() => {
    if (empresaId) {
      setAniversariantes([
        {
          id: 391,
          created_at: "2025-06-23 19:36:34.186016+00",
          codigo: "3713441",
          nome: "Adimilson Isaias de Oliveira",
          dataNascimento: "1984-06-06",
          telefone: null,
          celular: "66999117531",
          empresa_id: parseInt(empresaId),
          enviou_msg: false,
          mensagem: "Feliz aniversário! 🎉",
          whatsapp_msg: null
        },
        {
          id: 392,
          created_at: "2025-06-23 19:36:34.186016+00",
          codigo: "8178960",
          nome: "Aedson Alves Pereira",
          dataNascimento: "1963-06-06",
          telefone: null,
          celular: "66984095757",
          empresa_id: parseInt(empresaId),
          enviou_msg: false,
          mensagem: "Feliz aniversário! 🎉",
          whatsapp_msg: null
        }
      ])
    }
  }, [empresaId])

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
            <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Agora</div>
            <p className="text-xs text-muted-foreground">
              Dados sincronizados
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
              onClick={buscarAniversariantesSupabase}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar Lista
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
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => {
                  setAniversariantes(prev => 
                    prev.map(a => ({ ...a, mensagem: mensagemPadrao }))
                  )
                  toast.success("Mensagem padrão aplicada a todos!")
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
          <CardTitle>Lista de Aniversariantes</CardTitle>
          <CardDescription>
            Visualize e edite as mensagens individuais
          </CardDescription>
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
                      <Textarea
                        value={aniversariante.mensagem || ''}
                        onChange={(e) => atualizarMensagem(aniversariante.id, e.target.value)}
                        rows={2}
                        className="min-w-[200px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={aniversariante.enviou_msg === true}
                      >
                        {aniversariante.enviou_msg === true ? 'Enviado' : 'Enviar'}
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