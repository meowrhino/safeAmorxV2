// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

const CONFIG = {
    CELLS_IN_MAX_DIMENSION: 10,  // número fijo de celdas en la dimensión mayor
    RESIZE_DEBOUNCE_MS: 150,     // tiempo de espera antes de recalcular en resize
    MAX_GENERATION_ATTEMPTS: 50, // máximo de intentos para generar posiciones válidas
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
                return null;
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
    
    // si no se encuentra camino, devolver null
    console.warn('⚠️ no se encontró camino');
    return null;
}

/**
 * genera todos los caminos desde home hacia cada destino
 * devuelve null si algún camino no es posible
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
        
        // si no hay camino posible, devolver null
        if (!path) {
            console.error(`❌ no hay camino posible a ${dest.section.name}`);
            return null;
        }
        
        paths[dest.section.name] = path;
        console.log(`🛤️ camino a ${dest.section.name}:`, path.length, 'celdas');
    }
    
    return paths;
}

// ============================================================================
// PARTE 4: ANÁLISIS DE CONEXIONES PARA UN CAMINO INDIVIDUAL
// ============================================================================

/**
 * determina la dirección de conexión entre dos celdas consecutivas
 */
function getConnectionDirection(from, to) {
    if (to.x > from.x) return 'right';
    if (to.x < from.x) return 'left';
    if (to.y > from.y) return 'bottom';
    if (to.y < from.y) return 'top';
    return null;
}

/**
 * determina qué tipo de pieza necesita una celda basándose en las direcciones
 * de entrada y salida dentro de UN SOLO camino
 */
function getPieceTypeForCell(dirIn, dirOut) {
    if (!dirIn || !dirOut) return null;
    
    // rectas
    if ((dirIn === 'top' && dirOut === 'bottom') || (dirIn === 'bottom' && dirOut === 'top')) {
        return 'straight-v';
    }
    if ((dirIn === 'left' && dirOut === 'right') || (dirIn === 'right' && dirOut === 'left')) {
        return 'straight-h';
    }
    
    // curvas - normalizar para que siempre tengamos el orden correcto
    const dirs = [dirIn, dirOut].sort().join('-');
    
    if (dirs === 'bottom-right' || dirs === 'right-bottom') return 'curve-br';
    if (dirs === 'bottom-left' || dirs === 'left-bottom') return 'curve-bl';
    if (dirs === 'right-top' || dirs === 'top-right') return 'curve-tr';
    if (dirs === 'left-top' || dirs === 'top-left') return 'curve-tl';
    
    return null;
}

// ============================================================================
// PARTE 5: RENDERIZADO DE LA GRID CON CAMINOS INDEPENDIENTES
// ============================================================================

/**
 * crea y renderiza toda la grid con secciones y caminos
 * NUEVO ENFOQUE: cada camino se renderiza de forma independiente
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
    
    // crear mapa de celdas para almacenar referencias DOM
    const cellMap = new Map();
    
    // PASO 1: crear todas las celdas vacías
    for (let y = 0; y < gridSize.rows; y++) {
        for (let x = 0; x < gridSize.cols; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            const posKey = `${x},${y}`;
            cellMap.set(posKey, cell);
            
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
            }
            
            gridContainer.appendChild(cell);
        }
    }
    
    // PASO 2: renderizar cada camino de forma independiente
    for (const pathName in paths) {
        const path = paths[pathName];
        
        // recorrer el camino (excluyendo inicio y fin que son las secciones)
        for (let i = 1; i < path.length - 1; i++) {
            const current = path[i];
            const prev = path[i - 1];
            const next = path[i + 1];
            
            const posKey = `${current.x},${current.y}`;
            const cell = cellMap.get(posKey);
            
            if (!cell) continue;
            
            // determinar direcciones de entrada y salida
            const dirIn = getConnectionDirection(prev, current);
            const dirOut = getConnectionDirection(current, next);
            
            // determinar tipo de pieza
            const pieceType = getPieceTypeForCell(dirIn, dirOut);
            
            if (pieceType) {
                // si la celda ya tiene una pieza, necesitamos combinarlas
                if (cell.classList.contains('pipe')) {
                    // ya hay un camino pasando por aquí, añadir clase adicional
                    cell.classList.add(`pipe-${pieceType}-overlay`);
                } else {
                    // primera vez que un camino pasa por aquí
                    cell.classList.add('pipe');
                    cell.classList.add(`pipe-${pieceType}`);
                }
            }
        }
    }
    
    console.log('✅ grid renderizada:', gridSize.cols, 'x', gridSize.rows);
}

// ============================================================================
// PARTE 6: VALIDACIÓN Y REGENERACIÓN
// ============================================================================

/**
 * intenta generar una configuración válida con caminos posibles
 * si no encuentra caminos, regenera las posiciones automáticamente
 */
function generateValidConfiguration(gridSize) {
    let attempts = 0;
    
    while (attempts < CONFIG.MAX_GENERATION_ATTEMPTS) {
        attempts++;
        console.log(`🔄 intento ${attempts} de generar configuración válida...`);
        
        // generar posiciones aleatorias
        const positions = generateRandomPositions(gridSize.cols, gridSize.rows);
        if (!positions) {
            continue;
        }
        
        // intentar generar caminos
        const paths = generateAllPaths(positions, gridSize.cols, gridSize.rows);
        
        // si todos los caminos son válidos, devolver configuración
        if (paths) {
            console.log(`✅ configuración válida encontrada en intento ${attempts}`);
            return { positions, paths };
        }
        
        console.warn(`⚠️ intento ${attempts} falló, regenerando...`);
    }
    
    // si llegamos aquí, no se pudo generar configuración válida
    console.error('❌ no se pudo generar configuración válida después de', CONFIG.MAX_GENERATION_ATTEMPTS, 'intentos');
    return null;
}

// ============================================================================
// PARTE 7: CONTROL PRINCIPAL Y EVENTOS
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
    
    // generar configuración válida (con reintentos automáticos)
    const config = generateValidConfiguration(gridSize);
    
    if (!config) {
        console.error('❌ no se pudo inicializar la aplicación');
        return;
    }
    
    // renderizar todo
    createGrid(gridSize, config.positions, config.paths);
    
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
