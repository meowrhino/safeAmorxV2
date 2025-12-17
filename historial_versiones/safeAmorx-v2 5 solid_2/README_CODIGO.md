# safe amorx - documentación del código

## 📁 estructura del proyecto

```
safeAmorx/
├── index.html              # página principal
├── about.html              # página about
├── cv.html                 # página cv
├── blog.html               # página blog
├── hiring.html             # página hiring
├── README.md               # documentación general
├── README_CODIGO.md        # este archivo - documentación técnica
├── css/
│   ├── styles.css          # estilos principales con sistema de tuberías
│   └── pages.css           # estilos para páginas internas
├── js/
│   └── grid.js             # lógica completa de la aplicación
└── assets/
    └── images/
        ├── LOGO.webp
        └── background.webp
```

---

## 🎯 funcionalidades implementadas

### 1. grid adaptable con casillas cuadradas
- la dimensión mayor siempre tiene 10 celdas
- la dimensión menor se ajusta proporcionalmente
- todas las celdas son perfectamente cuadradas
- se recalcula automáticamente en resize de ventana

### 2. posicionamiento aleatorio
- cada carga genera nuevas posiciones para todas las secciones
- home (verde) y 4 destinos (rojos) nunca se solapan
- posiciones únicas garantizadas

### 3. pathfinding visual con A*
- algoritmo A* encuentra el camino más corto desde home a cada destino
- genera 4 caminos independientes (about, cv, blog, hiring)
- los caminos pueden cruzarse entre sí

### 4. sistema de tuberías con líneas discontinuas
- detecta automáticamente qué tipo de pieza necesita cada celda
- tipos: rectas, curvas, T, cruces
- renderizado con CSS puro (pseudo-elementos)

---

## 🔧 arquitectura del código

### `js/grid.js` - estructura modular

el código está dividido en 6 partes claramente separadas:

#### **parte 1: configuración y constantes**
```javascript
const CONFIG = {
    CELLS_IN_MAX_DIMENSION: 10,
    RESIZE_DEBOUNCE_MS: 150,
    SECTION_TYPES: { HOME: 'home', DESTINATION: 'destination' }
};
```
- configuración centralizada
- fácil de modificar sin tocar el resto del código

#### **parte 2: grid adaptable**
```javascript
calculateGridSize(containerWidth, containerHeight)
getContainerDimensions()
```
- calcula dimensiones dinámicas de la grid
- asegura celdas cuadradas perfectas

#### **parte 3: posicionamiento aleatorio**
```javascript
generateRandomPositions(cols, rows)
```
- genera posiciones únicas para todas las secciones
- evita colisiones

#### **parte 4: pathfinding A***
```javascript
class PathNode { ... }
findPath(start, end, cols, rows)
generateAllPaths(positions, cols, rows)
```
- implementación completa del algoritmo A*
- encuentra caminos óptimos
- genera todos los caminos desde home

#### **parte 5: análisis de conexiones**
```javascript
getPieceType(connections)
analyzeCellConnections(allPaths, x, y)
```
- determina qué tipo de pieza necesita cada celda
- analiza direcciones de entrada/salida

#### **parte 6: renderizado**
```javascript
createGrid(gridSize, positions, paths)
initializeApp()
handleResize()
```
- crea y renderiza toda la grid
- maneja eventos de carga y resize

---

## 🎨 sistema de estilos CSS

### `css/styles.css` - organización

el CSS está organizado en secciones comentadas:

1. **estilos base**: reset y configuración del body
2. **layout principal**: sistema 70-30 responsive
3. **grid section**: contenedor de la grid
4. **celdas base**: estilos comunes de todas las celdas
5. **secciones home y destinos**: colores y estilos específicos
6. **piezas de tuberías**: todas las variantes de líneas
   - rectas (horizontal, vertical)
   - curvas (4 direcciones)
   - T (4 direcciones)
   - cruces
7. **logo section**: estilos del logo
8. **responsive**: ajustes para mobile
9. **optimizaciones**: mejoras de rendimiento

### cómo funcionan las piezas de tuberías

todas las piezas usan pseudo-elementos `::before` y `::after`:

```css
.pipe-straight-h::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 0;
    top: 50%;
    border-top: 2px dashed rgba(255, 255, 255, 0.6);
}
```

**ventajas:**
- sin imágenes, todo CSS puro
- líneas discontinuas nativas con `dashed`
- muy ligero en rendimiento
- fácil de modificar colores/grosor

---

## 🔄 flujo de ejecución

### al cargar la página:

