package tarea4.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tarea4.services.NotasService;

@RestController
@RequestMapping("/api")
public class NotasController {

    private final NotasService notasService;

    public NotasController(NotasService notasService) {
        this.notasService = notasService;
    }

    // Body esperado: { "nota": int }
    public record RatingRequest(Integer nota) {}

    // Respuesta: { "avisoId", "nuevoPromedio", "nuevoConteo" }
    public record RatingResponse(Integer avisoId, Double nuevoPromedio, Long nuevoConteo) {}

    @PostMapping("/avisos/{avisoId}/notas")
    public ResponseEntity<?> crearNota(
            @PathVariable("avisoId") Integer avisoId,
            @RequestBody(required = false) RatingRequest payload
    ) {
        if (payload == null || payload.nota() == null) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error("La nota debe ser un entero entre 1 y 7."));
        }

        try {
            var resultado = notasService.registrarNota(avisoId, payload.nota());
            RatingResponse resp = new RatingResponse(
                    resultado.avisoId(),
                    resultado.promedio(),
                    resultado.conteo()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(error(e.getMessage()));
        }
    }

    private static java.util.Map<String, String> error(String msg) {
        return java.util.Map.of("error", msg);
    }
}
