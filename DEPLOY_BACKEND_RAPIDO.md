# 🚀 Deploy Backend AWS - Guia Rápido

## ✅ Pré-requisito: Amplify CLI Instalado

O Amplify CLI já foi instalado! Agora vamos configurar e fazer deploy.

---

## 📋 PASSO 1: Configurar Credenciais AWS

Execute este comando no terminal:

```bash
amplify configure
```

### O que vai acontecer:

1. **Abrirá o navegador** automaticamente
2. Faça **login na sua conta AWS**
3. Volte para o terminal e pressione **Enter**

### Siga as instruções no terminal:

```
? Specify the AWS Region: us-east-1
(escolha a região mais próxima de você)

? Specify the username of the new IAM user: amplify-packflow
(ou qualquer nome que preferir)
```

4. **Abrirá o navegador novamente** para criar o usuário IAM
5. No console AWS IAM:
   - Clique em **Next: Permissions** (já vem com as permissões corretas)
   - Clique em **Next: Tags** (pode pular)
   - Clique em **Next: Review**
   - Clique em **Create user**

6. **IMPORTANTE**: Copie as credenciais:
   - **Access key ID**: Algo como `AKIAIOSFODNN7EXAMPLE`
   - **Secret access key**: Algo como `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

7. Volte ao terminal e cole as credenciais:

```
? accessKeyId: [Cole aqui o Access Key ID]
? secretAccessKey: [Cole aqui o Secret Access Key]
? Profile Name: default
```

✅ **Pronto!** Credenciais configuradas.

---

## 📋 PASSO 2: Inicializar Amplify no Projeto

```bash
cd "C:\Users\User\Desktop\Testesite"
amplify init
```

### Responda as perguntas:

```
? Enter a name for the project: packflow
? Initialize the project with the above configuration? No
? Enter a name for the environment: dev
? Choose your default editor: Visual Studio Code
? Choose the type of app that you're building: javascript
? What javascript framework are you using: react
? Source Directory Path: src
? Distribution Directory Path: dist
? Build Command: npm run build
? Start Command: npm run dev
? Do you want to use an AWS profile? Yes
? Please choose the profile you want to use: default
```

⏳ **Aguarde 2-3 minutos** enquanto o Amplify cria o ambiente.

✅ Quando terminar, você verá:
```
✔ Successfully created initial AWS cloud resources for deployments.
```

---

## 📋 PASSO 3: Adicionar API GraphQL

```bash
amplify add api
```

### Responda:

```
? Select from one of the below mentioned services: GraphQL
? Here is the GraphQL API that we will create. Select a setting to edit or continue: Continue
? Choose a schema template: Blank Schema
```

✅ Não precisa editar nada! O schema já está em `amplify/backend/api/packflow/schema.graphql`

---

## 📋 PASSO 4: Adicionar Storage (S3)

```bash
amplify add storage
```

### Responda:

```
? Select from one of the below mentioned services: Content (Images, audio, video, etc.)
? Provide a friendly name for your resource: packflowstorage
? Provide bucket name: packflow-fotos-<ENTER> (vai gerar ID único automático)
? Who should have access: Auth and guest users
? What kind of access do you want for Authenticated users?
  (Selecione com espaço):
  ◉ create/update
  ◉ read
  ◉ delete
? What kind of access do you want for Guest users?
  ◉ create/update
  ◉ read
```

---

## 📋 PASSO 5: Deploy! (Push para AWS)

Este é o comando mais importante - vai criar TODOS os recursos na AWS:

```bash
amplify push
```

### Vai perguntar:

```
? Are you sure you want to continue? Yes
? Do you want to generate code for your newly created GraphQL API? No
```

### O que será criado (5-10 minutos):

⏳ **Provision**: Criando recursos AWS...
- ✅ AWS AppSync (API GraphQL)
- ✅ DynamoDB Tables (Operador, Embalagem)
- ✅ S3 Bucket (fotos)
- ✅ IAM Roles (permissões)
- ✅ CloudFormation Stack

⏳ **Build**: Compilando...

⏳ **Deploy**: Fazendo deploy...

✅ **Concluído!**

### Você verá algo como:

```
✔ All resources are updated in the cloud

