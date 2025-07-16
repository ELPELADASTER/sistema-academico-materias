const express = require('express');
const { actualizarEstadoMateria, verificarCorrelatividades, obtenerCorrelatividasDetalladas } = require('../services/estadoService');

const router = express.Router();

// Ruta para actualizar el estado de una materia
router.put('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, nota } = req.body;

        const respuesta = await actualizarEstadoMateria(id, tipo, nota);
        res.json(respuesta);
    } catch (error) {
        if (error.message === 'Tipo de estado inválido' || 
            error.message === 'La nota debe estar entre 1 y 10 para materias aprobadas') {
            res.status(400).json({ error: error.message });
        } else if (error.message === 'Materia no encontrada') {
            res.status(404).json({ error: error.message });
        } else if (error.message.startsWith('No puedes modificar esta materia')) {
            res.status(423).json({ 
                error: error.message,
                tipo: 'materia_bloqueada'
            });
        } else {
            res.status(500).json({ error: 'Error actualizando estado' });
        }
    }
});

// Ruta para verificar correlatividades
router.get('/:id/correlatividades', async (req, res) => {
    try {
        const { id } = req.params;
        const correlatividades = await verificarCorrelatividades(id);
        res.json(correlatividades);
    } catch (error) {
        if (error.message === 'Materia no encontrada') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Error verificando correlatividades' });
        }
    }
});

module.exports = router;
