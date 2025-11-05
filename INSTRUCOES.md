# Instruções de Instalação e Configuração - PackFlow

## 1. Pré-requisitos

- Node.js 18+ instalado
- NPM ou Yarn
- Conta na plataforma Base44
- Navegador moderno com suporte a câmera (Chrome, Firefox, Safari, Edge)

## 2. Instalação

```bash
# Instalar todas as dependências
npm install
```

## 3. Configuração do Base44

### 3.1 Criar arquivo .env

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

### 3.2 Configurar variáveis de ambiente

Edite o arquivo `.env` e adicione suas credenciais do Base44:

```env
VITE_BASE44_URL=https://api.base44.com
VITE_BASE44_API_KEY=sua_chave_api_aqui
```

### 3.3 Criar Entidades no Base44

Acesse o painel do Base44 e crie as seguintes entidades:

#### Entidade: **Operador**

| Campo     | Tipo    | Descrição                    |
|-----------|---------|------------------------------|
| nome      | String  | Nome completo do operador    |
| apelido   | String  | Nome de exibição (opcional)  |
| ativo     | Boolean | Se o operador está ativo     |
| foto_url  | String  | URL da foto (opcional)       |

#### Entidade: **Embalagem**

| Campo                    | Tipo     | Descrição                              |
|--------------------------|----------|----------------------------------------|
| nf_number                | String   | Número da nota fiscal                  |
| cliente_nome             | String   | Nome do cliente                        |
| start_time               | DateTime | Hora de início do processo             |
| end_time                 | DateTime | Hora de fim do processo                |
| tempo_total_segundos     | Number   | Duração em segundos                    |
| foto_danfe_url           | String   | URL da foto da DANFE                   |
| foto_conteudo_url        | String   | URL da foto dos produtos               |
| foto_caixa_url           | String   | URL da foto da caixa fechada           |
| observacao               | String   | Observações (opcional)                 |
| operador_id              | String   | ID do operador                         |
| operador_nome            | String   | Nome do operador                       |
| pendente_extracao        | Boolean  | Se OCR falhou                          |
| status                   | String   | concluido / suspeito / pendente        |
| tem_avaria               | Boolean  | Se tem erro registrado                 |
| tipo_avaria              | String   | Tipo de avaria/erro                    |
| observacao_avaria        | String   | Detalhes da avaria                     |
| avaria_registrada_por    | String   | Quem registrou a avaria                |
| avaria_registrada_em     | DateTime | Quando foi registrada                  |
| is_duplicada             | Boolean  | Se é NF duplicada                      |
| nf_original_id           | String   | ID da embalagem original               |
| data_nf_original         | DateTime | Data da embalagem original             |

## 4. Executar o Projeto

### Desenvolvimento

```bash
npm run dev
```

O projeto estará disponível em: `http://localhost:5173`

### Build de Produção

```bash
npm run build
npm run preview
```

## 5. Configuração de Permissões

### Permissões de Câmera

Ao acessar o sistema pela primeira vez:

1. O navegador solicitará permissão para acessar a câmera
2. Clique em **Permitir**
3. Se você tiver múltiplas câmeras, o sistema permitirá alternar entre elas

### HTTPS em Produção

Para uso da câmera em produção, o site **DEVE** estar em HTTPS. Navegadores modernos bloqueiam acesso à câmera em conexões HTTP não-seguras (exceto localhost).

## 6. Fluxo de Uso do Sistema

### 6.1 Cadastrar Operadores

1. Acesse o Dashboard → **Gerenciar Operadores**
2. Clique em **Novo Operador**
3. Preencha nome e apelido
4. Marque como **Ativo**
5. Clique em **Cadastrar**

### 6.2 Iniciar Embalagem

1. Na tela inicial, selecione seu nome
2. **Etapa 1**: Tire foto da DANFE (nota fiscal)
   - Sistema fará OCR para extrair NF e cliente
   - Verificará se é duplicada
   - Iniciará cronômetro
