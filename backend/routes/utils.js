const express = require('express');
const { obtenerCorrelatividasDetalladas } = require('../services/estadoService');
const { exportarDatos, exportarPDF, importarDatos } = require('../services/importExportService');

const router = express.Router();

// Ruta para obtener información detallada de correlatividades
router.get('/correlatividades/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const correlatividades = await obtenerCorrelatividasDetalladas(id);
        res.json(correlatividades);
    } catch (error) {
        if (error.message === 'Materia no encontrada') {
            res.status(404).json({ success: false, error: error.message });
        } else {
            res.status(500).json({ success: false, error: 'Error obteniendo correlatividades' });
        }
    }
});

// Ruta para exportar datos en JSON
router.get('/exportar', async (req, res) => {
    try {
        const datos = await exportarDatos();
        res.json(datos);
    } catch (error) {
        res.status(500).json({ error: 'Error exportando datos' });
    }
});

// Ruta para exportar reporte en PDF
router.get('/exportar-pdf', async (req, res) => {
    try {
        const pdfBuffer = await exportarPDF();
        
        // Generar nombre de archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `reporte_academico_${fecha}.pdf`;
        
        // Configurar headers para descarga de PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        // Enviar el PDF
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        res.status(500).json({ error: 'Error generando reporte PDF' });
    }
});

// Ruta para importar datos
router.post('/importar', async (req, res) => {
    try {
        const nuevoEstado = req.body;
        const resultado = await importarDatos(nuevoEstado);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
