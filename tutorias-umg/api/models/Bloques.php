<?php

class Bloques
{
    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /**
     * Listado según el rol:
     *  - tutor: solo sus bloques
     *  - estudiante: solo bloques disponibles a futuro de tutorías activas
     *  - admin: todos
     * El enlace de la reunión solo lo ve el tutor, el admin o el estudiante con solicitud aceptada.
     */
    function getAll(array $filters, array $user): array
    {
        $where = [];
        $params = ['viewer' => $user['id'], 'role' => $user['role']];

        if ($user['role'] === 'tutor') {
            $where[] = "b.tutor_id = :me";
            $params['me'] = $user['id'];
        }
        if ($user['role'] === 'estudiante') {
            $where[] = "b.status = 'disponible' AND t.status = 1";
            $where[] = "(b.date > CURDATE() OR (b.date = CURDATE() AND b.start_time > CURTIME()))";
        }
        if (!empty($filters['tutoria'])) {
            $where[] = "b.tutoria_id = :tutoria";
            $params['tutoria'] = (int) $filters['tutoria'];
        }
        if (!empty($filters['tutor'])) {
            $where[] = "b.tutor_id = :tutor";
            $params['tutor'] = (int) $filters['tutor'];
        }
        if (!empty($filters['estado'])) {
            $where[] = "b.status = :status";
            $params['status'] = $filters['estado'];
        }
        if (!empty($filters['desde']) && Request::validDate($filters['desde'])) {
            $where[] = "b.date >= :from";
            $params['from'] = $filters['desde'];
        }
        if (!empty($filters['hasta']) && Request::validDate($filters['hasta'])) {
            $where[] = "b.date <= :to";
            $params['to'] = $filters['hasta'];
        }

        $query = "SELECT b.id AS codigo, b.tutoria_id AS tutoria_codigo, t.title AS tutoria, c.name AS curso,
                         b.tutor_id AS tutor_codigo, u.name AS tutor, u.avatar AS tutor_avatar,
                         b.date AS fecha, TIME_FORMAT(b.start_time, '%H:%i') AS hora_inicio,
                         TIME_FORMAT(b.end_time, '%H:%i') AS hora_fin, b.status AS estado,
                         (SELECT COUNT(*) FROM solicitudes s WHERE s.block_id = b.id AND s.status = 'pendiente') AS aplicantes,
                         mine.status AS mi_solicitud,
                         CASE WHEN :role <> 'estudiante' OR mine.status = 'aceptada' THEN b.link END AS enlace
                  FROM bloques b
                  INNER JOIN tutorias t ON t.id = b.tutoria_id
                  INNER JOIN cursos c ON c.id = t.course_id
                  INNER JOIN usuarios u ON u.id = b.tutor_id
                  LEFT JOIN solicitudes mine ON mine.block_id = b.id AND mine.student_id = :viewer"
            . ($where ? " WHERE " . implode(" AND ", $where) : "")
            . " ORDER BY b.date, b.start_time";

        $statement = $this->connection->prepare($query);
        $statement->execute($params);
        return $statement->fetchAll();
    }

    function get(int $id): array
    {
        $statement = $this->connection->prepare("SELECT * FROM bloques WHERE id = :id");
        $statement->execute(['id' => $id]);
        $block = $statement->fetch();
        if (!$block) {
            throw new ApiException("El bloque no existe", 4005, 404);
        }
        return $block;
    }

    function add(array $data, int $tutorId): int
    {
        $block = $this->validate($data, $tutorId);
        $this->checkOverlap($tutorId, $block['date'], $block['start'], $block['end']);

        $statement = $this->connection->prepare(
            "INSERT INTO bloques (tutoria_id, tutor_id, date, start_time, end_time, link)
             VALUES (:tutoria, :tutor, :date, :start, :end, :link)"
        );
        $statement->execute($block + ['tutor' => $tutorId]);
        return (int) $this->connection->lastInsertId();
    }

    function update(int $id, array $data, int $tutorId): void
    {
        $current = $this->getOwn($id, $tutorId);
        if ($current['status'] !== 'disponible') {
            throw new ApiException("Solo se pueden modificar bloques disponibles", 4006, 409);
        }

        $block = $this->validate($data, $tutorId);
        $this->checkOverlap($tutorId, $block['date'], $block['start'], $block['end'], $id);

        $statement = $this->connection->prepare(
            "UPDATE bloques SET tutoria_id = :tutoria, date = :date, start_time = :start, end_time = :end, link = :link
             WHERE id = :id"
        );
        $statement->execute($block + ['id' => $id]);
    }

