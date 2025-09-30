from typing import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from .config import Config

# Credenciales indicadas
DB_URL = Config.SQLALCHEMY_DATABASE_URI


class Base(DeclarativeBase):
    """Declarative base para los modelos ORM."""
    pass


engine = create_engine(
    DB_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=1800,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@contextmanager
def get_session() -> Iterator[SessionLocal]:
    """
    Context manager que abre una sesión ORM
    y rollback ante excepciones.
      - (None)
    ->
      - Iterator[Session] — Iterador de contexto que produce una Session activa.
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
