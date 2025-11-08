package tarea4.models;

import jakarta.persistence.*;

@Entity
@Table(name = "foto")
public class Foto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "ruta_archivo", nullable = false, length = 300)
    private String rutaArchivo;

    @Column(name = "nombre_archivo", nullable = false, length = 300)
    private String nombreArchivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aviso_id", nullable = false)
    private AvisoAdopcion aviso;

    public Integer getId() { return id; }
    public String getRutaArchivo() { return rutaArchivo; }
    public String getNombreArchivo() { return nombreArchivo; }
    public AvisoAdopcion getAviso() { return aviso; }

    public void setId(Integer id) { this.id = id; }
    public void setRutaArchivo(String rutaArchivo) { this.rutaArchivo = rutaArchivo; }
    public void setNombreArchivo(String nombreArchivo) { this.nombreArchivo = nombreArchivo; }
    public void setAviso(AvisoAdopcion aviso) { this.aviso = aviso; }
}
