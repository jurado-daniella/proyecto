let esEstudiante = false;
let solicitudes = [];     // todo lo que devolvió la API (el calendario usa todo)
let filas = [];           // lo que se ve en la tabla después de filtrar por nombre
let seleccionada = null;  // código de la fila seleccionada
let busqueda = { texto: '', tutoria: '', estado: '' };   // se aplica al presionar "Buscar"

let ddmmyyyy = (iso) => iso.split('-').reverse().join('/');

async function cargarSolicitudes() {
  $('#tabla').innerHTML = CARGANDO;
  try {
    // la API filtra por tutoría y estado; el nombre se filtra aquí en el navegador
    let response = await api(`solicitudes.php?${filtros({ tutoria: busqueda.tutoria, estado: busqueda.estado })}`);
    solicitudes = response.data;
  } catch (error) {
    $('#tabla').innerHTML = alerta(error.message);
    return;
  }
  pintarTabla();
  pintarCalendario();
}

function pintarTabla() {
  let texto = busqueda.texto.toLowerCase();
  filas = solicitudes.filter((s) => !texto || `${s.estudiante} ${s.carne} ${s.tutor}`.toLowerCase().includes(texto));

  if (filas.length === 0) {
    $('#tabla').innerHTML = VACIO('No se encontraron solicitudes.');
    return;
  }

  let html = '';
  filas.forEach((s, i) => {
    let acciones = '';
    if (s.enlace) {
      acciones += `<a class="btn btn-sm btn-navy" href="${esc(s.enlace)}" target="_blank" rel="noopener noreferrer" title="Unirse a la reunión" onclick="event.stopPropagation()">Unirse</a>`;
    }
    // Fase 4: el catedrático acepta o rechaza
    if (!esEstudiante && s.estado === 'pendiente') {
      acciones += `<button class="icon-btn ok" type="button" title="Aceptar">✔</button>
                   <button class="icon-btn no" type="button" title="Rechazar">✖</button>`;
    }
    if (s.estado !== 'pendiente' && !s.enlace) acciones = '<span class="muted">—</span>';

    html += `
      <tr class="${seleccionada === s.codigo ? 'selected' : ''}" onclick="seleccionar(${s.codigo})" style="cursor:pointer">
        <td class="num">${i + 1}</td>
        ${!esEstudiante ? `<td>${esc(s.estudiante)}</td>` : ''}
        <td>${esc(s.tutoria)}</td>
        ${usuario.role !== 'tutor' ? `<td>${esc(s.tutor)}</td>` : ''}
        <td>${ddmmyyyy(s.fecha)}</td>
        <td>${s.hora_inicio} - ${s.hora_fin}</td>
        <td>${badge(s.estado)}</td>
        <td class="actions">${acciones}</td>
      </tr>`;
  });

  $('#tabla').innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>No.</th>
            ${!esEstudiante ? '<th>Estudiante</th>' : ''}
            <th>Materia</th>
            ${usuario.role !== 'tutor' ? '<th>Catedrático</th>' : ''}
            <th>Fecha</th><th>Hora</th><th>Estado</th><th>Acciones</th>
          </tr>
        </thead>
        <tbody>${html}</tbody>
      </table>
    </div>
    <p class="table-note">Haga clic en una fila para seleccionarla. ${filas.length} registro(s).</p>`;
}

function seleccionar(codigo) {
  seleccionada = codigo;
  pintarTabla();
}

$('#form-filtros').addEventListener('submit', (e) => {
  e.preventDefault();
  seleccionada = null;
  busqueda = { texto: $('#f-texto').value, tutoria: $('#f-tutoria').value, estado: $('#f-estado').value };
  cargarSolicitudes();
});

function cancelarSolicitud() {
  let actual = filas.find((s) => s.codigo === seleccionada);
  if (!actual) return mostrarMensaje('Seleccione una solicitud de la tabla');
  if (!['pendiente', 'aceptada'].includes(actual.estado)) return mostrarMensaje('Esa solicitud ya no se puede cancelar');
  if (!confirm('¿Seguro que desea cancelar la solicitud seleccionada?')) return;
  ejecutar(() => api(`solicitudes.php?id=${actual.codigo}&accion=cancelar`, 'PUT'), cargarSolicitudes);
}

// ---------- Calendario ----------

let mes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function moverMes(n) {
  mes = new Date(mes.getFullYear(), mes.getMonth() + n, 1);
  pintarCalendario();
}

function colorEstado(estado) {
  let colores = { pendiente: 'c-pendiente', aceptada: 'c-aceptada', atendida: 'c-aceptada', cancelada: 'c-cancelada', rechazada: 'c-cancelada' };
  return colores[estado] ?? 'c-otro';
}

function pintarCalendario() {
  let titulo = mes.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
  $('#mes').textContent = titulo[0].toUpperCase() + titulo.slice(1);

  let hoyIso = hoy();
  let corrimiento = (mes.getDay() + 6) % 7;   // la semana empieza en lunes
  let html = ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<span class="dow">${d}</span>`).join('');

  // 6 semanas = 42 cuadritos
  for (let i = 0; i < 42; i++) {
    let dia = new Date(mes.getFullYear(), mes.getMonth(), 1 - corrimiento + i);
    let iso = dia.toLocaleDateString('en-CA');
    let delDia = solicitudes.filter((s) => s.fecha === iso);

    let clase = 'cal-day';
    if (dia.getMonth() !== mes.getMonth()) clase += ' out';
    if (iso === hoyIso) clase += ' today';

    let puntos = delDia.length
      ? `<span class="dots">${delDia.slice(0, 4).map((s) => `<i class="${colorEstado(s.estado)}"></i>`).join('')}</span>`
      : '';
    let tooltip = delDia.map((s) => `${s.hora_inicio} ${s.tutoria} (${s.estado})`).join('\n');

    html += `<span class="${clase}" ${tooltip ? `title="${esc(tooltip)}"` : ''}>${dia.getDate()}${puntos}</span>`;
  }
  $('#calendario').innerHTML = html;
}

// ---------- Arranque ----------

iniciarPanel().then(async (user) => {
  if (!user) return;
  esEstudiante = user.role === 'estudiante';

  $('#titulo').textContent = esEstudiante ? 'Mis solicitudes de tutoría' : 'Solicitudes de Tutorías';
  $('#texto-persona').textContent = esEstudiante ? 'Catedrático:' : 'Estudiante:';
  $('#boton-cancelar').hidden = !esEstudiante;

  pintarCalendario();
  cargarSolicitudes();

  let tutorias = (await api('tutorias.php')).data;
  $('#f-tutoria').innerHTML += tutorias.map((t) => `<option value="${t.codigo}">${esc(t.curso)}</option>`).join('');
});
