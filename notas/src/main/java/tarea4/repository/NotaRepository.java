package tarea4.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import tarea4.models.Nota;

public interface NotaRepository extends JpaRepository<Nota, Integer> {

    long countByAvisoId(Integer avisoId);

    @Query("SELECT AVG(n.valor) FROM Nota n WHERE n.avisoId = :avisoId")
    Double promedioPorAviso(@Param("avisoId") Integer avisoId);
}
