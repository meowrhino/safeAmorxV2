# safe amorx

sitio web personal con diseño responsive y navegación interactiva mediante grid 10x10.

## características

- **diseño responsive**: layout 70-30 que se adapta de horizontal (desktop) a vertical (mobile)
- **navegación aleatoria**: cada vez que se carga la página home, las secciones aparecen en posiciones aleatorias en la grid
- **tecnologías**: html, css y javascript vanilla (sin frameworks)
- **fuente**: bbh bogle de google fonts

## estructura

```
safeAmorx/
├── index.html          # página principal con grid 10x10
├── about.html          # página about
├── cv.html             # página cv
├── blog.html           # página blog
├── hiring.html         # página hiring
├── css/
│   ├── styles.css      # estilos principales y responsive
│   └── pages.css       # estilos para páginas internas
├── js/
│   └── grid.js         # lógica de la grid y posicionamiento aleatorio
└── assets/
    └── images/
        ├── LOGO.webp
        └── background.webp
```

## uso

simplemente abre `index.html` en tu navegador. cada vez que recargues la página, las secciones aparecerán en diferentes posiciones de la grid.

## navegación

la página principal muestra una grid de 10x10 donde se distribuyen aleatoriamente las 5 secciones:
- home
- about
- cv
- blog
- hiring

haz clic en cualquier sección para navegar a ella.
