(function () {
    class HomeView {
        constructor() {
            /** @type {HTMLElement|null} */
            this.grid = document.getElementById("last-ads-grid");
            /** @type {AdoptionAd[]|any[]} */
            this.ads = [];
        }

        #load() {
            const raw = Array.isArray(window.ADOPTIONS_DUMMY) ? window.ADOPTIONS_DUMMY : [];
            const hasModel = typeof window.AdoptionAd?.fromJSON === "function";

            this.ads = raw.map((x) => (hasModel ? window.AdoptionAd.fromJSON(x) : x));

            if (hasModel && typeof window.AdoptionAd?.byCreatedAsc === "function") {
                this.ads.sort(window.AdoptionAd.byCreatedAsc);
            } else {
                this.ads.sort((a, b) =>
                    String(a?.creado_en ?? "").localeCompare(String(b?.creado_en ?? ""))
                );
            }
        }

        #render() {
            if (!this.grid) return;

            // Asegura layout correcto
            this.grid.classList.remove("home-grid");
            this.grid.classList.add("home-list");

            if (!this.ads.length) {
                this.grid.innerHTML = `<p class="empty">No hay avisos recientes.</p>`;
                return;
            }

            // Últimos 5, más recientes primero
            const last5 = this.ads.slice(-5).reverse();

            this.grid.innerHTML = last5
                .map((ad) => window.Card.render(ad))
                .join("");
        }

        init() {
            if (!this.grid) return;
            this.#load();
            this.#render();
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        new HomeView().init();
    });
})();
