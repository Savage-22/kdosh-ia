# Backend Kdosh IA Demo

Proxy seguro para OpenRouter y recuperación documental temporal basada en PDFs. La clave de OpenRouter nunca se expone al navegador.

## Inicio

1. Copia `.env.example` como `.env` y configura `OPENROUTER_API_KEY`.
2. Crea PostgreSQL ejecutando `sudo -u postgres psql -v db_password='kdoshsop' -f database/bootstrap.sql` desde `backend/`.
3. Configura `DATABASE_URL` en `.env`.
4. Ejecuta `pnpm dev` desde `backend/`.

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

Los PDFs se mantienen solo en memoria. Al reiniciar el backend se eliminan junto con sus fragmentos.

Cada respuesta exitosa de OpenRouter registra sus tokens y `usage.cost`, que es el costo en USD informado por OpenRouter. Los registros RAG incluyen el tipo `rag` y los documentos/fragmentos recuperados. No se guardan prompts, respuestas ni el contenido completo de los PDFs.
