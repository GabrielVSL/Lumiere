# 📽️ Lumière — Frontend

Camada de interface visual do **Lumière**, construída com **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4** e **GSAP**.

Consulte o [README principal da raiz do projeto](../README.md) para a documentação técnica completa, decisões de arquitetura e guias de deploy.

## 🛠️ Scripts Disponíveis

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento local
npm run dev

# Checagem de tipagem estrita com TypeScript
npm run type-check

# Análise estática com ESLint
npm run lint

# Gerar build otimizado para produção
npm run build

# Pré-visualizar o build localmente
npm run preview
```

## 🌐 Variáveis de Ambiente

Crie um arquivo `.env` na pasta `frontend` tomando como base o `.env.example`:

```env
VITE_FASTAPI_URL="http://localhost:8000/v1"
```
