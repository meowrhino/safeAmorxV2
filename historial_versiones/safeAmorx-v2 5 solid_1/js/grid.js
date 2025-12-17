// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    CELLS_IN_MAX_DIMENSION: 10,
    RESIZE_DEBOUNCE_MS: 150,
    MAX_ATTEMPTS: 50,
    AVOID_OTHER_DESTINATIONS: true,
    PREFER_EXISTING_PATHS: true
};

const sections = [
    { name: 'home', url: 'index.html', isHome: true },
    { name: 'about', url: 'about.html', isHome: false },
    { name: 'cv', url: 'cv.html', isHome: false },
    { name: 'blog', url: 'blog.html', isHome: false },
    { name: 'hiring', url: 'hiring.html', isHome: false }
];

// ============================================================================
// GRID ADAPTABLE
// ============================================================================

function calculateGridSize(containerWidth, containerHeight) {
    const maxDim = Math.max(containerWidth, containerHeight);
    const minDim = Math.min(containerWidth, containerHeight);
    const cellSize = maxDim / CONFIG.CELLS_IN_MAX_DIMENSION;
    const cellsInMinDim = Math.floor(minDim / cellSize);
    
    return {
        cols: containerWidth > containerHeight ? CONFIG.CELLS_IN_MAX_DIMENSION : cellsInMinDim,
        rows: containerWidth > containerHeight ? cellsInMinDim : CONFIG.CELLS_IN_MAX_DIMENSION,
        cellSize: cellSize
    };
}

// ============================================================================
// POSICIONAMIENTO ALEATORIO
// ============================================================================

function generatePositions(cols, rows) {
    const positions = [];
    const used = new Set();
    
    for (const section of sections) {
        let x, y, key;
        let attempts = 0;
        
        do {
            x = Math.floor(Math.random() * cols);
            y = Math.floor(Math.random() * rows);
            key = `${x},${y}`;
            attempts++;
            if (attempts > 1000) return null;
        } while (used.has(key));
        
        used.add(key);
        positions.push({ x, y, section });
    }
    
    return positions;
}

// ============================================================================
// PATHFINDING
// ============================================================================

function toKey(x, y) {
    return `${x},${y}`;
}

function fromKey(key) {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
}

function isInBounds(x, y, cols, rows) {
    return x >= 0 && x < cols && y >= 0 && y < rows;
}

function findSimplePath(start, end, cols, rows) {
    const path = [];
    let x = start.x;
    let y = start.y;
    
    path.push({ x, y });
    
    // primero mover horizontalmente
    while (x !== end.x) {
        x += (end.x > x) ? 1 : -1;
        path.push({ x, y });
    }
    
    // luego mover verticalmente
    while (y !== end.y) {
        y += (end.y > y) ? 1 : -1;
        path.push({ x, y });
    }
    
    return path;
}

function findPath(start, end, cols, rows, blocked = new Set(), preferred = null) {
    const startKey = toKey(start.x, start.y);
    const endKey = toKey(end.x, end.y);

    if (startKey === endKey) return [{ x: start.x, y: start.y }];

    const queue = [startKey];
    let queueIndex = 0;
    const cameFrom = new Map();
    cameFrom.set(startKey, null);

    while (queueIndex < queue.length) {
        const currentKey = queue[queueIndex++];
        if (currentKey === endKey) break;

        const current = fromKey(currentKey);
        const neighbors = [];
        const directions = [
            { dx: 1, dy: 0 },
            { dx: -1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 0, dy: -1 }
        ];

        for (const { dx, dy } of directions) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            if (!isInBounds(nx, ny, cols, rows)) continue;

            const nKey = toKey(nx, ny);
            if (blocked.has(nKey)) continue;
            if (cameFrom.has(nKey)) continue; // ya visitado

            neighbors.push({ x: nx, y: ny, key: nKey });
        }

        if (preferred && preferred.size > 0) {
            const preferredNeighbors = [];
            const normalNeighbors = [];
            for (const n of neighbors) {
                if (preferred.has(n.key)) preferredNeighbors.push(n);
                else normalNeighbors.push(n);
            }
            neighbors.length = 0;
            neighbors.push(...preferredNeighbors, ...normalNeighbors);
        }

        for (const neighbor of neighbors) {
            cameFrom.set(neighbor.key, currentKey);
            queue.push(neighbor.key);
        }
    }

    if (!cameFrom.has(endKey)) return null;

    const path = [];
    let currentKey = endKey;
    while (currentKey) {
        path.push(fromKey(currentKey));
        currentKey = cameFrom.get(currentKey);
    }

    path.reverse();
    return path;
}

function generateAllPaths(positions, cols, rows) {
    const home = positions.find(p => p.section.isHome);
    const destinations = positions.filter(p => !p.section.isHome);
    const paths = {};

    if (!home) return null;

    const preferredCells = new Set();
    
    for (const dest of destinations) {
        const start = { x: home.x, y: home.y };
        const end = { x: dest.x, y: dest.y };

        let blocked = new Set();
        if (CONFIG.AVOID_OTHER_DESTINATIONS) {
            blocked = new Set(
                destinations
                    .filter(d => d.section.name !== dest.section.name)
                    .map(d => toKey(d.x, d.y))
            );
        }

        const path = CONFIG.AVOID_OTHER_DESTINATIONS || CONFIG.PREFER_EXISTING_PATHS
            ? findPath(start, end, cols, rows, blocked, CONFIG.PREFER_EXISTING_PATHS ? preferredCells : null)
            : findSimplePath(start, end, cols, rows);

        if (!path) return null;
        paths[dest.section.name] = path;

        if (CONFIG.PREFER_EXISTING_PATHS) {
            for (const p of path) preferredCells.add(toKey(p.x, p.y));
        }
    }
    
    return paths;
}

