// Requiere: window.Validators
/**
 * Modal para agregar un aviso de adopción.
 *
 * @summary
 * - Construye el formulario por secciones (¿Dónde?, ¿Contacto?, ¿Mascota?)
 * - Valida campos con window.Validators
 * - Ensambla FormData y lo envía a /api/avisos
 * - Maneja previsualización de fotos con Object URLs (y las revoca)
 *
 * @example
 * const modal = new AddModal({
 *   onConfirm: (payload) => console.log('confirmado', payload),
 *   onCancel: (reason) => console.log('cancel', reason),
 * });
 * modal.open();
 */
class AddModal {
    /**
     * @param {Object} [opts]
     * @param {(payload: object)=>void} [opts.onConfirm]  // callback tras confirmar "Sí"
     * @param {(reason?: string)=>void} [opts.onCancel]   // callback al cerrar sin confirmar
     * @param {number} [opts.maxPhotos=5]
     * @param {number} [opts.maxContacts=5]
     */
    constructor(opts = {}) {
        this.onConfirm = opts.onConfirm ?? null;
        this.onCancel = opts.onCancel ?? null;

        this.maxPhotos = Number.isFinite(+opts.maxPhotos) ? +opts.maxPhotos : 5;
        this.maxContacts = Number.isFinite(+opts.maxContacts) ? +opts.maxContacts : 5;

        this.socialOptions = ["Whatsapp", "Telegram", "Twitter", "Instagram", "Tiktok", "otra"];

        /** @type {HTMLDivElement|null} */
        this.overlay = null; // .modal
        /** @type {HTMLDivElement|null} */
        this.content = null; // .modal-content

        this.refs = {}; // referencias a inputs
    }

