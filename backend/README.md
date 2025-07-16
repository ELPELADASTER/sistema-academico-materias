# 🎓 Sistema de Gestión de Malla de Materias

Sistema modular para el seguimiento académico de materias universitarias con validación de correlatividades y generación de reportes PDF.

## 🌟 Características

### ✅ Arquitectura Modular
- **Backend** estructurado con capas: `config/`, `services/`, `routes/`, `utils/`
- **Frontend** organizado con componentes reutilizables
- Separación clara de responsabilidades

### 🔒 Sistema de Bloqueo Académico
- Validación automática de correlatividades
- Bloqueo estricto de materias sin requisitos cumplidos
- Respuestas HTTP 423 (Locked) para operaciones no permitidas

### 📊 Generación de Reportes
- Exportación a PDF con diseño profesional
- Estadísticas académicas detalladas
- Visualización de progreso por categorías

### 🔄 Desarrollo Automatizado
- Auto-restart con `nodemon`
- Seguimiento de cambios en tiempo real
- Entorno de desarrollo optimizado

### 🌐 Multi-Plataforma
- Preparado para deployment en la nube
- Base de datos SQLite (desarrollo) y PostgreSQL (producción)
- Sincronización de datos entre dispositivos

## 🛠️ Tecnologías

### Backend
- **Node.js** + **Express.js**
- **SQLite** (desarrollo) / **PostgreSQL** (producción)
- **Puppeteer** (generación PDF)
- **CORS** habilitado

### Frontend
- **HTML5** + **CSS3** + **JavaScript**
- Diseño responsive
- Interfaz moderna y accesible

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn

### Instalación Local
```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd materias/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Modo desarrollo (auto-restart)
npm run dev

# Modo producción
npm start
```

### Deployment en Railway

1. **Conectar repositorio a Railway**
2. **Configurar variables de entorno:**
   - `NODE_ENV=production`
   - `PORT=3000` (Railway lo configurará automáticamente)
   - Railway configurará `DATABASE_URL` automáticamente

3. **Deploy automático** desde GitHub

## 📂 Estructura del Proyecto

```
materias/
├── backend/
│   ├── config/
│   │   ├── database.js       # Capa de abstracción DB
│   │   ├── sqlite.js         # Implementación SQLite
│   │   └── postgresql.js     # Implementación PostgreSQL
│   ├── services/
│   │   ├── materiasService.js    # Lógica de materias
│   │   ├── estadoService.js      # Gestión de estados
│   │   ├── estadisticasService.js # Cálculos estadísticos
│   │   └── pdfService.js         # Generación PDF
│   ├── routes/
│   │   ├── materiasRoutes.js     # Endpoints materias
│   │   ├── estadoRoutes.js       # Endpoints estados
│   │   └── estadisticasRoutes.js # Endpoints estadísticas
│   ├── utils/
│   │   └── correlatividades.js   # Validaciones académicas
│   ├── server_modular.js         # Servidor principal
│   └── package.json
└── frontend/
    ├── index.html
    ├── styles.css
    └── scripts.js
```

## 🔧 API Endpoints

### Materias
- `GET /api/materias` - Obtener todas las materias
- `POST /api/materias/:numero/estado` - Actualizar estado de materia

### Estados
- `GET /api/estados` - Obtener estados de materias
- `PUT /api/estados/:numero` - Actualizar estado específico

### Estadísticas
- `GET /api/estadisticas` - Obtener estadísticas generales
- `GET /api/estadisticas/pdf` - Generar reporte PDF

### Sistema
- `GET /health` - Health check con información del entorno

## 🔒 Sistema de Validación

### Tipos de Estado
- **Pendiente**: Materia no cursada
- **Regular**: Materia cursada, examen final pendiente
- **Aprobada**: Materia completamente aprobada

### Validación de Correlatividades
```javascript
// Ejemplo de validación
{
  "numero": 543,
  "materia": "Análisis Matemático II",
  "regular": [541], // Requiere AM I regular
  "aprobada": []     // No requiere materias aprobadas
}
```

## 🚨 Manejo de Errores

### Códigos de Estado HTTP
- `200` - Operación exitosa
- `400` - Datos inválidos
- `404` - Recurso no encontrado
- `423` - Recurso bloqueado (correlatividades no cumplidas)
- `500` - Error interno del servidor

### Sistema de Logs
```javascript
console.log('✅ Operación exitosa');
console.log('⚠️ Advertencia importante');
console.error('❌ Error crítico');
console.log('🔄 Proceso en ejecución');
```

## 📊 Métricas y Estadísticas

### Indicadores Académicos
- Materias aprobadas vs total
- Promedio general
- Progreso por categoría
- Créditos completados

### Exportación PDF
- Reporte completo del progreso académico
- Gráficos y tablas profesionales
- Información de correlatividades

## 🛡️ Seguridad

### Validaciones
- Verificación de correlatividades estricta
- Sanitización de datos de entrada
- Manejo seguro de errores

### CORS
```javascript
// Configuración para múltiples entornos
const allowedOrigins = [
  'http://localhost:3000',
  'https://tu-app.vercel.app',
  'https://tu-app.railway.app'
];
```

## 🔄 Migración de Datos

### SQLite → PostgreSQL
El sistema migra automáticamente los datos existentes:
1. Detecta archivos JSON legacy
2. Crea tablas en PostgreSQL
3. Migra datos preservando estructura
4. Mantiene compatibilidad con API existente

## 📱 PWA (Próximamente)

### Características Planeadas
- Instalación en dispositivos móviles
- Funcionamiento offline
- Sincronización automática
- Notificaciones push

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

### Issues Comunes

**Error de conexión a base de datos:**
```bash
# Verificar variables de entorno
echo $DATABASE_URL

# Reiniciar servicio
npm restart
```

**Problemas con PDF:**
```bash
# Verificar Puppeteer
npm run test:pdf
```

### Contacto
- 📧 Email: tu-email@ejemplo.com
- 🐛 Issues: [GitHub Issues](link-to-issues)
- 📖 Docs: [Documentación completa](link-to-docs)

---

**¡Sistema académico modular, seguro y escalable! 🎓✨**
