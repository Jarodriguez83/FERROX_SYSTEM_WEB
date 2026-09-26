// Usamos DOMContentLoaded para asegurar que el navegador ya dibujó los botones y el formulario
document.addEventListener('DOMContentLoaded', () => {
    console.log(" SCRIPT PARA INICIO DE PESTAÑA CARGADO Y LISTO");

    // --- 1. FUNCIONES DE NAVEGACIÓN (Pestañas) ---
    // Las definimos dentro o fuera, pero aquí las vinculamos globalmente
    window.openTab = function(evt, tabName) {
        let i, tabcontent, tablinks;
        
        // Ocultar contenidos
        tabcontent = document.getElementsByClassName("tab-content");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].classList.remove("active");
        }

        // Quitar clase active de botones
        tablinks = document.getElementsByClassName("tab-btn");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].classList.remove("active");
        }

        // Mostrar actual
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add("active");
            evt.currentTarget.classList.add("active");
        }
    };

    window.triggerTab = function(index) {
        const buttons = document.querySelectorAll('.tab-btn');
        if (buttons[index]) {
            buttons[index].click();
        }
    };

    // --- 2. MANEJO DEL FORMULARIO DE OLVIDO ---
    const formOlvidar = document.getElementById('formOlvidar');
    
    if (formOlvidar) {
        formOlvidar.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputCorreo = document.getElementById('inputCorreo');
            const boton = document.querySelector('.btn-submit'); // Buscamos por clase ya que no tenía ID

            if (!inputCorreo || !boton) {
                console.error("NO SE ENCONTRARON LOS ELEMENTOS DEL FORMULARIO");
                return;
            }

            const correo = inputCorreo.value;

            // Feedback visual
            const textoOriginal = boton.innerText;
            boton.innerText = "BUSCANDO...";
            boton.disabled = true;

            try {
                const response = await fetch(`/verificar-usuario?correo=${encodeURIComponent(correo)}`, {
                    method: 'GET'
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('email_a_cambiar', data.correo);
                    localStorage.setItem('nombre_usuario_reset', data.nombre);
                    
                    // Pequeño delay para que el usuario vea el éxito antes de saltar
                    window.location.href = "/restablecer-pass"; 
                } else {
                    alert("" + (data.detail || "EL CORREO NO SE ENCUENTRA REGISTRADO."));
                    boton.innerText = textoOriginal;
                    boton.disabled = false;
                }

            } catch (error) {
                console.error("ERROR DE CONEXIÓN:", error);
                alert("NO SE PUDO CONECTAR.");
                boton.innerText = textoOriginal;
                boton.disabled = false;
            }
        });
    } else {
        console.warn("NO SE ENCONTRO EL ELEMENTO.");
    }
});