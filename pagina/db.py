from typing import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Credenciales indicadas
DB_URL = "mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2?charset=utf8"


class Base(DeclarativeBase):
    pass


# Engine: no creamos tablas; solo nos conectamos
engine = create_engine(
    DB_URL,
    echo=False,
    pool_pre_ping=True,
    pool_recycle=1800,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


@contextmanager
def get_session() -> Iterator[SessionLocal]:
    """Context manager para sesiones seguras."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
