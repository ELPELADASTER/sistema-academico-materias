const API_BASE = 'http://localhost:3001/api';

let materiasPorAnio = {};
let estadisticas = {};
let materiaActual = null;
let vistaActual = 'grid'; // 'grid' o 'lista'
let materiasOriginales = {}; // Para filtros

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    cargarDatos();
    
    // Inicializar tooltips de Bootstrap
    const initTooltips = () => {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    };
    
    // Inicializar tooltips al cargar y también después de actualizar el DOM
    setTimeout(initTooltips, 500);
    
    // Event listeners para los radios de estado
    document.querySelectorAll('input[name="estado"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const contenedorNota = document.getElementById('contenedor-nota');
            if (this.value === 'aprobada') {
                contenedorNota.style.display = 'block';
                document.getElementById('nota').required = true;
            } else {
                contenedorNota.style.display = 'none';
                document.getElementById('nota').required = false;
                document.getElementById('nota').value = '';
            }
        });
    });
});

// Cargar todos los datos
async function cargarDatos() {
    try {
        await Promise.all([
            cargarMaterias(),
            cargarEstadisticas()
        ]);
        // Guardar copia original para filtros
        materiasOriginales = JSON.parse(JSON.stringify(materiasPorAnio));
        mostrarMaterias();
    } catch (error) {
        console.error('Error cargando datos:', error);
        document.getElementById('contenedor-materias').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Error cargando datos. Asegúrate de que el servidor esté ejecutándose.
            </div>
        `;
    }
}

// Cargar materias del backend
async function cargarMaterias() {
    const response = await fetch(`${API_BASE}/materias/por-anio`);
    if (!response.ok) {
        throw new Error('Error cargando materias');
    }
    materiasPorAnio = await response.json();
}

// Cargar estadísticas
async function cargarEstadisticas() {
    const response = await fetch(`${API_BASE}/estadisticas`);
    if (!response.ok) {
        throw new Error('Error cargando estadísticas');
    }
    estadisticas = await response.json();
    mostrarEstadisticas();
}

// Mostrar estadísticas en el dashboard
function mostrarEstadisticas() {
    document.getElementById('total-materias').textContent = estadisticas.total;
    document.getElementById('materias-pendientes').textContent = estadisticas.pendientes;
    document.getElementById('materias-regulares').textContent = estadisticas.regulares;
    document.getElementById('materias-aprobadas').textContent = estadisticas.aprobadas;
    document.getElementById('promedio').textContent = estadisticas.promedio;
    document.getElementById('porcentaje-completado').textContent = `${estadisticas.porcentajeCompletado}%`;
    
    // Mostrar estadísticas de créditos de electivas
    if (estadisticas.creditosElectivas) {
        document.getElementById('creditos-obtenidos').textContent = estadisticas.creditosElectivas.obtenidos;
        document.getElementById('creditos-disponibles').textContent = estadisticas.creditosElectivas.disponibles;
        
        // Calcular y mostrar porcentaje de progreso
        const porcentaje = estadisticas.creditosElectivas.disponibles > 0 
            ? ((estadisticas.creditosElectivas.obtenidos / estadisticas.creditosElectivas.disponibles) * 100).toFixed(1)
            : 0;
        
        document.getElementById('porcentaje-creditos').textContent = `${porcentaje}%`;
        document.getElementById('barra-progreso-creditos').style.width = `${porcentaje}%`;
        
        // Cambiar color de la barra según el progreso con mejor contraste
        const barraProgreso = document.getElementById('barra-progreso-creditos');
        if (porcentaje >= 80) {
            barraProgreso.className = 'progress-bar bg-success';
            barraProgreso.style.background = 'linear-gradient(45deg, #198754, #20c997)';
        } else if (porcentaje >= 50) {
            barraProgreso.className = 'progress-bar bg-warning';
            barraProgreso.style.background = 'linear-gradient(45deg, #ffc107, #ffcd39)';
        } else {
            barraProgreso.className = 'progress-bar bg-info';
            barraProgreso.style.background = 'linear-gradient(45deg, #0dcaf0, #3dd5f3)';
        }
    }
}

// Mostrar materias en vista grid (horizontal por años)
function mostrarMateriasGrid() {
    const contenedor = document.getElementById('contenedor-materias');
    let html = '';

    const años = Object.keys(materiasPorAnio).sort((a, b) => parseInt(a) - parseInt(b));

    años.forEach(año => {
        const datos = materiasPorAnio[año];
        
        html += `
            <div class="año-section" data-año="${año}">
                <div class="año-header">
                    <h3><i class="fas fa-calendar-alt me-2"></i>${año}° Año</h3>
                </div>
        `;

        // Combinar todas las materias del año en una sola lista
        const todasLasMaterias = [];
        
        // Agregar materias obligatorias
        if (datos.obligatorias && datos.obligatorias.length > 0) {
            datos.obligatorias.forEach(materia => {
                todasLasMaterias.push({ ...materia, esElectiva: false });
            });
        }

        // Agregar materias electivas
        if (datos.electivas && datos.electivas.length > 0) {
            datos.electivas.forEach(materia => {
                todasLasMaterias.push({ ...materia, esElectiva: true });
            });
        }

        // Crear lista vertical de materias para cada año
        if (todasLasMaterias.length > 0) {
            todasLasMaterias.forEach(materia => {
                html += crearTarjetaMateria(materia, materia.esElectiva);
            });
        }

        html += '</div>';
    });

    contenedor.innerHTML = html;
}

// Mostrar materias en vista lista detallada
function mostrarMateriasLista() {
    console.log('mostrarMateriasLista llamada');
    console.log('materiasPorAnio:', materiasPorAnio);
    
    const cuerpoTabla = document.getElementById('cuerpo-tabla-lista');
    if (!cuerpoTabla) {
        console.error('No se encontró el elemento cuerpo-tabla-lista');
        return;
    }
    
    let html = '';

    const años = Object.keys(materiasPorAnio).sort((a, b) => parseInt(a) - parseInt(b));
    console.log('Años encontrados:', años);
    
    años.forEach(año => {
        const datos = materiasPorAnio[año];
        console.log(`Procesando año ${año}:`, datos);
        
        // Agregar materias obligatorias
        if (datos.obligatorias && datos.obligatorias.length > 0) {
            datos.obligatorias.forEach(materia => {
                html += crearFilaTabla(materia, false, año);
            });
        }

        // Agregar materias electivas
        if (datos.electivas && datos.electivas.length > 0) {
            datos.electivas.forEach(materia => {
                html += crearFilaTabla(materia, true, año);
            });
        }
    });

    console.log('HTML generado:', html);
    cuerpoTabla.innerHTML = html;
}

// Función principal para mostrar materias según la vista actual
function mostrarMaterias() {
    if (vistaActual === 'grid') {
        mostrarMateriasGrid();
    } else {
        mostrarMateriasLista();
    }
    
    // Reinicializar tooltips después de actualizar el DOM
    setTimeout(() => {
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }, 100);
}

// Crear tarjeta de materia
function crearTarjetaMateria(materia, esElectiva = false) {
    const estado = materia.estado.tipo;
    const nota = materia.estado.nota;
    const desbloqueada = materia.desbloqueada;
    const id = materia.id || materia.numero;
    
    const iconoEstado = {
        'pendiente': 'fas fa-clock',
        'regular': 'fas fa-book',
        'aprobada': 'fas fa-check'
    };

    // Función auxiliar para obtener nombre de materia por número
    const obtenerNombreMateria = (numero) => {
        // Buscar en todas las materias cargadas
        for (const año in materiasPorAnio) {
            const materiaEncontrada = materiasPorAnio[año].obligatorias.find(m => m.numero === numero);
            if (materiaEncontrada) return materiaEncontrada.materia;
        }
        return `Materia ${numero}`;
    };

    // Crear tooltip para correlatividades
    const correlativas = [];
    if (materia.regular && materia.regular.length > 0) {
        const nombresRegulares = materia.regular.map(num => obtenerNombreMateria(num));
        correlativas.push(`Req. Regulares: ${nombresRegulares.join(', ')}`);
    }
    if (materia.aprobada && materia.aprobada.length > 0) {
        const nombresAprobadas = materia.aprobada.map(num => obtenerNombreMateria(num));
        correlativas.push(`Req. Aprobadas: ${nombresAprobadas.join(', ')}`);
    }

    const tooltipCorrelativas = correlativas.length > 0 ? correlativas.join('\\n') : 'Sin correlatividades';

    // Determinar el click handler y tooltip - PERMITIR EDICIÓN SIEMPRE
    const clickHandler = `onclick="editarMateria('${id}', '${materia.materia}', '${estado}', ${nota})"`;

    // Ícono de advertencia con tooltip solo si hay correlatividades
    const iconoAdvertencia = correlativas.length > 0 ? 
        `<i class="fas fa-exclamation-triangle text-warning me-2" 
            title="${tooltipCorrelativas}" 
            style="cursor: help; font-size: 1rem;"
            data-bs-toggle="tooltip" 
            data-bs-placement="top"></i>` : '';

    return `
        <div class="materia-card ${estado} ${esElectiva ? 'electiva' : ''} ${!desbloqueada ? 'bloqueada' : ''}" 
             data-estado="${estado}" 
             data-materia="${materia.materia.toLowerCase()}" 
             ${clickHandler}
             style="cursor: pointer;"
             title="${!desbloqueada ? 'Materia bloqueada - Haz clic para editar' : 'Haz clic para editar'}">
            <div class="card-body p-3 w-100">
                <div class="d-flex align-items-center">
                    <i class="${iconoEstado[estado]} estado-icon text-${estado === 'pendiente' ? 'secondary' : estado === 'regular' ? 'warning' : 'success'} me-3" style="font-size: 1.5rem;"></i>
                    <div class="flex-grow-1">
                        <h6 class="card-title mb-1 fw-bold d-flex align-items-center">
                            ${iconoAdvertencia}
                            ${materia.materia}
                            ${esElectiva ? '<span class="electiva-badge">ELECTIVA</span>' : ''}
                            ${!desbloqueada ? '<span class="badge bg-warning ms-2"><i class="fas fa-lock"></i> BLOQUEADA</span>' : ''}
                        </h6>
                        ${esElectiva ? 
                            `<small class="text-muted d-block mb-1">
                                <i class="fas fa-star text-warning me-1"></i>Electiva - ${materia.creditos || 'N/A'} créditos
                            </small>` : 
                            `<small class="text-muted d-block mb-1">
                                <i class="fas fa-graduation-cap text-primary me-1"></i>Materia Obligatoria
                            </small>`
                        }
                    </div>
                </div>
            </div>
            ${nota ? `<div class="nota-badge">${nota}</div>` : ''}
        </div>
    `;
}

// Crear fila de tabla para vista lista
function crearFilaTabla(materia, esElectiva = false, año) {
    console.log('Creando fila para materia:', materia);
    
    const estado = materia.estado.tipo;
    const nota = materia.estado.nota || '-';
    const id = esElectiva ? materia.id : materia.numero;
    const desbloqueada = materia.desbloqueada;

    // Función auxiliar para obtener nombre de materia por número
    const obtenerNombreMateria = (numero) => {
        for (const año in materiasPorAnio) {
            const materiaEncontrada = materiasPorAnio[año].obligatorias.find(m => m.numero === numero);
            if (materiaEncontrada) return materiaEncontrada.materia;
        }
        return `Materia ${numero}`;
    };

    // Crear tooltip para correlatividades
    const correlativas = [];
    if (materia.regular && materia.regular.length > 0) {
        const nombresRegulares = materia.regular.map(num => obtenerNombreMateria(num));
        correlativas.push(`Req. Regulares: ${nombresRegulares.join(', ')}`);
    }
    if (materia.aprobada && materia.aprobada.length > 0) {
        const nombresAprobadas = materia.aprobada.map(num => obtenerNombreMateria(num));
        correlativas.push(`Req. Aprobadas: ${nombresAprobadas.join(', ')}`);
    }

    const tooltipCorrelativas = correlativas.length > 0 ? correlativas.join('\\n') : 'Sin correlatividades';

    // Determinar clases de estado
    const estadoClasses = {
        'pendiente': 'bg-secondary',
        'regular': 'bg-warning',
        'aprobada': 'bg-success'
    };

    const tipoTexto = esElectiva ? 'Electiva' : 'Obligatoria';
    const tipoIcon = esElectiva ? 'fas fa-star text-warning' : 'fas fa-graduation-cap text-primary';

    // Ícono de advertencia con tooltip solo si hay correlatividades
    const iconoAdvertencia = correlativas.length > 0 ? 
        `<i class="fas fa-exclamation-triangle text-warning ms-1" 
            title="${tooltipCorrelativas}" 
            style="cursor: help;"
            data-bs-toggle="tooltip" 
            data-bs-placement="top"></i>` : '';

    const bloqueoTexto = desbloqueada ? '' : ' <i class="fas fa-lock text-warning" title="Bloqueada"></i>';

    return `
        <tr class="${!desbloqueada ? 'table-secondary' : ''}" data-materia-id="${id}">
            <td>
                <div class="d-flex align-items-center">
                    <i class="${tipoIcon} me-2"></i>
                    <div>
                        <strong>${materia.materia}</strong>${iconoAdvertencia}${bloqueoTexto}
                        ${esElectiva ? `<br><small class="text-muted">${materia.creditos || 'N/A'} créditos</small>` : ''}
                    </div>
                </div>
            </td>
            <td class="text-center">
                <span class="badge bg-info">${año}° Año</span>
            </td>
            <td class="text-center">
                <span class="badge ${esElectiva ? 'bg-warning' : 'bg-primary'}">
                    <i class="${tipoIcon}"></i> ${tipoTexto}
                </span>
            </td>
            <td class="text-center">
                <span class="badge badge-estado ${estadoClasses[estado]}">
                    ${estado.toUpperCase()}
                </span>
            </td>
            <td class="text-center">
                ${nota !== '-' ? `<strong class="text-success">${nota}</strong>` : nota}
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-primary" onclick="editarMateria('${id}', '${materia.materia}', '${estado}', ${nota !== '-' ? nota : 'null'})" title="Editar materia">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </td>
        </tr>
    `;
}

// Cambiar vista entre grid y lista
function cambiarVista(nuevaVista) {
    console.log('Cambiando vista a:', nuevaVista);
    vistaActual = nuevaVista;
    
    // Actualizar botones
    document.getElementById('btn-vista-grid').classList.toggle('activo', nuevaVista === 'grid');
    document.getElementById('btn-vista-lista').classList.toggle('activo', nuevaVista === 'lista');
    
    // Mostrar/ocultar filtros específicos de lista
    const filtrosLista = document.getElementById('filtros-lista');
    filtrosLista.style.display = nuevaVista === 'lista' ? 'flex' : 'none';
    
    // Mostrar/ocultar vistas
    const vistaGrid = document.getElementById('vista-grid');
    const vistaLista = document.getElementById('vista-lista');
    
    console.log('Elementos encontrados:', { vistaGrid: !!vistaGrid, vistaLista: !!vistaLista });
    
    if (nuevaVista === 'grid') {
        vistaGrid.classList.remove('oculta');
        vistaLista.classList.remove('activa');
    } else {
        vistaGrid.classList.add('oculta');
        vistaLista.classList.add('activa');
    }
    
    // Actualizar contenido
    console.log('Llamando a mostrarMaterias()');
    mostrarMaterias();
}

// Aplicar filtros en vista de lista
function aplicarFiltros() {
    if (vistaActual !== 'lista') return;
    
    const filtroAño = document.getElementById('filtro-año').value;
    const filtroEstado = document.getElementById('filtro-estado').value;
    const filtroTipo = document.getElementById('filtro-tipo').value;
    const busqueda = document.getElementById('buscar-materia').value.toLowerCase();
    
    const filas = document.querySelectorAll('#cuerpo-tabla-lista tr');
    
    filas.forEach(fila => {
        const textoMateria = fila.cells[0].textContent.toLowerCase();
        const añoMateria = fila.cells[1].textContent.includes('1°') ? '1' : 
                         fila.cells[1].textContent.includes('2°') ? '2' :
                         fila.cells[1].textContent.includes('3°') ? '3' :
                         fila.cells[1].textContent.includes('4°') ? '4' : '5';
        const estadoMateria = fila.cells[3].textContent.toLowerCase().trim();
        const tipoMateria = fila.cells[2].textContent.toLowerCase().includes('electiva') ? 'electiva' : 'obligatoria';
        
        const cumpleFiltros = 
            (!filtroAño || añoMateria === filtroAño) &&
            (!filtroEstado || estadoMateria.includes(filtroEstado)) &&
            (!filtroTipo || tipoMateria === filtroTipo) &&
            (!busqueda || textoMateria.includes(busqueda));
        
        fila.style.display = cumpleFiltros ? '' : 'none';
    });
}

// Exportar datos
async function exportarDatos() {
    try {
        const response = await fetch(`${API_BASE}/exportar`);
        if (!response.ok) throw new Error('Error exportando datos');
        
        const datos = await response.json();
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `materias_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        mostrarNotificacion('Datos exportados correctamente', 'success');
    } catch (error) {
        console.error('Error exportando:', error);
        mostrarNotificacion('Error exportando datos', 'error');
    }
}

