# PackFlow - Sistema de Gestão de Embalagens

Sistema web completo de gestão de embalagens para ambientes logísticos/industriais, com captura fotográfica em 3 etapas, extração de dados via OCR, detecção de duplicidades e ranking de performance de operadores.

## Características Principais

- **Captura Fotográfica em 3 Etapas**: DANFE, Produtos, Caixa Fechada
- **OCR Automático**: Extração de NF e Cliente via IA
- **Detecção de Duplicidade**: Com alerta sonoro e visual
- **Ranking de Performance**: Por volume, velocidade e qualidade
- **Suporte Multi-Câmera**: Alterne entre câmeras disponíveis
- **Zoom Digital**: Controle de zoom nativo
- **Gestão de Avarias**: Registro de erros por embalagem
- **Dashboard Completo**: Métricas e filtros avançados
- **Exportação CSV**: Relatórios exportáveis

## Tecnologias

- React 18
- React Router
- TanStack Query
- Tailwind CSS
- Shadcn/ui Components
- Framer Motion
- Lucide Icons
- date-fns
- Base44 Platform

## Instalação

\`\`\`bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev
\`\`\`

## Configuração

1. Configure as credenciais do Base44 no arquivo `.env`
2. Crie as entidades `Operador` e `Embalagem` no Base44 conforme a especificação
3. Ative as permissões de câmera no navegador

## Estrutura do Projeto

\`\`\`
src/
├── components/
│   ├── ui/              # Componentes Shadcn/ui
│   ├── embalagem/       # Componentes de embalagem
│   └── dashboard/       # Componentes do dashboard
├── pages/
│   ├── SelecaoOperador.jsx
│   ├── Embalagem.jsx
│   ├── Dashboard.jsx
│   ├── Ranking.jsx
│   └── GestaoOperadores.jsx
├── hooks/               # React Query hooks
├── services/            # Serviços (Base44)
└── lib/                 # Utilitários
\`\`\`

## Fluxo de Uso

1. **Seleção de Operador**: Operador escolhe seu nome na tela inicial
2. **Etapa 1 - DANFE**: Captura foto da nota fiscal → OCR → Verifica duplicidade
3. **Etapa 2 - Produtos**: Captura foto dos itens
4. **Etapa 3 - Caixa**: Captura foto da embalagem pronta
5. **Finalização**: Resumo e opção de adicionar observação
6. **Dashboard**: Visualização de todas as embalagens e métricas
7. **Ranking**: Performance dos operadores

## Entidades Base44

### Operador
- nome: string
- apelido: string
- ativo: boolean
- foto_url: string

### Embalagem
- nf_number: string
- cliente_nome: string
- start_time: datetime
- end_time: datetime
- tempo_total_segundos: number
- foto_danfe_url: string
- foto_conteudo_url: string
- foto_caixa_url: string
- observacao: string
- operador_id: string
- operador_nome: string
- pendente_extracao: boolean
- status: enum (concluido|suspeito|pendente)
- tem_avaria: boolean
- tipo_avaria: enum
- observacao_avaria: string
- avaria_registrada_por: string
- avaria_registrada_em: datetime
- is_duplicada: boolean
- nf_original_id: string
- data_nf_original: datetime

## Licença

MIT
