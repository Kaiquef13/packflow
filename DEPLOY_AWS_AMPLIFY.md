# 🚀 Deploy no AWS Amplify - Guia Completo

## ✅ Preparação Concluída

O projeto já está preparado para deploy:
- ✅ Repositório Git inicializado
- ✅ Commit inicial criado
- ✅ Arquivo `amplify.yml` configurado
- ✅ Redirecionamentos SPA configurados

---

## Opção 1: Deploy via GitHub (Recomendado)

### Passo 1: Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique em **"New repository"** (ou ícone + no canto superior direito)
3. Preencha:
   - **Repository name**: `packflow` (ou outro nome)
   - **Description**: Sistema de Gestão de Embalagens
   - **Public** ou **Private** (sua escolha)
   - ⚠️ **NÃO** marque "Initialize with README"
4. Clique em **"Create repository"**

### Passo 2: Conectar Repositório Local ao GitHub

Copie a URL do repositório (exemplo: `https://github.com/seu-usuario/packflow.git`)

Execute no terminal (substitua pela SUA URL):

```bash
cd "C:\Users\User\Desktop\Testesite"
git remote add origin https://github.com/SEU-USUARIO/packflow.git
git branch -M main
git push -u origin main
```

Se pedir autenticação:
- Use seu **Personal Access Token** (não a senha)
- Ou configure GitHub CLI

### Passo 3: Deploy no AWS Amplify

