from typing import Any, Dict, List, Tuple
from datetime import datetime, timedelta, date

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from .db import get_session
from .models import AvisoAdopcion, Comuna, Region, ContactarPor, Foto, Comentario
from .upload import save_uploaded_file, unidad_label, validate_aviso

api_bp = Blueprint("api", __name__, url_prefix="/api")

# Formato requerido por el frontend para mostrar/guardar fechas
FMT = "%Y-%m-%d %H:%M"


def _fmt(dt: datetime | None) -> str | None:
    """
    Formatea datetime a '%Y-%m-%d %H:%M'.
      - dt: datetime | None — Fecha/hora a formatear.
    ->
      - str | None — Cadena formateada o None si dt es None.
    """
    if dt is None:
        return None
    return dt.strftime(FMT)


def _build_photo_url(ruta_archivo: str, nombre_archivo: str) -> str:
    """
    Normaliza la ruta+nombre de archivo a una URL servible '/static/...'.
      - ruta_archivo: str — Carpeta guardada en BD (p. ej. 'static/uploads' o '/static/uploads').
      - nombre_archivo: str — Nombre del archivo.
    ->
      - str — URL relativa tipo '/static/…' o cadena vacía si faltan datos.
    """
    ruta = (ruta_archivo or "").strip()
    nombre = (nombre_archivo or "").strip()
    if not ruta or not nombre:
        return ""
    base = ruta if ruta.startswith("/") else f"/{ruta}"
    if not base.endswith("/"):
        base = f"{base}/"
    return f"{base}{nombre}"


