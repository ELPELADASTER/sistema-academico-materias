const express = require('express');
const { obtenerMateriasConEstado, obtenerMateriasPorAnio } = require('../services/materiasService');

const router = express.Router();

// Ruta para obtener todas las materias con su estado
router.get('/', async (req, res) => {
    try {
        const materiasConEstado = await obtenerMateriasConEstado();
        res.json(materiasConEstado);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo materias' });
    }
});

// Ruta para obtener materias agrupadas por año
router.get('/por-anio', async (req, res) => {
    try {
        const materiasPorAnio = await obtenerMateriasPorAnio();
        res.json(materiasPorAnio);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo materias por año' });
    }
});

module.exports = router;
