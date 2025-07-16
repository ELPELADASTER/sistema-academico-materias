const puppeteer = require('puppeteer');
const { obtenerMateriasConEstado } = require('./materiasService');
const { obtenerEstadisticas } = require('./estadisticasService');

/**
 * Genera un HTML con el reporte de materias para PDF
 */
function generarHTMLReporte(materias, estadisticas) {
    const fechaActual = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const materiasCompletas = [];
    
    // Agrupar materias por año
    Object.entries(materias).forEach(([categoria, materiasCategoria]) => {
        if (Array.isArray(materiasCategoria)) {
            materiasCategoria.forEach(materia => {
                materiasCompletas.push({
                    ...materia,
                    categoria: categoria.replace('_', ' ').toUpperCase()
                });
            });
        }
    });

    // Agrupar por año
    const materiasPorAnio = {};
    materiasCompletas.forEach(materia => {
        if (!materiasPorAnio[materia.anio]) {
            materiasPorAnio[materia.anio] = [];
        }
        materiasPorAnio[materia.anio].push(materia);
    });

    const getEstadoColor = (estado) => {
        switch (estado?.tipo) {
            case 'aprobada': return '#28a745';
            case 'regular': return '#ffc107';
            case 'pendiente': return '#6c757d';
            default: return '#6c757d';
        }
    };

    const getEstadoTexto = (estado) => {
        switch (estado?.tipo) {
            case 'aprobada': return `APROBADA${estado.nota ? ` (${estado.nota})` : ''}`;
            case 'regular': return 'REGULAR';
            case 'pendiente': return 'PENDIENTE';
            default: return 'PENDIENTE';
        }
    };

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reporte Académico</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f8f9fa;
                color: #333;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding: 20px;
                background: linear-gradient(135deg, #007bff, #0056b3);
                color: white;
                border-radius: 10px;
            }
            .header h1 {
                margin: 0;
                font-size: 2.5em;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .header .fecha {
                margin-top: 10px;
                font-size: 1.1em;
                opacity: 0.9;
            }
            .estadisticas {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .stat-card {
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                border-left: 5px solid #007bff;
            }
            .stat-card h3 {
                margin: 0 0 10px 0;
                color: #007bff;
                font-size: 1.2em;
            }
            .stat-card .valor {
                font-size: 2em;
                font-weight: bold;
                color: #333;
            }
            .stat-card.aprobadas { border-left-color: #28a745; }
            .stat-card.aprobadas h3 { color: #28a745; }
            .stat-card.regulares { border-left-color: #ffc107; }
            .stat-card.regulares h3 { color: #ffc107; }
            .stat-card.pendientes { border-left-color: #6c757d; }
            .stat-card.pendientes h3 { color: #6c757d; }
            .stat-card.promedio { border-left-color: #17a2b8; }
            .stat-card.promedio h3 { color: #17a2b8; }
            .anio-section {
                margin-bottom: 30px;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .anio-header {
                background: #007bff;
                color: white;
                padding: 15px 20px;
                font-size: 1.3em;
                font-weight: bold;
            }
            .materias-grid {
                padding: 20px;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 15px;
            }
            .materia-card {
                border: 2px solid #e9ecef;
                border-radius: 8px;
                padding: 15px;
                transition: all 0.3s ease;
            }
            .materia-card:hover {
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            }
            .materia-nombre {
                font-weight: bold;
                font-size: 1.1em;
                margin-bottom: 8px;
                color: #333;
            }
            .materia-numero {
                color: #6c757d;
                font-size: 0.9em;
                margin-bottom: 8px;
            }
            .estado-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.85em;
                font-weight: bold;
                color: white;
                text-transform: uppercase;
            }
            .correlativas {
                margin-top: 10px;
                font-size: 0.9em;
                color: #6c757d;
            }
            .correlativas strong {
                color: #495057;
            }
            .page-break {
                page-break-before: always;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 10px;
                color: #6c757d;
            }
            @media print {
                body { background: white; }
                .anio-section { page-break-inside: avoid; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📚 Reporte Académico</h1>
            <div class="fecha">Generado el ${fechaActual}</div>
        </div>

        <div class="estadisticas">
            <div class="stat-card">
                <h3>Total de Materias</h3>
                <div class="valor">${estadisticas.totalMaterias}</div>
            </div>
            <div class="stat-card aprobadas">
                <h3>Aprobadas</h3>
                <div class="valor">${estadisticas.aprobadas}</div>
            </div>
            <div class="stat-card regulares">
                <h3>Regulares</h3>
                <div class="valor">${estadisticas.regulares}</div>
            </div>
            <div class="stat-card pendientes">
                <h3>Pendientes</h3>
                <div class="valor">${estadisticas.pendientes}</div>
            </div>
            <div class="stat-card promedio">
                <h3>Promedio</h3>
                <div class="valor">${estadisticas.promedio}</div>
            </div>
            <div class="stat-card">
                <h3>Progreso</h3>
                <div class="valor">${estadisticas.porcentajeCompletado}%</div>
            </div>
        </div>

        ${Object.entries(materiasPorAnio).map(([anio, materiasAnio]) => `
            <div class="anio-section">
                <div class="anio-header">
                    📅 ${anio}° Año (${materiasAnio.length} materias)
                </div>
                <div class="materias-grid">
                    ${materiasAnio.map(materia => `
                        <div class="materia-card">
                            <div class="materia-numero">Materia ${materia.numero || 'Electiva'}</div>
                            <div class="materia-nombre">${materia.materia}</div>
                            <div class="estado-badge" style="background-color: ${getEstadoColor(materia.estado)}">
                                ${getEstadoTexto(materia.estado)}
                            </div>
                            ${materia.regular && materia.regular.length > 0 ? `
                                <div class="correlativas">
                                    <strong>Regulares requeridas:</strong> ${materia.regular.join(', ')}
                                </div>
                            ` : ''}
                            ${materia.aprobada && materia.aprobada.length > 0 ? `
                                <div class="correlativas">
                                    <strong>Aprobadas requeridas:</strong> ${materia.aprobada.join(', ')}
                                </div>
                            ` : ''}
                            ${materia.creditos ? `
                                <div class="correlativas">
                                    <strong>Créditos:</strong> ${materia.creditos}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}

        <div class="footer">
            <p>📊 Reporte generado automáticamente por el Sistema de Gestión de Materias</p>
            <p>🎓 ¡Sigue adelante con tus estudios!</p>
        </div>
    </body>
    </html>
    `;
}

/**
 * Genera un PDF con el reporte de materias
 */
async function generarPDFReporte() {
    let browser;
    try {
        // Obtener datos necesarios
        const materias = await obtenerMateriasConEstado();
        const estadisticas = await obtenerEstadisticas();

        // Generar HTML
        const html = generarHTMLReporte(materias, estadisticas);

        // Configurar Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        
        // Configurar el contenido
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Generar PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            }
        });

        return pdfBuffer;

    } catch (error) {
        console.error('Error generando PDF:', error);
        throw new Error('Error generando reporte PDF');
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = {
    generarPDFReporte
};
