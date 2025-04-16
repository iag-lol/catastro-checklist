// pendientes-flota.js - Funcionalidad para Pendientes de Flota
(function() {
    // Almacenará los datos de buses pendientes
    let pendientesFlotaData = [];
    let currentFilteredData = []; // Almacena los datos filtrados actuales para el PDF
    
    // Referencias a elementos DOM
    let domElements = {};

    // Inicializar inmediatamente
    inicializarPendientesFlota();
    
    // También esperar a que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // Reiniciar inicialización para asegurar que funcione
        inicializarPendientesFlota();
        
        // Configurar event listeners cuando el DOM esté listo
        setupEventListeners();
        
        // Inicializar periódicamente para asegurar la integración con la app principal
        let initInterval = setInterval(function() {
            const historialBtn = document.getElementById('historial-bus-btn');
            const pendientesBtn = document.getElementById('pendientes-flota-btn');
            
            if (historialBtn && !pendientesBtn) {
                inicializarPendientesFlota();
                setupEventListeners();
            } else if (pendientesBtn) {
                // Asegurar que el botón esté activo
                pendientesBtn.disabled = false;
                pendientesBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                pendientesBtn.classList.add('bg-indigo-500', 'hover:bg-indigo-600', 'text-white', 'cursor-pointer');
                
                // Si ya está todo configurado, limpiar el intervalo
                clearInterval(initInterval);
            }
        }, 500);
    });
    
    /**
     * Inicializa la funcionalidad de Pendientes Flota
     * Agrega HTML y CSS necesarios a la página
     */
    function inicializarPendientesFlota() {
        // 1. Agregar botón junto al historial-bus-btn (o al formulario si no existe)
        const historialBtn = document.getElementById('historial-bus-btn');
        const existingBtn = document.getElementById('pendientes-flota-btn');
        
        // Si el botón ya existe, no crear otro
        if (existingBtn) return;
        
        if (historialBtn && historialBtn.parentNode) {
            const pendientesBtn = document.createElement('button');
            pendientesBtn.id = 'pendientes-flota-btn';
            pendientesBtn.className = 'btn bg-indigo-500 hover:bg-indigo-600 text-white ml-2 flex items-center justify-center px-4 py-2 rounded-md cursor-pointer';
            pendientesBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Pendientes Flota
            `;
            historialBtn.parentNode.appendChild(pendientesBtn);
        } else {
            // Si no encontramos el botón de historial, buscar el formulario
            const registroForm = document.getElementById('registro-form');
            if (registroForm) {
                const formHeader = registroForm.querySelector('h2, h3, .form-header');
                if (formHeader) {
                    // Crear un contenedor para botones si no existe
                    let buttonsContainer = formHeader.nextElementSibling;
                    if (!buttonsContainer || !buttonsContainer.classList.contains('form-buttons')) {
                        buttonsContainer = document.createElement('div');
                        buttonsContainer.className = 'form-buttons flex items-center justify-start mb-4';
                        formHeader.parentNode.insertBefore(buttonsContainer, formHeader.nextSibling);
                    }
                    
                    // Crear botón
                    const pendientesBtn = document.createElement('button');
                    pendientesBtn.id = 'pendientes-flota-btn';
                    pendientesBtn.className = 'btn bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center px-4 py-2 rounded-md cursor-pointer';
                    pendientesBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Pendientes Flota
                    `;
                    buttonsContainer.appendChild(pendientesBtn);
                }
            }
        }
        
        // 2. Agregar modal al final del body
        let modalContainer = document.getElementById('pendientes-flota-modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'pendientes-flota-modal-container';
            
            const modalHTML = `
            <!-- Modal para pendientes de la flota -->
            <div id="pendientes-flota-modal" class="modal">
                <div class="modal-content max-w-4xl">
                    <div class="modal-header">
                        <h3 id="pendientes-flota-title" class="text-lg font-semibold">Flota Pendiente por Revisar</h3>
                        <button id="close-pendientes-flota-button" class="modal-close">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-4">
                            <label for="filtro-terminal-pendientes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filtrar por Terminal:</label>
                            <select id="filtro-terminal-pendientes" class="select w-full">
                                <option value="">Todos los Terminales</option>
                            </select>
                        </div>
                        
                        <div id="pendientes-flota-container" class="overflow-x-auto">
                            <table id="tabla-pendientes-flota" class="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                                <thead class="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">N° Interno</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PPU</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Terminal</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ubicación</th>
                                    </tr>
                                </thead>
                                <tbody id="pendientes-flota-body" class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    <!-- Aquí se llenarán las filas dinámicamente -->
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="mt-4 flex justify-end">
                            <button id="imprimir-pendientes-btn" class="btn btn-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Descargar PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            `;
            
            modalContainer.innerHTML = modalHTML;
            document.body.appendChild(modalContainer);
        }
        
        // 3. Agregar estilos CSS
        let styleElement = document.getElementById('pendientes-flota-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'pendientes-flota-styles';
            styleElement.textContent = `
            /* Estilos para el modal de pendientes */
            #pendientes-flota-btn {
                transition: all 0.2s;
            }
            
            #pendientes-flota-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            
            #pendientes-flota-modal .modal-content {
                max-width: 95%;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            #pendientes-flota-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                align-items: center;
                justify-content: center;
            }
            
            #pendientes-flota-modal.active {
                display: flex;
            }
            
            #pendientes-flota-modal .modal-content {
                background-color: white;
                border-radius: 0.5rem;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 800px;
                position: relative;
            }
            
            .dark #pendientes-flota-modal .modal-content {
                background-color: #1f2937;
                color: #f3f4f6;
            }
            
            #pendientes-flota-modal .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .dark #pendientes-flota-modal .modal-header {
                border-bottom: 1px solid #374151;
            }
            
            #pendientes-flota-modal .modal-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #6b7280;
            }
            
            #pendientes-flota-modal .modal-close:hover {
                color: #ef4444;
            }
            
            #pendientes-flota-modal .modal-body {
                padding: 1rem;
            }
            
            #tabla-pendientes-flota {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
            }
            
            #tabla-pendientes-flota th {
                position: sticky;
                top: 0;
                z-index: 10;
            }
            
            @media (max-width: 640px) {
                #tabla-pendientes-flota {
                    font-size: 0.8rem;
                }
                
                #tabla-pendientes-flota th,
                #tabla-pendientes-flota td {
                    padding: 0.5rem 0.25rem;
                }
            }
            
            /* Estilos específicos para impresión (ya no necesarios, pero se mantienen por compatibilidad) */
            @media print {
                body * {
                    visibility: hidden;
                }
                
                #pendientes-flota-modal, 
                #pendientes-flota-modal * {
                    visibility: visible;
                }
                
                #pendientes-flota-modal {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    background: white;
                    z-index: 9999;
                }
                
                #close-pendientes-flota-button,
                #imprimir-pendientes-btn,
                .modal-header button,
                #filtro-terminal-pendientes,
                label[for="filtro-terminal-pendientes"],
                .no-print {
                    display: none !important;
                }
                
                #pendientes-flota-title {
                    font-size: 18pt;
                    margin-bottom: 20px;
                    text-align: center;
                }
                
                #tabla-pendientes-flota {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                #tabla-pendientes-flota th,
                #tabla-pendientes-flota td {
                    border: 1px solid #cccccc;
                    padding: 10px;
                    text-align: left;
                }
                
                #tabla-pendientes-flota th {
                    background-color: #f2f2f2 !important;
                    color: black !important;
                }
                
                #pendientes-flota-container {
                    page-break-inside: avoid;
                }
            }
            `;
            document.head.appendChild(styleElement);
        }
        
        // 4. Guardar referencias a elementos DOM
        domElements = {
            pendientesFlotaBtn: document.getElementById('pendientes-flota-btn'),
            pendientesFlotaModal: document.getElementById('pendientes-flota-modal'),
            closePendientesFlotaButton: document.getElementById('close-pendientes-flota-button'),
            filtroTerminalPendientes: document.getElementById('filtro-terminal-pendientes'),
            pendientesFlotaBody: document.getElementById('pendientes-flota-body'),
            imprimirPendientesBtn: document.getElementById('imprimir-pendientes-btn'),
            pendientesFlotaTitle: document.getElementById('pendientes-flota-title')
        };
    }
    
    /**
     * Configura los event listeners para la funcionalidad
     */
    function setupEventListeners() {
        // Asegurarse de que los elementos están disponibles
        if (!domElements.pendientesFlotaBtn) {
            domElements.pendientesFlotaBtn = document.getElementById('pendientes-flota-btn');
            if (!domElements.pendientesFlotaBtn) return; // Salir si aún no existe
        }
        
        // Verificar si ya tiene el evento (para evitar duplicados)
        if (domElements.pendientesFlotaBtn.getAttribute('data-has-click') === 'true') return;
        
        // Botón de mostrar pendientes - usar onclick para mayor compatibilidad
        domElements.pendientesFlotaBtn.onclick = function(e) {
            e.preventDefault();
            mostrarPendientesFlota();
        };
        domElements.pendientesFlotaBtn.setAttribute('data-has-click', 'true');
        
        // Asegurar que el botón esté activo
        domElements.pendientesFlotaBtn.disabled = false;
        
        // Botón cerrar modal
        if (domElements.closePendientesFlotaButton) {
            domElements.closePendientesFlotaButton.onclick = function() {
                closeModal(domElements.pendientesFlotaModal);
            };
        }
        
        // Cerrar modal al hacer clic fuera
        if (domElements.pendientesFlotaModal) {
            domElements.pendientesFlotaModal.onclick = function(event) {
                if (event.target === domElements.pendientesFlotaModal) {
                    closeModal(domElements.pendientesFlotaModal);
                }
            };
        }
        
        // Filtro de terminal
        if (domElements.filtroTerminalPendientes) {
            domElements.filtroTerminalPendientes.onchange = filtrarPendientesFlota;
        }
        
        // Botón descargar PDF
        if (domElements.imprimirPendientesBtn) {
            domElements.imprimirPendientesBtn.onclick = imprimirPendientesFlota;
        }
    }
    
    /**
     * Muestra el modal con los buses pendientes por revisar
     */
    async function mostrarPendientesFlota() {
        // Verificar si existe supabaseClient (definido en el script principal)
        if (typeof window.supabaseClient === 'undefined' && typeof supabaseClient === 'undefined') {
            // Intentar conectar directamente a Supabase con las credenciales del sistema
            conectarSupabase();
        }
        
        // Obtener cliente de Supabase (global o local)
        const client = window.supabaseClient || supabaseClient;
        
        if (!client || !domElements.pendientesFlotaBtn || !domElements.pendientesFlotaModal || !domElements.pendientesFlotaBody) {
            alert('Error: No se pueden mostrar los pendientes. No hay conexión a la base de datos.');
            return;
        }
        
        // Mostrar modal y estado de carga
        openModal(domElements.pendientesFlotaModal);
        domElements.pendientesFlotaBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-10 text-center">
                    <div class="inline-block animate-spin w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
                    <span class="text-gray-500 dark:text-gray-400">Cargando pendientes...</span>
                </td>
            </tr>`;
        
        try {
            // Llenar select de terminales
            await populateTerminalSelect(domElements.filtroTerminalPendientes, null, true, 'Todos los Terminales');
            
            // Obtener el terminal actualmente seleccionado en el formulario
            const terminalSelect = document.getElementById('terminal');
            if (terminalSelect && terminalSelect.value) {
                domElements.filtroTerminalPendientes.value = terminalSelect.value;
            }
            
            // Cargar los buses pendientes
            await cargarPendientesFlota();
            
        } catch (error) {
            console.error("Error en mostrarPendientesFlota:", error);
            domElements.pendientesFlotaBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-6 text-center">
                        <div class="bg-red-50 dark:bg-red-900/30 p-3 rounded-md border border-red-200 dark:border-red-900 inline-block text-red-500 dark:text-red-400">
                            Error al cargar pendientes: ${error.message}
                        </div>
                    </td>
                </tr>`;
        }
    }
    
    /**
     * Intenta conectarse a Supabase si no hay conexión global
     */
    function conectarSupabase() {
        // Si ya tenemos conexión, no hacer nada
        if (window.supabaseClient || supabaseClient) return;
        
        // Intentar obtener las credenciales desde las variables globales
        const SUPABASE_URL = window.SUPABASE_URL || 'https://tcmtxvuucjttngcazgff.supabase.co';
        const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbXR4dnV1Y2p0dG5nY2F6Z2ZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3MjUwMDEsImV4cCI6MjA1NjMwMTAwMX0.2WcIjMUEhSM6j9kYpbsYArQocZdHx86k7wXk-NyjIs0';
        
        // Verificar si la librería Supabase está disponible
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            // Crear cliente local
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log("Cliente Supabase inicializado localmente para pendientes-flota.js");
        }
    }
    
    /**
     * Carga los datos de buses pendientes por revisar
     */
    async function cargarPendientesFlota() {
        const terminalId = domElements.filtroTerminalPendientes?.value || '';
        
        // Obtener cliente de Supabase (global o local)
        const client = window.supabaseClient || supabaseClient;
        if (!client) throw new Error("No hay conexión a la base de datos");
        
        try {
            // Consultar buses que no tienen inspección reciente (últimos 30 días)
            const fecha30DiasAtras = new Date();
            fecha30DiasAtras.setDate(fecha30DiasAtras.getDate() - 30);
            
            // Primero obtenemos todos los buses
            let queryBuses = client
                .from('CatastroExtintor_buses')
                .select(`
                    ppu, numero_interno, terminal_id,
                    terminal:CatastroExtintor_terminales(nombre)
                `)
                .order('numero_interno');
            
            if (terminalId) {
                queryBuses = queryBuses.eq('terminal_id', terminalId);
            }
            
            const { data: allBuses, error: busesError } = await queryBuses;
            
            if (busesError) throw busesError;
            
            // Ahora obtenemos las inspecciones recientes
            const { data: inspeccionesRecientes, error: inspError } = await client
                .from('CatastroExtintor_inspecciones')
                .select('bus_ppu, fecha_inspeccion')
                .gte('fecha_inspeccion', fecha30DiasAtras.toISOString());
            
            if (inspError) throw inspError;
            
            // Creamos un set con las PPU de buses inspeccionados recientemente
            const busesInspeccionados = new Set();
            inspeccionesRecientes.forEach(insp => {
                busesInspeccionados.add(insp.bus_ppu);
            });
            
            // Filtramos buses que NO están en el set (no inspeccionados)
            pendientesFlotaData = allBuses.filter(bus => !busesInspeccionados.has(bus.ppu));
            
            // Mostrar los resultados
            mostrarTablaFlotaPendiente(pendientesFlotaData);
            
        } catch (error) {
            console.error("Error cargando pendientes:", error);
            throw error;
        }
    }
    
    /**
     * Muestra la tabla de flota pendiente
     * @param {Array} data - Lista de buses pendientes
     */
    function mostrarTablaFlotaPendiente(data) {
        currentFilteredData = data; // Actualizar datos filtrados para el PDF
        
        if (!domElements.pendientesFlotaBody) return;
        
        if (!data || data.length === 0) {
            domElements.pendientesFlotaBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                        No hay buses pendientes por revisar en este terminal.
                    </td>
                </tr>`;
            return;
        }
        
        // Limpiar tabla
        domElements.pendientesFlotaBody.innerHTML = '';
        
        // Llenar tabla con datos
        data.forEach(bus => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-700';
            
            // Formatear los datos
            const numInterno = bus.numero_interno || 'N/A';
            const ppu = bus.ppu || 'N/A';
            const terminal = bus.terminal?.nombre || 'N/A';
            
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${numInterno}</td>
                <td class="px-6 py-4 whitespace-nowrap">${ppu}</td>
                <td class="px-6 py-4 whitespace-nowrap">${terminal}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                        PENDIENTE
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap"></td>
            `;
            
            domElements.pendientesFlotaBody.appendChild(tr);
        });
        
        // Actualizar título con el conteo
        if (domElements.pendientesFlotaTitle) {
            domElements.pendientesFlotaTitle.textContent = `Flota Pendiente por Revisar (${data.length} buses)`;
        }
    }
    
    /**
     * Filtra los buses pendientes por terminal
     */
    function filtrarPendientesFlota() {
        if (!pendientesFlotaData.length) return;
        
        const terminalId = domElements.filtroTerminalPendientes?.value || '';
        
        let filteredData;
        if (terminalId) {
            filteredData = pendientesFlotaData.filter(bus => bus.terminal_id === terminalId);
        } else {
            filteredData = [...pendientesFlotaData];
        }
        
        mostrarTablaFlotaPendiente(filteredData);
    }
    
    /**
     * Genera y descarga un PDF con la tabla de pendientes
     */
    function imprimirPendientesFlota() {
        if (!currentFilteredData || currentFilteredData.length === 0) {
            alert('No hay datos para generar el PDF.');
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('Error: La librería jsPDF no está cargada correctamente.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const terminalSelect = domElements.filtroTerminalPendientes;
        const terminalSeleccionado = terminalSelect.options[terminalSelect.selectedIndex].text;
        const totalBuses = currentFilteredData.length;
        const fecha = new Date().toLocaleDateString('es-CL');
        
        // Título
        doc.setFontSize(18);
        doc.text('Flota Pendiente por Revisar', 14, 22);
        
        // Subtítulos
        doc.setFontSize(12);
        if (terminalSeleccionado !== 'Todos los Terminales') {
            doc.text(`Terminal: ${terminalSeleccionado}`, 14, 32);
        }
        doc.text(`Total buses: ${totalBuses}`, 14, 42);
        doc.text(`Generado el: ${fecha}`, 14, 52);
        
        // Definir columnas de la tabla
        const columns = [
            { header: 'N° Interno', dataKey: 'numero_interno' },
            { header: 'PPU', dataKey: 'ppu' },
            { header: 'Terminal', dataKey: 'terminal' },
            { header: 'Estado', dataKey: 'estado' },
            { header: 'Ubicación', dataKey: 'ubicacion' }
        ];
        
        // Mapear datos para la tabla
        const tableData = currentFilteredData.map(bus => ({
            numero_interno: bus.numero_interno || 'N/A',
            ppu: bus.ppu || 'N/A',
            terminal: bus.terminal?.nombre || 'N/A',
            estado: 'PENDIENTE',
            ubicacion: '' // Puede ajustarse si hay datos reales
        }));
        
        // Generar tabla en el PDF
        doc.autoTable({
            columns: columns,
            body: tableData,
            startY: 60,
            theme: 'grid',
            styles: { fontSize: 10 },
            headStyles: { fillColor: [22, 160, 133] }, // Color verde para el encabezado
        });
        
        // Nombre del archivo con fecha
        const fechaStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
        const nombreArchivo = `pendientes_flota_${fechaStr}.pdf`;
        
        // Descargar el PDF
        doc.save(nombreArchivo);
    }
    
    /**
     * Abre un modal
     * @param {HTMLElement} modal - Modal a abrir
     */
    function openModal(modal) {
        if (!modal) return;
        
        // Si existe la función global, usarla
        if (typeof window.openModal === 'function') {
            window.openModal(modal);
        } else {
            // Implementación propia
            modal.classList.add('active');
            document.body.classList.add('overflow-hidden');
        }
    }
    
    /**
     * Cierra un modal
     * @param {HTMLElement} modal - Modal a cerrar
     */
    function closeModal(modal) {
        if (!modal) return;
        
        // Si existe la función global, usarla
        if (typeof window.closeModal === 'function') {
            window.closeModal(modal);
        } else {
            // Implementación propia
            modal.classList.remove('active');
            document.body.classList.remove('overflow-hidden');
        }
    }
    
    /**
     * Llena un select con las opciones de terminales
     */
    async function populateTerminalSelect(selectElement, errorContainer, includeAllOption = false, defaultText = 'Seleccione...') {
        // Si existe la función global, usarla
        if (typeof window.populateTerminalSelect === 'function') {
            return window.populateTerminalSelect(selectElement, errorContainer, includeAllOption, defaultText);
        }
        
        // Implementación propia simplificada
        if (!selectElement) return;
        
        // Obtener cliente de Supabase (global o local)
        const client = window.supabaseClient || supabaseClient;
        if (!client) throw new Error("No hay conexión a la base de datos");
        
        selectElement.innerHTML = `<option value="">Cargando...</option>`;
        selectElement.disabled = true;
        
        try {
            const { data, error } = await client
                .from('CatastroExtintor_terminales')
                .select('id, nombre')
                .order('nombre');
                
            if (error) throw error;
            
            if (data.length === 0) {
                selectElement.innerHTML = `<option value="">No hay terminales</option>`;
                if (errorContainer) errorContainer.textContent = 'No se encontraron terminales.';
            } else {
                selectElement.innerHTML = includeAllOption
                    ? `<option value="">${defaultText}</option>`
                    : `<option value="">${defaultText}</option>`;
                    
                data.forEach(t => {
                    selectElement.appendChild(new Option(t.nombre, t.id));
                });
                
                selectElement.disabled = false;
            }
        } catch (error) {
            console.error("Error cargando terminales:", error);
            selectElement.innerHTML = `<option value="">Error al cargar</option>`;
            if (errorContainer) errorContainer.textContent = `Error: ${error.message}`;
        }
    }
    
})();