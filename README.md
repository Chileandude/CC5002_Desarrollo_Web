# Plataforma de Adopción de Mascotas

Aplicación web desarrollada en Spring Boot con Thymeleaf y MySQL, que permite visualizar y evaluar avisos de adopción de mascotas.

- **Evaluar (`evaluate.html`)**: vista para asignar notas (1–7) a cada aviso, registradas en la base de datos.

El proyecto fue desarrollado aplicando principios de **DRY (Don't Repeat Yourself)** y un enfoque **orientado a objetos (OOP)** en la organización de componentes JavaScript.

---

## Instalación
1. Clona el repositorio.
2. Asegúrate de tener instalado:
   - Java **21+**
   - Maven **3.9+**
3. Además, debes tener MySQL instalado y en ejecución.

## Uso
Ejecuta la aplicación Spring Boot con:
```
./mvnw spring-boot:run       # Linux / macOS
.\mvnw.cmd spring-boot:run   # Windows
```
La aplicación estará disponible en: http://127.0.0.1:5000

Para detener la aplicación basta haciendo `Crtl + C` en la terminal.

---
## Base de datos
La app usa las credenciales definidas en `application.properties`:

- USER: `cc5002`
- PASSWORD: `programacionweb`
- HOST: `localhost`
- PORT: `3306`
- DB: `tarea2`
- URI: `mysql+pymysql://cc5002:programacionweb@localhost:3306/tarea2?charset=utf8`

### 1) Crear base y usuario
Desde tu terminal, ejecuta (necesitaras permisos de administrador):
```
mysql -u root -p -e "CREATE DATABASE tarea2;
CREATE USER 'cc5002'@'localhost' IDENTIFIED BY 'programacionweb';
GRANT ALL PRIVILEGES ON tarea2.* TO 'cc5002'@'localhost';
FLUSH PRIVILEGES;"
```

### 2) Cargar los scripts SQL
Ahora para poblar la base de datos:
```
# Linux
mysql -u cc5002 -pprogramacionweb tarea2 < bdd/tarea2.sql
mysql -u cc5002 -pprogramacionweb tarea2 < bdd/region-comuna.sql
mysql -u cc5002 -pprogramacionweb tarea2 < bdd/cargar_dummy.sql
mysql -u cc5002 -pprogramacionweb tarea2 < bdd/tabla-comentario.sql
mysql -u cc5002 -pprogramacionweb tarea2 < bdd/tabla-nota.sql

# Windows
mysql -u cc5002 -pprogramacionweb tarea2 < bdd\tarea2.sql
mysql -u cc5002 -pprogramacionweb tarea2 < bdd\region-comuna.sql
mysql -u cc5002 -pprogramacionweb tarea2 < bdd\cargar_dummy.sql
mysql -u cc5002 -pprogramacionweb tarea2 < bdd\tabla-comentario.sql 
mysql -u cc5002 -pprogramacionweb tarea2 < bdd\tabla-nota.sql 
```
El primer script es obligatorio, ya que crea las tablas vacías necesarias para que la aplicación funcione.
El segundo script carga en las tablas región y comuna los datos de referencia.
Finalmente, el tercer script inserta avisos de adopción de prueba en la base de datos.

---