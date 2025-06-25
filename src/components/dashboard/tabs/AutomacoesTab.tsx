"use client"

import { DashboardTab } from "../DashboardTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bot, Play, Pause, Settings } from "lucide-react"

interface AutomacoesTabProps {
  empresaChave: string
  isLoading?: boolean
}

export function AutomacoesTab({ empresaChave, isLoading }: AutomacoesTabProps) {
  const automacoes = [
    { id: 1, nome: "Email Marketing Semanal", status: "ativo", execucoes: 1250, tipo: "Email" },
    { id: 2, nome: "Follow-up Vendas", status: "ativo", execucoes: 892, tipo: "CRM" },
    { id: 3, nome: "Backup Diário", status: "pausado", execucoes: 0, tipo: "Sistema" },
    { id: 4, nome: "Relatório Mensal", status: "ativo", execucoes: 30, tipo: "Relatório" },
    { id: 5, nome: "Integração WhatsApp", status: "ativo", execucoes: 2450, tipo: "Messaging" },
  ]

  return (
    <DashboardTab 
      title="Automações" 
      description="Gerencie todas as automações da empresa"
      isLoading={isLoading}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Automações</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automacoes.length}</div>
            <p className="text-xs text-muted-foreground">
              {automacoes.filter(a => a.status === 'ativo').length} ativas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções Hoje</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.622</div>
            <p className="text-xs text-muted-foreground">
              +15% em relação a ontem
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.2%</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Automações</CardTitle>
          <CardDescription>
            Visualize e gerencie suas automações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Execuções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {automacoes.map((automacao) => (
                <TableRow key={automacao.id}>
                  <TableCell className="font-medium">{automacao.nome}</TableCell>
                  <TableCell>{automacao.tipo}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={automacao.status === 'ativo' ? 'default' : 'secondary'}
                    >
                      {automacao.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{automacao.execucoes.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardTab>
  )
} 