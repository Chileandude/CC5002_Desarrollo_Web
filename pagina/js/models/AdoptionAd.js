(function () {
  /**
   * @typedef {"whatsapp"|"telegram"|"x"|"instagram"|"tiktok"|"otra"} ContactVia
   * @typedef {{ via: ContactVia, id: string }} ContactarPor
   *
   * @typedef {Object} AdoptionAdProps
   * @property {number} id
   * @property {string} region
   * @property {string} comuna
   * @property {string} sector
   * @property {string} contacto_nombre
   * @property {string} contacto_email
   * @property {string} contacto_celular
   * @property {ContactarPor[]=} contactar_por
   * @property {"gato"|"perro"} tipo
   * @property {number} cantidad
   * @property {number} edad
   * @property {"meses"|"años"} edad_unidad
   * @property {string} fecha_disponible // YYYY-MM-DDTHH:mm
   * @property {string=} creado_en
   * @property {string=} descripcion
   * @property {string[]} fotos
   */
  class AdoptionAd {
    /** @param {AdoptionAdProps} d */
    constructor(d) {
      this.id = d.id;
      this.region = d.region;
      this.comuna = d.comuna;
      this.sector = d.sector ?? "";
      this.contacto_nombre = d.contacto_nombre;
      this.contacto_email = d.contacto_email;
      this.contacto_celular = d.contacto_celular ?? "";
      this.contactar_por = Array.isArray(d.contactar_por) ? d.contactar_por : [];
      this.tipo = d.tipo;
      this.cantidad = d.cantidad;
      this.edad = d.edad;
      this.edad_unidad = d.edad_unidad;
      this.fecha_disponible = d.fecha_disponible;
      this.creado_en = d.creado_en;
      this.descripcion = d.descripcion ?? "";
      this.fotos = Array.isArray(d.fotos) ? d.fotos : [];
    }

    static fromJSON(raw) {
      return new AdoptionAd(raw);
    }

    static byIdAsc(a, b) {
      return a.id - b.id;
    }

    static byCreatedAsc(a, b) {
      return String(a.creado_en).localeCompare(String(b.creado_en));
    }

    static #toStr(d) {
      const pad = (n) => (n < 10 ? "0" + n : "" + n);
      return (
        d.getFullYear() +
        "-" + pad(d.getMonth() + 1) +
        "-" + pad(d.getDate()) +
        "T" + pad(d.getHours()) +
        ":" + pad(d.getMinutes())
      );
    }
  }

  window.AdoptionAd = AdoptionAd;
})();
