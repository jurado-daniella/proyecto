<?php
/** Auditoría de escrituras: cambios persistidos, sin valores de credenciales. */
class Audit {
    static ?PDO $db=null;
    static ?array $actor=null;
    static array $before=[];
    static array $tables=[
        'usuarios'=>'id,username,name,email,role,status,avatar,password',
        'tutorias'=>'id,course_id,title,description,start_date,end_date,start_time,end_time,days,status,created_by',
        'tutoria_tutor'=>'tutoria_id,tutor_id',
        'bloques'=>'id,tutoria_id,tutor_id,date,start_time,end_time,link,status',
        'solicitudes'=>'id,block_id,student_id,status,notes',
        'recuperaciones_admin'=>'id,user_id,estado,resolved_at,resolved_by'
    ];
    static function snapshot(): array {
        $all=[];
        foreach(self::$tables as $table=>$columns){
            foreach(self::$db->query("SELECT $columns FROM $table")->fetchAll(PDO::FETCH_ASSOC) as $row){
                $key=isset($row['id'])?(string)$row['id']:$row['tutoria_id'].':'.$row['tutor_id'];
                $all[$table][$key]=$row;
            }
        }
        return $all;
    }
    static function start(): void {
        if (($_SERVER['REQUEST_METHOD']??'GET')==='GET') return;
        try{self::$before=self::snapshot();}catch(Throwable $e){error_log('No se pudo iniciar auditoría: '.$e->getMessage());}
    }
    static function record(int $status, $data=[], string $message=''): void {
        $method=$_SERVER['REQUEST_METHOD']??'GET';
        if($method==='GET'||!self::$db)return;
        try{
            $changes=[];$after=self::snapshot();
            foreach(self::$tables as $table=>$columns){
                $old=self::$before[$table]??[];$new=$after[$table]??[];
                foreach(array_unique(array_merge(array_keys($old),array_keys($new))) as $key){
                    $a=$old[$key]??null;$b=$new[$key]??null;
                    if($a===$b)continue;
                    $credential=($a['password']??null)!==($b['password']??null);
                    $fields=[];
                    foreach(array_unique(array_merge(array_keys($a??[]),array_keys($b??[]))) as $field){
                        if($field==='password')continue;
                        if(($a[$field]??null)!==($b[$field]??null))$fields[$field]=['antes'=>$a[$field]??null,'despues'=>$b[$field]??null];
                    }
                    $entry=['tabla'=>$table,'registro'=>(string)$key,'operacion'=>$a===null?'creado':($b===null?'eliminado':'actualizado'),'campos'=>$fields];
                    if($credential)$entry['credencial_modificada']=true;
                    $changes[]=$entry;
                }
            }
            $resource=basename($_SERVER['SCRIPT_NAME']??'');
            $action=is_string($_GET['accion']??null)?$_GET['accion']:strtolower($method);
            $id=filter_var($_GET['id']??(is_array($data)?($data['codigo']??null):null),FILTER_VALIDATE_INT);
            $q=self::$db->prepare('INSERT INTO bitacora(usuario_id,usuario_nombre,recurso,accion,metodo,registro_id,resultado,http_status,solicitud_id,ip_origen,detalle,cambios) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)');
            $q->execute([self::$actor['id']??null,self::$actor['name']??null,substr($resource,0,60),substr($action,0,60),$method,$id?:null,$status<400?'correcto':'rechazado',$status,bin2hex(random_bytes(16)),substr($_SERVER['REMOTE_ADDR']??'',0,45),mb_substr($message,0,2000),json_encode($changes,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR)]);
        }catch(Throwable $e){error_log('No se pudo registrar bitácora: '.$e->getMessage());}
    }
}
