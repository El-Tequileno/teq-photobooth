import assert from "node:assert/strict";
import test from "node:test";
import { isPhoneDevice } from "../lib/share-availability.js";

test("sharing is offered on phones, not laptops or fixed kiosks", () => {
  assert.equal(isPhoneDevice({ userAgent: "Windows NT 10.0", screen: { width: 390, height: 720 } }), false);
  assert.equal(isPhoneDevice({ userAgent: "iPhone; CPU iPhone OS 18_0 like Mac OS X" }), true);
  assert.equal(isPhoneDevice({ userAgent: "Android 14; Pixel 8; Mobile Safari" }), true);
  assert.equal(isPhoneDevice({ userAgent: "iPad; CPU OS 18_0 like Mac OS X" }), false);
  assert.equal(isPhoneDevice({ userAgent: "Macintosh; Intel Mac OS X 10_15" }), false);
  assert.equal(isPhoneDevice({ userAgent: "Android 14; Pixel Tablet" }), false);
  assert.equal(isPhoneDevice({ userAgent: "iPhone", userAgentData: { mobile: false } }), false);
  assert.equal(isPhoneDevice({ userAgent: "Windows NT 10.0", userAgentData: { mobile: true } }), true);
  assert.equal(isPhoneDevice({ userAgent: "iPhone" }, "?kiosk=1"), false);
});
