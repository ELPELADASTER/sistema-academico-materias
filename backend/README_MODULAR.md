# Sistema de Gestión de Materias - Arquitectura Modular

## 🏗️ Estructura del Proyecto

```
backend/
├── config/
│   └── database.js          # Configuración de base de datos y operaciones de archivos
├── services/
│   ├── materiasService.js   # Lógica de negocio para materias
│   ├── estadoService.js     # Lógica de negocio para estados de materias
│   ├── estadisticasService.js # Cálculo de estadísticas
│   └── importExportService.js # Importación y exportación de datos
├── routes/
│   ├── materias.js          # Endpoints relacionados con materias
│   ├── estado.js            # Endpoints para actualizar estados
│   ├── estadisticas.js      # Endpoints de estadísticas
│   └── utils.js             # Endpoints utilitarios
├── utils/
│   └── validators.js        # Funciones de validación y utilidades
├── server.js                # Servidor original (monolítico)
├── server_modular.js        # Servidor refactorizado (modular)
└── package.json
```

## 📦 Módulos del Sistema

### 1. **Config Layer** (`config/`)
- **database.js**: Maneja la persistencia de datos en archivos JSON
  - `leerMaterias()`: Lee las materias base
  - `leerEstadoMaterias()`: Lee el estado del estudiante
  - `guardarEstadoMaterias()`: Guarda cambios de estado

### 2. **Services Layer** (`services/`)
Contiene la lógica de negocio principal:

#### **materiasService.js**
- `obtenerMateriasConEstado()`: Combina materias con su estado actual
- `obtenerMateriasPorAnio()`: Agrupa materias por año académico
- `buscarMateriaPorId()`: Busca una materia específica

#### **estadoService.js**
- `actualizarEstadoMateria()`: Actualiza el estado de una materia
- `verificarCorrelatividades()`: Verifica requisitos de correlatividades
- `obtenerCorrelatividasDetalladas()`: Información detallada de correlatividades

#### **estadisticasService.js**
- `obtenerEstadisticas()`: Calcula estadísticas del progreso académico

#### **importExportService.js**
- `exportarDatos()`: Exporta el estado actual
- `importarDatos()`: Importa un estado desde archivo

### 3. **Routes Layer** (`routes/`)
Define los endpoints de la API:

#### **materias.js**
- `GET /api/materias`: Obtener todas las materias
- `GET /api/materias/por-anio`: Materias agrupadas por año

#### **estado.js**
- `PUT /api/materias/:id/estado`: Actualizar estado de materia
- `GET /api/materias/:id/correlatividades`: Verificar correlatividades

#### **estadisticas.js**
- `GET /api/estadisticas`: Obtener estadísticas completas

#### **utils.js**
- `GET /api/correlatividades/:id`: Correlatividades detalladas
- `GET /api/exportar`: Exportar datos
- `POST /api/importar`: Importar datos

### 4. **Utils Layer** (`utils/`)
- **validators.js**: Funciones de validación y utilidades
  - `validarTipoEstado()`: Valida tipos de estado
  - `validarNota()`: Valida notas de materias
  - `estaDesbloqueada()`: Verifica si una materia está disponible
  - `calcularEstadisticas()`: Motor de cálculo de estadísticas

## 🚀 Cómo usar la versión modular

### Opción 1: Usar el servidor modular (recomendado)
```bash
node server_modular.js
```

### Opción 2: Mantener el servidor original
```bash
node server.js
```

## ✅ Ventajas de la arquitectura modular

### **1. Mantenibilidad**
- Cada módulo tiene una responsabilidad específica
- Fácil localización y corrección de errores
- Código más legible y organizado

### **2. Escalabilidad**
- Fácil agregar nuevas funcionalidades
- Módulos independientes que pueden crecer por separado
- Posibilidad de migrar a microservicios en el futuro

### **3. Testabilidad**
- Cada módulo puede ser testeado de forma independiente
- Fácil creación de mocks para las dependencias
- Tests más específicos y rápidos

### **4. Reutilización**
- Los servicios pueden ser reutilizados en diferentes rutas
- Las validaciones están centralizadas
- Funciones utilitarias disponibles en todo el sistema

### **5. Separación de responsabilidades**
- **Routes**: Solo manejan HTTP requests/responses
- **Services**: Contienen la lógica de negocio
- **Config**: Maneja la persistencia de datos
- **Utils**: Funciones auxiliares y validaciones

## 🔧 Migración del código existente

El sistema modular mantiene **100% de compatibilidad** con la API existente. No se requieren cambios en el frontend.

### Endpoints disponibles (sin cambios):
- `GET /api/materias`
- `GET /api/materias/por-anio`
- `PUT /api/materias/:id/estado`
- `GET /api/estadisticas`
- `GET /api/materias/:id/correlatividades`
- `GET /api/correlatividades/:id`
- `GET /api/exportar`
- `POST /api/importar`

## 📈 Próximos pasos sugeridos

1. **Testing**: Implementar tests unitarios para cada módulo
2. **Logging**: Agregar sistema de logs estructurados
3. **Validation**: Expandir las validaciones con esquemas JSON
4. **Documentation**: Generar documentación automática de la API
5. **Performance**: Implementar caché para consultas frecuentes
6. **Database**: Migrar de archivos JSON a base de datos real

## 🔄 Comparación: Monolítico vs Modular

| Aspecto | Monolítico (server.js) | Modular (server_modular.js) |
|---------|------------------------|------------------------------|
| **Líneas de código por archivo** | ~350 líneas | ~30-80 líneas por módulo |
| **Funciones por archivo** | 15+ funciones | 2-5 funciones por módulo |
| **Responsabilidades** | Múltiples en un archivo | Una por módulo |
| **Mantenimiento** | Difícil localizar errores | Fácil identificar problemas |
| **Testing** | Tests complejos | Tests simples y específicos |
| **Colaboración** | Conflictos frecuentes | Módulos independientes |

La arquitectura modular convierte un archivo monolítico de 350+ líneas en 9 módulos especializados, cada uno con responsabilidades claras y bien definidas.
