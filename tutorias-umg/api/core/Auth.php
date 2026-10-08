<?php

/**
 * Identidad y permisos. La identidad SIEMPRE sale de la sesión y el rol
 * se vuelve a consultar en la base de datos en cada petición: nunca se
 * confía en un id o rol enviado por el cliente.
 */
class Auth
{
    static function user(Connection $connection): array
    {
        $userId = $_SESSION['user_id'] ?? null;
        if (!$userId) {
            throw new ApiException("Debe iniciar sesión", 1001, 401);
        }

        $statement = $connection->prepare("SELECT id, username, name, email, role, avatar FROM usuarios WHERE id = :id AND status = 1");
        $statement->execute(['id' => $userId]);
        $user = $statement->fetch();

        if (!$user) {
            session_unset();
            throw new ApiException("La sesión ya no es válida", 1001, 401);
        }
        return $user;
    }

    /** Usuario autenticado que además tiene alguno de los roles indicados. */
    static function requireRole(Connection $connection, string ...$roles): array
    {
        $user = self::user($connection);
        if (!in_array($user['role'], $roles, true)) {
            throw new ApiException("No tiene permisos para esta acción", 1003, 403);
        }
        return $user;
    }

    static function csrfToken(): string
    {
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf'];
    }

    /** Toda petición que modifica datos debe traer el token en la cabecera X-CSRF-Token. */
    static function verifyCsrf(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        if ($method === 'GET') {
            return;
        }
        $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $sent)) {
            throw new ApiException("Token de seguridad inválido, recargue la página", 1004, 419);
        }
    }
}
