// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const CONFIG = {
    CELLS_IN_MAX_DIMENSION: 10,  // número fijo de celdas en la dimensión mayor
    RESIZE_DEBOUNCE_MS: 150,     // tiempo de espera antes de recalcular en resize
    SECTION_TYPES: {
        HOME: 'home',
        DESTINATION: 'destination'
    }
};

// secciones del sitio web
const sections = [
    { name: 'home', url: 'index.html', type: CONFIG.SECTION_TYPES.HOME },
    { name: 'about', url: 'about.html', type: CONFIG.SECTION_TYPES.DESTINATION },
    { name: 'cv', url: 'cv.html', type: CONFIG.SECTION_TYPES.DESTINATION },
    { name: 'blog', url: 'blog.html', type: CONFIG.SECTION_TYPES.DESTINATION },
    { name: 'hiring', url: 'hiring.html', type: CONFIG.SECTION_TYPES.DESTINATION }
];

// ============================================================================
// PARTE 1: GRID ADAPTABLE
// ============================================================================

/**
 * calcula el tamaño dinámico de la grid basado en las dimensiones del contenedor
 * la dimensión mayor siempre tendrá 10 celdas, la menor se ajusta proporcionalmente
 */
function calculateGridSize(containerWidth, containerHeight) {
    const maxDimension = Math.max(containerWidth, containerHeight);
    const minDimension = Math.min(containerWidth, containerHeight);
    
    // tamaño de cada celda cuadrada
    const cellSize = maxDimension / CONFIG.CELLS_IN_MAX_DIMENSION;
    
    // calcular cuántas celdas caben en la dimensión menor
    const cellsInMinDimension = Math.floor(minDimension / cellSize);
    
    // determinar si el contenedor es horizontal o vertical
    const isHorizontal = containerWidth > containerHeight;
    
    const result = {
        cols: isHorizontal ? CONFIG.CELLS_IN_MAX_DIMENSION : cellsInMinDimension,
        rows: isHorizontal ? cellsInMinDimension : CONFIG.CELLS_IN_MAX_DIMENSION,
        cellSize: cellSize,
        isHorizontal: isHorizontal
    };
    
    console.log('📐 grid calculada:', result);
    return result;
}

/**
 * obtiene las dimensiones reales del contenedor de la grid
 */
function getContainerDimensions() {
    const gridContainer = document.getElementById('gridContainer');
    const rect = gridContainer.getBoundingClientRect();
    return {
        width: rect.width,
        height: rect.height
    };
}

// ============================================================================
// PARTE 2: POSICIONAMIENTO ALEATORIO
// ============================================================================

/**
 * genera posiciones aleatorias únicas para todas las secciones
 * asegura que ninguna sección se solape con otra
 */
function generateRandomPositions(cols, rows) {
    const positions = new Set();
    const result = [];
    
    // generar posiciones únicas para cada sección
    for (let i = 0; i < sections.length; i++) {
        let position;
        let attempts = 0;
        const maxAttempts = cols * rows;
        
        do {
            const x = Math.floor(Math.random() * cols);
            const y = Math.floor(Math.random() * rows);
            position = `${x},${y}`;
            attempts++;
            
            if (attempts > maxAttempts) {
                console.error('⚠️ no se pudieron generar posiciones únicas');
                break;
            }
        } while (positions.has(position));
        
        positions.add(position);
        const [x, y] = position.split(',').map(Number);
        
        result.push({
            x: x,
            y: y,
            section: sections[i]
        });
    }
    
    console.log('📍 posiciones generadas:', result);
    return result;
}

// ============================================================================
// PARTE 3: PATHFINDING A*
// ============================================================================

/**
 * clase para representar un nodo en el algoritmo A*
 */
class PathNode {
    constructor(x, y, g = 0, h = 0, parent = null) {
        this.x = x;
        this.y = y;
        this.g = g;  // coste desde el inicio
        this.h = h;  // heurística hasta el objetivo
        this.f = g + h;  // coste total
        this.parent = parent;
    }
    
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    
    toString() {
        return `${this.x},${this.y}`;
    }
}

/**
 * calcula la distancia manhattan entre dos puntos
 */
function manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * obtiene los vecinos válidos de una celda
 */
