// Catálogo de Regiones y Comunas de Chile para formularios dependientes.
class CLRegions {
    static #DATA = [
        {
            code: "RM",
            region: "Región Metropolitana de Santiago",
            comunas: [
                "Cerrillos", "Cerro Navia", "Conchalí", "El Bosque", "Estación Central", "Huechuraba",
                "Independencia", "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina",
                "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado", "Macul", "Maipú", "Ñuñoa",
                "Pedro Aguirre Cerda", "Peñalolén", "Providencia", "Pudahuel", "Quilicura",
                "Quinta Normal", "Recoleta", "Renca", "Santiago", "San Joaquín", "San Miguel",
                "San Ramón", "Vitacura"
            ],
        },
        {
            code: "V",
            region: "Valparaíso",
            comunas: [
                "Valparaíso", "Viña del Mar", "Concón", "Quilpué", "Villa Alemana",
                "Quillota", "La Calera", "San Antonio", "Cartagena", "San Felipe", "Los Andes"
            ],
        },
        {
            code: "VII",
            region: "Maule",
            comunas: [
                "Talca", "Curicó", "Linares", "Cauquenes", "Maule", "San Clemente", "San Javier",
                "Constitución", "Teno", "Molina", "Parral", "Longaví"
            ],
        },
        {
            code: "IV",
            region: "Coquimbo",
            comunas: [
                "La Serena", "Coquimbo", "Andacollo", "Vicuña", "Ovalle", "Monte Patria",
                "Illapel", "Los Vilos"
            ],
        },
        {
            code: "VI",
            region: "Libertador General Bernardo O'Higgins",
            comunas: [
                "Rancagua", "Machalí", "San Fernando", "Santa Cruz", "Rengo", "Requínoa", "Graneros",
                "Mostazal", "Pichilemu"
            ],
        },
        {
            code: "VIII",
            region: "Biobío",
            comunas: [
                "Concepción", "Talcahuano", "San Pedro de la Paz", "Chiguayante", "Coronel", "Hualpén",
                "Lota", "Tomé", "Los Ángeles"
            ],
        },
        {
            code: "IX",
            region: "La Araucanía",
            comunas: [
                "Temuco", "Padre Las Casas", "Villarrica", "Pucón", "Angol", "Victoria",
                "Freire", "Gorbea", "Lautaro"
            ],
        },
        {
            code: "X",
            region: "Los Lagos",
            comunas: [
                "Puerto Montt", "Puerto Varas", "Osorno", "Castro", "Ancud", "Quellón",
                "Frutillar", "Llanquihue"
            ],
        },
        {
            code: "XIV",
            region: "Los Ríos",
            comunas: [
                "Valdivia", "La Unión", "Río Bueno", "Paillaco", "Panguipulli", "Lanco", "Futrono"
            ],
        },
        {
            code: "XII",
            region: "Magallanes y de la Antártica Chilena",
            comunas: [
                "Punta Arenas", "Puerto Natales", "Porvenir"
            ],
        },
        {
            code: "I",
            region: "Tarapacá",
            comunas: [
                "Iquique", "Alto Hospicio", "Pozo Almonte"
            ],
        },
        {
            code: "II",
            region: "Antofagasta",
            comunas: [
                "Antofagasta", "Calama", "Tocopilla", "Mejillones"
            ],
        },
        {
            code: "III",
            region: "Atacama",
            comunas: [
                "Copiapó", "Vallenar", "Caldera", "Chañaral"
            ],
        },
        {
            code: "XV",
            region: "Arica y Parinacota",
            comunas: [
                "Arica", "Putre"
            ],
        },
        {
            code: "XVI",
            region: "Ñuble",
            comunas: [
                "Chillán", "Chillán Viejo", "San Carlos", "Coihueco", "Bulnes", "Quirihue"
            ],
        },
        {
            code: "XI",
            region: "Aysén del General Carlos Ibáñez del Campo",
            comunas: [
                "Coyhaique", "Aysén", "Puerto Aysén", "Cisnes"
            ],
        },
    ];

    /** Lista de nombres de regiones (string[]) */
    static getRegions() {
        return this.#DATA.map(r => r.region);
    }

    /**
     * Comunas por región (acepta nombre exacto o code).
     * @param {string} regionOrCode
     * @returns {string[]}
     */
    static getComunas(regionOrCode) {
        if (!regionOrCode) return [];
        const key = regionOrCode.trim().toLowerCase();
        const found = this.#DATA.find(
            r => r.region.toLowerCase() === key || r.code.toLowerCase() === key
        );
        return found ? found.comunas : [];
    }

    /**
     * Devuelve un objeto { region, code } al buscar por comuna.
     * @param {string} comuna
     * @returns {{region:string, code:string} | null}
     */
    static findRegionByComuna(comuna) {
        const key = (comuna ?? "").trim().toLowerCase();
        for (const r of this.#DATA) {
            if (r.comunas.some(c => c.toLowerCase() === key)) {
                return {region: r.region, code: r.code};
            }
        }
        return null;
    }

    /**
     * Llena un <select> de regiones (inserta una opción placeholder si se indica).
     * @param {HTMLSelectElement} selectEl
     * @param {string} [placeholder="Seleccionar región"]
     */
    static fillRegionSelect(selectEl, placeholder = "Seleccionar región") {
        if (!selectEl) return;
        selectEl.innerHTML = "";
        const opt0 = document.createElement("option");
        opt0.value = "";
        opt0.textContent = placeholder;
        selectEl.appendChild(opt0);

        this.#DATA.forEach(r => {
            const o = document.createElement("option");
            o.value = r.region; // guardamos nombre completo
            o.textContent = r.region;
            selectEl.appendChild(o);
        });
    }

    /**
     * Llena un <select> de comunas según la región seleccionada.
     * @param {HTMLSelectElement} selectEl
     * @param {string} regionOrCode
     * @param {string} [placeholder="seleccionar comuna"]
     */
    static fillComunaSelect(selectEl, regionOrCode, placeholder = "Seleccionar comuna") {
        if (!selectEl) return;
        selectEl.innerHTML = "";
        const opt0 = document.createElement("option");
        opt0.value = "";
        opt0.textContent = placeholder;
        selectEl.appendChild(opt0);

        this.getComunas(regionOrCode).forEach(c => {
            const o = document.createElement("option");
            o.value = c;
            o.textContent = c;
            selectEl.appendChild(o);
        });
    }
}

window.CLRegions = CLRegions;