3. **Etapa 2**: Tire foto dos produtos
4. **Etapa 3**: Tire foto da caixa fechada
5. Revise os dados e confirme
6. Adicione observação se necessário

### 6.3 Visualizar Dashboard

- Acesse **Dashboard de Gestão**
- Veja métricas gerais
- Filtre por período (Hoje / Semana / Todas)
- Busque por NF, cliente ou operador
- Exporte relatório em CSV

### 6.4 Ver Ranking

- Acesse **Ver Ranking**
- Veja pódio com top 3
- Rankings por:
  - **Volume**: Quem embalou mais
  - **Velocidade**: Quem foi mais rápido
  - **Qualidade**: Menor taxa de erros
- Filtre por período e turno

## 7. Recursos Avançados

### Controles de Câmera

- **Alternar Câmera**: Botão com ícone de troca
- **Zoom In/Out**: Botões + e -
- **Preferência Salva**: Sistema lembra sua câmera preferida

### Detecção de Duplicidade

- Se uma NF já foi embalada, o sistema:
  - Toca sirene de alerta
  - Mostra dados da embalagem original
  - Marca como duplicada
  - Permite continuar com registro

### Registro de Avarias

- No Dashboard, clique em uma embalagem
- Clique em **Registrar Avaria**
- Selecione o tipo de erro
- Adicione observação
- Impacta negativamente o ranking do operador

### Auto-atualização

- No Dashboard, ative **Auto-atualizar**
- Dados são atualizados a cada 5 segundos

## 8. Troubleshooting

### Câmera não funciona

1. Verifique permissões do navegador
2. Use HTTPS em produção
3. Teste em navegador diferente
4. Verifique se outra aplicação está usando a câmera

### OCR não extrai dados

- Tire foto mais nítida e com boa iluminação
- Certifique-se que a DANFE está completamente visível
- Verifique configuração da integração com LLM no Base44

### Dados não salvam

1. Verifique credenciais do Base44 no `.env`
2. Confirme que as entidades foram criadas corretamente
3. Verifique console do navegador para erros
4. Teste a conexão com a API do Base44

## 9. Estrutura de Arquivos

```
src/
├── components/
│   ├── ui/                      # Componentes base Shadcn/ui
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   ├── input.jsx
│   │   ├── textarea.jsx
│   │   ├── select.jsx
│   │   ├── badge.jsx
│   │   └── table.jsx
│   ├── embalagem/               # Componentes de embalagem
│   │   ├── CameraCapture.jsx    # Componente de câmera
│   │   ├── ModalFinalizacao.jsx
│   │   └── ModalDuplicidade.jsx
│   └── dashboard/               # Componentes do dashboard
│       ├── ResumoCards.jsx
│       └── ModalAvaria.jsx
├── pages/                       # Páginas da aplicação
│   ├── SelecaoOperador.jsx
│   ├── Embalagem.jsx
│   ├── Dashboard.jsx
│   ├── Ranking.jsx
│   └── GestaoOperadores.jsx
├── hooks/                       # React Query hooks
│   ├── useOperadores.js
│   └── useEmbalagens.js
├── services/                    # Serviços
│   └── base44.js                # Integração com Base44
├── lib/                         # Utilitários
│   └── utils.js
├── index.css                    # Estilos globais
├── main.jsx                     # Entry point
└── App.jsx                      # Rotas principais
```

## 10. Tecnologias Utilizadas

- **React 18**: Framework UI
- **React Router**: Roteamento
- **TanStack Query**: Gerenciamento de estado
- **Tailwind CSS**: Estilização
- **Framer Motion**: Animações
- **Lucide React**: Ícones
- **date-fns**: Manipulação de datas
- **Base44 Platform**: Backend e OCR

## 11. Suporte

Para dúvidas ou problemas:

1. Verifique este arquivo de instruções
2. Consulte a documentação do Base44
3. Verifique o console do navegador para erros
4. Entre em contato com o suporte técnico

---

**Sistema desenvolvido para gestão eficiente de embalagens com rastreamento fotográfico completo.**
