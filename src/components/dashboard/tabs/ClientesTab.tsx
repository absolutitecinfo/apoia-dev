"use client"

import { DashboardTab } from "../DashboardTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, UserCheck, UserX, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ClientesTabProps {
  empresaId: string
  isLoading?: boolean
}

export function ClientesTab({ empresaId, isLoading }: ClientesTabProps) {
  const clientes = [
    { id: 1, nome: "João Silva", email: "joao@email.com", status: "ativo", ultimaCompra: "2024-01-15" },
    { id: 2, nome: "Maria Santos", email: "maria@email.com", status: "ativo", ultimaCompra: "2024-01-14" },
    { id: 3, nome: "Pedro Costa", email: "pedro@email.com", status: "inativo", ultimaCompra: "2023-12-20" },
    { id: 4, nome: "Ana Oliveira", email: "ana@email.com", status: "ativo", ultimaCompra: "2024-01-16" },
    { id: 5, nome: "Carlos Souza", email: "carlos@email.com", status: "pendente", ultimaCompra: "2024-01-10" },
  ]

  return (
    <DashboardTab 
      title="Clientes" 
      description="Gerencie sua base de clientes"
      isLoading={isLoading}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientes.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% este mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clientes.filter(c => c.status === 'ativo').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((clientes.filter(c => c.status === 'ativo').length / clientes.length) * 100)}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              Esta semana
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Visualize e gerencie seus clientes
          </CardDescription>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Última Compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>{cliente.email}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        cliente.status === 'ativo' ? 'default' : 
                        cliente.status === 'inativo' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {cliente.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(cliente.ultimaCompra).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardTab>
  )
} 