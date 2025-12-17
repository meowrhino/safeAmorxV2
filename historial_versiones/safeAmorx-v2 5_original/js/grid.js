// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
    CELLS_IN_MAX_DIMENSION: 10,
    RESIZE_DEBOUNCE_MS: 150,
    MAX_ATTEMPTS: 50
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
// PATHFINDING SIMPLE
// ============================================================================

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

function generateAllPaths(positions, cols, rows) {
    const home = positions.find(p => p.section.isHome);
    const destinations = positions.filter(p => !p.section.isHome);
    const paths = {};
    
    for (const dest of destinations) {
        const path = findSimplePath(home, dest, cols, rows);
        paths[dest.section.name] = path;
    }
    
    return paths;
}

// ============================================================================
// RENDERIZADO SIMPLE
// ============================================================================

function createGrid(gridSize, positions, paths) {
    const container = document.getElementById('gridContainer');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${gridSize.cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${gridSize.rows}, 1fr)`;
    
    // crear mapa de posiciones
    const posMap = new Map();
    positions.forEach(p => posMap.set(`${p.x},${p.y}`, p.section));
    
    // crear mapa de segmentos de camino
    const segments = new Map();
    
    for (const pathName in paths) {
        const path = paths[pathName];
        
        for (let i = 0; i < path.length - 1; i++) {
            const curr = path[i];
            const next = path[i + 1];
            const key = `${curr.x},${curr.y}`;
            
            if (!segments.has(key)) {
                segments.set(key, []);
            }
            
            // determinar dirección del segmento
            let dir = '';
            if (next.x > curr.x) dir = 'right';
            else if (next.x < curr.x) dir = 'left';
            else if (next.y > curr.y) dir = 'down';
            else if (next.y < curr.y) dir = 'up';
            
            segments.get(key).push(dir);
        }
        
        // también agregar el último punto con dirección de entrada
        const last = path[path.length - 1];
        const prev = path[path.length - 2];
        const lastKey = `${last.x},${last.y}`;
        
        if (!segments.has(lastKey)) {
            segments.set(lastKey, []);
        }
        
        let dirIn = '';
        if (last.x > prev.x) dirIn = 'from-left';
        else if (last.x < prev.x) dirIn = 'from-right';
        else if (last.y > prev.y) dirIn = 'from-up';
        else if (last.y < prev.y) dirIn = 'from-down';
        
        segments.get(lastKey).push(dirIn);
    }
    
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
            
            // si tiene segmentos de camino
            if (segments.has(key) && !section) {
                const dirs = segments.get(key);
                cell.classList.add('pipe');
                
                // añadir líneas según las direcciones
                for (const dir of dirs) {
                    const line = document.createElement('div');
                    line.className = `line line-${dir}`;
                    cell.appendChild(line);
                }
            }
            
            container.appendChild(cell);
        }
    }
}

// ============================================================================
// CSS DINÁMICO PARA LÍNEAS
// ============================================================================

function injectLineStyles() {
    if (document.getElementById('dynamic-line-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'dynamic-line-styles';
    style.textContent = `
        .line {
            position: absolute;
            background: none;
            border: 2.5px dashed rgba(255, 255, 255, 0.8);
        }
        
        .line-right {
            top: 50%;
            left: 50%;
            width: 50%;
            height: 0;
            border-bottom: none;
            border-left: none;
            border-right: none;
        }
        
        .line-left {
            top: 50%;
            left: 0;
            width: 50%;
            height: 0;
            border-bottom: none;
            border-left: none;
            border-right: none;
        }
        
        .line-down {
            top: 50%;
            left: 50%;
            width: 0;
            height: 50%;
            border-bottom: none;
            border-right: none;
            border-top: none;
        }
        
        .line-up {
            top: 0;
            left: 50%;
            width: 0;
            height: 50%;
            border-bottom: none;
            border-right: none;
            border-top: none;
        }
        
        .line-from-left,
        .line-from-right,
        .line-from-up,
        .line-from-down {
            display: none;
        }
    `;
    document.head.appendChild(style);
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
    
    injectLineStyles();
    
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
