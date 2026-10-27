import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

export async function createBackgroundSegmenter() {
  const fileset = await FilesetResolver.forVisionTasks("/face-wasm");
  return ImageSegmenter.createFromOptions({
    ...fileset,
    assetLoaderPath: "/face-wasm/face-runtime-logging.js",
  }, {
    baseOptions: { modelAssetPath: "/background-model/selfie_segmenter.tflite", delegate: "CPU" },
    runningMode: "VIDEO",
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  });
}
