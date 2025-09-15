class Validators {
  static required(v) {
    return v != null && String(v).trim().length > 0;
  }

  static lengthBetween(v, min, max) {
    const len = (v ?? "").trim().length;
    return len >= min && len <= max;
  }

  static email(v) {
    if (!this.required(v)) return false;
    if (!this.lengthBetween(v, 1, 100)) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  static celIntl(v) {
    if (!this.required(v)) return true;
    return /^\+\d{3}\.\d{8,12}$/.test(v);
  }

  static intMin(v, min) {
    if (!this.required(String(v))) return false;
    const n = Number(v);
    return Number.isInteger(n) && n >= min;
  }

  static oneOf(v, options) {
    return options.includes(v);
  }

  static datetimeLocalGte(v, min) {
    if (!this.required(v) || !this.required(min)) return false;
    return v >= min; //formato YYYY-MM-DDThh:mm
  }
}

window.Validators = Validators;
