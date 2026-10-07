from fastapi import APIRouter

from . import controller

router = APIRouter(prefix="/api/openrouter", tags=["openrouter"])
router.add_api_route("/models", controller.models, methods=["GET"])
router.add_api_route("/chat", controller.chat, methods=["POST"])
