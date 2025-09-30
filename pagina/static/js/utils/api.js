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
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
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

    window.API = { fetchJSON, getLatestAds, getAdsPage, getAdById };
})();
