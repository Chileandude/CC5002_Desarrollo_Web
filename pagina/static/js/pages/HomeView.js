(function () {
    class HomeView {
        constructor() {
            /** @type {HTMLElement|null} */
            this.grid = document.getElementById("last-ads-grid");
            /** @type {AdoptionAd[]|any[]} */
            this.ads = [];
        }

        async #load() {
            this.ads = [];
            try {
                const { data } = await window.API.getLatestAds(5); // o el N que quieras
                const hasModel = typeof window.AdoptionAd?.fromJSON === "function";
                const mapped = Array.isArray(data) ? data : [];

                this.ads = mapped.map(x => (hasModel ? window.AdoptionAd.fromJSON(x) : x));

                const cmp = (a, b) => String(b?.creado_en ?? "").localeCompare(String(a?.creado_en ?? ""));
                if (hasModel && typeof window.AdoptionAd?.byCreatedAsc === "function") {
                    this.ads.sort(cmp);
                } else {
                    this.ads.sort(cmp);
                }
            } catch (e) {
                console.error(e);
                this.ads = [];
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
            const last5 = this.ads.slice(-5);

            this.grid.innerHTML = last5
                .map((ad) => window.Card.render(ad))
                .join("");
        }

        init() {
            if (!this.grid) return;
            this.grid.classList.add("loading");
            Promise.resolve()
                .then(() => this.#load())
                .then(() => this.#render())
                .finally(() => this.grid.classList.remove("loading"));
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        new HomeView().init();
    });
})();
