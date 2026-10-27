# Fondo Campos de agave

`agave-fields.jpg` es una copia de `agavefields-3.jpg`, facilitada por el usuario.
Se conserva el original horizontal de 1920 × 1079 px. La app hace un recorte
central 2:3 que mantiene el camino y las montañas, y aplica un desenfoque suave
proporcional al tamaño de salida. El paisaje no se refleja con la cámara frontal.

El fondo se inicia seleccionado. **Sin fondo** recupera la cámara normal. La
selección se conserva al repetir y vuelve a Campos de agave al iniciar otra sesión.
Los marcos y Catrina se dibujan por encima de las personas.

Para un resultado natural en el booth: cámara aproximadamente a la altura de los
ojos, visitantes centrados y encuadrados de cintura hacia arriba, luz frontal
suave y uniforme, evitando contraluz. La app muestra la recomendación de encuadre;
no cambia automáticamente la iluminación del lugar ni inventa suelo o sombras.

El recorte usa el modelo binario de MediaPipe Selfie Segmenter en el navegador.
Cabello fino, accesorios, movimiento rápido y personas pequeñas o distantes
pueden producir errores de contorno. Comprobar el efecto con grupos y con
Catrina en el dispositivo físico del booth antes de utilizarlo en el evento.
