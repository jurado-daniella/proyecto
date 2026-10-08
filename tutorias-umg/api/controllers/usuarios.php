<?php
require_once(__DIR__ . "/../core/Connection.php");
require_once(__DIR__ . "/../core/Request.php");
require_once(__DIR__ . "/../core/Auth.php");
require_once(__DIR__ . "/../models/Usuarios.php");

$method = $_SERVER['REQUEST_METHOD'];

try {
    $connection = new Connection();
    // Solo la coordinación (admin) administra usuarios
    $admin = Auth::requireRole($connection, 'admin');
    Auth::verifyCsrf();
    $model = new Usuarios($connection);
    $id = Request::intParam('id');

    switch ($method) {
        case 'GET':
            if ($id) {
                Response::success("Usuario obtenido", $model->get($id));
            }
            $filters = [
                'rol' => Request::param('rol'),
                'buscar' => Request::param('buscar'),
            ];
            if (Request::param('estado') !== null) {
                $filters['estado'] = Request::param('estado');
            }
            Response::success("Usuarios obtenidos correctamente", $model->getAll($filters));
            break;

        case 'POST':
            $newId = $model->add(Request::body());
            Response::success("Usuario agregado correctamente", ['codigo' => $newId], 1, 201);
            break;

        case 'PUT':
            if (!$id) {
                Response::error("Debe indicar el usuario", 2013, 400);
            }
            $data = Request::body();
            // PUT ?id=X&accion=estado  -> activar / desactivar
            if (Request::param('accion') === 'estado') {
                $model->setStatus($id, (int) ($data['estado'] ?? 0), $admin['id']);
                Response::success("Estado actualizado");
            }
            $model->update($id, $data, $admin['id']);
            Response::success("Usuario actualizado correctamente");
            break;

        case 'DELETE':
            // Baja lógica para no perder el historial
            if (!$id) {
                Response::error("Debe indicar el usuario", 2013, 400);
            }
            $model->setStatus($id, 0, $admin['id']);
            Response::success("Usuario desactivado correctamente");
            break;

        default:
            Response::error("Método no permitido", 1008, 405);
    }
} catch (\Throwable $th) {
    Response::fromException($th, "Error al procesar la solicitud de usuarios", 2000);
}
