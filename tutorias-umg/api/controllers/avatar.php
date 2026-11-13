<?php
require_once __DIR__ . '/../core/Connection.php';
require_once __DIR__ . '/../core/Auth.php';

$directory = __DIR__ . '/../avatar-files/';
$prefix = '../api/controllers/avatar.php?foto=';
$pattern = '/\A[a-f0-9]{32}\.(jpg|png|webp)\z/';
$types = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        $name = $_GET['foto'] ?? '';
        if (!is_string($name) || !preg_match($pattern, $name, $parts) || !is_file($directory . $name)) {
            Response::error('Foto no disponible', 8001, 404);
        }
        header('Content-Type: ' . $types[$parts[1]]);
        header('X-Content-Type-Options: nosniff');
        readfile($directory . $name);
        exit;
    }

    if (!in_array($method, ['POST', 'DELETE'], true)) {
        throw new ApiException('Método no permitido', 8002, 405);
    }

    $connection = new Connection();
    $user = Auth::requireRole($connection, 'tutor', 'estudiante');
    Auth::verifyCsrf();
    $newName = null;

    if ($method === 'POST') {
        $file = $_FILES['foto'] ?? [];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK
            || !is_uploaded_file($file['tmp_name']) || $file['size'] > 2 * 1024 * 1024) {
            throw new ApiException('Selecciona una foto de hasta 2 MB', 8003, 422);
        }
        $image = @getimagesize($file['tmp_name']);
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $extension = array_search($mime, $types, true);
        if (!$image || !$extension || $image['mime'] !== $mime
            || $image[0] > 4096 || $image[1] > 4096) {
            throw new ApiException('Usa una foto JPG, PNG o WebP de hasta 4096 × 4096 píxeles', 8004, 422);
        }
        $newName = bin2hex(random_bytes(16)) . '.' . $extension;
        if (!move_uploaded_file($file['tmp_name'], $directory . $newName)) {
            throw new ApiException('No se pudo guardar la foto', 8005, 500);
        }
    }

    $avatar = $newName ? $prefix . $newName : null;
    try {
        $update = $connection->prepare('UPDATE usuarios SET avatar = ? WHERE id = ?');
        $update->execute([$avatar, $user['id']]);
    } catch (Throwable $error) {
        if ($newName) unlink($directory . $newName);
        throw $error;
    }

    $previous = $user['avatar'] ?? '';
    if (str_starts_with($previous, $prefix)) {
        $oldName = substr($previous, strlen($prefix));
        if (preg_match($pattern, $oldName) && is_file($directory . $oldName)) {
            unlink($directory . $oldName);
        }
    }

    Response::success($newName ? 'Foto guardada' : 'Foto eliminada', ['avatar' => $avatar]);
} catch (Throwable $error) {
    Response::fromException($error, 'No se pudo actualizar la foto', 8000);
}
