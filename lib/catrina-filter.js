import { fittedVideoRect } from "./camera-fit.js";
import { FACE_ATLAS_UV, FACE_TRIANGLES } from "./catrina-mesh.js";

export const CATRINA_STYLES = [
  { id: "catrina-texture", src: "/effects/catrina-texture.png", name: { es: "Catrina", en: "Catrina" } },
];
export const isCatrinaFilter = id => CATRINA_STYLES.some(style => style.id === id);
export const CATRINA_CROWN_SRC = "/effects/catrina-bloom-atlas.png";
const CATRINA_LEAF_SRC = "/effects/catrina-leaf.png";
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

function paintLandmark(landmarks, index) {
  const tracked = landmarks[index];
  const extension = FOREHEAD_EXTENSION.get(index) || 0;
  if (!extension) return tracked;
  const forehead = landmarks[10], brow = landmarks[168];
  return {
    x: tracked.x + (forehead.x - brow.x) * extension,
    y: tracked.y + (forehead.y - brow.y) * extension,
    z: (tracked.z || 0) + ((forehead.z || 0) - (brow.z || 0)) * extension,
  };
}

// Pack round blooms along the scalp so adjacent petal edges touch. The two
// front roses remain larger; spacing is solved together with their placement.
const CROWN_PATHS = {
  left:[10,109,67,103,54,21,162],
  right:[10,338,297,332,284,251,389],
};

export function flowerCrownLayout(landmarks, videoWidth, videoHeight, width, height, mirrored) {
  if (landmarks?.length < 468 || !videoWidth || !videoHeight) return [];
  const pixel=p=>[p.x*videoWidth,p.y*videoHeight,(p.z||0)*videoWidth];
  const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=v=>{const length=Math.hypot(...v);return length>1e-5?v.map(n=>n/length):null;};
  const interpolate=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const right=subtract(pixel(landmarks[454]),pixel(landmarks[234]));
  const faceWidth=Math.hypot(...right);
  const up=subtract(pixel(paintLandmark(landmarks,10)),pixel(landmarks[168]));
  const front=unit(cross(right,up));
  if(!front||faceWidth<1e-5)return [];
  const lift=unit(up).map(v=>v*faceWidth*.04);
  const rect=fittedVideoRect(videoWidth,videoHeight,width,height);
  const scale=rect.width/videoWidth,mirror=mirrored?-1:1;
  const project=p=>({x:mirrored?width-(rect.x+p[0]*scale):rect.x+p[0]*scale,y:rect.y+p[1]*scale});
  const paths=Object.fromEntries(Object.entries(CROWN_PATHS).map(([side,ids])=>{
    const points=ids.map(id=>pixel(paintLandmark(landmarks,id)));
    const lengths=[0];
    for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(...subtract(points[i],points[i-1])));
    return [side,{points,lengths,total:lengths.at(-1)}];
  }));
  function sample(side,t){
    const path=paths[side],distance=t*path.total;
    let index=1;
    while(index<path.points.length-1&&path.lengths[index]<distance)index++;
    const amount=(distance-path.lengths[index-1])/(path.lengths[index]-path.lengths[index-1]);
    const seat=interpolate(path.points[index-1],path.points[index],amount);
    const tangentAt=i=>{
      const before=i===0?paths.left.points[1]:path.points[i-1];
      const after=i===0?paths.right.points[1]:path.points[Math.min(i+1,path.points.length-1)];
      return unit(i===0?subtract(after,before):side==='left'?subtract(before,after):subtract(after,before));
    };
    const tangent=unit(interpolate(tangentAt(index-1),tangentAt(index),amount));
    return {seat,tangent,outward:unit(cross(front,tangent))};
  }
  function make(side,t,size,cell,id,sizeScale){
    const {seat,tangent,outward}=sample(side,t);
    const diameter=faceWidth*size*sizeScale;
    const anchor=project(seat);
    const center=project(seat.map((v,i)=>v+outward[i]*diameter*.28+lift[i]));
    return {id,cell,anchor,t,diameter:diameter*scale,
      a:tangent[0]*diameter*scale*mirror,b:tangent[1]*diameter*scale,
      c:-outward[0]*diameter*scale*mirror,d:-outward[1]*diameter*scale,
      e:center.x,f:center.y,depth:seat[2]};
  }
  function contactGap(a,b){
    const dx=b.e-a.e,dy=b.f-a.f,distance=Math.hypot(dx,dy);
    if(distance<1e-8)return -1;
    const x=dx/distance,y=dy/distance;
    const radius=bloom=>.47*Math.hypot(x*bloom.a+y*bloom.b,x*bloom.c+y*bloom.d);
    return distance-(radius(a)+radius(b))*.98;
  }
  function solve(low,gap){
    if(gap(1)<0)return null;
    let high=1;
    for(let i=0;i<22;i++){
      const mid=(low+high)/2;
      if(gap(mid)>0)high=mid;else low=mid;
    }
    return (low+high)/2;
  }
  // Fit all six as a group if a narrow or turned face leaves less usable arc.
  for(let attempt=0;attempt<8;attempt++){
    const sizeScale=.94**attempt;
    const hero=(side,t)=>make(side,t,.38,side==='left'?0:2,side==='left'?109:338,sizeScale);
    const top=solve(0,t=>contactGap(hero('left',t),hero('right',t)));
    if(top===null)continue;
    const flowers=[hero('left',top),hero('right',top)];
    let fits=true;
    for(const side of ['left','right']){
      let previous=hero(side,top),position=top;
      for(const [size,cell,id] of side==='left'?[[.30,1,103],[.245,0,54]]:[[.30,1,332],[.245,2,284]]){
        const next=solve(position,t=>contactGap(previous,make(side,t,size,cell,id,sizeScale)));
        if(next===null){fits=false;break;}
        const bloom=make(side,next,size,cell,id,sizeScale);
        flowers.push(bloom);previous=bloom;position=next;
      }
      if(!fits)break;
    }
    if(fits)return flowers.sort((a,b)=>b.depth-a.depth);
  }
  return [];
}

