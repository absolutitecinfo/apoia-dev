"use client"

import { DashboardTab } from "../DashboardTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign, Clock, AlertTriangle, CheckCircle, Search } from "lucide-react"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import { parseEmpresaId } from "@/lib/utils"
import type { Cobranca } from "@/lib/types"

interface CobrancasTabProps {
  empresaId: string
  isLoading?: boolean
}

export function CobrancasTab({ empresaId, isLoading }: CobrancasTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  
  // Buscar cobranças do Supabase
  useEffect(() => {
    const fetchCobrancas = async () => {
      const result = await api.getCobrancas(empresaId)
      if (result.success && result.data) {
        setCobrancas(result.data)
      }
    }
    
    if (empresaId) {
      fetchCobrancas()
    }
  }, [empresaId])
  
  // Dados mockados para demonstração enquanto não há dados reais
  useEffect(() => {
    if (empresaId && cobrancas.length === 0) {
      setCobrancas([
        {
          id: "1",
          empresa: "Empresa Test",
          codigo: "CLI001",
          nome: "João Silva",
          telefone: "1133334444",
          celular: "11999887766",
          codcobranca: "COB001",
          vencimento: "2024-01-15",
          valor: 1500.00,
          parcela: 1,
          created_at: new Date().toISOString(),
          empresa_id: parseEmpresaId(empresaId),
          enviou: false,
          mensagem: null,
          whatsapp: null
        },
        {
          id: "2",
          empresa: "Empresa Test",
          codigo: "CLI002",
          nome: "Maria Santos",
          telefone: "1133334455",
          celular: "11998776655",
          codcobranca: "COB002",
          vencimento: "2024-01-20",
          valor: 2300.50,
          parcela: 1,
          created_at: new Date().toISOString(),
          empresa_id: parseEmpresaId(empresaId),
          enviou: false,
          mensagem: null,
          whatsapp: null
        },
        {
          id: "3",
          empresa: "Empresa Test",
          codigo: "CLI003",
          nome: "Pedro Costa",
          telefone: "1133334466",
          celular: "11997665544",
          codcobranca: "COB003",
          vencimento: "2024-01-10",
          valor: 850.00,
          parcela: 1,
          created_at: new Date().toISOString(),
          empresa_id: parseEmpresaId(empresaId),
          enviou: true,
          mensagem: "Cobrança enviada",
          whatsapp: null
        }
      ])
    }
  }, [empresaId, cobrancas.length])

  const cobrancasFiltradas = cobrancas.filter(c =>
    (c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (c.celular?.includes(searchTerm) || false)
  )

  // Função para determinar status baseado no vencimento e envio
  const getStatus = (cobranca: Cobranca) => {
    if (cobranca.enviou === true) return 'paga'
    if (cobranca.vencimento && new Date(cobranca.vencimento) < new Date()) return 'vencida'
    return 'pendente'
  }

  const totalPendente = cobrancas.filter(c => getStatus(c) === 'pendente').reduce((acc, c) => acc + (c.valor || 0), 0)
  const totalVencido = cobrancas.filter(c => getStatus(c) === 'vencida').reduce((acc, c) => acc + (c.valor || 0), 0)
  const totalPago = cobrancas.filter(c => getStatus(c) === 'paga').reduce((acc, c) => acc + (c.valor || 0), 0)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paga': return 'default'
      case 'vencida': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paga': return 'Paga'
      case 'vencida': return 'Vencida'
      default: return 'Pendente'
    }
  }

  return (
    <DashboardTab 
      title="Cobranças" 
      description="Gerencie cobranças e acompanhe recebimentos"
      isLoading={isLoading}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {cobrancas.filter(c => getStatus(c) === 'pendente').length} cobranças
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vencido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {cobrancas.filter(c => getStatus(c) === 'vencida').length} cobranças
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              {cobrancas.filter(c => getStatus(c) === 'paga').length} cobranças
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Recebimento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cobrancas.length > 0 ? Math.round((cobrancas.filter(c => getStatus(c) === 'paga').length / cobrancas.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Este período
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Envie lembretes e gerencie cobranças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Enviar Lembrete Vencidos
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Lembrete Próximo Vencimento
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cobranças</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as cobranças
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou telefone..."
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
                  <TableHead>Status</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cobrancasFiltradas.map((cobranca) => {
                  const status = getStatus(cobranca)
                  const diasAtraso = cobranca.vencimento && status === 'vencida' 
                    ? Math.floor((new Date().getTime() - new Date(cobranca.vencimento).getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                  
                  return (
                    <TableRow key={cobranca.id}>
                      <TableCell className="font-medium">{cobranca.nome || '-'}</TableCell>
                      <TableCell>
                        R$ {(cobranca.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {cobranca.vencimento ? new Date(cobranca.vencimento).toLocaleDateString('pt-BR') : '-'}
                        {diasAtraso > 0 && (
                          <span className="text-red-600 text-xs block">
                            {diasAtraso} dias de atraso
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(status)}>
                          {getStatusLabel(status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{cobranca.celular || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Lembrete
                          </Button>
                          {status !== 'paga' && (
                            <Button size="sm">
                              Marcar Pago
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhuma cobrança encontrada</p>
              <p className="text-muted-foreground">
                {cobrancas.length === 0 
                  ? "Não há cobranças para exibir" 
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