// =============================================
// Funciones que usan todas las páginas
// =============================================

let $ = (id) => document.querySelector(id);

const API = '../api/controllers';
let csrf = '';        // token que pide la API para POST, PUT y DELETE
let usuario = null;   // usuario con sesión iniciada

// Llama a la API en PHP y devuelve el JSON. Si algo falla lanza un error con el mensaje del servidor.
async function api(ruta, metodo = 'GET', datos = null) {
  let opciones = {
    method: metodo,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
  };
  if (metodo !== 'GET') opciones.headers['X-CSRF-Token'] = csrf;
  if (datos) opciones.body = JSON.stringify(datos);

  let request = await fetch(`${API}/${ruta}`, opciones);
  let response;
  try {
    response = await request.json();
  } catch {
    throw new Error('El servidor no respondió correctamente. ¿Está encendido XAMPP?');
  }
  if (!request.ok) {
    if (request.status === 401 && usuario) { location.href = 'login.html'; }
    throw new Error(response.message || 'Error inesperado');
  }
  return response;
}

// { rol: 'tutor', buscar: '' } -> "rol=tutor" (quita los vacíos)
function filtros(datos) {
  let limpio = {};
  for (let clave in datos) {
    if (datos[clave] !== '' && datos[clave] != null) limpio[clave] = datos[clave];
  }
  return new URLSearchParams(limpio).toString();
}

// Evita que un nombre o descripción con < > se interprete como HTML
function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Mensajes ----------

function alerta(texto, tipo = 'error') {
  return `<div class="alert alert-${tipo}" role="${tipo === 'error' ? 'alert' : 'status'}">
    <span>${esc(texto)}</span>
    <button type="button" class="close" onclick="this.parentElement.remove()" aria-label="Cerrar mensaje">×</button>
  </div>`;
}

function mostrarMensaje(texto, tipo = 'error') {
  if ($('#mensajes')) $('#mensajes').innerHTML = texto ? alerta(texto, tipo) : '';
  if (texto) messageBox({title:tipo === 'success' ? 'Operación completada' : 'Revise la información',text:texto});
}

// Ejecuta una petición que cambia datos y muestra el mensaje que devuelve la API
async function ejecutar(peticion, despues) {
  mostrarMensaje('');
  try {
    let response = await peticion();
    mostrarMensaje(response.message, 'success');
    if (despues) despues(response);
    return true;
  } catch (error) {
    mostrarMensaje(error.message);
    return false;
  }
}

const VACIO = (texto = 'No hay registros con esos filtros.') => `<p class="empty">${texto}</p>`;
const CARGANDO = '<p class="muted">Cargando…</p>';

// ---------- Fechas ----------

const DIAS = [['1', 'Lun'], ['2', 'Mar'], ['3', 'Mié'], ['4', 'Jue'], ['5', 'Vie'], ['6', 'Sáb'], ['7', 'Dom']];

let aFecha = (iso) => new Date(iso + 'T00:00:00');

