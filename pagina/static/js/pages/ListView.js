(function () {

    /**
     * Lee el número de página desde la URL (?page=).
     * @returns {number} Página actual (>= 1).
     */
    function getPageFromURL() {
        const p = parseInt(new URLSearchParams(location.search).get("page") || "1", 10);
        return Number.isFinite(p) && p > 0 ? p : 1;
    }

    /**
     * Actualiza ?page= en la URL.
     * @param {number} newPage
     * @returns {void}
     */
    function setPageInURL(newPage) {
        const url = new URL(location.href);
        url.searchParams.set("page", String(newPage));
        history.pushState({}, "", url);
    }

    /**
     * Vista de listado: pagina, pide datos y renderiza AdoptionList.
     */
    class ListView {
        constructor() {
            this.listMount = document.getElementById("adoptions-list");
            if (!this.listMount) throw new Error("#adoptions-list no encontrado");
            this._abortCtl = null;
            this._reqToken = 0;

            // Paginador
            this.pg = {
                root: document.getElementById("paginator"),
                first: document.getElementById("pg-first"),
                prev: document.getElementById("pg-prev"),
                info: document.getElementById("pg-info"),
                next: document.getElementById("pg-next"),
                last: document.getElementById("pg-last"),
            };
            for (const [k, el] of Object.entries(this.pg)) {
                if (!el) throw new Error(`#${k === 'root' ? 'paginator' : 'pg-' + k} no encontrado`);
            }

            this.list = new window.AdoptionList(this.listMount, []);
            this.totalPages = 1;
            this.current = 1;

            // Listeners fijos
            this.pg.first.addEventListener("click", () => this.goTo(1));
            this.pg.prev.addEventListener("click", () => this.goTo(this.current - 1));
            this.pg.next.addEventListener("click", () => this.goTo(this.current + 1));
            this.pg.last.addEventListener("click", () => this.goTo(this.totalPages));
        }

        /**
         * Pide una página al backend.
         * @param {number} page
         * @param {AbortSignal} signal
         * @returns {Promise<>}
         */        async fetchPage(page, signal) {
            const {data, page: p, size, total_pages, total_items} = await window.API.getAdsPage(page, 5);
            return {data, page: p, size, total_pages, total_items};
        }


        /**
         * Actualiza el estado visual del paginador (botones y contador).
         * @returns {void}
         */
        updatePaginatorUI() {
            this.pg.info.textContent = ` ${this.current} de ${this.totalPages} `;
            const atFirst = this.current <= 1;
            const atLast = this.current >= this.totalPages;

            this.pg.first.disabled = atFirst;
            this.pg.prev.disabled = atFirst;
            this.pg.next.disabled = atLast;
            this.pg.last.disabled = atLast;

            this.pg.root.style.visibility = this.totalPages > 1 ? "visible" : "hidden";
        }

        /**
         * Marca el paginador como ocupado/libre.
         * @param {boolean} busy
         * @returns {void}
         */
        _setPaginatorBusy(busy) {
            // Evita doble clic y estados inconsistentes durante carga
            this.pg.first.disabled = busy || this.pg.first.disabled;
            this.pg.prev.disabled = busy || this.pg.prev.disabled;
            this.pg.next.disabled = busy || this.pg.next.disabled;
            this.pg.last.disabled = busy || this.pg.last.disabled;
            if (this.pg.root) this.pg.root.classList.toggle("is-loading", !!busy);
        }

        /**
         * Carga una página y renderiza la lista.
         * @param {number} page
         * @returns {Promise<void>}
         */
        async load(page) {
            if (this._abortCtl) this._abortCtl.abort();
            this._abortCtl = new AbortController();
            const token = ++this._reqToken;
            const prevHeight = this.listMount.offsetHeight;
            if (prevHeight > 0) {
                this.listMount.style.minHeight = `${prevHeight}px`;
            }
            this.listMount.innerHTML = `<p class="loading">Cargando avisos…</p>`;
            this._setPaginatorBusy(true);
            try {
                const payload = await this.fetchPage(page, this._abortCtl.signal);
                if (token !== this._reqToken) return;
                const data = Array.isArray(payload?.data) ? payload.data : [];
                this.totalPages = Number(payload?.total_pages || 0) || 1;
                this.current = Number(payload?.page || page) || 1;

                this.list.data = data;
                this.list.render();

                this.updatePaginatorUI();
            } catch (e) {
                if (e && (e.name === "AbortError" || e.code === 20)) return;

                console.error(e);
                this.listMount.innerHTML = `<p class="error">No se pudieron cargar los avisos.</p>`;
                this.pg.first.disabled = this.pg.prev.disabled = true;
                this.pg.next.disabled = this.pg.last.disabled = true;
                if (this.pg.info) this.pg.info.textContent = " — ";
            } finally {
                setTimeout(() => {
                    if (token === this._reqToken) this.listMount.style.minHeight = "";
                    if (token === this._reqToken) this._setPaginatorBusy(false);
                }, 0);
            }
        }

        /**
         * Navega a una página válida y dispara la carga.
         * @param {number} dest
         * @returns {void}
         */
        goTo(dest) {
            if (dest < 1 || dest > this.totalPages) return;
            setPageInURL(dest);
            void this.load(dest);
        }

        /**
         * Punto de entrada: carga inicial y wiring del popstate.
         * @returns {void}
         */
        init() {
            void this.load(getPageFromURL());
            window.addEventListener("popstate", () => this.load(getPageFromURL()));
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        new ListView().init();
    });
})();
