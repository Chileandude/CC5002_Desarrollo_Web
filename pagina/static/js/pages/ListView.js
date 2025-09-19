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

    class ListView {
        constructor() {
            this.listMount = document.getElementById("adoptions-list");
            if (!this.listMount) throw new Error("#adoptions-list no encontrado");

            // Paginador
            this.pg = {
                root:  document.getElementById("paginator"),
                first: document.getElementById("pg-first"),
                prev:  document.getElementById("pg-prev"),
                info:  document.getElementById("pg-info"),
                next:  document.getElementById("pg-next"),
                last:  document.getElementById("pg-last"),
            };

            this.list = new window.AdoptionList(this.listMount, []);
            this.totalPages = 1;
            this.current = 1;

            // Listeners fijos (una vez)
            this.pg.first.addEventListener("click", () => this.goTo(1));
            this.pg.prev.addEventListener("click",  () => this.goTo(this.current - 1));
            this.pg.next.addEventListener("click",  () => this.goTo(this.current + 1));
            this.pg.last.addEventListener("click",  () => this.goTo(this.totalPages));
        }

        async fetchPage(page) {
            const url = new URL("/api/avisos", location.origin);
            url.searchParams.set("page", String(page));
            url.searchParams.set("size", "5");

            const res = await fetch(url, { headers: { "Accept": "application/json" } });
            const text = await res.text();                 // fuerza UTF-8
            if (!res.ok) throw new Error(text || res.statusText);
            return JSON.parse(text);
        }

        updatePaginatorUI() {
            this.pg.info.textContent = ` ${this.current} de ${this.totalPages} `;
            const atFirst = this.current <= 1;
            const atLast  = this.current >= this.totalPages;

            this.pg.first.disabled = atFirst;
            this.pg.prev.disabled  = atFirst;
            this.pg.next.disabled  = atLast;
            this.pg.last.disabled  = atLast;

            this.pg.root.style.visibility = this.totalPages > 1 ? "visible" : "hidden";
        }

        async load(page) {
            this.listMount.innerHTML = `<p class="loading">Cargando avisos…</p>`;
            try {
                const payload = await this.fetchPage(page);
                const data = Array.isArray(payload?.data) ? payload.data : [];
                this.totalPages = Number(payload?.total_pages || 0) || 1;
                this.current = Number(payload?.page || page) || 1;

                this.list.data = data;
                this.list.render();

                this.updatePaginatorUI();
            } catch (e) {
                console.error(e);
                this.listMount.innerHTML = `<p class="error">No se pudieron cargar los avisos.</p>`;
                this.pg.root.style.visibility = "hidden";
            }
        }

        goTo(dest) {
            if (dest < 1 || dest > this.totalPages) return;
            setPageInURL(dest);
            this.load(dest);
        }

        init() {
            this.load(getPageFromURL());
            window.addEventListener("popstate", () => this.load(getPageFromURL()));
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        new ListView().init();
    });
})();
