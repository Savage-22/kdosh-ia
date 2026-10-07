# Backend Kdosh IA Demo

Proxy seguro para OpenRouter y recuperación documental temporal basada en PDFs. La clave de OpenRouter nunca se expone al navegador.

## Inicio

1. Instala Python 3.11+ y PostgreSQL. Desde `backend/` crea un entorno virtual con `python3 -m venv .venv`, actívalo con `source .venv/bin/activate` e instala dependencias con `pip install -r requirements.txt`.
2. Copia `.env.example` como `.env` y configura `OPENROUTER_API_KEY`.
3. Crea PostgreSQL ejecutando `sudo -u postgres psql -v db_password='tu_clave' -f database/bootstrap.sql` desde `backend/`. Usa esa misma contraseña en `DATABASE_URL` del `.env`.
4. Ejecuta `uvicorn app.main:app --reload --host 127.0.0.1 --port 3001` desde `backend/`. El frontend conserva el proxy de Vite hacia el puerto 3001.

Para pruebas: `pip install pytest` y `pytest` desde `backend/`. Las pruebas de API simulan OpenRouter y PostgreSQL; no necesitan servicios externos.

## Estructura

| Carpeta | Responsabilidad |
| --- | --- |
| `app/main.py` | Crea FastAPI y registra los routers |
| `app/config/` | Variables de entorno y conexión inicial a PostgreSQL |
| `app/modules/*/http/` | Routers (`APIRouter`) y controladores de cada módulo |
| `app/modules/*/application/` | Lógica de OpenRouter, documentos y RAG |
| `app/modules/usage/infrastructure/` | Consultas y registro de uso en PostgreSQL |
| `app/shared/` | Errores y formato común de respuestas de error |

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Estado del backend |
| GET | `/api/openrouter/models` | Lista de modelos disponibles en OpenRouter |
| POST | `/api/openrouter/chat` | Chat general con `{ model, messages, temperature? }` |
| GET | `/api/documents` | Lista de PDFs temporales |
| POST | `/api/documents` | Carga un PDF en `multipart/form-data`, campo `file` |
| DELETE | `/api/documents/:id` | Elimina un PDF temporal |
| POST | `/api/documents/ask` | Consulta documental con `{ model, question, systemPrompt?, temperature? }` |
| GET | `/api/usage/summary` | Costos y tokens agregados por modelo |

Los PDFs y sus fragmentos se mantienen solo en memoria. Al reiniciar el backend se eliminan. Ejecuta un solo proceso de Uvicorn: varios workers tendrían almacenes de documentos independientes.

Cada respuesta exitosa de OpenRouter registra sus tokens y `usage.cost`, que es el costo en USD informado por OpenRouter. Los registros RAG incluyen el tipo `rag` y los documentos/fragmentos recuperados. No se guardan prompts, respuestas ni el contenido completo de los PDFs.
