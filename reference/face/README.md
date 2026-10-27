# Diseño Catrina

Filtro seleccionable y renderizado localmente:

- `public/effects/catrina-texture.png`: textura RGBA con pincel y base marfil.
- `public/effects/catrina-bloom-atlas.png`: tres flores RGBA aisladas (rosa roja,
  cempasúchil naranja y una segunda rosa), creadas con la herramienta integrada
  `image_gen`. Se colocan seis flores individuales siguiendo dos recorridos
  del contorno: 10–109–67–103–54–21–162 y 10–338–297–332–284–251–389.
  Se resuelven primero las dos rosas frontales y después las parejas laterales,
  calculando la distancia entre sus bordes proyectados para que los pétalos se
  toquen sin ocultar la flor vecina. Los diámetros relativos al ancho del rostro
  son 38% para las rosas frontales, 30% para los cempasúchiles y 24.5% para las
  rosas de los extremos. Si falta espacio en un rostro estrecho o girado, todo
  el conjunto se reduce conservando esas proporciones y la unión de las flores.
  Cada flor gira con la tangente local del contorno y conserva su forma redonda.
  Parte de los pétalos descansa sobre el cabello para evitar extremos flotantes.
  La diadema mantiene una pequeña elevación en el eje de la cabeza
  (4% del ancho del rostro), siguiendo la referencia del usuario.
  El PNG se carga localmente y forma parte de la caché sin conexión.

- `public/effects/catrina-leaf.png`: hoja de rosal verde oscuro con transparencia,
  generada con la herramienta integrada `image_gen` a partir de la corona original
  como referencia de estilo. Se dibujan dos hojas detrás de cada unión entre flores,
  hacia fuera y hacia dentro del arco, para rellenar los huecos. La geometría de
  las flores permanece intacta. El recurso se incluye en la caché sin conexión.

## Recurso actual: hojas verdes

Prompt utilizado con la herramienta integrada:

```text
Use case: photorealistic-natural
Asset type: single transparent rose-leaf sprite for the existing Catrina flower crown.
Input image: reference ONLY for dark forest-green leaf color, texture, veins and frontal light. Do not edit or reproduce the flowers or crown.
Primary request: Create exactly ONE isolated realistic green rose leaf lying horizontally, stem/base at the left and pointed tip at the right. Leaf blade centered vertically, filling about 88% of square canvas width and 46% of its height; short subtle stem at left. Dark natural forest-green, slightly leathery surface, clear fine pale branching veins, delicately serrated rounded edge, soft frontal light and natural shading. Match the realistic botanical look of the green leaves in the reference.
Composition: entire leaf visible, viewed from above, no tilt out of plane, with generous genuinely transparent space above and below.
Constraints: one leaf only; no flowers, no second leaf, no stems extending beyond canvas, no black/white background, no ground shadow, no text, no watermark. Real alpha transparency around the leaf.
```

## Recurso actual: flores individuales

Se usó la herramienta integrada `image_gen` para crear `public/effects/catrina-bloom-atlas.png`
a partir de la corona anterior, con fondo transparente. Prompt:

```text
Use case: precise-object-edit
Asset type: transparent sprite atlas of individual flowers extracted from the reference crown for a Catrina headband.
Input image: reference flower crown, for exact crimson rose and orange marigold appearance only.
Create ONE wide 3:1 transparent PNG divided into THREE equal square cells in a single horizontal row. Each cell contains exactly ONE isolated, complete, round flower head with no overlap and fully transparent empty margins: left cell a rich crimson red rose, center cell a warm orange cempasuchil marigold, right cell a second rich crimson red rose with slightly different natural petal arrangement. Match the reference's velvety dimensional petals, realistic fine texture and soft frontal light. Each blossom faces straight toward the viewer, stays circular and fills approximately 86 percent of its square cell's width and height, with even transparent margins. Keep every flower fully contained inside its own square cell. This is a spritesheet for separately placing flowers on a head: no connected crown, no garland, no stems, no leaves, no dangling points, no support band, no head, no person, no skull, no lettering, no grid lines, no watermark. Actual alpha transparency throughout the empty background. Preserve the crimson and orange palette and high-quality realistic style of the reference.
```

## Historial: corona floral anterior

La fuente original `public/effects/catrina-flower-crown.png` se conserva como
referencia. El recurso actual es `public/effects/catrina-flower-crown-rounded.png`.
Se editó con la herramienta integrada `image_gen`, manteniendo transparencia,
los colores y las flores. Prompt de corrección:

```text
Use case: precise-object-edit
Edit target: the attached transparent flower-crown PNG. This is a production headpiece sprite used above a Catrina face-paint filter.
Primary request: fix ONLY the silhouette at the two far ends and along the bottom so this crown rests naturally on a head without sharp dangling tips. Remove the pointed dark-green leaf spikes protruding down at the far left and far right, and all pointed hanging leaf tips along the lower edge. Tuck any remaining small green foliage behind the flower heads. The left end must finish in a rounded, full red rose-petal silhouette and the right end in a rounded, full orange marigold-petal silhouette, with no hanging stems or triangular points. Keep a softly rounded, compact lower edge formed mostly by petals and discreet tiny foliage. At both ends, blooms should look full and rounded, not skinny drooping spikes.
Invariants: preserve the same individual crimson roses and orange marigolds, their count, order, positions, sizes, natural detailed petal textures and soft frontal lighting. Preserve the wide shallow-arched composition and approximately 3:1 canvas aspect ratio. Do not redesign the flowers, do not add flowers, no new accessories, no head or person. Keep the central large crimson rose exactly as it is. Preserve genuine alpha transparency and transparent margins; no background, no cast shadow outside the cutout, no text, no watermark. Final image: same crown with its pointed lower foliage cleanly removed or tucked away.
```