// 2026-10-09 -> "vie 09/10/2026"
let formatDate = (iso) => aFecha(iso).toLocaleDateString('es-GT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

// 2026-10-09 -> "9 oct"
let shortDate = (iso) => aFecha(iso).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' });

// fecha de hoy en formato YYYY-MM-DD
let hoy = () => new Date().toLocaleDateString('en-CA');

// "1,2,3,4,5" -> "Lun a Vie"   "1,3,5" -> "Lun, Mié, Vie"
function daysText(dias = '') {
  let lista = String(dias).split(',').filter(Boolean);
  if (lista.length === 7) return 'Todos los días';
  let nombres = lista.map((d) => DIAS[d - 1][1]);
  let seguidos = lista.every((d, i) => i === 0 || Number(d) === Number(lista[i - 1]) + 1);
  return seguidos && lista.length > 2 ? `${nombres[0]} a ${nombres[nombres.length - 1]}` : nombres.join(', ');
}

// ---------- Pedacitos de HTML ----------

function badge(valor) {
  let textos = { 1: 'Activo', 0: 'Inactivo' };
  return `<span class="badge badge-${esc(valor)}">${esc(textos[valor] ?? valor)}</span>`;
}

// Foto de perfil o las iniciales si no tiene foto
function avatar(src, nombre = '', clase = '') {
  let iniciales = nombre.replace(/^(Ing|Inga|Lic|Licda|Dr|Dra)\.\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  if (src) return `<img class="avatar ${clase}" src="${esc(src)}" alt="">`;
  return `<span class="avatar ${clase}" aria-hidden="true">${esc(iniciales)}</span>`;
}

// ---------- Panel: sesión y menú ----------

const ROLES = { admin: 'Coordinación', tutor: 'Catedrático', estudiante: 'Estudiante' };

// Menú por rol. El servidor vuelve a validar el rol en cada petición;
// esto solo decide qué páginas mostrar.
const MENU = {
  admin: [['inicio.html', 'Inicio'], ['usuarios.html', 'Usuarios'], ['tutorias.html', 'Tutorías'], ['solicitudes.html', 'Solicitudes']],
  tutor: [['tutorias.html', 'Tutorías y propuestas'], ['inicio.html', 'Inicio'], ['bloques.html', 'Mis horarios'], ['solicitudes.html', 'Solicitudes']],
  estudiante: [['inicio.html', 'Inicio'], ['explorar.html', 'Buscar tutorías'], ['solicitudes.html', 'Mis solicitudes']],
};

// Pregunta al servidor quién tiene la sesión y dibuja la barra de arriba.
// Si no hay sesión manda al login; si el rol no puede ver la página manda al inicio.
async function iniciarPanel(rolesPermitidos) {
  try {
    let response = await api('sesion.php');
    csrf = response.data.csrf;
    usuario = response.data.usuario;
  } catch {
    location.href = 'login.html';
    return null;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(usuario.role)) {
    location.href = 'inicio.html';
    return null;
  }

  if (!MENU[usuario.role].some(([url]) => url === 'perfil.html')) MENU[usuario.role].push(['perfil.html', 'Mi cuenta']);
  let pagina = location.pathname.split('/').pop() || 'inicio.html';
  let enlaces = MENU[usuario.role]
    .map(([url, texto]) => `<a href="${url}" class="${url === pagina ? 'active' : ''}">${texto}</a>`)
    .join('');
  let detalle = usuario.role === 'estudiante' ? `Carné ${usuario.username}` : ROLES[usuario.role];

  $('#barra').innerHTML = `
    <img src="assets/logo/dam-logo-horizontal-white.png" alt="DAM Tutorías">
    <nav>${enlaces}</nav>
    <div class="usuario">
      <span>${esc(usuario.name)}<small>${esc(detalle)}</small></span>
      <button onclick="salir()">Salir</button>
    </div>`;

  return usuario;
}

async function salir() {
  try {
    await api('sesion.php?accion=logout', 'POST');
  } catch {
    // la sesión ya no existía
  }
  location.href = 'index.html';
}

// Diálogos propios: texto seguro, navegación por teclado y retorno del foco.
let dialogQueue = Promise.resolve();
function messageBox({title='DAM · Tutorías', text='', html='', input=false, cancel=false, required=false}={}) {
 const job=()=>new Promise(resolve=>{
  const previous=document.activeElement, d=document.createElement('dialog');d.className='message-box';d.setAttribute('aria-labelledby','dam-dialog-title');
  d.innerHTML=`<form><header><h2 id="dam-dialog-title"></h2></header><div class="message-content"></div>${input?'<label class="message-input">Observaciones<textarea maxlength="4000" rows="4"></textarea></label>':''}<footer>${cancel?'<button type="button" class="btn" data-cancel>Cancelar</button>':''}<button class="btn btn-navy" type="submit">${input?'Guardar':'Aceptar'}</button></footer></form>`;
  d.querySelector('h2').textContent=title;
  const content=d.querySelector('.message-content');if(html)content.innerHTML=html;else content.textContent=text;
  const field=d.querySelector('textarea');if(field)field.required=required;
  const finish=value=>{d.close();d.remove();previous?.focus();resolve(value);};
  d.querySelector('form').addEventListener('submit',e=>{e.preventDefault();finish(input?field.value:true);});
  d.querySelector('[data-cancel]')?.addEventListener('click',()=>finish(input?null:false));
  d.addEventListener('cancel',e=>{e.preventDefault();finish(input?null:false);});
  document.body.append(d);d.showModal();(field||d.querySelector('button[type="submit"]')).focus();
 });
 const result=dialogQueue.then(job);dialogQueue=result.catch(()=>{});return result;
}
const confirmar = text => messageBox({title:'Confirmar acción',text,cancel:true});
const informar = text => messageBox({title:'Información',text});
