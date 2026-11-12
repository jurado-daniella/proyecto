# Prueba integral y bitácora detallada

Fecha: 11 de noviembre de 2026.

La suite integral pasó con admin, cmorales y mjuarezx1@miumg.edu.gt. Se restauraron las contraseñas originales y se eliminaron únicamente los fixtures de esa suite. Los registros DEMOSTRACIÓN se conservaron.

## Demostración conservada
- Tutoría 15: DEMOSTRACIÓN · Bitácora detallada; creada por profesor y aprobada por coordinación.
- Bloque 24: 16/11/2026 de 14:00 a 15:00; reservado.
- Solicitud 21: aceptada para Matthew; otra solicitud del mismo bloque fue rechazada automáticamente.

## Verificación de auditoría
- Campos antes y después en JSON; registra también cambios automáticos relacionados.
- Autor, fecha, recurso, acción, resultado, mensaje, IP e identificador de petición.
- Cambios de contraseña indicados sin almacenar contraseñas ni hashes.
- Consulta exclusiva desde phpMyAdmin; sin pantalla ni endpoint.

## Eventos recientes
| ID | Usuario | Acción | Resultado | Detalle |
|---|---|---|---|---|
| 70 | Ing. Carlos Morales | solicitudes.php / aceptar | correcto | Solicitud actualizada |
| 69 | PRUEBA Alumno adicional Editado | solicitudes.php / post | correcto | Solicitud enviada, espere la respuesta del catedrático |
| 68 | PRUEBA Alumno adicional Editado | sesion.php / login | correcto | Bienvenido |
| 67 | MATTHEW ANDREE JUAREZ XOY | solicitudes.php / post | correcto | Solicitud enviada, espere la respuesta del catedrático |
| 66 | Ing. Carlos Morales | bloques.php / post | correcto | Bloque publicado correctamente |
| 65 | Coordinación Académica | tutorias.php / estado | correcto | Estado actualizado |
| 64 | Coordinación Académica | tutorias.php / put | correcto | Tutoría actualizada correctamente |
| 63 | Ing. Carlos Morales | tutorias.php / post | correcto | Propuesta enviada a coordinación para aprobación |
| 62 | MATTHEW ANDREE JUAREZ XOY | sesion.php / login | correcto | Bienvenido |
| 61 | Ing. Carlos Morales | sesion.php / login | correcto | Bienvenido |
| 60 | Coordinación Académica | sesion.php / login | correcto | Bienvenido |
| 59 | MATTHEW ANDREE JUAREZ XOY | sesion.php / logout | correcto | Sesión cerrada |
| 58 | Ing. Carlos Morales | sesion.php / logout | correcto | Sesión cerrada |
| 57 | Coordinación Académica | sesion.php / logout | correcto | Sesión cerrada |
| 56 | MATTHEW ANDREE JUAREZ XOY | sesion.php / clave | correcto | Contraseña actualizada |
| 55 | MATTHEW ANDREE JUAREZ XOY | sesion.php / clave | correcto | Contraseña actualizada |
| 54 | MATTHEW ANDREE JUAREZ XOY | sesion.php / clave | rechazado | Contraseña actual incorrecta |
| 53 | Ing. Carlos Morales | sesion.php / clave | correcto | Contraseña actualizada |
| 52 | Ing. Carlos Morales | sesion.php / clave | correcto | Contraseña actualizada |
| 51 | Ing. Carlos Morales | sesion.php / clave | rechazado | Contraseña actual incorrecta |
| 50 | Coordinación Académica | sesion.php / clave | correcto | Contraseña actualizada |
| 49 | Coordinación Académica | sesion.php / clave | correcto | Contraseña actualizada |
| 48 | Coordinación Académica | sesion.php / clave | rechazado | Contraseña actual incorrecta |
| 47 | Ing. Carlos Morales | solicitudes.php / atender | correcto | Solicitud actualizada |
| 46 | Ing. Carlos Morales | solicitudes.php / aceptar | correcto | Solicitud actualizada |
| 45 | MATTHEW ANDREE JUAREZ XOY | solicitudes.php / post | correcto | Solicitud enviada, espere la respuesta del catedrático |
| 44 | Ing. Carlos Morales | bloques.php / post | correcto | Bloque publicado correctamente |
| 43 | Ing. Carlos Morales | solicitudes.php / rechazar | correcto | Solicitud actualizada |
| 42 | MATTHEW ANDREE JUAREZ XOY | solicitudes.php / post | correcto | Solicitud enviada, espere la respuesta del catedrático |
| 41 | MATTHEW ANDREE JUAREZ XOY | solicitudes.php / cancelar | correcto | Solicitud cancelada |

## Cambios del evento de aceptación
```json
[
  {
    "tabla": "bloques",
    "registro": "24",
    "operacion": "actualizado",
    "campos": {
      "status": {
        "antes": "disponible",
        "despues": "reservado"
      }
    }
  },
  {
    "tabla": "solicitudes",
    "registro": "21",
    "operacion": "actualizado",
    "campos": {
      "status": {
        "antes": "pendiente",
        "despues": "aceptada"
      }
    }
  },
  {
    "tabla": "solicitudes",
    "registro": "22",
    "operacion": "actualizado",
    "campos": {
      "status": {
        "antes": "pendiente",
        "despues": "rechazada"
      }
    }
  }
]
```

La auditoría comienza desde su activación. No registra cambios realizados directamente en phpMyAdmin, consultas GET, ni reconstruye cambios anteriores. La prueba histórica de atención de la suite usa un horario temporal controlado.
