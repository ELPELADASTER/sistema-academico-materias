# Malla Interactiva de Materias

Una aplicación web para gestionar el progreso académico de materias universitarias, permitiendo marcar materias como pendientes, regulares o aprobadas, con notas y verificación de correlatividades.

## Características

✅ **Gestión de Estados**: Marca materias como pendientes, regulares o aprobadas  
✅ **Registro de Notas**: Guarda las notas de materias aprobadas  
✅ **Verificación de Correlatividades**: Verifica automáticamente si puedes rendir una materia  
🔒 **Sistema de Bloqueo**: Previene ediciones académicamente inválidas con confirmación  
✅ **Estadísticas**: Ve tu progreso con estadísticas detalladas  
✅ **Filtros y Búsqueda**: Filtra por estado, año o busca materias específicas  
📄 **Exportar/Importar**: Respalda y restaura tu progreso (JSON y PDF)  
✅ **Separación por Años**: Organización clara por año académico  
✅ **Materias Electivas**: Soporte para materias electivas con créditos  
✅ **Auto-reinicio**: Servidor con detección automática de cambios  

## Estructura del Proyecto

```
materias/
├── backend/
│   ├── config/
│   │   └── database.js         # Persistencia de datos
│   ├── services/
│   │   ├── materiasService.js  # Lógica de negocio de materias
│   │   ├── estadoService.js    # Gestión de estados y bloqueos
│   │   ├── estadisticasService.js # Cálculo de estadísticas
│   │   └── importExportService.js # Import/Export
│   ├── routes/
│   │   ├── materias.js         # Endpoints de materias
│   │   ├── estado.js           # Endpoints de estados
│   │   ├── estadisticas.js     # Endpoints de estadísticas
│   │   └── utils.js            # Endpoints utilitarios
│   ├── utils/
│   │   └── validators.js       # Validaciones y utilidades
│   ├── server_modular.js       # Servidor principal (modular)
│   ├── server.js               # Servidor original (legacy)
│   ├── package.json            # Dependencias y scripts
│   ├── nodemon.json            # Configuración auto-reinicio
│   ├── materias.json           # Datos base de las materias
│   └── estado_materias.json    # Estado actual (auto-generado)
└── frontend/
    ├── index.html              # Interfaz principal
    └── app.js                  # Lógica del frontend
```

## Instalación y Configuración

### Paso 1: Instalar Dependencias del Backend

```bash
cd materias/backend
npm install
```

### Paso 2: Iniciar el Servidor Backend

#### **Modo Desarrollo (Recomendado)**
```bash
npm run dev
```
- ✅ Auto-reinicio cuando modificas archivos
- ✅ Logs detallados de peticiones
- ✅ Observa cambios en todos los módulos

#### **Modo Producción**
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3001`

### Paso 3: Abrir el Frontend

Abre el archivo `frontend/index.html` en tu navegador web.

## Uso de la Aplicación

### 1. Ver el Dashboard
- **Estadísticas generales**: Total de materias, pendientes, regulares, aprobadas
- **Promedio**: Calculo automático basado en las notas
- **Porcentaje de completado**: Progreso visual de tu carrera

### 2. Gestionar Materias
- **Hacer clic en una materia** para editarla
- **Seleccionar estado**: Pendiente, Regular o Aprobada
- **Ingresar nota**: Requerida para materias aprobadas (1-10)
- **Ver correlatividades**: La app verifica automáticamente si puedes rendir

### 3. Filtros y Búsqueda
- **Filtrar por estado**: Ver solo pendientes, regulares o aprobadas
- **Filtrar por año**: Enfocarte en un año específico
- **Búsqueda**: Encontrar materias por nombre

### 4. Exportar/Importar Datos
- **Exportar JSON**: Descarga un archivo JSON con tu progreso
- **Exportar PDF**: Genera un reporte académico completo en PDF con estadísticas visuales
- **Importar**: Restaura datos desde un archivo de respaldo JSON

## Estados de las Materias

| Estado | Descripción | Color |
|--------|-------------|-------|
| **Pendiente** | No cursada aún | Gris |
| **Regular** | Cursada pero no aprobada | Amarillo |
| **Aprobada** | Cursada y aprobada con nota | Verde |

## Correlatividades

La aplicación verifica automáticamente:
- **Materias para tener regulares**: Requeridas para poder cursar
- **Materias para tener aprobadas**: Requeridas para poder rendir

El sistema te indica si puedes o no rendir cada materia basándose en tus correlatividades.

## API del Backend

### Endpoints Principales

- `GET /api/materias/por-anio` - Obtener materias agrupadas por año
- `GET /api/estadisticas` - Obtener estadísticas del progreso
- `PUT /api/materias/:id/estado` - Actualizar estado de una materia
- `GET /api/materias/:id/correlatividades` - Verificar correlatividades
- `GET /api/exportar` - Exportar datos en JSON
- `GET /api/exportar-pdf` - Exportar reporte en PDF
- `POST /api/importar` - Importar datos

### Estructura de Datos

#### Estado de Materia
```json
{
  "tipo": "aprobada|regular|pendiente",
  "nota": 8.5,
  "fechaActualizacion": "2025-01-15T10:30:00Z"
}
```

#### Actualizar Estado
```json
{
  "tipo": "aprobada",
  "nota": 8.5
}
```

## Personalización

### Agregar Nuevas Materias
Edita el archivo `backend/materias.json`:

```json
{
  "anio": 3,
  "numero": 50,
  "materia": "Nueva Materia",
  "regular": [1, 2],
  "aprobada": [5]
}
```

### Materias Electivas
```json
{
  "anio": 4,
  "numero": null,
  "materia": "Materia Electiva",
  "regular": [20],
  "aprobada": [15],
  "creditos": 3
}
```

## Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **CORS** - Manejo de peticiones cross-origin
- **Puppeteer** - Generación de PDFs

### Frontend
- **HTML5/CSS3** - Estructura y estilos
- **JavaScript (Vanilla)** - Lógica del cliente
- **Bootstrap 5** - Framework CSS
- **Font Awesome** - Iconografía

## Solución de Problemas

### El servidor no inicia
```bash
# Verifica que Node.js esté instalado
node --version

