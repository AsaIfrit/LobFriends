// ===================== world.js：場景、樹、村莊、室內、蝴蝶、農田、家具 =====================
const obstacles=[];
function farFrom(x,z,r,list=obstacles){for(const o of list){if(o.r>0&&Math.hypot(o.x-x,o.z-z)<o.r+r)return false;}return true;}
const HOUSE={x:-14,z:0},DOOR={x:-14+3.03*1.5+0.9,z:0},BOARD={x:5,z:-6};
const FS={bathtub:1};const fsOf=id=>FS[id]??1.5;
function textTex(lines,bg='#fff1e0',fg='#7a4a34',w=256,h=128,font=40){return canvasTex(w,h,(c)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=fg;c.font=`900 ${font}px "Zen Maru Gothic",sans-serif`;c.textAlign='center';c.textBaseline='middle';
  lines.forEach((l,i)=>c.fillText(l,w/2,h/(lines.length+1)*(i+1)));});}
// ---------- 房屋 ----------
const windowMats=[];
function makeHouse(x,z,ry,wall,roof,s=1){
  const g=new THREE.Group();
  const wm=toon(wall,{map:TEX.wood});
  g.add(mk(new THREE.BoxGeometry(6,3.4,5.4),wm,0,1.7,0));
  const rf=mk(new THREE.ConeGeometry(5.1,2.6,4),toon(roof),0,4.7,0);rf.rotation.y=Math.PI/4;rf.scale.set(1,1,0.92);g.add(rf);
  g.add(mk(new THREE.BoxGeometry(0.7,1.6,0.7),toon(0xe0c8b0),-1.4,5,1.2));
  g.add(mk(new THREE.BoxGeometry(0.15,2.1,1.3),toon(0xc89a78),3.03,1.05,0));
  g.add(mk(new THREE.SphereGeometry(0.09,8,6),toon(0xffd36e),3.12,1.05,0.45));
  for(const[px,pz,r2]of[[3.03,-1.7,0],[3.03,1.7,0],[0,2.72,Math.PI/2],[0,-2.72,Math.PI/2]]){const m=basic(0xa8c8d8);windowMats.push(m);const w=mk(new THREE.BoxGeometry(0.12,0.9,0.9),m,px,2.1,pz);w.rotation.y=r2;g.add(w);
    const f=mk(new THREE.BoxGeometry(0.1,1.05,1.05),toon(0xffffff),px*0.995,2.1,pz*0.995);f.rotation.y=r2;g.add(f);}
  g.add(mk(new THREE.BoxGeometry(1,0.2,1.6),toon(0xe8d0b0),3.5,0.1,0));
  g.position.set(x,H(x,z),z);g.rotation.y=ry;g.scale.setScalar(s);shadowAll(g);scene.add(g);obstacles.push({x,z,r:3.5*s});return g;
}
makeHouse(HOUSE.x,HOUSE.z,0,0xfff3ea,0xff8f7a,1.5);
// ---------- 樹（動森風：三團樹冠、層層松樹） ----------
const TG=(()=>{
  const sph=new THREE.SphereGeometry(1,18,14);
  const flares=(r,h)=>[0,1,2,3].map(i=>{const a=i*Math.PI/2+0.4;return[new THREE.ConeGeometry(0.2*r,0.75*r,6),M4(Math.cos(a)*0.36*r,0.2,Math.sin(a)*0.36*r,0,-a,-2.0)];});
  const trunk=mergeGeos([[new THREE.CylinderGeometry(0.3,0.46,2.0,12),M4(0,1.0,0)],...flares(1)]);
  const clump=(cx,cy,cz,r,seed0)=>{const g=new THREE.SphereGeometry(1,22,16);const p=g.attributes.position;let sd=seed0;const rr=()=>{sd=(sd*9301+49297)%233280;return sd/233280;};
    const offs=[];for(let k=0;k<3;k++)offs.push([rr()*6.28,rr()*6.28,0.04+rr()*0.05]);
    for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k);let d=1;for(const[a,b,amp]of offs){d+=amp*Math.sin(x*1.7+a)*Math.cos(z*1.5+b)*Math.cos(y*1.3+a);}
      p.setXYZ(k,x*r*d,y*r*d*0.88,z*r*d);}g.computeVertexNormals();return[g,M4(cx,cy,cz)];};
  const canopy=mergeGeos([clump(0,3.55,0,1.25,3),clump(-0.95,2.85,0.35,0.95,7),clump(0.95,2.9,0.3,0.95,11),clump(0.1,2.75,-0.85,0.95,17),clump(-0.4,3.0,0.9,0.8,23),clump(0.55,3.9,0.45,0.7,29),clump(-0.6,3.85,-0.35,0.72,31)]);
  {// 法線往樹冠中心球面混合 → 整團像一顆柔軟的大球，卡通光影更圓滑
   const p=canopy.attributes.position,n=canopy.attributes.normal,col=[],v3=new THREE.Vector3(),w3=new THREE.Vector3();
   for(let k=0;k<p.count;k++){v3.set(p.getX(k),(p.getY(k)-3.2)*1.25,p.getZ(k)).normalize();w3.set(n.getX(k),n.getY(k),n.getZ(k)).lerp(v3,0.7).normalize();n.setXYZ(k,w3.x,w3.y,w3.z);
     const y=p.getY(k),ny=w3.y;const v=clamp(0.66+(y-2.2)*0.14+ny*0.1,0.6,1.0);col.push(v,v,Math.min(1,v*0.96+0.04));}
   canopy.setAttribute('color',new THREE.Float32BufferAttribute(col,3));}
  const ptrunk=mergeGeos([[new THREE.CylinderGeometry(0.2,0.32,1.6,10),M4(0,0.8,0)],...flares(0.75)]);
  const tiers=[];for(let i=0;i<5;i++){const r=1.6-i*0.27,h=1.25;const c=new THREE.ConeGeometry(r,h,36,1,true);const p=c.attributes.position;
    for(let k=0;k<p.count;k++){if(p.getY(k)<-h/2+0.01){const ang=Math.atan2(p.getZ(k),p.getX(k)),w=0.5+0.5*Math.cos(ang*9);p.setY(k,p.getY(k)-0.2*w);p.setX(k,p.getX(k)*(1+0.06*w));p.setZ(k,p.getZ(k)*(1+0.06*w));}}
    c.computeVertexNormals();tiers.push([c,M4(0,1.75+i*0.68,0)]);}
  tiers.push([new THREE.ConeGeometry(0.3,0.7,10),M4(0,1.75+5*0.68,0)]);
  const pine=mergeGeos(tiers);
  const fr=new THREE.SphereGeometry(0.5,14,10),fruitParts=[];[[0.8,3.05,1.05],[-1.25,2.45,0.85],[0.3,4.15,0.7],[1.7,2.45,0.35]].forEach(([x,y,z])=>{fruitParts.push([fr,M4(x,y,z)]);fruitParts.push([new THREE.CylinderGeometry(0.04,0.05,0.22,5),M4(x,y+0.55,z)]);});
  const fruit=mergeGeos(fruitParts);
  const stump=new THREE.CylinderGeometry(0.34,0.44,0.4,12);
  return{trunk,canopy,ptrunk,pine,fruit,stump};
})();
const TM={trunk:toon(0xc8935e),ptrunk:toon(0xa86a48),stumpTop:toon(0xf3d3b8),
  leaf:[0x8fd66a,0x9fe070,0x7fcc5e].map(c=>toon(c,{vertexColors:true})),cherry:[0xffbcd6,0xffcadf].map(c=>toon(c,{vertexColors:true})),
  pine:[0x3e8c64,0x4a986e].map(c=>toon(c,{side:THREE.DoubleSide})),pineW:[0x4a8fa0,0x5a86b0].map(c=>toon(c,{side:THREE.DoubleSide})),fruit:Object.fromEntries(Object.entries(FRUITS).map(([k,f])=>[k,toon(f.col)]))};
