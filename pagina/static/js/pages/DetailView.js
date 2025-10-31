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
     * Construye el bloque de comentarios (listado + formulario).
     * @returns {HTMLElement}
     */
    function buildCommentsSection() {
        const sect = document.createElement("section");
        sect.id = "comments-section";
        sect.className = "form-section";
        sect.innerHTML = [
            '<h3 style="margin-bottom:10px;">Comentarios</h3>',
            '<div id="comments-list" aria-live="polite" style="display:grid;gap:8px;margin-bottom:12px;"></div>',
            '<form id="comment-form" novalidate>',
            '  <div class="form-row">',
            '    <label for="c-nombre">Nombre</label>',
            '    <input id="c-nombre" name="nombre" type="text" minlength="3" maxlength="80" required />',
            '  </div>',
            '  <div class="field-error" id="err-nombre" aria-live="polite"></div>',
            '  <div class="form-row form-fieldcasoTextarea" style="margin-top:8px;">',
            '    <label for="c-texto">Comentario</label>',
            '    <textarea id="c-texto" name="texto" rows="4" cols="50" minlength="5" maxlength="300" required></textarea>',
            '  </div>',
            '  <div class="field-error" id="err-texto" aria-live="polite"></div>',
            '  <div class="form-actions">',
            '    <button id="c-submit" type="submit">Agregar comentario</button>',
            '  </div>',
            '</form>',
        ].join("");
        return sect;
    }

    /**
     * Limpia mensajes de error del formulario de comentarios.
     * @returns {void}
     */
    function clearFormErrors() {
        const e1 = document.getElementById("err-nombre");
        const e2 = document.getElementById("err-texto");
        if (e1) e1.textContent = "";
        if (e2) e2.textContent = "";
    }

    /**
     * Valida campos del formulario de comentarios.
     * @param {string} nombre
     * @param {string} texto
     * @returns {{ ok: boolean, errors: Record<string,string> }}
     */
    function validateCommentFields(nombre, texto) {
        const errors = {};
        const n = (nombre || "").trim();
        const t = (texto || "").trim();

        if (n.length < 3 || n.length > 80) {
            errors.nombre = "Debe tener entre 3 y 80 caracteres.";
        }
        if (t.length < 5 || t.length > 300) {
            errors.texto = "Debe tener entre 5 y 300 caracteres.";
        }
        return { ok: Object.keys(errors).length === 0, errors };
    }

    /**
     * Renderiza la lista de comentarios dentro de #comments-list.
     * @param {HTMLElement} listEl
     * @param {Array<any>} items
     * @returns {void}
     */
    function renderComments(listEl, items) {
        if (!Array.isArray(items) || items.length === 0) {
            listEl.innerHTML = '<p style="color:#666">Aún no hay comentarios.</p>';
            return;
        }
        listEl.innerHTML = items.map(function (c) { return window.Card.render(c, "comment"); }).join("");
    }

    /**
     * Carga comentarios desde la API y los renderiza.
     * @param {number} avisoId
     * @returns {Promise<void>}
     */
    async function loadComments(avisoId) {
        const listEl = document.getElementById("comments-list");
        if (!listEl) return;
        listEl.innerHTML = '<p class="loading">Cargando comentarios…</p>';
        try {
            // orden más recientes primero
            const resp = await window.API.getComments(avisoId, { limit: 20, order: "desc" });
            // backend devuelve {items,total,offset,limit,order}
            renderComments(listEl, resp && resp.items ? resp.items : []);
        } catch (e) {
            listEl.innerHTML = '<p class="error">No se pudieron cargar los comentarios.</p>';
            // log en consola para diagnóstico
            console.error(e);
        }
    }

    /**
     * Conecta el submit del formulario de comentarios (POST asíncrono).
     * @param {number} avisoId
     * @returns {void}
     */
    function bindCommentForm(avisoId) {
        const form = document.getElementById("comment-form");
        if (!form) return;

        const inNombre = document.getElementById("c-nombre");
        const inTexto  = document.getElementById("c-texto");
        const errNombre = document.getElementById("err-nombre");
        const errTexto  = document.getElementById("err-texto");
        const submitBtn = document.getElementById("c-submit");

        form.addEventListener("submit", async function (ev) {
            ev.preventDefault();
            clearFormErrors();

            const nombre = (inNombre && inNombre.value) || "";
            const texto  = (inTexto  && inTexto.value)  || "";
            const v = validateCommentFields(nombre, texto);

            if (!v.ok) {
                if (v.errors.nombre && errNombre) errNombre.textContent = v.errors.nombre;
                if (v.errors.texto  && errTexto ) errTexto.textContent  = v.errors.texto;
                return;
            }

            if (submitBtn) submitBtn.disabled = true;
            try {
                const created = await window.API.postComment(avisoId, { nombre: nombre.trim(), texto: texto.trim() });
                // prepend visual inmediato
                const listEl = document.getElementById("comments-list");
                if (listEl) {
                    const cardHtml = window.Card.render(created, "comment");
                    const wrap = document.createElement("div");
                    wrap.innerHTML = cardHtml;
                    // Si había "Aún no hay comentarios." lo reemplazamos
                    if (listEl.firstChild && listEl.firstChild.nodeType === Node.ELEMENT_NODE &&
                        (listEl.firstChild).tagName === "P") {
                        listEl.innerHTML = "";
                    }
                    listEl.insertBefore(wrap.firstElementChild, listEl.firstChild);
                }
                // limpiar campos
                if (inNombre) inNombre.value = "";
                if (inTexto)  inTexto.value  = "";
                if (inNombre) inNombre.focus();
            } catch (e) {
                // Mostrar mensaje genérico arriba del formulario
                if (errTexto) errTexto.textContent = "No se pudo agregar el comentario. Inténtalo nuevamente.";
                console.error(e);
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }

    /**
     * Entrada principal de la vista de detalle.
     * Renderiza card, conecta lightbox y prepara espacio para comentarios.
     * @returns {void}
     */
    function start() {
        const mount = document.getElementById("detail-card");
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

                const commentsSection = buildCommentsSection();
                mount.appendChild(commentsSection);
                loadComments(avisoId);
                bindCommentForm(avisoId);

            })
            .catch(function (err) {
                renderError(mount, err && err.message ? err.message : "Error desconocido");
            });
    }

    document.addEventListener("DOMContentLoaded", start);
})();
