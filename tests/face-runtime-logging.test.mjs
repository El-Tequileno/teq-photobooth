import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../public/face-wasm/face-runtime-logging.js", import.meta.url), "utf8");
const startupNotice = "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.";

function runtime(factory) {
  const info = [], errors = [];
  const logger = { info: (...args) => info.push(args), error: (...args) => errors.push(args) };
  const originalError = logger.error;
  const self = { ModuleFactory: factory };
  vm.runInNewContext(source, { self, console: logger });
  assert.equal(logger.error, originalError, "The global console must stay unchanged");
  return { create: self.ModuleFactory, info, errors };
}

test("only the known CPU startup notice is classified as info, including first-frame output", async () => {
  const tracker = {};
  let moduleOptions;
  const instance = runtime(options => { moduleOptions = options; return Promise.resolve(tracker); });
  const locateFile = file => `/local/${file}`;
  const options = { locateFile, canvas: {} };
  assert.equal(await instance.create(options), tracker);
  assert.equal(moduleOptions.locateFile, locateFile);
  assert.equal(moduleOptions.canvas, options.canvas);
  assert.equal(options.printErr, undefined);
  // The notice can arrive after asynchronous initialization, on first detection.
  moduleOptions.printErr(startupNotice);
  moduleOptions.printErr("Failed to load face model");
  moduleOptions.printErr("INFO: An unexpected runtime message");
  assert.deepEqual(instance.info, [[startupNotice]]);
  assert.deepEqual(instance.errors, [["Failed to load face model"], ["INFO: An unexpected runtime message"]]);
});

test("an existing stderr handler and thrown initialization errors are preserved", () => {
  const forwarded = [];
  const instance = runtime(options => {
    options.printErr(startupNotice);
    options.printErr("RuntimeError", { code: 5 });
    throw new Error("WASM initialization failed");
  });
  assert.throws(() => instance.create({ printErr: (...args) => forwarded.push(args) }), /WASM initialization failed/);
  assert.deepEqual(forwarded, [["RuntimeError", { code: 5 }]]);
  assert.deepEqual(instance.info, [[startupNotice]]);
  assert.deepEqual(instance.errors, []);
});