const trees=[];
function tree(x,z,s,kind){const fruit=(kind==='broad'||kind==='cherry'||kind==='fruit')&&(kind==='fruit'||rnd()<0.4)?Object.keys(FRUITS)[(rnd()*4)|0]:null;if(kind==='fruit')kind='broad';
  const root=new THREE.Group();root.position.set(x,H(x,z)-0.08,z);
  const yawG=new THREE.Group();root.add(yawG);const pivot=new THREE.Group();yawG.add(pivot);
  const body=new THREE.Group();body.rotation.y=rnd()*6;body.scale.setScalar(s);pivot.add(body);
  if(kind==='pine'||kind==='pineW'){body.add(new THREE.Mesh(TG.ptrunk,TM.ptrunk));body.add(new THREE.Mesh(TG.pine,TM[kind][(rnd()*2)|0]));}
  else{body.add(new THREE.Mesh(TG.trunk,TM.trunk));body.add(new THREE.Mesh(TG.canopy,kind==='cherry'?TM.cherry[(rnd()*2)|0]:TM.leaf[(rnd()*3)|0]));if(fruit)body.add(new THREE.Mesh(TG.fruit,TM.fruit[fruit]));}
  const stump=mk(TG.stump,TM.trunk,0,0.2,0);stump.scale.setScalar(s);stump.visible=false;const st=mk(new THREE.CircleGeometry(0.34,12),TM.stumpTop,0,0.201,0);st.rotation.x=-Math.PI/2;stump.add(st);root.add(stump);
  shadowAll(root);scene.add(root);
  const o={x,z,r:0.5*s};obstacles.push(o);
  trees.push({x,z,s,kind,fruit,root,yawG,pivot,body,stump,o,max:4+Math.round(s*2),hp:4+Math.round(s*2),state:'alive',t:0,shake:0});
}
const rockG=new THREE.DodecahedronGeometry(0.8,0),rockM=toon(0xcac2b6),rocks=[];
function rock(x,z,s){const m=mk(rockG,rockM,x,H(x,z)+0.15*s,z);m.scale.set(s,s*0.75,s);m.rotation.set(rnd(),rnd(),rnd());m.castShadow=m.receiveShadow=true;scene.add(m);
  const o={x,z,r:0.7*s};obstacles.push(o);rocks.push({x,z,s,m,o,hp:4,max:4,state:'alive',t:0,shake:0});}
// ---------- 告示板、路燈、木牌 ----------
let boardMark;
{const g=new THREE.Group(),wood=toon(0xd8a880,{map:TEX.wood});
 for(const s of[-1,1])g.add(mk(new THREE.BoxGeometry(0.2,2.4,0.2),wood,s*1.42,1.2,-0.05));
 g.add(mk(new THREE.BoxGeometry(2.6,1.5,0.15),toon(0xf6d6b8),0,1.7,0));
 [[-0.7,1.9,0xfffaf0],[0.1,1.6,0xffe6f0],[0.75,1.95,0xe8f9ee]].forEach(([x,y,c])=>{const p=mk(new THREE.PlaneGeometry(0.6,0.7),toon(c),x,y,0.08);p.rotation.z=(rnd()-0.5)*0.2;g.add(p);});
 g.add(mk(new THREE.BoxGeometry(3.2,0.15,0.6),toon(0xff8f7a),0,2.55,0));
 g.position.set(BOARD.x,0,BOARD.z);g.rotation.y=-0.4;shadowAll(g);scene.add(g);obstacles.push({x:BOARD.x,z:BOARD.z,r:1.2});
 boardMark=mk(new THREE.OctahedronGeometry(0.35),basic(0xffc83d),BOARD.x,3.6,BOARD.z);boardMark.scale.set(0.7,1.3,0.7);scene.add(boardMark);}
const lamps=[];
function lampPost(x,z,light){const g=new THREE.Group();g.add(mk(new THREE.CylinderGeometry(0.08,0.1,2.8,6),toon(0x9a8478),0,1.4,0));
  const bm=basic(0xe8e2d8);g.add(mk(new THREE.SphereGeometry(0.26,10,8),bm,0,2.9,0));g.add(mk(new THREE.ConeGeometry(0.36,0.25,8),toon(0x9a8478),0,3.2,0));let L=null;if(light){L=new THREE.PointLight(0xffd0a8,0,12,2);L.position.y=2.9;g.add(L);}
  g.position.set(x,H(x,z),z);scene.add(g);lamps.push({bm,L});obstacles.push({x,z,r:0.25});}
lampPost(-7,4,true);lampPost(3,-1,false);
function sign(x,z,ry,lines){const g=new THREE.Group(),wood=toon(0xc89a70,{map:TEX.bark});
  for(const s of[-1,1])g.add(mk(new THREE.BoxGeometry(0.13,1.95,0.13),wood,s*0.72,0.97,-0.14));
  const t=textTex(lines),side=toon(0xf3c8a0);
  g.add(mk(new THREE.BoxGeometry(1.8,0.9,0.1),[side,side,side,side,toon(0xffffff,{map:t}),side],0,1.55,0));
  g.position.set(x,H(x,z),z);g.rotation.y=ry;shadowAll(g);scene.add(g);obstacles.push({x,z,r:0.5});}
sign(46,3,-Math.PI/2,['⚠ 東邊野外','史萊姆出沒']);sign(2.5,-17,0,['↑ 北邊草原','雜草很多']);sign(-14,12,Math.PI*0.75,['↙ 龍蝦村','大家的家']);
sign(-47,35,Math.PI*0.75,['歡迎來到','龍蝦村 🦞']);

// ---------- 龍蝦村 ----------
const V2HOUSES=[[-24,-14,0xfff0e0,0xf2a25e],[24,-15,0xf4f0ff,0xa894e8],[-26,8,0xf0fff4,0x7cc49a],[26,8,0xfff4f8,0xff8fb0],[-13,-26,0xfffbea,0xffc94a],[12,-27,0xf0f8ff,0x8fb8e8],[-19,23,0xfff6f0,0xd98a7a],[20,23,0xf8fff0,0x9ad878]].map(([dx,dz,w,r])=>{
  const x=V2.x+dx,z=V2.z+dz,ry=Math.atan2(V2.x-x,V2.z-z)-Math.PI/2;makeHouse(x,z,ry,w,r,1.15);
  return{x,z,door:{x:x+Math.cos(ry)*(3.03*1.15+0.6),z:z-Math.sin(ry)*(3.03*1.15+0.6)}};});
{const g=new THREE.Group();g.add(mk(new THREE.CylinderGeometry(1.1,1.2,0.9,16),toon(0xd9b8a0,{map:TEX.wood}),0,0.45,0));const wt=mk(new THREE.CircleGeometry(0.95,16),toon(0x7cc8f0),0,0.91,0);wt.rotation.x=-Math.PI/2;g.add(wt);
 for(const s of[-1,1])g.add(mk(new THREE.BoxGeometry(0.14,1.8,0.14),toon(0xc89a70),s*1,1.3,0));const rf=mk(new THREE.ConeGeometry(1.5,0.8,4),toon(0xff8f7a),0,2.5,0);rf.rotation.y=Math.PI/4;g.add(rf);
 g.position.set(V2.x,H(V2.x,V2.z),V2.z);shadowAll(g);scene.add(g);obstacles.push({x:V2.x,z:V2.z,r:1.4});}
