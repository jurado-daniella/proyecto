<?php
require_once(__DIR__ . "/../core/Connection.php");
require_once(__DIR__ . "/../core/Request.php");
require_once(__DIR__ . "/../core/Auth.php");
require_once(__DIR__ . "/../models/Solicitudes.php");

$method = $_SERVER['REQUEST_METHOD'];

try {
    $connection = new Connection();
    $user = Auth::user($connection);
    Auth::verifyCsrf();
    $model = new Solicitudes($connection);
    $id = Request::intParam('id');
    $action = Request::param('accion');

    switch ($method) {
        case 'GET':
            $filters = [
                'estado' => Request::param('estado'),
                'fecha' => Request::param('fecha'),
                'tutoria' => Request::param('tutoria'),
            ];
            Response::success("Solicitudes obtenidas correctamente", $model->getAll($filters, $user));
            break;

        case 'POST':
            if ($user['role'] !== 'estudiante') {
                Response::error("Solo los estudiantes pueden solicitar tutorías", 1003, 403);
            }
            $data = Request::required(Request::body(), ['bloque']);
            // El estudiante sale de la sesión, nunca del cuerpo de la petición
            $newId = $model->add((int) $data['bloque'], $user['id']);
            Response::success("Solicitud enviada, espere la respuesta del catedrático", ['codigo' => $newId], 1, 201);
            break;

        case 'PUT':
            if (!$id) {
                Response::error("Debe indicar la solicitud", 5012, 400);
            }
            if ($action === 'cancelar' && $user['role'] === 'estudiante') {
                $model->cancel($id, $user['id']);
                Response::success("Solicitud cancelada");
            }
            if (in_array($action, ['aceptar', 'rechazar', 'atender'], true)) {
                Response::error("Funcionalidad en desarrollo (fase 4)", 5013, 501);
            }
            Response::error("Acción no válida", 1007, 400);
            break;

        default:
            Response::error("Método no permitido", 1008, 405);
    }
} catch (\Throwable $th) {
    Response::fromException($th, "Error al procesar la solicitud", 5000);
}
