export function shouldShowDownload(device, search = "") {
  if (new URLSearchParams(search).get("kiosk") === "1") return false;

  const userAgent = device.userAgent || "";
  const isTablet = /iPad|Tablet|Kindle|Silk/i.test(userAgent) ||
    (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent)) ||
    (device.platform === "MacIntel" && device.maxTouchPoints > 1);

  return !isTablet;
}
