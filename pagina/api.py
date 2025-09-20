from typing import Any, Dict, List, Tuple
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from .db import get_session
from .models import AvisoAdopcion, Comuna, Region, ContactarPor, Foto
from .upload import save_uploaded_file, unidad_label, validate_aviso

api_bp = Blueprint("api", __name__, url_prefix="/api")

# Formato requerido por el frontend para mostrar/guardar fechas
FMT = "%Y-%m-%d %H:%M"


def _fmt(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.strftime(FMT)


def _build_photo_url(ruta_archivo: str, nombre_archivo: str) -> str:
    """
    En BD tenemos 'ruta_archivo' + 'nombre_archivo'.
    El front espera strings servibles. Asumimos rutas tipo 'static/uploads' o '/static/uploads'.
    Normalizamos a '/static/...'.
    """
    ruta = (ruta_archivo or "").strip()
    nombre = (nombre_archivo or "").strip()
    if not ruta or not nombre:
        return ""
    # Asegurar prefijo "/" y un único separador
    base = ruta if ruta.startswith("/") else f"/{ruta}"
    if not base.endswith("/"):
        base = f"{base}/"
    return f"{base}{nombre}"


def _serialize_row(row: Tuple[AvisoAdopcion, Comuna, Region]) -> Dict[str, Any]:
    aviso, comuna, region = row
    fotos = [_build_photo_url(f.ruta_archivo, f.nombre_archivo) for f in aviso.fotos]
    contactos = [{"via": c.nombre, "id": c.identificador} for c in aviso.contactos]

    return {
        "id": aviso.id,
        "region": region.nombre if region else None,
        "comuna": comuna.nombre if comuna else None,
        "sector": aviso.sector,
        "contacto_nombre": aviso.nombre,
        "contacto_email": aviso.email,
        "contacto_celular": aviso.celular,
        "contactar_por": contactos,
        "tipo": aviso.tipo,  # 'gato' | 'perro'
        "cantidad": aviso.cantidad,
        "edad": aviso.edad,
        "edad_unidad": aviso.unidad_medida,  # 'a' | 'm'
        "fecha_disponible": _fmt(aviso.fecha_entrega),
        "creado_en": _fmt(aviso.fecha_ingreso),
        "descripcion": aviso.descripcion,
        "fotos": [p for p in fotos if p],
    }


def _unidad_from_front(unidad_front: str | None) -> str:
    """
    'meses'/'años' -> 'm'/'a'
    """
    if not unidad_front:
        return "m"
    u = unidad_front.strip().lower()
    if u.startswith("a"):
        return "a"
    return "m"


@api_bp.get("/avisos")
def listar_avisos():
    """
    Listado paginado de avisos.
    Query params:
      - page: int >= 1 (default 1)
      - size: int [1..50] (default 5)
    """
    # Sanitizar page/size
    try:
        page = int(request.args.get("page", "1"))
        size = int(request.args.get("size", "5"))
    except ValueError:
        return jsonify({"error": "Parámetros inválidos"}), 400

    if page < 1:
        page = 1
    if size < 1 or size > 50:
        size = 5

    offset = (page - 1) * size

    with get_session() as s:
        total_items = s.scalar(select(func.count(AvisoAdopcion.id))) or 0

        stmt = (
            select(AvisoAdopcion, Comuna, Region)
            .join(Comuna, Comuna.id == AvisoAdopcion.comuna_id)
            .join(Region, Region.id == Comuna.region_id)
            .options(
                joinedload(AvisoAdopcion.fotos),
                joinedload(AvisoAdopcion.contactos),
            )
            .order_by(AvisoAdopcion.fecha_ingreso.desc(), AvisoAdopcion.id.desc())
            .limit(size)
            .offset(offset)
        )
        rows: List[Tuple[AvisoAdopcion, Comuna, Region]] = s.execute(stmt).unique().all()
        data = [_serialize_row(r) for r in rows]

    total_pages = (total_items + size - 1) // size if size else 0

    return jsonify(
        {
            "data": data,
            "page": page,
            "size": size,
            "total_items": total_items,
            "total_pages": total_pages,
        }
    )


@api_bp.get("/avisos/latest")
def ultimos_avisos():
    """
    Últimos N avisos por fecha_ingreso desc.
    Query params:
      - limit: int [1..10] (default 5)
    """
    try:
        limit = int(request.args.get("limit", "5"))
    except ValueError:
        return jsonify({"error": "Parámetro 'limit' inválido"}), 400
    if limit < 1:
        limit = 1
    if limit > 10:
        limit = 10

    with get_session() as s:
        stmt = (
            select(AvisoAdopcion, Comuna, Region)
            .join(Comuna, Comuna.id == AvisoAdopcion.comuna_id)
            .join(Region, Region.id == Comuna.region_id)
            .options(
                joinedload(AvisoAdopcion.fotos),
                joinedload(AvisoAdopcion.contactos),
            )
            .order_by(AvisoAdopcion.fecha_ingreso.desc(), AvisoAdopcion.id.desc())
            .limit(limit)
        )
        rows = s.execute(stmt).unique().all()
        data = [_serialize_row(r) for r in rows]

    return jsonify({"data": data})


@api_bp.get("/avisos/<int:aviso_id>")
def detalle_aviso(aviso_id: int):
    """Detalle de un aviso por id."""
    with get_session() as s:
        stmt = (
            select(AvisoAdopcion, Comuna, Region)
            .join(Comuna, Comuna.id == AvisoAdopcion.comuna_id)
            .join(Region, Region.id == Comuna.region_id)
            .options(
                joinedload(AvisoAdopcion.fotos),
                joinedload(AvisoAdopcion.contactos),
            )
            .where(AvisoAdopcion.id == aviso_id)  # type: ignore[arg-type]
        )
        row = s.execute(stmt).first()

        if not row:
            return jsonify({"error": "Aviso no encontrado"}), 404

        return jsonify(_serialize_row(row))


@api_bp.get("/regiones")
def listar_regiones():
    with get_session() as s:
        rows = s.execute(select(Region.id, Region.nombre).order_by(Region.nombre.asc())).all()
        data = [{"id": r.id, "nombre": r.nombre} for r in rows]
    return jsonify({"data": data})


@api_bp.get("/regiones/<int:region_id>/comunas")
def listar_comunas(region_id: int):
    with get_session() as s:
        rows = s.execute(
            select(Comuna.id, Comuna.nombre)
            .where(Comuna.region_id == region_id)  # type: ignore[arg-type]
            .order_by(Comuna.nombre.asc())
        ).all()
        data = [{"id": c.id, "nombre": c.nombre} for c in rows]
    return jsonify({"data": data})


@api_bp.post("/avisos")
def crear_aviso():
    """
    Crea un aviso + guarda fotos.
    Espera multipart/form-data (ver docstring original).
    """
    form = request.form
    files = request.files

    with get_session() as s:
        data, errs = validate_aviso(form, files, s)
        if errs:
            return jsonify({"errores": errs}), 400

        # Persistencia
        aviso = AvisoAdopcion(
            fecha_ingreso=datetime.now(),
            comuna_id=data["comuna"].id,
            sector=data["sector"],
            nombre=data["nombre"],
            email=data["email"],
            celular=data["celular"],
            tipo=data["tipo"],  # 'gato' | 'perro'
            cantidad=data["cantidad"],
            edad=data["edad"],
            unidad_medida=data["unidad"],  # 'm' | 'a' (DB enum/char)
            fecha_entrega=data["fecha_entrega"],
            descripcion=data["descripcion"],
        )
        s.add(aviso)
        s.flush()  # obtener aviso.id

        # Contactos (si vienen)
        for c in data["contactos"]:
            s.add(ContactarPor(
                nombre=c["via"],  # 'X' | 'whatsapp' | ...
                identificador=c["id"],
                aviso_id=aviso.id,
            ))

        # Fotos
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        for f in data["fotos_files"]:
            nombre_archivo = save_uploaded_file(
                f,
                upload_folder=upload_folder,
                tipo=data["tipo"],
                edad=data["edad"],
                unidad=data["unidad"],
            )
            s.add(Foto(
                ruta_archivo="static/uploads",
                nombre_archivo=nombre_archivo,
                aviso_id=aviso.id,
            ))

        s.commit()

        # Respuesta
        region = s.get(Region, data["comuna"].region_id)
        fotos_urls = [f"/static/uploads/{f.nombre_archivo}" for f in (aviso.fotos or [])]
        contactos = [{"via": c.nombre, "id": c.identificador} for c in (aviso.contactos or [])]

        return jsonify({
            "id": aviso.id,
            "region": region.nombre if region else None,
            "comuna": data["comuna"].nombre,
            "sector": aviso.sector,
            "contacto_nombre": aviso.nombre,
            "contacto_email": aviso.email,
            "contacto_celular": aviso.celular,
            "contactar_por": contactos,
            "tipo": aviso.tipo,
            "cantidad": aviso.cantidad,
            "edad": aviso.edad,
            "edad_unidad": unidad_label(aviso.unidad_medida),  # 'meses' | 'años'
            "fecha_disponible": aviso.fecha_entrega.strftime("%Y-%m-%d %H:%M"),
            "creado_en": aviso.fecha_ingreso.strftime("%Y-%m-%d %H:%M"),
            "descripcion": aviso.descripcion,
            "fotos": fotos_urls,
        }), 201
