# DAM · Tutorías y Asesorías Académicas

Sistema de tutorías para la Facultad de Ingeniería en Sistemas de la UMG.
Tecnologías: PHP 8, PDO, MySQL/MariaDB, HTML, CSS y JavaScript.

## Instalación en XAMPP
1. Colocar el repositorio en `C:\xampp\htdocs\proyecto`.
2. Iniciar Apache y MySQL.
3. Copiar `api/.env.example` como `api/.env` y configurar la conexión.
4. En una instalación nueva, importar `database/database.sql` y después
   `database/datos-prueba.sql` desde phpMyAdmin.
5. Abrir http://localhost/proyecto/tutorias-umg/app/.

**database.sql elimina y recrea la base. No importarlo sobre información existente.**
En instalaciones existentes, aplicar solo las migraciones que falten, en este orden:
`migracion-recuperacion-admin.sql`, `migracion-bitacora.sql` y
`migracion-bitacora-detallada.sql`. La última se ejecuta una sola vez.
Si se instala directamente con database.sql, no ejecutar las migraciones después.
En este equipo ya están aplicadas. Las migraciones no eliminan registros.
Si se cambia la ubicación del repositorio, ajustar la URL de acceso.

## Funciones por rol
- Coordinación administra usuarios, tutorías y asignaciones; aprueba o rechaza
  propuestas; gestiona solicitudes, recuperaciones de cuenta y consulta la bitácora.
- El profesor propone tutorías para aprobación y publica horarios en las tutorías
  activas que tiene asignadas. Acepta o rechaza solicitudes y registra atención.
- El estudiante se registra con carné y correo institucional, consulta disponibilidad,
  solicita tutorías y revisa o cancela sus solicitudes antes del inicio.
- Los tres roles pueden cambiar su contraseña desde Mi cuenta.

Una propuesta pendiente tiene status=2; no aparece al estudiante ni permite
publicar horarios. Aprobada tiene status=1; rechazada o desactivada tiene status=0.
Aceptar una solicitud reserva el bloque y rechaza las demás pendientes del mismo
bloque. Registrar atención requiere observaciones y un horario finalizado.
El calendario permite consultar las tutorías de cada día según el rol y filtros.

## Recuperación de cuenta
Olvidé mi contraseña genera una solicitud para coordinación. El administrador
verifica la identidad personalmente, asigna una contraseña temporal y la entrega
al titular. El usuario ingresa y puede reemplazarla desde Mi cuenta. No usa SMTP.

## Seguridad
Consultas preparadas, contraseñas con hash, validación en servidor, permisos por
rol y propietario y protección CSRF. Cookies HttpOnly/SameSite=Lax y Secure al
usar HTTPS. Sesión: 30 minutos de inactividad y máximo de 8 horas. El cambio de
contraseña invalida las otras sesiones en su próxima petición. Límite de 30
intentos por IP y acción en 15 minutos para acceso, registro y contraseñas.
Las escrituras se serializan con un bloqueo MySQL para evitar reservas simultáneas.
No se permite editar bloques con solicitudes activas ni desactivar usuarios o
tutorías con solicitudes pendientes o aceptadas. Apache bloquea archivos sensibles.
En despliegue, usar HTTPS y mantener actualizaciones y copias de seguridad.

## Bitácora
Solo coordinación accede desde el menú Bitácora. También puede consultarse en
phpMyAdmin, tabla `bitacora`. Filtros: fechas, texto y resultado; máximo 500 eventos.
Ver cambios muestra mensaje, usuario, IP, identificador de petición y campos antes
y después, incluidos efectos relacionados. No guarda contraseñas, hashes ni tokens.
Los cambios de credenciales se indican sin su valor. No permite editar ni borrar.
Registra escrituras y accesos desde su activación; no reconstruye cambios anteriores,
consultas GET ni modificaciones hechas directamente en phpMyAdmin.

## Estructura
- `api/core`: conexión, sesiones, validaciones, respuestas y auditoría.
- `api/models`: consultas y reglas de negocio.
- `api/controllers`: endpoints JSON.
- `app`: interfaz y recursos estáticos; no requiere Node ni compilación.
- `database`: esquema, datos iniciales y migraciones.
- `tests`: prueba de integración e instrucciones.
- `tutorias-umg.postman_collection.json`: colección de referencia de la API.

## Cuentas iniciales
Los datos de prueba incluyen admin, cmorales, aperez, jlopez y mrodas;
estudiantes 5190-22-1001, 5190-22-1002, 5190-23-1003 y 5190-23-1004.
Contraseña inicial: `Umg2026!`. Cambiar las credenciales al publicar el sistema.
Los registros PRUEBA y DEMOSTRACIÓN de la base local son datos de demostración;
no se sustituyen ni eliminan al actualizar los archivos.
