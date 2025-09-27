// Utilidades de validación sencillas para formularios del frontend.
class Validators {
    /**
     * Verdadero si v no es null/undefined y su string trim tiene longitud > 0.
     * @param {unknown} v
     * @returns {boolean}
     */
    static required(v) {
        return v != null && String(v).trim().length > 0;
    }

    /**
     * Valida longitud (trim) entre min y max, inclusive.
     * @param {unknown} v
     * @param {number} min
     * @param {number} max
     * @returns {boolean}
     */
    static lengthBetween(v, min, max) {
        const len = (v ?? "").trim().length;
        return len >= min && len <= max;
    }

    /**
     * Email básico: requerido, longitud 1..100 y patrón simple user@host.tld.
     * @param {unknown} v
     * @returns {boolean}
     */
    static email(v) {
        if (!this.required(v)) return false;
        if (!this.lengthBetween(v, 1, 100)) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    }

    /**
     * Celular internacional; opcional. Si viene, debe matchear +NNN.NNNNNNNN (8–12 dígitos tras el punto).
     * @param {unknown} v
     * @returns {boolean}
     */
    static celIntl(v) {
        if (!this.required(v)) return true;
        return /^\+\d{3}\.\d{8,12}$/.test(v);
    }

    /**
     * Entero requerido y >= min.
     * @param {unknown} v
     * @param {number} min
     * @returns {boolean}
     */
    static intMin(v, min) {
        if (!this.required(String(v))) return false;
        const n = Number(v);
        return Number.isInteger(n) && n >= min;
    }

    /**
     * Valida pertenencia estricta en un conjunto.
     * @template T
     * @param {T} v
     * @param {readonly T[]} options
     * @returns {boolean}
     */
    static oneOf(v, options) {
        return options.includes(v);
    }

    /**
     * Compara strings en formato 'YYYY-MM-DDThh:mm'. Retorna v >= min (orden lexicográfico).
     * @param {string} v
     * @param {string} min
     * @returns {boolean}
     */
    static datetimeLocalGte(v, min) {
        if (!this.required(v) || !this.required(min)) return false;
        return v >= min; //formato YYYY-MM-DDThh:mm
    }

    /**
     * Verdadero si file es imagen (MIME type 'image/*'); si no hay type, asume true.
     * @param {File | { type?: string } | null | undefined} file
     * @returns {boolean}
     */
    static isImageFile(file) {
        if (!file) return false;
        return !!file.type ? file.type.startsWith("image/") : true;
    }

    /**
     * Extensión permitida: .jpg | .jpeg | .png (case-insensitive).
     * @param {string | null | undefined} filename
     * @returns {boolean}
     */
    static isAllowedImageExt(filename) {
        if (!filename) return false;
        const i = filename.lastIndexOf(".");
        if (i < 0) return false;
        const ext = filename.slice(i).toLowerCase();
        return [".jpg", ".jpeg", ".png"].includes(ext);
    }
}

window.Validators = Validators;
