export function photoFilename(name, kind) {
  let basename = (name || "")
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100)
    .replace(/^[. ]+|[. ]+$/g, "");

  if (!basename) basename = "el-tequileno";
  if (/^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i.test(basename)) basename = `_${basename}`;

  return `${basename}.${kind === "gif" ? "gif" : "jpg"}`;
}
