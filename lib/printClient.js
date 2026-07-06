/** Send a data-URL image to the booth printer (server spool, then browser fallback). */
export async function printPhoto(imageDataUrl) {
  try {
    const res = await fetch("/api/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: imageDataUrl }),
    });
    const data = await res.json();
    if (data.ok && !data.simulated) return { ok: true, method: "server" };
  } catch {
    // fall through to browser print
  }
  return browserPrint(imageDataUrl);
}

function browserPrint(imageDataUrl) {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
    document.body.appendChild(iframe);

    const cleanup = () => {
      setTimeout(() => iframe.remove(), 1000);
      resolve({ ok: true, method: "browser" });
    };

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html><head><title>Photo Booth Print</title>
<style>@page{margin:0}body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}</style>
</head><body><img src="${imageDataUrl}" alt="" /></body></html>`);
    doc.close();

    iframe.contentWindow.onload = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } finally {
          cleanup();
        }
      }, 300);
    };
  });
}
