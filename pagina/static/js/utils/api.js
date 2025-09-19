(function () {
    async function fetchJSON(url) {
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) throw new Error(`Error ${res.status} al pedir ${url}`);
        return res.json();
    }

    async function getLatestAds(limit = 5) {
        const u = new URL(window.location.origin + "/api/avisos/latest");
        u.searchParams.set("limit", String(limit));
        return fetchJSON(u.toString()); // => { data: [...] }
    }

    async function getAdsPage(page = 1, size = 5) {
        const u = new URL(window.location.origin + "/api/avisos");
        u.searchParams.set("page", String(page));
        u.searchParams.set("size", String(size));
        return fetchJSON(u.toString()); // => { data, page, size, total_pages, total_items }
    }

    async function getAdById(id) {
        const u = new URL(window.location.origin + `/api/avisos/${id}`);
        return fetchJSON(u.toString()); // => {...aviso serializado...}
    }

    window.API = { fetchJSON, getLatestAds, getAdsPage, getAdById };
})();
