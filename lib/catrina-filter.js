import { fittedVideoRect } from "./camera-fit.js";
import { FACE_ATLAS_UV, FACE_TRIANGLES } from "./catrina-mesh.js";

export const CATRINA_STYLES = [
  { id: "catrina-texture", src: "/effects/catrina-texture.png", name: { es: "Catrina", en: "Catrina" } },
];
export const isCatrinaFilter = id => CATRINA_STYLES.some(style => style.id === id);
const FACE_OVAL = new Set([10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109]);
const FOREHEAD_EDGE = new Set([10,338,297,332,284,251,389,162,21,54,103,67,109]);
const FOREHEAD_EXTENSION = new Map([[10,.48],[338,.48],[109,.48],[297,.46],[67,.46],[332,.39],[103,.39],[284,.27],[54,.27],[251,.12],[21,.12]]);
const FOREHEAD_CONTOUR = [162,21,54,103,67,109,10,338,297,332,284,251,389]
  .map(index => [FACE_ATLAS_UV[index * 2], FACE_ATLAS_UV[index * 2 + 1]]);

// The artwork already feathers the upper edge. Fading these vertices a second
// time left most of the forehead bare between the blue ornament and hairline.
export const facePaintEdgeOpacity = index => FOREHEAD_EDGE.has(index) || !FACE_OVAL.has(index) ? 1 : 0;

// Measure feathering in texture space, so it stays a narrow, consistent band
// instead of fading across the large triangles between hairline and eyebrows.
export function foreheadPaintDistance(x, y) {
  let top = FOREHEAD_CONTOUR[0][1];
  for (let i = 1; i < FOREHEAD_CONTOUR.length; i++) {
    const [leftX, leftY] = FOREHEAD_CONTOUR[i - 1];
    const [rightX, rightY] = FOREHEAD_CONTOUR[i];
    top = rightY;
    if (x <= rightX) {
      const amount = Math.max(0, Math.min(1, (x - leftX) / (rightX - leftX)));
      top = leftY + (rightY - leftY) * amount;
      break;
    }
  }
  return Math.max(0, y - top);
}

export function landmarkToCanvas(landmark, videoWidth, videoHeight, width, height, mirrored) {
  const rect = fittedVideoRect(videoWidth, videoHeight, width, height);
  const x = rect.x + landmark.x * rect.width;
  return { x: mirrored ? width - x : x, y: rect.y + landmark.y * rect.height };
}

export function faceMeshPositions(landmarks, videoWidth, videoHeight, width, height, mirrored) {
  if (landmarks?.length < 468) return null;
  const rect = fittedVideoRect(videoWidth, videoHeight, width, height);
  const positions = new Float32Array(468 * 3);
  // The tracked oval ends below the hairline. Extend only its upper contour,
  // along the forehead's own axis so the paint follows head tilt and rotation.
  const forehead = landmarks[10];
  const brow = landmarks[168];
  for (let i = 0; i < 468; i++) {
    const tracked = landmarks[i];
    const extension = FOREHEAD_EXTENSION.get(i) || 0;
    const point = extension ? {
      x: tracked.x + (forehead.x - brow.x) * extension,
      y: tracked.y + (forehead.y - brow.y) * extension,
      z: (tracked.z || 0) + ((forehead.z || 0) - (brow.z || 0)) * extension,
    } : tracked;
    const x = rect.x + point.x * rect.width;
    positions[i * 3] = (mirrored ? width - x : x) / width * 2 - 1;
    positions[i * 3 + 1] = 1 - (rect.y + point.y * rect.height) / height * 2;
    positions[i * 3 + 2] = Math.max(-.95, Math.min(.95, (point.z || 0) * rect.width / width));
  }
  return positions;
}

let artworkPromise;
function loadArtwork() {
  if (!artworkPromise) {
    artworkPromise = Promise.all(CATRINA_STYLES.map(style => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ ...style, image });
      image.onerror = () => reject(new Error(`Could not load ${style.src}`));
      image.src = style.src;
    }))).catch(error => { artworkPromise = null; throw error; });
  }
  return artworkPromise;
}

