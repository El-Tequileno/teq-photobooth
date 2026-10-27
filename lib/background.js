import { fittedVideoRect } from "./camera-fit.js";

export const AGAVE_BACKGROUND = "/backgrounds/agave-fields.jpg";

// Keep confident foreground pixels opaque while feathering hair and clothing edges.
export function personAlpha(confidence) {
  const t = Math.max(0, Math.min(1, (confidence - .25) / .5));
  return Math.round(t * t * (3 - 2 * t) * 255);
}

export function createBackgroundCompositor(image) {
  const source = document.createElement("canvas");
  const input = document.createElement("canvas");
  const mask = document.createElement("canvas");
  const foreground = document.createElement("canvas");
  const scenery = document.createElement("canvas");
  const sourceCtx = source.getContext("2d");
  const inputCtx = input.getContext("2d");
  const maskCtx = mask.getContext("2d");
  const foregroundCtx = foreground.getContext("2d");
  const sceneryCtx = scenery.getContext("2d");
  if (![sourceCtx, inputCtx, maskCtx, foregroundCtx, sceneryCtx].every(Boolean)) {
    throw new Error("Background canvas is unavailable");
  }
  let hasMask = false;
  let maskPixels;
  let lastTimestamp = 0;
  return {
    // Freeze the pixels before segmentation so moving visitors and their mask match.
    update(video, segmenter) {
      if (source.width !== video.videoWidth || source.height !== video.videoHeight) {
        source.width = video.videoWidth;
        source.height = video.videoHeight;
        const scale = Math.min(1, 384 / Math.max(source.width, source.height));
        input.width = Math.round(source.width * scale);
        input.height = Math.round(source.height * scale);
      }
      sourceCtx.drawImage(video, 0, 0);
      inputCtx.drawImage(source, 0, 0, input.width, input.height);
      let personPixels = 0;
      lastTimestamp = Math.max(performance.now(), lastTimestamp + 1);
      segmenter.segmentForVideo(input, lastTimestamp, result => {
        // The bundled binary selfie model emits a single foreground confidence mask.
        const confidence = result.confidenceMasks?.[0];
        if (!confidence) throw new Error("Person mask is unavailable");
        if (mask.width !== confidence.width || mask.height !== confidence.height) {
          mask.width = confidence.width;
          mask.height = confidence.height;
          maskPixels = maskCtx.createImageData(mask.width, mask.height);
        }
        const values = confidence.getAsFloat32Array();
        for (let i = 0; i < values.length; i += 1) {
          const offset = i * 4;
          maskPixels.data[offset] = 255;
          maskPixels.data[offset + 1] = 255;
          maskPixels.data[offset + 2] = 255;
          maskPixels.data[offset + 3] = personAlpha(values[i]);
          if (values[i] > .75) personPixels += 1;
        }
        maskCtx.putImageData(maskPixels, 0, 0);
        hasMask = true;
      });
      return personPixels > mask.width * mask.height * .01;
    },
    draw(ctx, width, height, mirrored) {
      if (!hasMask) throw new Error("Background is not ready");
      if (scenery.width !== width || scenery.height !== height) {
        scenery.width = foreground.width = width;
        scenery.height = foreground.height = height;
        // Center the path and preserve the mountain horizon in the original photo.
        const rect = fittedVideoRect(image.naturalWidth, image.naturalHeight, width, height);
        const blur = width / 600;
        sceneryCtx.save();
        if ("filter" in sceneryCtx) {
          sceneryCtx.filter = `blur(${blur}px)`;
          sceneryCtx.drawImage(image, rect.x - blur * 3, rect.y - blur * 3, rect.width + blur * 6, rect.height + blur * 6);
        } else {
          // Small weighted blur for Safari versions without CanvasRenderingContext2D.filter.
          const weights = [1, 2, 1];
          for (let y = -1; y <= 1; y += 1) for (let x = -1; x <= 1; x += 1) {
            sceneryCtx.globalAlpha = weights[x + 1] * weights[y + 1] / 16;
            sceneryCtx.globalCompositeOperation = "lighter";
            sceneryCtx.drawImage(image, rect.x + x * blur - blur * 3, rect.y + y * blur - blur * 3, rect.width + blur * 6, rect.height + blur * 6);
          }
        }
        sceneryCtx.restore();
      }
      const rect = fittedVideoRect(source.width, source.height, width, height);
      foregroundCtx.clearRect(0, 0, width, height);
      foregroundCtx.save();
      if (mirrored) { foregroundCtx.translate(width, 0); foregroundCtx.scale(-1, 1); }
      foregroundCtx.drawImage(source, rect.x, rect.y, rect.width, rect.height);
      foregroundCtx.globalCompositeOperation = "destination-in";
      foregroundCtx.drawImage(mask, rect.x, rect.y, rect.width, rect.height);
      foregroundCtx.restore();
      ctx.drawImage(scenery, 0, 0);
      ctx.drawImage(foreground, 0, 0);
    },
    dispose() {
      hasMask = false;
      maskPixels = null;
      for (const canvas of [source, input, mask, foreground, scenery]) canvas.width = canvas.height = 0;
    },
  };
}