    /** Abre el modal y monta el DOM. */
    open() {
        if (this.overlay) return; // ya abierto
        this.overlay = document.createElement("div");
        this.overlay.className = "modal";
        this.overlay.style.display = "block";

        this.content = document.createElement("div");
        this.content.className = "modal-content add-modal";

        // header
        const header = document.createElement("div");
        header.className = "modal-header";
        header.innerHTML = `<h2>Agregar aviso de adopción</h2>`;
        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "modal-close";
        closeBtn.textContent = "×";
        closeBtn.title = "Cerrar";
        closeBtn.addEventListener("click", () => this.close("user"));
        header.appendChild(closeBtn);

        // body (form)
        const body = document.createElement("div");
        body.className = "modal-body";
        body.appendChild(this.#buildForm());

        // footer vacío
        const footer = document.createElement("div");
        footer.className = "modal-footer";

        this.content.append(header, body, footer);
        this.overlay.appendChild(this.content);
        document.body.appendChild(this.overlay);

        this.overlay.addEventListener("click", (e) => {
            if (e.target === this.overlay) {
                this.close("auto");
            }
        });
    }

    /**
     * Cierra el modal, revoca Object URLs y dispara onCancel.
     * @param {"user"|"auto"|"manual"} [reason="manual"]
     * @returns {void}
     */
    close(reason = "manual") {
        if (!this.overlay) return;
        this.#revokeAllObjectURLs();
        document.body.removeChild(this.overlay);
        this.overlay = null;
        this.content = null;
        this.refs = {};
        this.onCancel?.(reason);
    }

    /** Crea el formulario principal. */
    #buildForm() {
        const form = document.createElement("form");
        form.className = "ad-form";
        form.addEventListener("submit", (e) => e.preventDefault());

        form.appendChild(this.#sectionLugar());
        form.appendChild(this.#sectionContacto());
        form.appendChild(this.#sectionMascota());

        // acciones
        const actions = document.createElement("div");
        actions.className = "form-actions";

        const submit = document.createElement("button");
        submit.type = "button";
        submit.className = "btn-primary";
        submit.textContent = "Agregar este aviso de adopción";
        submit.addEventListener("click", () => this.#onSubmit());

        actions.appendChild(submit);
        form.appendChild(actions);
        return form;
    }

    // ---- Sección ¿Dónde? ----
    #sectionLugar() {
        const sec = this.#section("¿Dónde?");
        const row = this.#row();

        const region = this.#select(true);
        this.refs.region = region;

        const comuna = this.#select(true);
        this.refs.comuna = comuna;

        this.#loadRegiones().then(() => {
            if (this.refs.region.options.length > 0) {
                this.refs.region.dispatchEvent(new Event("change"));
            }
        });

        region.addEventListener("change", () => {
            const rid = Number(this.refs.region.value || 0);
            this.#loadComunas(rid);
        });

        const sector = this.#input("text", false);
        sector.maxLength = 100;
        sector.placeholder = "opcional, máx 100";
        this.refs.sector = sector;

        row.appendChild(this.#fieldWrap("Región", region, true));
        row.appendChild(this.#fieldWrap("Comuna", comuna, true));
        row.appendChild(this.#fieldWrap("Sector", sector, false));

        sec.appendChild(row);
        return sec;
    }

    // ---- Sección ¿Contacto? ----
    #sectionContacto() {
        const sec = this.#section("¿Contacto de esta publicación?");

        const r1 = this.#row();
        const nombre = this.#input("text", true);
        nombre.minLength = 3;
        nombre.maxLength = 200;
        this.refs.nombre = nombre;

        const email = this.#input("email", true);
        email.placeholder = "nombre@email.cl";
        email.maxLength = 100;
        this.refs.email = email;

        const celular = this.#input("tel", false);
        celular.placeholder = "+NNN.NNNNNNNN";
        this.refs.celular = celular;

        r1.append(this.#fieldWrap("Nombre", nombre, true), this.#fieldWrap("Email", email, true), this.#fieldWrap("Número de celular", celular, false),);

        const r2 = this.#row();

        const selector = this.#select(false);
        this.socialOptions.forEach((o) => {
            const opt = document.createElement("option");
            opt.value = o;
            opt.textContent = o;
            selector.appendChild(opt);
        });

        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.textContent = "Agregar";
        addBtn.addEventListener("click", () => this.#addSocial(selector.value));

        const holder = document.createElement("div");
        holder.append(selector, addBtn);

        const list = document.createElement("div");
        list.className = "social-list";
        this.refs.socialList = list;

        r2.append(this.#fieldWrap("Contactar por (máx 5)", holder, false), this.#fieldWrap("Contactos agregados", list, false),);

        sec.append(r1, r2);
        return sec;
    }

    // ---- Sección ¿Qué mascota? ----
    #sectionMascota() {
        const sec = this.#section("¿Qué mascota ofrece en adopción?");
        const r1 = this.#row();

        const tipo = this.#select(true);
        ["Gato", "Perro"].forEach((t) => {
            const opt = document.createElement("option");
            opt.value = t;
            opt.textContent = t;
            tipo.appendChild(opt);
        });
        this.refs.tipo = tipo;

        const cantidad = this.#input("number", true);
        cantidad.min = "1";
        cantidad.step = "1";
        this.refs.cantidad = cantidad;

        const edad = this.#input("number", true);
        edad.min = "1";
        edad.step = "1";
        this.refs.edad = edad;

        const unidad = this.#select(true);
        ["meses", "años"].forEach((u) => {
            const opt = document.createElement("option");
            opt.value = u;
            opt.textContent = u;
            unidad.appendChild(opt);
        });
        this.refs.unidadEdad = unidad;

        r1.append(this.#fieldWrap("Tipo", tipo, true), this.#fieldWrap("Cantidad", cantidad, true), this.#fieldWrap("Edad", edad, true), this.#fieldWrap("Unidad medida edad", unidad, true),);

        const r2 = this.#row();
        const dt = this.#input("datetime-local", true);
        const min = this.#nowPlus3h();
        dt.value = min;
        dt.min = min;
        this.refs.fechaEntrega = dt;
        r2.append(this.#fieldWrap("Fecha disponible para entrega", dt, true));

        const r3 = this.#row();
        const desc = document.createElement("textarea");
        desc.cols = 50;
        desc.rows = 10;
        desc.placeholder = "Descripción (opcional)";
        this.refs.descripcion = desc;

        r3.append(this.#fieldWrap("Descripción", desc, false, {textarea: true}));

        const r4 = this.#row();

        // contenedor de la lista de fotos
        const photosList = document.createElement("div");
        photosList.className = "photos-list";
        this.refs.photosList = photosList;

        // botón agregar foto
        const addPhotoBtn = document.createElement("button");
        addPhotoBtn.type = "button";
        addPhotoBtn.textContent = "Agregar foto";
        addPhotoBtn.classList.add("photo-add");
        addPhotoBtn.addEventListener("click", () => this.#addPhotoItem());

        // crea la primera card
        this.#addPhotoItem();

        // contenedor de controles
        const photosControls = document.createElement("div");
        photosControls.className = "photos-controls";
        photosControls.append(photosList, addPhotoBtn);

        // form-field "Foto(s)..."
        r4.append(this.#fieldWrap("Foto(s) (1 a 5)", photosControls, true));

        sec.append(r1, r2, r3, r4);
        return sec;
    }

    // ============ Helpers UI ============
    #section(title) {
        const s = document.createElement("section");
        s.className = "form-section";
        const h = document.createElement("h3");
        h.textContent = title;
        s.appendChild(h);
        return s;
    }

    #row() {
        const r = document.createElement("div");
        r.className = "form-row";
        return r;
    }

    #fieldWrap(labelText, controlEl, required, opts = {}) {
        const wrap = document.createElement("div");
        wrap.className = "form-field" + (opts.textarea ? " casoTextarea" : "");

        const label = document.createElement("label");
        label.textContent = labelText + (required ? " *" : "");
        wrap.appendChild(label);

        wrap.appendChild(controlEl);

        const error = document.createElement("div");
        error.className = "field-error";
        wrap.appendChild(error);
        return wrap;
    }

    #input(type, required) {
        const i = document.createElement("input");
        i.type = type;
        if (required) i.required = true;
        return i;
    }

    #select(required) {
        const s = document.createElement("select");
        if (!required) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "Seleccionar";
            s.appendChild(opt);
        }
        if (required) s.required = true;
        return s;
    }

    /**
     * Devuelve ahora + 3 horas en formato 'YYYY-MM-DDThh:mm'.
     * @returns {string}
     */
    #nowPlus3h() {
        const d = new Date(Date.now() + 3 * 3600 * 1000);
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        // formato YYYY-MM-DDThh:mm
    }

    /** Agrega una tarjeta de foto (preview + input + quitar). */
    #addPhotoItem() {
        const list = this.refs.photosList;
        if (!list) return;

        const max = this.maxPhotos ?? 5;
        if (list.children.length >= max) {
            alert(`No puedes agregar más de ${max} fotos`);
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "photo-item card";

        // Preview
        const preview = document.createElement("img");
        preview.className = "photo-preview";
        preview.alt = "Vista previa";
        preview.style.display = "none";

        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.required = true;

        // Guardamos el objectURL actual para revocarlo al reemplazar/quitar
        let currentObjectUrl = null;

        input.addEventListener("change", () => {
            // Revoca el anterior si existía
            if (currentObjectUrl) {
                URL.revokeObjectURL(currentObjectUrl);
                currentObjectUrl = null;
            }

            const file = input.files && input.files[0];
            if (!file) {
                preview.src = "";
                preview.style.display = "none";
                this.#syncPhotoRequired();
                return;
            }

            // Validación
            if (!Validators.isImageFile(file)) {
                alert("El archivo seleccionado no es una imagen.");
                input.value = "";
                preview.src = "";
                preview.style.display = "none";
                this.#syncPhotoRequired();
                return;
            }
            if (!Validators.isAllowedImageExt(file.name)) {
                alert("Extensión no permitida. Use .jpg, .jpeg o .png.");
                input.value = "";
                preview.src = "";
                preview.style.display = "none";
                this.#syncPhotoRequired();
                return
            }

            // Genera y muestra el object URL
            const url = URL.createObjectURL(file);
            currentObjectUrl = url;
            preview.src = url;
            preview.style.display = "";
            this.#syncPhotoRequired();
        });

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.textContent = "Quitar";
        removeBtn.addEventListener("click", () => {
            if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
            list.removeChild(wrapper);
            this.#syncPhotoRequired();
        });

        // Orden: preview | input file | quitar
        wrapper.append(preview, input, removeBtn);
        list.appendChild(wrapper);

        this.#syncPhotoRequired();
    }

    #getPhotoInputs() {
        const container = this.refs.photosList || this.refs.photosWrap || null;
        return container ? Array.from(container.querySelectorAll('input[type="file"]')) : [];
    }

    /**
     * Agrega un “contacto por” a la lista.
     * @param {string} network
     * @returns {void}
     */
    #addSocial(network) {
        if (!network) return;
        const list = this.refs.socialList;
        const current = list.querySelectorAll(".social-item").length;
        if (current >= this.maxContacts) {
            alert(`Máximo ${this.maxContacts} contactos`);
            return;
        }
        if (network !== "otra") {
            const exists = Array.from(list.querySelectorAll(".social-item"))
                .some(n => n.dataset.network === network);
            if (exists) {
                alert(`Ya agregaste ${network}`);
                return;
            }
        }

        const item = document.createElement("div");
        item.className = "social-item card";
        item.dataset.network = network;

        const label = document.createElement("div");
        label.textContent = network;

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "ID o URL";
        input.minLength = 4;
        input.maxLength = 50;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Quitar";
        remove.addEventListener("click", () => item.remove());

        item.append(label, input, remove);
        list.appendChild(item);
    }

    // ============ Validación + Submit ============

    /** Limpia mensajes de error visibles. */
    #clearErrors() {
        if (!this.overlay) return;
        this.overlay.querySelectorAll(".field-error").forEach((e) => (e.textContent = ""));
    }

