import assert from "node:assert/strict";
import test from "node:test";
import { flowerCrownTransform, faceMeshPositions } from "../lib/catrina-filter.js";
import { CANONICAL_FACE } from "../lib/catrina-mesh.js";

const pose = (points = CANONICAL_FACE, width = 540, height = 810, mirrored = false) =>
  flowerCrownTransform(points, 1000, 1500, width, height, mirrored, 3);
const close = (a,b) => assert.ok(Math.abs(a-b)<.0001, `${a} should match ${b}`);

test("the crown rests on the extended white-paint edge with most petals above the forehead", () => {
  const transform = pose();
  const mesh = faceMeshPositions(CANONICAL_FACE,1000,1500,540,810,false);
  close(transform.e,(mesh[30]+1)*270);
  close(transform.f,(1-mesh[31])*405);
  assert.ok(transform.f-.78*transform.d < transform.f);
  assert.ok(transform.f+.22*transform.d > transform.f);
  assert.ok(transform.a > 0 && transform.d > 0);
});

test("crown position, size and mirror stay consistent between preview, JPEG and GIF", () => {
  const preview = pose(), photo = pose(CANONICAL_FACE,1080,1620), mirrored = pose(CANONICAL_FACE,540,810,true);
  for(const key of ["a","b","c","d","e","f"])close(photo[key],preview[key]*2);
  close(mirrored.a,-preview.a);close(mirrored.b,preview.b);
  close(mirrored.c,-preview.c);close(mirrored.d,preview.d);
  close(mirrored.e,540-preview.e);close(mirrored.f,preview.f);
});

test("flowers follow head roll and become narrower when the head turns sideways", () => {
  const angle = Math.PI/6, cos=Math.cos(angle),sin=Math.sin(angle);
  const rolled=CANONICAL_FACE.map(p=>{
    const x=p.x*1000-500,y=p.y*1500-750;
    return {...p,x:(500+x*cos-y*sin)/1000,y:(750+x*sin+y*cos)/1500};
  });
  const base=pose(),tilted=pose(rolled);
  close(tilted.a,base.a*cos-base.b*sin);close(tilted.b,base.a*sin+base.b*cos);
  close(tilted.c,base.c*cos-base.d*sin);close(tilted.d,base.c*sin+base.d*cos);
  const yawed=CANONICAL_FACE.map(p=>({...p,x:.5+(p.x-.5)*cos+p.z*sin,z:-(p.x-.5)*sin+p.z*cos}));
  assert.ok(Math.hypot(pose(yawed).a,pose(yawed).b)<Math.hypot(base.a,base.b)*.9);
  assert.equal(pose([]),null);
  assert.equal(pose(CANONICAL_FACE.map(()=>({x:.5,y:.5,z:0}))),null);
});
