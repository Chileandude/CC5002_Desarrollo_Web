(function () {
    /**
     * @typedef {Object} Adoption
     * @property {number} id
     * @property {string} [region]
     * @property {string} [comuna]
     * @property {string} [sector]
     * @property {string} [contacto_nombre]
     * @property {string} [contacto_email]
     * @property {string} [contacto_celular]
     * @property {{via:string,id:string}[]} [contactar_por]
     * @property {string} [tipo]                // ej. "gato"
     * @property {number} [cantidad]
     * @property {number} [edad]
     * @property {string} [edad_unidad]         // ej. "meses", "años"
     * @property {string} [fecha_disponible]    // ISO
     * @property {string} [creado_en]           // ISO
     * @property {string} [descripcion]
     * @property {string[]} [fotos]
     */
    const AdoptionListFmt = {
        /** @param {string|undefined} iso */
        date(iso) {
            if (!iso) return "—";
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return "—";
            const fecha = d.toLocaleDateString("es-CL");
            const hora = d.toLocaleTimeString("es-CL", {hour: "2-digit", minute: "2-digit", hour12: false});
            return `${fecha} ${hora}`;
        },
        /** @param {number|undefined} e @param {string|undefined} u */
        edad(e, u) {
            if (e == null || !u) return "—";
            return `${e} ${u}`;
        },
        /** @param {Adoption} item */
        contacto(item) {
            const basics = [];
            if (item.contacto_celular) basics.push(item.contacto_celular);
            if (item.contacto_email) basics.push(item.contacto_email);
            const baseStr = basics.join(" / ") || "—";

            let vias = "";
            if (Array.isArray(item.contactar_por) && item.contactar_por.length) {
                const vs = item.contactar_por.map((x) => `${x.via}: ${x.id}`).join(", ");
                vias = ` | ${vs}`;
            }
            return baseStr + vias;
        },
        /** @param {{via:string,id:string}[]|undefined} arr */
        contactarPor(arr) {
            if (!arr?.length) return "—";
            return arr.map((x) => `${x.via}: ${x.id}`).join(" | ");
        },
    };

    class PhotoLightbox {
        constructor(root) {
            if (!root) {
                this.disabled = true;
                return;
            }
            this.root = root;
            this.img = root.querySelector("#lightbox-img");
            this.caption = root.querySelector("#lightbox-caption");

            root.addEventListener("click", (ev) => {
                const t = ev.target;
                if (t.matches("[data-close]") || t.classList.contains("photo-lightbox__backdrop")) {
                    this.close();
                }
            });
            document.addEventListener("keydown", (e) => {
                if (this.root.getAttribute("aria-hidden") === "false" && e.key === "Escape") this.close();
            });
        }

        open(src, caption = "") {
            if (this.disabled || !this.root || !this.img || !this.caption) return;
            this.img.src = src;
            this.caption.textContent = caption;
            this.root.setAttribute("aria-hidden", "false");
        }

        close() {
            if (this.disabled || !this.root || !this.img || !this.caption) return;
            this.img.src = "";
            this.caption.textContent = "";
            this.root.setAttribute("aria-hidden", "true");
        }
    }

    class AdoptionList {
        /**
         * @param {HTMLElement} mountEl
         * @param {Adoption[]} data
         */
        constructor(mountEl, data) {
            this.mountEl = mountEl;
            this.data = data;
            /** @type {Map<number, HTMLElement>} mapa id -> contenedor de detalle */
            this.detailsMap = new Map();
            /** @type {PhotoLightbox} */
            this.lightbox = new PhotoLightbox(document.getElementById("photo-lightbox"));
        }

        render() {
            this.mountEl.innerHTML = "";
            this.detailsMap.clear();
            const scroll = document.createElement("div");
            scroll.className = "adoptions-scroll";

            const head = this.#buildHead();
            scroll.appendChild(head);

            for (const item of this.data) {
                const row = this.#buildRow(item);
                scroll.appendChild(row);
            }
            this.mountEl.appendChild(scroll);
        }

        #buildHead() {
            const head = document.createElement("div");
            head.className = "adoption-head";
            const labels = [
                "Fecha Publicación",
                "Fecha Entrega",
                "Comuna",
                "Sector",
                "Cantidad",
                "Tipo",
                "Edad",
                "Nombre",
                "Total fotos",
            ];
            for (const lbl of labels) {
                const div = document.createElement("div");
                div.textContent = lbl;
                head.appendChild(div);
            }
            return head;
        }

        /**
         * @param {Adoption} item
         */
        #buildRow(item) {
            const row = document.createElement("div");
            row.className = "adoption-row";
            row.setAttribute("role", "button");
            row.setAttribute("tabindex", "0");
            row.setAttribute("aria-expanded", "false");

            const cells = [
                AdoptionListFmt.date(item.creado_en),
                AdoptionListFmt.date(item.fecha_disponible),
                item.comuna ?? "—",
                item.sector ?? "—",
                String(item.cantidad ?? "—"),
                item.tipo ?? "—",
                AdoptionListFmt.edad(item.edad, item.edad_unidad),
                item.contacto_nombre ?? "—",
                String(item.fotos?.length ?? 0),
            ];

            for (const text of cells) {
                const c = document.createElement("div");
                c.textContent = text;
                row.appendChild(c);
            }

            const toggle = () => this.#toggleDetails(row, item);
            row.addEventListener("click", toggle);
            row.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle();
                }
            });

            return row;
        }

        /**
         * @param {HTMLElement} row
         * @param {Adoption} item
         */
        #toggleDetails(row, item) {
            const isOpen = row.getAttribute("aria-expanded") === "true";
            if (isOpen) {
                const detailsEl = this.detailsMap.get(item.id);
                if (detailsEl?.parentElement) detailsEl.parentElement.removeChild(detailsEl);
                this.detailsMap.delete(item.id);
                row.setAttribute("aria-expanded", "false");
                return;
            }
            row.setAttribute("aria-expanded", "true");
            const detailsEl = this.#buildDetails(row, item);
            row.insertAdjacentElement("afterend", detailsEl);
            this.detailsMap.set(item.id, detailsEl);
        }

        /**
         * @param {HTMLElement} row
         * @param {Adoption} item
         */
        #buildDetails(row, item) {
            const wrap = document.createElement("div");
            wrap.className = "adoption-details";
            wrap.dataset.adoptionId = String(item.id);

            // Botón cerrar detalle
            const closeBtn = document.createElement("button");
            closeBtn.type = "button";
            closeBtn.className = "adoption-details__close";
            closeBtn.textContent = "Cerrar detalle ×";
            closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const detailsEl = this.detailsMap.get(item.id);
                if (detailsEl?.parentElement) detailsEl.parentElement.removeChild(detailsEl);
                this.detailsMap.delete(item.id);
                row.setAttribute("aria-expanded", "false");
            });
            wrap.appendChild(closeBtn);

            // Información extendida
            const info = document.createElement("div");
            info.className = "adoption-details__info";
            const r1 = document.createElement("div");
            r1.innerHTML = "<strong>Región:</strong> ";
            r1.appendChild(document.createTextNode(item.region ?? "—"));

            const r2 = document.createElement("div");
            r2.innerHTML = "<strong>Contacto:</strong> ";
            r2.appendChild(document.createTextNode(AdoptionListFmt.contacto(item)));

            const r3 = document.createElement("div");
            r3.innerHTML = "<strong>Descripción:</strong> ";
            r3.appendChild(document.createTextNode(item.descripcion ?? "—"));

            info.append(r1, r2, r3);
            wrap.appendChild(info);

            // Galería de fotos (thumbnails 320x240)
            const gallery = document.createElement("div");
            gallery.className = "gallery";
            const fotos = Array.isArray(item.fotos) ? item.fotos : [];
            if (!fotos.length) {
                const empty = document.createElement("div");
                empty.className = "gallery__empty";
                empty.textContent = "Sin fotos disponibles.";
                gallery.appendChild(empty);
            } else {
                fotos.forEach((src, idx) => {
                    const fig = document.createElement("figure");
                    fig.className = "gallery__item";

                    const img = document.createElement("img");
                    img.src = src;
                    img.alt = `Foto ${idx + 1} de ${item.tipo ?? "aviso"}`;
                    img.width = 320;
                    img.height = 240;
                    img.loading = "lazy";
                    img.decoding = "async";
                    img.tabIndex = 0;

                    img.addEventListener("click", () => {
                        this.lightbox.open(
                            src,
                            `${item.tipo ?? "aviso"} — Foto ${idx + 1}/${fotos.length}`
                        );
                    });
                    img.addEventListener("keydown", (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            this.lightbox.open(
                                src,
                                `${item.tipo ?? "aviso"} — Foto ${idx + 1}/${fotos.length}`
                            );
                        }
                    });

                    fig.appendChild(img);
                    gallery.appendChild(fig);
                });
            }
            wrap.appendChild(gallery);

            return wrap;
        }
    }

    window.AdoptionList = AdoptionList;
})();