// 攤位（拉麵店、雜貨店、家具店）
const STALLS={};
function makeStall(key,dx,dz,ry,o){
  const x=V2.x+dx,z=V2.z+dz,g=new THREE.Group(),wood=toon(0xd8a880,{map:TEX.wood});
  g.add(mk(new THREE.BoxGeometry(3.6,1.1,1.0),wood,0,0.55,0));g.add(mk(new THREE.BoxGeometry(3.8,0.12,1.2),toon(o.top||0xf6e0c8),0,1.14,0));
  for(const[px,pz]of[[-1.75,-1.5],[1.75,-1.5],[-1.75,0.45],[1.75,0.45]])g.add(mk(new THREE.BoxGeometry(0.14,2.9,0.14),wood,px,1.45,pz));
  const stripe=canvasTex(128,32,(c)=>{for(let i=0;i<8;i++){c.fillStyle=i%2?'#ffffff':o.roof;c.fillRect(i*16,0,16,32);}});
  const roof=mk(new THREE.BoxGeometry(4.2,0.14,2.5),toon(0xffffff,{map:stripe}),0,3.0,-0.5);roof.rotation.x=0.18;g.add(roof);
  const scal=mk(new THREE.BoxGeometry(4.2,0.35,0.06),toon(0xffffff,{map:stripe}),0,2.85,0.72);g.add(scal);
  const t=textTex([o.label],'#fff6ea','#7a4a34',256,96,50);const sb=mk(new THREE.BoxGeometry(2.0,0.7,0.1),[toon(0xf3c8a0),toon(0xf3c8a0),toon(0xf3c8a0),toon(0xf3c8a0),toon(0xffffff,{map:t}),toon(0xf3c8a0)],0,3.55,0.5);g.add(sb);
  {const crate=new THREE.Group();crate.add(mk(new THREE.BoxGeometry(1.1,0.84,0.95),toon(0xc89a70,{map:TEX.wood}),0,0.42,0));
   for(const y of[0.05,0.79])crate.add(mk(new THREE.BoxGeometry(1.14,0.08,0.99),toon(0xa87a50),0,y,0));crate.position.set(0,0,-1.1);g.add(crate);}
  if(o.extra)o.extra(g);
  g.position.set(x,H(x,z),z);g.rotation.y=ry;shadowAll(g);scene.add(g);
  for(const lx of[-1.3,0,1.3])obstacles.push({x:x+Math.cos(ry)*lx,z:z-Math.sin(ry)*lx,r:0.75});
  STALLS[key]={x,z,ry,keeper:{x:x-Math.sin(ry)*1.1,z:z-Math.cos(ry)*1.1},front:{x:x+Math.sin(ry)*1.6,z:z+Math.cos(ry)*1.6}};
}
const yawTo=(x,z,tx,tz)=>Math.atan2(tx-x,tz-z);
makeStall('ramen',-17,0,yawTo(-17,0,0,0),{label:'🍜 拉麵',roof:'#ff7a6a',top:0xfff0e0,extra:g=>{
  const nt=textTex(['拉','麵'],'#ff7a6a','#ffffff',128,128,46);for(const s of[-1,1]){const n=mk(new THREE.PlaneGeometry(0.9,0.7),toon(0xffffff,{map:nt,side:THREE.DoubleSide}),s*0.95,2.45,0.74);g.add(n);}
  for(const s of[-1,1]){const l=mk(new THREE.SphereGeometry(0.22,12,10),basic(0xff8a7a),s*2.0,2.4,0.7);l.scale.y=1.25;g.add(l);}
  for(let i=0;i<3;i++)g.add(mk(new THREE.CylinderGeometry(0.22,0.18,0.55,12),toon(0xd8a070),-1+i,0.28,1.0));
  for(let i=0;i<2;i++){const b=mk(new THREE.CylinderGeometry(0.2,0.12,0.15,14),toon(0xfff6ea),-0.6+i*1.2,1.28,0.1);g.add(b);}}});
makeStall('store',17,-1,yawTo(17,-1,0,0),{label:'🧺 雜貨店',roof:'#7cc49a',top:0xf0f8e8,extra:g=>{
  const cols=[0xff9a3c,0xff5a4a,0xff4d6d,0xffa02e];for(let i=0;i<4;i++){const b=mk(new THREE.BoxGeometry(0.6,0.25,0.5),toon(0xd8a070),-1.2+i*0.8,1.33,0.1);g.add(b);for(let k=0;k<3;k++)g.add(mk(new THREE.SphereGeometry(0.1,8,6),toon(cols[i]),-1.35+i*0.8+k*0.15,1.5,0.1));}}});
makeStall('furn',-3,-17,yawTo(-3,-17,0,0),{label:'🛋️ 家具店',roof:'#a894e8',top:0xf4f0ff,extra:g=>{
  g.add(mk(new THREE.BoxGeometry(0.5,0.5,0.5),toon(0xff9ec4),-1.2,1.45,0.1));g.add(mk(new THREE.CylinderGeometry(0.3,0.3,0.08,14),toon(0xf0c9a8),0.2,1.42,0.1));g.add(mk(new THREE.BoxGeometry(0.3,0.6,0.3),toon(0xffe08a),1.2,1.5,0.1));}});
// 舞台
const STAGE={x:V2.x,z:V2.z+18};
{const g=new THREE.Group();g.add(mk(new THREE.BoxGeometry(8,0.6,4.6),toon(0xd8a880,{map:TEX.wood}),0,0.3,0));
 g.add(mk(new THREE.BoxGeometry(8.4,0.12,5),toon(0xffd6e6),0,0.62,0));
 for(const s of[-1,1])g.add(mk(new THREE.BoxGeometry(0.4,4.2,0.4),toon(0xffb3c8),s*4.1,2.1,-2.2));
 const arch=mk(new THREE.BoxGeometry(8.6,0.6,0.4),toon(0xffb3c8),0,4.3,-2.2);g.add(arch);
 const t=textTex(['🦞 龍蝦好友舞台 🦞'],'#fff6ea','#e0607a',512,96,44);g.add(mk(new THREE.PlaneGeometry(5,0.9),toon(0xffffff,{map:t}),0,4.3,-1.99));
 const back=mk(new THREE.PlaneGeometry(8,3.6),toon(0xc8b4f0),0,2.4,-2.38);g.add(back);
 for(let i=0;i<12;i++){const f=mk(new THREE.ConeGeometry(0.2,0.45,3),toon([0xff9ec7,0xffd36e,0x8fdcb4,0x8fd0ff][i%4]),-3.6+i*0.66,3.75-Math.sin(i/11*Math.PI)*0.4,-2.0);f.rotation.x=Math.PI;g.add(f);}
 for(let i=0;i<4;i++){const d=mk(new THREE.CircleGeometry(0.75,20),basic([0xffc4dc,0xbfe0ff,0xfff0a0,0xc8f0dc][i],{transparent:true,opacity:0.6,depthWrite:false}),-2.7+i*1.8,0.69,0.3);d.rotation.x=-Math.PI/2;g.add(d);}
 g.position.set(STAGE.x,H(STAGE.x,STAGE.z),STAGE.z);g.rotation.y=Math.PI;shadowAll(g);scene.add(g);
 obstacles.push({x:STAGE.x,z:STAGE.z,r:2.5},{x:STAGE.x-2.8,z:STAGE.z,r:2.2},{x:STAGE.x+2.8,z:STAGE.z,r:2.2});}
lampPost(V2.x+5,V2.z+4,false);lampPost(V2.x-5,V2.z-4,false);

// ---------- 倉鼠精靈村 ----------
const V3HOUSES=[[-18,-10,0xfffbea,0xffc94a],[18,-10,0xfff6f0,0xd9a07a],[-19,9,0xf8fff0,0xa8d878],[19,8,0xfff8fb,0xffa8c8],[0,-21,0xfff0f8,0xe8a0c8],[-9,21,0xf0fff8,0x8fd0b8]].map(([dx,dz,w,r])=>{
  const x=V3.x+dx,z=V3.z+dz,ry=Math.atan2(V3.x-x,V3.z-z)-Math.PI/2;makeHouse(x,z,ry,w,r,1.05);
  return{x,z,door:{x:x+Math.cos(ry)*(3.03*1.05+0.6),z:z-Math.sin(ry)*(3.03*1.05+0.6)}};});
{const g=new THREE.Group(),pk=toon(0xffb3c8),wd=toon(0xd8a880,{map:TEX.wood});
 const wheel=new THREE.Group();wheel.add(mk(new THREE.TorusGeometry(2.0,0.16,10,40),pk));wheel.add(mk(new THREE.TorusGeometry(2.0,0.16,10,40),pk,0,0,1.4));
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const b=mk(new THREE.CylinderGeometry(0.06,0.06,1.4,6),toon(0xfff3c0),Math.cos(a)*2,Math.sin(a)*2,0.7);b.rotation.x=Math.PI/2;wheel.add(b);}
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const sp=mk(new THREE.CylinderGeometry(0.05,0.05,2,6),toon(0xffd6e0),Math.cos(a)*1,Math.sin(a)*1,0);sp.rotation.z=a+Math.PI/2;wheel.add(sp);}
 wheel.add(mk(new THREE.CylinderGeometry(0.2,0.2,1.8,10),wd,0,0,0.7)).children;wheel.children[wheel.children.length-1].rotation.x=Math.PI/2;
 wheel.position.set(0,2.4,-0.7);g.add(wheel);g.userData.wheel=wheel;
 for(const z of[-1.0,1.0])for(const s of[-1,1]){const l=mk(new THREE.BoxGeometry(0.2,2.6,0.2),wd,s*0.8,1.2,z);l.rotation.z=s*0.3;g.add(l);}
 g.add(mk(new THREE.CylinderGeometry(2.6,2.8,0.3,24),toon(0xf2dcae),0,0.15,0));
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const sd=mk(new THREE.SphereGeometry(0.16,8,6),toon(0x5a4030),Math.cos(a)*2.3,0.35,Math.sin(a)*2.3);sd.scale.set(0.7,0.5,1.3);sd.rotation.y=-a;g.add(sd);}
 g.position.set(V3.x,H(V3.x,V3.z),V3.z);g.rotation.y=0;shadowAll(g);scene.add(g);obstacles.push({x:V3.x,z:V3.z,r:2.8});var HAMWHEEL=wheel;}
