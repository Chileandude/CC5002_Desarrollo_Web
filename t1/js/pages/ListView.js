(function () {
  class ListView {
    constructor() {
      this.container = document.getElementById("notices");
      if (!this.container) throw new Error("#notices no encontrado");
      this.list = new window.AdoptionList(this.container);
    }

    init() {
      const p = new URLSearchParams(location.search);

      if (p.has("id")) {
        const id = Number(p.get("id"));
        this.list.renderOne(id);
        return;
      }
      if (p.has("ids")) {
        const ids = String(p.get("ids"))
          .split(",")
          .map((x) => Number(x.trim()))
          .filter((n) => Number.isFinite(n));
        this.list.renderMany(ids);
        return;
      }
      if (p.has("latest")) {
        const n = Number(p.get("latest")) || 6;
        this.list.renderLatest(n);
        return;
      }

      const regionQ = p.get("region")?.trim();
      const desde = p.get("desde")?.trim();
      const hasta = p.get("hasta")?.trim();
      if (regionQ || desde || hasta) {
        const from = desde ? `${desde}T00:00` : null;
        const to = hasta ? `${hasta}T23:59` : null;
        this.list.renderWhere((ad) => {
          const okRegion = regionQ ? ad.region.toLowerCase().includes(regionQ.toLowerCase()) : true;
          const okDesde = from ? ad.fecha_disponible >= from : true;
          const okHasta = to ? ad.fecha_disponible <= to : true;
          return okRegion && okDesde && okHasta;
        });
        return;
      }

      this.list.renderAll();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    try {
      new ListView().init();
    } catch (e) {
      console.error(e);
      const c = document.getElementById("notices");
      if (c) c.innerHTML = `<p class="empty">Error cargando avisos</p>`;
    }
  });
})();
