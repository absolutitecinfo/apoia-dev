"use client"

import { DashboardTab } from "../DashboardTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Database, Webhook, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { api } from "@/lib/api"
import type { Empresa, VwPacoteDetalhesRegras } from "@/lib/types"

interface SetupTabProps {
  empresaId: string
  isLoading?: boolean
}

export function SetupTab({ empresaId, isLoading }: SetupTabProps) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [configuracoes, setConfiguracoes] = useState<VwPacoteDetalhesRegras[]>([])
  
  // Buscar dados da empresa
  useEffect(() => {
    const fetchEmpresaData = async () => {
      const empresaResult = await api.getEmpresaData(empresaId)
      if (empresaResult.success && empresaResult.data) {
        setEmpresa(empresaResult.data)
      }
      
      const configResult = await api.getEmpresaConfiguracoes(empresaId)
      if (configResult.success && configResult.data) {
        setConfiguracoes(configResult.data)
      }
    }
    
    if (empresaId) {
      fetchEmpresaData()
    }
  }, [empresaId])
  
  return (
    <DashboardTab 
      title="Setup" 
      description={`Configurações iniciais da empresa ID: ${empresaId}`}
      isLoading={isLoading}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status da Empresa</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ativo</div>
            <p className="text-xs text-muted-foreground">
              Configuração completa
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Endpoints configurados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrações</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Serviços conectados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">OK</div>
            <p className="text-xs text-muted-foreground">
              Última verificação: 2min
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Empresa</CardTitle>
            <CardDescription>
              Dados básicos e identificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input 
                id="cnpj" 
                placeholder="00.000.000/0000-00" 
                defaultValue={empresa?.cnpj || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa-nome">Nome da Empresa</Label>
              <Input 
                id="empresa-nome" 
                placeholder="Nome da empresa"
                defaultValue={empresa?.empresa || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa-contato">Contato Principal</Label>
              <Input 
                id="empresa-contato" 
                placeholder="Contato da empresa"
                defaultValue={empresa?.contato || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa-whatsapp">WhatsApp</Label>
              <Input 
                id="empresa-whatsapp" 
                placeholder="WhatsApp da empresa"
                defaultValue={empresa?.whatsapp || ""}
              />
            </div>
            <Button className="w-full">Salvar Configurações</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhooks Configurados</CardTitle>
            <CardDescription>
              Endpoints para automações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Aniversariantes - Coleta</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-mono text-muted-foreground">
                    .../c77f9b60-9a4d-4ca2-8146-bedf4eebb7ca
                  </p>
                  <p className="text-xs text-green-600">Ativo</p>
                </div>
                <Button variant="outline" size="sm">Testar</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Aniversariantes - Envio</Label>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm font-mono text-muted-foreground">
                    .../7791d206-c9c5-4683-9061-f2253252f744
                  </p>
                  <p className="text-xs text-green-600">Ativo</p>
                </div>
                <Button variant="outline" size="sm">Testar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardTab>
  )
} 