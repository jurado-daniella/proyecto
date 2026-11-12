<?php
require_once(__DIR__ . "/../core/Connection.php");
require_once(__DIR__ . "/../core/Request.php");
require_once(__DIR__ . "/../core/Auth.php");
require_once(__DIR__ . "/../models/Usuarios.php");

$method = $_SERVER['REQUEST_METHOD'];
try {
    $action = Request::param('accion');
    $connection = new Connection();
    if ($method === 'POST' && in_array($action, ['login','registro','clave','recuperar','restablecer'], true)) {
        $key = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? 'local') . ':' . $action);
        $file = fopen(sys_get_temp_dir() . '/dam-rate-' . $key, 'c+');
        if (!$file || !flock($file, LOCK_EX)) throw new ApiException("No se pudo verificar el límite de acceso", 1009, 503);
        $attempts = json_decode(stream_get_contents($file), true) ?: [];
        $attempts = array_values(array_filter($attempts, fn($t) => is_int($t) && $t > time()-900));
        $limited = count($attempts) >= 30;
        if (!$limited) $attempts[] = time();
        ftruncate($file, 0); rewind($file); fwrite($file, json_encode($attempts)); flock($file, LOCK_UN); fclose($file);
        if ($limited) { header('Retry-After: 900'); throw new ApiException("Demasiados intentos. Espere 15 minutos", 1009, 429); }
    }

    switch ($method) {
        // Sesión actual: lo usa cada página al cargar para saber si ya hay alguien conectado
        case 'GET':
            $user = Auth::user($connection);
            Response::success("Sesión activa", ['usuario' => $user, 'csrf' => Auth::csrfToken()]);
            break;

        case 'POST':
            if (in_array($action, ['recuperar','restablecer'], true)) {
                require_once __DIR__.'/../models/Recuperacion.php';
                $recovery = new Recuperacion($connection);
                if ($action === 'recuperar') {
                    $data=Request::required(Request::body(), ['correo']);
                    if (!filter_var($data['correo'],FILTER_VALIDATE_EMAIL)) throw new ApiException('Ingrese un correo válido',1002,422);
                    $q=$connection->prepare("INSERT INTO recuperaciones_admin(user_id) SELECT id FROM usuarios u WHERE email=? AND status=1 AND NOT EXISTS(SELECT 1 FROM recuperaciones_admin r WHERE r.user_id=u.id AND r.estado='pendiente')");$q->execute([$data['correo']]);
                    Response::success('Si el correo corresponde a una cuenta activa, coordinación recibirá la solicitud. Acuda en persona para verificar su identidad y recibir una contraseña temporal.');
                }
                throw new ApiException('La recuperación ahora se realiza personalmente con coordinación',1002,410);
                $_SESSION=[];
                session_regenerate_id(true);
                Response::success('Contraseña restablecida. Inicie sesión con su nueva contraseña.');
            }
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
                $_SESSION = ['user_id' => $account['id'], 'created' => time(), 'last_activity' => time()];
                unset($_SESSION['csrf']);

                Response::success("Bienvenido", ['usuario' => Auth::user($connection), 'csrf' => Auth::csrfToken()]);
            }

            if ($action === 'registro') {
                $model = new Usuarios($connection);
                $newId = $model->register(Request::body());
                session_regenerate_id(true);
                $_SESSION = ['user_id' => $newId, 'created' => time(), 'last_activity' => time()];
                unset($_SESSION['csrf']);
                Response::success("Cuenta creada, ¡bienvenido!", ['usuario' => Auth::user($connection), 'csrf' => Auth::csrfToken()], 1, 201);
            }

            if ($action === 'clave') {
                $user = Auth::user($connection);
                Auth::verifyCsrf();
                $data = Request::required(Request::body(), ['actual', 'nueva', 'confirmacion']);
                if ($data['nueva'] !== $data['confirmacion'] || strlen($data['nueva']) < 8 || strlen($data['nueva']) > 72 || $data['nueva'] === $data['actual']) throw new ApiException("La nueva contraseña debe coincidir, ser diferente y tener entre 8 y 72 bytes", 2011, 422);
                $q = $connection->prepare('SELECT password FROM usuarios WHERE id = ?');
                $q->execute([$user['id']]);
                $old = $q->fetchColumn();
                if (!password_verify($data['actual'], $old)) throw new ApiException("Contraseña actual incorrecta", 1005, 422);
                $hash = password_hash($data['nueva'], PASSWORD_DEFAULT);
                $q = $connection->prepare('UPDATE usuarios SET password = ? WHERE id = ? AND password = ?');
                $q->execute([$hash, $user['id'], $old]);
                if (!$q->rowCount()) throw new ApiException("La contraseña cambió; vuelva a iniciar sesión", 1001, 409);
                session_regenerate_id(true);
                $_SESSION['credential'] = hash('sha256', $hash);
                unset($_SESSION['csrf']);
                Response::success("Contraseña actualizada", ['csrf' => Auth::csrfToken()]);
            }
            if ($action === 'logout') {
                Auth::user($connection);
                Auth::verifyCsrf();
                $_SESSION = [];
                session_destroy();
                $p = session_get_cookie_params();
                setcookie(session_name(), '', ['expires' => time()-3600, 'path' => $p['path'], 'secure' => $p['secure'], 'httponly' => true, 'samesite' => 'Lax']);
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
