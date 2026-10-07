from fastapi import APIRouter

from . import controller

router = APIRouter(prefix="/api/usage", tags=["usage"])
router.add_api_route("/summary", controller.get_usage_summary, methods=["GET"])
