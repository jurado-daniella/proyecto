<?php
require_once(__DIR__ . "/../core/Connection.php");
require_once(__DIR__ . "/../core/Request.php");
require_once(__DIR__ . "/../core/Auth.php");
require_once(__DIR__ . "/../models/Usuarios.php");

$method = $_SERVER['REQUEST_METHOD'];
$action = Request::param('accion');

try {
    $connection = new Connection();

    switch ($method) {
        // Sesión actual: lo usa React al cargar para saber si ya hay alguien conectado
        case 'GET':
            $user = Auth::user($connection);
            Response::success("Sesión activa", ['usuario' => $user, 'csrf' => Auth::csrfToken()]);
            break;

        case 'POST':
            if ($action === 'login') {
                $data = Request::required(Request::body(), ['usuario', 'clave']);
                $model = new Usuarios($connection);
                $account = $model->findForLogin($data['usuario']);

                // Mismo mensaje si no existe o si la clave es incorrecta: no se revela cuál falló
                if (!$account || !password_verify($data['clave'], $account['password'])) {
                    Response::error("Usuario o contraseña incorrectos", 1005, 401);
                }
                if ((int) $account['status'] !== 1) {
                    Response::error("La cuenta está desactivada, contacte a la coordinación", 1006, 403);
                }

                session_regenerate_id(true);    // evita fijación de sesión
                $_SESSION['user_id'] = $account['id'];
                unset($_SESSION['csrf']);

                Response::success("Bienvenido", ['usuario' => Auth::user($connection), 'csrf' => Auth::csrfToken()]);
            }

            if ($action === 'registro') {
                $model = new Usuarios($connection);
                $newId = $model->register(Request::body());
                session_regenerate_id(true);
                $_SESSION['user_id'] = $newId;
                unset($_SESSION['csrf']);
                Response::success("Cuenta creada, ¡bienvenido!", ['usuario' => Auth::user($connection), 'csrf' => Auth::csrfToken()], 1, 201);
            }

            if ($action === 'logout') {
                Auth::verifyCsrf();
                $_SESSION = [];
                session_destroy();
                Response::success("Sesión cerrada");
            }

            Response::error("Acción no válida", 1007, 400);
            break;

        default:
            Response::error("Método no permitido", 1008, 405);
    }
} catch (\Throwable $th) {
    Response::fromException($th, "Error al procesar la sesión", 1000);
}
