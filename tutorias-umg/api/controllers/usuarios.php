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

    if (Request::param('accion') === 'recuperaciones') {
        if ($method === 'GET') {
            Response::success('Solicitudes de recuperación', $connection->query("SELECT r.id,u.name AS nombre,u.username AS usuario,u.email AS correo,r.created_at AS fecha FROM recuperaciones_admin r JOIN usuarios u ON u.id=r.user_id WHERE r.estado='pendiente' ORDER BY r.created_at")->fetchAll());
        }
        if ($method !== 'PUT' || !$id) throw new ApiException('Método o identificador inválido',1002,400);
        $d=Request::required(Request::body(),['nueva','confirmacion']);
        if ($d['nueva']!==$d['confirmacion'] || strlen($d['nueva'])<8 || strlen($d['nueva'])>72) throw new ApiException('Las contraseñas deben coincidir y tener entre 8 y 72 bytes',1002,422);
        $connection->beginTransaction();
        try {
            $q=$connection->prepare("SELECT r.user_id,u.status FROM recuperaciones_admin r JOIN usuarios u ON u.id=r.user_id WHERE r.id=? AND r.estado='pendiente' FOR UPDATE");$q->execute([$id]);$row=$q->fetch();
            if (!$row || !$row['status']) throw new ApiException('Solicitud inexistente, resuelta o cuenta inactiva',1002,409);
            $connection->prepare('UPDATE usuarios SET password=? WHERE id=?')->execute([password_hash($d['nueva'],PASSWORD_DEFAULT),$row['user_id']]);
            $connection->prepare("UPDATE recuperaciones_admin SET estado='resuelta',resolved_at=NOW(),resolved_by=? WHERE id=?")->execute([$admin['id'],$id]);
            $connection->commit();
        } catch(Throwable $e) {$connection->rollBack();throw $e;}
        Response::success('Contraseña asignada. Entréguela en persona después de verificar identidad. El usuario puede cambiarla desde Mi cuenta.');
    }
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
