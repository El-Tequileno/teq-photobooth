import frames from "../public/frames/frames.json";

export const FRAME_WIDTH = 1080;
export const FRAME_HEIGHT = 1620;
export const FRAMES = frames;

// Draw the same transparent PNG used in the live preview, over the camera image.
export function drawFrame(ctx, image, width, height) {
  if (!image) throw new Error("Frame image is not ready");
  ctx.drawImage(image, 0, 0, width, height);
}