    /**
     * Muestra un error bajo el control indicado.
     * @param {HTMLElement} inputEl
     * @param {string} msg
     * @returns {void}
     */
    #setError(inputEl, msg) {
        const field = inputEl.closest(".form-field");
        if (!field) return;
        const err = field.querySelector(".field-error");
        if (err) err.textContent = msg;
    }

    /** Revoca todos los Object URLs usados en previews. */
    #revokeAllObjectURLs() {
        try {
            (this.refs.photosList?.querySelectorAll?.("img.photo-preview") || []).forEach(img => {
                const src = img.getAttribute("src");
                if (src && src.startsWith("blob:")) URL.revokeObjectURL(src);
            });
        } catch {
        }
    }

    /** Ajusta `required` en inputs de fotos según haya o no archivos. */
    #syncPhotoRequired() {
        const inputs = this.#getPhotoInputs();
        const hasAnyFile = inputs.some(i => (i.files?.length ?? 0) > 0);

        if (!hasAnyFile) {
            // No hay fotos: exigimos al menos una
            inputs.forEach((i, idx) => {
                i.required = idx === 0;
            });
        } else {
            // Hay alguna foto: ningún input necesita required
            inputs.forEach(i => {
                i.required = false;
            });
        }
    }

    /**
     * Valida todos los campos y muestra errores.
     * @returns {boolean}
     */
    #validate() {
        this.#clearErrors();
        let ok = true;

        // ¿Dónde?
        if (!Validators.required(this.refs.region.value)) {
            this.#setError(this.refs.region, "Región es obligatoria");
            ok = false;
        }
        if (!Validators.required(this.refs.comuna.value)) {
            this.#setError(this.refs.comuna, "Comuna es obligatoria");
            ok = false;
        }
        const sector = this.refs.sector.value ?? "";
        if (sector && !Validators.lengthBetween(sector, 0, 100)) {
            this.#setError(this.refs.sector, "Sector: largo máximo 100");
            ok = false;
        }

        // Contacto
        if (!Validators.lengthBetween(this.refs.nombre.value, 3, 200)) {
            this.#setError(this.refs.nombre, "Nombre: 3 a 200 caracteres");
            ok = false;
        }
        if (!Validators.email(this.refs.email.value)) {
            this.#setError(this.refs.email, "Email inválido");
            ok = false;
        }
        const celVal = (this.refs.celular.value || "").trim();
        if (celVal && !Validators.celIntl(celVal)) {
            this.#setError(this.refs.celular, "Formato esperado: +NNN.NNNNNNNN");
            ok = false;
        }
        const socials = Array.from(this.refs.socialList.querySelectorAll(".social-item input"));
        if (socials.length > this.maxContacts) {
            alert(`Máximo ${this.maxContacts} contactos`);
            ok = false;
        }
        for (const i of socials) {
            const v = (i.value ?? "").trim();
            if (!Validators.lengthBetween(v, 4, 50)) {
                this.#setError(i, "ID/URL: 4 a 50 caracteres");
                ok = false;
            }
        }

        // Mascota
        if (!Validators.oneOf(this.refs.tipo.value, ["Gato", "Perro"])) {
            this.#setError(this.refs.tipo, "Debe seleccionar gato o perro");
            ok = false;
        }
        if (!Validators.intMin(this.refs.cantidad.value, 1)) {
            this.#setError(this.refs.cantidad, "Cantidad: mínimo 1");
            ok = false;
        }
        if (!Validators.intMin(this.refs.edad.value, 1)) {
            this.#setError(this.refs.edad, "Edad: mínimo 1");
            ok = false;
        }
        if (!Validators.oneOf(this.refs.unidadEdad.value, ["meses", "años"])) {
            this.#setError(this.refs.unidadEdad, "Seleccione meses o años");
            ok = false;
        }
        if (!Validators.datetimeLocalGte(this.refs.fechaEntrega.value, this.refs.fechaEntrega.min)) {
            this.#setError(this.refs.fechaEntrega, "Fecha/hora >= sugerida y con formato válido");
            ok = false;
        }

        // Fotos
        const container = this.refs.photosList || this.refs.photosWrap; // soporte ambas
        const photoInputs = this.#getPhotoInputs();
        const totalFiles = photoInputs.reduce((acc, i) => acc + (i.files?.length ?? 0), 0);

        if (totalFiles < 1 || totalFiles > this.maxPhotos) {
            const field = container?.closest(".form-field");
            const err = field?.querySelector(".field-error");
            if (totalFiles < 1) {
                if (err) err.textContent = `Debes subir al menos 1 foto o elimina la tarjeta vacía.`;

                if (photoInputs[0]) {
                    photoInputs[0].required = true;
                    photoInputs[0].reportValidity?.();
                }
            } else {
                if (err) err.textContent = `Máximo ${this.maxPhotos} fotos.`;
            }
            ok = false;
        } else {
            const field = container?.closest(".form-field");
            const err = field?.querySelector(".field-error");
            if (err) err.textContent = "";
        }

        return ok;
    }

    /**
     * Recolecta datos desde el formulario y los mapea a FormData.
     * @returns {FormData}
     */
    #collectFormData() {
        // contactos
        const socialItems = Array.from(this.refs.socialList.querySelectorAll(".social-item"))
            .map(item => ({
                nombre: (item.dataset.network || "").toLowerCase(), // ej: 'instagram'
                identificador: item.querySelector("input")?.value?.trim() || ""
            }))
            .filter(x => x.nombre && x.identificador);

        // fotos
        const photosContainer = this.refs.photosList || this.refs.photosWrap || null;
        const photoInputs = photosContainer ? Array.from(photosContainer.querySelectorAll('input[type="file"]')) : [];
        const files = photoInputs.flatMap(i => Array.from(i.files ?? []));

        // mapear UI -> API
        const tipo = this.refs.tipo.value.toLowerCase();                // 'gato'|'perro'
        const unidad = this.refs.unidadEdad.value === "meses" ? "m" : "a";
        const fechaEntrega = (this.refs.fechaEntrega.value || "");

        const fd = new FormData();
        fd.append("comuna_id", this.refs.comuna.value);                 // ahora es ID
        fd.append("sector", this.refs.sector.value || "");
        fd.append("nombre", this.refs.nombre.value || "");
        fd.append("email", this.refs.email.value || "");
        fd.append("celular", this.refs.celular.value || "");
        fd.append("tipo", tipo);
        fd.append("cantidad", String(this.refs.cantidad.value || "0"));
        fd.append("edad", String(this.refs.edad.value || "0"));
        fd.append("unidad_medida", unidad);
        fd.append("fecha_entrega", fechaEntrega);
        fd.append("descripcion", this.refs.descripcion.value || "");

        // contactos[]
        for (const c of socialItems) {
            fd.append("contactos[nombre][]", c.nombre);
            fd.append("contactos[identificador][]", c.identificador);
        }

        // fotos[]
        for (const f of files) {
            fd.append("fotos[]", f, f.name);
        }

        return fd;
    }

    /** Maneja el submit: confirma y envía a /api/avisos. */
    #onSubmit() {
        if (!this.#validate()) return;

        // Confirmación dentro del modal
        const confirmBox = document.createElement("div");
        confirmBox.className = "confirm-box card";
        confirmBox.innerHTML = `
            <p>¿Está seguro que desea agregar este aviso de adopción?</p>
            <div class="confirm-actions">
                <button type="button" class="btn-primary">Sí, estoy seguro</button>
                <button type="button" class="btn-secondary">No, no estoy seguro, quiero volver al formulario</button>
            </div>
            `;

        const yes = confirmBox.querySelector(".btn-primary");
        const no = confirmBox.querySelector(".btn-secondary");

        // Inserto al final del modal y scrolleo
        this.content.appendChild(confirmBox);
        confirmBox.scrollIntoView({behavior: "smooth", block: "center"});

        const cleanup = () => confirmBox.remove();

        yes.addEventListener("click", async () => {
            const fd = this.#collectFormData();

            yes.disabled = true;
            no.disabled = true;
            try {
                const res = await fetch("/api/avisos", {method: "POST", body: fd});
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                    const detalles = Array.isArray(json?.errores) ? json.errores : (json?.error ? [json.error] : ["Error al crear el aviso."]);
                    alert("No se pudo crear el aviso:\n- " + detalles.join("\n- "));
                    yes.disabled = false;
                    no.disabled = false;
                    return;
                }
                const homeHref = (window.ROUTES?.home ?? "index.html");
                this.content.innerHTML = `
                    <div class="success-box">
                        <h2>Hemos recibido la información de adopción, ¡gracias!</h2>
                        <div style="margin-top:16px;">
                            <a href="${homeHref}" class="btn-primary">Volver a la portada</a>
                        </div>
                    </div>
                `;
            } catch (err) {
                console.error(err);
                alert("Error de red al crear el aviso.");
                yes.disabled = false;
                no.disabled = false;
            }
        });

        no.addEventListener("click", () => {
            cleanup(); // volver al formulario intacto
        });
    }

    /** Carga regiones en el select correspondiente. */
    async #loadRegiones() {
        const sel = this.refs.region;
        if (!sel) return;

        sel.innerHTML = "";
        const opt0 = document.createElement("option");
        opt0.value = "";
        opt0.textContent = "Seleccionar región";
        sel.appendChild(opt0);

        try {
            const res = await fetch("/api/regiones");
            if (!res.ok) throw new Error("Error cargando regiones");
            const json = await res.json();
            (json.data || []).forEach(r => {
                const o = document.createElement("option");
                o.value = String(r.id);
                o.textContent = r.nombre;
                sel.appendChild(o);
            });
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Carga comunas según región.
     * @param {number} regionId
     * @returns {Promise<void>}
     */
    async #loadComunas(regionId) {
        const sel = this.refs.comuna;
        if (!sel) return;

        sel.innerHTML = "";
        const opt0 = document.createElement("option");
        opt0.value = "";
        opt0.textContent = "Seleccionar comuna";
        sel.appendChild(opt0);

        if (!Number.isFinite(regionId) || regionId <= 0) return;

        try {
            const res = await fetch(`/api/regiones/${regionId}/comunas`);
            if (!res.ok) throw new Error("Error cargando comunas");
            const json = await res.json();
            (json.data || []).forEach(c => {
                const o = document.createElement("option");
                o.value = String(c.id);
                o.textContent = c.nombre;
                sel.appendChild(o);
            });
        } catch (e) {
            console.error(e);
        }
    }
}


window.AddModal = AddModal;

