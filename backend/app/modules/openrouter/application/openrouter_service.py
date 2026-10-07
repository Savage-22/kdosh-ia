import httpx

from app.config.env import openrouter_headers
from app.shared.errors import ProviderError, ValidationError
from app.modules.usage.infrastructure.usage_model import record_usage

BASE_URL = "https://openrouter.ai/api/v1"


async def request_openrouter(path: str, payload: dict | None = None) -> dict:
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.request(
                "POST" if payload is not None else "GET", BASE_URL + path,
                headers=openrouter_headers(), json=payload,
            )
        if response.is_error:
            try:
                body = response.json()
                message = (body.get("error") or {}).get("message") or body.get("message")
            except (ValueError, AttributeError):
                message = None
            raise ProviderError(
                message or "OpenRouter no pudo completar la solicitud",
                response.status_code if response.status_code in (400, 402, 429, 503) else 502,
            )
        return response.json()
    except httpx.TimeoutException as exc:
        raise ProviderError("OpenRouter tardó demasiado en responder", 504) from exc
    except (httpx.RequestError, ValueError) as exc:
        raise ProviderError("No fue posible conectar con OpenRouter") from exc


def validate_messages(messages: object) -> None:
    if not isinstance(messages, list) or not messages:
        raise ValidationError("Debes enviar al menos un mensaje")
    if not all(
        isinstance(message, dict)
        and message.get("role") in ("system", "user", "assistant")
        and isinstance(message.get("content"), str)
        and message["content"].strip()
        for message in messages
    ):
        raise ValidationError("Los mensajes no tienen un formato válido")


async def create_completion(body: dict, request_type: str = "chat", sources: list | None = None) -> dict:
    model = body.get("model")
    if not isinstance(model, str) or not model.strip():
        raise ValidationError("Debes seleccionar un modelo")
    messages = body.get("messages")
    validate_messages(messages)
    payload = {"model": model, "messages": messages}
    temperature = body.get("temperature")
    if isinstance(temperature, (int, float)) and not isinstance(temperature, bool):
        payload["temperature"] = temperature
    completion = await request_openrouter("/chat/completions", payload)
    await record_usage(request_type, model, completion, sources or [])
    return completion
