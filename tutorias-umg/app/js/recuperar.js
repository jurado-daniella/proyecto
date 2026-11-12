$('#recuperacion').addEventListener('submit',async e=>{
 e.preventDefault();const b=$('#recuperar-boton');b.disabled=true;
 try {const j=await api('sesion.php?accion=recuperar','POST',Object.fromEntries(new FormData(e.target)));await messageBox({title:'Solicitud enviada a coordinación',text:j.message});e.target.reset();}catch(err){mostrarMensaje(err.message);}finally{b.disabled=false;}
});