for(const[x,z]of[[V3.x+5,V3.z-4],[V3.x-5,V3.z+4]])lampPost(x,z,false);
sign(11.5,58.5,Math.PI*0.85,['倉鼠精靈村','🐹 歡迎光臨']);sign(9,12,Math.PI*0.85,['↘ 倉鼠精靈村','往這邊走']);
// sunflowers
{const st=toon(0x6cb656),pe=toon(0xffd84a),ce=toon(0x8a5a30);
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2+0.2,d=SR(5,7);const x=V3.x+Math.cos(a)*d,z=V3.z+Math.sin(a)*d;if(!farFrom(x,z,0.8))continue;const g=new THREE.Group();
   g.add(mk(new THREE.CylinderGeometry(0.05,0.06,1.4,6),st,0,0.7,0));const hd=new THREE.Group();hd.add(mk(new THREE.CylinderGeometry(0.28,0.28,0.08,14),pe));hd.add(mk(new THREE.CylinderGeometry(0.15,0.15,0.1,12),ce,0,0.02,0));
   hd.position.y=1.45;hd.rotation.x=Math.PI/2-0.3;g.add(hd);g.position.set(x,H(x,z),z);g.rotation.y=Math.atan2(V3.x-x,V3.z-z)+Math.PI;shadowAll(g);scene.add(g);}}
// ---------- 釣魚池 ----------
{const w=mk(new THREE.CircleGeometry(POND.r-0.2,48),toon(0x7cc8f0),POND.x,-0.42,POND.z);w.rotation.x=-Math.PI/2;w.receiveShadow=true;scene.add(w);
 const rim=mk(new THREE.RingGeometry(POND.r-0.9,POND.r-0.2,48),basic(0xd8f2ff,{transparent:true,opacity:0.6,depthWrite:false}),POND.x,-0.41,POND.z);rim.rotation.x=-Math.PI/2;scene.add(rim);
 for(let i=0;i<6;i++){const a=SR(0,6.28),d=SR(1.5,POND.r-1.5);const lp=mk(new THREE.CircleGeometry(SR(0.35,0.6),16,0.4,5.6),toon(0x6cbc58),POND.x+Math.cos(a)*d,-0.39,POND.z+Math.sin(a)*d);lp.rotation.x=-Math.PI/2;lp.rotation.z=SR(0,6);scene.add(lp);
   if(i%2===0){const fl=mk(new THREE.SphereGeometry(0.12,8,6),toon(0xffb3d1),lp.position.x+0.1,-0.3,lp.position.z);scene.add(fl);}}
 obstacles.push({x:POND.x,z:POND.z,r:POND.r-0.5});}
sign(POND.x-POND.r-2.2,POND.z-3,-Math.PI/2+0.4,['🎣 釣魚池','拿釣竿來玩']);
// ---------- 洞窟入口 ----------
const CAVE_FRONT=(()=>{const ry=Math.atan2(-CAVE_DOOR.x,-CAVE_DOOR.z);return{x:CAVE_DOOR.x+Math.sin(ry)*3.2,z:CAVE_DOOR.z+Math.cos(ry)*3.2,ry};})();
{const g=new THREE.Group(),rm=toon(0x9a8ca8,{flatShading:true}),rm2=toon(0x847696,{flatShading:true});
 [[0,1.6,-0.6,2.6],[-2.2,1.0,-0.2,1.8],[2.2,1.0,-0.2,1.8],[-1.2,3.0,-0.4,1.4],[1.3,2.9,-0.5,1.5],[0,3.9,-0.8,1.2],[-3.4,0.6,0.2,1.1],[3.4,0.6,0.2,1.1]].forEach(([x,y,z,r],i)=>{const b=mk(new THREE.DodecahedronGeometry(r,0),i%2?rm:rm2,x,y,z);b.rotation.set(i,i*2,0);g.add(b);});
 const hole=mk(new THREE.CircleGeometry(1.5,24,0,Math.PI),basic(0x140f1e),0,0.02,1.5);g.add(hole);hole.scale.y=1.3;
 for(const c of[[0x8fe8ff,-1.6],[0xff9ed6,1.7],[0xd0a8ff,-2.6]]){const cr=mk(new THREE.OctahedronGeometry(0.35),basic(c[0]),c[1],0.6,1.3);cr.scale.y=1.8;g.add(cr);}
 g.position.set(CAVE_DOOR.x,H(CAVE_DOOR.x,CAVE_DOOR.z),CAVE_DOOR.z);g.rotation.y=CAVE_FRONT.ry;shadowAll(g);scene.add(g);obstacles.push({x:CAVE_DOOR.x,z:CAVE_DOOR.z,r:2.6});}
sign(CAVE_FRONT.x+Math.cos(CAVE_FRONT.ry)*3,CAVE_FRONT.z-Math.sin(CAVE_FRONT.ry)*3,CAVE_FRONT.ry,['⛰️ 史萊姆洞窟','⚠ 非常危險']);
// ---------- 洞窟內部 ----------
const caveObs=[];const CAVE_EXIT={x:CAVE.x,z:CAVE.z+CAVE.r-3};
{const g=new THREE.Group();g.position.set(CAVE.x,0,CAVE.z);
 const fl=mk(new THREE.CircleGeometry(CAVE.r+3,48),toon(0x6a5a7c,{map:TEX.soil}),0,0,0);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;g.add(fl);
 g.add(mk(new THREE.CylinderGeometry(CAVE.r+1,CAVE.r+3,12,40,1,true),toon(0x4e4262,{side:THREE.BackSide,flatShading:true}),0,6,0));
 const sm=toon(0x7a6c8c,{flatShading:true}),cols=[0x8fe8ff,0xff9ed6,0xd0a8ff,0xfff08a,0x9ff0c8];
 for(let i=0;i<22;i++){const a=SR(0,6.28),d=SR(5,CAVE.r-3);const x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.hypot(x,z-(CAVE.r-3))<5)continue;const h=SR(1.5,4),r=SR(0.5,1.1);
   g.add(mk(new THREE.ConeGeometry(r,h,7),sm,x,h/2,z));caveObs.push({x:CAVE.x+x,z:CAVE.z+z,r:r+0.1});}
 for(let i=0;i<26;i++){const a=SR(0,6.28),d=SR(CAVE.r-4,CAVE.r);const x=Math.cos(a)*d,z=Math.sin(a)*d;const cl=new THREE.Group();const c=cols[i%5];
   for(let k=0;k<3;k++){const cr=mk(new THREE.OctahedronGeometry(SR(0.25,0.5)),basic(c),SR(-0.4,0.4),SR(0.3,0.8),SR(-0.4,0.4));cr.scale.y=1.8;cr.rotation.set(SR(-0.4,0.4),SR(0,3),SR(-0.4,0.4));cl.add(cr);}
   cl.position.set(x,0,z);g.add(cl);}
 const ex=new THREE.Group();ex.add(mk(new THREE.TorusGeometry(1.8,0.25,8,30,Math.PI),basic(0xfff3c0)));const pt=mk(new THREE.CircleGeometry(1.6,24,0,Math.PI),basic(0xfff8e0,{transparent:true,opacity:0.7}));ex.add(pt);
 ex.position.set(0,0,CAVE.r-1.2);ex.rotation.y=Math.PI;g.add(ex);
 shadowAll(g);scene.add(g);
}
// ---------- 種樹、石頭 ----------
const okSpot=(x,z,r)=>Math.hypot(x,z)>=r&&Math.hypot(x-POND.x,z-POND.z)>=POND.r+5&&Math.hypot(x-CAVE_DOOR.x,z-CAVE_DOOR.z)>=8&&Math.hypot(x-V2.x,z-V2.z)>=r+18&&Math.hypot(x-V3.x,z-V3.z)>=r+14&&!PATHS.some(p=>segDist(x,z,...p)<4);
for(let i=0;i<26;i++){const a=SR(0,6.28),d=SR(17,24);const x=Math.cos(a)*d,z=Math.sin(a)*d;if(okSpot(x,z,16)&&farFrom(x,z,2.2))tree(x,z,SR(0.85,1.2),rnd()<0.35?'cherry':rnd()<0.3?'fruit':'broad');}
for(let i=0;i<22;i++){const a=SR(0,6.28),d=SR(39,45);const x=V2.x+Math.cos(a)*d,z=V2.z+Math.sin(a)*d;if(farFrom(x,z,2.2)&&!onPath(x,z))tree(x,z,SR(0.85,1.2),rnd()<0.5?'cherry':'fruit');}
for(let i=0;i<300;i++){const x=SR(-112,112),z=SR(-112,112);if(!okSpot(x,z,22))continue;
  if(ZONE.meadow(x,z)&&rnd()<0.88)continue;const wild=x>50;if(!wild&&rnd()<0.45)continue;if(!farFrom(x,z,2.6))continue;
  tree(x,z,SR(0.8,1.3),wild?(rnd()<0.7?'pineW':'pine'):(rnd()<0.25?'cherry':rnd()<0.25?'pine':rnd()<0.2?'fruit':'broad'));}
