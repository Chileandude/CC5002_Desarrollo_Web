/**
 * @typedef {Object} ChartTab
 * @property {string} id           - Identificador único del tab (ej. "line", "pie", "bars")
 * @property {string} label        - Texto visible del botón
 * @property {string} src          - Ruta relativa de la imagen
 * @property {string} alt          - Texto alternativo de la imagen (accesibilidad)
 */

(function () {

  /**
   * @typedef {Object} StatisticsChartsOptions
   * @property {HTMLElement} mount          - Nodo contenedor donde se renderiza el componente
   * @property {ChartTab[]} tabs            - Definición de pestañas
   * @property {string} initialId           - ID del tab activo por defecto
   * @property {string} [viewerId]          - ID fijo del panel/visor (opcional)
   */

  class StatisticsCharts {
    /** @param {StatisticsChartsOptions} opts */
    constructor(opts) {
      if (!opts || !opts.mount) {
        throw new Error("StatisticsCharts: mount requerido");
      }
      this.mount = opts.mount;
      this.tabs = Array.isArray(opts.tabs) ? opts.tabs : [];
      this.initialId = opts.initialId || (this.tabs[0] && this.tabs[0].id) || "";
      this.viewerId = opts.viewerId || "stats-viewer";

      /** @type {number} índice del tab con foco */
      this.focusIndex = 0;

      /** @type {Map<string, HTMLButtonElement>} */
      this.tabEls = new Map();

      /** @type {HTMLImageElement|null} */
      this.imgEl = null;

      /** @type {HTMLElement|null} */
      this.errorEl = null;

      this._preloadImages();
    }

    _preloadImages() {
      this.tabs.forEach((t) => {
        const im = new Image();
        im.src = t.src;
      });
    }

    render() {
      const root = document.createElement("section");
      root.className = "stats-charts";

      const tablist = document.createElement("div");
      tablist.className = "stats-toolbar";
      tablist.setAttribute("role", "tablist");
      tablist.setAttribute("aria-label", "Seleccionar gráfico");

      this.tabs.forEach((t, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "stats-tab";
        btn.id = `tab-${t.id}`;
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-controls", this.viewerId);
        btn.setAttribute("aria-selected", "false");
        btn.setAttribute("tabindex", i === 0 ? "0" : "-1");
        btn.textContent = t.label;

        btn.addEventListener("click", () => {
          this._activateByIndex(i);
          btn.focus();
        });

        btn.addEventListener("keydown", (ev) => this._onTabKeydown(ev));

        this.tabEls.set(t.id, /** @type {HTMLButtonElement} */ (btn));
        tablist.appendChild(btn);
      });

      const panel = document.createElement("div");
      panel.className = "stats-viewer";
      panel.id = this.viewerId;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `tab-${this.initialId}`);

      const img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.loading = "eager"; // primera imagen eager, resto ya pre-cargadas
      img.addEventListener("error", () => this._showError("No se pudo cargar el gráfico."));
      img.addEventListener("load", () => this._clearError());

      this.imgEl = img;

      const errorBox = document.createElement("div");
      errorBox.className = "stats-error";
      errorBox.hidden = true;
      this.errorEl = errorBox;

      panel.appendChild(img);
      panel.appendChild(errorBox);

      root.appendChild(tablist);
      root.appendChild(panel);
      this.mount.appendChild(root);

      const initialIdx = Math.max(
        0,
        this.tabs.findIndex((t) => t.id === this.initialId)
      );
      this._activateByIndex(initialIdx, {setFocus: false});
      this.focusIndex = initialIdx;
      this._syncRovingTabindex(initialIdx);
    }

    /** @param {KeyboardEvent} ev */
    _onTabKeydown(ev) {
      const KEY = ev.key;

      if (KEY === "ArrowRight" || KEY === "ArrowLeft") {
        ev.preventDefault();
        const dir = KEY === "ArrowRight" ? 1 : -1;
        this.focusIndex = (this.focusIndex + dir + this.tabs.length) % this.tabs.length;
        const next = this._tabElByIndex(this.focusIndex);
        if (next) {
          this._syncRovingTabindex(this.focusIndex);
          next.focus();
        }
        return;
      }

      if (KEY === "Enter" || KEY === " ") {
        ev.preventDefault();
        this._activateByIndex(this.focusIndex);
      }
    }

    /** @param {number} idx */
    _tabElByIndex(idx) {
      const id = this.tabs[idx]?.id;
      return id ? this.tabEls.get(id) || null : null;
    }

    /** @param {number} focusedIdx */
    _syncRovingTabindex(focusedIdx) {
      this.tabs.forEach((t, i) => {
        const el = this.tabEls.get(t.id);
        if (!el) return;
        el.setAttribute("tabindex", i === focusedIdx ? "0" : "-1");
      });
    }

    /**
     * Activa un tab por índice: actualiza aria, imagen, alt y aria-labelledby del panel.
     * @param {number} idx
     * @param {{ setFocus?: boolean }} [opts]
     */
    _activateByIndex(idx, opts = {}) {
      const tab = this.tabs[idx];
      if (!tab || !this.imgEl) return;

      this.tabs.forEach((t, i) => {
        const el = this.tabEls.get(t.id);
        if (!el) return;
        const sel = i === idx;
        el.setAttribute("aria-selected", sel ? "true" : "false");
        if (sel) {
          this.focusIndex = idx;
        }
      });

      const panel = /** @type {HTMLElement} */ (document.getElementById(this.viewerId));
      if (panel) {
        panel.setAttribute("aria-labelledby", `tab-${tab.id}`);
      }

      this.imgEl.alt = tab.alt;
      if (this.imgEl.src !== this._toAbsUrl(tab.src)) {
        this.imgEl.src = tab.src;
      }

      if (opts.setFocus) {
        this._tabElByIndex(idx)?.focus();
      }

      this._syncRovingTabindex(idx);
    }

    /** @param {string} msg */
    _showError(msg) {
      if (this.errorEl) {
        this.errorEl.textContent = msg || "Error al cargar la imagen.";
        this.errorEl.hidden = false;
      }
    }

    _clearError() {
      if (this.errorEl) {
        this.errorEl.hidden = true;
        this.errorEl.textContent = "";
      }
    }

    _toAbsUrl(rel) {
      const a = document.createElement("a");
      a.href = rel;
      return a.href;
    }
  }

  window.StatisticsCharts = StatisticsCharts;
})();
