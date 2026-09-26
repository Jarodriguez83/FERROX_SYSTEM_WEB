document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById('aiStatusText');
    const peopleCount = document.getElementById('peopleCount');
    const vehiclesCount = document.getElementById('vehiclesCount');
    const peopleUpdated = document.getElementById('peopleUpdated');
    const vehiclesUpdated = document.getElementById('vehiclesUpdated');
    const peopleInput = document.getElementById('personasEvaluacion');
    const vehiclesInput = document.getElementById('vehiculosEvaluacion');

    [peopleInput, vehiclesInput].forEach((input) => {
        input?.addEventListener('input', () => { input.dataset.manual = 'true'; });
    });

    function updateCount(display, input, value) {
        if (!Number.isInteger(value) || value < 0) return;
        display.textContent = String(value);
        if (input && input.dataset.manual !== 'true' && document.activeElement !== input) {
            input.value = String(value);
        }
    }

    async function refreshCounts() {
        try {
            const response = await fetch('/api/monitoreo/conteos', { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (!data.connected) {
                statusText.textContent = 'ESPERANDO CONEXIÓN CON LA CÁMARA 🔴';
            } else if (!data.model_ready) {
                statusText.textContent = 'CÁMARA ACTIVA · IA NO DISPONIBLE 🔴';
            } else {
                statusText.textContent = 'IA ACTIVA · LECTURA EN TIEMPO REAL 🟢';
            }

            updateCount(peopleCount, peopleInput, data.people_count);
            updateCount(vehiclesCount, vehiclesInput, data.vehicle_count);
            if (data.updated_at) {
                const time = new Intl.DateTimeFormat('es-CO', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                }).format(new Date(data.updated_at));
                peopleUpdated.textContent = time;
                vehiclesUpdated.textContent = time;
            }
        } catch (error) {
            console.error('NO SE PUDIERON ACTUALIZAR LOS CONTEOS:', error);
            statusText.textContent = 'SIN CONEXIÓN CON EL SERVIDOR 🔴';
        }
    }

    refreshCounts();
    window.setInterval(refreshCounts, 1000);
});
