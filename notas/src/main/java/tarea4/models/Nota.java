package tarea4.models;

import jakarta.persistence.*;

@Entity
@Table(name = "nota")
public class Nota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "aviso_id", nullable = false)
    private Integer avisoId;

    @Column(name = "nota", nullable = false)
    private Integer valor;

    public Nota() {
    }

    public Nota(Integer avisoId, Integer valor) {
        this.avisoId = avisoId;
        this.valor = valor;
    }

    public Integer getId() {
        return id;
    }

    public Integer getAvisoId() {
        return avisoId;
    }

    public Integer getValor() {
        return valor;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setAvisoId(Integer avisoId) {
        this.avisoId = avisoId;
    }

    public void setValor(Integer valor) {
        this.valor = valor;
    }
}
