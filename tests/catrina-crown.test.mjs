import assert from "node:assert/strict";
import test from "node:test";
import { flowerCrownLayout } from "../lib/catrina-filter.js";
import { CANONICAL_FACE } from "../lib/catrina-mesh.js";
const layout=(points=CANONICAL_FACE,width=540,height=810,mirrored=false)=>flowerCrownLayout(points,1000,1500,width,height,mirrored);
const close=(a,b)=>assert.ok(Math.abs(a-b)<.0001, a+" should match "+b);
const byId=flowers=>new Map(flowers.map(flower=>[flower.id,flower]));

test("the two front roses stay larger and every flower rests on the scalp",()=>{
  const flowers=layout(),map=byId(flowers);
  assert.equal(flowers.length,6);
  assert.ok(map.get(109).diameter>map.get(103).diameter*1.2);
  assert.ok(map.get(338).diameter>map.get(332).diameter*1.2);
  assert.ok(map.get(103).diameter>map.get(54).diameter);
  assert.ok(map.get(54).f>map.get(109).f && map.get(284).f>map.get(338).f);
  for(const flower of flowers){
    const offset=Math.hypot(flower.e-flower.anchor.x,flower.f-flower.anchor.y);
    const petalRadius=.47*Math.max(Math.hypot(flower.a,flower.b),Math.hypot(flower.c,flower.d));
    assert.ok(offset<petalRadius,"Petals must touch the scalp instead of floating outside it");
  }
});

test("adjacent petal edges touch without hiding the neighboring bloom",()=>{
  const map=byId(layout()),order=[54,103,109,338,332,284];
  for(let i=1;i<order.length;i++){
    const a=map.get(order[i-1]),b=map.get(order[i]);
    const distance=Math.hypot(a.e-b.e,a.f-b.f),x=(b.e-a.e)/distance,y=(b.f-a.f)/distance;
    const radius=f=>.47*Math.hypot(x*f.a+y*f.b,x*f.c+y*f.d);
    const ratio=distance/(radius(a)+radius(b));
    assert.ok(ratio>=.97 && ratio<=1.005,"Flowers must touch at their edges without a gap or a large overlap");
  }
});

test("the packed flowers use identical crop, scale and mirror in preview and capture",()=>{
  const preview=layout(),photo=byId(layout(CANONICAL_FACE,1080,1620)),mirrored=byId(layout(CANONICAL_FACE,540,810,true));
  for(const bloom of preview){
    const high=photo.get(bloom.id),flip=mirrored.get(bloom.id);
    for(const key of ["a","b","c","d","e","f"])close(high[key],bloom[key]*2);
    close(flip.a,-bloom.a);close(flip.b,bloom.b);
    close(flip.c,-bloom.c);close(flip.d,bloom.d);
    close(flip.e,540-bloom.e);close(flip.f,bloom.f);
    assert.equal(high.cell,bloom.cell);assert.equal(flip.cell,bloom.cell);
  }
});

test("the diadem follows head roll and side turns without shearing its flowers",()=>{
  const angle=Math.PI/6,cos=Math.cos(angle),sin=Math.sin(angle);
  const rolled=CANONICAL_FACE.map(p=>{const x=p.x*1000-500,y=p.y*1500-750;return {...p,x:(500+x*cos-y*sin)/1000,y:(750+x*sin+y*cos)/1500};});
  const tilted=byId(layout(rolled));
  for(const bloom of layout()){
    const after=tilted.get(bloom.id);
    close(after.a,bloom.a*cos-bloom.b*sin);close(after.b,bloom.a*sin+bloom.b*cos);
    close(after.c,bloom.c*cos-bloom.d*sin);close(after.d,bloom.c*sin+bloom.d*cos);
  }
  const yawed=CANONICAL_FACE.map(p=>({...p,x:.5+(p.x-.5)*cos+p.z*sin,z:-(p.x-.5)*sin+p.z*cos}));
  assert.equal(layout(yawed).length,6);
  assert.deepEqual(layout([]),[]);
  assert.deepEqual(layout(CANONICAL_FACE.map(()=>({x:.5,y:.5,z:0}))),[]);
});
