const formLogin = document.getElementById('formLogin');

if (formLogin) {
    console.log("EL SCRIPT PARA EL LOGIN DEL USUARIO HA SIDO CARGADO EXITOSAMENTE");

    formLogin.addEventListener('submit', async function(e) {
        e.preventDefault();

        // BUSCAR LOS ELEMENTOS ESPECIFICAMENTE DENTRO DEL FORMULARIO 
        const formulario = e.target;
        const inputUsuario = formulario.querySelector('#login_usuario');
        const inputPass = formulario.querySelector('#login_pass');

        // CAPTURA DE LOS VALORES
        const correoVal = inputUsuario.value.trim();
        const passVal = inputPass.value.trim();

        // VERIFICACIÓN CRÍTICA EN CONSOLA DEL NAVEGADOR
        console.log("CAPTURA JS -> Usuario:", correoVal);
        console.log("CAPTURA JS -> Pass:", passVal);

        if (!correoVal || !passVal) {
            alert("Por favor completa todos los campos.");
            return;
        }

        const datosLogin = {
            correo: correoVal,
            contrasena: passVal
        };

        try {
            const respuesta = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosLogin)
            });

            const resultado = await respuesta.json();

            if (respuesta.ok) {
                // GUARDAR LOS DATOS EN EL LOCAL STORAGE
                localStorage.setItem('usuario_id_biokuam', resultado.usuario_id);
                localStorage.setItem('usuario_nombres_biokuam', resultado.nombres);
                
                if (resultado.foto_perfil) {
                    localStorage.setItem('usuario_foto_biokuam', resultado.foto_perfil);
                }

                alert(`¡BIENVENIDO DE NUEVO ${resultado.nombres}!`);
                
                // Redirigir al home o perfil
                window.location.href = '/home'; 
            } else {
                // SE MOSTRARA EL ERROR 401 (CLAVE INCORRECTA) O EL ERROR 400 (NO EXISTE).
                alert(`ERROR: ${resultado.detail}`);
            }
        } catch (error) {
            console.error("ERROR AL CONECTAR CON FASTAPI:", error);
            alert("NO SE PUDO CONECTAR CON EL SERVIDOR.");
        }
    });
}