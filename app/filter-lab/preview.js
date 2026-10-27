"use client";

import { useEffect, useRef, useState } from "react";
import { CATRINA_STYLES, createCatrinaRenderer } from "../../lib/catrina-filter";
import { CANONICAL_FACE } from "../../lib/catrina-mesh";
import { fittedVideoRect } from "../../lib/camera-fit";

const styles = [{ id: "none", name: { es: "Sin filtro" } }, ...CATRINA_STYLES];

export default function FilterLab() {
  const canvases = useRef([]);
  const rendererRef = useRef(null);
  const trackerRef = useRef(null);
  const photoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Preparando diseños…");
  const [faces, setFaces] = useState([CANONICAL_FACE.map(point => ({ ...point, y: point.y + .14 }))]);
  const [mirrored, setMirrored] = useState(false);
  const [turn, setTurn] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    createCatrinaRenderer().then(renderer => {
      if (cancelled) { renderer.dispose(); return; }
      rendererRef.current = renderer;
      setReady(true);
      setStatus("Modelo de prueba • puedes cargar una foto local");
    }).catch(error => setStatus(error.message));
    return () => { cancelled = true; rendererRef.current?.dispose(); trackerRef.current?.close(); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const image = photoRef.current;
    const video = { videoWidth: image?.naturalWidth || 1000, videoHeight: image?.naturalHeight || 1500 };
    const angle = turn * Math.PI / 180;
    const mesh = image ? faces : faces.map(face => face.map(p => ({
      ...p, x: .5 + (p.x-.5)*Math.cos(angle) + (p.z+.2)*Math.sin(angle),
      z: -(p.x-.5)*Math.sin(angle) + (p.z+.2)*Math.cos(angle),
    })));
    styles.forEach((style, index) => {
      const canvas = canvases.current[index];
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#25353a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const rect = fittedVideoRect(video.videoWidth, video.videoHeight, canvas.width, canvas.height);
      ctx.save();
      if (image && faces[0]) {
        const focal = faces[0][1];
        const x = rect.x + (mirrored ? 1-focal.x : focal.x) * rect.width;
        const y = rect.y + focal.y * rect.height;
        ctx.translate(canvas.width/2-zoom*x,canvas.height*.47-zoom*y);
        ctx.scale(zoom,zoom);
      }
      if (image) {
        ctx.save();
        if (mirrored) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
        ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
        ctx.restore();
      } else {
        const scale = canvas.width / 1000;
        ctx.save();
        ctx.scale(scale, canvas.height / 1500);
        ctx.translate(0,210);
        const skin = ctx.createRadialGradient(450,480,60,500,550,470);
        skin.addColorStop(0,"#c99b7c");skin.addColorStop(1,"#835e49");
        ctx.fillStyle=skin; ctx.beginPath();ctx.ellipse(500,570,382,460,0,0,Math.PI*2);ctx.fill();
        ctx.fillStyle="#c99b7c";ctx.fillRect(396,840,208,230);
        ctx.fillStyle="#b18b6c";ctx.beginPath();ctx.ellipse(500,1400,450,380,0,0,Math.PI*2);ctx.fill();
        for(const x of [342,658]){ctx.fillStyle="#f7f1e9";ctx.beginPath();ctx.ellipse(x,400,69,25,0,0,Math.PI*2);ctx.fill();ctx.fillStyle="#704829";ctx.beginPath();ctx.arc(x,400,22,0,Math.PI*2);ctx.fill();ctx.fillStyle="#131719";ctx.beginPath();ctx.arc(x,400,10,0,Math.PI*2);ctx.fill();}
        ctx.strokeStyle="#835e49";ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(487,442);ctx.quadraticCurveTo(472,567,480,601);ctx.quadraticCurveTo(500,618,525,596);ctx.stroke();
        ctx.strokeStyle="#845447";ctx.lineWidth=17;ctx.beginPath();ctx.moveTo(379,750);ctx.quadraticCurveTo(500,773,621,750);ctx.stroke();
        ctx.restore();
      }
      if(style.id!=="none")rendererRef.current.draw(ctx,mesh,video,canvas.width,canvas.height,mirrored,style.id);
      ctx.restore();
    });
  }, [ready, faces, mirrored, turn, zoom, revision]);

  async function loadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("Buscando rostros en la foto…");
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      if(!trackerRef.current){const {createFaceTracker}=await import("../../lib/face-tracker");trackerRef.current=await createFaceTracker();}
      const found = trackerRef.current.detectForVideo(image,performance.now()).faceLandmarks;
      photoRef.current=image;setTurn(0);setZoom(3);setFaces(found);setRevision(v=>v+1);
      setStatus(`${found.length} rostro(s) • foto procesada solo en este navegador`);
    }catch(error){setStatus(error.message);}finally{URL.revokeObjectURL(url);}
  }
  return <main style={{height:"100dvh",overflow:"auto",padding:"24px",background:"#10191e",color:"#fff5e4"}}>
    <h1 style={{fontSize:24,marginBottom:8}}>Vista previa Catrina</h1>
    <p style={{color:"#bac6ca",marginBottom:20}}>Maquillaje con textura y corona de flores junto al borde de la frente.</p>
    <div style={{display:"flex",flexWrap:"wrap",gap:20,alignItems:"center",marginBottom:20}}>
      <label>Probar con una foto <input aria-label="Probar con una foto" type="file" accept="image/*" onChange={loadPhoto} disabled={!ready}/></label>
      <label><input type="checkbox" checked={mirrored} onChange={e=>setMirrored(e.target.checked)}/> Espejo</label>
      {photoRef.current&&<label>Zoom <input type="range" aria-label="Zoom" min="1" max="5" step=".1" value={zoom} onChange={e=>setZoom(+e.target.value)}/></label>}
      {!photoRef.current&&<label>Giro <input type="range" aria-label="Giro" min="-45" max="45" value={turn} onChange={e=>setTurn(+e.target.value)}/></label>}
    </div>
    <p role="status" style={{minHeight:24,marginBottom:14}}>{status}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:16,maxWidth:900}}>
      {styles.map((style,i)=><figure key={style.id}><figcaption style={{marginBottom:10}}>{style.name.es}</figcaption><canvas ref={el=>{canvases.current[i]=el;}} width="540" height="810" aria-label={style.name.es} style={{width:"100%",height:"auto",borderRadius:8,border:"1px solid #506067"}}/></figure>)}
    </div>
  </main>;
}
