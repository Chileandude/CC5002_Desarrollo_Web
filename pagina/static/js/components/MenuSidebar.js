class MenuSidebar {
    /**
     * @param {Object} [opts]
     * @param {number} [opts.openWidth=200]
     * @param {number} [opts.closedWidth=56]
     * @param {string} [opts.brandHtml="icono"]
     * @param {HTMLElement|null} [opts.mainEl=document.getElementById("main")]
     */
    constructor(opts = {}) {
        this.isOpen = false;
        this.openWidth = opts.openWidth ?? 150;
        this.closedWidth = opts.closedWidth ?? 56;
        this.brandHtml = opts.brandHtml ?? "icono";
        this.mainEl = opts.mainEl ?? document.getElementById("main");

        /** @type {HTMLElement|null} */
        this.container = null;
        /** @type {HTMLDivElement|null} */
        this.backdrop = null;

        this._prevMainMarginLeft = "";   // para restaurar margin-left del main
        this._toggleBtn = null;          // referencia al botón para devolver foco

        this.open = this.open.bind(this);
        this.close = this.close.bind(this);
        this.toggle = this.toggle.bind(this);
        this._onKeydown = this._onKeydown.bind(this);
    }

    render() {
        this.container = document.createElement("aside");
        this.container.className = "sidenav sidenav--closed";
        this.container.id = this.container.id || "sidenav";
        this.container.setAttribute("role", "complementary");
        this.container.style.width = `${this.closedWidth}px`;
        this.container.setAttribute("aria-hidden", "true");

        // Fallback seguro
        const R = (window.ROUTES ?? {});
        const hrefHome  = R.home  ?? "#";
        const hrefList  = R.list  ?? "#";
        const hrefStats = R.stats ?? "#";

        this.container.innerHTML = `
      <button type="button" class="sidenav__toggle"
              aria-label="Abrir menú" aria-expanded="false"
              aria-controls="${this.container.id}">
        <span class="sidenav__brand">${this.brandHtml}</span>
        <span class="sidenav__chevron" aria-hidden="true">»</span>
      </button>
      <nav class="sidenav__links" aria-label="Navegación principal" id="${this.container.id}-nav">
        <a href="${hrefHome}">Inicio</a>
        <a href="${hrefList}">Listado</a>
        <a href="${hrefStats}">Estadísticas</a>
      </nav>
    `;

        this._bindEvents();
        this._ensureBackdrop();
        document.addEventListener("keydown", this._onKeydown);

        // sincroniza el margen del main al estado "cerrado" inicial
        if (this.mainEl) {
            this._prevMainMarginLeft = this.mainEl.style.marginLeft || "";
            this.mainEl.style.marginLeft = `${this.closedWidth}px`;
        }

        return this.container;
    }

    /** listeners internos */
    _bindEvents() {
        const btn = this.container.querySelector(".sidenav__toggle");
        if (btn) {
            btn.addEventListener("click", () => this.toggle());
            this._toggleBtn = btn;
        }
        // Cerrar al navegar (útil en móvil), sin tocar estilos
        this.container.querySelectorAll(".sidenav__links a").forEach(a => {
            a.addEventListener("click", () => {
                if (window.innerWidth < 900) this.close();
            });
        });
    }

    /** Crea el backdrop  */
    _ensureBackdrop() {
        if (this.backdrop) return;
        const bd = document.createElement("div");
        bd.className = "sidenav-backdrop";
        bd.setAttribute("aria-hidden", "true");
        bd.addEventListener("click", this.close);
        document.body.appendChild(bd);
        this.backdrop = bd;
    }

    /** Cerrar con tecla Escape cuando está abierta */
    _onKeydown(e) {
        if (this.isOpen && e.key === "Escape") this.close();
    }

    /** Abre la barra lateral */
    open() {
        if (!this.container) return;
        this.container.classList.remove("sidenav--closed");
        this.container.classList.add("sidenav--open");
        this.container.style.width = `${this.openWidth}px`;
        this.container.setAttribute("aria-hidden", "false");

        this._updateToggleBtn("Cerrar menú", true, "«");

        if (this.mainEl) {
            this._prevMainMarginLeft = this.mainEl.style.marginLeft || "";
            this.mainEl.style.marginLeft = `${this.openWidth}px`;
        }
        if (this.backdrop) this.backdrop.classList.add("is-visible");
        if (window.innerWidth < 900) document.body.style.overflow = "hidden";
        this.isOpen = true;

        // enfoca primer enlace
        const firstLink = this.container.querySelector(".sidenav__links a");
        if (firstLink) firstLink.focus();
    }

    /** Cierra la barra lateral */
    close() {
        if (!this.container) return;
        this.container.classList.remove("sidenav--open");
        this.container.classList.add("sidenav--closed");
        this.container.style.width = `${this.closedWidth}px`;
        this.container.setAttribute("aria-hidden", "true");

        this._updateToggleBtn("Abrir menú", false, "»");

        if (this.mainEl) {
            // restaurar el margen previo si existía; si no, usar ancho cerrado
            this.mainEl.style.marginLeft =
                this._prevMainMarginLeft !== "" ? this._prevMainMarginLeft : `${this.closedWidth}px`;
        }
        if (this.backdrop) this.backdrop.classList.remove("is-visible");
        document.body.style.overflow = "";
        this.isOpen = false;

        if (this._toggleBtn) this._toggleBtn.focus();
    }

    /** Cambia entre abierto y cerrado */
    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    /** Actualiza texto/atributos del botón de toggle */
    _updateToggleBtn(label, expanded, chev) {
        const btn = this.container.querySelector(".sidenav__toggle");
        if (!btn) return;
        btn.setAttribute("aria-label", label);
        btn.setAttribute("aria-expanded", String(expanded));
        const icon = btn.querySelector(".sidenav__chevron");
        if (icon) icon.textContent = chev;
    }

    /** Limpieza opcional si alguna vista recrea el sidebar */
    destroy() {
        document.removeEventListener("keydown", this._onKeydown);
        if (this.backdrop) {
            this.backdrop.removeEventListener("click", this.close);
            this.backdrop.remove();
            this.backdrop = null;
        }
        if (this.container) {
            const btn = this.container.querySelector(".sidenav__toggle");
            if (btn) btn.removeEventListener("click", this.toggle);
            this.container.remove();
            this.container = null;
        }
        if (this.mainEl) this.mainEl.style.marginLeft = this._prevMainMarginLeft;
        document.body.style.overflow = "";
    }
}
