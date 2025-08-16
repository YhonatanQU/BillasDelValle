
    // Configuración de productos
    const products = {
        'snack': { name: 'Snack', price: 3 },
        'soda': { name: 'Gaseosa', price: 5 },
        'water': { name: 'Agua', price: 2 },
        'beer': { name: 'Cerveza', price: 8 },
        'cigarettes': { name: 'Cigarrillos', price: 12 },
        'candy': { name: 'Dulces', price: 1 }
    };
    
    // Configuración de mesas
    const tablesConfig = [
        { id: 'table-1', number: 1, status: 'free' },
        { id: 'table-2', number: 2, status: 'free' },
        { id: 'table-3', number: 3, status: 'free' },
        { id: 'table-4', number: 4, status: 'free' }
    ];
    
    // Paleta de colores Te Papa Green
    const colors = {
        primary: {
            50: '#f0f9f5',
            100: '#daf1e5',
            200: '#b8e2cf',
            300: '#89ccb3',
            400: '#57b091',
            500: '#359476',
            600: '#25765e',
            700: '#1d5f4c',
            800: '#1a4b3d',
            900: '#153c32',
            950: '#0b231d'
        },
        secondary: '#f59e0b', // Color complementario amarillo-ámbar
        danger: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b'
    };
    
    // Estado de la aplicación
    const appState = {
        currentTable: null,
        tables: {},
        hourRate: 5,
        splitMode: 'equal'
    };

    /* FUNCIONES AUXILIARES */
    
    function formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function calculateCost(seconds) {
        const hours = seconds / 3600;
        return Math.ceil(hours * appState.hourRate);
    }

    function renderPlayersList(tableId) {
        const table = appState.tables[tableId];
        if (!table || table.players.length === 0) {
            return '<div style="text-align: center; color: ' + colors.primary[700] + ';">No hay jugadores</div>';
        }
        
        return table.players.map(player => `
            <span style="display: inline-block; background: ${colors.primary[100]}; 
                         color: ${colors.primary[800]}; padding: 0.25rem 0.5rem; 
                         border-radius: 20px; font-size: 0.8rem; margin-right: 0.5rem; margin-bottom: 0.5rem;">
                ${player.name} 
                <small style="color: ${colors.primary[600]};">(${player.products.reduce((sum, p) => sum + (p.price * p.quantity), 0)} PEN)</small>
            </span>
        `).join('');
    }

    function renderProductsList(tableId) {
        const table = appState.tables[tableId];
        if (!table) return `<li style="text-align: center; color: ${colors.primary[700]};">No hay productos</li>`;
        
        const allProducts = [];
        table.players.forEach(player => {
            player.products.forEach(product => {
                allProducts.push({
                    ...product,
                    playerName: player.name
                });
            });
        });
        
        return allProducts.length > 0 ? 
            allProducts.map(product => `
                <li style="display: flex; justify-content: space-between; padding: 0.5rem; 
                           border-bottom: 1px solid ${colors.primary[100]};">
                    <span style="font-weight: 500; color: ${colors.primary[800]};">
                        ${product.quantity}x ${product.name} (${product.playerName}) 
                    </span>
                    <span style="font-weight: bold; color: ${colors.primary[600]};">${product.price * product.quantity} PEN</span>
                </li>
            `).join('') : 
            `<li style="text-align: center; color: ${colors.primary[700]};">No hay productos</li>`;
    }

    function calculateTotal(tableId) {
        const table = appState.tables[tableId];
        if (!table) return 0;
        
        const timeCost = calculateCost(table.timer);
        const productsCost = table.players.reduce((sum, player) => {
            return sum + player.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        }, 0);
        
        return timeCost + productsCost;
    }

    /* FUNCIONES PRINCIPALES */

    function initialRenderTables() {
        const dashboard = document.getElementById('tables-dashboard');
        dashboard.innerHTML = '';
        
        tablesConfig.forEach(table => {
            if (!appState.tables[table.id]) {
                appState.tables[table.id] = {
                    status: table.status,
                    timer: 0,
                    interval: null,
                    players: [],
                    currentHourNotification: false
                };
            }
            createTableElement(table.id);
        });
    }

    function createTableElement(tableId) {
        // Si el elemento ya existe, no lo recreamos
        if (document.getElementById(tableId)) {
            updateTableElement(tableId);
            return;
        }

        const tableConfig = tablesConfig.find(t => t.id === tableId);
        const tableData = appState.tables[tableId];
        
        const tableElement = document.createElement('div');
        tableElement.style.cssText = `
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
            padding: 1.5rem;
            transition: transform 0.3s ease;
            position: relative;
            overflow: hidden;
            border-left: 5px solid ${tableData.status === 'free' ? colors.success : colors.secondary};
        `;
        tableElement.id = tableId;
        
        tableElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <div style="font-size: 1.3rem; font-weight: bold; color: ${colors.primary[800]}">Mesa ${tableConfig.number}</div>
                <div style="padding: 0.25rem 0.5rem; border-radius: 20px; font-size: 0.8rem; 
                            font-weight: 500; color: white; background: ${tableData.status === 'free' ? colors.success : colors.secondary}">
                    ${tableData.status === 'free' ? 'Libre' : 'Ocupada'}
                </div>
            </div>
            <div style="font-size: 1.8rem; text-align: center; margin: 1rem 0; 
                        font-family: 'Courier New', monospace; font-weight: bold; 
                        color: ${colors.primary[800]}; ${tableData.status === 'occupied' ? 'animation: pulse 2s infinite;' : ''}">
                ${formatTime(tableData.timer)}
            </div>
            <div style="text-align: center; font-size: 1.2rem; margin-bottom: 1rem;">
                Costo: <span style="font-weight: bold; color: ${colors.primary[600]}">${calculateCost(tableData.timer)} PEN</span>
            </div>
            <div style="position: absolute; top: 10px; right: 10px; background: ${colors.warning}; 
                        color: ${colors.primary[900]}; padding: 0.25rem 0.5rem; border-radius: 20px; 
                        font-size: 0.7rem; font-weight: bold; opacity: 0; transition: opacity 0.3s ease;">
                ¡Nueva hora!
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                <button onclick="startTimer('${tableId}')"
                        style="flex: 1; padding: 0.5rem 1rem; border: none; border-radius: 5px; 
                               cursor: pointer; font-weight: 500; transition: all 0.2s ease;
                               display: flex; align-items: center; justify-content: center; gap: 5px;
                               background: ${colors.primary[500]}; color: white;">
                    Iniciar
                </button>
                <button onclick="${tableData.status === 'occupied' ? `pauseTimer('${tableId}')` : ''}"
                        style="flex: 1; padding: 0.5rem 1rem; border: none; border-radius: 5px; 
                               cursor: pointer; font-weight: 500; transition: all 0.2s ease;
                               display: flex; align-items: center; justify-content: center; gap: 5px;
                               background: ${colors.secondary}; color: white; ${tableData.status === 'free' ? 'opacity: 0.6; cursor: not-allowed;' : ''}">
                    Pausar
                </button>
            </div>
            
            ${tableData.status === 'occupied' ? `
            <div style="margin-bottom: 1rem; border-bottom: 1px solid ${colors.primary[100]}; padding-bottom: 1rem;">
                <div style="font-size: 1rem; margin-bottom: 0.5rem; color: ${colors.primary[600]}">Jugadores:</div>
                <div style="list-style: none; max-height: 100px; overflow-y: auto; margin-bottom: 0.5rem; 
                            border: 1px solid ${colors.primary[100]}; border-radius: 5px; padding: 0.5rem;" 
                     id="${tableId}-players-list">
                    ${renderPlayersList(tableId)}
                </div>
                <button onclick="addPlayerModal('${tableId}')"
                        style="width: 100%; padding: 0.5rem; border: none; border-radius: 5px; 
                               cursor: pointer; font-weight: 500; background: ${colors.success}; color: white;">
                    + Agregar Jugador
                </button>
            </div>
            
            <div style="margin-top: 1rem;">
                <div style="font-size: 1rem; margin-bottom: 0.5rem; color: ${colors.primary[600]}">Productos consumidos:</div>
                <ul style="list-style: none; max-height: 150px; overflow-y: auto; margin-bottom: 1rem; 
                           border: 1px solid ${colors.primary[100]}; border-radius: 5px; padding: 0.5rem;" 
                    id="${tableId}-products">
                    ${renderProductsList(tableId)}
                </ul>
                ${tableData.players.length > 0 ? `
                <button onclick="addProductModal('${tableId}')"
                        style="width: 100%; padding: 0.5rem; border: none; border-radius: 5px; 
                               cursor: pointer; font-weight: 500; background: ${colors.primary[500]}; color: white;">
                    + Agregar Producto
                </button>
                ` : `
                <p style="text-align: center; color: ${colors.primary[500]};">Agregue jugadores para registrar productos</p>
                `}
            </div>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: ${colors.primary[50]}; border-radius: 8px;">
                <div style="font-size: 1.1rem; margin-bottom: 0.5rem; color: ${colors.primary[700]}">Total parcial:</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: ${colors.primary[600]}">${calculateTotal(tableId)} PEN</div>
                
                <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                    <button onclick="showSplitModal('${tableId}')"
                            style="flex: 1; padding: 0.5rem; border: none; border-radius: 5px; 
                                   cursor: pointer; font-weight: 500; background: ${colors.primary[500]}; color: white;">
                        Dividir Cuenta
                    </button>
                    <button onclick="showBill('${tableId}')"
                            style="flex: 1; padding: 0.5rem; border: none; border-radius: 5px; 
                                   cursor: pointer; font-weight: 500; background: ${colors.success}; color: white;">
                        Generar Cuenta
                    </button>
                </div>
            </div>
            ` : ''}
        `;
        
        document.getElementById('tables-dashboard').appendChild(tableElement);
    }

    // [CONTINÚA CON EL RESTO DEL CÓDIGO EXACTAMENTE COMO EN LA VERSIÓN ANTERIOR]
    // ... (las funciones updateTableElement, startTimer, pauseTimer, stopTimer, etc. permanecen iguales) ...

    /* INICIALIZACIÓN */

    function initApp() {
        // Primero agregamos los estilos dinámicamente
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.7; }
                100% { opacity: 1; }
            }
            
            body {
                background-color: ${colors.primary[50]};
                color: ${colors.primary[900]};
            }
            
            header {
                background: linear-gradient(135deg, ${colors.primary[600]}, ${colors.primary[800]});
                color: white;
            }
            
            .modal-content {
                background: white;
                border: 1px solid ${colors.primary[200]};
            }
            
            .tab.active {
                border-bottom-color: ${colors.primary[500]};
            }
        `;
        document.head.appendChild(style);

        initialRenderTables();
        updateClock();
        setInterval(updateClock, 1000);
        
        // [EL RESTO DEL CÓDIGO DE INITAPP PERMANECE IGUAL]
    }

    document.addEventListener('DOMContentLoaded', initApp);