for(let i=0;i<70;i++){const x=SR(-110,110),z=SR(-110,110);if(!okSpot(x,z,16)||!farFrom(x,z,1.5))continue;rock(x,z,SR(0.6,1.4));}
for(let i=0;i<6;i++){const a=SR(0,6.28);const x=Math.cos(a)*13,z=Math.sin(a)*13+3;if(farFrom(x,z,1.5)&&!onPath(x,z))rock(x,z,SR(0.6,0.9));}
// ---------- 草叢、灌木、小花（色塊細節） ----------
{const blade=mergeGeos([0,1,2,3,4].map(i=>{const a=i*1.26;return[new THREE.ConeGeometry(0.06,0.55,3),M4(Math.cos(a)*0.08,0.26,Math.sin(a)*0.08,Math.sin(a)*0.35,0,-Math.cos(a)*0.35,1,0.7+((i*37)%5)*0.12,1)];}));
 const N=2600,im=new THREE.InstancedMesh(blade,toon(0xffffff),N),m=new THREE.Matrix4(),col=new THREE.Color(),q=new THREE.Quaternion(),e=new THREE.Euler();let k=0;
 const pal=[0x6cbf4e,0x7fcc58,0x5aad48,0x8fd862];
 for(let t=0;t<N*3&&k<N;t++){const x=SR(-110,110),z=SR(-110,110);if(onPath(x,z)||Math.hypot(x-POND.x,z-POND.z)<POND.r+0.5)continue;if(Math.hypot(x,z)<8||Math.hypot(x-V2.x,z-V2.z)<15||Math.hypot(x-V3.x,z-V3.z)<13)continue;
   const sc=SR(0.8,1.6);q.setFromEuler(e.set(0,SR(0,6.28),0));m.compose(new THREE.Vector3(x,H(x,z)-0.05,z),q,new THREE.Vector3(sc,sc,sc));im.setMatrixAt(k,m);
   col.setHex(pal[(rnd()*4)|0]);if(x>45)col.lerp(new THREE.Color(0x4f9a74),0.6);im.setColorAt(k,col);k++;}
 im.count=k;im.receiveShadow=true;scene.add(im);}
{const bushG=mergeGeos([[new THREE.SphereGeometry(0.7,20,14),M4(0,0.45,0,0,0,0,1.1,0.8,1)],[new THREE.SphereGeometry(0.5,16,12),M4(0.6,0.35,0.2)],[new THREE.SphereGeometry(0.5,16,12),M4(-0.55,0.32,-0.1)]]);
 const N=170,im=new THREE.InstancedMesh(bushG,toon(0xffffff),N),m=new THREE.Matrix4(),col=new THREE.Color(),q=new THREE.Quaternion(),e=new THREE.Euler();let k=0;const pal=[0x5fae4c,0x6fbc56,0x4f9e48];
 for(let t=0;t<N*4&&k<N;t++){const x=SR(-110,110),z=SR(-110,110);if(!okSpot(x,z,12)||!farFrom(x,z,1.2))continue;const sc=SR(0.7,1.4);q.setFromEuler(e.set(0,SR(0,6.28),0));
   m.compose(new THREE.Vector3(x,H(x,z),z),q,new THREE.Vector3(sc,sc,sc));im.setMatrixAt(k,m);col.setHex(pal[(rnd()*3)|0]);im.setColorAt(k,col);k++;}
 im.count=k;im.castShadow=true;im.receiveShadow=true;scene.add(im);}
{const petal=mergeGeos([0,1,2,3,4].map(i=>{const a=i*1.2566;return[new THREE.CircleGeometry(0.09,6),M4(Math.cos(a)*0.08,0.22,Math.sin(a)*0.08,-Math.PI/2,0,0)];}).concat([[new THREE.CylinderGeometry(0.012,0.012,0.22,4),M4(0,0.11,0)]]));
 const N=900,im=new THREE.InstancedMesh(petal,toon(0xffffff,{side:THREE.DoubleSide}),N),m=new THREE.Matrix4(),col=new THREE.Color(),q=new THREE.Quaternion();let k=0;const pal=[0xffffff,0xffd0e0,0xfff08a,0xd8c8ff,0xff9ec0];
 for(let t=0;t<N*3&&k<N;t++){let x,z;const r=rnd();if(r<0.5){x=SR(-72,42);z=SR(-78,-14);}else{x=SR(-110,110);z=SR(-110,110);}if(onPath(x,z)||Math.hypot(x-POND.x,z-POND.z)<POND.r+0.5)continue;
   q.identity();const sc=SR(0.8,1.3);m.compose(new THREE.Vector3(x,H(x,z),z),q,new THREE.Vector3(sc,sc,sc));im.setMatrixAt(k,m);col.setHex(pal[(rnd()*5)|0]);im.setColorAt(k,col);k++;}
 im.count=k;scene.add(im);}
// 雲、星星、月亮
const clouds=[];{const cm=toon(0xffffff,{emissive:0x404850});
 for(let i=0;i<14;i++){const g=new THREE.Group();for(let k=0;k<4;k++){const s=mk(new THREE.SphereGeometry(SR(3,5),12,9),cm,k*3.5-5,SR(-1,1),SR(-2,2));s.scale.y=0.65;g.add(s);}
  g.position.set(SR(-160,160),SR(40,58),SR(-160,160));scene.add(g);clouds.push(g);}}
const starMat=new THREE.PointsMaterial({color:0xfff0fa,size:2,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false});
const stars=(()=>{const p=[];for(let i=0;i<550;i++){const u=Math.random()*6.28,v=Math.random()*1.3;p.push(Math.cos(u)*Math.cos(v)*300,Math.sin(v)*300+10,Math.sin(u)*Math.cos(v)*300);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));const s=new THREE.Points(g,starMat);scene.add(s);return s;})();
const moon=mk(new THREE.SphereGeometry(9,16,12),basic(0xfff3e0,{fog:false}));scene.add(moon);

