(function () {
    const API_BASE = window.API_BASE ?? "/api";

    async function fetchJSON(url) {
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) throw new Error(`Error ${res.status} al pedir ${url}`);
        return res.json();
    }

    async function getLatestAds(limit = 5) {
        const u = new URL(`${API_BASE}/avisos/latest`, window.location.origin);
        u.searchParams.set("limit", String(limit));
        return fetchJSON(u.toString()); // => { data: [...] }
    }

    async function getAdsPage(page = 1, size = 5) {
        const u = new URL(`${API_BASE}/avisos`, window.location.origin);
        u.searchParams.set("page", String(page));
        u.searchParams.set("size", String(size));
        return fetchJSON(u.toString()); // => { data, page, size, total_pages, total_items }
    }

    async function getAdById(id) {
        const u = new URL(`${API_BASE}/avisos/${id}`, window.location.origin);
        return fetchJSON(u.toString()); // => {...aviso serializado...}
    }

    window.API = { fetchJSON, getLatestAds, getAdsPage, getAdById };
})();
