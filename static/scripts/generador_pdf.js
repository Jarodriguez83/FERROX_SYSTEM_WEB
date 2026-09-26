document.getElementById('descargarBtn').addEventListener('click', function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- 1. CAPTURA DE DATOS (IDs sincronizados con tu HTML) ---
    const finca = document.getElementById('nombreFinca').value || "SIN NOMBRE";
    const responsable = document.getElementById('nombreResponsable').value || "N/A";
    const folio = document.getElementById('folioFinca').value || "---";
    const fecha = document.getElementById('fechaReporte').value || "DD/MM/AAAA";
    const prototipo = document.getElementById('refPrototipo').value || "N/A";
    const hora = document.getElementById('horaToma').value || "--:--";
    const area = document.getElementById('hectareas').value || "0";
    const produccion = document.getElementById('produccionMaiz').value || "0";
    const temp = parseFloat(document.getElementById('tempReportada').value) || 0;
    const ph = parseFloat(document.getElementById('phReportado').value) || 0;
    const notas = document.getElementById('observaciones').value || "SIN OBSERVACIONES ADICIONALES.";

    // --- 2. ENCABEZADO CORPORATIVO ---
    doc.setFillColor(13, 71, 161); // Azul Profundo
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("INFORME TÉCNICO INTEGRAL - BIOKUAM", 105, 22, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("SISTEMA DE MONITOREO IOT PARA AGRICULTURA DE PRECISIÓN EN MAÍZ", 105, 32, { align: "center" });

    // --- 3. INFORMACIÓN GENERAL Y ESTADÍSTICAS ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DE IDENTIFICACIÓN Y PRODUCCIÓN", 105, 58, { align: "center" });
    doc.line(20, 60, 190, 60);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    // Columna 1
    doc.text(`• FINCA: ${finca.toUpperCase()}`, 20, 70);
    doc.text(`• PROPIETARIO: ${responsable.toUpperCase()}`, 20, 78);
    doc.text(`• FOLIO (ID): ${folio}`, 20, 86);
    doc.text(`• ÁREA CULTIVADA: ${area} Hectáreas`, 20, 94);
    // Columna 2
    doc.text(`• FECHA: ${fecha}`, 120, 70);
    doc.text(`• HORA MUESTREO: ${hora}`, 120, 78);
    doc.text(`• PROTOTIPO: ${prototipo}`, 120, 86);
    doc.text(`• PRODUCCIÓN EST.: ${produccion} Toneladas`, 120, 94);

    // --- 4. SECCIÓN TÉCNICA: TEMPERATURA ---
    // Lógica de consejos para temperatura
    let consejoTemp = "";
    if (temp < 15) { consejoTemp = "CONSEJO: Temperatura baja. Monitorear posible estrés radicular por frío."; }
    else if (temp > 25) { consejoTemp = "CONSEJO: Temperatura elevada. Aumentar frecuencia de riego para mitigar evaporación."; }
    else { consejoTemp = "CONSEJO: Rango térmico óptimo para el desarrollo vegetativo del maíz."; }

    doc.setFillColor(240, 240, 240);
    doc.rect(20, 105, 170, 38, 'F');
    doc.setFont("helvetica", "bold");
    doc.setTextColor(230, 81, 0); // Naranja
    doc.text(`TEMPERATURA REGISTRADA: ${temp} °C`, 25, 113);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const textoTemp = `ORIGEN: Dato obtenido mediante sensor digital DS18B20. ${consejoTemp} El agua influye en la tasa metabólica del maíz; valores entre 15°C y 22°C facilitan la absorción de nutrientes.`;
    doc.text(doc.splitTextToSize(textoTemp, 160), 25, 120);

    // --- 5. SECCIÓN TÉCNICA: pH ---
    // Lógica de consejos para pH
    let consejoPh = "";
    if (ph < 6) { consejoPh = "CONSEJO: Acidez detectada. El maíz presenta deficiencia de fósforo en suelos con pH bajo."; }
    else if (ph > 7.5) { consejoPh = "CONSEJO: Tendencia alcalina. Riesgo de bloqueo de micronutrientes (Hierro/Zinc)."; }
    else { consejoPh = "CONSEJO: pH en rango de neutralidad. Disponibilidad química ideal de fertilizantes."; }

    doc.setFillColor(240, 240, 240);
    doc.rect(20, 150, 170, 38, 'F');
    doc.setFont("helvetica", "bold");
    doc.setTextColor(13, 71, 161); // Azul
    doc.text(`NIVEL DE PH MONITOREADO: ${ph}`, 25, 158);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    const textoPh = `ORIGEN: Medición capturada con sensor analógico industrial de alta precisión. ${consejoPh} Un pH de 6.0 a 7.2 es el estándar agronómico para maximizar la calidad hídrica.`;
    doc.text(doc.splitTextToSize(textoPh, 160), 25, 165);

    // --- 6. OBSERVACIONES DE CAMPO (Texto Dinámico) ---
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("OBSERVACIONES ADICIONALES Y DIAGNÓSTICO", 105, 200, { align: "center" });
    doc.line(20, 202, 190, 202);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lineasNotas = doc.splitTextToSize(notas, 170);
    doc.text(lineasNotas, 20, 210);

    // --- 7. PIE DE PÁGINA ---
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("INFORME TÉCNICO VALIDO POR EL SISTEMA BIOKUAM. DATOS PROCESADOS VÍA THINGSPEAK IOT CLOUD.", 105, 280, { align: "center" });
    doc.text("SIMIJACA, CUNDINAMARCA - TECNOGOLOGÍA IOT.", 105, 285, { align: "center" });

    // DESCARGAR
    doc.save(`INFORME-BIOKUAM-DOC-FINCA${finca}.pdf`);
});