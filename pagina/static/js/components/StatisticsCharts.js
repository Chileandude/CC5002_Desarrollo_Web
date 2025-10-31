/**
 * @typedef {Object} ChartPayload
 * @property {string[]} labels
 * @property {Array<any>} datasets
 */

/**
 * @typedef {Object} ChartTab
 * @property {string} id                         - Identificador del tab (ej. "line", "pie", "bars")
 * @property {string} label                      - Texto visible del botón
 * @property {"line"|"bar"|"pie"} type           - Tipo de gráfico Chart.js
 * @property {() => Promise<ChartPayload>} fetcher - Función que retorna {labels, datasets}
 * @property {object} [options]                  - Opciones específicas para Chart.js (opcional)
 */

(function () {
    /**
     * @typedef {Object} StatisticsChartsOptions
     * @property {HTMLElement} mount        - Nodo contenedor donde se renderiza el componente
     * @property {ChartTab[]} tabs          - Definición de pestañas
     * @property {string} initialId         - ID del tab activo por defecto
     * @property {string} [viewerId]        - ID del panel/visor (opcional, default "stats-viewer")
     */

    class StatisticsCharts {
        /** @param {StatisticsChartsOptions} opts */
        constructor(opts) {
            if (!opts || !opts.mount) throw new Error("StatisticsCharts: mount requerido");
            this.mount = opts.mount;
            this.tabs = Array.isArray(opts.tabs) ? opts.tabs : [];
            this.initialId = opts.initialId || (this.tabs[0] && this.tabs[0].id) || "";
            this.viewerId = opts.viewerId || "stats-viewer";

            /** @type {number} índice del tab con foco */
            this.focusIndex = 0;

            /** @type {Map<string, HTMLButtonElement>} */
            this.tabEls = new Map();

            /** @type {HTMLCanvasElement|null} */
            this.canvasEl = null;

            /** @type {HTMLElement|null} */
            this.panelEl = null;

            /** @type {HTMLElement|null} */
            this.errorEl = null;

            /** @type {import('chart.js').Chart|null} */
            this.chart = null;

            /** @type {HTMLElement|null} raíz del componente para cleanup */
            this.root = null;
        }

        render() {
            // Estado vacío
            if (!this.tabs.length) {
                const fallback = document.createElement("div");
                fallback.className = "stats-charts";
                fallback.textContent = "No hay gráficos disponibles.";
                this.mount.appendChild(fallback);
                this.root = fallback;
                return;
            }

            const root = document.createElement("div");
            root.className = "stats-charts";
            this.root = root;

            const tablist = document.createElement("div");
            tablist.className = "stats-toolbar";
            tablist.setAttribute("role", "tablist");
            tablist.setAttribute("aria-label", "Seleccionar gráfico");
            tablist.setAttribute("aria-orientation", "horizontal");

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
                    this._activateByIndex(i).then(() => btn.focus());
                });

                btn.addEventListener("keydown", (ev) => this._onTabKeydown(ev));

                this.tabEls.set(t.id, /** @type {HTMLButtonElement} */ (btn));
                tablist.appendChild(btn);
            });

            // Panel visor + canvas + caja de error
            const panel = document.createElement("div");
            panel.className = "stats-viewer";
            panel.id = this.viewerId;
            panel.setAttribute("role", "tabpanel");
            panel.setAttribute("aria-labelledby", `tab-${this.initialId}`);
            this.panelEl = panel;

            const canvas = document.createElement("canvas");
            canvas.setAttribute("role", "img");
            canvas.setAttribute("aria-label", "Gráfico");
            this.canvasEl = canvas;

            const errorBox = document.createElement("div");
            errorBox.className = "stats-error";
            errorBox.hidden = true;
            this.errorEl = errorBox;

            panel.appendChild(canvas);
            panel.appendChild(errorBox);

            root.appendChild(tablist);
            root.appendChild(panel);
            this.mount.appendChild(root);

            // Activación inicial
            const initialIdx = Math.max(
                0,
                this.tabs.findIndex((t) => t.id === this.initialId)
            );
            // Marcar aria-selected inicial para evitar parpadeo semántico
            this.tabs.forEach((t, i) => {
                const el = this.tabEls.get(t.id);
                if (el) el.setAttribute("aria-selected", i === initialIdx ? "true" : "false");
            });

            this._syncRovingTabindex(initialIdx);
            this.focusIndex = initialIdx;

            // Cargar datos y pintar gráfico inicial
            void this._activateByIndex(initialIdx, { setFocus: false });
        }

        /**
         * Manejo de teclado en tabs (←/→/Home/End para foco, Enter/Espacio para activar)
         * @param {KeyboardEvent} ev
         */
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
            if (KEY === "Home") {
                ev.preventDefault();
                this.focusIndex = 0;
                const first = this._tabElByIndex(0);
                if (first) {
                    this._syncRovingTabindex(0);
                    first.focus();
                }
                return;
            }
            if (KEY === "End") {
                ev.preventDefault();
                this.focusIndex = this.tabs.length - 1;
                const last = this._tabElByIndex(this.focusIndex);
                if (last) {
                    this._syncRovingTabindex(this.focusIndex);
                    last.focus();
                }
                return;
            }
            if (KEY === "Enter" || KEY === " ") {
                ev.preventDefault();
                void this._activateByIndex(this.focusIndex);
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
         * Activa un tab por índice: actualiza aria y renderiza el gráfico Chart.js con datos del fetcher.
         * @param {number} idx
         * @param {{ setFocus?: boolean }} [opts]
         */
        async _activateByIndex(idx, opts = {}) {
            const tab = this.tabs[idx];
            if (!tab || !this.canvasEl) return;

            // Actualiza aria-selected y foco
            this.tabs.forEach((t, i) => {
                const el = this.tabEls.get(t.id);
                if (el) el.setAttribute("aria-selected", i === idx ? "true" : "false");
            });
            if (this.panelEl) this.panelEl.setAttribute("aria-labelledby", `tab-${tab.id}`);
            this._syncRovingTabindex(idx);
            if (opts.setFocus) this._tabElByIndex(idx)?.focus();
            this.focusIndex = idx;

            // Traer datos
            let payload;
            try {
                payload = await tab.fetcher(); // { labels, datasets }
            } catch (_e) {
                this._showError("No se pudo cargar datos del gráfico.");
                return;
            }
            if (!payload || !Array.isArray(payload.labels) || !Array.isArray(payload.datasets)) {
                this._showError("Respuesta de datos inválida.");
                return;
            }
            this._clearError();

            // Destruir gráfico previo si existe
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }

            // Crear nuevo gráfico
            const cfg = {
                type: tab.type,
                data: {
                    labels: payload.labels,
                    datasets: payload.datasets
                },
                options: tab.options || {}
            };

            this.chart = new Chart(this.canvasEl.getContext("2d"), cfg);
        }

        /** @param {string} msg */
        _showError(msg) {
            if (this.errorEl) {
                this.errorEl.textContent = msg || "Error al cargar datos.";
                this.errorEl.hidden = false;
            }
        }

        _clearError() {
            if (this.errorEl) {
                this.errorEl.hidden = true;
                this.errorEl.textContent = "";
            }
        }

        /** Limpia listeners, DOM y destruye el gráfico. */
        destroy() {
            try {
                // Remover listeners (reemplazo de nodos de tab por clones)
                this.tabs.forEach((t) => {
                    const el = this.tabEls.get(t.id);
                    if (el && el.parentNode) {
                        const clone = el.cloneNode(true);
                        el.parentNode.replaceChild(clone, el);
                    }
                });
                this.tabEls.clear();

                if (this.chart) {
                    this.chart.destroy();
                    this.chart = null;
                }

                if (this.root && this.root.parentNode) {
                    this.root.parentNode.removeChild(this.root);
                }
            } finally {
                this.canvasEl = null;
                this.panelEl = null;
                this.errorEl = null;
                this.root = null;
            }
        }
    }

    window.StatisticsCharts = StatisticsCharts;
})();
