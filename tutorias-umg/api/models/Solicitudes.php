<?php

class Solicitudes
{
    const ESTADOS = ['pendiente', 'aceptada', 'rechazada', 'cancelada', 'atendida'];

    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /** Estudiante: las suyas. Tutor: las de sus bloques. Admin: todas. */
    function getAll(array $filters, array $user): array
    {
        $where = [];
        $params = [];

        if ($user['role'] === 'estudiante') {
            $where[] = "s.student_id = :me";
            $params['me'] = $user['id'];
        }
        if ($user['role'] === 'tutor') {
            $where[] = "b.tutor_id = :me";
            $params['me'] = $user['id'];
        }
        if (!empty($filters['estado']) && in_array($filters['estado'], self::ESTADOS, true)) {
            $where[] = "s.status = :status";
            $params['status'] = $filters['estado'];
        }
        if (!empty($filters['fecha']) && Request::validDate($filters['fecha'])) {
            $where[] = "b.date = :date";
            $params['date'] = $filters['fecha'];
        }
        if (!empty($filters['tutoria'])) {
            $where[] = "b.tutoria_id = :tutoria";
            $params['tutoria'] = (int) $filters['tutoria'];
        }

        $query = "SELECT s.id AS codigo, s.status AS estado, s.created_at AS fecha_solicitud,
                         b.id AS bloque_codigo, b.date AS fecha, TIME_FORMAT(b.start_time, '%H:%i') AS hora_inicio,
                         TIME_FORMAT(b.end_time, '%H:%i') AS hora_fin,
                         CASE WHEN s.status IN ('aceptada', 'atendida') THEN b.link END AS enlace,
                         t.title AS tutoria, tu.name AS tutor, tu.avatar AS tutor_avatar, st.name AS estudiante, st.username AS carne,
                         (SELECT COUNT(*) FROM solicitudes x WHERE x.block_id = b.id AND x.status = 'pendiente') AS aplicantes
                  FROM solicitudes s
                  INNER JOIN bloques b ON b.id = s.block_id
                  INNER JOIN tutorias t ON t.id = b.tutoria_id
                  INNER JOIN usuarios tu ON tu.id = b.tutor_id
                  INNER JOIN usuarios st ON st.id = s.student_id"
            . ($where ? " WHERE " . implode(" AND ", $where) : "")
            . " ORDER BY b.date DESC, b.start_time DESC";

        $statement = $this->connection->prepare($query);
        $statement->execute($params);
        return $statement->fetchAll();
    }

    /**
     * Varios estudiantes pueden aplicar al mismo bloque mientras esté disponible.
     * Validaciones: bloque disponible y futuro, sin duplicado y sin choque de horario
     * con otra solicitud activa del mismo estudiante.
     */
    function add(int $blockId, int $studentId): int
    {
        $statement = $this->connection->prepare(
            "SELECT b.id, b.date, b.start_time, b.end_time, b.status
             FROM bloques b INNER JOIN tutorias t ON t.id = b.tutoria_id
             WHERE b.id = :id AND t.status = 1"
        );
        $statement->execute(['id' => $blockId]);
        $block = $statement->fetch();

        if (!$block) {
            throw new ApiException("El bloque no existe", 5005, 404);
        }
        if ($block['status'] !== 'disponible') {
            throw new ApiException("El bloque ya no está disponible", 5006, 409);
        }
        if (new DateTime($block['date'] . ' ' . $block['start_time']) <= new DateTime()) {
            throw new ApiException("El bloque ya pasó", 5007, 409);
        }

        $statement = $this->connection->prepare(
            "SELECT id, status FROM solicitudes WHERE block_id = :block AND student_id = :student"
        );
        $statement->execute(['block' => $blockId, 'student' => $studentId]);
        $previous = $statement->fetch();
        if ($previous && $previous['status'] !== 'cancelada') {
            throw new ApiException("Ya aplicó a este bloque", 5008, 409);
        }

        $statement = $this->connection->prepare(
            "SELECT COUNT(*) FROM solicitudes s INNER JOIN bloques b ON b.id = s.block_id
             WHERE s.student_id = :student AND s.status IN ('pendiente', 'aceptada')
               AND b.date = :date AND b.start_time < :end AND b.end_time > :start"
        );
        $statement->execute([
            'student' => $studentId, 'date' => $block['date'],
            'start' => $block['start_time'], 'end' => $block['end_time'],
        ]);
        if ((int) $statement->fetchColumn() > 0) {
            throw new ApiException("Ya tiene otra solicitud activa en ese horario", 5009, 409);
        }

        // Si la había cancelado antes, se reactiva la misma fila (llave única bloque + estudiante)
        if ($previous) {
            $statement = $this->connection->prepare("UPDATE solicitudes SET status = 'pendiente', notes = NULL WHERE id = :id");
            $statement->execute(['id' => $previous['id']]);
            return (int) $previous['id'];
        }

        try {
            $statement = $this->connection->prepare(
                "INSERT INTO solicitudes (block_id, student_id) VALUES (:block, :student)"
            );
            $statement->execute(['block' => $blockId, 'student' => $studentId]);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {      // doble clic / peticiones simultáneas
                throw new ApiException("Ya aplicó a este bloque", 5008, 409);
            }
            throw $e;
        }
        return (int) $this->connection->lastInsertId();
    }

    /** El estudiante puede arrepentirse mientras la solicitud esté pendiente o aceptada. */
    function cancel(int $id, int $studentId): void
    {
        $statement = $this->connection->prepare(
            "SELECT id, block_id, status FROM solicitudes WHERE id = :id AND student_id = :student"
        );
        $statement->execute(['id' => $id, 'student' => $studentId]);
        $request = $statement->fetch();

        if (!$request) {
            throw new ApiException("La solicitud no existe", 5010, 404);
        }
        if (!in_array($request['status'], ['pendiente', 'aceptada'], true)) {
            throw new ApiException("La solicitud ya no se puede cancelar", 5011, 409);
        }

        $this->connection->beginTransaction();
        try {
            $statement = $this->connection->prepare("UPDATE solicitudes SET status = 'cancelada' WHERE id = :id");
            $statement->execute(['id' => $id]);

            // Si ya estaba aceptada, el bloque vuelve a quedar disponible
            if ($request['status'] === 'aceptada') {
                $statement = $this->connection->prepare("UPDATE bloques SET status = 'disponible' WHERE id = :id");
                $statement->execute(['id' => $request['block_id']]);
            }
            $this->connection->commit();
        } catch (Throwable $th) {
            $this->connection->rollBack();
            throw $th;
        }
    }

    // TODO fase 4: aceptar (rechaza las demás pendientes y reserva el bloque), rechazar y registrar atención.
}
