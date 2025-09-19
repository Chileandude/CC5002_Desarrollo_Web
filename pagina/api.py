# pagina/api.py
from typing import Any, Dict, List, Tuple
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from .db import get_session
from .models import AvisoAdopcion, Comuna, Region, ContactarPor, Foto
from .upload import save_uploaded_file

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
            .where(AvisoAdopcion.id == aviso_id)
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
            .where(Comuna.region_id == region_id)
            .order_by(Comuna.nombre.asc())
        ).all()
        data = [{"id": c.id, "nombre": c.nombre} for c in rows]
    return jsonify({"data": data})


@api_bp.post("/avisos")
def crear_aviso():
    """
    Crea un aviso + guarda fotos.
    Espera multipart/form-data:
      - region (nombre de región)
      - comuna_id (int) O comuna_nombre (str)
      - sector (str)
      - nombre (str)
      - email (str)
      - celular (str)
      - tipo ('Gato'|'Perro' o 'gato'|'perro')
      - cantidad (int)
      - edad (int)
      - unidad_edad ('meses'|'años')
      - fecha_entrega ('YYYY-MM-DDTHH:mm')
      - descripcion (str)
      - contactos[nombre][] + contactos[identificador][]  (opcional arrays paralelos)
      - fotos[] (varias imágenes)
    """
    form = request.form
    files = request.files

    # Campos básicos
    tipo_in = (form.get("tipo") or "").strip().lower()
    if tipo_in in ("gato", "gatito"):
        tipo = "gato"
    else:
        tipo = "perro"  # default conservador si el front ya valida

    try:
        cantidad = int(form.get("cantidad", "1"))
    except ValueError:
        cantidad = 1

    try:
        edad = int(form.get("edad", "1"))
    except ValueError:
        edad = 1

    unidad = _unidad_from_front(form.get("unidad_edad"))
    fecha_entrega_raw = form.get("fecha_entrega")  # viene como YYYY-MM-DDTHH:mm
    try:
        fecha_entrega = datetime.strptime(fecha_entrega_raw, "%Y-%m-%dT%H:%M")
    except Exception:
        return jsonify({"error": "fecha_entrega inválida (usar YYYY-MM-DDTHH:mm)"}), 400

    comuna_id = form.get("comuna_id")
    comuna_nombre = form.get("comuna_nombre")

    with get_session() as s:
        comuna: Comuna | None = None
        if comuna_id:
            try:
                comuna = s.get(Comuna, int(comuna_id))
            except ValueError:
                comuna = None
        elif comuna_nombre:
            comuna = s.execute(select(Comuna).where(Comuna.nombre == comuna_nombre)).scalar_one_or_none()

        if not comuna:
            return jsonify({"error": "Comuna no encontrada"}), 400

        aviso = AvisoAdopcion(
            fecha_ingreso=datetime.now(),
            comuna_id=comuna.id,
            sector=(form.get("sector") or None),
            nombre=form.get("nombre") or "",
            email=form.get("email") or "",
            celular=(form.get("celular") or None),
            tipo=tipo,
            cantidad=cantidad,
            edad=edad,
            unidad_medida=unidad,
            fecha_entrega=fecha_entrega,
            descripcion=(form.get("descripcion") or None),
        )
        s.add(aviso)
        s.flush()  # para obtener aviso.id

        # Contactos opcionales (par de arrays)
        # contactos[nombre][]=instagram  contactos[identificador][]=@miCuenta
        contactos_nombre = request.form.getlist("contactos[nombre][]")
        contactos_ident = request.form.getlist("contactos[identificador][]")
        for via, ident in zip(contactos_nombre, contactos_ident):
            via_norm = (via or "").strip().lower()
            # normaliza 'twitter'->'X'
            if via_norm == "twitter" or via_norm == "x":
                via_db = "X"
            elif via_norm == "whatsapp":
                via_db = "whatsapp"
            elif via_norm == "telegram":
                via_db = "telegram"
            elif via_norm == "instagram":
                via_db = "instagram"
            elif via_norm == "tiktok":
                via_db = "tiktok"
            else:
                via_db = "otra"

            s.add(ContactarPor(
                nombre=via_db,
                identificador=(ident or "")[:150],
                aviso_id=aviso.id
            ))

        # Fotos
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        fotos_files = files.getlist("fotos[]")
        for f in fotos_files:
            if not f or not f.filename:
                continue
            nombre_archivo = save_uploaded_file(
                f, upload_folder=upload_folder, tipo=tipo, edad=edad, unidad=unidad
            )
            # Guardamos en BD apuntando a /static/uploads/<nombre>
            s.add(Foto(
                ruta_archivo="static/uploads",
                nombre_archivo=nombre_archivo,
                aviso_id=aviso.id
            ))

        s.commit()

        # Serializa para respuesta
        # (re-usa tu serializer existente)
        # Trae region y comuna para el JSON final
        region = s.get(Region, comuna.region_id)
        fotos_urls = [f"/static/uploads/{f.nombre_archivo}" for f in aviso.fotos]
        contactos = [{"via": c.nombre, "id": c.identificador} for c in aviso.contactos]

        return jsonify({
            "id": aviso.id,
            "region": region.nombre if region else None,
            "comuna": comuna.nombre,
            "sector": aviso.sector,
            "contacto_nombre": aviso.nombre,
            "contacto_email": aviso.email,
            "contacto_celular": aviso.celular,
            "contactar_por": contactos,
            "tipo": aviso.tipo,
            "cantidad": aviso.cantidad,
            "edad": aviso.edad,
            "edad_unidad": aviso.unidad_medida,
            "fecha_disponible": aviso.fecha_entrega.strftime("%Y-%m-%d %H:%M"),
            "creado_en": aviso.fecha_ingreso.strftime("%Y-%m-%d %H:%M"),
            "descripcion": aviso.descripcion,
            "fotos": fotos_urls,
        }), 201


