import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export async function createFaceTracker() {
  const fileset = await FilesetResolver.forVisionTasks("/face-wasm");
  return FaceLandmarker.createFromOptions({
    ...fileset,
    assetLoaderPath: "/face-wasm/face-runtime-logging.js",
  }, {
    baseOptions: { modelAssetPath: "/face-model/face_landmarker.task", delegate: "CPU" },
    runningMode: "VIDEO",
    numFaces: 4,
    minFaceDetectionConfidence: .55,
    minFacePresenceConfidence: .55,
    minTrackingConfidence: .55,
  });
}
