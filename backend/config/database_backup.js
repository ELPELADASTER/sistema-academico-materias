const fs = require('fs').promises;
const path = require('path');

// Configuración de rutas de archivos
const MATERIAS_FILE = path.join(__dirname, '..', 'materias.json');
const ESTADO_FILE = path.join(__dirname, '..', 'estado_materias.json');

/**
 * Función para leer las materias base
 */
async function leerMaterias() {
    try {
        const data = await fs.readFile(MATERIAS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error leyendo materias:', error);
        return { materias_obligatorias: [], materias_electivas: [] };
    }
}

/**
 * Función para leer el estado de las materias del estudiante
 */
async function leerEstadoMaterias() {
    try {
        const data = await fs.readFile(ESTADO_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe, crear uno vacío
        return {};
    }
}

/**
 * Función para guardar el estado de las materias
 */
async function guardarEstadoMaterias(estado) {
    try {
        await fs.writeFile(ESTADO_FILE, JSON.stringify(estado, null, 2));
        return true;
    } catch (error) {
        console.error('Error guardando estado:', error);
        return false;
    }
}

module.exports = {
    leerMaterias,
    leerEstadoMaterias,
    guardarEstadoMaterias
};
