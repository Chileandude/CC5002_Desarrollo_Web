(function () {
    /**
     * Base de la API (inyectable por el entorno).
     * @type {string}
     */
    const API_BASE = window.API_BASE ?? "/api";


    /**
     * Hace GET y parsea JSON.
     * @template T
     * @param {string} url
     * @returns {Promise<T>}
     */
    async function fetchJSON(url) {
        const res = await fetch(url, {headers: {"Accept": "application/json"}});
        if (!res.ok) throw new Error(`Error ${res.status} al pedir ${url}`);
        return res.json();
    }

    /**
     * Obtiene los últimos avisos.
     * @param {number} [limit=5] - Límite [1..10]
     * @returns {Promise<LatestResponse>}
     */
    async function getLatestAds(limit = 5) {
        const u = new URL(`${API_BASE}/avisos/latest`, window.location.origin);
        u.searchParams.set("limit", String(limit));
        return fetchJSON(u.toString());
    }


    /**
     * Obtiene una página del listado de avisos.
     * @param {number} [page=1] - Página (>=1)
     * @param {number} [size=5] - Tamaño [1..50]
     * @returns {Promise<PageResponse>}
     */
    async function getAdsPage(page = 1, size = 5) {
        const u = new URL(`${API_BASE}/avisos`, window.location.origin);
        u.searchParams.set("page", String(page));
        u.searchParams.set("size", String(size));
        return fetchJSON(u.toString()); // => { data, page, size, total_pages, total_items }
    }

    /**
     * Obtiene un aviso por id.
     * @param {number|string} id
     * @returns {Promise<AdSerialized>}
     */
    async function getAdById(id) {
        const u = new URL(`${API_BASE}/avisos/${id}`, window.location.origin);
        return fetchJSON(u.toString());
    }

    /**
     * Estadística: avisos por día en un rango.
     * @param {{ from?: string, to?: string }} [opts]
     * @returns {Promise<{ labels: string[], datasets: Array<{ label: string, data: number[] }> }>}
     */
    async function getStatsDaily(opts = {}) {
        const u = new URL(`${API_BASE}/stats/daily`, window.location.origin);
        if (opts.from) u.searchParams.set("from", opts.from);
        if (opts.to) u.searchParams.set("to", opts.to);
        return fetchJSON(u.toString());
    }

    /**
     * Estadística: totales por tipo.
     * @returns {Promise<{ labels: string[], datasets: Array<{ label: string, data: number[] }> }>}
     */
    async function getStatsByType() {
        const u = new URL(`${API_BASE}/stats/by-type`, window.location.origin);
        return fetchJSON(u.toString());
    }

    /**
     * Estadística: barras por mes para un año.
     * @param {number} [year] - Año (YYYY). Si no se indica, lo define el backend.
     * @returns {Promise<{ labels: string[], datasets: Array<{ label: string, data: number[] }> }>}
     */
    async function getStatsMonthly(year) {
        const u = new URL(`${API_BASE}/stats/monthly`, window.location.origin);
        if (year) u.searchParams.set("year", String(year));
        return fetchJSON(u.toString());
    }

    window.API = {
        fetchJSON,
        getLatestAds,
        getAdsPage,
        getAdById,
        getStatsDaily,
        getStatsByType,
        getStatsMonthly,
    };
})();
