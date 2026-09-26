document.addEventListener('DOMContentLoaded', () => {
    console.log("SCRIPT PARA RESTABLECER CONTRASEÑA CARGADO");

    // 1. OBTENER DATOS (Usando los nombres correctos del primer script)
    const nombres = localStorage.getItem('nombre_usuario_reset');
    const correo = localStorage.getItem('email_a_cambiar');

    if (!correo) {
        alert('SESIÓN EXPIRADA. POR FAVOR VERIFIQUE SU CORREO NUEVAMENTE.');
        window.location.href = '/';
        return; 
    }

    // 2. RELLENAR DATOS EN PANTALLA
    document.getElementById('display-nombre').innerText = nombres || "Usuario";
    document.getElementById('display-correo').innerText = correo;

    // 3. MANEJO DEL FORMULARIO
    document.getElementById('formRestablecer').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const pass1 = document.getElementById('new_pass').value;
        const pass2 = document.getElementById('confirm_new_pass').value;

        if (pass1 !== pass2) {
            alert('LAS CONTRASEÑAS NO COINCIDEN.');
            return;
        }

        try {
            // CAMBIO AQUÍ: La ruta debe ser /actualizar-pass
            const response = await fetch('/actualizar-pass', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    correo: correo, 
                    new_pass: pass1 // Coincide con lo que espera tu Python
                })
            });

            if (response.ok) {
                alert('CONTRASEÑA RESTABLECIDA CON ÉXITO.');
                window.location.href = '/';
            } else {
                const errorData = await response.json();
                alert('ERROR: ' + (errorData.detail || 'No se pudo actualizar'));
            }
        } catch (error) {
            console.error('ERROR DE CONEXIÓN: ', error);
            alert('ERROR AL CONECTAR CON EL SERVIDOR.');
        }
    });
});