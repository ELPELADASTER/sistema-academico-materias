const express = require('express');
const { obtenerEstadisticas } = require('../services/estadisticasService');

const router = express.Router();

// Ruta para obtener estadísticas
router.get('/', async (req, res) => {
    try {
        const estadisticas = await obtenerEstadisticas();
        res.json(estadisticas);
    } catch (error) {
        res.status(500).json({ error: 'Error calculando estadísticas' });
    }
});

module.exports = router;
