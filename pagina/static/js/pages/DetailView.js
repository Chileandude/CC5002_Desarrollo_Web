// static/js/pages/DetailView.js
(function () {
    "use strict";

    /**
     * Obtiene el ID del aviso desde data-aviso-id o desde /list/:id.
     * @returns {number|null}
     */
    function getAvisoId() {
        const mount = document.getElementById("detail-view");
        if (mount && mount.dataset && mount.dataset.avisoId) {
            const id = parseInt(mount.dataset.avisoId, 10);
            if (Number.isFinite(id) && id > 0) return id;
        }
        const parts = window.location.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1];
        const idFromPath = parseInt(last, 10);
        return Number.isFinite(idFromPath) && idFromPath > 0 ? idFromPath : null;
    }

    /**
     * Escapa texto para uso seguro en innerHTML.
     * @param {unknown} s
     * @returns {string}
     */
    function esc(s) {
        return String(s)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    /**
     * Muestra un error básico en el contenedor principal.
     * @param {HTMLElement} mount
     * @param {string} message
     * @returns {void}
     */
    function renderError(mount, message) {
        mount.innerHTML = `
      <div class="error-box" role="alert" style="margin-top:1rem;">
        <h2 style="margin:0 0 .5rem 0;">No se pudo cargar el aviso</h2>
        <p style="margin:0;">${esc(message || "Error desconocido")}</p>
      </div>
    `;
    }

    /**
     * Inicializa delegación para abrir la Lightbox en [data-lightbox-src].
     * @param {HTMLElement} detailRoot
     * @param {PhotoLightbox} lightbox
     * @returns {void}
     */
    function initLightboxDelegation(detailRoot, lightbox) {
        if (!detailRoot || !lightbox) return;

        detailRoot.addEventListener("click", function (ev) {
            const el = ev.target && ev.target.closest && ev.target.closest("[data-lightbox-src]");
            if (!el) return;
            ev.preventDefault();
            const src = el.getAttribute("data-lightbox-src");
            if (!src) return;
            const caption = el.getAttribute("data-caption") || "";
            lightbox.open(src, caption);
        });

        detailRoot.addEventListener("keydown", function (ev) {
            if (ev.key !== "Enter" && ev.key !== " ") return;
            const a = document.activeElement;
            if (!a || !a.matches || !a.matches("[data-lightbox-src]")) return;
            ev.preventDefault();
            const src = a.getAttribute("data-lightbox-src");
            if (!src) return;
            const caption = a.getAttribute("data-caption") || "";
            lightbox.open(src, caption);
        });
    }

    /**
     * Llama a la API para obtener el aviso.
     * Ajusta la URL si tu endpoint es distinto.
     * @param {number} id
     * @returns {Promise<any>}
     */
    async function fetchAviso(id) {
        const res = await fetch(`/api/avisos/${id}`, {headers: {Accept: "application/json"}});
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(text || `HTTP ${res.status}`);
        }
        return res.json();
    }

    /**
     * Entrada principal de la vista de detalle.
     * Renderiza card, conecta lightbox y prepara espacio para comentarios.
     * @returns {void}
     */
    function start() {
        const mount = document.getElementById("detail-view");
        if (!mount) return;

        const avisoId = getAvisoId();
        if (!avisoId) {
            renderError(mount, "La URL no contiene un ID de aviso válido.");
            return;
        }

        mount.innerHTML = `<div class="loading" aria-live="polite">Cargando aviso…</div>`;

        fetchAviso(avisoId)
            .then(function (aviso) {
                mount.innerHTML = window.Card.render(aviso, "detail");
                const lightboxRoot = document.getElementById("photo-lightbox");
                const lightbox = new window.PhotoLightbox(lightboxRoot);
                initLightboxDelegation(mount, lightbox);

            })
            .catch(function (err) {
                renderError(mount, err && err.message ? err.message : "Error desconocido");
            });
    }

    document.addEventListener("DOMContentLoaded", start);
})();
