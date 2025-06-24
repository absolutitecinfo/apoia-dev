"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AniversariantesTab } from "@/components/dashboard/tabs/AniversariantesTab"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"

export default function TestAniversariantesPage() {
  const searchParams = useSearchParams()
  const [empresaId, setEmpresaId] = useState<string>("7") // Padrão = 7
  const [empresaIdAtivo, setEmpresaIdAtivo] = useState<string>("7") // Padrão = 7
  const [empresasComDados, setEmpresasComDados] = useState<number[]>([])
  const [loadingDeteccao, setLoadingDeteccao] = useState(false)

  useEffect(() => {
    // Verifica se há empresa_id na URL, senão usa 7 como padrão
    const urlEmpresaId = searchParams.get('empresa_id')
    if (urlEmpresaId) {
      setEmpresaId(urlEmpresaId)
      setEmpresaIdAtivo(urlEmpresaId)
    } else {
      // Se não há parâmetro na URL, define como 7
      setEmpresaId("7")
      setEmpresaIdAtivo("7")
    }
  }, [searchParams])

  const aplicarEmpresaId = () => {
    if (empresaId.trim()) {
      setEmpresaIdAtivo(empresaId.trim())
      // Atualiza a URL sem recarregar a página
      const url = new URL(window.location.href)
      url.searchParams.set('empresa_id', empresaId.trim())
      window.history.pushState({}, '', url.toString())
    }
  }

  const detectarEmpresasComDados = async () => {
    setLoadingDeteccao(true)
    try {
      const { data, error } = await supabase
        .from('aniversariantes')
        .select('empresa_id')
      
      if (data && !error) {
        const empresasUnicas = [...new Set(data.map(item => item.empresa_id))].filter(Boolean)
        setEmpresasComDados(empresasUnicas as number[])
        console.log('🏢 Empresas com dados:', empresasUnicas)
        
        // Se existe apenas uma empresa com dados, usar ela automaticamente
        if (empresasUnicas.length === 1) {
          const empresaDetectada = empresasUnicas[0].toString()
          setEmpresaId(empresaDetectada)
          setEmpresaIdAtivo(empresaDetectada)
          const url = new URL(window.location.href)
          url.searchParams.set('empresa_id', empresaDetectada)
          window.history.pushState({}, '', url.toString())
        }
      }
    } catch (error) {
      console.error('Erro ao detectar empresas:', error)
    } finally {
      setLoadingDeteccao(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard - Sistema de Automações</h1>
        <div className="text-sm text-muted-foreground">
          Empresa ID: <span className="font-mono font-bold">{empresaIdAtivo}</span>
        </div>
      </div>

      {/* Configuração rápida do empresa_id */}
      <Card>
        <CardContent className="py-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label htmlFor="empresa-id" className="text-sm">Empresa ID:</Label>
              <Input
                id="empresa-id"
                placeholder="Digite o ID da empresa"
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && aplicarEmpresaId()}
                className="mt-1"
              />
            </div>
            <Button onClick={aplicarEmpresaId} disabled={!empresaId.trim()}>
              Aplicar
            </Button>
            <Button 
              onClick={detectarEmpresasComDados} 
              disabled={loadingDeteccao}
              variant="secondary"
            >
              {loadingDeteccao ? "Detectando..." : "🔍 Auto-Detectar"}
            </Button>
            <div className="flex gap-1">
              {[7, 1, 2, 3, 999].map(id => (
                <Button
                  key={id}
                  variant={empresaIdAtivo === id.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setEmpresaId(id.toString())
                    setEmpresaIdAtivo(id.toString())
                    const url = new URL(window.location.href)
                    url.searchParams.set('empresa_id', id.toString())
                    window.history.pushState({}, '', url.toString())
                  }}
                  className={empresasComDados.includes(id) ? "ring-2 ring-green-500" : ""}
                >
                  {id} {empresasComDados.includes(id) && "✓"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principais */}
      <Tabs defaultValue="aniversariantes" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="aniversariantes">Aniversariantes</TabsTrigger>
          <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
          <TabsTrigger value="automacoes">Automações</TabsTrigger>
          <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="aniversariantes" className="mt-6">
          <AniversariantesTab 
            empresaId={empresaIdAtivo} 
            isLoading={false}
          />
        </TabsContent>

        <TabsContent value="cobrancas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cobranças</CardTitle>
              <CardDescription>
                Sistema de gestão de cobranças e lembretes - Em desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta funcionalidade será implementada em breve. Por enquanto, teste o sistema de aniversariantes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automacoes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Automações</CardTitle>
              <CardDescription>
                Regras e configurações de automação - Em desenvolvimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Esta funcionalidade será implementada em breve. Por enquanto, teste o sistema de aniversariantes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracoes" className="mt-6">
          <div className="space-y-6">
            {/* Cards de métricas */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status da Empresa</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Ativo</div>
                  <p className="text-xs text-muted-foreground">
                    Empresa ID: {empresaIdAtivo}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2</div>
                  <p className="text-xs text-muted-foreground">
                    Aniversariantes configurados
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CNPJ</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-blue-600">00184385000194</div>
                  <p className="text-xs text-muted-foreground">
                    CNPJ de teste
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">API Status</CardTitle>
                  <div className="h-4 w-4 rounded-full bg-green-500"></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">OK</div>
                  <p className="text-xs text-muted-foreground">
                    Supabase conectado
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Informações da empresa */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Empresa</CardTitle>
                <CardDescription>
                  Configurações e dados da empresa de teste
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">ID da Empresa</Label>
                      <p className="text-lg font-mono">{empresaIdAtivo}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">CNPJ</Label>
                      <p className="text-sm">00.184.385/0001-94</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Ambiente</Label>
                      <p className="text-sm">Desenvolvimento/Teste</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Porta do Servidor</Label>
                      <p className="text-sm">3001 (3000 estava ocupada)</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Base de Dados</Label>
                      <p className="text-sm">Supabase PostgreSQL</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Modo</Label>
                      <p className="text-sm">Client-side (Next.js 15)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Webhooks configurados */}
            <Card>
              <CardHeader>
                <CardTitle>Webhooks Configurados</CardTitle>
                <CardDescription>
                  Endpoints para automações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Aniversariantes - Coleta</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          .../c77f9b60-9a4d-4ca2-8146-bedf4eebb7ca-aniversariantes-coleta-dashboard
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-green-600">Ativo</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Aniversariantes - Envio</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          .../7791d206-c9c5-4683-9061-f2253252f744-aniversariantes-atualizados-dashboard
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-sm text-green-600">Ativo</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Cobranças - Coleta</p>
                        <p className="text-sm text-muted-foreground">
                          Webhook ainda não configurado
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        <span className="text-sm text-orange-600">Pendente</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Cobranças - Envio</p>
                        <p className="text-sm text-muted-foreground">
                          Webhook ainda não configurado
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        <span className="text-sm text-orange-600">Pendente</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 