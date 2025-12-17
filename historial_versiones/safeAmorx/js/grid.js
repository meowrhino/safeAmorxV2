// Secciones del sitio web
const sections = [
    { name: 'home', url: 'index.html' },
    { name: 'about', url: 'about.html' },
    { name: 'cv', url: 'cv.html' },
    { name: 'blog', url: 'blog.html' },
    { name: 'hiring', url: 'hiring.html' }
];

// Función para generar posiciones aleatorias únicas
function generateRandomPositions(count, gridSize = 10) {
    const positions = new Set();
    
    while (positions.size < count) {
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);
        const position = `${x},${y}`;
        positions.add(position);
    }
    
    return Array.from(positions).map(pos => {
        const [x, y] = pos.split(',').map(Number);
        return { x, y };
    });
}

// Función para crear la grid
function createGrid() {
    const gridContainer = document.getElementById('gridContainer');
    const gridSize = 10;
    const totalCells = gridSize * gridSize;
    
    // Generar posiciones aleatorias para las secciones
    const randomPositions = generateRandomPositions(sections.length, gridSize);
    
    console.log('Posiciones aleatorias generadas:');
    sections.forEach((section, index) => {
        console.log(`${section.name}: (${randomPositions[index].x}, ${randomPositions[index].y})`);
    });
    
    // Crear un mapa de posiciones activas
    const activePositions = new Map();
    randomPositions.forEach((pos, index) => {
        const key = `${pos.x},${pos.y}`;
        activePositions.set(key, sections[index]);
    });
    
    // Crear todas las celdas de la grid
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            
            const posKey = `${x},${y}`;
            const section = activePositions.get(posKey);
            
            if (section) {
                cell.classList.add('active');
                const link = document.createElement('a');
                link.href = section.url;
                link.textContent = section.name;
                cell.appendChild(link);
            }
            
            gridContainer.appendChild(cell);
        }
    }
}

// Inicializar la grid cuando se carga la página
document.addEventListener('DOMContentLoaded', createGrid);
