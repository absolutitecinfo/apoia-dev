"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Settings } from "lucide-react"

// Importando as abas
import { SetupTab } from "@/components/dashboard/tabs/SetupTab"
import { AniversariantesTab } from "@/components/dashboard/tabs/AniversariantesTab"
import { CobrancasTab } from "@/components/dashboard/tabs/CobrancasTab"
import { AutomacoesTab } from "@/components/dashboard/tabs/AutomacoesTab"
import { RelatoriosTab } from "@/components/dashboard/tabs/RelatoriosTab"
import { ConfiguracoesTab } from "@/components/dashboard/tabs/ConfiguracoesTab"

export default function Dashboard() {
  const searchParams = useSearchParams()
  const [empresaId, setEmpresaId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const id = searchParams.get('empresa_id')
    if (id) {
      setEmpresaId(id)
      console.log('🏢 Carregando dados para empresa ID:', id)
      
      // Carregamento mais rápido - dados já estão no Supabase
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    } else {
      // Se não tem empresa_id na URL, tenta detectar automaticamente
      console.log('🔍 Empresa ID não fornecido, usando empresa padrão 999')
      setEmpresaId("999") // Mudando para 999 que é onde provavelmente estão os dados
      setIsLoading(false)
    }
  }, [searchParams])

  if (!empresaId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-blue-600" />
            <CardTitle>Dashboard Top Automações</CardTitle>
            <CardDescription>
              Parâmetro empresa_id não encontrado na URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Acesse com: <code className="bg-gray-100 px-2 py-1 rounded">?empresa_id=123</code>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold">Dashboard Top Automações</h1>
                <p className="text-sm text-muted-foreground">
                  Empresa ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{empresaId}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {isLoading ? "Carregando..." : "Sistema Online"}
                </span>
              </div>
              
              <div className="flex gap-1">
                {["999", "7", "1", "2"].map(id => (
                  <Button
                    key={id}
                    size="sm"
                    variant={empresaId === id ? "default" : "outline"}
                    onClick={() => {
                      const url = new URL(window.location.href)
                      url.searchParams.set('empresa_id', id)
                      window.location.href = url.toString()
                    }}
                    className="text-xs"
                  >
                    {id}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="aniversariantes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="aniversariantes">🎉 Aniversariantes</TabsTrigger>
            <TabsTrigger value="cobrancas">💰 Cobranças</TabsTrigger>
            <TabsTrigger value="automacoes">⚡ Automações</TabsTrigger>
            <TabsTrigger value="relatorios">📊 Relatórios</TabsTrigger>
            <TabsTrigger value="configuracoes">⚙️ Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="setup">
            <SetupTab empresaId={empresaId} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="aniversariantes">
            <AniversariantesTab empresaId={empresaId} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="cobrancas">
            <CobrancasTab empresaId={empresaId} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="automacoes">
            <AutomacoesTab empresaId={empresaId} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="relatorios">
            <RelatoriosTab empresaId={empresaId} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="configuracoes">
            <ConfiguracoesTab empresaId={empresaId} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer para embedding */}
      <footer className="bg-white border-t py-4 mt-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            Dashboard Top Automações - Powered by Next.js
          </p>
        </div>
      </footer>
    </div>
  )
}
