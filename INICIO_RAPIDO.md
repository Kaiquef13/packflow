# 🚀 Início Rápido - PackFlow

## Instalação em 3 Passos

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Configurar Base44
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env e adicionar suas credenciais do Base44
# VITE_BASE44_URL=https://api.base44.com
# VITE_BASE44_API_KEY=sua_chave_aqui
```

### 3️⃣ Iniciar Servidor
```bash
npm run dev
```

Acesse: **http://localhost:5173**

---

## ⚙️ Configuração Base44

### Criar Entidades no Painel Base44

#### 📦 Entidade: Operador
```json
{
  "nome": "string",
  "apelido": "string",
  "ativo": "boolean",
  "foto_url": "string"
}
```

#### 📦 Entidade: Embalagem
```json
{
  "nf_number": "string",
  "cliente_nome": "string",
  "start_time": "datetime",
  "end_time": "datetime",
  "tempo_total_segundos": "number",
  "foto_danfe_url": "string",
  "foto_conteudo_url": "string",
  "foto_caixa_url": "string",
  "observacao": "string",
  "operador_id": "string",
  "operador_nome": "string",
  "pendente_extracao": "boolean",
  "status": "string",
  "tem_avaria": "boolean",
  "tipo_avaria": "string",
  "observacao_avaria": "string",
  "avaria_registrada_por": "string",
  "avaria_registrada_em": "datetime",
  "is_duplicada": "boolean",
  "nf_original_id": "string",
  "data_nf_original": "datetime"
}
```

---

## 📋 Primeiro Uso

### 1. Cadastrar Operadores
1. Acesse o Dashboard
2. Clique em "Gerenciar Operadores"
3. Adicione operadores
4. Marque como "Ativo"

### 2. Iniciar Embalagem
1. Na tela inicial, selecione seu nome
2. Siga as 3 etapas:
   - 📸 Foto da DANFE
   - 📸 Foto dos Produtos
   - 📸 Foto da Caixa
3. Confirme e pronto!

---

## 🎯 Principais Recursos

### Câmera
- 🔄 Alternar entre câmeras
- 🔍 Zoom digital
- 📏 Resoluções automáticas (4K → Full HD → HD)

### Detecção
- 🚨 Alerta sonoro para NF duplicada
- 🤖 OCR automático da DANFE
- ⏱️ Cronômetro automático

### Dashboard
- 📊 Métricas em tempo real
- 🔄 Auto-atualização (opcional)
- 📥 Exportação CSV
- 🔍 Busca e filtros

### Ranking
- 🥇 Pódio top 3
- 📈 3 tipos de ranking
- 🕐 Filtros por turno

---

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint
```

---

## ⚠️ Requisitos Importantes

### Navegador
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Permissão de câmera habilitada

### Produção
- ⚠️ **OBRIGATÓRIO HTTPS** (câmera não funciona em HTTP)
- ✅ Certificado SSL válido

---

## 📁 Estrutura do Projeto

```
packflow/
├── src/
│   ├── components/
│   │   ├── ui/                # Componentes base
│   │   ├── embalagem/         # Componentes de embalagem
│   │   └── dashboard/         # Componentes do dashboard
│   ├── pages/                 # Páginas
│   │   ├── SelecaoOperador.jsx
│   │   ├── Embalagem.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Ranking.jsx
│   │   └── GestaoOperadores.jsx
│   ├── hooks/                 # React Query hooks
│   ├── services/              # Integração Base44
│   └── lib/                   # Utilitários
├── .env.example
├── package.json
└── README.md
```

---

## 🆘 Problemas Comuns

### Câmera não funciona
```
✓ Verifique permissões do navegador
✓ Use HTTPS em produção
✓ Feche outras aplicações usando a câmera
```

### Dados não salvam
```
✓ Verifique .env
✓ Confirme credenciais do Base44
✓ Verifique entidades criadas
✓ Abra console do navegador (F12)
```

### OCR não funciona
```
✓ Tire foto nítida e iluminada
✓ DANFE deve estar completamente visível
✓ Verifique configuração LLM no Base44
```

---

## 📚 Documentação Completa

- **README.md** - Visão geral do projeto
- **INSTRUCOES.md** - Instruções detalhadas
- **RESUMO_PROJETO.md** - Resumo técnico completo

---

## ✅ Checklist de Deploy

- [ ] Criar entidades no Base44
- [ ] Configurar .env com credenciais
- [ ] Cadastrar operadores no sistema
- [ ] Testar captura de foto
- [ ] Verificar OCR funcionando
- [ ] Configurar HTTPS em produção
- [ ] Testar em dispositivo móvel

---

**🎉 Pronto! Seu sistema PackFlow está configurado e pronto para uso!**

Para suporte adicional, consulte os arquivos de documentação ou entre em contato com o suporte técnico.
