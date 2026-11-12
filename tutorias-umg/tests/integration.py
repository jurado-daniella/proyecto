import os
import json, urllib.request, urllib.error, http.cookiejar, subprocess
BASE='http://localhost/proyecto/tutorias-umg/api/controllers/'
class Client:
 def __init__(self):
  self.jar=http.cookiejar.CookieJar();self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar));self.csrf=''
 def call(self,path,method='GET',body=None,want=200):
  data=json.dumps(body).encode() if body is not None else (b'{}' if method!='GET' else None)
  req=urllib.request.Request(BASE+path,data=data,method=method,headers={'Content-Type':'application/json','X-CSRF-Token':self.csrf})
  try:
   with self.http.open(req) as res: code=res.status;out=json.load(res)
  except urllib.error.HTTPError as e:code=e.code;out=json.load(e)
  assert code==want,(path,code,out)
  if out.get('data',{}).__class__==dict and 'csrf' in out.get('data',{}):self.csrf=out['data']['csrf']
  return out.get('data')
 def login(self,u):return self.call('sesion.php?accion=login','POST',{'usuario':u,'clave':os.environ['DAM_TEST_PASSWORD']})['usuario']
def check(name,fn):
 fn();print('PASS',name,flush=True)
a=Client();t=Client();s=Client();tid=None
try:
 admin=a.login('admin');teacher=t.login('cmorales');student=s.login('mjuarezx1@miumg.edu.gt');print('PASS login three roles')
 check('anonymous protected endpoint',lambda:Client().call('usuarios.php',want=401))
 check('student cannot administer users',lambda:s.call('usuarios.php',want=403))
 check('tutor cannot administer users',lambda:t.call('usuarios.php',want=403))
 check('CSRF required',lambda:Client().call('sesion.php?accion=logout','POST',want=403))
 check('admin lists users',lambda:a.call('usuarios.php'))
 check('invalid email rejected',lambda:a.call('usuarios.php','POST',{'usuario':'qa','nombre':'QA','correo':'invalido','clave':os.environ['DAM_TEST_PASSWORD'],'rol':'tutor'},422))
 check('invalid date rejected',lambda:t.call('bloques.php','POST',{'tutoria':1,'fecha':'2026-02-30','hora_inicio':'09:00','hora_fin':'10:00','enlace':'https://example.com'},422))
 check('SQL login injection rejected',lambda:Client().call('sesion.php?accion=login','POST',{'usuario':"' OR 1=1 --",'clave':'incorrecta'},401))
 for url in ['../.env','../../database/database.sql','../core/Auth.php']:
  try: urllib.request.urlopen(BASE+url);raise AssertionError('Sensitive file accessible')
  except urllib.error.HTTPError as e:assert e.code==403,(url,e.code)
 print('PASS Apache denies configuration, SQL and internal PHP')
 courses=a.call('tutorias.php?accion=cursos')
 import datetime
 day=(datetime.date.today()+datetime.timedelta(days=3)).isoformat()
 body={'curso':courses[0]['codigo'],'titulo':'QA flujo integral temporal','descripcion':'Prueba automatizada','fecha_inicio':day,'fecha_fin':day,'hora_inicio':'08:00','hora_fin':'20:00','dias':['1','2','3','4','5','6','7']}
 tid=a.call('tutorias.php','POST',body,201)['codigo'];print('PASS admin creates tutoria')
 a.call(f'tutorias.php?id={tid}&accion=tutores','PUT',{'tutores':[teacher['id']]});print('PASS admin assigns tutor')
 b={'tutoria':tid,'fecha':day,'hora_inicio':'10:00','hora_fin':'11:00','enlace':'https://meet.google.com/qa-test'}
 check('student cannot create blocks',lambda:s.call('bloques.php','POST',b,403))
 bid=t.call('bloques.php','POST',b,201)['codigo'];print('PASS tutor publishes block')
 check('overlapping block rejected',lambda:t.call('bloques.php','POST',b,409))
 check('invalid URL rejected',lambda:t.call('bloques.php','POST',{**b,'enlace':'javascript:alert(1)'},422))
 rows=s.call(f'bloques.php?tutoria={tid}');assert rows and rows[0]['enlace'] is None;print('PASS hidden meeting URL')
 sid=s.call('solicitudes.php','POST',{'bloque':bid},201)['codigo'];print('PASS student requests')
 check('duplicate rejected',lambda:s.call('solicitudes.php','POST',{'bloque':bid},409))
 check('block with requests cannot move',lambda:t.call(f'bloques.php?id={bid}','PUT',b,409))
 check('student cannot accept',lambda:s.call(f'solicitudes.php?id={sid}&accion=aceptar','PUT',{},403))
 t.call(f'solicitudes.php?id={sid}&accion=aceptar','PUT',{});print('PASS tutor accepts')
 row=next(x for x in s.call('solicitudes.php') if x['codigo']==sid);assert row['enlace'];print('PASS accepted URL visible')
 check('cannot attend future block',lambda:t.call(f'solicitudes.php?id={sid}&accion=atender','PUT',{'observaciones':'Atención QA'},409))
 s.call(f'solicitudes.php?id={sid}&accion=cancelar','PUT',{});print('PASS student cancels accepted request')
 s.call('solicitudes.php','POST',{'bloque':bid},201);t.call(f'solicitudes.php?id={sid}&accion=rechazar','PUT',{'observaciones':'Prueba de rechazo'});print('PASS reapply and reject')
 # A second request for attention, moved into the past only by the fixture helper.
 b2={**b,'hora_inicio':'12:00','hora_fin':'13:00'}
 bid2=t.call('bloques.php','POST',b2,201)['codigo'];sid2=s.call('solicitudes.php','POST',{'bloque':bid2},201)['codigo'];t.call(f'solicitudes.php?id={sid2}&accion=aceptar','PUT',{})
 php="require 'tutorias-umg/api/core/Connection.php'; $c=new Connection(); $q=$c->prepare('UPDATE bloques SET date=CURDATE()-INTERVAL 1 DAY WHERE id=? AND tutoria_id=?'); $q->execute(["+str(bid2)+","+str(tid)+"]);"
 subprocess.run(['C:/xampp/php/php.exe','-r',php],check=True,capture_output=True)
 t.call(f'solicitudes.php?id={sid2}&accion=atender','PUT',{'observaciones':'Atención completada en prueba QA'});assert next(x for x in s.call('solicitudes.php') if x['codigo']==sid2)['estado']=='atendida';print('PASS tutor records attendance and student sees it')
 for client,label in [(a,'admin'),(t,'tutor'),(s,'student')]:
  check(label+' rejects incorrect current password',lambda:client.call('sesion.php?accion=clave','POST',{'actual':'incorrecta','nueva':'QA-temporal2026!','confirmacion':'QA-temporal2026!'},422))
  client.call('sesion.php?accion=clave','POST',{'actual':os.environ['DAM_TEST_PASSWORD'],'nueva':'QA-temporal2026!','confirmacion':'QA-temporal2026!'})
  client.call('sesion.php?accion=clave','POST',{'actual':'QA-temporal2026!','nueva':os.environ['DAM_TEST_PASSWORD'],'confirmacion':os.environ['DAM_TEST_PASSWORD']})
  print('PASS',label,'changes and restores password')
 for client in [a,t,s]:
  client.call('sesion.php?accion=logout','POST');client.call('sesion.php',want=401)
 print('PASS logout invalidates all three sessions')
finally:
 if tid:
  php="require 'tutorias-umg/api/core/Connection.php'; $c=new Connection(); $c->beginTransaction(); $id="+str(tid)+"; $c->exec('DELETE s FROM solicitudes s JOIN bloques b ON b.id=s.block_id WHERE b.tutoria_id='.$id); $c->exec('DELETE FROM bloques WHERE tutoria_id='.$id); $c->exec('DELETE FROM tutoria_tutor WHERE tutoria_id='.$id); $c->exec('DELETE FROM tutorias WHERE id='.$id); $c->commit();"
  subprocess.run(['C:/xampp/php/php.exe','-r',php],check=True,capture_output=True);print('QA fixtures removed')

