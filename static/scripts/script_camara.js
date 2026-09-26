document.addEventListener('DOMContentLoaded', () => {
    const status = document.getElementById('cameraStatus');
    const statusText = document.getElementById('cameraStatusText');
    const overlay = document.getElementById('videoOverlay');
    const overlayTitle = document.getElementById('overlayTitle');
    const overlayMessage = document.getElementById('overlayMessage');
    const image = document.getElementById('cameraImage');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');
    const video = document.getElementById('cameraVideo');
    const updated = document.getElementById('videoUpdated');
    const note = document.getElementById('streamNote');
    const usuarioId = localStorage.getItem('usuario_id_biokuam');
    const accessToken = localStorage.getItem('access_token_biokuam');
    let streamController;

    function findJpegEnd(bytes, from) {
        for (let index = from; index < bytes.length - 1; index += 1) {
            if (bytes[index] === 0xff && bytes[index + 1] === 0xd9) return index;
        }
        return -1;
    }

    function showMessage(title, message, label = 'SIN TRANSMISIÓN') {
        streamController?.abort();
        overlay.hidden = false;
        overlayTitle.textContent = title;
        overlayMessage.textContent = message;
        status.classList.remove('live');
        statusText.textContent = label;
        image.hidden = true;
        canvas.hidden = true;
        video.hidden = true;
        video.pause();
        image.removeAttribute('src');
        video.removeAttribute('src');
    }

    async function renderMjpeg(streamUrl, token) {
        streamController?.abort();
        streamController = new AbortController();
        const response = await fetch(streamUrl, {
            cache: 'no-store',
            headers: { Authorization: `Bearer ${token}` },
            signal: streamController.signal,
        });
        if (!response.ok || !response.body) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.detail || 'No se pudo abrir la transmisión.');
        }

        image.hidden = true;
        canvas.hidden = false;
        video.hidden = true;
        note.textContent = 'Conectado a la cámara A9 V720 · MJPEG';
        const reader = response.body.getReader();
        let pending = new Uint8Array(0);
        let receivedFrame = false;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const combined = new Uint8Array(pending.length + value.length);
            combined.set(pending);
            combined.set(value, pending.length);
            pending = combined;

            let start = pending.indexOf(0xff);
            while (start >= 0 && pending[start + 1] !== 0xd8) start = pending.indexOf(0xff, start + 1);
            const end = start < 0 ? -1 : findJpegEnd(pending, start + 2);
            if (start >= 0 && end >= 0) {
                const jpeg = pending.slice(start, end + 2);
                pending = pending.slice(end + 2);
                if (jpeg.length <= 4) continue;
                const bitmap = await createImageBitmap(new Blob([jpeg], { type: 'image/jpeg' }));
                canvas.width = bitmap.height;
                canvas.height = bitmap.width;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.save();
                context.translate(canvas.width, 0);
                context.rotate(Math.PI / 2);
                context.drawImage(bitmap, 0, 0);
                context.restore();
                bitmap.close();
                if (!receivedFrame) {
                    receivedFrame = true;
                    overlay.hidden = true;
                    status.classList.add('live');
                    statusText.textContent = 'TRANSMISIÓN ACTIVA';
                    updated.textContent = 'Recibiendo video en tiempo real';
                }
            } else if (start > 0) {
                pending = pending.slice(start);
            } else if (pending.length > 2 * 1024 * 1024) {
                pending = pending.slice(-1024);
            }
        }
        if (!streamController.signal.aborted) throw new Error('La transmisión se cerró.');
    }

    async function loadCamera() {
        if (!usuarioId || !accessToken) {
            showMessage('Inicia sesión', 'Debes iniciar sesión con una cuenta administradora para consultar esta cámara.', 'SIN SESIÓN');
            return;
        }

        status.classList.remove('live');
        statusText.textContent = 'Verificando acceso…';
        updated.textContent = 'Conectando con la cámara A9 V720';
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
            if (response.status === 401) {
                showMessage('Sesión expirada', 'Inicia sesión nuevamente con una cuenta administradora.', 'SESIÓN EXPIRADA');
                return;
            }
            if (!response.ok || !result.configured) throw new Error(result.detail || 'No se pudo comprobar el acceso.');

            overlay.hidden = false;
            overlayTitle.textContent = 'Conectando con la cámara';
            overlayMessage.textContent = result.camera?.detail || 'Esperando el primer frame de video…';
            statusText.textContent = 'CONECTANDO…';
            await renderMjpeg(result.stream_url, accessToken);
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('ERROR AL CONECTAR CON LA CÁMARA:', error);
            showMessage('No se pudo conectar', error.message || 'Comprueba la conexión con la cámara.', 'ERROR DE CONEXIÓN');
            note.textContent = 'Revisa que el servidor tenga acceso a la red Wi-Fi de la cámara.';
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
