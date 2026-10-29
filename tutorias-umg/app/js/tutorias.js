const formTutoria = $('#form-tutoria');
const formAsignar = $('#form-asignar');
let tutorias = [];
let editando = null;     // código de la tutoría que se edita (null = nueva)
let asignando = null;    // código de la tutoría a la que se le asignan catedráticos

// Botones de los días (Lun, Mar, ...)
$('#dias').innerHTML = DIAS
  .map(([valor, texto]) => `<label class="day"><input type="checkbox" name="dias" value="${valor}"><span>${texto}</span></label>`)
  .join(' ');

async function cargarTutorias() {
  $('#tabla').innerHTML = CARGANDO;
  try {
    let response = await api(`tutorias.php?${filtros({ buscar: $('#f-buscar').value, curso: $('#f-curso').value })}`);
    tutorias = response.data;
    pintarTabla();
  } catch (error) {
    $('#tabla').innerHTML = alerta(error.message);
  }
}

function pintarTabla() {
  if (tutorias.length === 0) {
    $('#tabla').innerHTML = VACIO();
    return;
  }

  let filas = '';
  tutorias.forEach((t, i) => {
    filas += `
      <tr>
        <td class="num">${i + 1}</td>
        <td><strong>${esc(t.titulo)}</strong><small class="code" style="display:block">${esc(t.curso_clave)} · ${esc(t.curso)}</small></td>
        <td>
          ${shortDate(t.fecha_inicio)} – ${shortDate(t.fecha_fin)}
          <small class="muted" style="display:block">${t.hora_inicio} – ${t.hora_fin} · ${daysText(t.dias)}</small>
        </td>
        <td>${t.total_tutores}</td>
        <td>${t.bloques_disponibles}</td>
        <td>${badge(t.estado)}</td>
        <td class="actions">
          <button class="btn btn-sm" onclick="editarTutoria(${t.codigo})">Editar</button>
          <button class="btn btn-sm" onclick="abrirAsignar(${t.codigo})">Catedráticos</button>
          <button class="btn btn-sm" onclick="cambiarEstado(${t.codigo})">${t.estado ? 'Desactivar' : 'Activar'}</button>
        </td>
      </tr>`;
  });

  $('#tabla').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>No.</th><th>Tutoría</th><th>Rango</th><th>Catedráticos</th><th>Horarios libres</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
}

// Llena el formulario; marca los días que vienen en la lista
function llenarFormulario(datos) {
  for (let campo of ['curso', 'titulo', 'descripcion', 'fecha_inicio', 'fecha_fin', 'hora_inicio', 'hora_fin']) {
    formTutoria[campo].value = datos[campo] ?? '';
  }
  formTutoria.querySelectorAll('[name="dias"]').forEach((check) => {
    check.checked = datos.dias.includes(check.value);
  });  formTutoria.fecha_fin.min = datos.fecha_inicio;
}

function nuevaTutoria() {
  cerrarFormularios();
  editando = null;
  llenarFormulario({ curso: '', titulo: '', descripcion: '', fecha_inicio: hoy(), fecha_fin: '', hora_inicio: '08:00', hora_fin: '18:00', dias: ['1', '2', '3', '4', '5'] });
  $('#titulo-form').textContent = 'Nueva tutoría';
  formTutoria.hidden = false;
}

function editarTutoria(codigo) {
  cerrarFormularios();
  let t = tutorias.find((x) => x.codigo === codigo);
  editando = codigo;
  llenarFormulario({ ...t, curso: t.curso_codigo, dias: t.dias.split(',') });
  $('#titulo-form').textContent = 'Editar tutoría';
  formTutoria.hidden = false;
}

function cerrarFormularios() {
  formTutoria.hidden = true;
  formAsignar.hidden = true;
}

// la fecha final no puede ser antes de la inicial
formTutoria.fecha_inicio.addEventListener('change', () => formTutoria.fecha_fin.min = formTutoria.fecha_inicio.value);

formTutoria.addEventListener('submit', (e) => {
  e.preventDefault();
  let datos = Object.fromEntries(new FormData(formTutoria));
  datos.dias = [...formTutoria.querySelectorAll('[name="dias"]:checked')].map((check) => check.value);
  ejecutar(
    () => editando
      ? api(`tutorias.php?id=${editando}`, 'PUT', { codigo: editando, ...datos })
      : api('tutorias.php', 'POST', datos),
    () => { cerrarFormularios(); cargarTutorias(); }
  );
});

// ---------- Asignar catedráticos ----------

async function abrirAsignar(codigo) {
  cerrarFormularios();
  let t = tutorias.find((x) => x.codigo === codigo);
  let response = await api(`tutorias.php?id=${codigo}`);
  let asignados = response.data.tutores.map((x) => x.codigo);
  asignando = codigo;

  $('#titulo-asignar').textContent = `Catedráticos de “${t.titulo}”`;
  formAsignar.querySelectorAll('[name="tutores"]').forEach((check) => {
    check.checked = asignados.includes(Number(check.value));
  });
  formAsignar.hidden = false;
}

formAsignar.addEventListener('submit', (e) => {
  e.preventDefault();
  let tutores = [...formAsignar.querySelectorAll('[name="tutores"]:checked')].map((check) => Number(check.value));
  ejecutar(
    () => api(`tutorias.php?id=${asignando}&accion=tutores`, 'PUT', { tutores }),
    () => { cerrarFormularios(); cargarTutorias(); }
  );
});

function cambiarEstado(codigo) {
  let t = tutorias.find((x) => x.codigo === codigo);
  ejecutar(() => api(`tutorias.php?id=${codigo}&accion=estado`, 'PUT', { estado: t.estado ? 0 : 1 }), cargarTutorias);
}

// Cursos del pensum (para el formulario y el filtro) y catedráticos activos (para asignar)
async function cargarListas() {
  let cursos = (await api('tutorias.php?accion=cursos')).data;
  $('#select-curso').innerHTML = '<option value="">Seleccione…</option>' + cursos
    .map((c) => `<option value="${c.codigo}">${esc(c.clave)} · ${esc(c.nombre)} (ciclo ${c.ciclo})</option>`)
    .join('');
  $('#f-curso').innerHTML += cursos.map((c) => `<option value="${c.codigo}">${esc(c.nombre)}</option>`).join('');

  let tutores = (await api('usuarios.php?rol=tutor&estado=1')).data;
  $('#lista-tutores').innerHTML = '<legend class="sr-only">Catedráticos</legend>' + tutores
    .map((t) => `<label class="check"><input type="checkbox" name="tutores" value="${t.codigo}">${avatar(t.avatar, t.nombre)}${esc(t.nombre)}</label>`)
    .join('');
}

$('#f-buscar').addEventListener('input', cargarTutorias);
$('#f-curso').addEventListener('change', cargarTutorias);

iniciarPanel(['admin']).then((user) => {
  if (!user) return;
  cargarTutorias();
  cargarListas();
});
