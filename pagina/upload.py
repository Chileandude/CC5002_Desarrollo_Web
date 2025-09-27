import os
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from werkzeug.utils import secure_filename
from sqlalchemy import select
from .models import Comuna

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
CEL_RE = re.compile(r"^\+\d{2,4}\.\d{6,12}$")  # +569.12345678


def ensure_dir(path: str) -> None:
    """
    Crea el directorio si no existe (mkdir -p).
      - path: str — Ruta absoluta o relativa del directorio a asegurar.
    ->
      - None
    """
    os.makedirs(path, exist_ok=True)


def build_timestamp_name(original_filename: str, tipo: str, edad: Optional[int], unidad: Optional[str]) -> str:
    """
    Genera nombre de archivo con timestamp y metadatos (p.ej. 20250919-150245-gato-3m.jpg).
      - original_filename: str — Nombre original.
      - tipo: str — Tipo de mascota.
      - edad: Optional[int] — Edad numérica para sufijo (o None).
      - unidad: Optional[str] — Unidad ('m'/'a') para sufijo (o None).
    ->
      - str — Nombre final validado (lanza ValueError si la extensión no está permitida).
    """
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    tipo_norm = secure_filename((tipo or "mascota").lower()) or "mascota"
    if edad is not None and unidad:
        sufijo = f"{edad}{unidad[0].lower()}"  # 'a' | 'm'
    else:
        sufijo = "x"

    _, ext = os.path.splitext(original_filename or "")
    ext = ext.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Extensión de archivo no permitida: '{ext}'. "
            f"Solo se aceptan: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    return f"{ts}-{tipo_norm}-{sufijo}{ext}"


def save_uploaded_file(file_storage, upload_folder: str, tipo: str, edad: Optional[int], unidad: Optional[str]) -> str:
    """
    Guarda el archivo subido en disco y retorna el nombre final.
      - file_storage: FileStorage — Archivo subido.
      - upload_folder: str — Carpeta destino (se crea si no existe).
      - tipo: str — Tipo de mascota para el nombre final.
      - edad: Optional[int] — Edad para sufijo (o None).
      - unidad: Optional[str] — Unidad para sufijo (o None).
    ->
      - str — Nombre de archivo guardado (no incluye la ruta).
    """
    ensure_dir(upload_folder)
    final_name = build_timestamp_name(file_storage.filename, tipo, edad, unidad)
    file_path = os.path.join(upload_folder, final_name)
    file_storage.save(file_path)
    return final_name


def _norm_tipo(v: str) -> Optional[str]:
    """
    Normaliza el tipo de mascota a 'gato' | 'perro'.
      - v: str — Valor de entrada (e.g., 'gatito', 'perrito', etc.).
    ->
      - Optional[str] — 'gato'/'perro' o None si no coincide.
    """
    v = (v or "").strip().lower()
    if v in ("gato", "gatito", "g"):
        return "gato"
    if v in ("perro", "perrito", "p"):
        return "perro"
    return None


def _norm_unidad(v: str) -> Optional[str]:
    """
    Normaliza la unidad de edad a 'm' (meses) o 'a' (años).
      - v: str — Valor de entrada (e.g., 'mes', 'meses', 'año', 'años', 'm', 'a').
    ->
      - Optional[str] — 'm'/'a' o None si no coincide.
    """
    v = (v or "").strip().lower()
    if v in ("m", "mes", "meses"):
        return "m"
    if v in ("a", "año", "años"):
        return "a"
    return None


