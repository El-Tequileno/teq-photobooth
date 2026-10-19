import assert from "node:assert/strict";
import test from "node:test";
import { drawFittedVideo, fittedVideoRect } from "../lib/camera-fit.js";

test("camera fills the entire 2:3 frame without duplicate shaded bands", () => {
  const wide = fittedVideoRect(1280, 720, 1080, 1620);
  assert.deepEqual(wide, { x: -900, y: 0, width: 2880, height: 1620 });
  const tall = fittedVideoRect(720, 1280, 1080, 1620);
  assert.deepEqual(tall, { x: 0, y: -150, width: 1080, height: 1920 });
  const portrait = fittedVideoRect(720, 1080, 1080, 1620);
  assert.deepEqual(portrait, { x: 0, y: 0, width: 1080, height: 1620 });
});

test("front camera is mirrored and rear camera is not in the saved image", () => {
  const operations = [];
  const video = { videoWidth: 720, videoHeight: 1080 };
  const ctx = {
    save: () => operations.push("save"),
    translate: (...args) => operations.push(["translate", ...args]),
    scale: (...args) => operations.push(["scale", ...args]),
    drawImage: (...args) => operations.push(["drawImage", ...args]),
    restore: () => operations.push("restore"),
  };
  drawFittedVideo(ctx, video, 1080, 1620, true);
  assert.deepEqual(operations, ["save", ["translate", 1080, 0], ["scale", -1, 1], ["drawImage", video, 0, 0, 1080, 1620], "restore"]);
  operations.length = 0;
  drawFittedVideo(ctx, video, 1080, 1620, false);
  assert.deepEqual(operations, [["drawImage", video, 0, 0, 1080, 1620]]);
});
