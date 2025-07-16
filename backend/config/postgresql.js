const { Pool } = require('pg');
require('dotenv').config();

class PostgreSQLDatabase {
    constructor() {
        this.pool = null;
        this.initialized = false;
    }

    async connect() {
        if (this.pool && this.initialized) {
            return this.pool;
        }

        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        try {
            await this.pool.query('SELECT NOW()');
            console.log('✅ Conectado a PostgreSQL database');
            await this.initializeTables();
            this.initialized = true;
            return this.pool;
        } catch (error) {
            console.error('Error conectando a PostgreSQL:', error);
            throw error;
        }
    }

    async initializeTables() {
        const client = await this.pool.connect();
        
        try {
            // Crear tabla de materias
            await client.query(`
                CREATE TABLE IF NOT EXISTS materias (
                    id SERIAL PRIMARY KEY,
                    numero INTEGER,
                    anio INTEGER NOT NULL,
                    materia TEXT NOT NULL,
                    categoria TEXT NOT NULL,
                    creditos INTEGER,
                    regular JSONB DEFAULT '[]',
                    aprobada JSONB DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Crear tabla de estados
            await client.query(`
                CREATE TABLE IF NOT EXISTS estados_materias (
                    id SERIAL PRIMARY KEY,
                    materia_numero INTEGER NOT NULL,
                    tipo TEXT NOT NULL CHECK (tipo IN ('pendiente', 'regular', 'aprobada')),
                    nota DECIMAL(3,2),
                    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(materia_numero)
                )
            `);

            console.log('✅ Tablas de PostgreSQL inicializadas');
        } finally {
            client.release();
        }
    }

    async migrarDatosJSON() {
        try {
            console.log('🔄 Migrando datos desde archivos JSON a PostgreSQL...');
            
            const fs = require('fs');
            const path = require('path');
            const materiasPath = path.join(__dirname, '..', 'materias.json');
            const estadosPath = path.join(__dirname, '..', 'estado_materias.json');

            let materias = {};
            let estados = {};

            // Leer materias
            if (fs.existsSync(materiasPath)) {
                materias = JSON.parse(fs.readFileSync(materiasPath, 'utf8'));
            }

            // Leer estados
            if (fs.existsSync(estadosPath)) {
                estados = JSON.parse(fs.readFileSync(estadosPath, 'utf8'));
            }

            // Verificar si ya hay datos
            const { rows } = await this.pool.query('SELECT COUNT(*) FROM materias');
            if (parseInt(rows[0].count) > 0) {
                console.log('ℹ️ PostgreSQL ya tiene datos, saltando migración');
                return;
            }

            // Migrar materias
            for (const [categoria, materiasArray] of Object.entries(materias)) {
                if (Array.isArray(materiasArray)) {
                    for (const materia of materiasArray) {
                        await this.insertMateria({
                            ...materia,
                            categoria: categoria
                        });
                    }
                }
            }

            // Migrar estados
            for (const [numero, estado] of Object.entries(estados)) {
                if (estado && estado.tipo) {
                    await this.insertEstado(parseInt(numero), estado);
                }
            }

            console.log('✅ Migración a PostgreSQL completada');
        } catch (error) {
            console.log('ℹ️ No hay datos JSON para migrar o ya fueron migrados:', error.message);
        }
    }

    async insertMateria(materia) {
        const result = await this.pool.query(`
            INSERT INTO materias 
            (numero, anio, materia, categoria, creditos, regular, aprobada)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT DO NOTHING
            RETURNING id
        `, [
            materia.numero,
            materia.anio,
            materia.materia,
            materia.categoria,
            materia.creditos || null,
            JSON.stringify(materia.regular || []),
            JSON.stringify(materia.aprobada || [])
        ]);
        
        return result.rows[0]?.id;
    }

    async insertEstado(materiaNumero, estado) {
        const result = await this.pool.query(`
            INSERT INTO estados_materias 
            (materia_numero, tipo, nota, fecha_actualizacion)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (materia_numero) 
            DO UPDATE SET 
                tipo = EXCLUDED.tipo,
                nota = EXCLUDED.nota,
                fecha_actualizacion = EXCLUDED.fecha_actualizacion
            RETURNING id
        `, [
            materiaNumero,
            estado.tipo,
            estado.nota || null,
            estado.fechaActualizacion || new Date().toISOString()
        ]);
        
        return result.rows[0]?.id;
    }

    async getMaterias() {
        const { rows } = await this.pool.query(`
            SELECT m.*, e.tipo as estado_tipo, e.nota as estado_nota, e.fecha_actualizacion
            FROM materias m
            LEFT JOIN estados_materias e ON m.numero = e.materia_numero
            ORDER BY m.categoria, m.anio, m.numero
        `);

        // Agrupar por categoría como antes
        const materiasPorCategoria = {};
        
        rows.forEach(row => {
            if (!materiasPorCategoria[row.categoria]) {
                materiasPorCategoria[row.categoria] = [];
            }
            
            const materia = {
                numero: row.numero,
                anio: row.anio,
                materia: row.materia,
                regular: row.regular || [],
                aprobada: row.aprobada || [],
                creditos: row.creditos
            };

            // Agregar estado si existe
            if (row.estado_tipo) {
                materia.estado = {
                    tipo: row.estado_tipo,
                    nota: row.estado_nota,
                    fechaActualizacion: row.fecha_actualizacion
                };
            }

            materiasPorCategoria[row.categoria].push(materia);
        });
        
        return materiasPorCategoria;
    }

    async getEstados() {
        const { rows } = await this.pool.query(`
            SELECT materia_numero, tipo, nota, fecha_actualizacion
            FROM estados_materias
        `);

        const estados = {};
        rows.forEach(row => {
            estados[row.materia_numero] = {
                tipo: row.tipo,
                nota: row.nota,
                fechaActualizacion: row.fecha_actualizacion
            };
        });
        
        return estados;
    }

    async updateEstado(materiaNumero, estado) {
        const result = await this.pool.query(`
            INSERT INTO estados_materias 
            (materia_numero, tipo, nota, fecha_actualizacion)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (materia_numero) 
            DO UPDATE SET 
                tipo = EXCLUDED.tipo,
                nota = EXCLUDED.nota,
                fecha_actualizacion = EXCLUDED.fecha_actualizacion
            RETURNING id
        `, [
            materiaNumero,
            estado.tipo,
            estado.nota || null,
            new Date().toISOString()
        ]);
        
        return { 
            success: true,
            changes: result.rowCount
        };
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
    }
}

module.exports = PostgreSQLDatabase;
