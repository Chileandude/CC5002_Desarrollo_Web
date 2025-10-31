(function () {

    function getPageFromURL() {
        const p = parseInt(new URLSearchParams(location.search).get("page") || "1", 10);
        return Number.isFinite(p) && p > 0 ? p : 1;
    }

    function setPageInURL(newPage) {
        const url = new URL(location.href);
        url.searchParams.set("page", String(newPage));
        history.pushState({}, "", url);
    }

    class EvaluateView {
        constructor() {
            this.listMount = document.getElementById("adoptions-list");
            if (!this.listMount) throw new Error("#adoptions-list no encontrado");
            this._abortCtl = null;
            this._reqToken = 0;

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

            this.list = new window.AdoptionList(this.listMount, [], {mode: "evaluate"});

            this.rateModal = document.getElementById("rate-modal");
            this.rateForm = document.getElementById("rate-form");
            this.rateCancel = document.getElementById("rate-cancel");
            this.currentRateTarget = null;
            // Abrir/cerrar modal
            this.listMount.addEventListener("click", (ev) => {
                const btn = ev.target.closest(".btn-evaluar");
                if (!btn) return;
                const avisoId = Number(btn.dataset.avisoId);
                const row = btn.closest(".adoption-row");
                const notaCell = row?.querySelector(".col-nota");
                this.openRateModal({avisoId, btn, notaCell});
            });
            this.rateCancel.addEventListener("click", () => this.closeRateModal());
            this.rateModal.addEventListener("click", (e) => {
                if (e.target && e.target.hasAttribute("data-rate-close")) this.closeRateModal();
            });
            this.rateForm.addEventListener("submit", (e) => {
                e.preventDefault();
                void this.submitRate();
            });
            // Escape para cerrar
            document.addEventListener("keydown", (e) => {
                if (!this.isRateOpen()) return;
                if (e.key === "Escape") this.closeRateModal();
            });

            this.totalPages = 1;
            this.current = 1;
            // Paginación
            this.pg.first.addEventListener("click", () => this.goTo(1));
            this.pg.prev.addEventListener("click", () => this.goTo(this.current - 1));
            this.pg.next.addEventListener("click", () => this.goTo(this.current + 1));
            this.pg.last.addEventListener("click", () => this.goTo(this.totalPages));

        }

        async fetchPage(page) {
            // Reutiliza tu API actual. Idealmente backend ya retorna nota_promedio y notas_count
            const {data, page: p, size, total_pages, total_items} = await window.API.getAdsPage(page, 5);
            return {data, page: p, size, total_pages, total_items};
        }

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

        _setPaginatorBusy(busy) {
            this.pg.first.disabled = busy || this.pg.first.disabled;
            this.pg.prev.disabled = busy || this.pg.prev.disabled;
            this.pg.next.disabled = busy || this.pg.next.disabled;
            this.pg.last.disabled = busy || this.pg.last.disabled;
            this.pg.root.classList.toggle("is-loading", !!busy);
        }

        async load(page) {
            if (this._abortCtl) this._abortCtl.abort();
            this._abortCtl = new AbortController();
            const token = ++this._reqToken;
            const prevHeight = this.listMount.offsetHeight;
            if (prevHeight > 0) this.listMount.style.minHeight = `${prevHeight}px`;
            this.listMount.innerHTML = `<p class="loading">Cargando avisos…</p>`;
            this._setPaginatorBusy(true);
            try {
                const payload = await this.fetchPage(page, this._abortCtl.signal);
                if (token !== this._reqToken) return;
                const data = Array.isArray(payload?.data) ? payload.data : [];
                data.sort((a, b) => Number(b.id) - Number(a.id));
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

        goTo(dest) {
            if (dest < 1 || dest > this.totalPages) return;
            setPageInURL(dest);
            void this.load(dest);
        }

        init() {
            void this.load(getPageFromURL());
            window.addEventListener("popstate", () => this.load(getPageFromURL()));
        }


        isRateOpen() {
            return this.rateModal && this.rateModal.style.display !== "none";
        }

        openRateModal(ctx) {
            this.currentRateTarget = ctx;
            this.rateForm.querySelectorAll('input[name="nota"]').forEach(r => { r.checked = false; });
            this.rateModal.style.display = "block"; // <— mostrar
            const first = this.rateForm.querySelector('input[name="nota"]');
            if (first) first.focus();
        }

        closeRateModal() {
            this.rateModal.style.display = "none"; // <— ocultar
            this.currentRateTarget = null;
        }

        async submitRate() {
            if (!this.currentRateTarget) return;
            const {avisoId, btn, notaCell} = this.currentRateTarget;

            const sel = this.rateForm.querySelector('input[name="nota"]:checked');
            if (!sel) {
                alert("Seleccione una nota entre 1 y 7.");
                return;
            }
            const nota = Number.parseInt(sel.value, 10);
            if (!Number.isInteger(nota) || nota < 1 || nota > 7) {
                alert("La nota debe ser un número entero entre 1 y 7.");
                return;
            }

            btn.disabled = true;
            const submitBtn = this.rateForm.querySelector("#rate-submit");
            if (submitBtn) submitBtn.disabled = true;

            try {
                const {nuevoPromedio, nuevoConteo} = await window.API.postRating(avisoId, nota);
                if (notaCell) {
                    const c = Number(nuevoConteo || 0);
                    notaCell.dataset.count = String(c);
                    notaCell.textContent = (c > 0 && Number.isFinite(Number(nuevoPromedio)))
                        ? String(Math.round(Number(nuevoPromedio) * 100) / 100)
                        : "–";
                }
                this.closeRateModal();
            } catch (err) {
                console.error(err);
                alert(err?.message || "No se pudo guardar la nota");
            } finally {
                btn.disabled = false;
                if (submitBtn) submitBtn.disabled = false;
            }
        }


        /**
         * Maneja la acción Evaluar de una fila.
         * @param {number} avisoId
         * @param {HTMLButtonElement} btn
         */
        async onEvaluate() {
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        new EvaluateView().init();
    });
})();
