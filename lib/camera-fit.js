export function fittedVideoRect(videoWidth, videoHeight, frameWidth, frameHeight) {
  const scale = Math.max(frameWidth / videoWidth, frameHeight / videoHeight);
  const width = videoWidth * scale;
  const height = videoHeight * scale;
  return { x: (frameWidth - width) / 2, y: (frameHeight - height) / 2, width, height };
}

export function drawFittedVideo(ctx, video, frameWidth, frameHeight, mirrored) {
  const { x, y, width, height } = fittedVideoRect(video.videoWidth, video.videoHeight, frameWidth, frameHeight);
  if (!mirrored) {
    ctx.drawImage(video, x, y, width, height);
    return;
  }
  ctx.save();
  ctx.translate(frameWidth, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, x, y, width, height);
  ctx.restore();
}