// ---------- 室內 ----------
const INT={x:400,z:0,w:8,d:6.5,h:4.6};
const indoorObs=[],indoorWin=[];
{const g=new THREE.Group();g.position.set(INT.x,0,INT.z);
 const fl=mk(new THREE.BoxGeometry(INT.w*2,0.2,INT.d*2),toon(0xf0c8a4,{map:TEX.wood}),0,-0.1,0);fl.receiveShadow=true;g.add(fl);
 const wp=canvasTex(128,128,(c)=>{c.fillStyle='#fff6ee';c.fillRect(0,0,128,128);c.fillStyle='#ffe2d6';for(let y=0;y<128;y+=32)for(let x=0;x<128;x+=32){c.beginPath();c.arc(x+(y%64?16:0),y+16,5,0,7);c.fill();}},[6,2]);
 g.add(mk(new THREE.BoxGeometry(INT.w*2,INT.h,INT.d*2),toon(0xffffff,{side:THREE.BackSide,map:wp}),0,INT.h/2-0.06,0));
 g.add(mk(new THREE.BoxGeometry(INT.w*2-0.02,1.0,INT.d*2-0.02),toon(0xf2c4b4,{side:THREE.BackSide}),0,0.45,0));
 for(const z of[-2.6,2.6]){const w=mk(new THREE.PlaneGeometry(1.3,1.1),basic(0x9fd6ff),-INT.w+0.06,2.1,z);w.rotation.y=Math.PI/2;g.add(w);indoorWin.push(w.material);
   g.add(mk(new THREE.BoxGeometry(0.06,1.3,1.5),toon(0xffffff),-INT.w+0.02,2.1,z));g.add(mk(new THREE.BoxGeometry(0.05,0.08,1.3),toon(0xffffff),-INT.w+0.09,2.1,z));}
 for(const x of[-1.4,1.8]){const w=mk(new THREE.PlaneGeometry(1.3,1.1),basic(0x9fd6ff),x,2.1,-INT.d+0.06);g.add(w);indoorWin.push(w.material);g.add(mk(new THREE.BoxGeometry(1.5,1.3,0.06),toon(0xffffff),x,2.1,-INT.d+0.02));}
 {const dg=new THREE.Group(),wd=toon(0xc8946a);dg.add(mk(new THREE.PlaneGeometry(2.0,3.1),toon(0xffffff),0,1.55,0));dg.add(mk(new THREE.PlaneGeometry(1.6,2.8),wd,0,1.4,0.02));
  dg.add(mk(new THREE.CircleGeometry(0.1,12),toon(0xffd36e),0.55,1.35,0.04));dg.add(mk(new THREE.CircleGeometry(0.34,20),toon(0xffffff),0,2.3,0.03));const wn=mk(new THREE.CircleGeometry(0.27,18),basic(0x9fd6ff),0,2.3,0.04);dg.add(wn);indoorWin.push(wn.material);
  dg.position.set(5,0,-INT.d+0.08);g.add(dg);
  const mat=mk(new THREE.PlaneGeometry(1.8,1.1),toon(0xb9a6f2),5,0.016,-INT.d+1.0);mat.rotation.x=-Math.PI/2;g.add(mat);}
 const plant=new THREE.Group();plant.add(mk(new THREE.CylinderGeometry(0.3,0.24,0.5,12),toon(0xffb8a0),0,0.25,0));plant.add(mk(new THREE.SphereGeometry(0.5,14,10),toon(0x8fcf6c),0,0.9,0));plant.position.set(INT.w-0.7,0,INT.d-0.7);g.add(plant);
 g.traverse(o=>{if(o.isMesh&&o.material.side!==THREE.BackSide){o.castShadow=true;o.receiveShadow=true;}});
 scene.add(g);
 const iL=new THREE.PointLight(0xffe0c0,0.4,14,1.5);iL.position.set(INT.x,3.8,INT.z);iL.distance=20;scene.add(iL);INT.light=iL;
 indoorObs.push({x:INT.x+INT.w-0.7,z:INT.d-0.7,r:0.4});
}

// ---------- 雜草（沒有圓球了） ----------
const weedG=new THREE.ConeGeometry(0.11,0.85,4),weedM=toon(0x5fae4c),weeds=[],weedTimers=[];
function weedSpot(){for(let k=0;k<40;k++){const x=R(-68,38),z=R(-74,-18);if(farFrom(x,z,0.8)&&Math.hypot(x-ply.x,z-ply.z)>6&&!weeds.some(w=>Math.hypot(w.x-x,w.z-z)<2)&&!farmAt(x,z))return[x,z];}return[R(-60,30),R(-70,-20)];}
function spawnWeed(){const[x,z]=weedSpot(),g=new THREE.Group();
  for(let i=0;i<6;i++){const b=mk(weedG,weedM,R(-0.2,0.2),0.35,R(-0.2,0.2));b.rotation.set(R(-0.5,0.5),R(0,3),R(-0.5,0.5));b.scale.set(1,R(0.8,1.3),0.4);g.add(b);}
  g.position.set(x,H(x,z),z);g.ph=Math.random()*6;g.scale.setScalar(0.01);g.grow=0;shadowAll(g);scene.add(g);weeds.push({x,z,g});}

// ---------- 蝴蝶 ----------
const bugMats={};
for(const[k,b]of Object.entries(BUGS)){const t=canvasTex(128,128,(c)=>{c.fillStyle=b.col;c.strokeStyle='#5a3a2a';c.lineWidth=6;c.beginPath();c.moveTo(4,64);c.bezierCurveTo(20,0,120,0,124,40);c.bezierCurveTo(124,70,80,64,70,70);c.bezierCurveTo(100,90,100,128,56,124);c.bezierCurveTo(30,120,10,90,4,64);c.closePath();c.fill();c.stroke();
  c.fillStyle=b.dot;c.beginPath();c.arc(84,34,10,0,7);c.fill();c.beginPath();c.arc(54,96,8,0,7);c.fill();});
  bugMats[k]=new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:0.4,side:THREE.DoubleSide});}
const butterflies=[];const wingG=new THREE.PlaneGeometry(0.42,0.42);wingG.translate(0.21,0,0);wingG.rotateX(-Math.PI/2);
function spawnButterfly(){
  const wild=Math.random()<0.3;let x,z;
  if(wild){x=R(55,105);z=R(-90,90);}else{const r=Math.random();if(r<0.5){x=R(-65,35);z=R(-72,-20);}else if(r<0.75){const a=R(0,6.28),d=R(6,20);x=Math.cos(a)*d;z=Math.sin(a)*d;}else{const a=R(0,6.28),d=R(10,26);x=V2.x+Math.cos(a)*d;z=V2.z+Math.sin(a)*d;}}
  const pool=Object.entries(BUGS).filter(([k,b])=>wild||!b.wild);let tot=pool.reduce((s,[,b])=>s+b.w,0),pick=Math.random()*tot,sp=pool[0][0];for(const[k,b]of pool){pick-=b.w;if(pick<=0){sp=k;break;}}
  const g=new THREE.Group();const wl=new THREE.Mesh(wingG,bugMats[sp]),wr=new THREE.Mesh(wingG,bugMats[sp]);wr.scale.x=-1;g.add(wl,wr);g.add(mk(new THREE.CylinderGeometry(0.03,0.03,0.28,6),basic(0x5a3a2a),0,0,0)).rotation&&0;
  g.children[2].rotation.x=Math.PI/2;g.position.set(x,H(x,z)+1.2,z);scene.add(g);
  butterflies.push({g,wl,wr,sp,x,z,y:1.2,tx:x,tz:z,ph:Math.random()*6,spd:R(1.4,2.2),caught:false});
}

// ---------- 農田 ----------
const TILE=1.25,farm=new Map();
const soilM={dry:toon(0xc7976a,{map:TEX.soil}),wet:toon(0x8c6040,{map:TEX.soil})};
const soilG=new THREE.BoxGeometry(TILE*0.94,0.12,TILE*0.94);
const gkey=(gx,gz)=>gx+','+gz;
function farmAt(x,z){return farm.get(gkey(Math.round(x/TILE),Math.round(z/TILE)));}
function canTill(gx,gz){const x=gx*TILE,z=gz*TILE;if(farm.has(gkey(gx,gz)))return false;if(onPath(x,z)||Math.hypot(x-BOARD.x,z-BOARD.z)<2.5)return false;
  if(Math.hypot(x-V2.x,z-V2.z)<24)return false;if(Math.abs(x)>110||Math.abs(z)>110)return false;return farFrom(x,z,0.7)&&!weeds.some(w=>Math.hypot(w.x-x,w.z-z)<1);}
function till(gx,gz,fx=true){const x=gx*TILE,z=gz*TILE;const m=mk(soilG,soilM.dry,x,H(x,z)+0.04,z);m.receiveShadow=true;scene.add(m);
  const t={gx,gz,x,z,m,wet:false,crop:null};farm.set(gkey(gx,gz),t);if(fx){m.scale.setScalar(0.01);t.pop=0;}return t;}