def _serialize_row(row: Tuple[AvisoAdopcion, Comuna, Region]) -> Dict[str, Any]:
    """
    Serializa un join (Aviso, Comuna, Región) al dict esperado por el front.
      - row: tuple(AvisoAdopcion, Comuna, Region) — Fila del SELECT con joins.
    ->
      - dict[str, Any] — Objeto listo para JSON (keys: id, region, comuna, …).
    """
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
    Mapea etiqueta del front a unidad corta.
      - unidad_front: str | None — 'meses'/'años'.
    ->
      - str — 'm' para meses, 'a' para años (default 'm' si vacía).
    """
    if not unidad_front:
        return "m"
    u = unidad_front.strip().lower()
    if u.startswith("a"):
        return "a"
    return "m"


def _validate_comment_payload(data: Dict[str, Any]) -> Tuple[Dict[str, str], str, str]:
    """
    Valida el payload para crear comentario.
      - data: {"nombre": str, "texto": str}
    ->
      - (errors, nombre_norm, texto_norm)
    """
    errors: Dict[str, str] = {}
    nombre = (data.get("nombre") or "").strip()
    texto = (data.get("texto") or "").strip()

    if not (3 <= len(nombre) <= 80):
        errors["nombre"] = "Debe tener entre 3 y 80 caracteres."
    if not (5 <= len(texto) <= 300):
        errors["texto"] = "Debe tener entre 5 y 300 caracteres."

    return errors, nombre, texto


@api_bp.get("/avisos")
def listar_avisos():
    """
    Listado paginado de avisos.
      - Query:
          - page: int >= 1 (default 1)
          - size: int [1..50] (default 5)
    ->
      - ResponseReturnValue — JSON con {data, page, size, total_items, total_pages}.
    """
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
      - Query:
          - limit: int [1..10] (default 5)
    ->
      - ResponseReturnValue — JSON con {"data": [...]}.
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
        rows: List[Tuple[AvisoAdopcion, Comuna, Region]] = s.execute(stmt).unique().all()
        data = [_serialize_row(r) for r in rows]

    return jsonify({"data": data})


@api_bp.get("/avisos/<int:aviso_id>")
def detalle_aviso(aviso_id: int):
    """
    Detalle de un aviso por ID.
      - aviso_id: int — Identificador del aviso.
    ->
      - ResponseReturnValue — JSON con el aviso serializado o 404.
    """
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
    """
    Lista todas las regiones (id, nombre) ordenadas alfabéticamente.
      - (None)
    ->
      - ResponseReturnValue — JSON con {"data": [{"id", "nombre"}, ...]}.
    """
    with get_session() as s:
        rows = s.execute(select(Region.id, Region.nombre).order_by(Region.nombre.asc())).all()
        data = [{"id": r.id, "nombre": r.nombre} for r in rows]
    return jsonify({"data": data})


@api_bp.get("/regiones/<int:region_id>/comunas")
def listar_comunas(region_id: int):
    """
    Lista comunas de una región.
      - region_id: int — ID de la región.
    ->
      - ResponseReturnValue — JSON con {"data": [{"id", "nombre"}, ...]}.
    """
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
    Crea un aviso y guarda sus fotos.
      - Body: multipart/form-data (ver validaciones en validate_aviso()).
    ->
      - ResponseReturnValue — JSON con el aviso creado (201) o errores (400).
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


@api_bp.get("/stats/daily")
def stats_daily():
    """
    Cantidad de avisos agregados por día en un rango.
      - Query: from=YYYY-MM-DD (opcional, default hoy-30), to=YYYY-MM-DD (opcional, default hoy)
    ->
      - JSON: {"labels": [YYYY-MM-DD, ...], "datasets": [{"label": "Avisos por día", "data": [int, ...]}]}
    """
    try:
        to_s = request.args.get("to")
        from_s = request.args.get("from")
        today = date.today()
        to_d = datetime.strptime(to_s, "%Y-%m-%d").date() if to_s else today
        from_d = datetime.strptime(from_s, "%Y-%m-%d").date() if from_s else (to_d - timedelta(days=30))
        if from_d > to_d:
            from_d, to_d = to_d, from_d
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400

    with get_session() as s:
        rows = s.execute(
            select(func.date(AvisoAdopcion.fecha_ingreso).label("dia"),
                   func.count(AvisoAdopcion.id))
            .where(AvisoAdopcion.fecha_ingreso >= datetime.combine(from_d, datetime.min.time()),
                   AvisoAdopcion.fecha_ingreso <= datetime.combine(to_d, datetime.max.time()))
            .group_by("dia")
            .order_by("dia")
        ).all()
    counts = {r[0].strftime("%Y-%m-%d"): int(r[1]) for r in rows}
    labels, data = [], []
    cur = from_d
    while cur <= to_d:
        key = cur.strftime("%Y-%m-%d")
        labels.append(key)
        data.append(counts.get(key, 0))
        cur += timedelta(days=1)

    return jsonify({
        "labels": labels,
        "datasets": [{"label": "Avisos por día", "data": data}]
    })


@api_bp.get("/stats/by-type")
def stats_by_type():
    """
    Totales de avisos por tipo de mascota.
      - None
    ->
      - JSON: {"labels": ["gato","perro"], "datasets": [{"label": "Total por tipo", "data": [gatos, perros]}]}
    """
    with get_session() as s:
        rows = s.execute(
            select(AvisoAdopcion.tipo, func.count(AvisoAdopcion.id))
            .group_by(AvisoAdopcion.tipo)
        ).all()
    totals = {t: int(c) for (t, c) in rows}
    labels = ["Gato", "Perro"]
    data = [totals.get("gato", 0), totals.get("perro", 0)]
    colors = ["#2196F3", "#FF9800"]
    return jsonify({
        "labels": labels,
        "datasets": [{"label": "Total por tipo", "data": data, "backgroundColor": colors, }]
    })


@api_bp.get("/stats/monthly")
def stats_monthly():
    """
    Cantidad de avisos por mes (dos barras por mes: gatos y perros) para un año.
      - Query: year=YYYY (opcional, default año actual)
    ->
      - JSON: {"labels": ["YYYY-01",...,"YYYY-12"], "datasets": [{"label": "Gatos",  "data": [..12..]},
                                                                 {"label": "Perros", "data": [..12..]}]}
    """
    try:
        year = int(request.args.get("year")) if request.args.get("year") else datetime.now().year
    except ValueError:
        return jsonify({"error": "Parámetro 'year' inválido"}), 400

    with get_session() as s:
        rows = s.execute(
            select(func.month(AvisoAdopcion.fecha_ingreso).label("mes"),
                   AvisoAdopcion.tipo,
                   func.count(AvisoAdopcion.id))
            .where(func.year(AvisoAdopcion.fecha_ingreso) == year)
            .group_by("mes", AvisoAdopcion.tipo)
            .order_by("mes")
        ).all()
    gatos = [0] * 12
    perros = [0] * 12
    for mes, tipo, cnt in rows:
        if 1 <= mes <= 12:
            if tipo == "gato":
                gatos[mes - 1] = int(cnt)
            elif tipo == "perro":
                perros[mes - 1] = int(cnt)

    labels = [f"{year}-{m:02d}" for m in range(1, 13)]
    return jsonify({
        "labels": labels,
        "datasets": [
            {"label": "Gatos", "data": gatos, "backgroundColor": "#2196F3"},
            {"label": "Perros", "data": perros, "backgroundColor": "#FF9800"}
        ]
    })


@api_bp.get("/avisos/<int:aviso_id>/comentarios")
def listar_comentarios(aviso_id: int):
    """
    Lista comentarios de un aviso.
      - Query:
          - offset: int >= 0 (default 0)
          - limit:  int [1..100] (default 20)
          - order:  'asc'|'desc' (default 'desc')
    ->
      - JSON: {"items":[...], "total":int, "offset":int, "limit":int, "order":str}
    """
    # parse query
    try:
        offset = max(int(request.args.get("offset", "0")), 0)
    except ValueError:
        offset = 0
    try:
        limit = int(request.args.get("limit", "20"))
        limit = max(1, min(limit, 100))
    except ValueError:
        limit = 20
    order = (request.args.get("order") or "desc").lower()
    order = "asc" if order == "asc" else "desc"

    with get_session() as s:
        # verificar existencia aviso
        exists = s.scalar(select(func.count(AvisoAdopcion.id)).where(AvisoAdopcion.id == aviso_id)) or 0
        if not exists:
            return jsonify({"error": "Aviso no encontrado"}), 404

        total = s.scalar(
            select(func.count(Comentario.id)).where(Comentario.aviso_id == aviso_id)
        ) or 0

        q = select(Comentario).where(Comentario.aviso_id == aviso_id)
        if order == "asc":
            q = q.order_by(Comentario.fecha.asc(), Comentario.id.asc())
        else:
            q = q.order_by(Comentario.fecha.desc(), Comentario.id.desc())

        rows: List[Comentario] = s.execute(q.offset(offset).limit(limit)).scalars().all()

        items = [{
            "id": c.id,
            "aviso_id": c.aviso_id,
            "nombre": c.nombre,
            "texto": c.texto,
            # usamos el mismo formato que el frontend ya consume (Card.#fmt soporta "YYYY-MM-DD HH:MM")
            "fecha": _fmt(c.fecha),
        } for c in rows]

    return jsonify({
        "items": items,
        "total": int(total),
        "offset": offset,
        "limit": limit,
        "order": order,
    })


@api_bp.post("/avisos/<int:aviso_id>/comentarios")
def crear_comentario(aviso_id: int):
    """
    Crea un comentario para un aviso.
      - Body (JSON): {"nombre": str(3..80), "texto": str(5..300)}
    ->
      - 201 con el comentario creado
      - 400 si payload inválido
      - 404 si el aviso no existe
    """
    if not request.is_json:
        return jsonify({"error": "Se requiere JSON"}), 400

    payload = request.get_json(silent=True) or {}
    errors, nombre, texto = _validate_comment_payload(payload)
    if errors:
        return jsonify({"error": "validation_error", "fields": errors}), 400

    with get_session() as s:
        # verificar existencia aviso
        exists = s.scalar(select(func.count(AvisoAdopcion.id)).where(AvisoAdopcion.id == aviso_id)) or 0
        if not exists:
            return jsonify({"error": "Aviso no encontrado"}), 404

        # persistir (seteamos la fecha en servidor)
        now = datetime.now()
        c = Comentario(
            aviso_id=aviso_id,
            nombre=nombre,
            texto=texto,
            fecha=now,
        )
        s.add(c)
        s.commit()
        s.refresh(c)

        return jsonify({
            "id": c.id,
            "aviso_id": c.aviso_id,
            "nombre": c.nombre,
            "texto": c.texto,
            "fecha": _fmt(c.fecha),
        }), 201
