# Diseño: paleta GuíaU Rural (azul y verde)

Los colores viven como variables en [`frontend/src/style.css`](frontend/src/style.css), dentro de `@theme`.
Para cambiar la paleta basta editar ese bloque.

## Paleta y para qué se usa

| Token | Color | Uso |
|---|---|---|
| `night` | `#0B1B3A` azul medianoche | Portada, logo, texto sobre menta claro |
| `brand` | `#1B6B4C` verde medio | Botones principales y enlaces |
| `brand-dark` | `#134F38` | Botón al pasar el cursor |
| `green-ink` | `#17724A` verde oscuro | Texto verde (estado «Abierta», «Verificado») |
| `mint` | `#5BC78F` menta | Acentos **solo sobre fondos oscuros** y detalles decorativos |
| `mint-soft` | `#A8EBC6` menta claro | Fondos suaves, siempre con texto `night` |
| `brand-soft` | `#ECEFF5` azul pálido | Menú activo y superficies |
| `paper` | `#F7F8FA` | Fondo de la página |
| `ink` | `#121A2B` | Texto principal |
| `ink-soft` | `#5B6578` | Texto secundario |

Colores de estado que **no** vienen de la paleta, porque el significado lo exige: ámbar para
«Próxima» y rojo para errores. Cada estado lleva además forma y texto (✔ ◆ ○), nunca solo color.

## Contrastes medidos (mínimo cómodo para texto: 4,5)

| Combinación | Contraste |
|---|---|
| Texto principal sobre fondo | 16,4 |
| Texto secundario sobre fondo | 5,5 |
| Blanco sobre verde medio (botón) | 6,5 |
| Verde sobre azul pálido (menú activo) | 5,6 |
| Azul medianoche sobre menta (botón de portada) | 8,1 |
| Blanco sobre azul medianoche | 17,0 |
| Verde oscuro sobre menta claro | **4,3: no se usa** (con menta claro va azul medianoche) |
| Menta sobre blanco | **2,0: solo decorativo**, nunca texto |

El borde de campos y botones usa `line-strong` (`#7C879B`, 3,6:1) para que se distingan. El borde de
tarjetas (`line`) es decorativo.

## Tipografía y movimiento

- **Atkinson Hyperlegible** para el texto y **Lexend** para los títulos; ambas se guardan en el
  dispositivo y funcionan sin conexión.
- Las tarjetas aparecen con un ligero desplazamiento. Con «reducir movimiento» en el sistema, todas
  las animaciones se desactivan.
- Objetivos táctiles de 44 px como mínimo y foco de teclado visible.
