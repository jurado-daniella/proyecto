# DAM · Tutorías y Asesorías Académicas — UMG

**DAM** (Desarrollo, Aprendizaje y Mejora) organiza las tutorías de la Facultad de Ingeniería en Sistemas:

1. La **coordinación** crea la tutoría con su rango (período, franja horaria y días) y asigna catedráticos.
2. Cada **catedrático** publica sus horarios disponibles dentro de ese rango.
3. El **estudiante** (que se registra solo con su carné y correo @miumg.edu.gt) elige catedrático y horario y envía su solicitud.

**Tecnologías:** PHP 8 (MVC, PDO) · MySQL/MariaDB · HTML, CSS y JavaScript (vanilla, sin frameworks)

## Ejecutar en XAMPP

1. Copiar la carpeta `tutorias-umg` dentro de `C:\xampp\htdocs\`.
2. Encender **Apache** y **MySQL** en el panel de XAMPP.
3. En phpMyAdmin → pestaña **Importar**: primero `database/database.sql`, luego `database/datos-prueba.sql`.
4. Abrir **http://localhost/proyecto/tutorias-umg/app/** (página de inicio pública; desde ahí se inicia sesión o se crea cuenta)

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
app/                páginas en HTML, CSS y JavaScript
  css/estilos.css   estilos de todo el sitio
  js/comun.js       funciones compartidas: fetch a la API, sesión, menú y fechas
  js/*.js           un archivo por página (usuarios.js, tutorias.js, ...)
  assets/           logos e imágenes de DAM
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

## Cómo funciona el frontend

No usa frameworks ni Node: cada página es un archivo `.html` con su `.js`.
El JavaScript pide los datos a la API con `fetch`, arma el HTML con plantillas
de texto y lo pone en la página con `innerHTML`. No hay que compilar nada:
se edita el archivo y se recarga el navegador.

## Avance

- [x] Fase 1–2: análisis, modelo de datos, API base, login y sesiones
- [x] Fase 3: CRUD de usuarios, tutorías y bloques; filtros
- [x] Fase 4: solicitudes — crear, listar, cancelar, aceptar, rechazar y registrar atención
- [x] Fase 5: resumen de solicitudes por estado y por rol
- [ ] Fase 6: guía visual definitiva

## Actualización de entrega (11 de noviembre de 2026)

La versión de entrega es `app/` (HTML y JavaScript). No requiere Node ni compilación.
`frontend/` contiene una versión React alternativa; no ejecutar su build sobre `app/`.
La ruta anterior asume el repositorio en `C:\xampp\htdocs\proyecto`.
Cree `api/.env` copiando `api/.env.example` y configure MySQL. El script
`database.sql` elimina la base existente: úselo únicamente para una instalación nueva.

### Seguridad y cuenta
- Mi cuenta permite cambiar contraseña verificando la actual, confirmación y longitud de 8 a 72 bytes.
- Las otras sesiones se invalidan en la siguiente petición después de cambiar contraseña.
- Sesión por cookie HttpOnly/SameSite=Lax; Secure con HTTPS. Inactividad: 30 minutos; máximo: 8 horas.
- Login, registro y cambio de contraseña: 30 peticiones por IP y acción cada 15 minutos.
- CSRF en operaciones autenticadas, consultas preparadas, errores controlados y archivos sensibles bloqueados en Apache.
- Las escrituras usan un bloqueo MySQL de aplicación para impedir carreras en reservas.
- Solo el tutor propietario o coordinación acepta/rechaza/registra atención.
- Aceptar reserva un bloque para un estudiante y rechaza sus otros aplicantes pendientes.
- Registrar atención requiere observaciones y que el horario haya terminado.
- Cancelar solicitudes solo antes del inicio; no se edita disponibilidad con solicitudes activas.
- Las desactivaciones con solicitudes activas se bloquean para conservar consistencia.

### Verificación
Se ejecutó el flujo HTTP real de los tres roles: creación y asignación de tutoría,
publicación, solicitud, aceptación, cancelación, rechazo y atención, junto con casos
negativos de permisos, CSRF, duplicados, traslapes y enlaces inválidos.
Se cambió y restauró la contraseña en los tres roles usando datos temporales de prueba.
La atención pasada se verificó con un bloque temporal controlado, sin cambiar registros originales.

Para la defensa, preparar datos futuros y grabar el video del funcionamiento. HTTPS,
actualizaciones del servidor y copias de seguridad son tareas del despliegue; estos
controles no constituyen una garantía de inmunidad frente a ataques.

## Recuperación de contraseña y diálogos

El acceso incluye **Olvidé mi contraseña**. Se envía un enlace al correo registrado,
con token aleatorio de un solo uso, hash en BD y vencimiento de 30 minutos. Las
respuestas no revelan si existe una cuenta. Restablecer invalida las sesiones anteriores.

En instalaciones existentes ejecutar `database/migracion-recuperacion.sql` (ya aplicada
en este equipo). La instalación nueva incluye la tabla en `database.sql`.

Sin servicio de correo: `MAIL_TRANSPORT=file` guarda los correos de prueba en
`dam-mail` dentro de la carpeta que devuelve PHP `sys_get_temp_dir()` (fuera del sitio).
Este transporte funciona solo para solicitudes desde localhost. El operador local
puede abrir el archivo y copiar el enlace al navegador para demostrar el flujo.
No se devuelve el enlace por la API ni se muestra al solicitante anónimo.

Para correo real configurar el transporte de PHP, `MAIL_TRANSPORT=mail`,
`MAIL_FROM` con un remitente autorizado y `APP_URL` con la URL HTTPS del sistema.
El titular de la cuenta es el destinatario; no se suplanta su dirección como remitente.
No hay envío real hasta configurar ese servicio. Eliminar periódicamente los correos
locales de prueba porque contienen enlaces temporales de acceso.

Los mensajes y confirmaciones de la aplicación usan diálogos propios, no alertas
del navegador. Los días del calendario son botones accesibles y muestran las
solicitudes de esa fecha según los filtros y permisos del rol conectado.

## Propuestas de catedráticos
El profesor puede crear tutorías desde Tutorías y propuestas. Se guardan con
status=2 (pendiente), asignadas al profesor creador. Solo coordinación puede
aprobarlas (status=1) o rechazarlas (status=0). Hasta aprobar no se muestran a
estudiantes ni permiten publicar disponibilidad. La API comprueba estos permisos.
No requiere migración: status ya es un entero. Las tutorías originales no cambian.

Los registros PRUEBA se conservaron para demostración; ver tests/SIMULACION.md.
