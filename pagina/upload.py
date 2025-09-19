import os
import re
from datetime import datetime
from werkzeug.utils import secure_filename
from sqlalchemy import select
from .models import Comuna

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def build_timestamp_name(original_filename: str, tipo: str, edad: int | None, unidad: str | None) -> str:
    """
    Devuelve un nombre como: 20250919-150245-gato-3m.jpg
    """
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    tipo_norm = secure_filename((tipo or "mascota").lower()) or "mascota"
    if edad is not None and unidad:
        sufijo = f"{edad}{unidad[0].lower()}"  # años -> a, meses -> m
    else:
        sufijo = "x"

    _, ext = os.path.splitext(original_filename or "")
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        # por si viene sin extensión o una no permitida, fuerza .jpg
        ext = ".jpg"

    return f"{ts}-{tipo_norm}-{sufijo}{ext}"


def save_uploaded_file(file_storage, upload_folder: str, tipo: str, edad: int | None, unidad: str | None) -> str:
    """
    Guarda el archivo y retorna el nombre final.
    """
    ensure_dir(upload_folder)
    final_name = build_timestamp_name(file_storage.filename, tipo, edad, unidad)
    file_path = os.path.join(upload_folder, final_name)
    file_storage.save(file_path)
    return final_name


# ----
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
CEL_RE = re.compile(r"^\+\d{2,4}\.\d{6,12}$")  # +569.12345678


def _norm_tipo(v: str) -> str | None:
    v = (v or "").strip().lower()
    if v in ("gato", "gatito"):
        return "gato"
    if v in ("perro", "perrito"):
        return "perro"
    return None


def _norm_unidad(v: str) -> str | None:
    v = (v or "").strip().lower()
    if v in ("m", "mes", "meses"):
        return "m"
    if v in ("a", "año", "años"):
        return "a"
    return None


def _parse_dt(v: str) -> datetime | None:
    v = (v or "").strip()
    for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(v, fmt)
        except ValueError:
            continue
    return None


def _norm_via(v: str) -> str:
    v = (v or "").strip().lower()
    if v in ("x", "twitter"):
        return "X"
    if v in ("whatsapp", "telegram", "instagram", "tiktok"):
        return v
    return "otra"


def validate_aviso(form, files, s):
    """
    Valida y normaliza los datos de un aviso desde form.
    Retorna (data, errores) donde:
      - data: dict normalizado o None
      - errores: lista de strings
    """
    errs = []

    # comuna
    comuna = None
    comuna_id = form.get("comuna_id")
    comuna_nombre = form.get("comuna_nombre")
    if comuna_id:
        try:
            comuna = s.get(Comuna, int(comuna_id))
        except Exception:
            comuna = None
    elif comuna_nombre:
        comuna = s.execute(
            select(Comuna).where(Comuna.nombre == comuna_nombre)
        ).scalar_one_or_none()
    if not comuna:
        errs.append("Comuna no encontrada.")

    # básicos
    nombre = (form.get("nombre") or "").strip()
    email = (form.get("email") or "").strip()
    celular = (form.get("celular") or "").strip() or None
    sector = (form.get("sector") or "").strip() or None
    descripcion = (form.get("descripcion") or "").strip() or None

    if not (3 <= len(nombre) <= 200):
        errs.append("Nombre: 3 a 200 caracteres.")
    if not EMAIL_RE.match(email):
        errs.append("Email inválido.")
    if celular and not CEL_RE.match(celular):
        errs.append("Celular inválido (+NNN.NNNNNNNN).")
    if sector and len(sector) > 100:
        errs.append("Sector máx 100 caracteres.")
    if descripcion and len(descripcion) > 500:
        errs.append("Descripción máx 500 caracteres.")

    # mascota
    tipo = _norm_tipo(form.get("tipo"))
    if not tipo:
        errs.append("Tipo debe ser gato o perro.")

    try:
        cantidad = int(form.get("cantidad", "1"))
    except ValueError:
        cantidad = 0
    if cantidad < 1:
        errs.append("Cantidad mínima: 1.")

    try:
        edad = int(form.get("edad", "1"))
    except ValueError:
        edad = 0
    if edad < 1:
        errs.append("Edad mínima: 1.")

    unidad = _norm_unidad(form.get("unidad_medida") or form.get("unidad_edad"))
    if unidad not in ("m", "a"):
        errs.append("Unidad de edad inválida.")

    fecha_entrega = _parse_dt(form.get("fecha_entrega"))
    if not fecha_entrega:
        errs.append("fecha_entrega inválida (usar YYYY-MM-DDTHH:mm).")

    # contactos
    contactos = []
    c_nombres = form.getlist("contactos[nombre][]")
    c_ids = form.getlist("contactos[identificador][]")
    if len(c_nombres) != len(c_ids):
        errs.append("Contactos desbalanceados.")
    else:
        if len(c_nombres) > 5:
            errs.append("Máximo 5 contactos.")
        for via, ident in zip(c_nombres, c_ids):
            ident = (ident or "").strip()
            if not (4 <= len(ident) <= 150):
                errs.append("Cada contacto: 4 a 150 caracteres.")
            contactos.append({"via": _norm_via(via), "id": ident})

    # fotos
    fotos_files = files.getlist("fotos[]")
    fotos_files = [f for f in fotos_files if f and getattr(f, "filename", "")]
    if len(fotos_files) < 1:
        errs.append("Debes subir al menos 1 foto.")
    if len(fotos_files) > 5:
        errs.append("Máximo 5 fotos.")

    if errs:
        return None, errs

    return {
        "comuna": comuna,
        "sector": sector,
        "nombre": nombre,
        "email": email,
        "celular": celular,
        "tipo": tipo,
        "cantidad": cantidad,
        "edad": edad,
        "unidad": unidad,
        "fecha_entrega": fecha_entrega,
        "descripcion": descripcion,
        "contactos": contactos,
        "fotos_files": fotos_files,
    }, []
