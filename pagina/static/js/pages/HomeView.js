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
                const { data } = await window.API.getLatestAds(5);
                const hasModel = typeof window.AdoptionAd?.fromJSON === "function";
                const mapped = Array.isArray(data) ? data : [];

                this.ads = mapped.map(x => (hasModel ? window.AdoptionAd.fromJSON(x) : x));

                const toTs = (v) => {
                    const s = v?.creado_en ?? v?.fecha_ingreso ?? v?.fecha_disponible ?? null;
                    const t = s ? Date.parse(String(s).replace(" ", "T")) : NaN;
                    return Number.isNaN(t) ? -Infinity : t;
                };
                this.ads.sort((a, b) => toTs(b) - toTs(a));
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
            this.grid.innerHTML = this.ads
                .map((ad) => window.Card.render(ad))
                .join("");
        }

        init() {
            if (!this.grid) return;

            const run = () => {
                this.grid.classList.add("loading");
                return Promise.resolve()
                    .then(() => this.#load())
                    .then(() => this.#render())
                    .finally(() => this.grid.classList.remove("loading"));
            };
            void run();
            this._onAdCreated = () => { void run(); };
            window.addEventListener("ad-created", this._onAdCreated);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        new HomeView().init();
    });
})();
