(function () {
        /**
         * Renderizador de tarjetas:
         * - variant "home": fila con metadatos + foto 320x240.
         * - variant "detail": tarjeta de detalle para /list/:id.
         * - variant "comment": tarjeta compacta para un comentario.
         *
         * @summary
         * - Usa datos serializados tal como vienen de la API.
         * - Formatea fechas en es-CL con reloj de 24 horas.
         * - Escapa HTML de strings visibles para prevenir inyección.
         * - Preserva saltos de línea de forma segura en campos largos (descripción/comentarios).
         */
        class Card {
            static #esc(s) {
                return String(s)
                    .replaceAll("&", "&amp;")
                    .replaceAll("<", "&lt;")
                    .replaceAll(">", "&gt;")
                    .replaceAll('"', "&quot;")
                    .replaceAll("'", "&#39;");
            }


            /**
             * Formatea fecha/hora (string o Date-like) a locale es-CL, 24h.
             * Acepta cadenas "%Y-%m-%d %H:%M" (las convierte a ISO con "T").
             * @param {string | number | Date | null | undefined} dt
             * @returns {string}
             */
            static #fmt(dt) {
                if (!dt) return "—";
                const t = Date.parse(String(dt).replace(" ", "T"));
                if (Number.isNaN(t)) return "—";
                const d = new Date(t);
                return d.toLocaleString("es-CL", {
                    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false
                });
            }

            /**
             * Escapa HTML y preserva saltos de línea con <br>, para mostrar texto multilínea de forma segura.
             * @param {string | null | undefined} s
             * @returns {string}
             */
            static #safetyCheck(s) {
                if (s == null) return "";
                const escaped = Card.#esc(s);
                return escaped.replaceAll("\n", "<br>");
            }

            /**
             * Variante home. Mantiene el HTML original de la t1.
             * @param {any} ad
             * @returns {string}
             */
            static #renderHome(ad) {
                const e = Card.#esc;

                const publicado = Card.#fmt(ad.creado_en);
                const comuna = ad.comuna ? e(ad.comuna) : "—";
                const sector = ad.sector ? e(ad.sector) : "—";
                const tipo = ad.tipo ? e(ad.tipo) : "—";
                const edad = ad.edad != null && ad.edad_unidad ? `${ad.edad} ${e(ad.edad_unidad)}` : "—";
                const cantidad = ad.cantidad != null ? String(ad.cantidad) : "—";

                const imgHtml = ad.fotos?.[0] ? `<img class="card--home-row__img"
								 src="${e(ad.fotos[0])}"
								 alt="Foto del aviso"
								 width="320" height="240"
								 loading="lazy">` : `<div class="card--home-row__img card--home-row__img--placeholder"
								 aria-label="Sin foto" role="img"
								 style="display:flex;align-items:center;justify-content:center;color:#666;">
						 Sin foto
					 </div>`;

                return `
				<article class="card card--home-row" data-id="${ad.id}">
				    <h2 class="sr-only">Aviso ${ad.id}</h2>
					<div class="card--home-row__meta">
						<div><b>Fecha publicación:</b> ${publicado}</div>
						<div><b>Comuna:</b> ${comuna}</div>
						<div><b>Sector:</b> ${sector}</div>
						<div><b>Cantidad · Tipo · Edad:</b> ${cantidad} · ${tipo} · ${edad}</div>
					</div>
					${imgHtml}
				</article>`;
            }

            /**
             * Variante detail para /list/:id (media, meta ampliada, descripción, contacto).
             * @param {any} ad
             * @param {{ lightbox?: boolean }} [opts]
             * @returns {string}
             */
            static #renderDetail(ad) {
                const e = Card.#esc;
                const s = Card.#safetyCheck;

                const publicado = Card.#fmt(ad.creado_en);
                const disponible = Card.#fmt(ad.fecha_disponible);

                const tipo = ad.tipo ? e(ad.tipo) : "—";
                const cantidad = ad.cantidad != null ? String(ad.cantidad) : "—";
                const edad = ad.edad != null && ad.edad_unidad ? `${ad.edad} ${e(ad.edad_unidad)}` : "—";

                const region = ad.region ? e(ad.region) : "—";
                const comuna = ad.comuna ? e(ad.comuna) : "—";
                const sector = ad.sector ? e(ad.sector) : "—";

                const descripcion = ad.descripcion && String(ad.descripcion).trim() ? s(String(ad.descripcion)) : "—";

                const contactoNombre = ad.contacto_nombre ? e(ad.contacto_nombre) : "—";
                const contactoEmail = ad.contacto_email ? e(ad.contacto_email) : "—";
                const contactoCel = ad.contacto_celular ? e(ad.contacto_celular) : "—";

                const fotos = Array.isArray(ad.fotos) ? ad.fotos : [];
                const hasFotos = fotos.length > 0;
                const mainSrc = hasFotos ? e(fotos[0]) : null;

                const photos = [];
                if (hasFotos) {
                    photos.push({
                        src: mainSrc,
                        alt: `Foto 1 de ${tipo || "aviso"}`,
                        caption: `${tipo} — Foto 1/${fotos.length}`,
                    });
                    fotos.slice(1).forEach((src, i) => {
                        const safe = e(src);
                        const n = i + 2;
                        photos.push({
                            src: safe,
                            alt: `Foto ${n} de ${tipo || "aviso"}`,
                            caption: `${tipo} — Foto ${n}/${fotos.length}`,
                        });
                    });
                }
                const mediaHtml = photos.length ? photos.map(p => `
                    <img class="card--detail__photo"
                        src="${p.src}"
                        alt="${e(p.alt)}"
                        width="320" height="240"
                        loading="lazy" decoding="async" tabindex="0"
                        data-lightbox-src="${p.src}"
                        data-caption="${e(p.caption)}">
                `).join("")
                    : `
                    <div class="card--detail__photo card--detail__photo--placeholder" aria-label="Sin foto" role="img">
                        Sin foto
                    </div>`;
                return `
                    <article class="card card--detail" data-id="${ad.id}">
                        <h2 class="sr-only">Detalle del aviso ${ad.id}</h2>
                        <div class="card--detail__head">
                            <div class="card--home-row__meta">
                                <div><b>Fecha publicación:</b> ${publicado}</div>
                                <div><b>Comuna:</b> ${comuna}</div>
                                <div><b>Sector:</b> ${sector}</div>
                                <div><b>Cantidad · Tipo · Edad:</b> ${cantidad} · ${tipo} · ${edad}</div>
                                <div><b>Fecha disponible:</b> ${disponible}</div>
                                <div><b>Región:</b> ${region}</div>
                            </div>
                        </div>
                        <section class="card--detail__description">
                            <h3>Descripción</h3>
                            <p>${descripcion}</p>
                        </section>      
                        <section class="card--detail__contact">
                            <h3>Contacto</h3>
                            <div class="meta-row"><b>Nombre:</b> ${contactoNombre}</div>
                            <div class="meta-row"><b>Email:</b> ${contactoEmail}</div>
                            <div class="meta-row"><b>Celular:</b> ${contactoCel}</div>
                        </section>
                        <div class="card--detail__photos-row">
                            ${mediaHtml}
                        </div>
                    </article>`;
            }

            /**
             * Variante "comment": tarjeta compacta para un comentario.
             * @param {{ id:number, nombre:string, texto:string, fecha?:string, fecha_iso?:string }} cmt
             * @returns {string}
             */
            static #renderComment(cmt) {
                const e = Card.#esc;
                const s = Card.#safetyCheck;
                const nombre = cmt?.nombre ? e(cmt.nombre) : "—";

                const raw = String(cmt?.fecha || cmt?.fecha_iso || "").trim();
                const iso = raw ? raw.replace(" ", "T") : ""; // "YYYY-MM-DDTHH:MM"
                const visible = Card.#fmt(raw || null);                          // "dd-mm-aaaa hh:mm"

                const texto =  cmt?.texto && String(cmt.texto).trim() ? s(String(cmt.texto)) : "—";

                return `
                    <article class="card card--comment" data-id="${cmt?.id ?? ""}">
                        <h3 class="sr-only">Comentario de ${nombre}</h3>
                        <div class="card--home-row__meta">
                            <div><b>Nombre:</b> ${nombre}</div>
                            <div><b>Fecha:</b> 
                                 <time class="card--comment__date" ${iso ? `datetime="${e(iso)}"` : ""}>${visible}</time>
                            </div>
                        </div>
                        <div class="card--comment__body">
                            <p>${texto}</p>
                        </div>
                    </article>`;
            }

            static render(data, variant = "home") {
                if (variant === "detail") {
                    return Card.#renderDetail(data);
                }
                if (variant === "comment") {
                    return Card.#renderComment(data);
                }
                return Card.#renderHome(data);
            }
        }

        window
            .Card = Card;
    }

)
();
