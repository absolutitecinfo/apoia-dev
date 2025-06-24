"use client"

import { DashboardTab } from "../DashboardTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react"

interface OverviewTabProps {
  empresaId: string
  isLoading?: boolean
}

export function OverviewTab({ empresaId, isLoading }: OverviewTabProps) {
  // Aqui você fará as chamadas de API usando o empresaId
  
  return (
    <DashboardTab 
      title="Visão Geral" 
      description={`Dashboard da empresa ID: ${empresaId}`}
      isLoading={isLoading}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 45.231</div>
            <p className="text-xs text-muted-foreground">
              +20.1% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2.350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5%</div>
            <p className="text-xs text-muted-foreground">
              +19% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automações Ativas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">573</div>
            <p className="text-xs text-muted-foreground">
              +201 desde a semana passada
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Empresa</CardTitle>
          <CardDescription>
            Principais métricas e informações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-sm text-green-600">Ativo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Plano:</span>
              <span className="text-sm">Premium</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Última atualização:</span>
              <span className="text-sm text-muted-foreground">2 minutos atrás</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardTab>
  )
} 