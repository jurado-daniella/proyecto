const ACCESOS = {
  admin: [['usuarios.html', 'Registrar catedrático'], ['tutorias.html', 'Nueva tutoría'], ['solicitudes.html', 'Ver solicitudes']],
  tutor: [['bloques.html', 'Publicar horario'], ['solicitudes.html', 'Ver solicitudes']],
  estudiante: [['explorar.html', 'Buscar tutoría'], ['solicitudes.html', 'Mis solicitudes']],
};

// true si la tutoría todavía no ha pasado
let esFutura = (s) => new Date(`${s.fecha}T${s.hora_inicio}`) >= new Date();

async function cargarInicio() {
  let user = await iniciarPanel();
  if (!user) return;

  $('#titulo').textContent = `Bienvenido(a), ${user.name}`;
  $('#accesos').innerHTML = ACCESOS[user.role]
    .map(([url, texto]) => `<a href="${url}" class="btn btn-light">${texto}</a>`)
    .join('');

  try {
    let response = await api('solicitudes.php');
    let proximas = response.data
      .filter((s) => esFutura(s) && ['pendiente', 'aceptada'].includes(s.estado))
      .sort((a, b) => (a.fecha + a.hora_inicio).localeCompare(b.fecha + b.hora_inicio))
      .slice(0, 6);

    if (proximas.length === 0) {
      $('#proximas').innerHTML = VACIO('No hay tutorías próximas.');
      return;
    }

    let filas = '';
    proximas.forEach((s, i) => {
      filas += `
        <tr>
          <td class="num">${i + 1}</td>
          <td>${formatDate(s.fecha)}</td>
          <td>${s.hora_inicio} - ${s.hora_fin}</td>
          <td>${esc(s.tutoria)}</td>
          <td>${esc(user.role === 'estudiante' ? s.tutor : s.estudiante)}</td>
          <td><span class="badge badge-${s.estado}">${s.estado}</span></td>
          <td>${s.enlace ? `<a class="btn btn-sm btn-navy" href="${esc(s.enlace)}" target="_blank" rel="noopener noreferrer">Unirse</a>` : ''}</td>
        </tr>`;
    });

    $('#proximas').innerHTML = `
      <div class="table-wrap">
        <table>
          <thead><tr><th>No.</th><th>Fecha</th><th>Hora</th><th>Tutoría</th><th>${user.role === 'estudiante' ? 'Catedrático' : 'Estudiante'}</th><th>Estado</th><th></th></tr></thead>
          <tbody>${filas}</tbody>
        </table>
      </div>`;
  } catch (error) {
    $('#proximas').innerHTML = alerta(error.message);
  }
}

cargarInicio();
