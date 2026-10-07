import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Falta la variable de entorno: {name}")
    return value


def validate_environment() -> None:
    required("OPENROUTER_API_KEY")
    required("DATABASE_URL")


def database_url() -> str:
    return required("DATABASE_URL")


def openrouter_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {required('OPENROUTER_API_KEY')}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("OPENROUTER_APP_URL", "http://localhost:5173"),
        "X-Title": os.getenv("OPENROUTER_APP_NAME", "Kdosh IA Demo"),
    }
