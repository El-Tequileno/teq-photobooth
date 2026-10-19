# TEQ Photobooth

Photo booth para el tasting room de El Tequileño. Base reutilizada de
photobooth-kiosk; interfaz inspirada en las referencias de Curator Live.

## Estado por pasos

1. Bienvenida con logo oficial y selección Español / English.
2. Selección de Foto o GIF de tres fotografías, con fondo azul y botones dorados.
   Volver a la bienvenida conserva el idioma; terminar una sesión vuelve al español.

Las dos opciones abren la cámara reutilizada del prototipo, ahora traducida.
Foto genera un JPEG. GIF captura tres fotos con cuenta regresiva independiente y
reproduce las tres en bucle. La captura se recorta para coincidir con la vista
previa y se procesa localmente. El resultado permite descargar y repetir.
No hay llamadas a IA, impresión ni un QR de demostración en el flujo de usuario.
Los archivos se liberan de la memoria al repetir, terminar o vencer la sesión.

3. Cámara vertical con fondo oscuro, marco blanco/negro, logo y cuenta regresiva
   grande, siguiendo la referencia. Tres marcos preestablecidos (Clásico, Agave
   y Celebración) se seleccionan en vivo sin reiniciar la cámara. El mismo PNG
   se aplica a la vista previa y a todas las fotografías del GIF. Los logos y
   textos quedan derechos aunque la vista de cámara sea de espejo.

Se corrigió la carga del codificador GIF: en el navegador su exportación por
defecto es una función, mientras que en Node es un objeto. Se priorizan ahora
las exportaciones nombradas, evitando el error que solo aparecía en navegador.

La entrega por correo y la instalación/funcionamiento offline como PWA siguen
pendientes. Los marcos son PNG transparentes exportados de los diseños iniciales con el logo oficial;
no son archivos originales exportados desde Curator.

## Administrar marcos

Los PNG se guardan en `public/frames/` y la lista de marcos se configura en
`public/frames/frames.json` (archivo, nombre en español e inglés y orden).
Para cambiar un diseño basta reemplazar su PNG; para añadir o quitar opciones,
editar la lista. Usar 1080 × 1620 px con el área de la foto transparente.
La vista previa, las miniaturas y la captura utilizan el mismo archivo; no se
habilita el disparo hasta que el marco seleccionado esté cargado y tenga la
proporción correcta. Un archivo que falle no impide utilizar los otros marcos.
Ver `public/frames/README.md` para las instrucciones completas. Todavía no hay
una pantalla de administración para subir archivos.

## Celular y tablet

La bienvenida, selección, cámara y resultado se adaptan al ancho y a la altura
disponibles, incluyendo las barras del navegador y áreas seguras. En horizontal
la cámara queda junto a los controles; el encuadre conserva siempre la proporción
2:3 del PNG y de la captura. Los marcos tienen desplazamiento horizontal cuando
no caben, y los botones del resultado se reorganizan en pantallas pequeñas.
Las pantallas muy bajas permiten desplazarse sin cortar el inicio del contenido.

Verificado en el navegador con tamaños de 320 × 568, 360 × 640, 390 × 844,
430 × 932, 568 × 320, 844 × 390, 768 × 1024 y 1280 × 720, además de foto y GIF
con cámara de prueba. Falta verificar permisos/captura en Safari y Chrome de
dispositivos físicos.

## Desarrollo

```sh
npm ci
npm run dev
```

Abrir la dirección Local que muestre Next.js. Para usar un puerto específico:

```sh
npm run dev -- --port 3001
```

La cámara necesita localhost o HTTPS. No hacen falta claves de IA para el flujo
actual. Las rutas y recursos antiguos de IA e impresión todavía están en el
repositorio como código heredado, pero la interfaz no los utiliza.

Para una prueba de desarrollo sin webcam, abrir `/?camera=test`. Solo funciona
en modo desarrollo y muestra «Cámara de prueba»; se genera una escena animada
localmente y se recorre exactamente la misma captura y codificación. La URL
normal `/` siempre utiliza la cámara real del dispositivo.

## Verificación

```sh
npm run build
```

Además de compilar, comprobar las dos opciones, ambos idiomas, volver sin perder
el idioma, permisos de cámara, cancelación de la cuenta regresiva y los tres
fotogramas del GIF. La prueba de cámara real debe hacerse también en el iPad.
Si el sistema bloquea la cámara, la interfaz distingue el permiso denegado de
una cámara inexistente u ocupada. Las imágenes no se incluyen en los registros
de diagnóstico.

Verificado en navegador con cámara de prueba y con la webcam real de la laptop:
selección de marcos, cuenta regresiva, tres capturas y resultado GIF. El archivo
sintético del codificador también se decodificó por separado para comprobar los
tres fotogramas, su orden, el intervalo y el bucle. Sigue pendiente la prueba en
el iPad del booth.

Tras convertir los marcos a PNG, se verificaron sus dimensiones y transparencia,
las miniaturas y selección en vivo, un JPEG de 1080 × 1620 y un GIF de 540 × 810
en el navegador con cámara de prueba. La compilación de producción también pasa.

## Recursos de marca

El SVG blanco oficial procede de los recursos locales del proyecto El TEQ Game.
Las tarjetas de bienvenida son ilustraciones decorativas, no fotos de visitantes.
