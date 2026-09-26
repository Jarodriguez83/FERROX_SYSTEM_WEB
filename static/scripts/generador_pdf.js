document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-reporte');
    const button = document.getElementById('descargarBtn');
    if (!form || !button) return;

    const field = (id, fallback = 'Sin dato') => {
        const value = document.getElementById(id)?.value?.trim();
        return value || fallback;
    };
    const metricValue = (inputId, liveId) => {
        const enteredValue = document.getElementById(inputId)?.value?.trim();
        if (enteredValue) return enteredValue;
        const liveValue = document.getElementById(liveId)?.textContent?.trim();
        return liveValue && /^\d+$/.test(liveValue) ? liveValue : 'Sin dato';
    };

    button.addEventListener('click', () => {
        if (!form.reportValidity()) return;
        if (!window.jspdf?.jsPDF) {
            alert('No se pudo cargar el generador PDF. Revisa tu conexión e inténtalo de nuevo.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const left = 18;
        const usableWidth = pageWidth - left * 2;
        let y = 53;

        const reportData = {
            location: field('ubicacionEvaluacion'),
            responsible: field('responsableEvaluacion'),
            date: field('fechaEvaluacion'),
            startTime: field('horaEvaluacion'),
            duration: field('duracionEvaluacion', 'No especificada'),
            camera: field('idCamara', 'No especificada'),
            model: field('modeloIA', 'No especificado'),
            people: metricValue('personasEvaluacion', 'peopleCount'),
            vehicles: metricValue('vehiculosEvaluacion', 'vehiclesCount'),
            cameraStatus: field('estadoCamara'),
            detectionStatus: field('estadoDeteccion'),
            conditions: field('condicionesEvaluacion', 'Sin observaciones.'),
            findings: field('observacionesEvaluacion', 'Sin observaciones.'),
            recommendations: field('recomendacionesEvaluacion', 'Sin recomendaciones registradas.'),
            conclusion: field('conclusionEvaluacion', 'Sin conclusión documentada.'),
            aiStatus: document.getElementById('aiStatusText')?.textContent?.trim() || 'Estado no disponible',
        };

        const generatedAt = new Date();
        const reportId = `FX-${generatedAt.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;

        function addPageHeader() {
            doc.setFillColor(16, 40, 61);
            doc.rect(0, 0, pageWidth, 37, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(19);
            doc.text('FERROX SYSTEM', left, 16);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text('INFORME DE EVALUACION DEL SISTEMA EN EL CRUCE', left, 25);
            doc.setFontSize(8);
            doc.text(`ID ${reportId}`, pageWidth - left, 16, { align: 'right' });
            doc.text(`GENERADO: ${generatedAt.toLocaleString('es-CO')}`, pageWidth - left, 25, { align: 'right' });
            doc.setTextColor(30, 52, 70);
        }

        function ensureSpace(height) {
            if (y + height > pageHeight - 20) {
                doc.addPage();
                addPageHeader();
                y = 48;
            }
        }

        function section(title) {
            ensureSpace(17);
            doc.setFillColor(232, 240, 246);
            doc.roundedRect(left, y, usableWidth, 9, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(21, 94, 145);
            doc.text(title.toUpperCase(), left + 4, y + 6.2);
            doc.setTextColor(30, 52, 70);
            y += 14;
        }

        function textBlock(label, value) {
            const valueLines = doc.splitTextToSize(String(value), usableWidth - 3);
            ensureSpace(12);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(label, left, y);
            y += 4.5;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            let offset = 0;
            while (offset < valueLines.length) {
                const availableLines = Math.floor((pageHeight - 20 - y) / 4.7);
                if (availableLines < 1) {
                    doc.addPage();
                    addPageHeader();
                    y = 48;
                    continue;
                }
                const chunk = valueLines.slice(offset, offset + availableLines);
                doc.text(chunk, left, y);
                y += chunk.length * 4.7;
                offset += chunk.length;
                if (offset < valueLines.length) {
                    doc.addPage();
                    addPageHeader();
                    y = 48;
                }
            }
            y += 4;
        }

        function metricBox(x, label, value, color) {
            const boxWidth = (usableWidth - 8) / 2;
            doc.setDrawColor(218, 228, 236);
            doc.setFillColor(250, 252, 253);
            doc.roundedRect(x, y, boxWidth, 25, 3, 3, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(112, 131, 148);
            doc.text(label.toUpperCase(), x + 5, y + 7);
            doc.setFontSize(16);
            doc.setTextColor(...color);
            doc.text(value, x + 5, y + 19);
            doc.setTextColor(30, 52, 70);
        }

        addPageHeader();

        section('1. IDENTIFICACIÓN DE LA EVALUACION');
        textBlock('LUGAR DE ESTUDIO', reportData.location);
        textBlock('RESPONSABLE DE LA EVALUACIÓN', reportData.responsible);
        textBlock('FECHA Y HORA', `${reportData.date} - ${reportData.startTime}`);
        textBlock('DURACIÓN OBSERVADA', `${reportData.duration} minutos`);
        textBlock('CÁMARA O PUNTO EVALUADO', reportData.camera);
        textBlock('MODELO O CONFIGURACIÓN DE IA', reportData.model);

        section('2. CONTEOS APROXIMADOS OBSERVADOS');
        ensureSpace(31);
        metricBox(left, 'PERSONAS PRESENTES', reportData.people, [21, 94, 145]);
        metricBox(left + (usableWidth + 8) / 2, 'VEHÍCULOS EN TRÁNSITO', reportData.vehicles, [224, 126, 29]);
        y += 32;
        textBlock('ESTADO DE CONEXIÓN IA AL GENERAR EL INFORME');

        section('3. REVISIÓN FUNCIONAL');
        textBlock('ESTADO DE LA CÁMARA Y TRANSMISIÓN', reportData.cameraStatus);
        textBlock('COMPORTAMIENTO DE LA DETECCIÓN DE LA IA', reportData.detectionStatus);
        textBlock('CONDICIONES DEL LUGAR DURANTE LA PRUEBA', reportData.conditions);
        textBlock('HALLAZGOS Y OBSERVACIONES', reportData.findings);

        section('4. ANÁLISIS Y SEGUIMIENTO');
        textBlock('CONCLUSIÓN DE LA EVALUACIÓN', reportData.conclusion);
        textBlock('RECOMENDACIONES Y ACCIONES DE SEGUIMIENTO', reportData.recommendations);

        ensureSpace(20);
        y += 2;
        doc.setDrawColor(220, 229, 236);
        doc.line(left, y, pageWidth - left, y);
        y += 6;
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 119, 134);
        const disclaimer = 'Los conteos de vision artificial son estimaciones y pueden variar por iluminacion, oclusion, encuadre y condiciones de la escena. Este informe registra una observacion de campo; no reemplaza los protocolos de seguridad ferroviaria.';
        doc.text(doc.splitTextToSize(disclaimer, usableWidth), left, y);

        const safeLocation = reportData.location
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cruce';
        doc.save(`FERROX-INFORME-${safeLocation}-${reportData.date}.pdf`);
    });
});
