console.log("EL SCRIPT PARA EL REGISTRO DEL USUARIO HA SIDO CARGADO EXITOSAMENTE");
// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = 'https://dqpvhulwukpzhqitiznx.supabase.co'; 
const SUPABASE_KEY = 'sb_publishable_YzbliQzydvLykLJIvCoFFA_Sr0UgLa7'; 

const formularioRegistro = document.getElementById('formRegistro');
const valorCampo = (id) => {
    const campo = document.getElementById(id);
    if (!campo) throw new Error(`NO SE ENCONTRÓ EL CAMPO EN EL FORMULARIO CON ID "${id}".`);
    return campo.value.trim();
};
if (!formularioRegistro) {
    console.error('No se encontró el formulario #formRegistro.');
} else formularioRegistro.addEventListener('submit', async function(e) {
    e.preventDefault(); 
    const botonRegistro = formularioRegistro.querySelector('button[type="submit"]');

    const fotoInput = document.getElementById('reg_foto');
    const fotoFile = fotoInput ? fotoInput.files[0] : null;

    // URL POR DEFECTO
    let fotoPublicUrl = "https://cdn-icons-png.flaticon.com/512/149/149071.png"; 

    const pass1 = valorCampo('reg_crear_pass');
        const pass2 = valorCampo('reg_pass');
            if (pass1 !== pass2) {
                alert("LAS CONTRASEÑAS NO COINCIDEN. VERIFICA E INTENTA DE NUEVO.");
                //LIMPIAR EL CAMPO DE CONFIRMACIÓN 
                document.getElementById('reg_pass').value = "";
                document.getElementById('reg_pass').focus();
                return;
            }
            if (pass1.length < 6) {
                alert("LA CONTRASEÑA DEBE CONTENER AL MENOS 6 CARACTERES.");
                document.getElementById('reg_crear_pass').focus();
                return;
            }
            
    try {
        if (botonRegistro) {
            botonRegistro.disabled = true;
            botonRegistro.textContent = 'REGISTRANDO...';
        }
        // --- PASO 1: SUBIR A SUPABASE (Si hay foto) ---
        if (fotoFile) {
            try {
                const extension = fotoFile.name.split('.').pop();
                const nombreArchivo = `${Date.now()}.${extension}`;
                const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/PERFIL_IMG/${nombreArchivo}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'apikey': SUPABASE_KEY,
                        'Content-Type': fotoFile.type
                    },
                    body: fotoFile
                });

                if (uploadRes.ok) {
                    fotoPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/PERFIL_IMG/${nombreArchivo}`;
                } else {
                    console.error("NO SE PUDO SUBIR LA FOTO; SE USARÁ LA IMAGEN POR DEFECTO:", await uploadRes.text());
                }
            } catch (uploadError) {
                console.error("FALLÓ LA SUBIDA DE LA FOTO; SE USARÁ LA IMAGEN POR DEFECTO:", uploadError);
            }
        }

        // --- PASO 2: ENVIAR A FASTAPI ---
        // IMPORTANTE: Estos nombres deben ser IGUALES a los de tu clase en Python (models.py)
        const datosUsuario = {
            nombres: valorCampo('reg_nombres'),
            apellidos: valorCampo('reg_apellidos'),
            telefono: valorCampo('reg_telefono'),
            correo: valorCampo('reg_correo'),
            tipo_identificacion: valorCampo('reg_tipo_doc'),
            numero_identificacion: valorCampo('reg_num_doc'),
            rol: valorCampo('reg_rol'),
            punto_control: valorCampo('reg_punto_control'),
            contrasena: pass2,
            foto_perfil: fotoPublicUrl 
        };
        
        console.log("JSON final enviado:", JSON.stringify(datosUsuario));
        const repuesta = await fetch('/registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });  

        const resultado = await repuesta.json().catch(() => ({}));

        if (repuesta.ok) {
            alert(`¡BIENVENIDO ${datosUsuario.nombres}, GRACIAS POR HACER PARTE DE FERROX!`);
            localStorage.setItem('usuario_id_biokuam', resultado.usuario_id);
            window.location.href = '/'; 
        } else {
            // Esto imprimirá en consola el error exacto (ej: "Falta el campo X")
            console.error("DETALLE ERROR FASTAPI:", resultado.detail);
            const detalle = typeof resultado.detail === 'string' ? resultado.detail : 'VERIFICA LOS DATOS INGRESADOS. PUEDE QUE ALGUNO YA ESTÉ REGISTRADO.';
            alert(`NO SE PUDO COMPLETAR EL REGISTRO: ${detalle}`);
        }

    } catch (error) {
        console.error('ERROR CRÍTICO:', error);
        alert('NO SE PUDO CONECTAR CON EL SERVIDOR. COMPRUEBA QUE FERROX ESTÉ EJECUTÁNDOSE Y VUELVE A INTENTARLO.');
    } finally {
        if (botonRegistro) {
            botonRegistro.disabled = false;
            botonRegistro.textContent = 'REGISTRARSE';
        }
    }
});
