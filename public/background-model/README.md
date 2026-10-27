# MediaPipe Selfie Segmenter

Recurso oficial descargado el 27 de octubre de 2026:
https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite

SHA-256: `191ac9529ae506ee0beefa6b2c945a172dab9d07d1e802a290a4e4038226658b`

Documentación y ficha del modelo:
https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter
https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Selfie%20Segmentation.pdf

Se usa con `@mediapipe/tasks-vision` 0.10.32 y los archivos locales de
`public/face-wasm/`. Este modelo emite una sola máscara de confianza de primer
plano; no intercambiar su canal por el índice de categoría de un modelo multiclase.
El modelo y el paisaje forman parte de la caché de la PWA. No se envía video
a un servicio de segmentación y no hace falta una clave API.
