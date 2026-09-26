document.addEventListener('DOMContentLoaded', () => {
    const status = document.getElementById('cameraStatus');
    const statusText = document.getElementById('cameraStatusText');
    const overlay = document.getElementById('videoOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayMessage = document.getElementById('overlayMessage');
    const image = document.getElementById('cameraImage');
    const video = document.getElementById('cameraVideo');
    const updated = document.getElementById('videoUpdated');
    const note = document.getElementById('streamNote');
    const usuarioId = localStorage.getItem('usuario_id_biokuam');
    const accessToken = localStorage.getItem('access_token_biokuam');

    function showMessage(title, message, label = 'SIN TRANSMISIÓN') {
        overlay.hidden = false;
        overlayTitle.textContent = title;
        overlayMessage.textContent = message;
        status.classList.remove('live');
        statusText.textContent = label;
        image.hidden = true;
        video.hidden = true;
        video.pause();
        image.removeAttribute('src');
        video.removeAttribute('src');
    }

    async function loadCamera() {
        if (!usuarioId || !accessToken) {
            showMessage('Inicia sesión', 'Debes iniciar sesión con una cuenta administradora para consultar esta cámara.', 'SIN SESIÓN');
            return;
        }

        statusText.textContent = 'Verificando acceso…';
        try {
            const response = await fetch('/api/camara/stream', {
                cache: 'no-store',
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            const result = await response.json().catch(() => ({}));

            if (response.status === 403) {
                showMessage('Acceso restringido', 'La transmisión del cruce está disponible únicamente para cuentas administradoras.', 'ACCESO DENEGADO');
                return;
            }
            if (!response.ok) throw new Error(result.detail || 'No se pudo comprobar el acceso.');
            if (!result.configured || !result.stream_url) {
                showMessage('Cámara pendiente de conexión', 'Configura CAMERA_STREAM_URL con la URL de video web de la cámara o de su gateway. Una URL RTSP debe convertirse a MJPEG, HLS o WebRTC para reproducirse en el navegador.', 'NO CONFIGURADA');
                note.textContent = 'Falta configurar la fuente de video web.';
                return;
            }

            const streamUrl = result.stream_url;
            const streamType = (result.stream_type || '').toLowerCase();
            const isMjpeg = streamType.includes('mjpeg') || streamType.includes('jpeg') || /\.mjpg?($|\?)/i.test(streamUrl);
            overlay.hidden = true;
            status.classList.remove('live');
            statusText.textContent = 'CONECTANDO…';
            updated.textContent = 'Fuente de video configurada';

            if (isMjpeg) {
                image.hidden = false;
                image.onerror = () => showMessage('No se pudo cargar el video', 'Verifica que la URL MJPEG esté disponible desde este navegador.', 'FUENTE NO DISPONIBLE');
                image.onload = () => {
                    status.classList.add('live');
                    statusText.textContent = 'TRANSMISIÓN ACTIVA';
                };
                image.src = streamUrl;
                note.textContent = 'Transmisión MJPEG';
                return;
            }

            video.hidden = false;
            video.onerror = () => showMessage('No se pudo reproducir el video', 'El navegador no puede reproducir esta fuente. Usa una URL HLS compatible con este navegador o una transmisión MJPEG; RTSP requiere un gateway.', 'FUENTE NO COMPATIBLE');
            video.onplaying = () => {
                status.classList.add('live');
                statusText.textContent = 'TRANSMISIÓN ACTIVA';
            };
            video.src = streamUrl;
            video.load();
            video.play().catch(() => {
                note.textContent = 'Pulsa reproducir para iniciar el video.';
            });
            note.textContent = streamType ? `Tipo de transmisión: ${streamType.toUpperCase()}` : 'Reproducción de video';
        } catch (error) {
            console.error('ERROR AL CONECTAR CON LA CÁMARA:', error);
            showMessage('No se pudo conectar', error.message || 'Comprueba la conexión con el servidor.', 'ERROR DE CONEXIÓN');
        }
    }

    document.getElementById('reloadStream').addEventListener('click', loadCamera);
    document.getElementById('fullscreenVideo').addEventListener('click', async () => {
        const player = document.getElementById('videoStage');
        try {
            if (document.fullscreenElement) await document.exitFullscreen();
            else await player.requestFullscreen();
        } catch (error) {
            console.error('NO SE PUDO ACTIVAR PANTALLA COMPLETA:', error);
        }
    });

    loadCamera();
});
