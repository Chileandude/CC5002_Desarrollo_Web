# Plataforma de Adopción de Mascotas

Aplicación web que muestra avisos de adopción a través de tres vistas:

- **Portada (`index.html`)**: bienvenida, botón para agregar aviso y últimos 5 avisos publicados.
- **Listado (`list.html`)**: tabla con todos los avisos, permite ver detalles y fotos ampliadas.
- **Estadísticas (`stats.html`)**: gráficos estáticos con distribución de avisos por fecha y tipo de mascota.

El proyecto fue desarrollado aplicando principios de **DRY (Don't Repeat Yourself)** y un enfoque **orientado a objetos (OOP)** en la organización de componentes JavaScript.  

---

## Instalación
1. Clona el repositorio.
2. Asegúrate de tener Python **3.10+** instalado.
3. Además, debes tener MySQL instalado y en ejecución.
4. Crear un entorno virtual (recomendado):
``` 
python -m venv venv
source venv/bin/activate   # En Linux
venv\Scripts\activate      # En Windows
```
5. Instalar dependencias desde requirements.txt:
``` 
pip install -r requirements.txt
```
---
## Uso
Ejecuta la aplicación Flask con:
```
python3 run.py # En Linux
python run.py  # En Windows
```
La aplicación estará disponible en: http://127.0.0.1:5000

Para detener la aplicación basta haciendo `Crtl + C` en la terminal.

---
## Base de datos
La app usa las credenciales definidas en `pagina/config.py`:

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
mysql -u cc5002 -pprogramacionweb tarea2 < bdd\tarea2.sql
mysql -u cc5002 -pprogramacionweb tarea2 < bdd\region-comuna.sql
mysql -u cc5002 -pprogramacionweb tarea2 < bdd\cargar_dummy.sql
```
El primer script es obligatorio, ya que crea las tablas vacías necesarias para que la aplicación funcione.
El segundo script carga en las tablas región y comuna los datos de referencia.
Finalmente, el tercer script inserta avisos de adopción de prueba en la base de datos.
