import assert from "node:assert/strict";
import test from "node:test";
import { landmarkToCanvas, faceMeshPositions, isCatrinaFilter, CATRINA_STYLES, facePaintEdgeOpacity } from "../lib/catrina-filter.js";
import { FACE_ATLAS_UV, FACE_TRIANGLES, CANONICAL_FACE } from "../lib/catrina-mesh.js";

test("face points match the camera crop and mirror in preview and capture", () => {
  const point = { x: .25, y: .4 };
  assert.deepEqual(landmarkToCanvas(point, 720, 1080, 540, 810, false), { x: 135, y: 324 });
  assert.deepEqual(landmarkToCanvas(point, 720, 1080, 540, 810, true), { x: 405, y: 324 });
  assert.deepEqual(landmarkToCanvas(point, 720, 1080, 1080, 1620, true), { x: 810, y: 648 });
  assert.deepEqual(landmarkToCanvas({ x: .5, y: .5 }, 1280, 720, 1080, 1620, true), { x: 540, y: 810 });
});

test("Catrina texture is the only effect and matches the crop and mirror at both resolutions", () => {
  assert.equal(CATRINA_STYLES.length, 1);
  assert.equal(isCatrinaFilter("catrina-texture"), true);
  assert.equal(isCatrinaFilter("catrina-vector"), false);
  assert.equal(isCatrinaFilter("none"), false);
  for (const mirrored of [false, true]) {
    const preview = faceMeshPositions(CANONICAL_FACE, 1280, 720, 540, 810, mirrored);
    const photo = faceMeshPositions(CANONICAL_FACE, 1280, 720, 1080, 1620, mirrored);
    assert.deepEqual(preview, photo);
    for (const id of [1, 33, 133, 263, 362, 13, 14]) {
      const point = landmarkToCanvas(CANONICAL_FACE[id], 1280, 720, 540, 810, mirrored);
      assert.ok(Math.abs((preview[id*3]+1)*270-point.x)<.0001);
      assert.ok(Math.abs((1-preview[id*3+1])*405-point.y)<.0001);
    }
  }
  assert.equal(faceMeshPositions([], 720, 1080, 540, 810, true), null);
});

test("white paint covers the upper forehead while the cheek and jaw edges stay feathered", () => {
  for (const index of [10,338,297,332,284,251,389,162,21,54,103,67,109]) {
    assert.equal(facePaintEdgeOpacity(index), 1);
  }
  assert.equal(facePaintEdgeOpacity(152), 0);
  assert.equal(facePaintEdgeOpacity(234), 0);
  assert.equal(facePaintEdgeOpacity(454), 0);
  const mesh = faceMeshPositions(CANONICAL_FACE, 1000, 1500, 540, 810, false);
  const unextendedTop = landmarkToCanvas(CANONICAL_FACE[10], 1000, 1500, 540, 810, false);
  const extendedY = (1 - mesh[10*3+1]) * 405;
  assert.ok(extendedY < unextendedTop.y - 40, "The base must reach above the tracked forehead oval");
  for(let offset=0;offset<FACE_TRIANGLES.length;offset+=3){
    const [a,b,c]=FACE_TRIANGLES.slice(offset,offset+3).map(id=>({x:mesh[id*3],y:mesh[id*3+1]}));
    assert.ok((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>0, "Extending the forehead must not fold the paint mesh");
  }
});

test("the artwork mesh has no folded triangles around the eyes, nose or lips", () => {
  for (let offset=0;offset<FACE_TRIANGLES.length;offset+=3) {
    const ids=FACE_TRIANGLES.slice(offset,offset+3);
    const source=ids.map(id=>({x:FACE_ATLAS_UV[id*2],y:FACE_ATLAS_UV[id*2+1]}));
    const destination=ids.map(id=>CANONICAL_FACE[id]);
    const area=([a,b,c])=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    assert.ok(area(source)<-1e-8,`Collapsed artwork triangle ${ids}`);
    assert.ok(area(source)*area(destination)>0,`Folded face triangle ${ids}`);
  }
});

test("eye and mouth openings contain no paint triangles", () => {
  const inside=(p,[a,b,c])=>{
    const cross=(u,v,w)=>(v.x-u.x)*(w.y-u.y)-(v.y-u.y)*(w.x-u.x);
    return [cross(a,b,p),cross(b,c,p),cross(c,a,p)].every(value=>value<-1e-8);
  };
  for(const opening of [{x:.335,y:.43},{x:.665,y:.43},{x:.5,y:.754}]){
    for(let offset=0;offset<FACE_TRIANGLES.length;offset+=3){
      const triangle=FACE_TRIANGLES.slice(offset,offset+3).map(id=>({x:FACE_ATLAS_UV[id*2],y:FACE_ATLAS_UV[id*2+1]}));
      assert.equal(inside(opening,triangle),false,"Paint must preserve the visitor's real eyes and open mouth");
    }
  }
});
