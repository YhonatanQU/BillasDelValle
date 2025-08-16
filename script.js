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
        return '<div style="text-align: center; color: var(--te-papa-green-700);">No hay jugadores</div>';
    }
    
    return table.players.map(player => `
        <span class="player-tag">
            ${player.name} 
            <small>(${player.products.reduce((sum, p) => sum + (p.price * p.quantity), 0)} PEN)</small>
        </span>
    `).join('');
}

function renderProductsList(tableId) {
    const table = appState.tables[tableId];
    if (!table) return '<li style="text-align: center; color: var(--te-papa-green-700);">No hay productos</li>';
    
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
            <li class="product-item">
                <span class="product-name">
                    ${product.quantity}x ${product.name} (${product.playerName}) 
                </span>
                <span class="product-price">${product.price * product.quantity} PEN</span>
            </li>
        `).join('') : 
        '<li style="text-align: center; color: var(--te-papa-green-700);">No hay productos</li>';
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
    if (document.getElementById(tableId)) {
        updateTableElement(tableId);
        return;
    }

    const tableConfig = tablesConfig.find(t => t.id === tableId);
    const tableData = appState.tables[tableId];
    
    const tableElement = document.createElement('div');
    tableElement.className = `table-card ${tableData.status}`;
    tableElement.id = tableId;
    
    tableElement.innerHTML = `
        <div class="table-header">
            <div class="table-number">Mesa ${tableConfig.number}</div>
            <div class="table-status status-${tableData.status}">${tableData.status === 'free' ? 'Libre' : 'Ocupada'}</div>
        </div>
        <div class="timer-display ${tableData.status === 'occupied' ? 'timer-active' : ''}">${formatTime(tableData.timer)}</div>
        <div class="cost-display">Costo: <span class="cost-amount">${calculateCost(tableData.timer)} PEN</span></div>
        <div class="hour-notification">¡Nueva hora!</div>
        
        <div class="btn-group">
            <button class="btn btn-primary" onclick="startTimer('${tableId}')">Iniciar</button>
            <button class="btn btn-secondary" onclick="${tableData.status === 'occupied' ? `pauseTimer('${tableId}')` : ''}" ${tableData.status === 'free' ? 'disabled' : ''}>
                Pausar
            </button>
        </div>
        
        ${tableData.status === 'occupied' ? `
        <div class="players-section">
            <div class="players-title">Jugadores:</div>
            <div class="players-list" id="${tableId}-players-list">${renderPlayersList(tableId)}</div>
            <button class="btn btn-success" style="width: 100%;" onclick="addPlayerModal('${tableId}')">+ Agregar Jugador</button>
        </div>
        
        <div class="products-section">
            <div class="products-title">Productos consumidos:</div>
            <ul class="products-list" id="${tableId}-products">${renderProductsList(tableId)}</ul>
            ${tableData.players.length > 0 ? `
            <button class="btn btn-primary" style="width: 100%;" onclick="addProductModal('${tableId}')">+ Agregar Producto</button>
            ` : '<p style="text-align: center; color: var(--te-papa-green-500);">Agregue jugadores para registrar productos</p>'}
        </div>
        
        <div class="total-section">
            <div class="total-title">Total parcial:</div>
            <div class="total-amount">${calculateTotal(tableId)} PEN</div>
            
            <div class="split-buttons">
                <button class="btn btn-primary" style="flex: 1;" onclick="showSplitModal('${tableId}')">Dividir Cuenta</button>
                <button class="btn btn-success" style="flex: 1;" onclick="showBill('${tableId}')">Generar Cuenta</button>
            </div>
        </div>
        ` : ''}
    `;
    
    document.getElementById('tables-dashboard').appendChild(tableElement);
}

function updateTableElement(tableId) {
    const tableElement = document.getElementById(tableId);
    if (!tableElement) return;
    
    const tableData = appState.tables[tableId];
    
    // Actualizar clase principal
    tableElement.className = `table-card ${tableData.status}`;
    
    // Actualizar estado
    const statusElement = tableElement.querySelector('.table-status');
    if (statusElement) {
        statusElement.className = `table-status status-${tableData.status}`;
        statusElement.textContent = tableData.status === 'free' ? 'Libre' : 'Ocupada';
    }
    
    // Actualizar timer
    const timerDisplay = tableElement.querySelector('.timer-display');
    if (timerDisplay) {
        timerDisplay.textContent = formatTime(tableData.timer);
        timerDisplay.classList.toggle('timer-active', tableData.status === 'occupied');
    }
    
    // Actualizar costo
    const costDisplay = tableElement.querySelector('.cost-amount');
    if (costDisplay) {
        costDisplay.textContent = `${calculateCost(tableData.timer)} PEN`;
    }
    
    // Actualizar botones
    const pauseButton = tableElement.querySelector('.btn-group .btn-secondary');
    if (pauseButton) {
        if (tableData.status === 'occupied') {
            pauseButton.disabled = false;
            pauseButton.onclick = () => pauseTimer(tableId);
        } else {
            pauseButton.disabled = true;
            pauseButton.onclick = null;
        }
    }
    
    // Actualizar secciones cuando la mesa está ocupada
    if (tableData.status === 'occupied') {
        let playersSection = tableElement.querySelector('.players-section');
        if (!playersSection) {
            playersSection = document.createElement('div');
            playersSection.className = 'players-section';
            tableElement.insertBefore(playersSection, tableElement.querySelector('.total-section'));
        }
        
        let playersTitle = playersSection.querySelector('.players-title');
        if (!playersTitle) {
            playersTitle = document.createElement('div');
            playersTitle.className = 'players-title';
            playersTitle.textContent = 'Jugadores:';
            playersSection.appendChild(playersTitle);
        }
        
        let playersList = playersSection.querySelector('.players-list');
        if (!playersList) {
            playersList = document.createElement('div');
            playersList.className = 'players-list';
            playersList.id = `${tableId}-players-list`;
            playersSection.appendChild(playersList);
        }
        playersList.innerHTML = renderPlayersList(tableId);
        
        let addPlayerBtn = playersSection.querySelector('.btn-success');
        if (!addPlayerBtn) {
            addPlayerBtn = document.createElement('button');
            addPlayerBtn.className = 'btn btn-success';
            addPlayerBtn.style.width = '100%';
            addPlayerBtn.textContent = '+ Agregar Jugador';
            addPlayerBtn.onclick = () => addPlayerModal(tableId);
            playersSection.appendChild(addPlayerBtn);
        }
        
        // Actualizar sección de productos
        let productsSection = tableElement.querySelector('.products-section');
        if (!productsSection) {
            productsSection = document.createElement('div');
            productsSection.className = 'products-section';
            tableElement.insertBefore(productsSection, tableElement.querySelector('.total-section'));
        }
        
        let productsTitle = productsSection.querySelector('.products-title');
        if (!productsTitle) {
            productsTitle = document.createElement('div');
            productsTitle.className = 'products-title';
            productsTitle.textContent = 'Productos consumidos:';
            productsSection.appendChild(productsTitle);
        }
        
        let productsList = productsSection.querySelector('.products-list');
        if (!productsList) {
            productsList = document.createElement('ul');
            productsList.className = 'products-list';
            productsList.id = `${tableId}-products`;
            productsSection.appendChild(productsList);
        }
        productsList.innerHTML = renderProductsList(tableId);
        
        // Actualizar botón de agregar producto o mensaje
        if (tableData.players.length > 0) {
            let noPlayersMsg = productsSection.querySelector('p');
            if (noPlayersMsg) noPlayersMsg.remove();
            
            let addProductBtn = productsSection.querySelector('.btn-primary');
            if (!addProductBtn) {
                addProductBtn = document.createElement('button');
                addProductBtn.className = 'btn btn-primary';
                addProductBtn.style.width = '100%';
                addProductBtn.textContent = '+ Agregar Producto';
                addProductBtn.onclick = () => addProductModal(tableId);
                productsSection.appendChild(addProductBtn);
            }
        } else {
            let addProductBtn = productsSection.querySelector('.btn-primary');
            if (addProductBtn) addProductBtn.remove();
            
            let noPlayersMsg = productsSection.querySelector('p');
            if (!noPlayersMsg) {
                noPlayersMsg = document.createElement('p');
                noPlayersMsg.style.textAlign = 'center';
                noPlayersMsg.style.color = 'var(--te-papa-green-500)';
                noPlayersMsg.textContent = 'Agregue jugadores para registrar productos';
                productsSection.appendChild(noPlayersMsg);
            }
        }
        
        // Actualizar total
        let totalSection = tableElement.querySelector('.total-section');
        if (!totalSection) {
            totalSection = document.createElement('div');
            totalSection.className = 'total-section';
            tableElement.appendChild(totalSection);
        }
        
        let totalTitle = totalSection.querySelector('.total-title');
        if (!totalTitle) {
            totalTitle = document.createElement('div');
            totalTitle.className = 'total-title';
            totalTitle.textContent = 'Total parcial:';
            totalSection.appendChild(totalTitle);
        }
        
        let totalAmount = totalSection.querySelector('.total-amount');
        if (!totalAmount) {
            totalAmount = document.createElement('div');
            totalAmount.className = 'total-amount';
            totalSection.appendChild(totalAmount);
        }
        totalAmount.textContent = `${calculateTotal(tableId)} PEN`;
        
        let splitButtons = totalSection.querySelector('.split-buttons');
        if (!splitButtons) {
            splitButtons = document.createElement('div');
            splitButtons.className = 'split-buttons';
            totalSection.appendChild(splitButtons);
            
            const splitBtn = document.createElement('button');
            splitBtn.className = 'btn btn-primary';
            splitBtn.style.flex = '1';
            splitBtn.textContent = 'Dividir Cuenta';
            splitBtn.onclick = () => showSplitModal(tableId);
            splitButtons.appendChild(splitBtn);
            
            const billBtn = document.createElement('button');
            billBtn.className = 'btn btn-success';
            billBtn.style.flex = '1';
            billBtn.textContent = 'Generar Cuenta';
            billBtn.onclick = () => showBill(tableId);
            splitButtons.appendChild(billBtn);
        }
    } else {
        // Eliminar secciones si la mesa está libre
        const playersSection = tableElement.querySelector('.players-section');
        if (playersSection) playersSection.remove();
        
        const productsSection = tableElement.querySelector('.products-section');
        if (productsSection) productsSection.remove();
        
        const totalSection = tableElement.querySelector('.total-section');
        if (totalSection) totalSection.remove();
    }
}

    /* GESTIÓN DE TIEMPO */

    function startTimer(tableId) {
        const table = appState.tables[tableId];
        if (!table || table.status === 'occupied') return;
        
        table.status = 'occupied';
        table.timer = 0;
        table.players = [];
        table.interval = setInterval(() => {
            table.timer++;
            updateTableElement(tableId);
            
            const currentHours = Math.floor(table.timer / 3600);
            if (table.timer % 3600 === 0 && currentHours > 0 && !table.currentHourNotification) {
                showHourNotification(tableId);
                table.currentHourNotification = true;
            } else if (table.timer % 3600 > 5) {
                table.currentHourNotification = false;
            }
        }, 1000);
        
        updateTableElement(tableId);
    }

    function pauseTimer(tableId) {
        const table = appState.tables[tableId];
        if (!table || table.status === 'free') return;
        
        clearInterval(table.interval);
        table.interval = null;
        updateTableElement(tableId);
    }

    function stopTimer(tableId) {
        const table = appState.tables[tableId];
        if (!table || table.status === 'free') return;
        
        clearInterval(table.interval);
        table.interval = null;
        table.status = 'free';
        table.timer = 0;
        table.players = [];
        table.currentHourNotification = false;
        updateTableElement(tableId);
    }

    function showHourNotification(tableId) {
        const notification = document.querySelector(`#${tableId} .hour-notification`);
        if (!notification) return;
        
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 5000);
    }

    /* GESTIÓN DE JUGADORES Y PRODUCTOS */

    function addPlayerModal(tableId) {
        const table = appState.tables[tableId];
        if (!table || table.status === 'free') {
            alert('La mesa no está en uso');
            return;
        }
        
        appState.currentTable = tableId;
        document.getElementById('player-name').value = '';
        toggleModal('players-modal', true);
    }

    function addPlayerToTable() {
        const tableId = appState.currentTable;
        if (!tableId) return;
        
        const playerName = document.getElementById('player-name').value.trim();
        if (!playerName) {
            alert('Ingrese un nombre para el jugador');
            return;
        }
        
        const table = appState.tables[tableId];
        table.players.push({
            id: Date.now().toString(),
            name: playerName,
            products: []
        });
        
        updateTableElement(tableId);
        toggleModal('players-modal', false);
    }

    function addProductModal(tableId) {
        const table = appState.tables[tableId];
        if (!table || table.status === 'free') {
            alert('La mesa no está en uso');
            return;
        }
        
        if (table.players.length === 0) {
            alert('Agregue jugadores primero');
            return;
        }
        
        appState.currentTable = tableId;
        const playerSelect = document.getElementById('player-select');
        playerSelect.innerHTML = table.players.map(player => 
            `<option value="${player.id}">${player.name}</option>`
        ).join('');
        
        document.getElementById('product-quantity').value = 1;
        toggleModal('product-modal', true);
    }

    function addProductToPlayer() {
        const tableId = appState.currentTable;
        if (!tableId) return;
        
        const table = appState.tables[tableId];
        const playerId = document.getElementById('player-select').value;
        const productId = document.getElementById('product-select').value;
        const quantity = parseInt(document.getElementById('product-quantity').value) || 1;
        
        if (!products[productId] || quantity <= 0) return;
        
        const player = table.players.find(p => p.id === playerId);
        if (!player) return;
        
        const product = products[productId];
        player.products.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: quantity
        });
        
        updateTableElement(tableId);
        toggleModal('product-modal', false);
    }

    /* GESTIÓN DE CUENTA Y DIVISIÓN */

    function showSplitModal(tableId) {
        const table = appState.tables[tableId];
        if (!table || table.status === 'free') {
            alert('La mesa no está en uso');
            return;
        }
        
        appState.currentTable = tableId;
        document.getElementById('equal-players-count').value = table.players.length || 2;
        generateEqualSplitList(tableId);
        generateCustomSplitList(tableId);
        toggleModal('split-modal', true);
    }

    function generateEqualSplitList(tableId) {
        const table = appState.tables[tableId];
        const playersCount = parseInt(document.getElementById('equal-players-count').value) || 2;
        const total = calculateTotal(tableId);
        const amountPerPlayer = Math.ceil(total / playersCount);
        
        const equalList = document.getElementById('equal-players-list');
        equalList.innerHTML = '';
        
        for (let i = 1; i <= playersCount; i++) {
            equalList.innerHTML += `
                <div class="player-item">
                    <span class="player-name">Participante ${i}</span>
                    <span class="player-amount">${amountPerPlayer} PEN</span>
                </div>
            `;
        }
        
        document.getElementById('equal-players-count').onchange = function() {
            const newCount = parseInt(this.value) || 1;
            const newAmount = Math.ceil(total / newCount);
            equalList.innerHTML = '';
            
            for (let i = 1; i <= newCount; i++) {
                equalList.innerHTML += `
                    <div class="player-item">
                        <span class="player-name">Participante ${i}</span>
                        <span class="player-amount">${newAmount} PEN</span>
                    </div>
                `;
            }
        };
    }

    function generateCustomSplitList(tableId) {
        const table = appState.tables[tableId];
        const total = calculateTotal(tableId);
        const customList = document.getElementById('custom-players-list');
        
        customList.innerHTML = table.players.length === 0 ? 
            '<p>No hay jugadores registrados</p>' : 
            table.players.map(player => {
                const playerProductsCost = player.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
                const timeCost = Math.ceil(calculateCost(table.timer) / table.players.length);
                const playerTotal = playerProductsCost + timeCost;
                
                return `
                    <div class="player-item">
                        <input type="checkbox" class="player-checkbox" checked id="custom-player-${player.id}">
                        <span class="player-name">${player.name}</span>
                        <span class="player-amount">${playerTotal} PEN</span>
                    </div>
                `;
            }).join('');
    }

    function confirmSplitBill() {
        const tableId = appState.currentTable;
        if (!tableId || !appState.tables[tableId]) return;
        
        const table = appState.tables[tableId];
        const total = calculateTotal(tableId);
        
        if (appState.splitMode === 'equal') {
            const playersCount = parseInt(document.getElementById('equal-players-count').value) || 1;
            const amountPerPlayer = Math.ceil(total / playersCount);
            alert(`Cuenta Total: ${total} PEN\nDividido entre ${playersCount} participantes:\nCada uno debe pagar: ${amountPerPlayer} PEN`);
        } else {
            const selectedPlayers = Array.from(document.querySelectorAll('#custom-players-list .player-checkbox:checked'))
                .map(cb => {
                    const playerId = cb.id.replace('custom-player-', '');
                    const player = table.players.find(p => p.id === playerId);
                    const amount = parseInt(cb.closest('.player-item').querySelector('.player-amount').textContent) || 0;
                    return { name: player.name, amount };
                });
            
            if (selectedPlayers.length === 0) {
                alert('Seleccione al menos un jugador');
                return;
            }
            
            const totalSelected = selectedPlayers.reduce((sum, p) => sum + p.amount, 0);
            if (totalSelected < total) {
                alert(`La suma seleccionada (${totalSelected} PEN) es menor al total (${total} PEN)`);
                return;
            }
            
            let message = `Cuenta Total: ${total} PEN\n\nDetalle por jugador:\n`;
            selectedPlayers.forEach(p => message += `- ${p.name}: ${p.amount} PEN\n`);
            alert(message);
        }
        
        toggleModal('split-modal', false);
    }

    function showBill(tableId) {
        const table = appState.tables[tableId];
        if (!table || table.status === 'free') {
            alert('La mesa no está en uso');
            return;
        }
        
        appState.currentTable = tableId;
        const billDetails = document.getElementById('bill-details');
        const timeCost = calculateCost(table.timer);
        const total = calculateTotal(tableId);
        
        billDetails.innerHTML = `
            <div id="bill-print">
                <h3>Billa´s del Valle - Recibo de Pago</h3>
                <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
                <p><strong>Mesa:</strong> ${tablesConfig.find(t => t.id === tableId).number}</p>
                <p><strong>Tiempo:</strong> ${formatTime(table.timer)}</p>
                <p><strong>Costo por tiempo:</strong> ${timeCost} PEN</p>
                
                <h4>Jugadores y Consumo:</h4>
                ${table.players.map(player => {
                    const playerProductsCost = player.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
                    const playerTimeCost = Math.ceil(timeCost / table.players.length);
                    return `
                        <div style="margin-bottom: 1rem;">
                            <p><strong>${player.name}</strong></p>
                            <ul style="margin-left: 1rem;">
                                ${player.products.length > 0 ? 
                                  player.products.map(p => `<li>${p.quantity}x ${p.name} - ${p.price * p.quantity} PEN</li>`).join('') : 
                                  '<li>No consumió productos</li>'}
                            </ul>
                            <p><strong>Subtotal:</strong> ${playerProductsCost + playerTimeCost} PEN 
                            (${playerTimeCost} PEN tiempo + ${playerProductsCost} PEN productos)</p>
                        </div>
                    `;
                }).join('')}
                
                <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px;">
                    <p style="font-size: 1.3rem; text-align: right;">
                        <strong>TOTAL A PAGAR:</strong> ${total} PEN
                    </p>
                </div>
            
                <p style="margin-top: 2rem; text-align: center;">
                    ¡Gracias por su visita!<br>
                    Sistema de Gestión de ventas - Billa´s del Valle
                </p>
            </div>
        `;
        
        toggleModal('bill-modal', true);
    }

    function printBill() {
        const printWindow = window.open('', '', 'width=600,height=600');
        printWindow.document.write('<html><head><title>Recibo PoolTime</title>');
        printWindow.document.write('<style>body { font-family: Arial; padding: 20px; }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(document.getElementById('bill-print').innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    /* FUNCIONES UTILIDAD */

    function toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
    }

    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-PE');
        const dateStr = now.toLocaleDateString('es-PE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const timeDisplay = document.getElementById('current-time');
        if (timeDisplay) {
            timeDisplay.innerHTML = `${dateStr} <br> ${timeStr}`;
        }
    }

    /* INICIALIZACIÓN */

    function initApp() {
        initialRenderTables();
        updateClock();
        setInterval(updateClock, 1000);
        
        document.getElementById('close-players-modal').addEventListener('click', () => toggleModal('players-modal', false));
        document.getElementById('cancel-players').addEventListener('click', () => toggleModal('players-modal', false));
        document.getElementById('add-player').addEventListener('click', addPlayerToTable);
        
        document.getElementById('close-product-modal').addEventListener('click', () => toggleModal('product-modal', false));
        document.getElementById('cancel-product').addEventListener('click', () => toggleModal('product-modal', false));
        document.getElementById('confirm-product').addEventListener('click', addProductToPlayer);
        
        document.getElementById('close-split-modal').addEventListener('click', () => toggleModal('split-modal', false));
        document.getElementById('cancel-split').addEventListener('click', () => toggleModal('split-modal', false));
        document.getElementById('confirm-split').addEventListener('click', confirmSplitBill);
        
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
                
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                if (tabId) {
                    document.getElementById(`${tabId}-tab`).style.display = 'block';
                    appState.splitMode = tabId;
                }
            });
        });
        
        document.getElementById('close-bill-modal').addEventListener('click', () => toggleModal('bill-modal', false));
        document.getElementById('print-bill').addEventListener('click', printBill);
        document.getElementById('close-bill').addEventListener('click', () => toggleModal('bill-modal', false));
    }

    document.addEventListener('DOMContentLoaded', initApp);

