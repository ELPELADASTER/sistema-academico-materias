const { leerEstadoMaterias, guardarEstadoMaterias } = require('../config/database');
const { generarPDFReporte } = require('./pdfService');

/**
 * Servicio para exportar datos del estado de las materias en JSON
 */
async function exportarDatos() {
    return await leerEstadoMaterias();
}

/**
 * Servicio para exportar reporte en PDF
 */
async function exportarPDF() {
    try {
        const pdfBuffer = await generarPDFReporte();
        return pdfBuffer;
    } catch (error) {
        console.error('Error generando PDF:', error);
        throw new Error('Error generando reporte PDF');
    }
}

/**
 * Servicio para importar datos del estado de las materias
 */
async function importarDatos(nuevoEstado) {
    const guardado = await guardarEstadoMaterias(nuevoEstado);
    
    if (!guardado) {
        throw new Error('Error importando datos');
    }
    
    return { mensaje: 'Datos importados correctamente' };
}

module.exports = {
    exportarDatos,
    exportarPDF,
    importarDatos
};
