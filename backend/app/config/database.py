import psycopg

from .env import database_url


async def verify_database_connection() -> None:
    async with await psycopg.AsyncConnection.connect(database_url()) as connection:
        await connection.execute("SELECT 1")
