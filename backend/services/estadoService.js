const { leerMaterias, leerEstadoMaterias, guardarEstadoMaterias } = require('../config/database');
const { validarTipoEstado, validarNota, estaDesbloqueada, obtenerNombreMateria } = require('../utils/validators');
const { buscarMateriaPorId } = require('./materiasService');

/**
 * Servicio para actualizar el estado de una materia
 */
async function actualizarEstadoMateria(id, tipo, nota) {
    // Validar tipo de estado
    if (!validarTipoEstado(tipo)) {
        throw new Error('Tipo de estado inválido');
    }

    // Validar nota si es aprobada
    if (!validarNota(nota, tipo)) {
        throw new Error('La nota debe estar entre 1 y 10 para materias aprobadas');
    }

    const { materia, materias } = await buscarMateriaPorId(id);
    const estado = await leerEstadoMaterias();
    
    if (!materia) {
        throw new Error('Materia no encontrada');
    }
    
    // Verificar si la materia está desbloqueada
    const desbloqueada = estaDesbloqueada(materia, estado, id.startsWith('electiva_'));
    
    // Si no está desbloqueada, bloquear completamente la operación
    if (!desbloqueada) {
        const correlativasInfo = await obtenerCorrelatividasDetalladas(id);
        const correlativasPendientes = correlativasInfo.correlatividades
            .filter(c => !c.cumplida)
            .map(c => `${c.nombre} (requiere ${c.estadoRequerido})`)
            .join(', ');
        
        throw new Error(`No puedes modificar esta materia. Debes completar primero: ${correlativasPendientes}`);
    }
    
    estado[id] = {
        tipo,
        nota: tipo === 'aprobada' ? parseFloat(nota) : null,
        fechaActualizacion: new Date().toISOString()
    };

    const guardado = await guardarEstadoMaterias(estado);
    
    if (!guardado) {
        throw new Error('Error guardando el estado');
    }
    
    return { 
        mensaje: 'Estado actualizado correctamente', 
        estado: estado[id]
    };
}

/**
 * Servicio para verificar correlatividades de una materia
 */
async function verificarCorrelatividades(id) {
    const { materia, materias } = await buscarMateriaPorId(id);
    const estado = await leerEstadoMaterias();
    
    if (!materia) {
        throw new Error('Materia no encontrada');
    }

    // Verificar correlatividades regulares
    const correlativasRegulares = materia.regular || [];
    const correlativasAprobadas = materia.aprobada || [];
    
    const correlativasRegularesOk = correlativasRegulares.every(numeroMateria => {
        const estadoCorrelativa = estado[numeroMateria];
        return estadoCorrelativa && ['regular', 'aprobada'].includes(estadoCorrelativa.tipo);
    });
    
    const correlativasAprobadasOk = correlativasAprobadas.every(numeroMateria => {
        const estadoCorrelativa = estado[numeroMateria];
        return estadoCorrelativa && estadoCorrelativa.tipo === 'aprobada';
    });
    
    const puedeRendir = correlativasRegularesOk && correlativasAprobadasOk;
    
    // Convertir números a nombres de materias
    const nombresRegulares = correlativasRegulares.map(num => obtenerNombreMateria(num, materias));
    const nombresAprobadas = correlativasAprobadas.map(num => obtenerNombreMateria(num, materias));
    
    return {
        puedeRendir,
        correlativasRegulares: {
            requeridas: nombresRegulares,
            cumplidas: correlativasRegularesOk
        },
        correlativasAprobadas: {
            requeridas: nombresAprobadas,
            cumplidas: correlativasAprobadasOk
        }
    };
}

/**
 * Servicio para obtener información detallada de correlatividades
 */
async function obtenerCorrelatividasDetalladas(id) {
    const { materia, materias } = await buscarMateriaPorId(id);
    const estado = await leerEstadoMaterias();
    
    if (!materia) {
        throw new Error('Materia no encontrada');
    }

    // Obtener correlatividades detalladas
    const correlativasRegulares = materia.regular || [];
    const correlativasAprobadas = materia.aprobada || [];
    
    const correlatividades = [];
    
    // Procesar correlatividades regulares
    correlativasRegulares.forEach(numeroMateria => {
        const materiaCorrelativa = materias.materias_obligatorias.find(m => m.numero === numeroMateria);
        const estadoCorrelativa = estado[numeroMateria];
        const cumplida = estadoCorrelativa && ['regular', 'aprobada'].includes(estadoCorrelativa.tipo);
        
        correlatividades.push({
            numero: numeroMateria,
            nombre: materiaCorrelativa ? materiaCorrelativa.materia : `Materia ${numeroMateria}`,
            estadoRequerido: 'regular',
            estadoActual: estadoCorrelativa ? estadoCorrelativa.tipo : 'pendiente',
            cumplida
        });
    });
    
    // Procesar correlatividades aprobadas
    correlativasAprobadas.forEach(numeroMateria => {
        const materiaCorrelativa = materias.materias_obligatorias.find(m => m.numero === numeroMateria);
        const estadoCorrelativa = estado[numeroMateria];
        const cumplida = estadoCorrelativa && estadoCorrelativa.tipo === 'aprobada';
        
        correlatividades.push({
            numero: numeroMateria,
            nombre: materiaCorrelativa ? materiaCorrelativa.materia : `Materia ${numeroMateria}`,
            estadoRequerido: 'aprobada',
            estadoActual: estadoCorrelativa ? estadoCorrelativa.tipo : 'pendiente',
            cumplida
        });
    });
    
    return {
        success: true,
        correlatividades
    };
}

module.exports = {
    actualizarEstadoMateria,
    verificarCorrelatividades,
    obtenerCorrelatividasDetalladas
};
