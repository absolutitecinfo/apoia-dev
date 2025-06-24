"use client"

import { DashboardTab } from "../DashboardTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, CreditCard, PiggyBank, TrendingUp } from "lucide-react"

interface FinanceiroTabProps {
  empresaId: string
  isLoading?: boolean
}

export function FinanceiroTab({ empresaId, isLoading }: FinanceiroTabProps) {
  const transacoes = [
    { id: 1, descricao: "Venda - Produto A", valor: 299.90, tipo: "receita", data: "2024-01-16" },
    { id: 2, descricao: "Assinatura Software", valor: -89.90, tipo: "despesa", data: "2024-01-15" },
    { id: 3, descricao: "Venda - Serviço B", valor: 150.00, tipo: "receita", data: "2024-01-15" },
    { id: 4, descricao: "Taxa de Processamento", valor: -12.50, tipo: "despesa", data: "2024-01-14" },
    { id: 5, descricao: "Venda - Produto C", valor: 450.00, tipo: "receita", data: "2024-01-14" },
  ]

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0)
  const totalDespesas = Math.abs(transacoes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0))
  const saldoLiquido = totalReceitas - totalDespesas

  return (
    <DashboardTab 
      title="Financeiro" 
      description="Acompanhe suas receitas e despesas"
      isLoading={isLoading}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              -5.2% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              Lucro do período
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((saldoLiquido / totalReceitas) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Meta: 25%
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Últimas movimentações financeiras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transacoes.map((transacao) => (
              <div key={transacao.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">{transacao.descricao}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transacao.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className={`font-bold ${transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                  {transacao.tipo === 'receita' ? '+' : ''}R$ {Math.abs(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardTab>
  )
} 