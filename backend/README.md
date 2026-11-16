# 📽️ Lumière — Backend API & Data Pipeline

Backend assíncrono e orquestrador de dados do **Lumière**, desenvolvido com **FastAPI**, **SQLAlchemy 2.0 (Asyncio)**, **Pydantic v2** e **Pytest**.

Consulte o [README principal da raiz do projeto](../README.md) para a documentação técnica completa, diagrama de arquitetura e decisões de engenharia.

## 🛠️ Executando o Backend

```bash
# Criar e ativar ambiente virtual
python -m venv .venv

# No Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# No Linux / macOS:
source .venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Executar a suíte de testes assíncronos
python -m pytest -v

# Iniciar o servidor Uvicorn
uvicorn app.main:app --reload --port 8000
```

## 📚 Endpoints & Documentação Interativa

* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`
* OpenAPI JSON: `http://localhost:8000/v1/openapi.json`
* Health Check: `http://localhost:8000/healthz`
