# 🎉 Teste do Sistema de Aniversariantes

## Configuração Inicial

### 1. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com:

```env
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://bslsxolmfzrvprghxfrr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzbHN4b2xtZnpydnByZ2h4ZnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NTU1NTAsImV4cCI6MjA2MzQzMTU1MH0.63l29DtGoAXzq1zc79fHE4_GO68WINHnRr_spUFqtmQ

# WEBHOOKS ANIVERSARIANTES
WEBHOOK_ANIVERSARIANTES_COLETA=https://webhooks.grupotopmarketingzap.com.br/webhook/c77f9b60-9a4d-4ca2-8146-bedf4eebb7ca-aniversariantes-coleta-dashboard
WEBHOOK_ANIVERSARIANTES_ENVIO=https://webhooks.grupotopmarketingzap.com.br/webhook/7791d206-c9c5-4683-9061-f2253252f744-aniversariantes-atualizados-dashboard
```

### 2. Executar o Projeto
```bash
npm run dev
```

### 3. Acessar a Página de Teste

#### URL Principal (Padrão Empresa ID = 7)
- URL: `http://localhost:3001/test-aniversariantes`
- **Empresa ID padrão**: 7 (usado automaticamente se não especificado)
- **Interface com abas**: Aniversariantes, Cobranças, Automações, Configurações

#### Com Empresa ID Específico
- URL: `http://localhost:3001/test-aniversariantes?empresa_id=1`
- Substitua `1` pelo ID desejado
- Use os botões numéricos (7, 1, 2, 3) para troca rápida

## 🔄 Fluxo de Teste

### Passo 1: Coleta de Aniversariantes
1. **Defina o período**: Configure as datas inicial e final
2. **Clique em "Coletar Aniversariantes"**: Isso enviará uma requisição para o webhook de coleta
3. **Aguarde o processamento**: O sistema aguarda 3 segundos e busca os dados do Supabase automaticamente

**Payload enviado:**
```json
{
  "cnpj": "00184385000194",
  "comando": "aniversariantes",
  "data_inicial": "2024-01-01",
  "data_final": "2024-01-31"
}
```

### Passo 2: Configurar Mensagens
1. **Mensagem padrão**: Edite a mensagem que será enviada para todos
2. **Mensagens individuais**: Personalize mensagens específicas na tabela
3. **Aplicar a todos**: Use o botão para aplicar a mensagem padrão a todos os aniversariantes

### Passo 3: Envio de Mensagens

#### Opção A: Envio em Lote
1. **Clique em "Enviar Mensagens"**: Envia para todos os pendentes
2. **Sistema filtra automaticamente**: Apenas aniversariantes com `enviou_msg = false` são enviados
3. **Atualização automática**: Após o envio, o campo `enviou_msg` é atualizado no Supabase

#### Opção B: Envio Individual  
1. **Clique em "Enviar"** na linha específica do aniversariante
2. **Loading individual**: Botão mostra "Enviando..." durante o processo
3. **Atualização imediata**: Status é atualizado instantaneamente

## 📡 Integração com Webhooks

### Webhook de Coleta
- **URL**: `...c77f9b60-9a4d-4ca2-8146-bedf4eebb7ca-aniversariantes-coleta-dashboard`
- **Método**: POST
- **Função**: Solicita coleta de aniversariantes do sistema externo

### Webhook de Envio  
- **URL**: `...7791d206-c9c5-4683-9061-f2253252f744-aniversariantes-atualizados-dashboard`
- **Método**: POST
- **Função**: Envia as mensagens para os aniversariantes

**Payload do envio:**
```json
{
  "cnpj": "00184385000194",
  "comando": "mensagem_aniversariantes",
  "aniversariantes": [
    {
      "id": 391,
      "nome": "João Silva",
      "celular": "66999117531",
      "mensagem": "Feliz aniversário, João! 🎉",
      // ... outros campos
    }
  ]
}
```

## 🎯 Atualização do Status no Supabase

Após o envio bem-sucedido, o sistema:

1. **Chama a API**: `api.atualizarStatusEnvio()`
2. **Atualiza o campo**: `enviou_msg = true` na tabela `aniversariantes`
3. **Salva a mensagem**: Campo `mensagem` é atualizado com o texto enviado
4. **Atualiza a interface**: Estado local é sincronizado

```sql
UPDATE aniversariantes 
SET enviou_msg = true, mensagem = 'Feliz aniversário! 🎉'
WHERE id = 391;
```

## 🔍 Monitoramento e Debug

### Logs do Console
- Todas as operações são logadas no console do navegador
- Erros são capturados e exibidos via `showToast()`

### Status Visual
- **Badge "Pendente"**: `enviou_msg = false` ou `null`
- **Badge "Enviado"**: `enviou_msg = true`
- **Botão desabilitado**: Após envio ou durante loading

### Métricas em Tempo Real
- **Total de Aniversariantes**: Contador dinâmico
- **Mensagens Enviadas**: Baseado em `enviou_msg = true`
- **Pendentes**: Filtro automático dos não enviados

## ⚠️ Pontos de Atenção

1. **CNPJ Fixo**: Atualmente usando "00184385000194" - ajustar conforme necessário
2. **Empresa ID Padrão**: 7 (usado automaticamente se não especificado)
3. **Interface Única**: Uma página com 4 abas para todas as funcionalidades
4. **Timeout**: Aguarda 3 segundos após coleta antes de buscar no Supabase
5. **Filtros**: Sistema envia apenas aniversariantes pendentes (`enviou_msg = false`)
6. **Rollback**: Não há rollback automático - cuidado com testes em produção
7. **Porta**: O servidor está rodando na porta 3001 (3000 estava ocupada)

## 🔧 URLs de Teste Disponíveis

### URL Principal (Recomendada)
```
http://localhost:3001/test-aniversariantes
```
- **Empresa ID padrão**: 7
- **Interface completa**: 4 abas (Aniversariantes, Cobranças, Automações, Configurações)
- **Troca rápida**: Botões numéricos para mudar empresa

### Com Empresa ID Específico
```
http://localhost:3001/test-aniversariantes?empresa_id=7
http://localhost:3001/test-aniversariantes?empresa_id=1
http://localhost:3001/test-aniversariantes?empresa_id=2
```

## 📋 Estrutura da Interface

### Aba "Aniversariantes" (Principal)
- ✅ **Funcional**: Coleta, configuração e envio de mensagens
- ✅ **Métricas**: Total, enviados, pendentes
- ✅ **Envio**: Individual e em lote
- ✅ **Atualização**: Status no Supabase

### Aba "Cobranças"
- ⏳ **Em desenvolvimento**: Placeholder preparado

### Aba "Automações"  
- ⏳ **Em desenvolvimento**: Placeholder preparado

### Aba "Configurações"
- ✅ **Informações**: Empresa ID ativo
- ✅ **Status**: Webhooks configurados

## 🚀 Próximos Passos

1. **✅ Interface única com abas**: Implementado
2. **✅ Empresa ID padrão (7)**: Implementado
3. **Implementar Toast real**: Substituir alerts por biblioteca de toast
4. **Configurar CNPJ dinâmico**: Baseado na empresa logada
5. **Desenvolver aba Cobranças**: Sistema completo de gestão
6. **Desenvolver aba Automações**: Regras e configurações 