const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta del archivo de materias
const MATERIAS_FILE = path.join(__dirname, 'materias.json');
const ESTADO_FILE = path.join(__dirname, 'estado_materias.json');

// Función para leer las materias base
async function leerMaterias() {
    try {
        const data = await fs.readFile(MATERIAS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error leyendo materias:', error);
        return { materias_obligatorias: [], materias_electivas: [] };
    }
}

// Función para leer el estado de las materias del estudiante
async function leerEstadoMaterias() {
    try {
        const data = await fs.readFile(ESTADO_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe, crear uno vacío
        return {};
    }
}

// Función para guardar el estado de las materias
async function guardarEstadoMaterias(estado) {
    try {
        await fs.writeFile(ESTADO_FILE, JSON.stringify(estado, null, 2));
        return true;
    } catch (error) {
        console.error('Error guardando estado:', error);
        return false;
    }
}

// Ruta para obtener todas las materias con su estado
app.get('/api/materias', async (req, res) => {
    try {
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

        res.json(materiasConEstado);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo materias' });
    }
});

// Ruta para obtener materias agrupadas por año
app.get('/api/materias/por-anio', async (req, res) => {
    try {
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

        res.json(materiasPorAnio);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo materias por año' });
    }
});

// Ruta para actualizar el estado de una materia
app.put('/api/materias/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, nota, forzar } = req.body;

        // Validar tipo de estado
        if (!['pendiente', 'regular', 'aprobada'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de estado inválido' });
        }

        // Validar nota si es aprobada
        if (tipo === 'aprobada' && (nota === null || nota === undefined || nota < 1 || nota > 10)) {
            return res.status(400).json({ error: 'La nota debe estar entre 1 y 10 para materias aprobadas' });
        }

        const materias = await leerMaterias();
        const estado = await leerEstadoMaterias();
        
        // Buscar la materia para verificar si está desbloqueada
        let materia = null;
        if (id.startsWith('electiva_')) {
            const index = parseInt(id.split('_')[1]);
            materia = materias.materias_electivas[index];
        } else {
            materia = materias.materias_obligatorias.find(m => m.numero.toString() === id);
        }
        
        if (!materia) {
            return res.status(404).json({ error: 'Materia no encontrada' });
        }
        
        // Verificar si la materia está desbloqueada
        const desbloqueada = estaDesbloqueada(materia, estado, id.startsWith('electiva_'));
        let advertencia = null;
        
        // Si no está desbloqueada y no se fuerza, mostrar advertencia pero permitir edición
        if (!desbloqueada) {
            advertencia = 'Atención: Esta materia tiene correlatividades pendientes. Asegúrate de completar los requisitos antes del examen.';
        }
        
        estado[id] = {
            tipo,
            nota: tipo === 'aprobada' ? parseFloat(nota) : null,
            fechaActualizacion: new Date().toISOString(),
            editadaConBloqueo: !desbloqueada // Marcar si fue editada estando bloqueada
        };

        const guardado = await guardarEstadoMaterias(estado);
        
        if (guardado) {
            const respuesta = { 
                mensaje: 'Estado actualizado correctamente', 
                estado: estado[id]
            };
            
            if (advertencia) {
                respuesta.advertencia = advertencia;
            }
            
            res.json(respuesta);
        } else {
            res.status(500).json({ error: 'Error guardando el estado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error actualizando estado' });
    }
});

// Ruta para obtener estadísticas
app.get('/api/estadisticas', async (req, res) => {
    try {
        const materias = await leerMaterias();
        const estado = await leerEstadoMaterias();
        
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

        res.json({
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
        });
    } catch (error) {
        res.status(500).json({ error: 'Error calculando estadísticas' });
    }
});

// Función para obtener nombre de materia por número
function obtenerNombreMateria(numero, materias) {
    const materia = materias.materias_obligatorias.find(m => m.numero === numero);
    return materia ? materia.materia : `Materia ${numero}`;
}

// Función para verificar si una materia está desbloqueada
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

// Ruta para verificar correlatividades
app.get('/api/materias/:id/correlatividades', async (req, res) => {
    try {
        const { id } = req.params;
        const materias = await leerMaterias();
        const estado = await leerEstadoMaterias();
        
        let materia = null;
        
        // Buscar la materia por ID (número o ID de electiva)
        if (id.startsWith('electiva_')) {
            const index = parseInt(id.split('_')[1]);
            materia = materias.materias_electivas[index];
        } else {
            materia = materias.materias_obligatorias.find(m => m.numero.toString() === id);
        }
        
        if (!materia) {
            return res.status(404).json({ error: 'Materia no encontrada' });
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
        
        res.json({
            puedeRendir,
            correlativasRegulares: {
                requeridas: nombresRegulares,
                cumplidas: correlativasRegularesOk
            },
            correlativasAprobadas: {
                requeridas: nombresAprobadas,
                cumplidas: correlativasAprobadasOk
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error verificando correlatividades' });
    }
});

// Ruta para exportar datos
app.get('/api/exportar', async (req, res) => {
    try {
        const estado = await leerEstadoMaterias();
        res.json(estado);
    } catch (error) {
        res.status(500).json({ error: 'Error exportando datos' });
    }
});

// Ruta para importar datos
app.post('/api/importar', async (req, res) => {
    try {
        const nuevoEstado = req.body;
        const guardado = await guardarEstadoMaterias(nuevoEstado);
        
        if (guardado) {
            res.json({ mensaje: 'Datos importados correctamente' });
        } else {
            res.status(500).json({ error: 'Error importando datos' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error importando datos' });
    }
});

// Ruta para obtener información detallada de correlatividades
app.get('/api/correlatividades/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const materias = await leerMaterias();
        const estado = await leerEstadoMaterias();
        
        let materia = null;
        
        // Buscar la materia por ID (número o ID de electiva)
        if (id.startsWith('electiva_')) {
            const index = parseInt(id.split('_')[1]);
            materia = materias.materias_electivas[index];
        } else {
            materia = materias.materias_obligatorias.find(m => m.numero.toString() === id);
        }
        
        if (!materia) {
            return res.status(404).json({ success: false, error: 'Materia no encontrada' });
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
        
        res.json({
            success: true,
            correlatividades
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error obteniendo correlatividades' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});
