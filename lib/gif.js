// GIF frames are composed locally. No photo is uploaded to encode the animation.
export async function encodeGif(frames) {
  if (frames.length !== 3) throw new Error("A GIF session requires exactly three photos.");
  const { width, height } = frames[0];
  if (!width || !height || frames.some(frame => frame.width !== width || frame.height !== height || frame.data.length !== width * height * 4)) {
    throw new Error("All GIF frames must have matching dimensions and RGBA data.");
  }
  const encoderModule = await import("gifenc");
  // The browser ESM build has a function as its default export; Node's CJS
  // build has an exports object. Prefer named exports instead of treating
  // every default export as an object (which broke GIFs only in the browser).
  const GIFEncoder = encoderModule.GIFEncoder || encoderModule.default?.GIFEncoder || encoderModule.default;
  const quantize = encoderModule.quantize || encoderModule.default?.quantize;
  const applyPalette = encoderModule.applyPalette || encoderModule.default?.applyPalette;
  if ([GIFEncoder, quantize, applyPalette].some(fn => typeof fn !== "function")) {
    throw new Error("GIF encoder could not be loaded.");
  }
  const gif = GIFEncoder();
  for (const frame of frames) {
    const palette = quantize(frame.data, 256);
    const indexed = applyPalette(frame.data, palette);
    gif.writeFrame(indexed, width, height, { palette, delay: 650, repeat: 0 });
  }
  gif.finish();
  return gif.bytes();
}
