// Development-only fixture, activated explicitly with ?camera=test.
// It exercises the actual capture/preview/GIF flow without a real webcam.
export function createTestCamera() {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1080;
  const ctx = canvas.getContext("2d");
  let animation;
  const start = performance.now();
  const draw = () => {
    const seconds = (performance.now() - start) / 1000;
    ctx.fillStyle = ["#315960", "#715247", "#464f7a"][Math.floor(seconds / 3) % 3];
    ctx.fillRect(0, 0, 720, 1080);
    ctx.fillStyle = "#d2af78";
    ctx.fillRect(120, 200, 480, 650);
    ctx.fillStyle = "#315960";
    ctx.beginPath(); ctx.arc(360, 310, 160, Math.PI, 0); ctx.fill();
    ctx.fillRect(200, 310, 320, 400);
    ctx.fillStyle = "#fff0cd";
    ctx.beginPath(); ctx.arc(360 + Math.sin(seconds) * 80, 380, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#e2ad57";
    ctx.fillRect(260, 465, 200, 190);
    ctx.fillStyle = "#fff7ed";
    ctx.textAlign = "center";
    ctx.font = "24px sans-serif";
    ctx.fillText("CAMARA DE PRUEBA", 360, 770);
    ctx.fillText(`${seconds.toFixed(1)} s`, 360, 810);
    animation = requestAnimationFrame(draw);
  };
  draw();
  const stream = canvas.captureStream(15);
  return { stream, stop() { cancelAnimationFrame(animation); stream.getTracks().forEach(track => track.stop()); } };
}
