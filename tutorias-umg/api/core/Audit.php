<?php
/** Historial de operaciones HTTP. Nunca registra cuerpos, claves, cookies ni tokens. */
class Audit {
    static ?PDO $db = null;
    static ?array $actor = null;
    static function record(int $status, $data = []): void {
        $method=$_SERVER['REQUEST_METHOD']??'GET';
        if ($method==='GET' || !self::$db) return;
        $actor=self::$actor;
        $resource=basename($_SERVER['SCRIPT_NAME']??'');
        $action=is_string($_GET['accion']??null)?$_GET['accion']:strtolower($method);
        $id=filter_var($_GET['id']??(is_array($data)?($data['codigo']??null):null),FILTER_VALIDATE_INT);
        try {
            $q=self::$db->prepare('INSERT INTO bitacora(usuario_id,usuario_nombre,recurso,accion,metodo,registro_id,resultado,http_status) VALUES(?,?,?,?,?,?,?,?)');
            $q->execute([$actor['id']??null,$actor['name']??null,substr($resource,0,60),substr($action,0,60),$method,$id?:null,$status<400?'correcto':'rechazado',$status]);
        } catch(Throwable $e) { error_log('No se pudo registrar bitácora: '.$e->getMessage()); }
    }
}
