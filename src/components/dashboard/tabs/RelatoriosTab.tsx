"use client"

import { DashboardTab } from "../DashboardTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileBarChart, Download, Calendar, Filter } from "lucide-react"

interface RelatoriosTabProps {
  empresaId: string
  isLoading?: boolean
}

export function RelatoriosTab({ empresaId, isLoading }: RelatoriosTabProps) {
  const relatorios = [
    { nome: "Vendas Mensais", descricao: "Relatório completo de vendas", ultimaAtualizacao: "Hoje, 14:30" },
    { nome: "Performance de Automações", descricao: "Análise de eficiência", ultimaAtualizacao: "Ontem, 09:15" },
    { nome: "Clientes Ativos", descricao: "Lista de clientes engajados", ultimaAtualizacao: "2 dias atrás" },
    { nome: "ROI Marketing", descricao: "Retorno sobre investimento", ultimaAtualizacao: "1 semana atrás" },
  ]

  return (
    <DashboardTab 
      title="Relatórios" 
      description="Gere e baixe relatórios detalhados"
      isLoading={isLoading}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Gerados</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.847</div>
            <p className="text-xs text-muted-foreground">
              Total de downloads
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Disponíveis</CardTitle>
          <CardDescription>
            Clique para baixar ou visualizar os relatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {relatorios.map((relatorio, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{relatorio.nome}</h4>
                  <p className="text-sm text-muted-foreground">{relatorio.descricao}</p>
                  <p className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {relatorio.ultimaAtualizacao}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrar
                  </Button>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardTab>
  )
} 