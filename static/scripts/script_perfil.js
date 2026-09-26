console.log("EL SCRIPT DEL PERFIL DEL USUARIO HA SIDO CARGADO EXITOSAMENTE");
document.addEventListener('DOMContentLoaded', async () => {
    const usuarioId = localStorage.getItem('usuario_id_biokuam');
    //SI NO HAY NADIE LOGUEADO SE SACA  
    if (!usuarioId){
        window.location.href = '/';
        return;  
    }
    try{
        const respuesta = await fetch(`/perfil/usuario/${usuarioId}`);
        const datos = await respuesta.json();
        console.log("DATOS RECIBIDOS DEL SERVIDOR:", datos);
        if (respuesta.ok){
            //RELLENAS PERFIL.HTML CON LOS DATOS
            document.getElementById('userFullname').textContent = `${datos.nombres} ${datos.apellidos}`;
            document.getElementById('userCorreo').textContent = datos.correo;
            document.getElementById('userTel').textContent = datos.telefono || 'NO REGISTRADO';
            document.getElementById('userTipoDoc').textContent = datos.tipo_identificacion || 'NO REGISTRADO';
            document.getElementById('userNumDoc').textContent = datos.numero_identificacion || 'NO REGISTRADO';
            document.getElementById('userRol').textContent = datos.rol || 'USUARIO';
            document.getElementById('userRolResumen').textContent = datos.rol || '---';
            document.getElementById('userRolDetalle').textContent = datos.rol || '---';
            document.getElementById('userPuntoControl').textContent = datos.punto_control || '---';
            document.getElementById('userPuntoControlDetalle').textContent = datos.punto_control || '---';
            //CARGAR LA FOTO DE SUPABASE  
            const imgPerfil = document.getElementById('userFoto');
            if (imgPerfil && datos.foto_perfil) {
                imgPerfil.src = datos.foto_perfil;
            }
        }
    } catch (error){
        console.error("ERROR AL CARGAR EL PERFIL:", error);
    }

});
