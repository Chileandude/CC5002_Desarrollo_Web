package tarea4.services;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import tarea4.models.AvisoAdopcion;
import tarea4.models.ContactarPor;
import tarea4.models.Foto;
import tarea4.repository.AvisoAdopcionRepository;
import tarea4.repository.NotaRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class AvisosService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final AvisoAdopcionRepository avisoRepo;
    private final NotaRepository notaRepo;

    public AvisosService(AvisoAdopcionRepository avisoRepo, NotaRepository notaRepo) {
        this.avisoRepo = avisoRepo;
        this.notaRepo = notaRepo;
    }

    public AvisosPageResponse listarAvisos(int page, int size) {
        // Normalización igual que Flask
        int p = page;
        int s = size;
        if (p < 1) p = 1;
        if (s < 1 || s > 50) s = 5;

        int pageIndex = p - 1;
        PageRequest pageable = PageRequest.of(pageIndex, s, Sort.by(Sort.Direction.DESC, "fechaIngreso").and(Sort.by(Sort.Direction.DESC, "id")));

        Page<AvisoAdopcion> pageResult = avisoRepo.findAll(pageable);

        List<AvisoItem> data = pageResult.getContent().stream()
                .map(this::toAvisoItem)
                .toList();

        long totalItems = pageResult.getTotalElements();
        int totalPages = pageResult.getTotalPages();
        int currentPage = pageResult.getNumber() + 1;
        int pageSize = pageResult.getSize();

        return new AvisosPageResponse(currentPage, pageSize, totalItems, totalPages, data);
    }

    private AvisoItem toAvisoItem(AvisoAdopcion a) {
        // agregados de nota
        Double promedio = notaRepo.promedioPorAviso(a.getId());
        long conteo = notaRepo.countByAvisoId(a.getId());
        Double notaPromedio = (promedio != null) ? promedio : null;
        int notasCount = (int) conteo;

        // region/comuna
        String region = null;
        String comuna = null;
        if (a.getComuna() != null) {
            comuna = a.getComuna().getNombre();
            if (a.getComuna().getRegion() != null) {
                region = a.getComuna().getRegion().getNombre();
            }
        }

        // contactos
        List<ContactoDTO> contactarPor = (a.getContactos() == null) ? List.of()
                : a.getContactos().stream()
                .map(c -> new ContactoDTO(c.getNombre(), c.getIdentificador()))
                .toList();

        // fotos
        List<String> fotos = (a.getFotos() == null) ? List.of()
                : a.getFotos().stream()
                .map(f -> buildPhotoUrl(f.getRutaArchivo(), f.getNombreArchivo()))
                .filter(u -> !u.isEmpty())
                .toList();

        return new AvisoItem(
                a.getId(),
                region,
                comuna,
                a.getSector(),
                a.getNombre(),   // contacto_nombre
                a.getEmail(),    // contacto_email
                a.getCelular(),  // contacto_celular
                contactarPor,
                a.getTipo(),
                a.getCantidad(),
                a.getEdad(),
                a.getUnidadMedida(),                // edad_unidad
                fmt(a.getFechaEntrega()),           // fecha_disponible
                fmt(a.getFechaIngreso()),           // creado_en
                a.getDescripcion(),
                fotos,
                notaPromedio,
                notasCount
        );
    }

    private String fmt(LocalDateTime dt) {
        return dt == null ? null : dt.format(FMT);
    }

    private String buildPhotoUrl(String rutaArchivo, String nombreArchivo) {
        String ruta = rutaArchivo == null ? "" : rutaArchivo.trim();
        String nombre = nombreArchivo == null ? "" : nombreArchivo.trim();
        if (ruta.isEmpty() || nombre.isEmpty()) return "";
        String base = ruta.startsWith("/") ? ruta : "/" + ruta;
        if (!base.endsWith("/")) base = base + "/";
        return base + nombre;
    }

    public record ContactoDTO(
            String via,
            String id
    ) {}

    public record AvisoItem(
            Integer id,
            String region,
            String comuna,
            String sector,

            @JsonProperty("contacto_nombre")
            String contactoNombre,

            @JsonProperty("contacto_email")
            String contactoEmail,

            @JsonProperty("contacto_celular")
            String contactoCelular,

            @JsonProperty("contactar_por")
            List<ContactoDTO> contactarPor,

            String tipo,
            Integer cantidad,
            Integer edad,

            @JsonProperty("edad_unidad")
            String edadUnidad,

            @JsonProperty("fecha_disponible")
            String fechaDisponible,

            @JsonProperty("creado_en")
            String creadoEn,

            String descripcion,
            List<String> fotos,

            @JsonProperty("nota_promedio")
            Double notaPromedio,

            @JsonProperty("notas_count")
            Integer notasCount
    ) {}

    public record AvisosPageResponse(
            int page,
            int size,

            @JsonProperty("total_items")
            long totalItems,

            @JsonProperty("total_pages")
            int totalPages,

            List<AvisoItem> data
    ) {}
}