GraphQL endpoint: https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql
GraphQL API KEY: da2-xxxxxxxxxxxxxxxxxxxxxxxxxx

Storage bucket name: packflow-fotos-xxxxx-dev
```

---

## 📋 PASSO 6: Testar Localmente

O arquivo `src/aws-exports.js` foi gerado automaticamente com todas as configurações!

```bash
npm run dev
```

Acesse: http://localhost:5173

**Teste**:
1. Ir para Gestão de Operadores
2. Criar um operador
3. Verificar se salvou no DynamoDB
4. Tentar fazer upload de foto

---

## 🌐 PASSO 7 (Opcional): Deploy do Frontend

Se quiser fazer deploy do frontend também:

```bash
amplify add hosting
```

Escolha:
```
? Select the plugin module to execute: Hosting with Amplify Console
? Choose a type: Manual deployment
```

Deploy:
```bash
amplify publish
```

Ou conecte ao GitHub para CI/CD automático:
```
? Choose a type: Continuous deployment (Git-based deployments)
```

---

## 📊 Ver Recursos Criados

### No Terminal:

```bash
# Ver status
amplify status

# Abrir console AWS
amplify console

# Abrir console da API
amplify console api

# Abrir console do Storage
amplify console storage
```

### No AWS Console:

1. **AppSync**: https://console.aws.amazon.com/appsync
   - Queries, Mutations, Subscriptions
   - Schema visual
   - Playground para testar

2. **DynamoDB**: https://console.aws.amazon.com/dynamodb
   - Tabelas: Operador, Embalagem
   - Explorar items
   - Ver métricas

3. **S3**: https://console.aws.amazon.com/s3
   - Bucket: packflow-fotos-xxxxx
   - Ver fotos enviadas

---

## 🔄 Atualizações Futuras

Quando modificar o schema ou adicionar recursos:

```bash
# 1. Editar schema: amplify/backend/api/packflow/schema.graphql
# 2. Push mudanças:
amplify push

# 3. Testar:
npm run dev
```

---

## 🛑 Deletar Recursos (se necessário)

⚠️ **CUIDADO**: Isso deleta TUDO da AWS!

```bash
amplify delete
```

---

## 🐛 Troubleshooting

### Erro: "No credentials"
```bash
amplify configure
```

### Erro: "Cannot find module aws-exports"
```bash
amplify push
```

### Schema não atualiza
```bash
amplify push --force
```

### Ver logs detalhados
```bash
amplify push --debug
```

---

## ✅ Checklist

- [ ] `amplify configure` - Credenciais configuradas
- [ ] `amplify init` - Projeto inicializado
- [ ] `amplify add api` - API adicionada
- [ ] `amplify add storage` - Storage adicionado
- [ ] `amplify push` - Deploy feito com sucesso
- [ ] Arquivo `src/aws-exports.js` gerado
- [ ] Testar localmente funcionando
- [ ] (Opcional) `amplify publish` - Frontend deployado

---

## 🎉 Pronto!

Seu backend AWS está no ar! Agora você tem:

✅ **API GraphQL** escalável (AWS AppSync)
✅ **Banco de dados** NoSQL gerenciado (DynamoDB)
✅ **Storage** ilimitado para fotos (S3)
✅ **Autenticação** pronta (opcional)
✅ **HTTPS** automático
✅ **Backup** automático
✅ **99.99% uptime** garantido pela AWS

**Custo**: Grátis no Free Tier por 12 meses!

---

## 📞 Próximos Passos

1. Testar o sistema completo
2. Cadastrar operadores
3. Testar fluxo de embalagem
4. (Opcional) Configurar OCR com Textract
5. (Opcional) Deploy do frontend

Qualquer dúvida, estou aqui! 🚀