// Mostrar modal de importar
function mostrarImportar() {
    const modal = new bootstrap.Modal(document.getElementById('modalImportar'));
    modal.show();
}

// Importar datos
async function importarDatos() {
    const archivo = document.getElementById('archivo-importar').files[0];
    if (!archivo) {
        alert('Selecciona un archivo para importar');
        return;
    }
    
    try {
        const texto = await archivo.text();
        const datos = JSON.parse(texto);
        
        const response = await fetch(`${API_BASE}/importar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        
        if (!response.ok) throw new Error('Error importando datos');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalImportar'));
        modal.hide();
        
        // Recargar datos
        await cargarDatos();
        
        mostrarNotificacion('Datos importados correctamente', 'success');
        
    } catch (error) {
        console.error('Error importando:', error);
        mostrarNotificacion('Error importando datos. Verifica el formato del archivo.', 'error');
    }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo, duracion = 5000) {
    const color = tipo === 'success' ? 'success' : tipo === 'warning' ? 'warning' : 'danger';
    const icono = tipo === 'success' ? 'check' : tipo === 'warning' ? 'exclamation-triangle' : 'exclamation-triangle';
    
    const div = document.createElement('div');
    div.className = `alert alert-${color} alert-dismissible fade show position-fixed`;
    div.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 500px;';
    div.innerHTML = `
        <i class="fas fa-${icono} me-2"></i>
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(div);
    
    // Auto eliminar después del tiempo especificado
    setTimeout(() => {
        if (div.parentNode) {
            div.parentNode.removeChild(div);
        }
    }, duracion);
}

// Función auxiliar para obtener nombre de materia por número
function obtenerNombreMateria(numero) {
    // Buscar en todas las materias de todos los años
    for (const año in materiasPorAnio) {
        const datos = materiasPorAnio[año];
        
        // Buscar en obligatorias
        if (datos.obligatorias) {
            const materia = datos.obligatorias.find(m => m.numero === numero);
            if (materia) return materia.materia;
        }
        
        // Buscar en electivas
        if (datos.electivas) {
            const materia = datos.electivas.find(m => m.numero === numero);
            if (materia) return materia.materia;
        }
    }
    
    return `Materia ${numero}`;
}

// Función de prueba para vista lista
function probarVistaLista() {
    console.log('=== PRUEBA DE VISTA LISTA ===');
    console.log('vistaActual:', vistaActual);
    console.log('materiasPorAnio:', materiasPorAnio);
    
    const cuerpoTabla = document.getElementById('cuerpo-tabla-lista');
    console.log('cuerpoTabla encontrado:', !!cuerpoTabla);
    
    if (cuerpoTabla) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td><strong>Materia de Prueba</strong></td>
                <td class="text-center"><span class="badge bg-info">1° Año</span></td>
                <td class="text-center"><span class="badge bg-primary">Obligatoria</span></td>
                <td class="text-center"><span class="badge bg-secondary">PENDIENTE</span></td>
                <td class="text-center">-</td>
                <td><small>Ninguna</small></td>
                <td class="text-center"><button class="btn btn-sm btn-outline-primary">Editar</button></td>
            </tr>
        `;
        console.log('Contenido de prueba añadido');
    }
}

// Agregar botón de prueba temporalmente
window.probarVistaLista = probarVistaLista;

// Editar materia - permite modificar cualquier campo
async function editarMateria(id, nombre, estadoActual, nota) {
    materiaActual = { id, nombre, estado: estadoActual, nota };
    
    document.getElementById('modal-titulo').textContent = `Editar: ${nombre}`;
    
    // Establecer estado actual
    document.querySelector(`input[name="estado"][value="${estadoActual}"]`).checked = true;
    
    // Mostrar nota si está aprobada
    if (estadoActual === 'aprobada') {
        document.getElementById('contenedor-nota').style.display = 'block';
        document.getElementById('nota').value = nota || '';
    } else {
        document.getElementById('contenedor-nota').style.display = 'none';
        document.getElementById('nota').value = '';
    }

    // Cargar correlatividades
    await cargarCorrelatividades(id);
    
    const modal = new bootstrap.Modal(document.getElementById('modalEditarMateria'));
    modal.show();
}

// Cargar correlatividades de una materia
async function cargarCorrelatividades(id) {
    try {
        const response = await fetch(`${API_BASE}/correlatividades/${id}`);
        const data = await response.json();
        
        const contenedor = document.getElementById('correlativas-detalle');
        const infoCorrelativas = document.getElementById('info-correlativas');
        
        if (!data.success || data.correlatividades.length === 0) {
            infoCorrelativas.style.display = 'none';
            return;
        }

        let html = '<ul class="list-unstyled">';
        data.correlatividades.forEach(correlativa => {
            const icon = correlativa.cumplida ? 
                '<i class="fas fa-check-circle text-success"></i>' : 
                '<i class="fas fa-times-circle text-danger"></i>';
            
            const estadoTexto = correlativa.cumplida ? 
                `<span class="text-success">${correlativa.estadoActual.toUpperCase()}</span>` : 
                `<span class="text-danger">Pendiente (requiere: ${correlativa.estadoRequerido.toUpperCase()})</span>`;
            
            html += `
                <li class="mb-2">
                    ${icon} <strong>${correlativa.nombre}</strong><br>
                    <small class="ms-3">${estadoTexto}</small>
                </li>
            `;
        });
        html += '</ul>';

        contenedor.innerHTML = html;
        infoCorrelativas.style.display = 'block';
    } catch (error) {
        console.error('Error cargando correlatividades:', error);
        document.getElementById('info-correlativas').style.display = 'none';
    }
}

// Guardar estado de la materia
async function guardarEstado() {
    if (!materiaActual) return;

    const estadoSeleccionado = document.querySelector('input[name="estado"]:checked').value;
    const notaInput = document.getElementById('nota');
    let nota = null;

    // Validar nota si es aprobada
    if (estadoSeleccionado === 'aprobada') {
        nota = parseFloat(notaInput.value);
        if (!nota || nota < 1 || nota > 10) {
            mostrarNotificacion('La nota debe estar entre 1 y 10 para materias aprobadas', 'error');
            return;
        }
    }

    try {
        const response = await fetch(`${API_BASE}/materias/${materiaActual.id}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo: estadoSeleccionado,
                nota: nota
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            mostrarNotificacion('Estado actualizado correctamente', 'success');
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalEditarMateria')).hide();
            
            // Recargar datos
            await cargarDatos();
        } else if (response.status === 423) {
            // Materia bloqueada - mostrar mensaje informativo
            mostrarNotificacion(`🔒 ${data.error}`, 'error', 6000);
        } else {
            mostrarNotificacion(data.error || 'Error actualizando el estado', 'error');
        }
    } catch (error) {
        console.error('Error guardando estado:', error);
        mostrarNotificacion('Error de conexión al guardar', 'error');
    }
}

