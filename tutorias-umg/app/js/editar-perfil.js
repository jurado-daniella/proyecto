const formularioFoto = $('#foto-perfil');
const campoFoto = $('#foto');
const quitarFoto = $('#quitar-foto');
let vistaTemporal;

function mostrarFoto(src = usuario.avatar) {
  $('#vista-foto').innerHTML = avatar(src, usuario.name, 'perfil-imagen');
  quitarFoto.hidden = !usuario.avatar;
}

campoFoto.addEventListener('change', () => {
  if (vistaTemporal) URL.revokeObjectURL(vistaTemporal);
  vistaTemporal = campoFoto.files[0] ? URL.createObjectURL(campoFoto.files[0]) : null;
  mostrarFoto(vistaTemporal || usuario.avatar);
});

async function actualizarFoto(metodo, datos) {
  const guardar = formularioFoto.querySelector('button[type="submit"], button:not([type])');
  guardar.disabled = quitarFoto.disabled = campoFoto.disabled = true;
  try {
    const respuesta = await api('avatar.php', metodo, datos);
    usuario.avatar = respuesta.data.avatar;
    formularioFoto.reset();
    if (vistaTemporal) URL.revokeObjectURL(vistaTemporal);
    vistaTemporal = null;
    mostrarFoto();
    $('#foto-barra').innerHTML = avatar(usuario.avatar, usuario.name);
    mostrarMensaje(respuesta.message, 'success');
  } catch (error) {
    mostrarMensaje(error.message);
  } finally {
    guardar.disabled = quitarFoto.disabled = campoFoto.disabled = false;
  }
}

formularioFoto.addEventListener('submit', (evento) => {
  evento.preventDefault();
  actualizarFoto('POST', new FormData(formularioFoto));
});

quitarFoto.addEventListener('click', async () => {
  if (await confirmar('¿Quitar tu foto de perfil?')) actualizarFoto('DELETE');
});

iniciarPanel(['tutor', 'estudiante']).then((cuenta) => {
  if (!cuenta) return;
  mostrarFoto();
  formularioFoto.hidden = false;
});