function drawFlowerDiadem(ctx, crown, leaf, layout) {
  // Fill only the seams, behind the petals. Keep the approved bloom layout intact.
  const byId=new Map(layout.map(bloom=>[bloom.id,bloom]));
  const order=[54,103,109,338,332,284];
  for(let i=1;i<order.length;i++){
    const left=byId.get(order[i-1]),right=byId.get(order[i]);
    if(!left||!right)continue;
    const amount=left.diameter/(left.diameter+right.diameter);
    const x=left.e+(right.e-left.e)*amount,y=left.f+(right.f-left.f)*amount;
    const a=(left.a+right.a)/2,b=(left.b+right.b)/2;
    const c=(left.c+right.c)/2,d=(left.d+right.d)/2;
    for(const [outward,lean] of [[-.62,.16],[.52,-.16]]){
      // The leaf's stem sits in the seam; its tip follows the scalp's normal.
      ctx.save();
      ctx.transform(a*lean+c*outward,b*lean+d*outward,(-a*outward+c*lean)*1.5,(-b*outward+d*lean)*1.5,x,y);
      const aspect=leaf.naturalHeight/leaf.naturalWidth;
      ctx.drawImage(leaf,-.06,-aspect/2,1,aspect);
      ctx.restore();
    }
  }
  const cellWidth=crown.naturalWidth/3;
  for(const bloom of layout){
    ctx.save();
    ctx.transform(bloom.a,bloom.b,bloom.c,bloom.d,bloom.e,bloom.f);
    ctx.drawImage(crown,bloom.cell*cellWidth,0,cellWidth,crown.naturalHeight,-.5,-.5,1,1);
    ctx.restore();
  }
}

export function faceMeshPositions(landmarks, videoWidth, videoHeight, width, height, mirrored) {
  if (landmarks?.length < 468) return null;
  const rect = fittedVideoRect(videoWidth, videoHeight, width, height);
  const positions = new Float32Array(468 * 3);
  // The tracked oval ends below the hairline. Extend only its upper contour,
  // along the forehead's own axis so the paint follows head tilt and rotation.
  for (let i = 0; i < 468; i++) {
    const point = paintLandmark(landmarks, i);
    const x = rect.x + point.x * rect.width;
    positions[i * 3] = (mirrored ? width - x : x) / width * 2 - 1;
    positions[i * 3 + 1] = 1 - (rect.y + point.y * rect.height) / height * 2;
    positions[i * 3 + 2] = Math.max(-.95, Math.min(.95, (point.z || 0) * rect.width / width));
  }
  return positions;
}

let artworkPromise;
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

function loadArtwork() {
  if (!artworkPromise) {
    artworkPromise = Promise.all([
      Promise.all(CATRINA_STYLES.map(async style => ({ ...style, image: await loadImage(style.src) }))),
      loadImage(CATRINA_CROWN_SRC),
      loadImage(CATRINA_LEAF_SRC),
    ]).then(([styles, crown, leaf]) => ({ styles, crown, leaf }))
      .catch(error => { artworkPromise = null; throw error; });
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
  const { styles: artwork, crown, leaf } = await loadArtwork();
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
      for (const landmarks of faceLandmarks || []) {
        const layout = flowerCrownLayout(landmarks, video.videoWidth, video.videoHeight, width, height, mirrored);
        drawFlowerDiadem(ctx, crown, leaf, layout);
      }
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