function getNeighbors(node, cols, rows) {
    const neighbors = [];
    const directions = [
        { x: 0, y: -1 },  // arriba
        { x: 1, y: 0 },   // derecha
        { x: 0, y: 1 },   // abajo
        { x: -1, y: 0 }   // izquierda
    ];
    
    for (const dir of directions) {
        const newX = node.x + dir.x;
        const newY = node.y + dir.y;
        
        // verificar que esté dentro de los límites
        if (newX >= 0 && newX < cols && newY >= 0 && newY < rows) {
            neighbors.push(new PathNode(newX, newY));
        }
    }
    
    return neighbors;
}

/**
 * encuentra el camino más corto entre dos puntos usando A*
 * permite que los caminos se crucen entre sí
 */
function findPath(start, end, cols, rows) {
    const openList = [new PathNode(start.x, start.y, 0, manhattanDistance(start.x, start.y, end.x, end.y))];
    const closedList = new Set();
    
    while (openList.length > 0) {
        // encontrar el nodo con menor f
        openList.sort((a, b) => a.f - b.f);
        const current = openList.shift();
        
        // verificar si llegamos al destino
        if (current.x === end.x && current.y === end.y) {
            // reconstruir el camino
            const path = [];
            let node = current;
            while (node) {
                path.unshift({ x: node.x, y: node.y });
                node = node.parent;
            }
            return path;
        }
        
        closedList.add(current.toString());
        
        // explorar vecinos
        const neighbors = getNeighbors(current, cols, rows);
        for (const neighbor of neighbors) {
            const neighborKey = neighbor.toString();
            
            if (closedList.has(neighborKey)) {
                continue;
            }
            
            const g = current.g + 1;
            const h = manhattanDistance(neighbor.x, neighbor.y, end.x, end.y);
            const newNode = new PathNode(neighbor.x, neighbor.y, g, h, current);
            
            // verificar si ya está en openList con mejor coste
            const existingIndex = openList.findIndex(n => n.toString() === neighborKey);
            if (existingIndex === -1) {
                openList.push(newNode);
            } else if (g < openList[existingIndex].g) {
                openList[existingIndex] = newNode;
            }
        }
    }
    
    // si no se encuentra camino, devolver línea recta
    console.warn('⚠️ no se encontró camino, usando línea directa');
    return [start, end];
}

/**
 * genera todos los caminos desde home hacia cada destino
 */
function generateAllPaths(positions, cols, rows) {
    const homePos = positions.find(p => p.section.type === CONFIG.SECTION_TYPES.HOME);
    const destinations = positions.filter(p => p.section.type === CONFIG.SECTION_TYPES.DESTINATION);
    
    const paths = {};
    
    for (const dest of destinations) {
        const path = findPath(
            { x: homePos.x, y: homePos.y },
            { x: dest.x, y: dest.y },
            cols,
            rows
        );
        paths[dest.section.name] = path;
        console.log(`🛤️ camino a ${dest.section.name}:`, path.length, 'celdas');
    }
    
    return paths;
}

// ============================================================================
// PARTE 4: ANÁLISIS DE CONEXIONES Y TIPOS DE PIEZAS
// ============================================================================

/**
 * determina qué tipo de pieza necesita una celda basándose en las direcciones
 * de entrada y salida de los caminos que pasan por ella
 */
function getPieceType(connections) {
    const { top, right, bottom, left } = connections;
    const count = [top, right, bottom, left].filter(Boolean).length;
    
    // sin conexiones
    if (count === 0) return null;
    
    // una sola conexión (extremo, no debería pasar)
    if (count === 1) return null;
    
    // dos conexiones: recta o curva
    if (count === 2) {
        if (top && bottom) return 'straight-v';
        if (left && right) return 'straight-h';
        if (top && right) return 'curve-tr';
        if (top && left) return 'curve-tl';
        if (bottom && right) return 'curve-br';
        if (bottom && left) return 'curve-bl';
    }
    
    // tres conexiones: T
    if (count === 3) {
        if (!top) return 't-down';
        if (!right) return 't-left';
        if (!bottom) return 't-up';
        if (!left) return 't-right';
    }
    
    // cuatro conexiones: cruz
    if (count === 4) return 'cross';
    
    return null;
}

