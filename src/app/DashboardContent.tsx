"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2 } from "lucide-react"

// Importando as abas
import { AniversariantesTab } from "@/components/dashboard/tabs/AniversariantesTab"
import { CobrancasTab } from "@/components/dashboard/tabs/CobrancasTab"

// Chave UUID padrão da empresa (fallback)
const EMPRESA_CHAVE_PADRAO = "14915148-1496-4762-880c-d925aecb9702"

export default function DashboardContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [empresaChave, setEmpresaChave] = useState<string>(EMPRESA_CHAVE_PADRAO)

  const searchParams = useSearchParams()

  // Efeito para ler parâmetro da URL
  useEffect(() => {
    const chaveUrl = searchParams.get('chave')
    if (chaveUrl) {
      console.log('🔗 Chave encontrada na URL:', chaveUrl)
      setEmpresaChave(chaveUrl)
    } else {
      console.log('🔗 Usando chave padrão:', EMPRESA_CHAVE_PADRAO)
      setEmpresaChave(EMPRESA_CHAVE_PADRAO)
    }
  }, [searchParams])



  useEffect(() => {
    console.log('🏢 Carregando dashboard para empresa chave:', empresaChave)
    
    // Carregamento mais rápido - dados já estão no Supabase
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }, [empresaChave])

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
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Informações da empresa atual */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Empresa: {empresaChave.substring(0, 8)}...
                </span>
              </div>
              
              {/* Status do sistema */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {isLoading ? "Carregando..." : "Sistema Online"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="aniversariantes" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="aniversariantes">🎉 Aniversariantes</TabsTrigger>
            <TabsTrigger value="cobrancas">💰 Cobranças</TabsTrigger>
          </TabsList>

          <TabsContent value="aniversariantes">
            <AniversariantesTab empresaChave={empresaChave} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="cobrancas">
            <CobrancasTab empresaChave={empresaChave} isLoading={isLoading} />
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