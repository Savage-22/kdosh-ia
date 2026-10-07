from io import BytesIO

import httpx
import pytest
from fastapi.testclient import TestClient
from pypdf import PdfWriter

from app import main
from app.modules.documents.application import document_service as documents
from app.modules.documents.application import rag_service
from app.modules.openrouter.application import openrouter_service
from app.modules.usage.infrastructure import usage_model


@pytest.fixture(autouse=True)
def isolate_app(monkeypatch):
    async def verify():
        pass

    monkeypatch.setattr(main, "validate_environment", lambda: None)
    monkeypatch.setattr(main, "verify_database_connection", verify)
    documents.documents.clear()
    yield
    documents.documents.clear()


def test_health_and_errors():
    with TestClient(main.app) as client:
        assert client.get("/health").json() == {"success": True, "data": {"status": "ok"}}
        assert client.get("/missing").json() == {"success": False, "message": "Ruta no encontrada"}
        response = client.post("/api/openrouter/chat", json={"model": "test", "messages": []})
        assert response.status_code == 400
        assert response.json()["message"] == "Debes enviar al menos un mensaje"
        assert client.post("/api/documents/ask", json={"question": " "}).status_code == 400


def test_documents_lifecycle_and_rag(monkeypatch):
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    # Text extraction from blank pages is empty; the API must reject them.
    pdf = BytesIO()
    writer.write(pdf)
    with TestClient(main.app) as client:
        response = client.post("/api/documents", files={"file": ("empty.pdf", pdf.getvalue(), "application/pdf")})
        assert response.status_code == 400
        assert client.get("/api/documents").json()["data"] == []
        assert client.post("/api/documents", files={"file": ("bad.txt", b"abc", "text/plain")}).status_code == 400
        assert client.post("/api/documents", files={"file": ("large.pdf", b"0" * (documents.MAX_PDF_SIZE + 1), "application/pdf")}).json()["message"] == "El PDF supera el límite de 10 MB"

        monkeypatch.setattr(documents, "PdfReader", lambda data: type("Reader", (), {"pages": [type("Page", (), {"extract_text": lambda self: "La clave secreta es aurora."})()]})())
        response = client.post("/api/documents", files={"file": ("notes.pdf", b"pdf", "application/pdf")})
        assert response.status_code == 201
        doc = response.json()["data"]
        assert doc["chunkCount"] == 1
        assert client.get("/api/documents").json()["data"] == [doc]
        assert client.post("/api/documents/ask", json={"question": "algo inexistente"}).json()["data"]["sources"] == []

        async def fake_completion(body, request_type, sources):
            assert request_type == "rag"
            assert sources[0]["documentId"] == doc["id"]
            assert "aurora" in body["messages"][0]["content"]
            return {"choices": [{"message": {"content": "aurora"}}], "usage": {"total_tokens": 3}}

        monkeypatch.setattr(rag_service.openrouter_service, "create_completion", fake_completion)
        answer = client.post("/api/documents/ask", json={"model": "test", "question": "clave secreta"}).json()["data"]
        assert answer["answer"] == "aurora"
        assert answer["sources"][0]["chunkIndex"] == 1
        assert answer["usage"]["total_tokens"] == 3
        assert client.delete(f'/api/documents/{doc["id"]}').json()["message"] == "Documento eliminado"
        assert client.delete(f'/api/documents/{doc["id"]}').status_code == 404


def test_openrouter_and_usage_routes(monkeypatch):
    async def provider(path, payload=None):
        if path == "/models":
            return {"data": [{"id": "test-model"}]}
        assert payload["model"] == "test-model"
        return {"id": "gen-1", "choices": [{"message": {"content": "hola"}}], "usage": {"cost": 0.01}}

    recorded = []

    async def record(*args):
        recorded.append(args)

    async def summary():
        return [{"model": "test-model", "requestCount": 1, "totalCostUsd": "0.01"}]

    monkeypatch.setattr(openrouter_service, "request_openrouter", provider)
    monkeypatch.setattr(openrouter_service, "record_usage", record)
    monkeypatch.setattr(usage_model, "usage_summary", summary)
    with TestClient(main.app) as client:
        assert client.get("/api/openrouter/models").json()["data"] == [{"id": "test-model"}]
        response = client.post("/api/openrouter/chat", json={"model": "test-model", "messages": [{"role": "user", "content": "hola"}]})
        assert response.json()["data"]["id"] == "gen-1"
        assert recorded[0][:2] == ("chat", "test-model")
        assert client.get("/api/usage/summary").json()["data"][0]["requestCount"] == 1


def test_provider_error_preserves_expected_status(monkeypatch):
    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def request(self, method, url, **kwargs):
            return httpx.Response(429, json={"error": {"message": "Límite alcanzado"}})

    monkeypatch.setattr(openrouter_service.httpx, "AsyncClient", lambda **kwargs: FakeClient())
    monkeypatch.setattr(openrouter_service, "openrouter_headers", lambda: {})
    with TestClient(main.app) as client:
        response = client.get("/api/openrouter/models")
        assert response.status_code == 429
        assert response.json() == {"success": False, "message": "Límite alcanzado"}
