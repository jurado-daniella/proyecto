<?php
require_once __DIR__.'/../core/Connection.php';
require_once __DIR__.'/../core/Auth.php';
require_once __DIR__.'/../core/Request.php';
try {
 $c=new Connection();Auth::requireRole($c,'admin');
 if ($_SERVER['REQUEST_METHOD']!=='GET') throw new ApiException('La bitácora es de solo lectura',1003,405);
 $where=[];$params=[];
 foreach(['desde','hasta'] as $key){$v=Request::param($key);if($v!==null){if(!Request::validDate($v))throw new ApiException('Fecha inválida',1002,422);$where[]=$key==='desde'?'fecha >= ?':'fecha < DATE_ADD(?,INTERVAL 1 DAY)';$params[]=$v;}}
 $result=Request::param('resultado');if($result!==null){if(!in_array($result,['correcto','rechazado'],true))throw new ApiException('Resultado inválido',1002,422);$where[]='resultado=?';$params[]=$result;}
 $qtext=Request::param('buscar');if($qtext){$where[]='(usuario_nombre LIKE ? OR recurso LIKE ? OR accion LIKE ?)';$params=array_merge($params,array_fill(0,3,'%'.mb_substr($qtext,0,120).'%'));}
 $q=$c->prepare('SELECT id,usuario_nombre,recurso,accion,metodo,registro_id,resultado,http_status,fecha,detalle,cambios,ip_origen,solicitud_id FROM bitacora'.($where?' WHERE '.implode(' AND ',$where):'').' ORDER BY id DESC LIMIT 500');$q->execute($params);
 Response::success('Últimos 500 eventos',$q->fetchAll());
}catch(Throwable $e){Response::fromException($e,'No se pudo consultar la bitácora',7000);}
