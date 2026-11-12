const formulario = $('#form-usuario');
let usuarios = [];      // lo último que devolvió la API
let editando = null;    // código del usuario que se está editando (null = nuevo)

async function cargarUsuarios() {
  $('#tabla').innerHTML = CARGANDO;
  try {
    let response = await api(`usuarios.php?${filtros({ rol: $('#f-rol').value, buscar: $('#f-buscar').value })}`);
    usuarios = response.data;
    pintarTabla();
  } catch (error) {
    $('#tabla').innerHTML = alerta(error.message);
  }
}

function pintarTabla() {
  if (usuarios.length === 0) {
    $('#tabla').innerHTML = VACIO();
    return;
  }

  let filas = '';
  usuarios.forEach((u, i) => {
    // a uno mismo no se le muestra el botón de desactivar
    let botonEstado = u.codigo !== usuario.id
      ? `<button class="btn btn-sm" onclick="cambiarEstado(${u.codigo})">${u.estado ? 'Desactivar' : 'Activar'}</button>`
      : '';
    filas += `
      <tr>
        <td class="num">${i + 1}</td>
        <td><div class="person">${avatar(u.avatar, u.nombre)}<div>${esc(u.nombre)}<small>${esc(u.correo)}</small></div></div></td>
        <td>${esc(u.usuario)}</td>
        <td>${ROLES[u.rol]}</td>
        <td>${badge(u.estado)}</td>
        <td class="actions">
          <button class="btn btn-sm" onclick="editarUsuario(${u.codigo})">Editar</button>
          ${botonEstado}
        </td>
      </tr>`;
  });

  $('#tabla').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>No.</th><th>Nombre</th><th>Usuario</th><th>Rol</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
}

function nuevoUsuario() {
  editando = null;
  formulario.reset();
  formulario.rol.value = 'tutor';
  formulario.clave.required = true;
  $('#titulo-form').textContent = 'Nuevo usuario';
  $('#texto-clave').textContent = 'Contraseña';
  formulario.hidden = false;
}

function editarUsuario(codigo) {
  let u = usuarios.find((x) => x.codigo === codigo);
  editando = codigo;
  formulario.nombre.value = u.nombre;
  formulario.usuario.value = u.usuario;
  formulario.correo.value = u.correo;
  formulario.clave.value = '';
  formulario.rol.value = u.rol;
  formulario.clave.required = false;
  $('#titulo-form').textContent = 'Editar usuario';
  $('#texto-clave').textContent = 'Nueva contraseña (opcional)';
  formulario.hidden = false;
}

function cerrarFormulario() {
  formulario.hidden = true;
}

formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  let datos = Object.fromEntries(new FormData(formulario));
  ejecutar(
    () => editando
      ? api(`usuarios.php?id=${editando}`, 'PUT', { codigo: editando, ...datos })
      : api('usuarios.php', 'POST', datos),
    () => { cerrarFormulario(); cargarUsuarios(); }
  );
});

function cambiarEstado(codigo) {
  let u = usuarios.find((x) => x.codigo === codigo);
  ejecutar(() => api(`usuarios.php?id=${codigo}&accion=estado`, 'PUT', { estado: u.estado ? 0 : 1 }), cargarUsuarios);
}

// los filtros buscan al momento de escribir o cambiar
$('#f-buscar').addEventListener('input', cargarUsuarios);
$('#f-rol').addEventListener('change', cargarUsuarios);

iniciarPanel(['admin']).then((user) => { if (user) { cargarUsuarios(); cargarRecuperaciones(); } });

async function cargarRecuperaciones(){
 let box=$('#recuperaciones');if(!box){box=document.createElement('section');box.id='recuperaciones';box.className='grupo';$('#tabla').before(box);}
 try{const j=await api('usuarios.php?accion=recuperaciones');box.innerHTML='<h2>Solicitudes de recuperación de contraseña</h2><p>Verifique la identidad presencialmente antes de asignar una contraseña temporal.</p>'+ (j.data.length?j.data.map(r=>`<article class="day-appointment"><strong>${esc(r.nombre)}</strong><p>${esc(r.usuario)} · ${esc(r.correo)}<br>${esc(r.fecha)}</p><button class="btn btn-navy" onclick="resolverRecuperacion(${r.id})">Asignar contraseña temporal</button></article>`).join(''):'<p>No hay solicitudes pendientes.</p>');}catch(e){box.textContent=e.message;}
}
async function resolverRecuperacion(id){
 const nueva=await messageBox({title:'Contraseña temporal (8 a 72 bytes)',input:true,cancel:true,required:true});if(nueva===null)return;
 if(!await confirmar('¿Verificó la identidad del titular y desea asignar esta contraseña para entregarla en persona?'))return;
 await ejecutar(()=>api(`usuarios.php?accion=recuperaciones&id=${id}`,'PUT',{nueva,confirmacion:nueva}),cargarRecuperaciones);
}
