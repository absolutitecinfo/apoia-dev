import { createClient } from '@supabase/supabase-js'

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Não precisamos de autenticação persistente para este dashboard
  },
})

// Função para testar a conexão
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('empresas').select('id').limit(1)
    
    if (error) {
      console.error('Erro na conexão com Supabase:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Conexão com Supabase estabelecida com sucesso!')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao testar conexão:', error)
    return { success: false, error: 'Erro de conexão' }
  }
}

// Tipos específicos do banco
export type Database = {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: number
          created_at: string
          empresa: string | null
          cnpj: string | null
          contato: string | null
          whatsapp: string | null
          chave: string | null
          ativo: boolean | null
          patrono: boolean | null
          pacote: number | null
        }
        Insert: {
          id?: number
          created_at?: string
          empresa?: string | null
          cnpj?: string | null
          contato?: string | null
          whatsapp?: string | null
          chave?: string | null
          ativo?: boolean | null
          patrono?: boolean | null
          pacote?: number | null
        }
        Update: {
          id?: number
          created_at?: string
          empresa?: string | null
          cnpj?: string | null
          contato?: string | null
          whatsapp?: string | null
          chave?: string | null
          ativo?: boolean | null
          patrono?: boolean | null
          pacote?: number | null
        }
      }
      aniversariantes: {
        Row: {
          id: number
          created_at: string
          codigo: string | null
          nome: string | null
          dataNascimento: string | null
          telefone: string | null
          celular: string | null
          empresa_id: number | null
          enviou_msg: boolean | null
          mensagem: string | null
          whatsapp_msg: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          codigo?: string | null
          nome?: string | null
          dataNascimento?: string | null
          telefone?: string | null
          celular?: string | null
          empresa_id?: number | null
          enviou_msg?: boolean | null
          mensagem?: string | null
          whatsapp_msg?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          codigo?: string | null
          nome?: string | null
          dataNascimento?: string | null
          telefone?: string | null
          celular?: string | null
          empresa_id?: number | null
          enviou_msg?: boolean | null
          mensagem?: string | null
          whatsapp_msg?: string | null
        }
      }
      cobranca: {
        Row: {
          id: string
          empresa: string | null
          codigo: string | null
          nome: string | null
          telefone: string | null
          celular: string | null
          codcobranca: string | null
          vencimento: string | null
          valor: number | null
          parcela: number | null
          created_at: string
          empresa_id: number | null
          enviou: boolean | null
          mensagem: string | null
          whatsapp: string | null
        }
        Insert: {
          id?: string
          empresa?: string | null
          codigo?: string | null
          nome?: string | null
          telefone?: string | null
          celular?: string | null
          codcobranca?: string | null
          vencimento?: string | null
          valor?: number | null
          parcela?: number | null
          created_at?: string
          empresa_id?: number | null
          enviou?: boolean | null
          mensagem?: string | null
          whatsapp?: string | null
        }
        Update: {
          id?: string
          empresa?: string | null
          codigo?: string | null
          nome?: string | null
          telefone?: string | null
          celular?: string | null
          codcobranca?: string | null
          vencimento?: string | null
          valor?: number | null
          parcela?: number | null
          created_at?: string
          empresa_id?: number | null
          enviou?: boolean | null
          mensagem?: string | null
          whatsapp?: string | null
        }
      }
    }
    Views: {
      vw_pacote_detalhes_regras: {
        Row: {
          empresa_id: number | null
          nome_empresa: string | null
          cnpj: string | null
          chave: string | null
          pacote_id: number | null
          nome_pacote: string | null
          valor_pacote: number | null
          pacote_detalhe_id: number | null
          item_pacote: string | null
          pacote_detalhe_ativo: boolean | null
          regra_id: number | null
          regra_habilitada: boolean | null
          hr_inicial: string | null
          hr_final: string | null
          limite_repeticoes_dia: number | null
          limite_repeticoes_total: number | null
          nao_executar_apos_dias: number | null
          regra_criada_em: string | null
          detalhes_regras: any[] | null
        }
      }
    }
  }
} 