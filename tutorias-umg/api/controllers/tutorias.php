<?php
require_once(__DIR__ . "/../core/Connection.php");
require_once(__DIR__ . "/../core/Request.php");
require_once(__DIR__ . "/../core/Auth.php");
require_once(__DIR__ . "/../models/Tutorias.php");

$method = $_SERVER['REQUEST_METHOD'];

try {
    $connection = new Connection();
    $user = Auth::user($connection);
    Auth::verifyCsrf();
    $model = new Tutorias($connection);
    $id = Request::intParam('id');
    $action = Request::param('accion');

    // Lectura: cualquier usuario autenticado. Escritura: solo admin.
    if ($method !== 'GET' && $user['role'] !== 'admin' && !($method === 'POST' && $user['role'] === 'tutor')) {
        Response::error("No tiene permisos para esta acción", 1003, 403);
    }

    switch ($method) {
        case 'GET':
            if ($action === 'cursos') {
                Response::success("Cursos obtenidos", $model->getCourses());
            }
            if ($id) {
                $detail=$model->get($id);
                if ($user['role'] !== 'admin' && (int)$detail['estado'] !== 1 && !($user['role'] === 'tutor' && (int)$detail['creador'] === (int)$user['id'])) throw new ApiException('Tutoría no disponible',3005,404);
                Response::success("Tutoría obtenida", $detail);
            }
            $filters = [
                'propuestas_de' => $user['role'] === 'tutor' && $action === 'propuestas' ? $user['id'] : null,
                'curso' => Request::param('curso'),
                'tutor' => Request::param('tutor'),
                'buscar' => Request::param('buscar'),
            ];
            Response::success("Tutorías obtenidas correctamente", $model->getAll($filters, $user['role'] !== 'admin'));
            break;

        case 'POST':
            $newId = $user['role'] === 'tutor' ? $model->propose(Request::body(), $user['id']) : $model->add(Request::body(), $user['id']);
            Response::success($user['role'] === 'tutor' ? "Propuesta enviada a coordinación para aprobación" : "Tutoría creada correctamente", ['codigo' => $newId], 1, 201);
            break;

        case 'PUT':
            if (!$id) {
                Response::error("Debe indicar la tutoría", 3011, 400);
            }
            $data = Request::body();
            if ($action === 'tutores') {
                $model->setTutors($id, $data['tutores'] ?? null);
                Response::success("Catedráticos asignados correctamente");
            }
            if ($action === 'estado') {
                $model->setStatus($id, (int) ($data['estado'] ?? 0));
                Response::success("Estado actualizado");
            }
            $model->update($id, $data);
            Response::success("Tutoría actualizada correctamente");
            break;

        case 'DELETE':
            if (!$id) {
                Response::error("Debe indicar la tutoría", 3011, 400);
            }
            $model->setStatus($id, 0);
            Response::success("Tutoría desactivada correctamente");
            break;

        default:
            Response::error("Método no permitido", 1008, 405);
    }
} catch (\Throwable $th) {
    Response::fromException($th, "Error al procesar la solicitud de tutorías", 3000);
}
