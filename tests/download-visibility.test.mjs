import assert from "node:assert/strict";
import test from "node:test";
import { shouldShowDownload } from "../lib/download-visibility.js";

test("direct download stays available on laptops and phones but not tablets or kiosk mode", () => {
  assert.equal(shouldShowDownload({ userAgent: "Windows NT 10.0", platform: "Win32", maxTouchPoints: 0, screen: { width: 390, height: 720 } }), true);
  assert.equal(shouldShowDownload({ userAgent: "iPhone; CPU iPhone OS 18_0 like Mac OS X", platform: "iPhone", maxTouchPoints: 5 }), true);
  assert.equal(shouldShowDownload({ userAgent: "Android 14; Pixel 8; Mobile Safari", platform: "Linux armv8l", maxTouchPoints: 5 }), true);
  assert.equal(shouldShowDownload({ userAgent: "iPad; CPU OS 18_0 like Mac OS X", platform: "iPad", maxTouchPoints: 5 }), false);
  assert.equal(shouldShowDownload({ userAgent: "Macintosh; Intel Mac OS X 10_15", platform: "MacIntel", maxTouchPoints: 5 }), false);
  assert.equal(shouldShowDownload({ userAgent: "Android 14; Pixel Tablet", platform: "Linux armv8l", maxTouchPoints: 5 }), false);
  assert.equal(shouldShowDownload({ userAgent: "Windows NT 10.0", platform: "Win32", maxTouchPoints: 0 }, "?kiosk=1"), false);
});
