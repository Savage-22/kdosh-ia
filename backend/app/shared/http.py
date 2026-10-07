import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .errors import DomainError, ValidationError

logger = logging.getLogger(__name__)


def register_error_handlers(app):
    @app.exception_handler(DomainError)
    async def domain_error(request: Request, exc: DomainError):
        return JSONResponse(status_code=exc.status, content={"success": False, "message": exc.message})

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError):
        message = "Debes adjuntar un archivo PDF" if any("file" in error.get("loc", ()) for error in exc.errors()) else "La solicitud no tiene un formato válido"
        return JSONResponse(status_code=400, content={"success": False, "message": message})

    @app.exception_handler(404)
    async def not_found(request: Request, exc: Exception):
        return JSONResponse(status_code=404, content={"success": False, "message": "Ruta no encontrada"})

    @app.exception_handler(Exception)
    async def internal_error(request: Request, exc: Exception):
        logger.exception("Ocurrió un error interno", exc_info=exc)
        return JSONResponse(status_code=500, content={"success": False, "message": "Ocurrió un error interno"})


def json_body(value: object) -> dict:
    if not isinstance(value, dict):
        raise ValidationError("La solicitud no tiene un formato válido")
    return value