# Instala las dependencias
cd materias/backend
npm install

# Inicia el servidor
npm start
```

### Error de CORS
- Asegúrate de que el servidor backend esté ejecutándose en puerto 3001
- Verifica que la URL del API en `app.js` sea correcta

### Los datos no se guardan
- Verifica que tengas permisos de escritura en la carpeta `backend`
- El archivo `estado_materias.json` se crea automáticamente

## Contribuir

1. Fork del proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Soporte

Si tienes problemas o sugerencias:
1. Revisa la sección de solución de problemas
2. Abre un issue en el repositorio
3. Contacta al desarrollador

## 🔒 Sistema de Bloqueo de Materias

### **Funcionalidad de Correlatividades**

El sistema incluye un **bloqueo estricto** que previene completamente ediciones inválidas académicamente:

#### **¿Cómo funciona?**
- ✅ Las materias **sin correlatividades** están siempre disponibles
- 🔒 Las materias **con correlatividades pendientes** están completamente bloqueadas
- ❌ **No es posible** editar materias bloqueadas hasta completar las correlatividades
- � **Respeta el orden académico** real de las universidades

#### **Identificación Visual:**
- 🔴 **Borde rojo** en materias bloqueadas
- 🔒 **Badge "BLOQUEADA"** con ícono de candado
- 📐 **Patrón diagonal** de fondo para mayor visibilidad
- ✨ **Animación de pulso** en el badge de advertencia

#### **Flujo de Edición:**
1. **Clic en materia desbloqueada** → Se abre el modal de edición
2. **Intentar guardar** → Sistema verifica correlatividades
3. **Si está bloqueada** → Se muestra mensaje de error detallado
4. **Solución** → Completar las correlatividades requeridas primero

#### **Tipos de Respuesta de la API:**
- **Status 200**: Operación exitosa
- **Status 423**: Materia bloqueada (operación rechazada)
- **Status 400**: Error de validación
- **Status 404**: Materia no encontrada

#### **Ejemplo de Bloqueo:**
```json
{
  "error": "No puedes modificar esta materia. Debes completar primero: Física I (requiere regular)",
  "tipo": "materia_bloqueada"
}
```

### **Beneficios del Sistema Estricto:**
- 🎓 **Educativo**: Enseña el sistema real de correlatividades
- 📝 **Orden académico**: Respeta la secuencia lógica de materias
- 🚫 **Sin excepciones**: Previene errores de cursado
- 🔍 **Transparente**: Mensajes claros sobre qué falta completar

## 📄 Exportación de Reportes PDF

### **Funcionalidad de Reporte Académico**

El sistema incluye una **generación automática** de reportes académicos profesionales en formato PDF:

#### **¿Qué incluye el reporte?**
- 📊 **Estadísticas completas**: Total de materias, aprobadas, regulares, pendientes
- 📈 **Promedio académico**: Cálculo automático basado en notas
- 📅 **Materias por año**: Organización visual por año académico
- 🎨 **Estados visuales**: Colores diferenciados para cada estado
- 📋 **Correlatividades**: Detalle de requisitos para cada materia
- 💳 **Créditos**: Información de materias electivas

#### **Características del PDF:**
- 🎨 **Diseño profesional** con gradientes y colores institucionales
- 📱 **Responsive**: Optimizado para impresión A4
- 🗓️ **Fecha de generación**: Timestamp automático
- 📊 **Cards estadísticos**: Información clave destacada
- 🔄 **Actualización automática**: Refleja el estado actual de las materias

#### **Casos de uso:**
- 📋 **Presentación a coordinadores académicos**
- 🎓 **Seguimiento personal del progreso**
- 📈 **Reportes de avance para becas**
- 💼 **Portfolio académico profesional**
- 🖨️ **Documentación física de respaldo**

#### **Generación del reporte:**
1. **Clic en "Exportar"** → Seleccionar "Exportar PDF"
2. **Procesamiento automático** → El sistema genera el HTML y convierte a PDF
3. **Descarga automática** → Archivo nombrado con fecha actual
4. **Listo para usar** → PDF profesional con toda tu información académica

---

¡Disfruta gestionando tu progreso académico! 🎓
