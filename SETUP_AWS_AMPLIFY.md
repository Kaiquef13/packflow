# 🚀 Setup AWS Amplify - Guia Completo

## 📋 Pré-requisitos

- ✅ Conta AWS ativa
- ✅ Node.js instalado
- ✅ npm instalado
- ✅ Projeto já tem Amplify SDK instalado

---

## 1️⃣ Instalar Amplify CLI

```bash
npm install -g @aws-amplify/cli
```

## 2️⃣ Configurar Credenciais AWS

Execute o comando:

```bash
amplify configure
```

Siga os passos:

1. **Sign in to AWS Console**: Abrirá o navegador, faça login na AWS
2. **Specify the AWS Region**: Escolha sua região (ex: `us-east-1`)
3. **Specify the username**: Crie um usuário IAM (ex: `amplify-dev`)
4. **Enter the access key**: Cole o Access Key ID
5. **Enter the secret access key**: Cole o Secret Access Key
6. **Profile Name**: Deixe `default` ou escolha um nome

---

## 3️⃣ Inicializar Amplify no Projeto

No diretório do projeto:

```bash
cd "C:\Users\User\Desktop\Testesite"
amplify init
```

Responda as perguntas:

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

Aguarde a criação do ambiente (2-3 minutos).

---

## 4️⃣ Adicionar API GraphQL

```bash
amplify add api
```

Responda:

```
? Select from one of the below mentioned services: GraphQL
? Here is the GraphQL API that we will create. Select a setting to edit or continue: Continue
? Choose a schema template: Single object with fields (e.g., "Todo" with ID, name, description)
```

Agora edite o schema:

```bash
# O schema já está pronto em: amplify/backend/api/packflow/schema.graphql
# Não precisa alterar nada!
```

---

## 5️⃣ Adicionar Storage (S3)

```bash
amplify add storage
```

Responda:

```
? Select from one of the below mentioned services: Content (Images, audio, video, etc.)
? Provide a friendly name for your resource: packflowstorage
? Provide bucket name: packflow-fotos-[SEU-ID-UNICO]
? Who should have access: Auth and guest users
? What kind of access do you want for Authenticated users? create, read, update, delete
? What kind of access do you want for Guest users? create, read
```

---

## 6️⃣ Fazer Deploy (Push)

```bash
amplify push
```

Confirme:

```
? Are you sure you want to continue? Yes
? Do you want to generate code for your newly created GraphQL API? No
```

Aguarde o deploy (5-10 minutos). Serão criados:
- ✅ API GraphQL (AWS AppSync)
- ✅ Tabelas DynamoDB (Operador, Embalagem)
- ✅ Bucket S3 para fotos
- ✅ Roles e permissões IAM

---

## 7️⃣ Configurar OCR (Amazon Textract) - Opcional

### Criar Lambda Function para OCR

```bash
amplify add function
```

Responda:

```
? Select which capability you want to add: Lambda function
? Provide an AWS Lambda function name: packflowOCR
? Choose the runtime that you want to use: NodeJS
? Choose the function template: Hello World
? Do you want to configure advanced settings? No
? Do you want to edit the local lambda function now? Yes
```

Edite o arquivo `amplify/backend/function/packflowOCR/src/index.js`:

```javascript
const AWS = require('aws-sdk');
const textract = new AWS.Textract();

exports.handler = async (event) => {
    try {
        const { imageUrl } = JSON.parse(event.body);

        // Extrair bucket e key da URL
        const url = new URL(imageUrl);
        const bucket = url.hostname.split('.')[0];
        const key = url.pathname.substring(1);

        const params = {
            Document: {
                S3Object: {
                    Bucket: bucket,
                    Name: key
                }
            }
        };

        const result = await textract.detectDocumentText(params).promise();

        // Extrair texto
        const lines = result.Blocks
            .filter(block => block.BlockType === 'LINE')
            .map(block => block.Text);

        // Procurar por padrões de NF e Cliente
        let nf_number = '';
        let cliente_nome = '';

        lines.forEach(line => {
            // Padrão de NF: números após "NF", "N°", etc
            if (line.match(/N[FºFª°]\s*:?\s*(\d+)/i)) {
                nf_number = line.match(/(\d+)/)[0];
            }
            // Padrão de cliente: linhas com nome próprio
            if (line.match(/^[A-Z][a-z]+\s+[A-Z]/)) {
                cliente_nome = line;
            }
        });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                nf_number,
                cliente_nome,
                extracted: true
            })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

Adicione permissões do Textract:

Edite `amplify/backend/function/packflowOCR/packflowOCR-cloudformation-template.json` e adicione:

```json
"policies": [
  {
    "policyName": "TextractPolicy",
    "policyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "textract:DetectDocumentText",
            "textract:AnalyzeDocument"
          ],
          "Resource": "*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "s3:GetObject"
          ],
          "Resource": "arn:aws:s3:::packflow-fotos-*/*"
        }
      ]
    }
  }
]
```

Push a função:

```bash
amplify push
```

### Expor via API REST

```bash
amplify add api
```

Escolha:
```
? Select from one of the below mentioned services: REST
? Provide a friendly name for your resource: packflowAPI
? Provide a path: /extract
? Choose a Lambda source: Use a Lambda function already added in the current Amplify project
? Choose the Lambda function to invoke: packflowOCR
? Restrict API access: No
? Do you want to add another path? No
```

Push:

```bash
amplify push
```

Atualize o serviço OCR em `src/services/amplify.js`:

```javascript
export async function extractDataFromFile(fileUrl) {
  try {
    const apiName = 'packflowAPI';
    const path = '/extract';
    const options = {
      body: { imageUrl: fileUrl }
    };

    const response = await post({ apiName, path, options });
    return response;
  } catch (error) {
    console.error('Erro ao extrair dados:', error);
    throw error;
  }
}
```

---

## 8️⃣ Atualizar aws-exports.js

Após o `amplify push`, o arquivo `src/aws-exports.js` será gerado automaticamente com todas as configurações.

---

## 9️⃣ Testar Localmente

```bash
npm run dev
```

Acesse http://localhost:5173 e teste:
- Cadastro de operadores
- Captura de fotos
- Upload para S3
- Salvamento no DynamoDB

---

## 🔟 Deploy no Amplify Hosting

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

Ou conecte ao GitHub:

```bash
amplify add hosting
```

Escolha:
```
? Select the plugin module to execute: Hosting with Amplify Console
? Choose a type: Continuous deployment (Git-based deployments)
```

Siga instruções para conectar ao GitHub.

---

## 📊 Comandos Úteis

```bash
# Ver status
amplify status

