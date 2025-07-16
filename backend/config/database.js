const fs = require('fs').promises;
const path = require('path');
const SQLiteDatabase = require('./sqlite.js');
const PostgreSQLDatabase = require('./postgresql.js');

let database = null;

// Función para inicializar la base de datos
async function inicializarDB() {
    if (!database) {
        // Usar PostgreSQL en producción, SQLite en desarrollo
        if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
            console.log('🌐 Usando PostgreSQL para producción');
            database = new PostgreSQLDatabase();
        } else {
            console.log('🏠 Usando SQLite para desarrollo');
            database = new SQLiteDatabase();
        }
        
        await database.connect();
        
        // Migrar datos si es necesario
        if (typeof database.migrarDatosJSON === 'function') {
            await database.migrarDatosJSON();
        }
        
        console.log('✅ Base de datos conectada y lista');
    }
    return database;
}

// Rutas de archivos (mantenidas para compatibilidad)
const MATERIAS_FILE = path.join(__dirname, '..', 'materias.json');
const ESTADO_MATERIAS_FILE = path.join(__dirname, '..', 'estado_materias.json');

/**
 * Lee las materias desde la base de datos
 * Mantiene la misma estructura que antes para compatibilidad
 */
async function leerMaterias() {
    try {
        const db = await inicializarDB();
        
        // Verificar si hay datos en la base de datos
        const materias = await db.getMaterias();
        
        // Si no hay datos, migrar desde JSON
        if (Object.keys(materias).length === 0) {
            await db.migrarDatosJSON();
            return await db.getMaterias();
        }
        
        return materias;
    } catch (error) {
        console.error('Error leyendo materias desde base de datos:', error);
        
        // Fallback a JSON si hay error
        try {
            const data = await fs.readFile(MATERIAS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (jsonError) {
            return { materias_obligatorias: [], materias_electivas: [] };
        }
    }
}

/**
 * Lee el estado de las materias desde la base de datos
 */
async function leerEstadoMaterias() {
    try {
        const db = await inicializarDB();
        return await db.getEstados();
    } catch (error) {
        console.error('Error leyendo estados desde base de datos:', error);
        
        // Fallback a JSON si hay error
        try {
            const data = await fs.readFile(ESTADO_MATERIAS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (jsonError) {
            return {};
        }
    }
}

/**
 * Guarda el estado de las materias en la base de datos
 */
async function guardarEstadoMaterias(estadoCompleto) {
    try {
        const db = await inicializarDB();
        
        // Guardar cada estado individualmente
        for (const [numero, estado] of Object.entries(estadoCompleto)) {
            if (estado && estado.tipo) {
                await db.updateEstado(parseInt(numero), estado);
            }
        }
        
        console.log('✅ Estados guardados en base de datos');
        return true;
    } catch (error) {
        console.error('Error guardando estados en base de datos:', error);
        
        // Fallback a JSON si hay error
        try {
            await fs.writeFile(ESTADO_MATERIAS_FILE, JSON.stringify(estadoCompleto, null, 2));
            console.log('⚠️ Estados guardados en JSON como fallback');
            return true;
        } catch (jsonError) {
            console.error('Error guardando fallback JSON:', jsonError);
            return false;
        }
    }
}

/**
 * Actualiza el estado de una materia específica
 */
async function actualizarEstadoMateria(numero, estado) {
    try {
        const db = await inicializarDB();
        const result = await db.updateEstado(parseInt(numero), estado);
        
        console.log(`✅ Estado de materia ${numero} actualizado en base de datos`);
        return true;
    } catch (error) {
        console.error('Error actualizando estado de materia:', error);
        
        // Fallback a JSON
        try {
            let estadoActual = {};
            try {
                const data = await fs.readFile(ESTADO_MATERIAS_FILE, 'utf8');
                estadoActual = JSON.parse(data);
            } catch (readError) {
                // Archivo no existe, usar objeto vacío
            }
            
            estadoActual[numero] = estado;
            await fs.writeFile(ESTADO_MATERIAS_FILE, JSON.stringify(estadoActual, null, 2));
            
            console.log(`⚠️ Estado de materia ${numero} guardado en JSON como fallback`);
            return true;
        } catch (jsonError) {
            console.error('Error en fallback JSON:', jsonError);
            return false;
        }
    }
}

module.exports = {
    leerMaterias,
    leerEstadoMaterias,
    guardarEstadoMaterias,
    actualizarEstadoMateria
};;
