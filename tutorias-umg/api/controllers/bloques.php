<?php
require_once(__DIR__ . "/../core/Connection.php");
require_once(__DIR__ . "/../core/Request.php");
require_once(__DIR__ . "/../core/Auth.php");
require_once(__DIR__ . "/../models/Bloques.php");

$method = $_SERVER['REQUEST_METHOD'];

try {
    $connection = new Connection();
    $user = Auth::user($connection);
    Auth::verifyCsrf();
    $model = new Bloques($connection);
    $id = Request::intParam('id');

    // Solo el catedrático publica y modifica su disponibilidad
    if ($method !== 'GET' && $user['role'] !== 'tutor') {
        Response::error("Solo los catedráticos gestionan su disponibilidad", 1003, 403);
    }

    switch ($method) {
        case 'GET':
            $filters = [
                'tutoria' => Request::param('tutoria'),
                'tutor' => Request::param('tutor'),
                'estado' => Request::param('estado'),
                'desde' => Request::param('desde'),
                'hasta' => Request::param('hasta'),
            ];
            Response::success("Bloques obtenidos correctamente", $model->getAll($filters, $user));
            break;

        case 'POST':
            $newId = $model->add(Request::body(), $user['id']);
            Response::success("Bloque publicado correctamente", ['codigo' => $newId], 1, 201);
            break;

        case 'PUT':
            if (!$id) {
                Response::error("Debe indicar el bloque", 4017, 400);
            }
            $model->update($id, Request::body(), $user['id']);
            Response::success("Bloque actualizado correctamente");
            break;

        case 'DELETE':
            if (!$id) {
                Response::error("Debe indicar el bloque", 4017, 400);
            }
            $model->cancel($id, $user['id']);
            Response::success("Bloque cancelado correctamente");
            break;

        default:
            Response::error("Método no permitido", 1008, 405);
    }
} catch (\Throwable $th) {
    Response::fromException($th, "Error al procesar la solicitud de bloques", 4000);
}
