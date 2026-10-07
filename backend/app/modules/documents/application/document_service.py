import re
import unicodedata
from datetime import datetime, timezone
from io import BytesIO
from uuid import uuid4

from pypdf import PdfReader

from app.shared.errors import NotFoundError, ValidationError

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150
MAX_CONTEXT_CHUNKS = 4
MAX_PDF_SIZE = 10 * 1024 * 1024
STOP_WORDS = set("a al ante bajo con contra de del desde el en entre es la las lo los o para por que se sin su sus un una y".split())
documents: dict[str, dict] = {}


def normalize(text: str) -> str:
    return "".join(character for character in unicodedata.normalize("NFD", text) if not unicodedata.combining(character)).lower()


def split_chunks(text: str) -> list[str]:
    text = " ".join(text.split())
    return [text[start:start + CHUNK_SIZE] for start in range(0, len(text), CHUNK_SIZE - CHUNK_OVERLAP)]


def summary(document: dict) -> dict:
    return {key: document[key] for key in ("id", "name", "chunkCount", "createdAt")}


def add_pdf(name: str, content_type: str | None, data: bytes) -> dict:
    if content_type != "application/pdf":
        raise ValidationError("Solo se permiten archivos PDF")
    if len(data) > MAX_PDF_SIZE:
        raise ValidationError("El PDF supera el límite de 10 MB")
    try:
        text = "\n".join(page.extract_text() or "" for page in PdfReader(BytesIO(data)).pages).strip()
    except Exception as exc:
        raise ValidationError("No se pudo extraer texto del PDF") from exc
    if not text:
        raise ValidationError("No se pudo extraer texto del PDF")
    chunks = split_chunks(text)
    document = {
        "id": str(uuid4()), "name": name, "chunks": chunks,
        "chunkCount": len(chunks), "createdAt": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
    }
    documents[document["id"]] = document
    return summary(document)


def remove_document(document_id: str) -> None:
    if documents.pop(document_id, None) is None:
        raise NotFoundError("Documento no encontrado")


def relevant_chunks(question: str) -> list[dict]:
    terms = [term for term in re.findall(r"[a-z0-9]{3,}", normalize(question)) if term not in STOP_WORDS]
    if not terms:
        return []
    ranked = []
    for document in documents.values():
        for index, text in enumerate(document["chunks"]):
            normalized = normalize(text)
            score = sum(normalized.count(term) for term in terms)
            if score:
                ranked.append((score, {"documentId": document["id"], "documentName": document["name"], "chunkIndex": index, "text": text}))
    ranked.sort(key=lambda item: -item[0])
    return [chunk for _, chunk in ranked[:MAX_CONTEXT_CHUNKS]]
