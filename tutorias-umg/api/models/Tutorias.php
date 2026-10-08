<?php

class Tutorias
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    function getCourses(): array
    {
        return $this->connection
            ->query("SELECT id AS codigo, code AS clave, name AS nombre, cycle AS ciclo FROM cursos ORDER BY cycle, name")
            ->fetchAll();
    }

    /** Listado con filtros. $onlyActive se usa para estudiantes y tutores. */
    function getAll(array $filters, bool $onlyActive): array
    {
        $where = [];
        $params = [];

        if ($onlyActive) {
            $where[] = "t.status = 1";
        }
        if (!empty($filters['curso'])) {
            $where[] = "t.course_id = :course";
            $params['course'] = (int) $filters['curso'];
        }
        if (!empty($filters['tutor'])) {
            $where[] = "EXISTS (SELECT 1 FROM tutoria_tutor x WHERE x.tutoria_id = t.id AND x.tutor_id = :tutor)";
            $params['tutor'] = (int) $filters['tutor'];
        }
        if (!empty($filters['buscar'])) {
            $where[] = "(t.title LIKE :q1 OR c.name LIKE :q2)";
            $params['q1'] = $params['q2'] = '%' . $filters['buscar'] . '%';
        }

        // Los bloques disponibles cuentan solo los futuros para que el estudiante sepa si hay horarios
        $query = "SELECT t.id AS codigo, t.title AS titulo, t.description AS descripcion, t.status AS estado,
                         t.start_date AS fecha_inicio, t.end_date AS fecha_fin,
                         TIME_FORMAT(t.start_time, '%H:%i') AS hora_inicio, TIME_FORMAT(t.end_time, '%H:%i') AS hora_fin, t.days AS dias,
                         c.id AS curso_codigo, c.name AS curso, c.code AS curso_clave, c.cycle AS ciclo,
                         (SELECT COUNT(*) FROM tutoria_tutor tt WHERE tt.tutoria_id = t.id) AS total_tutores,
                         (SELECT COUNT(*) FROM bloques b
                           WHERE b.tutoria_id = t.id AND b.status = 'disponible' AND b.date >= CURDATE()) AS bloques_disponibles
                  FROM tutorias t
                  INNER JOIN cursos c ON c.id = t.course_id"
            . ($where ? " WHERE " . implode(" AND ", $where) : "")
            . " ORDER BY c.cycle, t.title";

        $statement = $this->connection->prepare($query);
        $statement->execute($params);
        return $statement->fetchAll();
    }

    function get(int $id): array
    {
        $statement = $this->connection->prepare(
            "SELECT t.id AS codigo, t.title AS titulo, t.description AS descripcion, t.status AS estado,
                    t.start_date AS fecha_inicio, t.end_date AS fecha_fin,
                         TIME_FORMAT(t.start_time, '%H:%i') AS hora_inicio, TIME_FORMAT(t.end_time, '%H:%i') AS hora_fin, t.days AS dias,
                    c.id AS curso_codigo, c.name AS curso, c.code AS curso_clave
             FROM tutorias t INNER JOIN cursos c ON c.id = t.course_id
             WHERE t.id = :id"
        );
        $statement->execute(['id' => $id]);
        $tutoria = $statement->fetch();
        if (!$tutoria) {
            throw new ApiException("La tutoría no existe", 3005, 404);
        }

        $statement = $this->connection->prepare(
            "SELECT u.id AS codigo, u.name AS nombre, u.email AS correo, u.avatar
             FROM tutoria_tutor tt INNER JOIN usuarios u ON u.id = tt.tutor_id
             WHERE tt.tutoria_id = :id AND u.status = 1
             ORDER BY u.name"
        );
        $statement->execute(['id' => $id]);
        $tutoria['tutores'] = $statement->fetchAll();
        return $tutoria;
    }

    function add(array $data, int $adminId): int
    {
        $tutoria = $this->validate($data);
        $statement = $this->connection->prepare(
            "INSERT INTO tutorias (course_id, title, description, start_date, end_date, start_time, end_time, days, created_by)
             VALUES (:course, :title, :description, :start_date, :end_date, :start_time, :end_time, :days, :admin)"
        );
        $statement->execute($tutoria + ['admin' => $adminId]);
        return (int) $this->connection->lastInsertId();
    }

    function update(int $id, array $data): void
    {
        $this->get($id);
        $tutoria = $this->validate($data);
        $statement = $this->connection->prepare(
            "UPDATE tutorias SET course_id = :course, title = :title, description = :description,
                    start_date = :start_date, end_date = :end_date, start_time = :start_time, end_time = :end_time, days = :days
             WHERE id = :id"
        );
        $statement->execute($tutoria + ['id' => $id]);
    }

    function setStatus(int $id, int $status): void
    {
        $this->get($id);
        $statement = $this->connection->prepare("UPDATE tutorias SET status = :status WHERE id = :id");
        $statement->execute(['status' => $status ? 1 : 0, 'id' => $id]);
    }

    /**
     * Reemplaza la lista de catedráticos de la tutoría.
     * Un catedrático que ya publicó bloques no se puede quitar (lo impide la FK).
     */
    function setTutors(int $id, $tutorIds): void
    {
        $this->get($id);
        if (!is_array($tutorIds)) {
            throw new ApiException("Debe enviar la lista de catedráticos", 3006, 422);
        }
        $tutorIds = array_values(array_unique(array_map('intval', $tutorIds)));

        if ($tutorIds) {
            $marks = implode(',', array_fill(0, count($tutorIds), '?'));
            $statement = $this->connection->prepare(
                "SELECT COUNT(*) FROM usuarios WHERE role = 'tutor' AND status = 1 AND id IN ($marks)"
            );
            $statement->execute($tutorIds);
            if ((int) $statement->fetchColumn() !== count($tutorIds)) {
                throw new ApiException("Alguno de los usuarios no es un catedrático activo", 3007, 422);
            }
        }

        $this->connection->beginTransaction();
        try {
            $keep = $tutorIds ?: [0];
            $marks = implode(',', array_fill(0, count($keep), '?'));
            $statement = $this->connection->prepare(
                "DELETE FROM tutoria_tutor WHERE tutoria_id = ? AND tutor_id NOT IN ($marks)"
            );
            $statement->execute(array_merge([$id], $keep));

            $insert = $this->connection->prepare(
                "INSERT IGNORE INTO tutoria_tutor (tutoria_id, tutor_id) VALUES (:tutoria, :tutor)"
            );
            foreach ($tutorIds as $tutorId) {
                $insert->execute(['tutoria' => $id, 'tutor' => $tutorId]);
            }
            $this->connection->commit();
        } catch (PDOException $e) {
            $this->connection->rollBack();
            if ($e->getCode() === '23000') {
                throw new ApiException("No se puede quitar un catedrático que ya tiene bloques en esta tutoría", 3008, 409);
            }
            throw $e;
        }
    }

    private function validate(array $data): array
    {
        $tutoria = Request::required($data, ['curso', 'titulo', 'fecha_inicio', 'fecha_fin', 'hora_inicio', 'hora_fin']);
        if (mb_strlen($tutoria['titulo']) > 150) {
            throw new ApiException("El título no puede superar 150 caracteres", 3009, 422);
        }

        $statement = $this->connection->prepare("SELECT id FROM cursos WHERE id = :id");
        $statement->execute(['id' => (int) $tutoria['curso']]);
        if (!$statement->fetch()) {
            throw new ApiException("El curso no existe", 3010, 422);
        }

        // Rango dentro del cual los catedráticos podrán publicar sus bloques
        if (!Request::validDate($tutoria['fecha_inicio']) || !Request::validDate($tutoria['fecha_fin'])) {
            throw new ApiException("Las fechas del período no son válidas", 3012, 422);
        }
        if ($tutoria['fecha_fin'] < $tutoria['fecha_inicio']) {
            throw new ApiException("La fecha final debe ser igual o posterior a la inicial", 3013, 422);
        }
        if (!Request::validTime($tutoria['hora_inicio']) || !Request::validTime($tutoria['hora_fin'])
            || $tutoria['hora_fin'] <= $tutoria['hora_inicio']) {
            throw new ApiException("La franja horaria no es válida", 3014, 422);
        }
        $days = array_values(array_unique(array_map('strval', (array) ($data['dias'] ?? []))));
        if (!$days || array_diff($days, ['1', '2', '3', '4', '5', '6', '7'])) {
            throw new ApiException("Seleccione al menos un día válido", 3015, 422);
        }
        sort($days);

        $description = trim((string) ($data['descripcion'] ?? ''));
        return [
            'start_date' => $tutoria['fecha_inicio'],
            'end_date' => $tutoria['fecha_fin'],
            'start_time' => $tutoria['hora_inicio'],
            'end_time' => $tutoria['hora_fin'],
            'days' => implode(',', $days),
            'course' => (int) $tutoria['curso'],
            'title' => $tutoria['titulo'],
            'description' => $description === '' ? null : $description,
        ];
    }
}
