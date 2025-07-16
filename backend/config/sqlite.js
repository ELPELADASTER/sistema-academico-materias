const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

class Database {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async connect() {
        if (this.db && this.initialized) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const dbPath = path.join(__dirname, '..', 'database.sqlite');
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error conectando a la base de datos:', err);
                    reject(err);
                } else {
                    console.log('✅ Conectado a SQLite database');
                    this.initializeTables().then(() => {
                        this.initialized = true;
                        resolve(this.db);
                    }).catch(reject);
                }
            });
        });
    }

    async initializeTables() {
        return new Promise((resolve, reject) => {
            // Crear tabla de materias
            this.db.run(`
                CREATE TABLE IF NOT EXISTS materias (
                    id INTEGER PRIMARY KEY,
                    numero INTEGER,
                    anio INTEGER NOT NULL,
                    materia TEXT NOT NULL,
                    categoria TEXT NOT NULL,
                    creditos INTEGER,
                    regular TEXT, -- JSON array de números
                    aprobada TEXT, -- JSON array de números
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Crear tabla de estados
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS estados_materias (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        materia_numero INTEGER NOT NULL,
                        tipo TEXT NOT NULL CHECK (tipo IN ('pendiente', 'regular', 'aprobada')),
                        nota REAL,
                        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(materia_numero)
                    )
                `, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log('✅ Tablas de base de datos inicializadas');
                        resolve();
                    }
                });
            });
        });
    }

    async migrarDatosJSON() {
        try {
            console.log('🔄 Migrando datos desde archivos JSON...');
            
            // Leer datos actuales
            const fs = require('fs');
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

            console.log('✅ Migración completada');
        } catch (error) {
            console.log('ℹ️ No hay datos JSON para migrar o ya fueron migrados');
        }
    }

    async insertMateria(materia) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO materias 
                (numero, anio, materia, categoria, creditos, regular, aprobada)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run([
                materia.numero,
                materia.anio,
                materia.materia,
                materia.categoria,
                materia.creditos || null,
                JSON.stringify(materia.regular || []),
                JSON.stringify(materia.aprobada || [])
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
            
            stmt.finalize();
        });
    }

    async insertEstado(materiaNumero, estado) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO estados_materias 
                (materia_numero, tipo, nota, fecha_actualizacion)
                VALUES (?, ?, ?, ?)
            `);
            
            stmt.run([
                materiaNumero,
                estado.tipo,
                estado.nota || null,
                estado.fechaActualizacion || new Date().toISOString()
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
            
            stmt.finalize();
        });
    }

    async getMaterias() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT m.*, e.tipo as estado_tipo, e.nota as estado_nota, e.fecha_actualizacion
                FROM materias m
                LEFT JOIN estados_materias e ON m.numero = e.materia_numero
                ORDER BY m.categoria, m.anio, m.numero
            `, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
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
                            regular: JSON.parse(row.regular || '[]'),
                            aprobada: JSON.parse(row.aprobada || '[]'),
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
                    
                    resolve(materiasPorCategoria);
                }
            });
        });
    }

    async getEstados() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT materia_numero, tipo, nota, fecha_actualizacion
                FROM estados_materias
            `, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const estados = {};
                    rows.forEach(row => {
                        estados[row.materia_numero] = {
                            tipo: row.tipo,
                            nota: row.nota,
                            fechaActualizacion: row.fecha_actualizacion
                        };
                    });
                    resolve(estados);
                }
            });
        });
    }

    async updateEstado(materiaNumero, estado) {
        return new Promise((resolve, reject) => {
            const stmt = this.db.prepare(`
                INSERT OR REPLACE INTO estados_materias 
                (materia_numero, tipo, nota, fecha_actualizacion)
                VALUES (?, ?, ?, ?)
            `);
            
            stmt.run([
                materiaNumero,
                estado.tipo,
                estado.nota || null,
                new Date().toISOString()
            ], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ 
                        success: true,
                        changes: this.changes
                    });
                }
            });
            
            stmt.finalize();
        });
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error cerrando la base de datos:', err);
                    }
                    resolve();
                });
            });
        }
    }
}

// Singleton instance
const database = new Database();

module.exports = database;
