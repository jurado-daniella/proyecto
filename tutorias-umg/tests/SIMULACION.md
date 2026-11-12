# Simulación del 11 de noviembre de 2026

Pruebas de interfaz: creación docente y aprobación administrativa.
Pruebas HTTP reales: escenarios siguientes. Los registros PRUEBA se conservaron.

- PASS usuarios.php
- PASS usuarios.php?id=13
- PASS usuarios.php?id=13&accion=estado
- PASS usuarios.php?id=13&accion=estado
- PASS usuarios.php?id=13
- PASS usuarios.php
- PASS usuarios.php?id=14
- PASS usuarios.php?id=14&accion=estado
- PASS usuarios.php?id=14&accion=estado
- PASS usuarios.php?id=14
- PASS sesion.php?accion=registro
- PASS sesion.php?accion=logout
- PASS usuarios.php?id=15
- PASS tutorias.php
- PASS tutorias.php?id=11
- PASS tutorias.php?id=11&accion=tutores
- PASS tutorias.php?id=11&accion=estado
- PASS tutorias.php?id=11&accion=estado
- PASS tutorias.php
- PASS Propuesta pendiente oculta para estudiantes
- PASS tutorias.php?id=12
- PASS tutorias.php?id=12&accion=estado
- PASS bloques.php
- PASS tutorias.php
- PASS tutorias.php?id=13&accion=estado
- PASS bloques.php
- PASS bloques.php?id=15
- PASS bloques.php
- PASS bloques.php
- PASS bloques.php
- PASS bloques.php
- PASS bloques.php
- PASS bloques.php?id=20
- PASS solicitudes.php
- PASS solicitudes.php
- PASS solicitudes.php
- PASS solicitudes.php
- PASS solicitudes.php
- PASS solicitudes.php?id=14&accion=aceptar
- PASS solicitudes.php?id=15&accion=rechazar
- PASS solicitudes.php?id=16&accion=cancelar
- PASS solicitudes.php?id=17&accion=aceptar
- PASS solicitudes.php?id=17&accion=atender
- PASS solicitudes.php
- PASS solicitudes.php?id=13&accion=aceptar
- PASS usuarios.php?rol=tutor&buscar=PRUEBA
- PASS bloques.php?estado=disponible&desde=2026-11-12
- PASS solicitudes.php?estado=aceptada
- PASS tutorias.php?buscar=PRUEBA
- PASS sesion.php
- PASS solicitudes.php
- PASS sesion.php
- PASS solicitudes.php
- PASS sesion.php
- PASS solicitudes.php

Para atención se utilizó una fecha histórica controlada de un bloque nuevo de prueba; no se alteraron solicitudes originales.
No se modificaron contraseñas de las cuentas originales.

## Verificación adicional mediante interfaz
- cmorales creó PRUEBA · Propuesta PHP del profesor desde Nueva tutoría y Guardar.
- admin aprobó la propuesta y verificó estado Activo.
- admin creó prueba_interfaz, editó su nombre, desactivó y reactivó la cuenta.
- cmorales publicó el bloque del 14/11/2026, 15:00–16:00 mediante Publicar horario.
- mjuarezx1@miumg.edu.gt consultó el catálogo, solicitó ese bloque y canceló desde Mis solicitudes.
- El calendario del 13/11 mostró pendiente, aceptada, rechazada y cancelada, con enlace únicamente en la aceptada.

Alcance: 55 comprobaciones HTTP y recorridos de botones arriba enumerados. Esto no equivale a haber pulsado cada combinación posible de controles ni a pruebas de carga.
