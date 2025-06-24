"use client"

import { useState } from 'react'
import { testSupabaseConnection } from '@/lib/supabase'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function TestConnectionPage() {
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [apiResult, setApiResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    setConnectionResult(null)
    setApiResult(null)

    try {
      // Teste de conexão básica
      const connResult = await testSupabaseConnection()
      setConnectionResult(connResult)

      if (connResult.success) {
        // Teste das APIs
        const empresaResult = await api.getEmpresaData('1')
        setApiResult(empresaResult)
      }
    } catch (error) {
      console.error('Erro no teste:', error)
      setConnectionResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Teste de Conexão</h1>
          <p className="text-muted-foreground mt-2">
            Verifique se a conexão com o Supabase está funcionando
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuração do Environment</CardTitle>
            <CardDescription>
              Verifique se as variáveis de ambiente estão configuradas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL</span>
                <span className={`text-sm ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}`}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configurado' : '✗ Não configurado'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 border rounded">
                <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                <span className={`text-sm ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}`}>
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Configurado' : '✗ Não configurado'}
                </span>
              </div>
            </div>

            <Button 
              onClick={testConnection} 
              disabled={loading || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando Conexão...
                </>
              ) : (
                'Testar Conexão'
              )}
            </Button>
          </CardContent>
        </Card>

        {connectionResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {connectionResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Resultado da Conexão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {connectionResult.success ? (
                <div className="text-green-600">
                  ✅ Conexão com Supabase estabelecida com sucesso!
                </div>
              ) : (
                <div className="text-red-600">
                  ❌ Erro na conexão: {connectionResult.error}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {apiResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {apiResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Teste da API
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apiResult.success ? (
                <div>
                  <div className="text-green-600 mb-2">
                    ✅ API funcionando corretamente!
                  </div>
                  {apiResult.data && (
                    <div className="bg-gray-100 p-3 rounded text-sm">
                      <strong>Dados da empresa (ID: 1):</strong>
                      <pre>{JSON.stringify(apiResult.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-600">
                  ❌ Erro na API: {apiResult.error}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Instruções de Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Crie o arquivo .env.local</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Copie o arquivo env.example para .env.local e configure as variáveis:
              </p>
              <code className="block bg-gray-100 p-2 rounded text-sm">
                cp env.example .env.local
              </code>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Configure as variáveis do Supabase</h3>
              <p className="text-sm text-muted-foreground">
                No seu projeto Supabase, vá em Settings → API e copie:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside mt-2">
                <li>Project URL → NEXT_PUBLIC_SUPABASE_URL</li>
                <li>Public anon key → NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Teste a conexão</h3>
              <p className="text-sm text-muted-foreground">
                Clique no botão "Testar Conexão" acima para verificar se tudo está funcionando.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/?empresa_id=1'}
          >
            ← Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
} 