# DAM · Tutorías y Asesorías Académicas — UMG

**DAM** (Desarrollo, Aprendizaje y Mejora) organiza las tutorías de la Facultad de Ingeniería en Sistemas:

1. La **coordinación** crea la tutoría con su rango (período, franja horaria y días) y asigna catedráticos.
2. Cada **catedrático** publica sus horarios disponibles dentro de ese rango.
3. El **estudiante** (que se registra solo con su carné y correo @miumg.edu.gt) elige catedrático y horario y envía su solicitud.

**Tecnologías:** PHP 8 (MVC, PDO) · MySQL/MariaDB · React 18 (Vite)

## Ejecutar en XAMPP (no requiere Node)

1. Copiar la carpeta `tutorias-umg` dentro de `C:\xampp\htdocs\`.
2. Encender **Apache** y **MySQL** en el panel de XAMPP.
3. En phpMyAdmin → pestaña **Importar**: primero `database/database.sql`, luego `database/datos-prueba.sql`.
4. Abrir **http://localhost/tutorias-umg/app/** (página de inicio pública; desde ahí se inicia sesión o se crea cuenta)

Si MySQL tiene contraseña o usa otro puerto, ajustar `api/.env`.

### Usuarios de prueba (contraseña: `Umg2026!`)

| Rol | Usuario |
|---|---|
| Administrador | `admin` |
| Catedrático | `cmorales`, `aperez`, `jlopez`, `mrodas` |
| Estudiante | `5190-22-1001`, `5190-22-1002`, `5190-23-1003`, `5190-23-1004` |

### Probar solo la API

Importar `tutorias-umg.postman_collection.json` en Postman y ejecutar primero un *Login*.
El token CSRF se guarda automáticamente.

## Estructura

```
api/
  .env              configuración de la base de datos
  core/             Env, Configuration, Connection (PDO), Response, Request, Auth
  models/           consultas y reglas de negocio (Usuarios, Tutorias, Bloques, Solicitudes)
  controllers/      un archivo por recurso; despacha según el método HTTP y responde JSON
app/                build de React listo para Apache
frontend/public/assets/  logos e imágenes de DAM
frontend/           código fuente de React
database/           script de creación y datos de prueba
```

| Recurso | GET | POST | PUT | DELETE |
|---|---|---|---|---|
| `inicio.php` | cifras y catedráticos (público) | | | |
| `sesion.php` | sesión actual | `?accion=login` / `registro` / `logout` | | |
| `usuarios.php` | listar / `?id=` | crear | editar / `?accion=estado` | desactivar |
| `tutorias.php` | listar / `?id=` / `?accion=cursos` | crear | editar / `?accion=tutores` / `?accion=estado` | desactivar |
| `bloques.php` | listar con filtros | publicar | editar | cancelar |
| `solicitudes.php` | listar con filtros | solicitar | `?accion=cancelar` | |

## Reglas de seguridad y negocio

- La identidad sale de la sesión; el rol se vuelve a consultar en la BD en cada petición.
- Contraseñas con `password_hash` / `password_verify`; consultas preparadas en todo el sistema.
- Token CSRF en la cabecera `X-CSRF-Token` para toda petición que modifica datos.
- Un catedrático no puede tener bloques traslapados; el bloque debe ser futuro, con fin > inicio y dentro del rango de la tutoría (período, días y franja).
- El autoregistro solo crea estudiantes: el rol nunca se toma de la petición. Los catedráticos los registra la coordinación.
- Varios estudiantes pueden aplicar al mismo bloque (se muestra cuántos); un estudiante no puede
  aplicar dos veces al mismo bloque ni tener dos solicitudes activas en horarios que se crucen.
- El enlace de la reunión solo se muestra al estudiante cuando su solicitud es aceptada.
- Bajas lógicas: usuarios y tutorías se desactivan para conservar el historial.

## Desarrollo del frontend

```
cd frontend
npm install
npm run dev      # http://localhost:5173 (usa la API de XAMPP mediante proxy)
npm run build    # genera la carpeta app/
```

## Avance

- [x] Fase 1–2: análisis, modelo de datos, API base, login y sesiones
- [x] Fase 3: CRUD de usuarios, tutorías y bloques; filtros
- [ ] Fase 4: solicitudes — crear, listar y cancelar listos; falta aceptar / rechazar / registrar atención
- [ ] Fase 5: panel de indicadores
- [ ] Fase 6: guía visual definitiva
