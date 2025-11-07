package tarea4.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import tarea4.services.AvisosService;

@RestController
@RequestMapping("/api/avisos")
public class AvisosController {

    private final AvisosService avisosService;

    public AvisosController(AvisosService avisosService) {
        this.avisosService = avisosService;
    }

    @GetMapping
    public AvisosService.AvisosPageResponse listarAvisos(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "5") int size
    ) {
        return avisosService.listarAvisos(page, size);
    }
}