# Ver console
amplify console

# Ver API
amplify console api

# Ver Storage
amplify console storage

# Adicionar ambiente (dev, staging, prod)
amplify env add

# Mudar ambiente
amplify env checkout dev

# Deletar recursos
amplify delete
```

---

## 🌐 Estrutura Criada

Após setup completo:

```
AWS Resources:
├── AppSync API (GraphQL)
│   ├── Operador table (DynamoDB)
│   └── Embalagem table (DynamoDB)
├── S3 Bucket
│   └── fotos/
├── Lambda Function (OCR)
│   └── Amazon Textract integration
└── Amplify Hosting
    └── CloudFront CDN
```

---

## 🔐 Segurança

### Autenticação (Opcional)

Se quiser adicionar login de usuários:

```bash
amplify add auth
```

Escolha:
```
? Do you want to use the default authentication and security configuration? Default configuration
? How do you want users to be able to sign in? Username
? Do you want to configure advanced settings? No
```

Push:

```bash
amplify push
```

Atualize o schema para usar autenticação:

```graphql
type Operador @model @auth(rules: [
  {allow: owner},
  {allow: private, operations: [read]}
]) {
  ...
}
```

---

## 💰 Custos Estimados

**Free Tier (12 meses)**:
- AppSync: 250k queries/mês grátis
- DynamoDB: 25 GB armazenamento + 25 WCU/RCU
- S3: 5 GB armazenamento + 20k GET requests
- Lambda: 1M requests/mês grátis
- Textract: 1000 páginas/mês (primeiros 3 meses)

**Após Free Tier** (uso médio):
- ~$5-15/mês para projeto pequeno/médio

---

## 🐛 Troubleshooting

### Erro: "Amplify CLI not found"
```bash
npm install -g @aws-amplify/cli
```

### Erro: "No credentials"
```bash
amplify configure
```

### Erro: "Module not found: aws-exports"
```bash
amplify push
```

### Rebuild após mudanças no schema
```bash
amplify push
```

### Ver logs da Lambda
```bash
amplify console function
# Escolha a função
# Clique em "View CloudWatch Logs"
```

---

## ✅ Checklist Final

- [ ] Amplify CLI instalado
- [ ] Credenciais AWS configuradas
- [ ] `amplify init` executado
- [ ] API GraphQL adicionada
- [ ] Storage S3 adicionado
- [ ] `amplify push` executado com sucesso
- [ ] Testado localmente
- [ ] (Opcional) Lambda OCR configurada
- [ ] (Opcional) Autenticação adicionada
- [ ] Deploy no Amplify Hosting

---

## 🎉 Pronto!

Seu sistema PackFlow agora está rodando 100% na AWS:
- ✅ Backend serverless
- ✅ Banco de dados escalável (DynamoDB)
- ✅ Armazenamento de fotos (S3)
- ✅ API GraphQL (AppSync)
- ✅ OCR com IA (Textract)
- ✅ Deploy automático
- ✅ HTTPS e CDN inclusos

**Sem necessidade de Base44 ou qualquer serviço externo!**

---

## 📞 Suporte

- Documentação Amplify: https://docs.amplify.aws
- AppSync Docs: https://docs.aws.amazon.com/appsync
- Textract Docs: https://docs.aws.amazon.com/textract
- Comunidade: https://github.com/aws-amplify/amplify-js/discussions

Boa sorte! 🚀
