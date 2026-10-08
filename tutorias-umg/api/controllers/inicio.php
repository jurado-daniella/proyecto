<?php
require_once(__DIR__ . "/../core/Connection.php");

/**
 */
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        Response::error("Método no permitido", 1008, 405);
    }
    $connection = new Connection();

    $stats = $connection->query(
        "SELECT
            (SELECT COUNT(*) FROM usuarios WHERE role = 'estudiante' AND status = 1) AS estudiantes,
            (SELECT COUNT(*) FROM usuarios WHERE role = 'tutor' AND status = 1) AS tutores,
            (SELECT COUNT(*) FROM tutorias WHERE status = 1) AS tutorias,
            (SELECT COUNT(DISTINCT course_id) FROM tutorias WHERE status = 1) AS cursos"
    )->fetch();

    $tutors = $connection->query(
        "SELECT u.name AS nombre, u.avatar,
                GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') AS cursos
         FROM usuarios u
         INNER JOIN tutoria_tutor tt ON tt.tutor_id = u.id
         INNER JOIN tutorias t ON t.id = tt.tutoria_id AND t.status = 1
         INNER JOIN cursos c ON c.id = t.course_id
         WHERE u.role = 'tutor' AND u.status = 1
         GROUP BY u.id, u.name, u.avatar
         ORDER BY u.name
         LIMIT 8"
    )->fetchAll();

    Response::success("Resumen obtenido", ['indicadores' => $stats, 'tutores' => $tutors]);
} catch (\Throwable $th) {
    Response::fromException($th, "Error al obtener el resumen", 6000);
}
