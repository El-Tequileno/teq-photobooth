# TEQ Photobooth

Photo booth para el tasting room de El Tequileño. Base reutilizada de
photobooth-kiosk; interfaz inspirada en las referencias de Curator Live.

## Estado por pasos

1. Bienvenida con logo oficial y selección Español / English.
2. Selección de Foto o GIF de tres fotografías, con fondo azul y botones dorados.
   Volver a la bienvenida conserva el idioma; terminar una sesión vuelve al español.

Las dos opciones abren la cámara reutilizada del prototipo, ahora traducida.
Foto genera un JPEG. GIF captura tres fotos con cuenta regresiva independiente y
reproduce las tres en bucle. El resultado coincide con la vista previa y se
procesa localmente. Permite compartir en teléfonos y repetir.
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

La entrega por correo ya está integrada con Resend; necesita un remitente
verificado para enviar de verdad. La app incluye manifiesto, íconos y service
worker para instalarse como PWA. Los marcos son PNG transparentes exportados de
los diseños iniciales con el logo oficial; no son archivos originales de Curator.

## Instalar como PWA

Publicar la app con HTTPS; `localhost` también permite probarla localmente.
En iPhone o iPad, abrirla en Safari y usar **Compartir → Agregar a pantalla de
inicio**. En Chrome o Edge, usar la opción **Instalar aplicación** del navegador.
Abrirla una vez con conexión para que se guarden la interfaz, los marcos y el
codificador GIF. Después puede abrirse sin conexión para tomar fotos y crear GIF;
el envío por correo y el registro en ActiveCampaign requieren Internet. Las fotos
y los datos de visitantes no se guardan en la caché del service worker.

El service worker se registra solo en producción: probar con `npm run build` y
`npm run start`, o en el sitio publicado. El servidor de desarrollo no lo
registra para evitar que recursos viejos interfieran con los cambios. La cámara
requiere permiso del navegador incluso cuando la PWA ya está instalada.

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
En teléfonos, la cámara muestra toda la imagen sin ampliar el recorte para
llenar el marco vertical. Una copia oscurecida rellena los espacios laterales o
superiores; el JPEG y cada fotograma del GIF usan el mismo encuadre. En la
tablet fija y en computadoras se conserva el encuadre anterior.

El botón **Compartir** entrega el JPG o GIF al menú nativo del teléfono; en
iPhone se puede elegir **Guardar imagen** para conservar el GIF animado en Fotos.
Se muestra solo en teléfonos con soporte para compartir archivos. Se oculta en
computadoras, iPad y tablets Android, y también con `?kiosk=1` en la URL.
Si el navegador no ofrece esta función, la entrega por correo sigue disponible.

Verificado en el navegador con tamaños de 320 × 568, 360 × 640, 390 × 844,
430 × 932, 568 × 320, 844 × 390, 768 × 1024 y 1280 × 720, además de foto y GIF
con cámara de prueba. Falta verificar permisos/captura en Safari y Chrome de
dispositivos físicos.

## Desarrollo

```sh
npm ci
npm run dev
```

Para activar el envío, configurar en `.env.local` (sin subir este archivo al
repositorio):

```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=photobooth@paradisespirits.com
```

La clave debe permitir enviar correos y el dominio de `RESEND_FROM_EMAIL` debe
estar verificado en Resend. Reiniciar el servidor de desarrollo después de
cambiar estas variables. El correo contiene solo el mensaje y un archivo JPG o
GIF adjunto. El archivo se conserva en memoria hasta terminar la sesión para
poder reintentar si falla el envío. Resend recibe la imagen para entregarla.

## Contactos en ActiveCampaign

En **Configuración → Desarrollador** de ActiveCampaign, copiar la URL y clave API
en `.env.local` (no en el navegador ni en Git):

```env
ACTIVECAMPAIGN_API_URL=https://tu-cuenta.api-us1.com
ACTIVECAMPAIGN_API_KEY=tu_clave
```

Con ambas variables, cada envío registra o actualiza el contacto usando su correo
y nombre, y agrega únicamente la etiqueta `photobooth`. La foto nunca se sube a
ActiveCampaign. Si la integración falla, la foto se envía de todos modos y la
pantalla avisa que los datos no se guardaron. Sin base de datos o cola propia no
hay reintento automático duradero para ese registro.

Para activar la casilla opcional de comunicaciones, crear primero la lista de
marketing en ActiveCampaign y agregar su ID numérico a `.env.local`:

```env
ACTIVECAMPAIGN_MARKETING_LIST_ID=123
```

Sin ese ID, la casilla aparece deshabilitada y la foto sigue pudiendo enviarse.
Con consentimiento marcado se suscribe al contacto a la lista; sin marcar, no se
modifica su suscripción de marketing. Un contacto que ya canceló
su suscripción o rebotó no se reactiva desde el kiosco.

Se comprobó el envío de una foto y un GIF sintéticos desde la app a
`delivered@resend.dev`, la dirección de prueba de Resend. No se usaron fotos ni
correos de visitantes en esa prueba.

La ruta `/api/send-photo` limita tamaño y frecuencia de peticiones en el proceso
actual. Antes de publicar el endpoint para acceso general, hace falta un límite
persistente entre instancias y comprobar el volumen/costo de envío. La app
requiere conexión a Internet para enviar, aunque la cámara y la creación del
archivo funcionen localmente.

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
Para revisar el encuadre de celular con una señal de cámara ancha en una
computadora, usar `/?camera=test-wide&phone=test` en desarrollo.

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
