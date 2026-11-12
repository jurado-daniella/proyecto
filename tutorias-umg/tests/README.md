# Prueba de integración local

Ejecutar desde la raíz del repositorio con Apache y MySQL encendidos.
Definir DAM_TEST_PASSWORD con la contraseña compartida de las tres cuentas de prueba.
Ejecutar `python tutorias-umg/tests/integration.py`.

La prueba usa admin, cmorales y mjuarezx1@miumg.edu.gt. Crea una tutoría temporal,
prueba reservas y permisos y elimina únicamente sus registros en finally.
Cambia temporalmente las contraseñas y las restaura durante el recorrido exitoso.
No ejecutar contra producción. Si se interrumpe durante cambio de contraseña,
la clave temporal de prueba figura en el script y debe restaurarse antes de repetir.

Verificación del 11 de noviembre de 2026: 34 comprobaciones PASS y limpieza completada.
PHP: 16 archivos sin errores de sintaxis. JavaScript servido: todos pasan node --check.
Navegador: formulario Mi cuenta y resumen por estado visibles con sesión estudiante.

Limitaciones: no se ejecutó una auditoría de penetración, pruebas de carga,
ni revisión exhaustiva de todos los tamaños de pantalla. El video y la defensa
son entregables del equipo pendientes de preparar.