function setWet(t,w){t.wet=w;t.m.material=w?soilM.wet:soilM.dry;}
function cropMesh(type,stage){
  const g=new THREE.Group(),lf=toon(0x5fbf4f),c=CROPS[type];
  if(stage===0){g.add(mk(new THREE.SphereGeometry(0.16,8,6),toon(0x8a5a3a),0,0.02,0)).scale&&0;g.children[0].scale.y=0.4;return g;}
  const leaf=(x,z,s,ry)=>{const l=mk(new THREE.SphereGeometry(0.16,8,6),lf,x,0.12*s+0.05,z);l.scale.set(0.6*s,0.35*s,1.4*s);l.rotation.y=ry;l.rotation.x=-0.5;g.add(l);};
  if(stage===1){leaf(0.06,0,0.8,0.6);leaf(-0.06,0,0.8,-0.6);return g;}
  if(stage===2){for(let i=0;i<4;i++)leaf(Math.cos(i*1.57)*0.12,Math.sin(i*1.57)*0.12,1.3,i*1.57);return g;}
  if(type==='carrot'){const ca=mk(new THREE.ConeGeometry(0.16,0.45,10),toon(c.col),0,0.08,0);ca.rotation.x=Math.PI;g.add(ca);for(let i=0;i<5;i++){const l=mk(new THREE.ConeGeometry(0.06,0.55,5),lf,Math.cos(i*1.25)*0.06,0.55,Math.sin(i*1.25)*0.06);l.rotation.set(Math.sin(i*1.25)*0.4,0,-Math.cos(i*1.25)*0.4);g.add(l);}}
  else if(type==='tomato'){g.add(mk(new THREE.SphereGeometry(0.42,12,10),toon(0x4fae46),0,0.45,0));[[0.25,0.5,0.25],[-0.28,0.4,0.18],[0.05,0.7,0.3],[0.1,0.35,-0.3]].forEach(([x,y,z])=>g.add(mk(new THREE.SphereGeometry(0.13,10,8),toon(c.col),x,y,z)));}
  else if(type==='strawberry'){for(let i=0;i<5;i++)leaf(Math.cos(i*1.25)*0.18,Math.sin(i*1.25)*0.18,1.4,i*1.25);[[0.2,0.15],[-0.18,0.1],[0,-0.22]].forEach(([x,z])=>{const b=mk(new THREE.ConeGeometry(0.1,0.2,10),toon(c.col),x,0.12,z);b.rotation.x=Math.PI;g.add(b);});}
  else if(type==='pumpkin'){const p=mk(new THREE.SphereGeometry(0.42,16,12),toon(c.col),0,0.32,0);p.scale.set(1.15,0.8,1.15);g.add(p);g.add(mk(new THREE.CylinderGeometry(0.05,0.06,0.2,6),toon(0x6a8a3a),0,0.72,0));leaf(0.4,0.2,1.3,0.5);leaf(-0.4,-0.1,1.3,-0.8);}
  return g;
}
function setCropStage(t,stage){if(t.crop.mesh)scene.remove(t.crop.mesh);t.crop.stage=stage;const m=cropMesh(t.crop.type,stage);m.position.set(t.x,H(t.x,t.z)+0.1,t.z);m.rotation.y=Math.random()*6;shadowAll(m);m.scale.setScalar(0.01);t.crop.pop=0;scene.add(m);t.crop.mesh=m;}

// ---------- 家具 ----------
const placed=[];
const lightPool=[];for(let i=0;i<2;i++){const L=new THREE.PointLight(0xffc8a0,0,12,2);L.position.set(0,-50,0);scene.add(L);lightPool.push({L,used:null});}
function buildFurn(id){const outer=new THREE.Group(),inner=buildFurnInner(id);inner.scale.setScalar(fsOf(id));outer.add(inner);outer.userData=inner.userData;return outer;}
function buildFurnInner(id){
  const g=new THREE.Group(),wd=toon(0xf0c9a8,{map:TEX.wood}),wd2=toon(0xd8a880),pk=toon(0xff9ec4),wh=toon(0xfffaf5);
  if(id==='bench'){g.add(mk(new THREE.BoxGeometry(1.3,0.85,1.1),wd2,0,0.42,0));g.add(mk(new THREE.BoxGeometry(1.45,0.14,1.25),wd,0,0.9,0));
    g.add(mk(new THREE.BoxGeometry(0.5,0.08,0.3),toon(0xcfc6dc),-0.3,1.01,0.1));const hm=mk(new THREE.CylinderGeometry(0.04,0.04,0.5,6),pk,0.3,1.0,-0.1);hm.rotation.z=Math.PI/2;g.add(hm);}
  else if(id==='fence'){for(const x of[-0.75,0.75])g.add(mk(new THREE.BoxGeometry(0.18,1.0,0.18),wh,x,0.5,0));for(const y of[0.35,0.75])g.add(mk(new THREE.BoxGeometry(1.6,0.12,0.08),toon(0xffd3e6),0,y,0));
    for(const x of[-0.75,0.75])g.add(mk(new THREE.ConeGeometry(0.13,0.2,4),wh,x,1.1,0));}
  else if(id==='chair'){g.add(mk(new THREE.BoxGeometry(0.75,0.12,0.75),pk,0,0.5,0));g.add(mk(new THREE.BoxGeometry(0.75,0.7,0.1),wd,0,0.9,-0.33));
    for(const[x,z]of[[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]])g.add(mk(new THREE.BoxGeometry(0.09,0.5,0.09),wd2,x,0.25,z));}
  else if(id==='sofa'){const c=toon(0x9fc8f0);g.add(mk(new THREE.BoxGeometry(1.8,0.45,0.9),c,0,0.32,0));g.add(mk(new THREE.BoxGeometry(1.8,0.75,0.25),c,0,0.75,-0.38));
    for(const s of[-1,1])g.add(mk(new THREE.BoxGeometry(0.25,0.6,0.9),c,s*0.9,0.5,0));for(const s of[-1,1]){const cu=mk(new THREE.BoxGeometry(0.75,0.15,0.7),toon(0xd6e8ff),s*0.4,0.6,0.05);g.add(cu);}}
  else if(id==='table'){g.add(mk(new THREE.CylinderGeometry(0.75,0.75,0.1,20),wd,0,0.8,0));g.add(mk(new THREE.CylinderGeometry(0.1,0.16,0.8,8),wd2,0,0.4,0));
    g.add(mk(new THREE.CylinderGeometry(0.2,0.24,0.22,16),toon(0xffe08a),0,0.96,0));g.add(mk(new THREE.CylinderGeometry(0.2,0.2,0.05,16),toon(0xa0623a),0,1.09,0));}
  else if(id==='pot'){g.add(mk(new THREE.CylinderGeometry(0.3,0.22,0.4,12),toon(0xffb8a0),0,0.2,0));g.add(mk(new THREE.CylinderGeometry(0.06,0.06,0.25),toon(0x8fdcb4),0,0.5,0));
    for(let i=0;i<5;i++){const a=i/5*6.28;g.add(mk(new THREE.SphereGeometry(0.1,8,6),pk,Math.cos(a)*0.12,0.68,Math.sin(a)*0.12));}g.add(mk(new THREE.SphereGeometry(0.08,8,6),toon(0xffe08a),0,0.7,0));}
  else if(id==='lantern'){g.add(mk(new THREE.CylinderGeometry(0.06,0.08,1.4,6),toon(0x9a8478),0,0.7,0));const gl=basic(0xfff0d0);g.userData.glow=gl;g.add(mk(new THREE.BoxGeometry(0.4,0.45,0.4),gl,0,1.6,0));
    const lr=mk(new THREE.ConeGeometry(0.34,0.25,4),pk,0,1.95,0);lr.rotation.y=Math.PI/4;g.add(lr);}
  else if(id==='campfire'){for(let i=0;i<7;i++){const a=i/7*6.28;g.add(mk(new THREE.DodecahedronGeometry(0.17,0),toon(0xcac2b6),Math.cos(a)*0.55,0.1,Math.sin(a)*0.55));}
    for(let i=0;i<3;i++){const l=mk(new THREE.CylinderGeometry(0.07,0.07,0.8,6),wd2,0,0.15,0);l.rotation.z=Math.PI/2;l.rotation.y=i*1.05;g.add(l);}
    const fl=new THREE.Group();fl.add(mk(new THREE.ConeGeometry(0.28,0.7,7),basic(0xffa36e),0,0.5,0));fl.add(mk(new THREE.ConeGeometry(0.16,0.45,7),basic(0xfff07a),0,0.45,0));g.add(fl);g.userData.flame=fl;}
  else if(id==='bed'){g.add(mk(new THREE.BoxGeometry(1.3,0.4,2.1),pk,0,0.25,0));g.add(mk(new THREE.BoxGeometry(1.2,0.18,1.95),wh,0,0.52,0));
    g.add(mk(new THREE.BoxGeometry(1.22,0.12,1.2),toon(0xffc4dc),0,0.62,0.35));g.add(mk(new THREE.BoxGeometry(0.8,0.16,0.4),wh,0,0.68,-0.7));
    g.add(mk(new THREE.BoxGeometry(1.3,0.9,0.12),toon(0xffb3d1),0,0.5,-1.05));}
  else if(id==='bathtub'){const w=toon(0xffffff),pk=toon(0xffc4dc);
    g.add(mk(new THREE.BoxGeometry(2.9,0.32,2.0),w,0,0.22,0));
    for(const s2 of[-1,1]){g.add(mk(new THREE.BoxGeometry(2.9,0.75,0.18),w,0,0.68,s2*0.91));g.add(mk(new THREE.BoxGeometry(0.18,0.75,2.0),w,s2*1.36,0.68,0));}
    for(const s2 of[-1,1]){g.add(mk(new THREE.BoxGeometry(2.98,0.1,0.26),pk,0,1.08,s2*0.91));g.add(mk(new THREE.BoxGeometry(0.26,0.1,2.08),pk,s2*1.36,1.08,0));}
    const water=mk(new THREE.BoxGeometry(2.55,0.06,1.65),toon(0x9fdcff),0,0.78,0);g.add(water);
    for(const[x,z]of[[-1.2,-0.8],[1.2,-0.8],[-1.2,0.8],[1.2,0.8]])g.add(mk(new THREE.SphereGeometry(0.13,8,6),toon(0xffd36e),x,0.07,z));
    for(let i=0;i<7;i++){const b=mk(new THREE.SphereGeometry(0.14+Math.random()*0.1,8,6),toon(0xffffff),R(-1.0,1.0),0.84,R(-0.6,0.6));b.scale.y=0.6;g.add(b);}
    g.add(mk(new THREE.CylinderGeometry(0.06,0.06,0.5,8),toon(0xd8d0e8),1.36,1.3,-0.7));}
  else if(id==='rug'){const r=mk(new THREE.CylinderGeometry(1.4,1.4,0.03,32),toon(0xd8b8f0),0,0.015,0);g.add(r);const r2=mk(new THREE.CylinderGeometry(1.0,1.0,0.035,32),toon(0xffc4dc),0,0.018,0);g.add(r2);}
  else if(id==='shelf'){g.add(mk(new THREE.BoxGeometry(1.6,2,0.5),wd,0,1,0));const bc=[0xff9ec7,0x8fdcb4,0xb9a6f2,0xffd36e,0x8fd0ff];
    for(let r=0;r<2;r++)for(let i=0;i<5;i++)g.add(mk(new THREE.BoxGeometry(0.2,0.5,0.35),toon(bc[(i+r*2)%5]),-0.55+i*0.27,0.6+r*0.75,0.08));}
  return g;
}
function placeFurn(id,x,z,ry,fx=true,indoor=false){
  const g=buildFurn(id);g.position.set(x,indoor?0:H(x,z),z);g.rotation.y=ry;shadowAll(g);scene.add(g);
  const o={x,z,r:ITEMS[id].r*fsOf(id)};(indoor?indoorObs:obstacles).push(o);const p={id,x,z,ry,g,o,pop:fx?0:1,indoor};placed.push(p);
  if(!indoor&&(id==='lantern'||id==='campfire')){const L=lightPool.find(l=>!l.used);if(L){L.used=p;p.light=L.L;L.L.position.set(x,H(x,z)+(id==='lantern'?2.4:1.2),z);}}
  if(fx){g.scale.setScalar(0.01);}
  return p;
}
function removeFurn(p){scene.remove(p.g);const i=placed.indexOf(p);if(i>=0)placed.splice(i,1);const list=p.indoor?indoorObs:obstacles;const oi=list.indexOf(p.o);if(oi>=0)list.splice(oi,1);
  if(p.light){const L=lightPool.find(l=>l.used===p);if(L){L.used=null;L.L.intensity=0;L.L.position.y=-50;}}}
