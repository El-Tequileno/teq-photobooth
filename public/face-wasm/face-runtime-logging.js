// MediaPipe loads this after its WASM loader and before creating the module.
// Route the known CPU startup notice through info at the source. All other
// stderr output keeps its original handler, including real runtime failures.
(() => {
  const createModule = self.ModuleFactory;
  if (typeof createModule !== "function") throw new Error("Face runtime loader is unavailable");

  self.ModuleFactory = (options = {}) => {
    const writeError = options.printErr || ((...messages) => console.error(...messages));
    return createModule({
      ...options,
      printErr: (...messages) => {
        if (messages.length === 1 && typeof messages[0] === "string" &&
            messages[0].trim() === "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.") {
          console.info(...messages);
        } else {
          writeError(...messages);
        }
      },
    });
  };
})();
