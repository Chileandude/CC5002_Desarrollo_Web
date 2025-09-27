from typing import List, Optional
from datetime import datetime
from sqlalchemy import (
    Integer, String, ForeignKey, Text, Enum, DateTime
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .db import Base

SCHEMA = "tarea2"

TipoMascota = Enum("gato", "perro", name="tipo_mascota", native_enum=False, create_constraint=False)
UnidadMedida = Enum("a", "m", name="unidad_medida", native_enum=False, create_constraint=False)
ViaContacto = Enum("whatsapp", "telegram", "X", "instagram", "tiktok", "otra",
                   name="via_contacto", native_enum=False, create_constraint=False)


class Region(Base):
    """
    Modelo Región.
      - Campos:
        - id: int
        - nombre: str (≤200)
      - Relaciones:
        - comunas: List[Comuna]
    ->
      - Tabla 'tarea2.region'
    """
    __tablename__ = "region"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)

    comunas: Mapped[List["Comuna"]] = relationship(back_populates="region")


class Comuna(Base):
    """
    Modelo Comuna.
      - Campos:
        - id: int
        - nombre: str (≤200)
        - region_id: int (FK → region.id)
      - Relaciones:
        - region: Region
        - avisos: List[AvisoAdopcion]
    ->
      - Tabla 'tarea2.comuna'
    """
    __tablename__ = "comuna"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    region_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(f"{SCHEMA}.region.id", ondelete="NO ACTION", onupdate="NO ACTION"),
        nullable=False,
        index=True,
    )

    region: Mapped["Region"] = relationship(back_populates="comunas")
    avisos: Mapped[List["AvisoAdopcion"]] = relationship(back_populates="comuna")


class AvisoAdopcion(Base):
    """
    Modelo Aviso de Adopción.
      - Campos:
        - id: int
        - fecha_ingreso: datetime
        - comuna_id: int (FK → comuna.id)
        - sector: Optional[str] (≤100)
        - nombre: str (≤200)
        - email: str (≤100)
        - celular: Optional[str] (≤15)
        - tipo: Mapped[str] ('gato'|'perro')
        - cantidad: int
        - edad: int
        - unidad_medida: Mapped[str] ('a'|'m')
        - fecha_entrega: datetime
        - descripcion: Optional[str] (Text, ≤500)
      - Relaciones:
        - comuna: Comuna
        - fotos: List[Foto]
        - contactos: List[ContactarPor]
    ->
      - Tabla 'tarea2.aviso_adopcion'
    """
    __tablename__ = "aviso_adopcion"
    __table_args__ = {"schema": SCHEMA}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    fecha_ingreso: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    comuna_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(f"{SCHEMA}.comuna.id", ondelete="NO ACTION", onupdate="NO ACTION"),
        nullable=False,
        index=True,
    )
    sector: Mapped[Optional[str]] = mapped_column(String(100))
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(100), nullable=False)
    celular: Mapped[Optional[str]] = mapped_column(String(15))
    tipo: Mapped[str] = mapped_column(TipoMascota, nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    edad: Mapped[int] = mapped_column(Integer, nullable=False)
    unidad_medida: Mapped[str] = mapped_column(UnidadMedida, nullable=False)
    fecha_entrega: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text(500))

    comuna: Mapped["Comuna"] = relationship(back_populates="avisos")

    fotos: Mapped[List["Foto"]] = relationship(
        back_populates="aviso",
        cascade="all, delete-orphan",
        passive_deletes=False,
    )
    contactos: Mapped[List["ContactarPor"]] = relationship(
        back_populates="aviso",
        cascade="all, delete-orphan",
        passive_deletes=False,
    )


class Foto(Base):
    """
    Modelo Foto asociada a un aviso.
      - Campos:
        - id: int (PK parte 1)
        - ruta_archivo: str (≤300)
        - nombre_archivo: str (≤300)
        - aviso_id: int (PK parte 2, FK → aviso_adopcion.id)
      - Relaciones:
        - aviso: AvisoAdopcion
    ->
      - Tabla 'tarea2.foto' (PK compuesta: id, aviso_id)
    """
    __tablename__ = "foto"
    __table_args__ = {"schema": SCHEMA}

    # PK compuesta (id, aviso_id)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    ruta_archivo: Mapped[str] = mapped_column(String(300), nullable=False)
    nombre_archivo: Mapped[str] = mapped_column(String(300), nullable=False)
    aviso_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(f"{SCHEMA}.aviso_adopcion.id", ondelete="NO ACTION", onupdate="NO ACTION"),
        primary_key=True,
        nullable=False,
        index=True,
    )

    aviso: Mapped["AvisoAdopcion"] = relationship(back_populates="fotos")


class ContactarPor(Base):
    """
    Modelo de medio de contacto de un aviso.
      - Campos:
        - id: int (PK parte 1)
        - nombre: Mapped[str] ('whatsapp'|'telegram'|'X'|'instagram'|'tiktok'|'otra')
        - identificador: str (≤150)
        - aviso_id: int (PK parte 2, FK → aviso_adopcion.id)
      - Relaciones:
        - aviso: AvisoAdopcion
    ->
      - Tabla 'tarea2.contactar_por' (PK compuesta: id, aviso_id)
    """
    __tablename__ = "contactar_por"
    __table_args__ = {"schema": SCHEMA}

    # PK compuesta (id, aviso_id)
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(ViaContacto, nullable=False)
    identificador: Mapped[str] = mapped_column(String(150), nullable=False)
    aviso_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey(f"{SCHEMA}.aviso_adopcion.id", ondelete="NO ACTION", onupdate="NO ACTION"),
        primary_key=True,
        nullable=False,
        index=True,
    )

    aviso: Mapped["AvisoAdopcion"] = relationship(back_populates="contactos")
