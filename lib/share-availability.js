export function isPhoneDevice(device, search = "") {
  if (new URLSearchParams(search).get("kiosk") === "1") return false;
  if (typeof device.userAgentData?.mobile === "boolean") return device.userAgentData.mobile;
  return /iPhone|iPod|Windows Phone|Android.*Mobile/i.test(device.userAgent || "");
}