/**
 * analiza todos los caminos para determinar qué conexiones tiene cada celda
 */
function analyzeCellConnections(allPaths, x, y) {
    const connections = { top: false, right: false, bottom: false, left: false };
    
    // revisar todos los caminos
    for (const pathName in allPaths) {
        const path = allPaths[pathName];
        
        // buscar si esta celda está en el camino
        const index = path.findIndex(cell => cell.x === x && cell.y === y);
        if (index === -1) continue;
        
        // verificar conexión con celda anterior
        if (index > 0) {
            const prev = path[index - 1];
            if (prev.y < y) connections.top = true;
            if (prev.x > x) connections.right = true;
            if (prev.y > y) connections.bottom = true;
            if (prev.x < x) connections.left = true;
        }
        
        // verificar conexión con celda siguiente
        if (index < path.length - 1) {
            const next = path[index + 1];
            if (next.y < y) connections.top = true;
            if (next.x > x) connections.right = true;
            if (next.y > y) connections.bottom = true;
            if (next.x < x) connections.left = true;
        }
    }
    
    return connections;
}

// ============================================================================
// PARTE 5: RENDERIZADO DE LA GRID
// ============================================================================

/**
 * crea y renderiza toda la grid con secciones y caminos
 */
function createGrid(gridSize, positions, paths) {
    const gridContainer = document.getElementById('gridContainer');
    gridContainer.innerHTML = '';  // limpiar grid anterior
    
    // configurar CSS grid
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize.cols}, 1fr)`;
    gridContainer.style.gridTemplateRows = `repeat(${gridSize.rows}, 1fr)`;
    
    // crear mapa de posiciones de secciones
    const sectionMap = new Map();
    positions.forEach(pos => {
        sectionMap.set(`${pos.x},${pos.y}`, pos.section);
    });
    
    // crear todas las celdas
    for (let y = 0; y < gridSize.rows; y++) {
        for (let x = 0; x < gridSize.cols; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            const posKey = `${x},${y}`;
            const section = sectionMap.get(posKey);
            
            // si es una sección (home o destino)
            if (section) {
                cell.classList.add(section.type);
                cell.classList.add(`section-${section.name}`);
                
                // solo los destinos son clicables
                if (section.type === CONFIG.SECTION_TYPES.DESTINATION) {
                    const link = document.createElement('a');
                    link.href = section.url;
                    link.textContent = section.name;
                    cell.appendChild(link);
                } else {
                    // home no es clicable, solo muestra el nombre
                    const label = document.createElement('span');
                    label.textContent = section.name;
                    label.className = 'section-label';
                    cell.appendChild(label);
                }
            } else {
                // analizar si es parte de un camino
                const connections = analyzeCellConnections(paths, x, y);
                const pieceType = getPieceType(connections);
                
                if (pieceType) {
                    cell.classList.add('pipe');
                    cell.classList.add(`pipe-${pieceType}`);
                }
            }
            
            gridContainer.appendChild(cell);
        }
    }
    
    console.log('✅ grid renderizada:', gridSize.cols, 'x', gridSize.rows);
}

// ============================================================================
// PARTE 6: CONTROL PRINCIPAL Y EVENTOS
// ============================================================================

let resizeTimeout = null;

/**
 * inicializa toda la aplicación
 */
function initializeApp() {
    console.log('🚀 inicializando safe amorx...');
    
    // obtener dimensiones del contenedor
    const dimensions = getContainerDimensions();
    
    // calcular tamaño de la grid
    const gridSize = calculateGridSize(dimensions.width, dimensions.height);
    
    // generar posiciones aleatorias
    const positions = generateRandomPositions(gridSize.cols, gridSize.rows);
    
    // generar caminos
    const paths = generateAllPaths(positions, gridSize.cols, gridSize.rows);
    
    // renderizar todo
    createGrid(gridSize, positions, paths);
    
    console.log('✨ aplicación lista');
}

/**
 * maneja el evento de resize de la ventana con debounce
 */
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        console.log('🔄 recalculando grid por resize...');
        initializeApp();
    }, CONFIG.RESIZE_DEBOUNCE_MS);
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

// inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeApp);

// escuchar cambios de tamaño de ventana
window.addEventListener('resize', handleResize);
