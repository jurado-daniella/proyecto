iniciarPanel().then(cuenta => {
 if (!cuenta || !['tutor', 'estudiante'].includes(cuenta.role)) return;
 $('#mi-foto').innerHTML = avatar(cuenta.avatar, cuenta.name, 'perfil-imagen');
 $('#mi-nombre').textContent = cuenta.name;
 $('#mi-perfil').hidden = false;
});
$('#clave').addEventListener('submit', async e => {
 e.preventDefault(); const f=e.currentTarget, b=f.querySelector('button');
 const datos=Object.fromEntries(new FormData(f));
 if(datos.nueva!==datos.confirmacion) return mostrarMensaje('Las contraseñas no coinciden');
 b.disabled=true;
 try { const j=await api('sesion.php?accion=clave','POST',datos); csrf=j.data.csrf; f.reset(); mostrarMensaje(j.message,'success'); }
 catch(e){mostrarMensaje(e.message);} finally{b.disabled=false;}
});