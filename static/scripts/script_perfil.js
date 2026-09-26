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
            document.getElementById('userTel').textContent = datos.telefono;
            document.getElementById('userVereda').textContent = datos.vereda;
            document.getElementById('userFinca').textContent  = datos.nombre_finca;
            document.getElementById('userNumDoc').textContent = datos.tipo_identificacion;
            document.getElementById('userFolio').textContent = datos.numero_identificacion;
            document.getElementById('userBKM').textContent = datos.referencia_prototipo;
            //CARGAR LA FOTO DE SUPABASE  
            const imgPerfil = document.getElementById('userFoto');
            if (imgPerfil && datos.foto_perfil) {
                imgPerfil.src = datos.foto_perfil;
            }
            const mensajeRefBarcos = {
                "BKM-REF-001": "VINCULADO AL PROTOTIPO 'BKM-REF-001': Este prototipo es la puerta de entrada a la robótica acuática de BIOKUAM. Diseñado para fines educativos y recreativos, el BKM-001 ofrece un sistema de navegación eficiente controlado vía Bluetooth. Cuenta con la potencia del microcontrolador ATmega328P y un sistema de propulsión por motorreductores, ideal para aprender los fundamentos de la dinámica de fluidos y control remoto en entornos controlados.",
                "BKM-REF-002": "VINCULADO AL PROTOTIPO 'BKM-REF-002': El modelo intermedio BKM-002 eleva las capacidades del prototipo base al integrar monitoreo ambiental activo. Equipado con un sensor de temperatura de alta precisión y alimentado por una Power Bank para mayor autonomía, este modelo permite la recolección de datos térmicos en tiempo real. Incluye un empaque reforzado y manual de protocolos, siendo la herramienta perfecta para estudios básicos de calidad de agua.",
                "BKM-REF-003": "VINCULADO AL PROTOTIPO 'BKM-REF-003': La versión BKM-003 es nuestra estación de investigación móvil más completa y potente. Integra un ecosistema de sensores de pH y temperatura, junto a una cámara para inspección visual detallada. Su conectividad dual (WiFi/Bluetooth) permite el control a larga distancia y la gestión de datos mediante una aplicación de telemetría avanzada. Este kit profesional incluye una caja de herramientas técnica y manual de laboratorio, diseñado para misiones de monitoreo ambiental riguroso y análisis de ecosistemas acuáticos complejos.",
            };  
            const elementoDescripcion = document.getElementById('descriptionBKM');
            if (elementoDescripcion) {
                const mensajeparaBarcos = mensajeRefBarcos[datos.referencia_prototipo] || "PROTOTIPO ASIGNADO SIN DESCRIPCIÓN ESPECÍFICA.";
                elementoDescripcion.textContent = mensajeparaBarcos;
            }
        }
    } catch (error){
        console.error("ERROR AL CARGAR EL PERFIL:", error);
    }

});