from app.modules.openrouter.application import openrouter_service
from app.shared.errors import ValidationError

from . import document_service

DEFAULT_SYSTEM_PROMPT = """Eres el asistente de Kdosh.
Responde únicamente usando el contexto documental proporcionado.
Si el contexto no contiene la información necesaria, di claramente: "No encuentro esa información en los documentos cargados."
No inventes datos. Responde en español, salvo que el usuario solicite otro idioma."""


async def answer_question(body: dict) -> dict:
    question = body.get("question")
    if not isinstance(question, str) or not question.strip():
        raise ValidationError("Debes enviar una pregunta")
    chunks = document_service.relevant_chunks(question)
    if not chunks:
        return {"answer": "No encuentro esa información en los documentos cargados.", "sources": []}
    context = "\n\n".join(f'[Fuente: {chunk["documentName"]}, fragmento {chunk["chunkIndex"] + 1}]\n{chunk["text"]}' for chunk in chunks)
    system_prompt = body.get("systemPrompt")
    prompt = (system_prompt.strip() if isinstance(system_prompt, str) and system_prompt.strip() else DEFAULT_SYSTEM_PROMPT) + "\n\nContexto documental:\n" + context
    sources = [{"documentId": chunk["documentId"], "documentName": chunk["documentName"], "chunkIndex": chunk["chunkIndex"] + 1} for chunk in chunks]
    completion = await openrouter_service.create_completion({
        "model": body.get("model"), "temperature": body.get("temperature"),
        "messages": [{"role": "system", "content": prompt}, {"role": "user", "content": question}],
    }, "rag", sources)
    choices = completion.get("choices") or []
    result = {"answer": (choices[0].get("message") or {}).get("content") or "" if choices else "", "sources": sources}
    if "usage" in completion:
        result["usage"] = completion["usage"]
    return result
