# Dashboard Top Automações

Dashboard interativo para gerenciamento de automações de chat bot, desenvolvido em Next.js com integração completa ao Supabase.

## 📋 Sobre o Projeto

Este dashboard foi desenvolvido para permitir o envio manual de campanhas de automação (aniversários e cobranças) através de uma interface web moderna e responsiva. O sistema funciona como um SaaS onde cada empresa cliente tem acesso às suas próprias automações através de um `empresa_id` único.

## 🏗️ Arquitetura do Sistema

### Fluxo de Dados
1. **Coleta de Dados**: Dashboard solicita dados via webhook
2. **Processamento**: Edge Function processa e armazena no Supabase  
3. **Visualização**: Dashboard exibe dados para revisão
4. **Envio**: Usuário confirma e envia mensagens via segundo webhook
5. **Histórico**: Sistema marca como enviado para controle

### Estrutura do Banco (Supabase)

#### Tabelas Principais
- **`empresas`**: Dados das empresas clientes
- **`aniversariantes`**: Lista de aniversariantes para envio
- **`cobranca`**: Lista de cobranças para envio
- **`pacotes`**: Planos contratados pelas empresas
- **`regras`**: Configurações de automação por empresa

#### Tabelas de Configuração
- **`pacote_detalhes`**: Itens inclusos em cada plano
- **`regras_detalhes`**: Detalhes das regras de automação
- **`vw_pacote_detalhes_regras`**: View consolidada de configurações

## 🚀 Funcionalidades Implementadas

### 📊 Dashboard Principal
- Interface responsiva otimizada para embedding
- Sistema de abas para diferentes funcionalidades
- Métricas em tempo real
- Suporte a múltiplas empresas via URL parameter

### 🎂 Aba Aniversariantes
- **Coleta de Dados**: Webhook para buscar aniversariantes por período
- **Visualização**: Lista com dados pessoais e datas
- **Personalização**: Mensagem padrão + edição individual
- **Envio**: Webhook para disparar mensagens via WhatsApp
- **Controle**: Status de envio e histórico

### 💰 Aba Cobranças  
- **Gestão Completa**: Visualização de cobranças pendentes/vencidas
- **Métricas**: Valores totais, taxa de recebimento
- **Status Inteligente**: Baseado em vencimento e envio
- **Ações**: Lembretes e controle de pagamentos

### ⚙️ Aba Setup
- **Dados da Empresa**: CNPJ, nome, contatos
- **Status dos Webhooks**: Monitoramento de endpoints
- **Configurações**: Integração com dados do Supabase

### 🔧 Outras Abas
- **Automações**: Gerenciamento de regras automáticas
- **Relatórios**: Geração de relatórios de performance  
- **Configurações**: Ajustes gerais do sistema

## 🔗 Integração com Webhooks

### Aniversariantes
```javascript
// 1ª Chamada - Coleta
POST https://webhooks.grupotopmarketingzap.com.br/webhook/c77f9b60-9a4d-4ca2-8146-bedf4eebb7ca-aniversariantes-coleta-dashboard
{
  "cnpj": "00184385000194",
  "comando": "aniversariantes", 
  "data_inicial": "2024-01-01",
  "data_final": "2024-01-31"
}

// 2ª Chamada - Envio
POST https://webhooks.grupotopmarketingzap.com.br/webhook/7791d206-c9c5-4683-9061-f2253252f744-aniversariantes-atualizados-dashboard
{
  "cnpj": "00184385000194",
  "comando": "mensagem_aniversariantes",
  "aniversariantes": [...]
}
```

### Cobranças
```javascript
// APIs de cobrança serão fornecidas posteriormente
```

## 💻 Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript
- **UI**: Tailwind CSS, Radix UI, Shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Integração**: Webhooks REST
- **Deploy**: Vercel (recomendado)

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_supabase
```

### Instalação
```bash
npm install
npm run dev
```

## 📱 Como Usar

### Embedding via iframe
```html
<iframe 
  src="https://seu-dashboard.vercel.app/?empresa_id=123"
  width="100%" 
  height="800px"
  frameborder="0">
</iframe>
```

### Acesso Direto
```
https://seu-dashboard.vercel.app/?empresa_id=123
```

## 🔄 Fluxo de Trabalho

### Para Aniversariantes:
1. Acesse a aba "Aniversariantes"
2. Defina o período desejado
3. Clique em "Coletar Aniversariantes" 
4. Aguarde processamento (3s)
5. Revise a lista e personalize mensagens
6. Clique em "Enviar Mensagens"
7. Acompanhe o status de envio

### Para Cobranças:
1. Acesse a aba "Cobranças"
2. Visualize cobranças pendentes/vencidas
3. Use ações rápidas para lembretes
4. Marque como pago quando necessário

## 📊 Estrutura de Dados

### Interface Aniversariante
```typescript
interface Aniversariante {
  id: number
  codigo: string | null
  nome: string | null
  dataNascimento: string | null
  celular: string | null
  empresa_id: number | null
  enviou_msg: boolean | null
  mensagem: string | null
}
```

### Interface Cobrança
```typescript
interface Cobranca {
  id: string // UUID
  nome: string | null
  valor: number | null
  vencimento: string | null
  empresa_id: number | null
  enviou: boolean | null
  mensagem: string | null
}
```

## 🎯 Próximos Passos

1. **Implementar APIs de Cobranças**: Webhooks para coleta e envio
2. **Melhorar Relatórios**: Gráficos e análises avançadas
3. **Notificações**: Sistema de alertas em tempo real
4. **Bulk Actions**: Ações em lote para múltiplos registros
5. **Histórico Completo**: Log de todas as ações realizadas

## 🤝 Suporte

Para dúvidas ou suporte técnico, entre em contato com a equipe de desenvolvimento.

---

**Dashboard Top Automações** - Desenvolvido para otimizar o gerenciamento de campanhas de automação via WhatsApp.
