(function () {
    class StatsView {
        /**
         * @param {{ mount?: HTMLElement | null }} [opts]
         */
        constructor(opts = {}) {
            this.mount = opts.mount ?? document.getElementById("main");
            if (!this.mount) throw new Error("StatsView: no se encontró #main");
        }

        render() {
            this.mount.innerHTML = "";

            const page = document.createElement("div");
            page.className = "stats-page";

            // Título
            const h1 = document.createElement("h1");
            h1.className = "stats-title";
            h1.textContent = "Estadísticas";
            page.appendChild(h1);

            // Contenedor para tabs + visor
            const chartsMount = document.createElement("div");
            page.appendChild(chartsMount);

            this.mount.appendChild(page);

            // Instancia del componente
            const charts = new window.StatisticsCharts({
                mount: chartsMount,
                initialId: "line",
                viewerId: "stats-viewer",
                tabs: [
                    {
                        id: "line",
                        label: "Línea (por día)",
                        src: "static/assets/img/Picture1.png",
                        alt:
                            "Gráfico de líneas: avisos de adopción por día. Eje X: días; Eje Y: cantidad.",
                    },
                    {
                        id: "pie",
                        label: "Torta (por tipo)",
                        src: "static/assets/img/Picture2.png",
                        alt:
                            "Gráfico de torta: total de avisos por tipo de mascota (gato y perro).",
                    },
                    {
                        id: "bars",
                        label: "Barras (por mes)",
                        src: "static/assets/img/Picture3.png",
                        alt:
                            "Gráfico de barras agrupadas por mes: una barra para gatos y otra para perros. Eje Y: cantidad.",
                    },
                ],
            });

            charts.render();
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        try {
            const view = new StatsView();
            view.render();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }
    });
    window.StatsView = StatsView;
})();