    /** Cancelar el bloque rechaza automáticamente las solicitudes pendientes. */
    function cancel(int $id, int $tutorId): void
    {
        $current = $this->getOwn($id, $tutorId);
        if ($current['status'] === 'cancelado') {
            throw new ApiException("El bloque ya está cancelado", 4007, 409);
        }
        if ($current['status'] === 'reservado') {
            // ponytail: cancelar un bloque ya reservado se resuelve en la fase 4 (aviso al estudiante)
            throw new ApiException("El bloque tiene una tutoría aceptada y no se puede cancelar", 4008, 409);
        }

        $this->connection->beginTransaction();
        try {
            $statement = $this->connection->prepare("UPDATE bloques SET status = 'cancelado' WHERE id = :id");
            $statement->execute(['id' => $id]);
            $statement = $this->connection->prepare(
                "UPDATE solicitudes SET status = 'rechazada' WHERE block_id = :id AND status = 'pendiente'"
            );
            $statement->execute(['id' => $id]);
            $this->connection->commit();
        } catch (Throwable $th) {
            $this->connection->rollBack();
            throw $th;
        }
    }

    /** Un tutor solo puede tocar sus propios bloques. */
    private function getOwn(int $id, int $tutorId): array
    {
        $block = $this->get($id);
        if ((int) $block['tutor_id'] !== $tutorId) {
            throw new ApiException("El bloque no le pertenece", 4009, 403);
        }
        return $block;
    }

    private function validate(array $data, int $tutorId): array
    {
        $block = Request::required($data, ['tutoria', 'fecha', 'hora_inicio', 'hora_fin', 'enlace']);

        if (!Request::validDate($block['fecha'])) {
            throw new ApiException("La fecha no es válida", 4010, 422);
        }
        if (!Request::validTime($block['hora_inicio']) || !Request::validTime($block['hora_fin'])) {
            throw new ApiException("El formato de hora no es válido", 4011, 422);
        }
        $start = new DateTime($block['fecha'] . ' ' . $block['hora_inicio']);
        $end = new DateTime($block['fecha'] . ' ' . $block['hora_fin']);
        if ($end <= $start) {
            throw new ApiException("La hora de fin debe ser posterior a la de inicio", 4012, 422);
        }
        if ($start <= new DateTime()) {
            throw new ApiException("No se pueden publicar bloques en el pasado", 4013, 422);
        }
        if (!filter_var($block['enlace'], FILTER_VALIDATE_URL) || !preg_match('#^https?://#i', $block['enlace'])) {
            throw new ApiException("El enlace de la reunión no es válido", 4014, 422);
        }

        // El tutor debe estar asignado a la tutoría y esta debe estar activa
        $statement = $this->connection->prepare(
            "SELECT t.start_date, t.end_date, t.start_time, t.end_time, t.days
             FROM tutoria_tutor tt INNER JOIN tutorias t ON t.id = tt.tutoria_id
             WHERE tt.tutoria_id = :tutoria AND tt.tutor_id = :tutor AND t.status = 1"
        );
        $statement->execute(['tutoria' => (int) $block['tutoria'], 'tutor' => $tutorId]);
        $range = $statement->fetch();
        if (!$range) {
            throw new ApiException("No está asignado a esa tutoría", 4015, 403);
        }
        $this->checkRange($range, $start, $end);

        return [
            'tutoria' => (int) $block['tutoria'],
            'date' => $block['fecha'],
            'start' => $start->format('H:i:s'),
            'end' => $end->format('H:i:s'),
            'link' => $block['enlace'],
        ];
    }

    /** El bloque debe caer dentro del período, los días y la franja que definió el administrador. */
    private function checkRange(array $range, DateTime $start, DateTime $end): void
    {
        $date = $start->format('Y-m-d');
        if ($date < $range['start_date'] || $date > $range['end_date']) {
            throw new ApiException("La fecha está fuera del período de la tutoría", 4018, 422);
        }
        if (!in_array($start->format('N'), explode(',', $range['days']), true)) {
            throw new ApiException("La tutoría no se imparte ese día de la semana", 4019, 422);
        }
        if ($start->format('H:i:s') < $range['start_time'] || $end->format('H:i:s') > $range['end_time']) {
            throw new ApiException("El horario está fuera de la franja de la tutoría", 4020, 422);
        }
    }

    /** Dos rangos se traslapan si uno empieza antes de que termine el otro y viceversa. */
    private function checkOverlap(int $tutorId, string $date, string $start, string $end, int $exceptId = 0): void
    {
        $statement = $this->connection->prepare(
            "SELECT COUNT(*) FROM bloques
             WHERE tutor_id = :tutor AND date = :date AND status <> 'cancelado'
               AND start_time < :end AND end_time > :start AND id <> :except"
        );
        $statement->execute([
            'tutor' => $tutorId, 'date' => $date, 'start' => $start, 'end' => $end, 'except' => $exceptId,
        ]);
        if ((int) $statement->fetchColumn() > 0) {
            throw new ApiException("Ya tiene un bloque que se traslapa con ese horario", 4016, 409);
        }
    }
}
