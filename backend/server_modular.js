const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar las rutas
const materiasRoutes = require('./routes/materias');
const estadoRoutes = require('./routes/estado');
const estadisticasRoutes = require('./routes/estadisticas');
const utilsRoutes = require('./routes/utils');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL, /\.vercel\.app$/, /\.railway\.app$/] 
        : '*',
    credentials: true
}));
app.use(express.json());

// Configurar las rutas
app.use('/api/materias', materiasRoutes);
app.use('/api/materias', estadoRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api', utilsRoutes);

// Middleware de manejo de errores
app.use((error, req, res, next) => {
    console.error('Error no manejado:', error);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// Ruta de salud para verificar que el servidor está funcionando
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor de materias funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Servir archivos estáticos del frontend en producción
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    app.use(express.static(path.join(__dirname, '..', 'frontend')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
    });
} else {
    // Manejo de rutas no encontradas en desarrollo
    app.use('*', (req, res) => {
        res.status(404).json({ 
            error: 'Ruta no encontrada',
            path: req.originalUrl
        });
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
    console.log(`📊 Panel de salud disponible en http://localhost:${PORT}/health`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
