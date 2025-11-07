package tarea4.models;

import jakarta.persistence.*;

@Entity
@Table(name = "contactar_por")
public class ContactarPor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre; // 'whatsapp'|'telegram'|'X'|...

    @Column(name = "identificador", nullable = false, length = 150)
    private String identificador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aviso_id", nullable = false)
    private AvisoAdopcion aviso;

    public Integer getId() { return id; }
    public String getNombre() { return nombre; }
    public String getIdentificador() { return identificador; }
    public AvisoAdopcion getAviso() { return aviso; }

    public void setId(Integer id) { this.id = id; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public void setIdentificador(String identificador) { this.identificador = identificador; }
    public void setAviso(AvisoAdopcion aviso) { this.aviso = aviso; }
}
