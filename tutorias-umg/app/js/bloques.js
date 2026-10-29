const formulario = $('#form-bloque');
let bloques = [];
let misTutorias = [];   // tutorías donde la coordinación me asignó
let editando = null;    // código del bloque que se edita (null = nuevo)

$('#f-desde').value = hoy();

async function cargarBloques() {
  $('#tabla').innerHTML = CARGANDO;
  try {
    let response = await api(`bloques.php?${filtros({ estado: $('#f-estado').value, desde: $('#f-desde').value, hasta: $('#f-hasta').value })}`);
    bloques = response.data;
    pintarTabla();
  } catch (error) {
    $('#tabla').innerHTML = alerta(error.message);
  }
}

function pintarTabla() {
  if (bloques.length === 0) {
    $('#tabla').innerHTML = VACIO('Aún no tienes horarios publicados en esas fechas.');
    return;
  }

  let filas = '';
  bloques.forEach((b, i) => {
    // solo se puede editar o cancelar si nadie lo ha reservado
    let acciones = b.estado === 'disponible'
      ? `<button class="btn btn-sm" onclick="editarBloque(${b.codigo})">Editar</button>
         <button class="btn btn-sm" onclick="cancelarBloque(${b.codigo})">Cancelar</button>`
      : '';
    filas += `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${formatDate(b.fecha)}</td>
        <td>${b.hora_inicio} – ${b.hora_fin}</td>
        <td>${esc(b.tutoria)}</td>
        <td>${b.aplicantes} estudiante${b.aplicantes === 1 ? '' : 's'}</td>
        <td>${badge(b.estado)}</td>
        <td class="actions">${acciones}</td>
      </tr>`;
  });

  $('#tabla').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>No.</th><th>Fecha</th><th>Horario</th><th>Tutoría</th><th>Aplicando</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
}

// Muestra el rango que definió la coordinación y limita fecha y horas a ese rango
function actualizarRango() {
  let rango = misTutorias.find((t) => String(t.codigo) === formulario.tutoria.value);

  formulario.fecha.min = rango ? [rango.fecha_inicio, hoy()].sort().pop() : hoy();
  formulario.fecha.max = rango ? rango.fecha_fin : '';
  formulario.hora_inicio.min = formulario.hora_fin.min = rango ? rango.hora_inicio : '';
  formulario.hora_inicio.max = formulario.hora_fin.max = rango ? rango.hora_fin : '';

  $('#rango').hidden = !rango;
  if (rango) {
    $('#rango').innerHTML = `<span>Disponible del <b>${shortDate(rango.fecha_inicio)}</b> al <b>${shortDate(rango.fecha_fin)}</b>,
      de <b>${rango.hora_inicio}</b> a <b>${rango.hora_fin}</b> · ${daysText(rango.dias)}</span>`;
  }
}

formulario.tutoria.addEventListener('change', actualizarRango);

function nuevoBloque() {
  editando = null;
  formulario.reset();
  $('#titulo-form').textContent = 'Nuevo horario';
  actualizarRango();
  formulario.hidden = false;
}

function editarBloque(codigo) {
  let b = bloques.find((x) => x.codigo === codigo);
  editando = codigo;
  formulario.tutoria.value = b.tutoria_codigo;
  formulario.fecha.value = b.fecha;
  formulario.hora_inicio.value = b.hora_inicio;
  formulario.hora_fin.value = b.hora_fin;
  formulario.enlace.value = b.enlace;
  $('#titulo-form').textContent = 'Editar horario';
  actualizarRango();
  formulario.hidden = false;
}

function cerrarFormulario() {
  formulario.hidden = true;
}

formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  let datos = Object.fromEntries(new FormData(formulario));
  if (datos.hora_fin <= datos.hora_inicio) {
    mostrarMensaje('La hora de fin debe ser posterior a la de inicio');   // el servidor también lo valida
    return;
  }
  ejecutar(
    () => editando
      ? api(`bloques.php?id=${editando}`, 'PUT', { codigo: editando, ...datos })
      : api('bloques.php', 'POST', datos),
    () => { cerrarFormulario(); cargarBloques(); }
  );
});

function cancelarBloque(codigo) {
  let b = bloques.find((x) => x.codigo === codigo);
  if (!confirm(`¿Cancelar el bloque del ${formatDate(b.fecha)} a las ${b.hora_inicio}? Las solicitudes pendientes se rechazarán.`)) return;
  ejecutar(() => api(`bloques.php?id=${codigo}`, 'DELETE'), cargarBloques);
}

$('#f-estado').addEventListener('change', cargarBloques);
$('#f-desde').addEventListener('change', cargarBloques);
$('#f-hasta').addEventListener('change', cargarBloques);

iniciarPanel(['tutor']).then(async (user) => {
  if (!user) return;
  cargarBloques();
  misTutorias = (await api(`tutorias.php?tutor=${user.id}`)).data;
  $('#select-tutoria').innerHTML = '<option value="">Seleccione…</option>' + misTutorias
    .map((t) => `<option value="${t.codigo}">${esc(t.titulo)}</option>`)
    .join('');
});
