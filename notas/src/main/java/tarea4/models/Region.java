package tarea4.models;

import jakarta.persistence.*;

@Entity
@Table(name = "region")
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 200)
    private String nombre;

    public Integer getId() { return id; }
    public String getNombre() { return nombre; }

    public void setId(Integer id) { this.id = id; }
    public void setNombre(String nombre) { this.nombre = nombre; }
}
