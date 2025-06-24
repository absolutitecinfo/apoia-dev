"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"

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
      // Aqui você faria as chamadas de API usando o empresa_id
      console.log('Carregando dados para empresa ID:', id)
      
      // Simulando carregamento de dados
      setTimeout(() => {
        setIsLoading(false)
      }, 1500)
    } else {
      setEmpresaId("demo")
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
                  Empresa ID: {empresaId}
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {isLoading ? "Carregando..." : "Dados atualizados"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="aniversariantes">Aniversariantes</TabsTrigger>
            <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
            <TabsTrigger value="automacoes">Automações</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
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
