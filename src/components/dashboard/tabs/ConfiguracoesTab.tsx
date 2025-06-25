"use client"

import { DashboardTab } from "../DashboardTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Bell, Shield, Database, Wifi } from "lucide-react"

interface ConfiguracoesTabProps {
  empresaChave: string
  isLoading?: boolean
}

export function ConfiguracoesTab({ empresaChave, isLoading }: ConfiguracoesTabProps) {
  return (
    <DashboardTab 
      title="Configurações" 
      description="Configure suas preferências e integrações"
      isLoading={isLoading}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Gerais
            </CardTitle>
            <CardDescription>
              Configurações básicas da empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="empresa-nome">Nome da Empresa</Label>
              <Input id="empresa-nome" placeholder="Top Automações Ltda" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa-email">Email de Contato</Label>
              <Input id="empresa-email" type="email" placeholder="contato@topautomacoes.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa-telefone">Telefone</Label>
              <Input id="empresa-telefone" placeholder="(11) 99999-9999" />
            </div>
            <Button className="w-full">Salvar Alterações</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure suas preferências de notificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Email de Vendas</Label>
                <p className="text-sm text-muted-foreground">Receber notificações de novas vendas</p>
              </div>
              <Button variant="outline" size="sm">Ativo</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Relatórios Semanais</Label>
                <p className="text-sm text-muted-foreground">Resumo semanal por email</p>
              </div>
              <Button variant="outline" size="sm">Ativo</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Alertas de Sistema</Label>
                <p className="text-sm text-muted-foreground">Notificações de problemas técnicos</p>
              </div>
              <Button variant="outline" size="sm">Inativo</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Integrações
            </CardTitle>
            <CardDescription>
              Conecte com outros serviços
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">WhatsApp Business</p>
                <p className="text-sm text-muted-foreground">Conectado</p>
              </div>
              <Button variant="outline" size="sm">Configurar</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Google Analytics</p>
                <p className="text-sm text-muted-foreground">Desconectado</p>
              </div>
              <Button size="sm">Conectar</Button>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Zapier</p>
                <p className="text-sm text-muted-foreground">Conectado</p>
              </div>
              <Button variant="outline" size="sm">Configurar</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de segurança da conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Autenticação de Dois Fatores</Label>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                <Button variant="outline" size="sm">Ativar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alterar Senha</Label>
              <Button variant="outline" className="w-full">Alterar Senha</Button>
            </div>
            <div className="space-y-2">
              <Label>Logs de Acesso</Label>
              <Button variant="outline" className="w-full">Ver Histórico</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            API e Webhooks
          </CardTitle>
          <CardDescription>
            Configure integrações personalizadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">Chave da API</Label>
            <div className="flex gap-2">
              <Input 
                id="api-key" 
                value="sk-1234567890abcdef..." 
                readOnly 
                className="font-mono text-sm"
              />
              <Button variant="outline">Regenerar</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL do Webhook</Label>
            <Input 
              id="webhook-url" 
              placeholder="https://seu-site.com/webhook"
            />
          </div>
          <Button>Testar Webhook</Button>
        </CardContent>
      </Card>
    </DashboardTab>
  )
} 