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

window.PhotoLightbox = PhotoLightbox;