1. **Acesse o Console AWS**
   - Vá para [console.aws.amazon.com](https://console.aws.amazon.com)
   - Faça login na sua conta AWS

2. **Abra o AWS Amplify**
   - No campo de busca, digite "Amplify"
   - Clique em **"AWS Amplify"**

3. **Criar Nova Aplicação**
   - Clique em **"Get Started"** (ou "New app" se já tiver apps)
   - Escolha **"Host web app"**

4. **Conectar Repositório**
   - Selecione **"GitHub"**
   - Clique em **"Continue"**
   - Autorize o AWS Amplify a acessar sua conta GitHub
   - Selecione o repositório **packflow**
   - Selecione o branch **main**
   - Clique em **"Next"**

5. **Configurar Build**
   - **App name**: PackFlow
   - O Amplify detectará automaticamente o `amplify.yml`
   - ✅ Verifique se as configurações estão corretas:
     ```yaml
     preBuild: npm ci
     build: npm run build
     baseDirectory: dist
     ```
   - Clique em **"Next"**

6. **Configurar Variáveis de Ambiente**
   - Clique em **"Advanced settings"** (ou configure depois)
   - Adicione as variáveis:
     - **Key**: `VITE_BASE44_URL` | **Value**: `https://api.base44.com`
     - **Key**: `VITE_BASE44_API_KEY` | **Value**: `sua_chave_aqui`
   - Clique em **"Next"**

7. **Review e Deploy**
   - Revise todas as configurações
   - Clique em **"Save and deploy"**

8. **Aguardar Deploy**
   - O processo levará de 3-5 minutos
   - Você verá 4 etapas:
     - ✅ Provision (criar ambiente)
     - ✅ Build (compilar código)
     - ✅ Deploy (fazer deploy)
     - ✅ Verify (verificar)

9. **Acessar Aplicação**
   - Após conclusão, você receberá uma URL como:
   - `https://main.xxxxx.amplifyapp.com`
   - Clique na URL para acessar seu app!

---

## Opção 2: Deploy Manual (sem Git)

### Via Amplify Console Manual Deploy

1. **Prepare o Build Local**
```bash
cd "C:\Users\User\Desktop\Testesite"
npm run build
```

2. **Acesse AWS Amplify Console**
   - Console AWS → Amplify
   - Clique em **"New app"** → **"Host web app"**

3. **Escolha "Deploy without Git provider"**
   - Clique em **"Manual deploy"**

4. **Upload da Pasta `dist`**
   - Arraste a pasta `dist` que foi criada
   - Ou clique para selecionar
   - Clique em **"Save and deploy"**

5. **Configure Variáveis de Ambiente**
   - Vá em **App settings** → **Environment variables**
   - Adicione as variáveis do Base44

⚠️ **Desvantagem**: Você precisará fazer upload manual a cada atualização

---

## Opção 3: Deploy via AWS CLI (Avançado)

### Instalar Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

### Inicializar e Deploy

```bash
cd "C:\Users\User\Desktop\Testesite"
amplify init
amplify add hosting
amplify publish
```

---

## 📝 Configurações Importantes

### Variáveis de Ambiente (OBRIGATÓRIO)

Adicione no Amplify Console:
- **App settings** → **Environment variables**

```
VITE_BASE44_URL = https://api.base44.com
VITE_BASE44_API_KEY = sua_chave_secreta_aqui
```

### Domínio Customizado (Opcional)

1. Vá em **App settings** → **Domain management**
2. Clique em **"Add domain"**
3. Escolha seu domínio (pode usar Route 53)
4. Configure DNS

### HTTPS/SSL

- ✅ Amplify fornece **HTTPS automático** (certificado SSL grátis)
- Necessário para funcionar a câmera!

### Redirecionamentos SPA

Já configurado no arquivo `public/_redirects`:
```
/*    /index.html   200
```

---

## 🔄 Atualizações Automáticas (GitHub)

Depois do primeiro deploy:
- Qualquer `git push` no branch `main` fará deploy automático
- Branches diferentes podem ter deploys de preview
- Pull Requests podem ter preview automático

---

## 🛠️ Comandos Git Úteis

```bash
# Ver status
git status

# Adicionar mudanças
git add .

# Commit
git commit -m "Descrição da mudança"

# Push para GitHub (dispara deploy automático)
git push origin main

# Ver histórico
git log --oneline
```

---

## 🐛 Troubleshooting

### Build falha no Amplify

1. Verifique os logs no console Amplify
2. Teste o build local: `npm run build`
3. Verifique se todas as dependências estão no `package.json`

### Variáveis de ambiente não funcionam

1. Certifique-se que começam com `VITE_`
2. Rebuild a aplicação após adicionar variáveis
3. No Amplify: **Redeploy this version**

### Roteamento não funciona (404 em /dashboard)

1. Verifique se o arquivo `public/_redirects` existe
2. Rebuild a aplicação
3. Ou adicione regra manual no Amplify Console:
   - **App settings** → **Rewrites and redirects**
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - Target: `/index.html`
   - Type: `200`

### Câmera não funciona

- ✅ Amplify já fornece HTTPS (necessário para câmera)
- Verifique permissões no navegador
- Teste em dispositivo móvel também

---

## 📊 Monitoramento

No Amplify Console você pode ver:
- **Metrics**: Tráfego, requests, erros
- **Logs**: Logs de build e runtime
- **Alerts**: Configurar alertas

---

## 💰 Custos AWS Amplify

**Free Tier** (primeiros 12 meses):
- 1000 build minutes/mês
- 15 GB de armazenamento
- 5 GB de tráfego/mês

**Depois do Free Tier**:
- ~$0.01 por build minute
- ~$0.023 por GB de armazenamento/mês
- ~$0.15 por GB de tráfego

Para um projeto pequeno/médio: **~$5-20/mês**

---

## ✅ Checklist Final

Antes de fazer deploy:
- [ ] Código commitado no Git
- [ ] Build local funciona: `npm run build`
- [ ] Variáveis de ambiente preparadas
- [ ] Conta AWS configurada
- [ ] (Opcional) Repositório GitHub criado

Após deploy:
- [ ] Testar todas as páginas
- [ ] Testar câmera (HTTPS)
- [ ] Configurar variáveis de ambiente
- [ ] Testar integração Base44
- [ ] (Opcional) Configurar domínio customizado

---

## 🎉 Pronto!

Seu sistema PackFlow estará disponível globalmente via:
- CDN da AWS (CloudFront)
- HTTPS automático
- Deploy automático a cada push
- Alta disponibilidade
- Backup automático

**URL de exemplo**: `https://main.xxxxxxxxxxxxx.amplifyapp.com`

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs no Amplify Console
2. Consulte [docs.aws.amazon.com/amplify](https://docs.aws.amazon.com/amplify)
3. Verifique a documentação do Vite para SPAs

Boa sorte com o deploy! 🚀
