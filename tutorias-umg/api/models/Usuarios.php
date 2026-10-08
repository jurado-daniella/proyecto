<?php

class Usuarios
{
    const ROLES = ['admin', 'tutor', 'estudiante'];

    private Connection $connection;

    public function __construct(Connection $connection)
    {
        $this->connection = $connection;
    }

    /** Usado solo por el login: incluye el hash de la contraseña. */
    function findForLogin(string $login)
    {
        $statement = $this->connection->prepare(
            "SELECT id, password, status FROM usuarios WHERE username = :username OR email = :email LIMIT 1"
        );
        $statement->execute(['username' => $login, 'email' => $login]);
        return $statement->fetch();
    }

    /**
     * Autoregistro: solo crea estudiantes. El rol nunca se toma del cliente.
     * Usuario = carné (formato UMG 0000-00-0000) y correo institucional @miumg.edu.gt.
     */
    function register(array $data): int
    {
        $user = Request::required($data, ['nombre', 'carne', 'correo', 'clave', 'confirmacion']);

        if (!preg_match('/^\d{4}-\d{2}-\d{1,6}$/', $user['carne'])) {
            throw new ApiException("El carné debe tener el formato 0000-00-0000", 2014, 422);
        }
        if (!filter_var($user['correo'], FILTER_VALIDATE_EMAIL) || !preg_match('/@miumg\.edu\.gt$/i', $user['correo'])) {
            throw new ApiException("Use su correo institucional @miumg.edu.gt", 2015, 422);
        }
        if ($user['clave'] !== $user['confirmacion']) {
            throw new ApiException("Las contraseñas no coinciden", 2016, 422);
        }

        return $this->add([
            'usuario' => $user['carne'],
            'nombre' => $user['nombre'],
            'correo' => strtolower($user['correo']),
            'clave' => $user['clave'],
            'rol' => 'estudiante',
        ]);
    }

    function getAll(array $filters): array
    {
        $where = [];
        $params = [];

        if (!empty($filters['rol'])) {
            $where[] = "role = :role";
            $params['role'] = $filters['rol'];
        }
        if (!empty($filters['buscar'])) {
            $where[] = "(name LIKE :q1 OR username LIKE :q2 OR email LIKE :q3)";
            $params['q1'] = $params['q2'] = $params['q3'] = '%' . $filters['buscar'] . '%';
        }
        if (isset($filters['estado'])) {
            $where[] = "status = :status";
            $params['status'] = (int) $filters['estado'];
        }

        $query = "SELECT id AS codigo, username AS usuario, name AS nombre, email AS correo,
                         role AS rol, status AS estado, avatar, created_at AS creado
                  FROM usuarios"
            . ($where ? " WHERE " . implode(" AND ", $where) : "")
            . " ORDER BY role, name";

        $statement = $this->connection->prepare($query);
        $statement->execute($params);
        return $statement->fetchAll();
    }

    function get(int $id): array
    {
        $statement = $this->connection->prepare(
            "SELECT id AS codigo, username AS usuario, name AS nombre, email AS correo, role AS rol, status AS estado
             FROM usuarios WHERE id = :id"
        );
        $statement->execute(['id' => $id]);
        $user = $statement->fetch();
        if (!$user) {
            throw new ApiException("El usuario no existe", 2005, 404);
        }
        return $user;
    }

    function add(array $data): int
    {
        $user = Request::required($data, ['usuario', 'nombre', 'correo', 'clave', 'rol']);
        $this->validate($user);
        $this->validatePassword($user['clave']);

        $statement = $this->connection->prepare(
            "INSERT INTO usuarios (username, name, email, password, role)
             VALUES (:username, :name, :email, :password, :role)"
        );
        $this->runUnique($statement, [
            'username' => $user['usuario'],
            'name' => $user['nombre'],
            'email' => $user['correo'],
            'password' => password_hash($user['clave'], PASSWORD_DEFAULT),
            'role' => $user['rol'],
        ]);
        return (int) $this->connection->lastInsertId();
    }

    function update(int $id, array $data, int $currentUserId): void
    {
        $this->get($id);
        $user = Request::required($data, ['usuario', 'nombre', 'correo', 'rol']);
        $this->validate($user);

        if ($id === $currentUserId && $user['rol'] !== 'admin') {
            throw new ApiException("No puede quitarse a sí mismo el rol de administrador", 2006, 409);
        }

        $params = [
            'id' => $id,
            'username' => $user['usuario'],
            'name' => $user['nombre'],
            'email' => $user['correo'],
            'role' => $user['rol'],
        ];
        $passwordSql = "";
        // La contraseña solo se cambia si se envía una nueva
        if (!empty($data['clave'])) {
            $this->validatePassword((string) $data['clave']);
            $passwordSql = ", password = :password";
            $params['password'] = password_hash((string) $data['clave'], PASSWORD_DEFAULT);
        }

        $statement = $this->connection->prepare(
            "UPDATE usuarios SET username = :username, name = :name, email = :email, role = :role $passwordSql
             WHERE id = :id"
        );
        $this->runUnique($statement, $params);
    }

    /** Baja lógica: se conserva el historial de solicitudes del usuario. */
    function setStatus(int $id, int $status, int $currentUserId): void
    {
        $this->get($id);
        if ($id === $currentUserId) {
            throw new ApiException("No puede desactivar su propia cuenta", 2007, 409);
        }
        $statement = $this->connection->prepare("UPDATE usuarios SET status = :status WHERE id = :id");
        $statement->execute(['status' => $status ? 1 : 0, 'id' => $id]);
    }

    private function validate(array $user): void
    {
        if (!filter_var($user['correo'], FILTER_VALIDATE_EMAIL)) {
            throw new ApiException("El correo no es válido", 2008, 422);
        }
        if (!in_array($user['rol'], self::ROLES, true)) {
            throw new ApiException("Rol no válido", 2009, 422);
        }
        if (mb_strlen($user['nombre']) > 120 || mb_strlen($user['usuario']) > 50) {
            throw new ApiException("Nombre o usuario demasiado largo", 2010, 422);
        }
    }

    private function validatePassword(string $password): void
    {
        if (strlen($password) < 8) {
            throw new ApiException("La contraseña debe tener al menos 8 caracteres", 2011, 422);
        }
    }

    /** Ejecuta y traduce el error de llave única a un mensaje entendible. */
    private function runUnique(PDOStatement $statement, array $params): void
    {
        try {
            $statement->execute($params);
        } catch (PDOException $e) {
            if ($e->getCode() === '23000') {
                throw new ApiException("El usuario o correo ya está registrado", 2012, 409);
            }
            throw $e;
        }
    }
}
