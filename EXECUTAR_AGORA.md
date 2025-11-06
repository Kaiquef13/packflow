# 🚀 EXECUTAR AGORA - Deploy Backend

## ✅ Status Atual

- ✅ Amplify CLI instalado
- ✅ Perfil AWS configurado: **awsiot**
- ✅ Projeto inicializado
- ✅ Região: **sa-east-1** (São Paulo)

---

## 📋 EXECUTE ESTES COMANDOS NO TERMINAL:

Abra um **novo terminal** e execute:

### 1️⃣ Adicionar API GraphQL

```bash
cd "C:\Users\User\Desktop\Testesite"
amplify add api
```

**Responda:**
```
? Select from one of the below mentioned services:
  → GraphQL (pressione Enter)

? Here is the GraphQL API that we will create. Select a setting to edit or continue:
  → Continue (pressione Enter)

? Choose a schema template:
  → Blank Schema (pressione Enter)
```

✅ **Pronto!** API adicionada (mas ainda não foi criada na AWS)

---

### 2️⃣ Adicionar Storage S3

```bash
amplify add storage
```

**Responda:**
```
? Select from one of the below mentioned services:
  → Content (Images, audio, video, etc.) (pressione Enter)

? Provide a friendly name for your resource:
  → packflowstorage (ou pressione Enter para aceitar)

? Provide bucket name:
  → (pressione Enter - vai gerar ID único automático)

? Who should have access:
  → Auth and guest users (pressione Enter)

? What kind of access do you want for Authenticated users?
  → Pressione ESPAÇO para selecionar:
    [X] create/update
    [X] read
    [X] delete
  → Pressione Enter quando tudo estiver marcado

? What kind of access do you want for Guest users?
  → Pressione ESPAÇO para selecionar:
    [X] create/update
    [X] read
  → Pressione Enter
```

✅ **Pronto!** Storage adicionado

---

### 3️⃣ DEPLOY! 🚀 (Criar tudo na AWS)

```bash
amplify push
```

**Responda:**
```
? Are you sure you want to continue?
  → Yes (pressione Enter)

? Do you want to generate code for your newly created GraphQL API?
  → No (pressione N e Enter)
```

⏳ **AGUARDE 5-10 MINUTOS**

Vai criar:
- ✅ AWS AppSync (API GraphQL)
- ✅ DynamoDB Tables (Operador, Embalagem)
- ✅ S3 Bucket (fotos)
- ✅ IAM Roles

Você verá o progresso:
```
⠋ Updating resources in the cloud. This may take a few minutes...
```

**Quando terminar:**
```
✔ All resources are updated in the cloud

GraphQL endpoint: https://xxxxx.appsync-api.sa-east-1.amazonaws.com/graphql
GraphQL API KEY: da2-xxxxxxxxxx

Storage bucket name: packflow-fotos-xxxxx-dev
```

---

### 4️⃣ Testar Localmente

```bash
npm run dev
```

Acesse: http://localhost:5173

**Teste:**
1. Ir para **Gestão de Operadores**
2. Clicar em **Novo Operador**
3. Preencher nome e clicar em **Cadastrar**
4. Verificar se salvou (deve aparecer na lista)

---

## 📊 Comandos Úteis Depois

```bash
# Ver status
amplify status

# Abrir console AWS
amplify console

# Ver API GraphQL no console
amplify console api

# Ver Storage S3 no console
amplify console storage

# Ver logs detalhados
amplify push --debug
```

---

## 🐛 Se Der Erro

### "No current environment"
```bash
amplify env checkout dev
```

### "GraphQL schema is invalid"
```bash
amplify push --force
```

### "Profile not found"
```bash
amplify init --profile awsiot
```

---

## ✅ Checklist

Execute em ordem:

- [ ] `amplify add api` - API GraphQL
- [ ] `amplify add storage` - S3 Storage
- [ ] `amplify push` - Deploy (5-10 min)
- [ ] `npm run dev` - Testar local
- [ ] Criar operador no sistema
- [ ] Verificar se salvou

---

## 🎯 Depois do Deploy

Quando `amplify push` terminar:

1. O arquivo `src/aws-exports.js` será atualizado automaticamente
2. Restart o `npm run dev`
3. Teste o sistema completo
4. Todas as páginas devem funcionar:
   - ✅ Seleção de Operador
   - ✅ Gestão de Operadores (CRUD)
   - ✅ Embalagem (fotos no S3)
   - ✅ Dashboard (dados do DynamoDB)
   - ✅ Ranking

---

## 💡 Dica

Deixe o terminal aberto durante o `amplify push` para ver o progresso!

Se tiver algum erro, me avise que eu te ajudo! 🚀
