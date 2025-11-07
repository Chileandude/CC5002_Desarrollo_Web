package tarea4.services;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tarea4.models.Nota;
import tarea4.repository.NotaRepository;

@Service
public class NotasService {

    private final NotaRepository notaRepository;

    public NotasService(NotaRepository notaRepository) {
        this.notaRepository = notaRepository;
    }

    @Transactional
    public ResultadoNota registrarNota(Integer avisoId, int nota) {
        if (nota < 1 || nota > 7) {
            throw new IllegalArgumentException("La nota debe estar entre 1 y 7.");
        }

        try {
            Nota n = new Nota(avisoId, nota);
            notaRepository.save(n);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("El aviso especificado no existe o la nota es inválida.", e);
        }

        long conteo = notaRepository.countByAvisoId(avisoId);
        Double promedio = notaRepository.promedioPorAviso(avisoId);
        double prom = (promedio == null) ? 0.0 : promedio;

        return new ResultadoNota(avisoId, prom, conteo);
    }

    public record ResultadoNota(Integer avisoId, double promedio, long conteo) {}
}