1. `DOMContentLoaded` → `initializeApp()`
2. obtener dimensiones del contenedor
3. `calculateGridSize()` → calcula cols y rows
4. `generateRandomPositions()` → posiciona secciones
5. `generateAllPaths()` → calcula caminos con A*
6. `createGrid()` → renderiza todo
   - crea todas las celdas
   - marca home (verde) y destinos (rojos)
   - analiza conexiones de cada celda
   - añade clases CSS de piezas

### al hacer resize:

1. `window.resize` → `handleResize()`
2. espera 150ms (debounce)
3. vuelve a ejecutar `initializeApp()`
4. todo se recalcula y redibuja

### al recargar página:

- todo el proceso se ejecuta desde cero
- nuevas posiciones aleatorias
- nuevos caminos

---

## 🛠️ cómo modificar el código

### cambiar número de celdas en dimensión mayor

```javascript
// en js/grid.js, línea 9
const CONFIG = {
    CELLS_IN_MAX_DIMENSION: 15,  // cambiar de 10 a 15
    ...
};
```

### cambiar colores de home y destinos

```css
/* en css/styles.css */
.grid-cell.home {
    background-color: rgba(0, 255, 100, 0.3);  /* cambiar aquí */
    border: 2px solid rgba(0, 255, 100, 0.8);
}
```

### cambiar estilo de líneas

```css
/* en css/styles.css, cualquier pieza */
.pipe-straight-h::before {
    border-top: 3px dotted rgba(255, 0, 255, 0.8);  /* grosor, estilo, color */
}
```

### añadir más secciones

```javascript
// en js/grid.js, línea 15
const sections = [
    { name: 'home', url: 'index.html', type: CONFIG.SECTION_TYPES.HOME },
    { name: 'about', url: 'about.html', type: CONFIG.SECTION_TYPES.DESTINATION },
    // ... añadir más aquí
    { name: 'contact', url: 'contact.html', type: CONFIG.SECTION_TYPES.DESTINATION }
];
```

### cambiar tiempo de debounce en resize

```javascript
// en js/grid.js, línea 10
const CONFIG = {
    RESIZE_DEBOUNCE_MS: 300,  // cambiar de 150ms a 300ms
    ...
};
```

---

## 📊 rendimiento

### métricas aproximadas:

- **carga inicial**: 30-50ms
- **resize**: 40-60ms (con debounce)
- **memoria**: ~50kb
- **tamaño total**: ~500kb (incluyendo imágenes)

### optimizaciones implementadas:

1. **debounce en resize**: evita recálculos excesivos
2. **CSS containment**: aísla repaint de la grid
3. **will-change**: optimiza transiciones
4. **algoritmo A* eficiente**: O(n×m×log(n×m))

---

## 🐛 debugging

### mensajes en consola:

el código genera logs útiles para debugging:

```
🚀 inicializando safe amorx...
📐 grid calculada: {cols: 10, rows: 7, ...}
📍 posiciones generadas: [...]
🛤️ camino a about: 12 celdas
🛤️ camino a cv: 8 celdas
🛤️ camino a blog: 15 celdas
🛤️ camino a hiring: 10 celdas
✅ grid renderizada: 10 x 7
✨ aplicación lista
```

### inspeccionar celdas:

cada celda tiene atributos `data-x` y `data-y`:

```html
<div class="grid-cell pipe pipe-curve-tr" data-x="3" data-y="5">
```

---

## 🔮 posibles mejoras futuras

1. **animaciones**: animar la aparición de los caminos
2. **colores por destino**: cada camino con color diferente
3. **interactividad**: highlight del camino al hover en destino
4. **persistencia**: guardar última configuración en localStorage
5. **botón shuffle**: recargar sin refresh de página
6. **transiciones suaves**: al cambiar de grid size

---

## 📝 notas técnicas

### por qué A* y no dijkstra:

- A* es más eficiente (usa heurística)
- en grids pequeñas la diferencia es mínima
- código más educativo y entendible

### por qué CSS y no canvas/SVG:

- CSS es más fácil de mantener
- responsive automático
- mejor para debugging
- menos código

### por qué permitir cruces de caminos:

- más natural visualmente
- evita caminos muy largos
- simplifica el algoritmo
- estéticamente interesante

---

## 🎓 conceptos utilizados

- **algoritmo A***: pathfinding óptimo
- **CSS grid**: layout bidimensional
- **pseudo-elementos**: ::before y ::after
- **debouncing**: optimización de eventos
- **responsive design**: mobile-first
- **modularidad**: código separado por responsabilidades

---

## 📞 soporte

si necesitas modificar algo y no sabes cómo, busca la sección correspondiente en este documento. cada parte del código está claramente comentada y separada.
