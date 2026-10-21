# PharmCompare Pro

Sistema web de comparação de preços para farmácias, com dashboard moderno, importação de Excel e dados fictícios para testes.

## Tecnologias

- React + Vite
- Express + Node.js
- Recharts
- XLSX
- JSON para persistência local

## Requisitos

- Node.js 18+
- npm ou pnpm

## Instalação

```bash
npm install
```

## Execução

```bash
npm run dev
```

A aplicação ficará disponível em:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Funcionalidades

- Dashboard com métricas e gráficos
- Comparação de produtos por distribuidora
- Cálculo do menor custo por pedido
- Importação de planilhas Excel (.xlsx, .xls, .csv)
- Restauro de dados fictícios
- Relatórios em português brasileiro

## Estrutura principal

- `src/App.jsx` — interface principal
- `src/index.css` — estilos do sistema
- `server/index.js` — API e regras de negócio
- `server/data/products.json` — dados persistidos localmente

## Observação

Essa é uma versão funcional para testes e demonstração, com dados fictícios e foco em validação de fluxo e UX.