def _parse_dt(v: str) -> Optional[datetime]:
    """
    Parsea fecha-hora en formatos '%Y-%m-%dT%H:%M' o '%Y-%m-%d %H:%M'.
      - v: str — Cadena de fecha-hora.
    ->
      - Optional[datetime] — datetime válido o None si no parsea.
    """
    v = (v or "").strip()
    for fmt in ("%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(v, fmt)
        except ValueError:
            continue
    return None


def _norm_via(v: str) -> str:
    """
    Normaliza el nombre de la vía de contacto.
      - v: str — Valor de entrada (e.g., 'twitter', 'whatsapp', 'telegram', etc.).
    ->
      - str — 'X' | 'whatsapp' | 'telegram' | 'instagram' | 'tiktok' | 'otra'.
    """
    v = (v or "").strip().lower()
    if v in ("x", "twitter"):
        return "X"
    if v in ("whatsapp", "telegram", "instagram", "tiktok"):
        return v
    return "otra"


def unidad_label(unidad: Optional[str]) -> Optional[str]:
    """
    Convierte unidad corta a etiqueta para JSON.
      - unidad: Optional[str] — 'm' o 'a'.
    ->
      - Optional[str] — 'meses' | 'años' o None si no aplica.
    """
    if unidad == "m":
        return "meses"
    if unidad == "a":
        return "años"
    return None


def validate_aviso(form, files, s) -> Tuple[Optional[Dict[str, Any]], List[str]]:
    """
    Valida y normaliza datos de un aviso desde form/files.
      - form: werkzeug.datastructures.ImmutableMultiDict — Campos del formulario.
      - files: werkzeug.datastructures.MultiDict — Archivos subidos.
      - s: sqlalchemy.orm.Session — Sesión/connection para consultas.
    ->
      - Tuple[Optional[Dict[str, Any]], List[str]] —
          (data normalizada lista para persistir o None, lista de errores).
    """
    errs: List[str] = []

    # --- comuna ---
    comuna: Optional[Comuna] = None
    comuna_id: Optional[str] = form.get("comuna_id")
    comuna_nombre: Optional[str] = form.get("comuna_nombre")
    if comuna_id:
        try:
            comuna = s.get(Comuna, int(comuna_id))
        except Exception:
            comuna = None
    elif comuna_nombre:
        comuna = s.execute(select(Comuna).where(Comuna.nombre == comuna_nombre)).scalar_one_or_none()
    if not comuna:
        errs.append("Comuna no encontrada.")

    # --- campos básicos ---
    nombre: str = (form.get("nombre") or "").strip()
    email: str = (form.get("email") or "").strip()
    celular: Optional[str] = ((form.get("celular") or "").strip()) or None
    sector: Optional[str] = ((form.get("sector") or "").strip()) or None
    descripcion: Optional[str] = ((form.get("descripcion") or "").strip()) or None
    if not (3 <= len(nombre) <= 200):
        errs.append("Nombre: 3 a 200 caracteres.")
    if not EMAIL_RE.match(email):
        errs.append("Email inválido.")
    if len(email) > 100:
        errs.append("Email: máx 100 caracteres.")
    if celular:
        if not CEL_RE.match(celular):
            errs.append("Celular inválido (+NNN.NNNNNNNN).")
        elif len(celular) > 15:
            errs.append("Celular: máx 15 caracteres.")
    if sector and len(sector) > 100:
        errs.append("Sector máx 100 caracteres.")
    if descripcion and len(descripcion) > 500:
        errs.append("Descripción máx 500 caracteres.")

    # --- mascota ---
    tipo: Optional[str] = _norm_tipo(form.get("tipo"))
    if not tipo:
        errs.append("Tipo debe ser gato o perro.")

    try:
        cantidad: int = int((form.get("cantidad") or "1").strip())
    except ValueError:
        cantidad = 0
    if cantidad < 1:
        errs.append("Cantidad mínima: 1.")

    try:
        edad: int = int((form.get("edad") or "1").strip())
    except ValueError:
        edad = 0
    if edad < 1:
        errs.append("Edad mínima: 1.")

    # admitir ambos nombres desde el front: unidad_medida | unidad_edad
    unidad: Optional[str] = _norm_unidad(form.get("unidad_medida") or form.get("unidad_edad"))
    if unidad not in ("m", "a"):
        errs.append("Unidad de edad inválida (use 'meses'/'m' o 'años'/'a').")

    fecha_entrega: Optional[datetime] = _parse_dt(form.get("fecha_entrega"))
    if not fecha_entrega:
        errs.append("fecha_entrega inválida (usar YYYY-MM-DDTHH:mm).")

    # --- contactos ---
    contactos: List[Dict[str, str]] = []
    c_nombres: List[str] = form.getlist("contactos[nombre][]")
    c_ids: List[str] = form.getlist("contactos[identificador][]")
    if c_nombres or c_ids:
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

    # --- fotos ---
    fotos_files = files.getlist("fotos[]")
    fotos_files = [f for f in fotos_files if f and getattr(f, "filename", "")]
    if len(fotos_files) < 1:
        errs.append("Debes subir al menos 1 foto.")
    if len(fotos_files) > 5:
        errs.append("Máximo 5 fotos.")

    # Validar extensión de cada archivo
    for f in fotos_files:
        _, ext = os.path.splitext(f.filename or "")
        if ext.lower() not in ALLOWED_EXTENSIONS:
            errs.append(f"Extensión no permitida: {ext}. Solo {', '.join(sorted(ALLOWED_EXTENSIONS))}.")
            break

    if errs:
        return None, errs

    data: Dict[str, Any] = {
        "comuna": comuna,
        "sector": sector,
        "nombre": nombre,
        "email": email,
        "celular": celular,
        "tipo": tipo,  # 'gato' | 'perro'
        "cantidad": cantidad,
        "edad": edad,
        "unidad": unidad,  # 'm' | 'a'
        "fecha_entrega": fecha_entrega,
        "descripcion": descripcion,
        "contactos": contactos,  # [{via:'X'|'whatsapp'|..., id:str}]
        "fotos_files": fotos_files,
    }
    return data, []
