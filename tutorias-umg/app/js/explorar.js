// Flujo del estudiante: elige tutoría -> elige catedrático -> solicita un horario
let tutorias = [];
let elegida = null;     // tutoría que está viendo
let tutorElegido = '';  // '' = todos los catedráticos

async function cargarTutorias() {
  $('#lista').innerHTML = CARGANDO;
  try {
    let response = await api(`tutorias.php?${filtros({ buscar: $('#f-buscar').value, curso: $('#f-curso').value })}`);
    tutorias = response.data;
  } catch (error) {
    $('#lista').innerHTML = alerta(error.message);
    return;
  }

  if (tutorias.length === 0) {
    $('#lista').innerHTML = VACIO('No hay tutorías con esos filtros.');
    return;
  }

  let tarjetas = '';
  tutorias.forEach((t) => {
    tarjetas += `
      <div class="tutoria-card">
        <span class="code">${esc(t.curso_clave)} · Ciclo ${t.ciclo}</span>
        <h3>${esc(t.titulo)}</h3>
        ${t.descripcion ? `<p>${esc(t.descripcion)}</p>` : ''}
        <p class="meta">${shortDate(t.fecha_inicio)} – ${shortDate(t.fecha_fin)} · ${daysText(t.dias)} · ${t.total_tutores} catedrático(s)</p>
        <button class="btn btn-sm btn-navy" onclick="verDetalle(${t.codigo})">Ver horarios (${t.bloques_disponibles})</button>
      </div>`;
  });
  $('#lista').innerHTML = `<div class="tutoria-grid">${tarjetas}</div>`;
}

async function verDetalle(codigo) {
  elegida = tutorias.find((t) => t.codigo === codigo);
  tutorElegido = '';
  mostrarMensaje('');

  $('#detalle-titulo').textContent = elegida.titulo;
  $('#detalle-info').textContent = `${elegida.curso_clave} · ${elegida.curso} — del ${shortDate(elegida.fecha_inicio)} al ${shortDate(elegida.fecha_fin)}, ${daysText(elegida.dias)} de ${elegida.hora_inicio} a ${elegida.hora_fin}`;
  $('#vista-lista').hidden = true;
  $('#vista-detalle').hidden = false;

  $('#tutores').innerHTML = '';
  cargarHorarios();

  let response = await api(`tutorias.php?id=${codigo}`);
  let botones = `
    <button data-tutor="" aria-pressed="true" onclick="elegirTutor('')">
      <span class="avatar lg">∗</span>
      <div><strong>Todos</strong><span>Ver todos</span></div>
    </button>`;
  response.data.tutores.forEach((t) => {
    botones += `
      <button data-tutor="${t.codigo}" aria-pressed="false" onclick="elegirTutor('${t.codigo}')">
        ${avatar(t.avatar, t.nombre, 'lg')}
        <div><strong>${esc(t.nombre)}</strong><span>Catedrático</span></div>
      </button>`;
  });
  $('#tutores').innerHTML = botones;
}

function elegirTutor(codigo) {
  tutorElegido = codigo;
  // marca en rojo el botón elegido
  document.querySelectorAll('#tutores button').forEach((boton) => {
    boton.setAttribute('aria-pressed', boton.dataset.tutor === codigo);
  });
  cargarHorarios();
}

async function cargarHorarios() {
  $('#horarios').innerHTML = CARGANDO;
  let horarios;
  try {
    horarios = (await api(`bloques.php?${filtros({ tutoria: elegida.codigo, tutor: tutorElegido })}`)).data;
  } catch (error) {
    $('#horarios').innerHTML = alerta(error.message);
    return;
  }

  if (horarios.length === 0) {
    $('#horarios').innerHTML = VACIO('No hay horarios disponibles por el momento.');
    return;
  }

  let filas = '';
  horarios.forEach((b, i) => {
    let accion = b.mi_solicitud && b.mi_solicitud !== 'cancelada'
      ? `<span class="badge badge-${b.mi_solicitud}">Tu solicitud: ${b.mi_solicitud}</span>`
      : `<button class="btn btn-sm btn-red" onclick="solicitar(${b.codigo})">Solicitar</button>`;
    filas += `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${formatDate(b.fecha)}</td>
        <td>${b.hora_inicio} - ${b.hora_fin}</td>
        <td><div class="person">${avatar(b.tutor_avatar, b.tutor)}${esc(b.tutor)}</div></td>
        <td>${b.aplicantes} estudiante(s)</td>
        <td>${accion}</td>
      </tr>`;
  });

  $('#horarios').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead><tr><th>No.</th><th>Fecha</th><th>Hora</th><th>Catedrático</th><th>Aplicando</th><th>Acción</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </div>`;
}

function solicitar(bloque) {
  ejecutar(() => api('solicitudes.php', 'POST', { bloque }), cargarHorarios);
}

function regresar() {
  $('#vista-detalle').hidden = true;
  $('#vista-lista').hidden = false;
  cargarTutorias();
}

async function cargarCursos() {
  let cursos = (await api('tutorias.php?accion=cursos')).data;
  $('#f-curso').innerHTML += cursos.map((c) => `<option value="${c.codigo}">${esc(c.nombre)}</option>`).join('');
}

$('#f-buscar').addEventListener('input', cargarTutorias);
$('#f-curso').addEventListener('change', cargarTutorias);

iniciarPanel(['estudiante']).then((user) => {
  if (!user) return;
  cargarTutorias();
  cargarCursos();
});
