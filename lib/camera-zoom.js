export async function setOneXZoom(track) {
  try {
    const range = track?.getCapabilities?.()?.zoom;
    if (!Number.isFinite(range?.min) || !Number.isFinite(range?.max) || range.min > 1 || range.max < 1) return false;
    const currentZoom = track.getSettings?.()?.zoom;
    if (Number.isFinite(currentZoom) && Math.abs(currentZoom - 1) < 0.01) return true;
    await track.applyConstraints({ ...track.getConstraints?.(), zoom: { exact: 1 } });
    return Math.abs(track.getSettings?.()?.zoom - 1) < 0.01;
  } catch {
    // Some browsers expose zoom but do not allow setting it on this camera.
    return false;
  }
}