function defaultInterior(){
  placeFurn('bed',INT.x-INT.w+1.9,INT.z+INT.d-1.6,Math.PI/2,false,true);
  placeFurn('table',INT.x+2.6,INT.z+2.4,0,false,true);
  placeFurn('chair',INT.x+0.7,INT.z+2.4,Math.PI/2,false,true);placeFurn('chair',INT.x+4.5,INT.z+2.4,-Math.PI/2,false,true);
  placeFurn('shelf',INT.x-2.6,INT.z-INT.d+0.6,0,false,true);placeFurn('rug',INT.x+0.3,INT.z+0.2,0,false,true);
  placeFurn('bathtub',INT.x+INT.w-1.4,INT.z+0.6,Math.PI/2,false,true);
}

// ---------- 村莊廣場、農田 ----------
const plazaTex=canvasTex(256,256,(g)=>{g.fillStyle='#e8cfa4';g.fillRect(0,0,256,256);const cs=['#f2dcb4','#e0c494','#ead2a8','#d8b88a'];
  for(let y=0;y<256;y+=32)for(let x=(y/32)%2?-16:0;x<256;x+=32){g.fillStyle=cs[((x*7+y*3)>>4)%4];g.beginPath();g.roundRect?g.roundRect(x+2,y+2,28,28,6):g.rect(x+2,y+2,28,28);g.fill();}},[6,6]);
for(const[V,r]of[[V2,13],[V3,11]]){const m=mk(new THREE.CircleGeometry(r,48),toon(0xffffff,{map:plazaTex}),V.x,0.025,V.z);m.rotation.x=-Math.PI/2;m.receiveShadow=true;scene.add(m);
  const rim=mk(new THREE.RingGeometry(r,r+0.5,48),toon(0xc8a878),V.x,0.03,V.z);rim.rotation.x=-Math.PI/2;scene.add(rim);}
const FIELDS=[];
function decoField(cx,cz,cols,rows,types){const spots=[];const fm=new THREE.Group();
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const x=cx+(i-(cols-1)/2)*TILE,z=cz+(j-(rows-1)/2)*TILE;const t=mk(soilG,soilM[(i+j)%3?'wet':'dry'],x,H(x,z)+0.04,z);t.receiveShadow=true;fm.add(t);
    const type=types[(i+j*cols)%types.length],st=2+((i*3+j)%2);const c=cropMesh(type,st);c.position.set(x,H(x,z)+0.1,z);c.rotation.y=(i*1.7+j)%6;fm.add(c);if(j===0||j===rows-1)spots.push({x,z:z+(j===0?-1.1:1.1)});}
  const post=new THREE.CylinderGeometry(0.07,0.08,0.8,6),rail=toon(0xe8d0b0);const W=cols*TILE/2+0.6,D=rows*TILE/2+0.6;
  for(const[x0,z0,x1,z1]of[[-W,-D,W,-D],[-W,D,W,D],[-W,-D,-W,D],[W,-D,W,D]]){const L=Math.hypot(x1-x0,z1-z0),n=Math.ceil(L/1.4);
    for(let k=0;k<=n;k++){const x=cx+lerp(x0,x1,k/n),z=cz+lerp(z0,z1,k/n);fm.add(mk(post,rail,x,H(x,z)+0.4,z));}
    const rl=mk(new THREE.BoxGeometry(L,0.07,0.06),rail,cx+(x0+x1)/2,H(cx,cz)+0.55,cz+(z0+z1)/2);rl.rotation.y=-Math.atan2(z1-z0,x1-x0);fm.add(rl);}
  shadowAll(fm);scene.add(fm);FIELDS.push({cx,cz,spots});return spots;}
decoField(V2.x-31,V2.z-2,6,5,['carrot','tomato','pumpkin']);
decoField(V3.x+12,V3.z+22,6,4,['strawberry','carrot','pumpkin']);
decoField(V3.x-14,V3.z-24,5,4,['tomato','strawberry']);
