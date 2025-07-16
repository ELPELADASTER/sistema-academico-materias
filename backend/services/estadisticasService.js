const { leerMaterias, leerEstadoMaterias } = require('../config/database');
const { calcularEstadisticas } = require('../utils/validators');

/**
 * Servicio para obtener estadísticas del progreso académico
 */
async function obtenerEstadisticas() {
    const materias = await leerMaterias();
    const estado = await leerEstadoMaterias();
    
    return calcularEstadisticas(materias, estado);
}

module.exports = {
    obtenerEstadisticas
};
