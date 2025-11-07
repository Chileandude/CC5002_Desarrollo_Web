package tarea4.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tarea4.models.Nota;
import tarea4.repository.AvisoAdopcionRepository;
import tarea4.repository.NotaRepository;

@RestController
@RequestMapping("/api")
public class NotasController {

    private final AvisoAdopcionRepository avisoRepo;
    private final NotaRepository notaRepo;

    public NotasController(AvisoAdopcionRepository avisoRepo, NotaRepository notaRepo) {
        this.avisoRepo = avisoRepo;
        this.notaRepo = notaRepo;
    }

    // Body esperado: { "nota": int }
    public record RatingRequest(Integer nota) {}

    // Respuesta: { "avisoId", "nuevoPromedio", "nuevoConteo" }
    public record RatingResponse(Integer avisoId, Double nuevoPromedio, Integer nuevoConteo) {}

    @PostMapping("/avisos/{avisoId}/notas")
    public ResponseEntity<?> crearNota(
            @PathVariable("avisoId") Integer avisoId,
            @RequestBody(required = false) RatingRequest payload
    ) {
        // Equivalente a: if not request.is_json:
        if (payload == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error("Se requiere JSON"));
        }

        // Parseo y validación de nota: 1..7
        Integer notaVal = payload.nota();
        if (notaVal == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error("La nota debe ser un entero entre 1 y 7."));
        }
        if (notaVal < 1 || notaVal > 7) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error("La nota debe ser un entero entre 1 y 7."));
        }

        // Verificar aviso (existe?: count>0 en Flask, aquí existsById)
        boolean existe = avisoRepo.existsById(avisoId);
        if (!existe) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(error("Aviso no encontrado"));
        }

        // Insertar nota
        Nota n = new Nota(avisoId, notaVal);
        notaRepo.save(n);

        // Recalcular agregados
        Double promedio = notaRepo.promedioPorAviso(avisoId);
        long conteo = notaRepo.countByAvisoId(avisoId);

        RatingResponse resp = new RatingResponse(
                avisoId,
                promedio != null ? promedio : null,
                (int) conteo
        );

        // Flask devuelve 201
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(resp);
    }

    private static java.util.Map<String, String> error(String msg) {
        return java.util.Map.of("error", msg);
    }
}
