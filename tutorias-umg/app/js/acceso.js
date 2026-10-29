// Login y registro usan este mismo archivo.
// Se sabe cuál es por el nombre de la página.
const esLogin = location.pathname.endsWith('login.html');
const formulario = $('#formulario');

// Si ya tiene sesión no tiene sentido mostrar el login
api('sesion.php').then(() => location.href = 'inicio.html').catch(() => {});

formulario.addEventListener('submit', async (e) => {
  e.preventDefault();
  mostrarMensaje('');

  let datos = Object.fromEntries(new FormData(formulario));

  if (!esLogin && datos.clave !== datos.confirmacion) {
    mostrarMensaje('Las contraseñas no coinciden');
    return;
  }

  let boton = $('#boton');
  let textoBoton = boton.textContent;
  boton.disabled = true;
  boton.textContent = 'Un momento…';

  try {
    await api(`sesion.php?accion=${esLogin ? 'login' : 'registro'}`, 'POST', datos);
    location.href = 'inicio.html';
  } catch (error) {
    mostrarMensaje(error.message);
    boton.disabled = false;
    boton.textContent = textoBoton;
  }
});
