# Prueba de integración

Requiere Apache y MySQL activos y Python 3. Ejecutar desde la raíz del repositorio:

```powershell
$env:DAM_TEST_PASSWORD = '<contraseña de las cuentas de prueba>'
python tutorias-umg/tests/integration.py
```

Usa admin, cmorales y mjuarezx1@miumg.edu.gt. La última cuenta debe existir en
la base local; no está incluida en los datos iniciales. La contraseña compartida
se obtiene de DAM_TEST_PASSWORD y no se escribe en el informe.

Verifica roles, creación y asignación, disponibilidad, solicitudes, cambios de
estado, atención, cancelación, validaciones y contraseñas. Crea datos temporales
y elimina solo sus registros. Cambia y restaura contraseñas durante el recorrido
exitoso. Si se interrumpe en ese paso, consultar la clave temporal en el script y
restaurar la cuenta. Ejecutar únicamente sobre una base de pruebas.

Las pruebas funcionales no equivalen a una auditoría de penetración o de carga.