// Mostrar mensaje cuando se intenta editar una materia bloqueada
function mostrarMensajeBloqueada(nombreMateria) {
    mostrarNotificacion(
        `⚠️ ${nombreMateria} está bloqueada. Pero puedes editarla haciendo clic en el botón de información.`, 
        'warning'
    );
}

// Mostrar mensaje cuando se intenta editar una materia bloqueada
function mostrarMensajeBloqueada(nombreMateria) {
    mostrarNotificacion(
        `🔒 ${nombreMateria} está bloqueada. Completa las correlatividades requeridas para poder editarla.`, 
        'warning',
        4000
    );
}

// Exportar reporte en PDF
async function exportarPDF() {
    try {
        mostrarNotificacion('Generando reporte PDF...', 'info', 3000);
        
        const response = await fetch(`${API_BASE}/exportar-pdf`);
        if (!response.ok) throw new Error('Error generando PDF');
        
        // Obtener el PDF como blob
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Generar nombre de archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `reporte_academico_${fecha}.pdf`;
        
        // Crear enlace de descarga
        const a = document.createElement('a');
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        mostrarNotificacion('📄 Reporte PDF generado correctamente', 'success', 4000);
    } catch (error) {
        console.error('Error generando PDF:', error);
        mostrarNotificacion('Error generando reporte PDF', 'error');
    }
}