Herramienta integrada `image_gen`, fondo transparente, recurso nuevo sin imagen
de entrada. Archivo final: `public/effects/catrina-flower-crown.png` (2172 × 724).

```text
Use case: stylized-concept
Asset type: transparent PNG floral headpiece sprite for a locally rendered Catrina face filter.
Primary request: an elegant Mexican Día de Muertos flower crown, viewed straight from the front, as a standalone horizontal accessory with genuine alpha transparency. A refined compact arrangement of seven overlapping blooms: rich crimson red roses and warm orange cempasúchil marigolds, a slightly larger central red rose, graduated smaller flowers toward both ends, a few tasteful dark green leaves tucked underneath. Visually lush dimensional petals, delicate natural irregularities, detailed velvety surfaces, soft painterly photographic realism matching sophisticated ivory/red/blue Catrina face paint.
Composition: wide horizontal canvas, approximately 3:1 aspect ratio. One shallow gently arched row of blossoms, centered, balanced. The flower heads face toward the viewer; the lower edge follows a shallow curved hairline. The arrangement should be much wider than tall, flowers close together, no tall vertical bouquet, no hanging stems. The subject fills 90% of canvas width and 80% height with transparent margins on all sides. Lowest petals/leaves form a tidy lower edge that can overlap the very top of a painted forehead. Soft frontal light with natural self-shadow between petals, crisp clean cutout edges, no cast shadow outside the flowers.
Constraints: crown ONLY, no head, no face, no mannequin, no skull, no hair, no makeup mask, no text, no watermark, no background, no ground, no extra accessories. Genuine transparent background. High-quality polished production asset.
```

La base blanca cubre la frente extendiendo el contorno superior hacia el cabello
según el eje frente/entrecejo del rostro. El arco superior es poco pronunciado
y la base se difumina en una franja estrecha, medida desde el borde en las
coordenadas de la textura. Así se evita desvanecer grandes triángulos de toda la
frente. Los pigmentos del adorno azul conservan su intensidad. Las mejillas y
la mandíbula conservan su transición suave.

`catrina-style-reference.png` es la imagen que proporcionó el usuario como
referencia de estilo. Este directorio no se sirve como contenido público.

## Malla y licencia

`canonical_face_model.obj` procede del repositorio oficial Google MediaPipe:
https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/modules/face_geometry/data/canonical_face_model.obj

Copyright Google LLC. Apache License 2.0, copia íntegra en `LICENSE`.
La geometría se usa para registrar los puntos y construir el modelo de prueba;
la triangulación adaptada al dibujo está en `lib/catrina-mesh.js`. El script
registra 127 puntos del seguimiento y deja libres los ojos y el interior de la
boca. `scripts/build-catrina-mesh.mjs` regenera sus coordenadas.

## Creación de la textura

Se usó la herramienta integrada `image_gen`, con fondo transparente y la imagen
del usuario como referencia. La generación es una tarea de creación del recurso;
la app únicamente carga el PNG local para renderizarlo.

Prompt utilizado:

```text
Use case: stylized-concept
Asset type: production face-paint texture atlas for a locally rendered augmented-reality Catrina filter. The input image is a STYLE REFERENCE ONLY: borrow its ivory makeup, deep black eye sockets, small crimson scalloped borders, delicate cobalt blue forehead and cheek flourishes, and skeletal mouth. Create an original elegant hand-painted cosmetic design with refined, very fine brushwork.
Output: one straight-on perfectly symmetrical flattened face-paint mask on a genuinely transparent background. This is paint ONLY, no person, no skin, no actual eyeballs, no eyelashes, no nose photograph, no hair, no ears, no neck, no flower crown. Preserve the person's real eye and mouth openings through transparent holes. Opaque smoky black almond eye SOCKETS around transparent almond eye openings, fine red lace petals around sockets, black upside-down heart nasal paint, delicate skeletal black mouth stitches over ivory lips, thin curved blue cheek filigree, small blue dots above brows, central blue teardrop forehead ornament and small red petal motif on chin. The ivory base is a smooth face oval with very softly feathered outside edge. Black/crimson/blue paint has subtle believable brush texture and soft cosmetic blending, highly detailed elegant festival makeup.
Precise layout required for software mapping: square canvas. Oval face extends from x=16% to84%, y=4% to96%; widest at cheeks y=49%. Chin centered x50%,y96%. Eye socket centers x=33%,67%,y=42%; eye openings at the same centers. Brow arcs around y=34%. Nose tip centered x50%,y60%; bottom of nose y66%. Mouth seam horizontal centered x50%,y76%, extending x34% to66%; cheek stitch extensions reach x25% and75%. Blue forehead flourish centered x50%,y24%. Blue cheek swirls around x25%,75%,y65%. Red chin ornament x50%,y88%. All decoration stays inside face oval. No text, no watermark, no lighting cast shadows, no 3D head rendering, no background. Large clean margins outside the mask, actual alpha transparency.
```

Las coordenadas finales se registraron según el resultado de la herramienta.

## Verificación

`npm test` comprueba encuadre, reflejo, malla sin triángulos invertidos y aberturas
sin pintura sobre ojos/boca. La comparación visual se hizo con la foto local de
prueba existente `camera-laptop-preview.jpg`, sin enviarla a otro servicio.
