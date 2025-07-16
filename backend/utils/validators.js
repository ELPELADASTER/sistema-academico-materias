/**
 * Función para obtener nombre de materia por número
 */
function obtenerNombreMateria(numero, materias) {
    const materia = materias.materias_obligatorias.find(m => m.numero === numero);
    return materia ? materia.materia : `Materia ${numero}`;
}

/**
 * Función para verificar si una materia está desbloqueada
 */
function estaDesbloqueada(materia, estado, esElectiva = false) {
    // Las materias sin correlatividades están siempre desbloqueadas
    const correlativasRegulares = materia.regular || [];
    const correlativasAprobadas = materia.aprobada || [];
    
    if (correlativasRegulares.length === 0 && correlativasAprobadas.length === 0) {
        return true;
    }
    
    // Verificar correlatividades regulares (deben estar regulares o aprobadas)
    const correlativasRegularesOk = correlativasRegulares.every(numeroMateria => {
        const estadoCorrelativa = estado[numeroMateria];
        return estadoCorrelativa && ['regular', 'aprobada'].includes(estadoCorrelativa.tipo);
    });
    
    // Verificar correlatividades aprobadas (deben estar aprobadas)
    const correlativasAprobadasOk = correlativasAprobadas.every(numeroMateria => {
        const estadoCorrelativa = estado[numeroMateria];
        return estadoCorrelativa && estadoCorrelativa.tipo === 'aprobada';
    });
    
    return correlativasRegularesOk && correlativasAprobadasOk;
}

/**
 * Valida el tipo de estado de una materia
 */
function validarTipoEstado(tipo) {
    return ['pendiente', 'regular', 'aprobada'].includes(tipo);
}

/**
 * Valida la nota de una materia aprobada
 */
function validarNota(nota, tipo) {
    if (tipo === 'aprobada') {
        return nota !== null && nota !== undefined && nota >= 1 && nota <= 10;
    }
    return true;
}

/**
 * Calcula estadísticas completas del progreso académico
 */
function calcularEstadisticas(materias, estado) {
    const totalObligatorias = materias.materias_obligatorias.length;
    const totalElectivas = materias.materias_electivas.length;
    const total = totalObligatorias + totalElectivas;
    
    let regulares = 0;
    let aprobadas = 0;
    let pendientes = 0;
    let sumaNotas = 0;
    let materiasConNota = 0;
    let creditosElectivasObtenidos = 0;
    let totalCreditosElectivas = 0;

    // Contar estados de materias obligatorias
    materias.materias_obligatorias.forEach(materia => {
        const estadoMateria = estado[materia.numero] || { tipo: 'pendiente' };
        switch (estadoMateria.tipo) {
            case 'regular':
                regulares++;
                break;
            case 'aprobada':
                aprobadas++;
                if (estadoMateria.nota) {
                    sumaNotas += estadoMateria.nota;
                    materiasConNota++;
                }
                break;
            default:
                pendientes++;
        }
    });

    // Contar estados de materias electivas y calcular créditos
    materias.materias_electivas.forEach((materia, index) => {
        const id = `electiva_${index}`;
        const estadoMateria = estado[id] || { tipo: 'pendiente' };
        const creditos = parseInt(materia.creditos) || 0;
        
        totalCreditosElectivas += creditos;
        
        switch (estadoMateria.tipo) {
            case 'regular':
                regulares++;
                creditosElectivasObtenidos += creditos;
                break;
            case 'aprobada':
                aprobadas++;
                creditosElectivasObtenidos += creditos;
                if (estadoMateria.nota) {
                    sumaNotas += estadoMateria.nota;
                    materiasConNota++;
                }
                break;
            default:
                pendientes++;
        }
    });

    const promedio = materiasConNota > 0 ? (sumaNotas / materiasConNota).toFixed(2) : 0;

    return {
        total,
        pendientes,
        regulares,
        aprobadas,
        promedio: parseFloat(promedio),
        porcentajeCompletado: ((aprobadas / total) * 100).toFixed(1),
        creditosElectivas: {
            obtenidos: creditosElectivasObtenidos,
            disponibles: totalCreditosElectivas
        }
    };
}

module.exports = {
    obtenerNombreMateria,
    estaDesbloqueada,
    validarTipoEstado,
    validarNota,
    calcularEstadisticas
};