const VERTEX_SHADER = `
  attribute vec3 aPosition;
  attribute vec2 aUv;
  attribute float aEdge;
  attribute float aForeheadDistance;
  varying vec2 vUv;
  varying float vEdge;
  varying float vForeheadDistance;
  void main() {
    gl_Position = vec4(aPosition, 1.0);
    vUv = aUv;
    vEdge = aEdge;
    vForeheadDistance = aForeheadDistance;
  }
`;
const FRAGMENT_SHADER = `
  precision mediump float;
  uniform sampler2D uArtwork;
  varying vec2 vUv;
  varying float vEdge;
  varying float vForeheadDistance;
  void main() {
    vec4 paint = texture2D(uArtwork, vUv);
    float lightest = max(paint.r, max(paint.g, paint.b));
    float darkest = min(paint.r, min(paint.g, paint.b));
    float pigment = max(1.0 - smoothstep(0.12, 0.8, lightest),
                        smoothstep(0.10, 0.45, lightest - darkest));
    // Translucent ivory preserves the visitor's shading; colored paint stays rich.
    float foreheadArea = 1.0 - smoothstep(0.28, 0.34, vUv.y);
    float foreheadFeather = mix(1.0, smoothstep(0.0, 0.045, vForeheadDistance), foreheadArea);
    float alpha = paint.a * mix(0.62 * foreheadFeather, 0.98, pigment) * smoothstep(0.0, 0.65, vEdge);
    gl_FragColor = vec4(paint.rgb * alpha, alpha);
  }
`;

function shader(gl, type, source) {
  const value = gl.createShader(type);
  gl.shaderSource(value, source);
  gl.compileShader(value);
  if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(value);
    gl.deleteShader(value);
    throw new Error(`Face paint shader: ${message}`);
  }
  return value;
}

export async function createCatrinaRenderer() {
  const artwork = await loadArtwork();
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL is required for face paint");
  const program = gl.createProgram();
  const vertex = shader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Could not initialize face paint shader");
  gl.useProgram(program);
  const buffers = [];
  function attribute(name, size, data, usage = gl.STATIC_DRAW) {
    const buffer = gl.createBuffer();
    buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage);
    const location = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
    return buffer;
  }
  const positionBuffer = attribute("aPosition", 3, new Float32Array(468 * 3), gl.DYNAMIC_DRAW);
  attribute("aUv", 2, new Float32Array(FACE_ATLAS_UV));
  attribute("aEdge", 1, Float32Array.from({ length: 468 }, (_, i) => facePaintEdgeOpacity(i)));
  attribute("aForeheadDistance", 1, Float32Array.from({ length: 468 }, (_, i) =>
    foreheadPaintDistance(FACE_ATLAS_UV[i * 2], FACE_ATLAS_UV[i * 2 + 1])));
  const indices = gl.createBuffer();
  buffers.push(indices);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(FACE_TRIANGLES), gl.STATIC_DRAW);
  const textures = new Map(artwork.map(style => {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, style.image);
    return [style.id, texture];
  }));
  gl.uniform1i(gl.getUniformLocation(program, "uArtwork"), 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0, 0, 0, 0);
  let disposed = false;

  return {
    draw(ctx, faceLandmarks, video, width, height, mirrored, styleId) {
      if (disposed || !textures.has(styleId) || !video?.videoWidth || !video?.videoHeight) return;
      if (gl.isContextLost()) throw new Error("Face paint graphics context was lost");
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures.get(styleId));
      for (const landmarks of faceLandmarks || []) {
        const positions = faceMeshPositions(landmarks, video.videoWidth, video.videoHeight, width, height, mirrored);
        if (!positions) continue;
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, positions);
        // Depth prepass hides paint on the far cheek when the head turns.
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.colorMask(false, false, false, false);
        gl.drawElements(gl.TRIANGLES, FACE_TRIANGLES.length, gl.UNSIGNED_SHORT, 0);
        gl.colorMask(true, true, true, true);
        gl.drawElements(gl.TRIANGLES, FACE_TRIANGLES.length, gl.UNSIGNED_SHORT, 0);
      }
      ctx.drawImage(canvas, 0, 0, width, height);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      textures.forEach(texture => gl.deleteTexture(texture));
      buffers.forEach(buffer => gl.deleteBuffer(buffer));
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
