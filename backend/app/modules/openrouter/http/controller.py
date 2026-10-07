from fastapi import Body

from app.modules.openrouter.application import openrouter_service
from app.shared.http import json_body


async def models():
    payload = await openrouter_service.request_openrouter("/models")
    return {"success": True, "data": payload.get("data") or []}


async def chat(body: object = Body(default=None)):
    completion = await openrouter_service.create_completion(json_body(body))
    return {"success": True, "data": completion}
