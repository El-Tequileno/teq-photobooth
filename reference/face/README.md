# Diseño Catrina

Filtro seleccionable y renderizado localmente:

- `public/effects/catrina-texture.png`: textura RGBA con pincel y base marfil.
- `public/effects/catrina-flower-crown.png`: corona RGBA transparente de rosas
  rojas y cempasúchiles naranjas, creada con la herramienta integrada `image_gen`.
  Se dibuja como accesorio sobre el borde superior de la pintura; la inclinación
  y la anchura proyectada siguen el eje de la cabeza y los giros del rostro.
  El PNG se carga localmente y forma parte de la caché sin conexión.

## Prompt de la corona floral

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
