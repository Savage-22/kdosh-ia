from fastapi import APIRouter

from . import controller

router = APIRouter(prefix="/api/documents", tags=["documents"])
router.add_api_route("", controller.list_documents, methods=["GET"])
router.add_api_route("", controller.upload_document, methods=["POST"], status_code=201)
router.add_api_route("/{document_id}", controller.delete_document, methods=["DELETE"])
router.add_api_route("/ask", controller.ask_documents, methods=["POST"])
