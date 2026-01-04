# TODO

## 22-12-25
- Definir si el formatter debe priorizar el guardado local o permitir recargar desde el repo (boton o clear storage).
- Forzar no-cache al cargar `data.json` en paginas internas para evitar contenido viejo.
- Anadir fallback si `navigator.clipboard` no esta disponible (contexto no seguro / file://).

## 27-12-25
- Revisar boton "Copiar JSON" del formatter: agregar fallback y mejor feedback cuando falle.

## 29-12-25
- Nombrar magic numbers y moverlos a variables (CSS custom properties y CONFIG en JS), incluyendo el limite de intentos del grid.
- Cambiar deteccion de pagina del loader a data-attr en body y actualizar HTML/README.
- Limpiar fuentes: eliminar familias no usadas y cargar solo las necesarias via link en cada HTML.
- Pase final de orden/consistencia del CSS (tokens agrupados, secciones coherentes, sin redundancias).
