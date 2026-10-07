from fastapi import Body, File, UploadFile

from app.modules.documents.application import document_service, rag_service
from app.shared.http import json_body


async def list_documents():
    return {"success": True, "data": [document_service.summary(document) for document in document_service.documents.values()]}


async def upload_document(file: UploadFile = File(...)):
    try:
        data = await file.read(document_service.MAX_PDF_SIZE + 1)
        document = document_service.add_pdf(file.filename or "", file.content_type, data)
    finally:
        await file.close()
    return {"success": True, "data": document}


async def delete_document(document_id: str):
    document_service.remove_document(document_id)
    return {"success": True, "message": "Documento eliminado"}


async def ask_documents(body: object = Body(default=None)):
    return {"success": True, "data": await rag_service.answer_question(json_body(body))}
