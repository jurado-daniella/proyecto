let eventosBitacora=[];
async function cargarBitacora(){
 $('#tabla').innerHTML=CARGANDO;
 try{const j=await api('bitacora.php?'+filtros(Object.fromEntries(new FormData($('#filtros-audit')))));
 eventosBitacora=j.data;
 $('#tabla').innerHTML=j.data.length?`<div class="table-wrap"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Recurso</th><th>Acción</th><th>Método</th><th>Registro</th><th>Resultado</th><th>Detalle</th></tr></thead><tbody>${j.data.map(e=>`<tr><td>${esc(e.fecha)}</td><td>${esc(e.usuario_nombre||'Sin sesión autenticada')}</td><td>${esc(e.recurso)}</td><td>${esc(e.accion)}</td><td>${esc(e.metodo)}</td><td>${esc(e.registro_id||'—')}</td><td>${esc(e.resultado)} (${esc(e.http_status)})</td><td><button class="btn btn-sm" onclick="verEvento(${e.id})">Ver cambios</button></td></tr>`).join('')}</tbody></table></div>`:VACIO('Sin eventos para estos filtros.');
 }catch(e){$('#tabla').innerHTML=alerta(e.message);}
}
$('#filtros-audit').addEventListener('submit',e=>{e.preventDefault();cargarBitacora();});$('#filtros-audit').addEventListener('reset',()=>setTimeout(cargarBitacora,0));$('#actualizar').addEventListener('click',cargarBitacora);iniciarPanel(['admin']).then(u=>{if(u)cargarBitacora();});

function verEvento(id){const e=eventosBitacora.find(x=>Number(x.id)===Number(id));if(!e)return;let cambios;try{cambios=JSON.stringify(JSON.parse(e.cambios||'[]'),null,2);}catch{cambios='Sin detalle disponible';}messageBox({title:'Evento '+e.id,text:`${e.fecha} · ${e.usuario_nombre||'Sin sesión'}\n${e.recurso} / ${e.accion} · ${e.resultado}\n${e.detalle||''}\nIP: ${e.ip_origen||'—'}\nOperación: ${e.solicitud_id||'—'}\n\nCambios registrados:\n${cambios}`});}
