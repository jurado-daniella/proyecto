<?php
class Recuperacion {
    private Connection $db;
    function __construct(Connection $db) { $this->db=$db; }
    function request(array $data): void {
        $data=Request::required($data, ['correo']);
        if (strlen($data['correo'])>120 || !filter_var($data['correo'],FILTER_VALIDATE_EMAIL)) throw new ApiException("Ingrese un correo válido",1002,422);
        $q=$this->db->prepare('SELECT id,email,password FROM usuarios WHERE email=? AND status=1');$q->execute([$data['correo']]);$user=$q->fetch();
        if (!$user) return; // La respuesta pública no revela si la cuenta existe.
        $token=bin2hex(random_bytes(32));
        $this->db->prepare('DELETE FROM password_resets WHERE expires_at<NOW() OR user_id=?')->execute([$user['id']]);
        $this->db->prepare('INSERT INTO password_resets(user_id,token_hash,credential,expires_at) VALUES(?,?,?,DATE_ADD(NOW(),INTERVAL 30 MINUTE))')->execute([$user['id'],hash('sha256',$token),hash('sha256',$user['password'])]);
        $base=rtrim(Env::get('APP_URL','http://localhost/proyecto/tutorias-umg/app'),'/');
        if (!filter_var($base,FILTER_VALIDATE_URL) || !preg_match('#^https?://#',$base)) throw new ApiException('Configuración de correo inválida',1009,503);
        $link=$base.'/recuperar.html#token='.$token;
        $text="Se solicitó recuperar su cuenta DAM. Abra el enlace para elegir una nueva contraseña. Vence en 30 minutos y solo puede usarse una vez.\n\n".$link."\n\nSi no hizo esta solicitud, ignore este mensaje.";
        $transport=Env::get('MAIL_TRANSPORT','file');
        if ($transport==='file') {
            if (!in_array($_SERVER['REMOTE_ADDR']??'', ['127.0.0.1','::1'],true)) throw new ApiException('El envío de correo aún no está configurado',1009,503);
            $dir=sys_get_temp_dir().'/dam-mail';
            if (!is_dir($dir) && !mkdir($dir,0700,true)) throw new RuntimeException('No se pudo crear bandeja local');
            if (file_put_contents($dir.'/'.bin2hex(random_bytes(12)).'.txt', 'Para: '.$user['email']."\nAsunto: Recuperar cuenta DAM\n\n".$text, LOCK_EX)===false) throw new RuntimeException('No se pudo guardar correo local');
        } elseif ($transport==='mail') {
            $from=Env::get('MAIL_FROM','');
            if (!filter_var($from,FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/',$from) || !mail($user['email'],'Recuperar cuenta DAM',$text,['From'=>$from,'Content-Type'=>'text/plain; charset=UTF-8'])) throw new RuntimeException('No se pudo enviar recuperación');
        } else throw new RuntimeException('Transporte de correo desconocido');
    }
    function reset(array $data): void {
        $data=Request::required($data,['token','nueva','confirmacion']);
        if (!preg_match('/^[a-f0-9]{64}$/',$data['token'])) throw new ApiException('Enlace inválido o vencido',1002,422);
        if ($data['nueva']!==$data['confirmacion'] || strlen($data['nueva'])<8 || strlen($data['nueva'])>72) throw new ApiException('Las contraseñas deben coincidir y tener entre 8 y 72 bytes',1002,422);
        $this->db->beginTransaction();
        try {
            $q=$this->db->prepare('SELECT r.*,u.password,u.status FROM password_resets r JOIN usuarios u ON u.id=r.user_id WHERE r.token_hash=? AND r.used_at IS NULL AND r.expires_at>NOW() FOR UPDATE');$q->execute([hash('sha256',$data['token'])]);$row=$q->fetch();
            if (!$row || !$row['status'] || !hash_equals($row['credential'],hash('sha256',$row['password']))) throw new ApiException('Enlace inválido o vencido. Solicite uno nuevo',1002,422);
            if (password_verify($data['nueva'],$row['password'])) throw new ApiException('Elija una contraseña diferente de la anterior',1002,422);
            $this->db->prepare('UPDATE usuarios SET password=? WHERE id=?')->execute([password_hash($data['nueva'],PASSWORD_DEFAULT),$row['user_id']]);
            $this->db->prepare('UPDATE password_resets SET used_at=NOW() WHERE user_id=? AND used_at IS NULL')->execute([$row['user_id']]);
            $this->db->commit();
        } catch(Throwable $e) {$this->db->rollBack();throw $e;}
    }
}
