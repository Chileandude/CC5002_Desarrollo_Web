(function () {
    class StatsView {
        /**
         * @param {{ mount?: HTMLElement | null }} [opts]
         */
        constructor(opts = {}) {
            this.mount = opts.mount ?? document.getElementById("main");
            if (!this.mount) throw new Error("StatsView: no se encontró #main");
            this.charts = null;
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

            const currentYear = new Date().getFullYear();

            const charts = new window.StatisticsCharts({
                mount: chartsMount,
                initialId: "line",
                viewerId: "stats-viewer",
                tabs: [
                    {
                        id: "line",
                        label: "Línea (por día)",
                        type: "line",
                        fetcher: () => window.API.getStatsDaily(), // backend: últimos 30 días por defecto
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {display: false},
                                tooltip: {mode: "index", intersect: false},
                                title: {display: false}
                            },
                            scales: {
                                x: {
                                    ticks: {maxRotation: 0, autoSkip: true},
                                    title: {display: true, text: "Día"}
                                },
                                y: {
                                    beginAtZero: true,
                                    title: {display: true, text: "Cantidad"},
                                    ticks: {precision: 0}
                                }
                            },
                            elements: {line: {tension: 0.25}}
                        }
                    },
                    {
                        id: "pie",
                        label: "Torta (por tipo)",
                        type: "pie",
                        fetcher: () => window.API.getStatsByType(),
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {position: "bottom"},
                                title: {display: false}
                            }
                        }
                    },
                    {
                        id: "bars",
                        label: "Barras (por mes)",
                        type: "bar",
                        fetcher: () => window.API.getStatsMonthly(currentYear),
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {position: "top"},
                                title: {display: false}
                            },
                            scales: {
                                x: {
                                    stacked: false,
                                    title: {display: true, text: "Mes"}
                                },
                                y: {
                                    beginAtZero: true,
                                    stacked: false,
                                    title: {display: true, text: "Cantidad"},
                                    ticks: {precision: 0}
                                }
                            }
                        }
                    }
                ]
            });

            charts.render();
            this.charts = charts;
        }

        /** Limpia la vista y destruye el componente de gráficos. */
        destroy() {
            if (this.charts && typeof this.charts.destroy === "function") {
                this.charts.destroy();
            }
            this.charts = null;
            if (this.mount) this.mount.innerHTML = "";
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