// ============================================================================
// RENDERIZADO SIMPLE
// ============================================================================

function addConnection(connections, x, y, direction) {
    const key = `${x},${y}`;
    if (!connections.has(key)) connections.set(key, new Set());
    connections.get(key).add(direction);
}

function buildConnectionsMap(paths) {
    const connections = new Map();

    for (const pathName in paths) {
        const path = paths[pathName];
        if (!Array.isArray(path) || path.length < 2) continue;

        for (let i = 0; i < path.length - 1; i++) {
            const curr = path[i];
            const next = path[i + 1];

            if (next.x > curr.x) {
                addConnection(connections, curr.x, curr.y, 'right');
                addConnection(connections, next.x, next.y, 'left');
            } else if (next.x < curr.x) {
                addConnection(connections, curr.x, curr.y, 'left');
                addConnection(connections, next.x, next.y, 'right');
            } else if (next.y > curr.y) {
                addConnection(connections, curr.x, curr.y, 'down');
                addConnection(connections, next.x, next.y, 'up');
            } else if (next.y < curr.y) {
                addConnection(connections, curr.x, curr.y, 'up');
                addConnection(connections, next.x, next.y, 'down');
            }
        }
    }

    return connections;
}

function getPipePieceClass(directions) {
    const has = (dir) => directions.has(dir);
    const count = directions.size;

    if (count === 1) {
        const [dir] = directions;
        return `pipe-end-${dir}`;
    }

    if (count === 2) {
        if (has('left') && has('right')) return 'pipe-straight-h';
        if (has('up') && has('down')) return 'pipe-straight-v';

        // curvas (nombres heredados de css/styles.css)
        // up+right -> top-right quadrant
        if (has('up') && has('right')) return 'pipe-curve-br';
        if (has('up') && has('left')) return 'pipe-curve-bl';
        if (has('down') && has('right')) return 'pipe-curve-tr';
        if (has('down') && has('left')) return 'pipe-curve-tl';
    }

    if (count === 3) {
        if (!has('down') && has('up') && has('left') && has('right')) return 'pipe-t-up';
        if (!has('up') && has('down') && has('left') && has('right')) return 'pipe-t-down';
        if (!has('right') && has('left') && has('up') && has('down')) return 'pipe-t-left';
        if (!has('left') && has('right') && has('up') && has('down')) return 'pipe-t-right';
    }

    if (count === 4) {
        return 'pipe-cross';
    }

    return null;
}

function createGrid(gridSize, positions, paths) {
    const container = document.getElementById('gridContainer');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${gridSize.cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${gridSize.rows}, 1fr)`;
    
    // crear mapa de posiciones
    const posMap = new Map();
    positions.forEach(p => posMap.set(`${p.x},${p.y}`, p.section));
    
    const connections = buildConnectionsMap(paths);
    
    // crear celdas
    for (let y = 0; y < gridSize.rows; y++) {
        for (let x = 0; x < gridSize.cols; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            const key = `${x},${y}`;
            const section = posMap.get(key);
            
            // si es una sección
            if (section) {
                if (section.isHome) {
                    cell.classList.add('home');
                    const label = document.createElement('span');
                    label.className = 'section-label';
                    label.textContent = section.name;
                    cell.appendChild(label);
                } else {
                    cell.classList.add('destination');
                    const link = document.createElement('a');
                    link.href = section.url;
                    link.textContent = section.name;
                    cell.appendChild(link);
                }
            }
            
            if (!section && connections.has(key)) {
                const pieceClass = getPipePieceClass(connections.get(key));
                if (pieceClass) cell.classList.add('pipe', pieceClass);
            }
            
            container.appendChild(cell);
        }
    }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

function tryGenerateValid(gridSize) {
    for (let attempt = 0; attempt < CONFIG.MAX_ATTEMPTS; attempt++) {
        const positions = generatePositions(gridSize.cols, gridSize.rows);
        if (!positions) continue;
        
        const paths = generateAllPaths(positions, gridSize.cols, gridSize.rows);
        if (paths) {
            console.log(`✅ configuración válida en intento ${attempt + 1}`);
            return { positions, paths };
        }
    }
    return null;
}

function init() {
    console.log('🚀 inicializando...');
    
    const container = document.getElementById('gridContainer');
    const rect = container.getBoundingClientRect();
    const gridSize = calculateGridSize(rect.width, rect.height);
    
    console.log('📐 grid:', gridSize);
    
    const config = tryGenerateValid(gridSize);
    if (!config) {
        console.error('❌ no se pudo generar configuración válida');
        return;
    }
    
    createGrid(gridSize, config.positions, config.paths);
    console.log('✨ listo');
}

let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(init, CONFIG.RESIZE_DEBOUNCE_MS);
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', handleResize);
