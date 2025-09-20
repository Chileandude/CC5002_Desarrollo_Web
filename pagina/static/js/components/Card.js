(function () {
    class Card {
        static #esc(s) {
            return String(s)
                .replaceAll("&", "&amp;")
                .replaceAll("<", "&lt;")
                .replaceAll(">", "&gt;")
                .replaceAll('"', "&quot;")
                .replaceAll("'", "&#39;");
        }

        static #fmt(dt) {
            if (!dt) return "—";
            const t = Date.parse(String(dt).replace(" ", "T"));
            if (Number.isNaN(t)) return "—";
            const d = new Date(t);
            return d.toLocaleString("es-CL", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            });
        }

        /**
         * Renderiza una card.
         * @param {AdoptionAd|any} ad
         * @returns {string}
         */
        static render(ad) {
            const e = Card.#esc;

            const publicado = Card.#fmt(ad.creado_en);
            const comuna = ad.comuna ? e(ad.comuna) : "—";
            const sector = ad.sector ? e(ad.sector) : "—";
            const tipo = ad.tipo ? e(ad.tipo) : "—";
            const edad =
                ad.edad != null && ad.edad_unidad ? `${ad.edad} ${e(ad.edad_unidad)}` : "—";
            const cantidad = ad.cantidad != null ? String(ad.cantidad) : "—";

            const imgHtml = ad.fotos?.[0]
                ? `<img class="card--home-row__img"
								 src="${e(ad.fotos[0])}"
								 alt="Foto del aviso"
								 width="320" height="240"
								 loading="lazy">`
                : `<div class="card--home-row__img card--home-row__img--placeholder"
								 aria-label="Sin foto" role="img"
								 style="display:flex;align-items:center;justify-content:center;color:#666;">
						 Sin foto
					 </div>`;

            return `
				<article class="card card--home-row" data-id="${ad.id}">
					<div class="card--home-row__meta">
						<div><b>Fecha publicación:</b> ${publicado}</div>
						<div><b>Comuna:</b> ${comuna}</div>
						<div><b>Sector:</b> ${sector}</div>
						<div><b>Cantidad · Tipo · Edad:</b> ${cantidad} · ${tipo} · ${edad}</div>
					</div>
					${imgHtml}
				</article>`;
        }
    }

    window.Card = Card;
})();
