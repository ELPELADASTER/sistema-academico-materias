const { leerMaterias, leerEstadoMaterias } = require('../config/database');
const { estaDesbloqueada } = require('../utils/validators');

/**
 * Servicio para obtener todas las materias con su estado
 */
async function obtenerMateriasConEstado() {
    const materias = await leerMaterias();
    const estado = await leerEstadoMaterias();
    
    // Combinar materias con estado
    const materiasConEstado = {
        materias_obligatorias: materias.materias_obligatorias.map(materia => ({
            ...materia,
            estado: estado[materia.numero] || { tipo: 'pendiente', nota: null }
        })),
        materias_electivas: materias.materias_electivas.map((materia, index) => ({
            ...materia,
            id: `electiva_${index}`,
            estado: estado[`electiva_${index}`] || { tipo: 'pendiente', nota: null }
        }))
    };

    return materiasConEstado;
}

/**
 * Servicio para obtener materias agrupadas por año
 */
async function obtenerMateriasPorAnio() {
    const materias = await leerMaterias();
    const estado = await leerEstadoMaterias();
    
    const materiasPorAnio = {};
    
    // Agrupar materias obligatorias
    materias.materias_obligatorias.forEach(materia => {
        if (!materiasPorAnio[materia.anio]) {
            materiasPorAnio[materia.anio] = {
                obligatorias: [],
                electivas: []
            };
        }
        
        const desbloqueada = estaDesbloqueada(materia, estado, false);
        materiasPorAnio[materia.anio].obligatorias.push({
            ...materia,
            estado: estado[materia.numero] || { tipo: 'pendiente', nota: null },
            desbloqueada
        });
    });

    // Agrupar materias electivas
    materias.materias_electivas.forEach((materia, index) => {
        if (!materiasPorAnio[materia.anio]) {
            materiasPorAnio[materia.anio] = {
                obligatorias: [],
                electivas: []
            };
        }
        
        const id = `electiva_${index}`;
        const desbloqueada = estaDesbloqueada(materia, estado, true);
        materiasPorAnio[materia.anio].electivas.push({
            ...materia,
            id,
            estado: estado[id] || { tipo: 'pendiente', nota: null },
            desbloqueada
        });
    });

    return materiasPorAnio;
}

/**
 * Buscar una materia por ID
 */
async function buscarMateriaPorId(id) {
    const materias = await leerMaterias();
    
    let materia = null;
    if (id.startsWith('electiva_')) {
        const index = parseInt(id.split('_')[1]);
        materia = materias.materias_electivas[index];
    } else {
        materia = materias.materias_obligatorias.find(m => m.numero.toString() === id);
    }
    
    return { materia, materias };
}

module.exports = {
    obtenerMateriasConEstado,
    obtenerMateriasPorAnio,
    buscarMateriaPorId
};
