// ===================== world.js：場景、樹、村莊、室內、蝴蝶、農田、家具 =====================
const obstacles=[];
function farFrom(x,z,r,list=obstacles){for(const o of list){if(o.r>0&&Math.hypot(o.x-x,o.z-z)<o.r+r)return false;}return true;}
const FS={bathtub:1};const fsOf=id=>FS[id]??1.5;
function textTex(lines,bg='#fff1e0',fg='#7a4a34',w=256,h=128,font=40){return canvasTex(w,h,(c)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=fg;c.font=`900 ${font}px "Zen Maru Gothic",sans-serif`;c.textAlign='center';c.textBaseline='middle';
  lines.forEach((l,i)=>c.fillText(l,w/2,h/(lines.length+1)*(i+1)));});}
// ---------- 房屋 ----------
const windowMats=[];
// ---------- 中世紀房屋（半木造、紅瓦屋頂、尖塔） ----------
function scaleUV(g,su,sv){const uv=g.attributes.uv;if(!uv)return g;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*su,uv.getY(i)*sv);uv.needsUpdate=true;return g;}
const MTEX={};
MTEX.timberA=canvasTex(256,256,(g)=>{g.fillStyle='#f7f0e2';g.fillRect(0,0,256,256);g.fillStyle='#ece2cf';for(let i=0;i<40;i++){g.fillRect(Math.random()*256,Math.random()*256,10+Math.random()*20,3);}
  g.fillStyle='#7a4a2e';g.fillRect(0,0,256,14);g.fillRect(0,242,256,14);for(const x of[0,124,242])g.fillRect(x,0,14,256);g.fillRect(0,120,256,10);
  g.strokeStyle='#7a4a2e';g.lineWidth=11;g.beginPath();g.moveTo(14,120);g.lineTo(70,14);g.moveTo(242,120);g.lineTo(186,14);g.stroke();});
MTEX.timberB=canvasTex(256,256,(g)=>{g.fillStyle='#f7f0e2';g.fillRect(0,0,256,256);g.fillStyle='#7a4a2e';g.fillRect(0,0,256,14);g.fillRect(0,242,256,14);for(const x of[0,124,242])g.fillRect(x,0,14,256);
  g.strokeStyle='#7a4a2e';g.lineWidth=10;g.beginPath();for(const x0 of[14,138]){g.moveTo(x0,14);g.lineTo(x0+104,242);g.moveTo(x0+104,14);g.lineTo(x0,242);}g.stroke();});
MTEX.tile=canvasTex(128,128,(g)=>{g.fillStyle='#d9614a';g.fillRect(0,0,128,128);for(let c=0;c<4;c++){g.fillStyle=c%2?'#cf5641':'#e06c52';g.fillRect(c*32,0,30,128);g.fillStyle='#b8452f';g.fillRect(c*32+29,0,3,128);
  for(let r=0;r<4;r++){g.fillStyle='rgba(255,220,200,.18)';g.fillRect(c*32+2,r*32+((c%2)*16)+4,8,22);g.fillStyle='#b8452f';g.fillRect(c*32,r*32+((c%2)*16),32,2);}}});
MTEX.slate=canvasTex(128,128,(g)=>{g.fillStyle='#5a78b0';g.fillRect(0,0,128,128);for(let c=0;c<4;c++){g.fillStyle=c%2?'#5270a8':'#6584bc';g.fillRect(c*32,0,30,128);g.fillStyle='#3e5a90';g.fillRect(c*32+29,0,3,128);
  for(let r=0;r<4;r++){g.fillStyle='#3e5a90';g.fillRect(c*32,r*32+((c%2)*16),32,2);}}});
MTEX.stone=canvasTex(128,128,(g)=>{g.fillStyle='#b8ab9a';g.fillRect(0,0,128,128);const cs=['#c9bca8','#bfb19c','#d2c6b2','#ad9f8c'];for(let r=0;r<4;r++)for(let c=-1;c<4;c++){g.fillStyle=cs[(r*3+c+4)%4];g.fillRect(c*36+(r%2)*18+2,r*32+2,32,28);}});
const HM={timberA:toon(0xffffff,{map:MTEX.timberA}),timberB:toon(0xffffff,{map:MTEX.timberB}),tile:toon(0xffffff,{map:MTEX.tile}),slate:toon(0xffffff,{map:MTEX.slate}),stone:toon(0xffffff,{map:MTEX.stone}),
  plaster:toon(0xf7f0e2),wood:toon(0x7a4a2e),door:toon(0x9a6440),shutter:toon(0x5aa07a),shutterB:toon(0x5a84b0),vine:toon(0x6cb656),vine2:toon(0x88c868),flower:toon(0xff8fb0),flower2:toon(0xffd36e),glass:basic(0xa8c8d8),gold:toon(0xffd36e)};
windowMats.push(HM.glass);
// 收集器：同材質合併成一個 mesh
function MB(){const parts={};return{add(k,geo,m){(parts[k]=parts[k]||[]).push([geo,m]);},build(){const g=new THREE.Group();for(const k in parts){const me=new THREE.Mesh(mergeGeos(parts[k]),HM[k]);me.castShadow=['timberA','timberB','tile','slate','stone','door'].includes(k);me.receiveShadow=true;g.add(me);}return g;}};}
const M4s=(x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>M4(x,y,z,rx,ry,rz,sx,sy,sz);
function gableRoof(b,mat,cx,cz,y0,span,len,rh,ov=0.55,axis='z',gableMat='timberB'){// span=寬度(垂直於屋脊)，len=屋脊長
  const a=span/2,th=Math.atan2(rh,a),L=Math.hypot(a+ov,rh+ov*Math.tan(th));
  for(const s of[-1,1]){const geo=scaleUV(new THREE.BoxGeometry(L,0.24,len+ov*2),L/2,(len+ov*2)/2);const mx=s*(a+ov)/2+0,my=y0+(rh-ov*Math.tan(th))/2;
    if(axis==='z')b.add(mat,geo,M4(cx+mx,my,cz,0,0,-s*th));else b.add(mat,geo,M4(cx,my,cz+mx,0,-Math.PI/2,-s*th));}
  const sh=new THREE.Shape();sh.moveTo(-a,0);sh.lineTo(a,0);sh.lineTo(0,rh);sh.closePath();
  for(const s of[-1,1]){const geo=new THREE.ExtrudeGeometry(sh,{depth:0.2,bevelEnabled:false});scaleUV(geo,1/(2*a),1/rh);geo.translate(0,0,-0.1);
    if(axis==='z')b.add(gableMat,geo,M4(cx,y0,cz+s*(len/2-0.1)));else b.add(gableMat,geo,M4(cx+s*(len/2-0.1),y0,cz,0,Math.PI/2,0));}
  b.add('wood',new THREE.BoxGeometry(axis==='z'?0.3:len+ov*2,0.3,axis==='z'?len+ov*2:0.3),M4(cx,y0+rh+0.05,cz));}
function windowAt(b,x,y,z,ry,o={}){const w=o.w||1.0,h=o.h||1.3;const T=(lx,ly,lz)=>{const c=Math.cos(ry),s=Math.sin(ry);return[x+lx*c+lz*s,y+ly,z-lx*s+lz*c];};
  const put=(k,geo,lx,ly,lz)=>{const[px,py,pz]=T(lx,ly,lz);b.add(k,geo,M4(px,py,pz,0,ry,0));};
  put('wood',new THREE.BoxGeometry(w+0.24,h+0.24,0.14),0,0,0.04);put('glass',new THREE.PlaneGeometry(w,h),0,0,0.12);put('wood',new THREE.BoxGeometry(0.08,h,0.06),0,0,0.14);put('wood',new THREE.BoxGeometry(w,0.08,0.06),0,0.1,0.14);
  if(o.arch){const ag=new THREE.CircleGeometry(w/2+0.12,14,0,Math.PI);put('wood',ag,0,h/2+0.1,0.1);const gg=new THREE.CircleGeometry(w/2,14,0,Math.PI);put('glass',gg,0,h/2+0.1,0.12);}
  if(o.shutter){for(const s of[-1,1])put(o.shutter,new THREE.BoxGeometry(w/2,h+0.1,0.08),s*(w*0.75+0.18),0,0.08);}
  if(o.box){put('wood',new THREE.BoxGeometry(w+0.4,0.28,0.4),0,-h/2-0.2,0.25);for(let i=0;i<5;i++)put(i%2?'flower':'flower2',new THREE.SphereGeometry(0.14,8,6),(i-2)*0.25,-h/2-0.02,0.3);
    for(let i=0;i<4;i++)put('vine',new THREE.SphereGeometry(0.17,8,6),(i-1.5)*0.3,-h/2-0.1,0.38);}}
// 一般村民的屋子：正面朝本地 +x，寬(沿 z)=W，深(沿 x)=D
function medievalHouse(x,z,ry,o={}){const W=o.W||7.4,D=o.D||6.2,h1=3.1,h2=o.floors===1?0:2.9,roofK=o.roof==='slate'?'slate':'tile',shut=o.roof==='slate'?'shutterB':'shutter';
  const b=MB();const s0=(o.seed||1)*7.13;const rr=k=>((Math.sin(s0*(k+1)*12.9898)*43758.5453)%1+1)%1;
  b.add('stone',scaleUV(new THREE.BoxGeometry(D+0.25,0.7,W+0.25),D/2,0.35),M4(0,0.35,0));
  b.add('timberA',new THREE.BoxGeometry(D,h1,W),M4(0,0.7+h1/2,0));
  let top=0.7+h1;
  if(h2){b.add('wood',new THREE.BoxGeometry(D+0.75,0.26,W+0.75),M4(0,top+0.13,0));top+=0.26;b.add('timberB',new THREE.BoxGeometry(D+0.6,h2,W+0.6),M4(0,top+h2/2,0));top+=h2;}
  const span=D+(h2?0.6:0),len=W+(h2?0.6:0),rh=span*0.62;gableRoof(b,roofK,0,0,top,span,len,rh);const a2=span/2;
  // 門
  b.add('door',new THREE.BoxGeometry(0.16,2.1,1.3),M4(D/2+0.02,0.7+1.05,0));{const ag=new THREE.CylinderGeometry(0.65,0.65,0.16,16,1,false,0,Math.PI);b.add('door',ag,M4(D/2+0.02,0.7+2.1,0,0,0,Math.PI/2));}
  b.add('gold',new THREE.SphereGeometry(0.08,8,6),M4(D/2+0.14,1.75,0.4));b.add('stone',new THREE.BoxGeometry(1.0,0.2,1.8),M4(D/2+0.5,0.1,0));
  // 窗戶
  for(const zz of[-W/3.2,W/3.2])windowAt(b,D/2,0.7+1.6,zz,Math.PI/2,{shutter:shut,box:rr(1)>0.4});
  for(const zz of[-W/3,0,W/3])if(h2)windowAt(b,D/2+0.3,0.7+h1+0.26+1.45,zz,Math.PI/2,{shutter:zz?shut:null,arch:!zz,box:rr(2)>0.5&&!zz});
  for(const s of[-1,1]){windowAt(b,0,0.7+1.6,s*W/2,s>0?0:Math.PI,{shutter:shut});if(h2)windowAt(b,0,0.7+h1+0.26+1.45,s*(W/2+0.3),s>0?0:Math.PI,{});}
  windowAt(b,-D/2,0.7+1.6,0,-Math.PI/2,{});
  // 煙囪
  b.add('stone',scaleUV(new THREE.BoxGeometry(0.8,rh+1.4,0.8),1,2),M4(-span/4,top+(rh+1.4)/2,len/4));b.add('wood',new THREE.BoxGeometry(1.0,0.2,1.0),M4(-span/4,top+rh+1.45,len/4));
  // 老虎窗
  if(o.dormer!==false){const dx=a2/2,dy=top+rh*(1-(dx+0.9)/a2)+0.65;b.add('timberB',new THREE.BoxGeometry(1.8,1.3,1.4),M4(dx,dy,0));windowAt(b,dx+0.9,dy,0,Math.PI/2,{w:0.7,h:0.8});
    const cn=new THREE.ConeGeometry(1.05,0.9,4);b.add(roofK,cn,M4(dx,dy+1.1,0,0,Math.PI/4,0,1.25,1,1.05));}
  // 尖塔
  if(o.turret){const tx=D/2+0.1,tz=(o.turret>0?1:-1)*(W/2+0.1),ty0=0.7+h1*0.55,th=top+rh*0.6-ty0;
    b.add('timberA',scaleUV(new THREE.CylinderGeometry(1.05,1.05,th,14),3,1.5),M4(tx,ty0+th/2,tz));b.add('wood',new THREE.CylinderGeometry(1.15,0.7,0.6,14),M4(tx,ty0-0.3,tz));
    b.add('wood',new THREE.CylinderGeometry(1.25,1.25,0.22,14),M4(tx,ty0+th,tz));b.add(roofK,scaleUV(new THREE.ConeGeometry(1.45,3.4,10),3,2),M4(tx,ty0+th+1.75,tz));
    b.add('gold',new THREE.SphereGeometry(0.16,8,6),M4(tx,ty0+th+3.55,tz));b.add('wood',new THREE.CylinderGeometry(0.03,0.03,0.6,4),M4(tx,ty0+th+3.8,tz));
    windowAt(b,tx+Math.cos(0.6)*1.02,ty0+th*0.6,tz+(o.turret>0?Math.sin(0.6):-Math.sin(0.6))*1.02,Math.PI/2-(o.turret>0?0.6:-0.6),{w:0.55,h:0.8,arch:true});}
  // 藤蔓
  if(o.vines!==false){const n=6+((rr(3)*6)|0);for(let i=0;i<n;i++){const zz=(rr(i+10)-0.5)*W*0.9,yy=0.7+h1+(rr(i+20)-0.6)*1.6;b.add(i%3?'vine':'vine2',new THREE.SphereGeometry(0.22+rr(i+30)*0.18,8,6),M4(D/2+0.18+(yy>0.7+h1?0.3:0),yy,zz,0,0,0,0.7,1,1.2));}}
  const g=b.build();g.position.set(x,H(x,z),z);g.rotation.y=ry;g.scale.setScalar(o.s||1);scene.add(g);
  const sc=o.s||1;obstacles.push({x,z,r:Math.hypot(D/2+0.3,W/2+0.3)*sc,box:{ry,hw:(D/2+0.45)*sc,hd:(W/2+0.45+(o.turret?0.6:0))*sc}});
  return{x,z,ry,g,door:{x:x+Math.cos(ry)*(D/2+1.2)*sc,z:z-Math.sin(ry)*(D/2+1.2)*sc}};}
function toLocal(o,x,z){const c=Math.cos(o.box.ry),s=Math.sin(o.box.ry),dx=x-o.x,dz=z-o.z;return[dx*c-dz*s,dx*s+dz*c];}
function toWorld(o,lx,lz){const c=Math.cos(o.box.ry),s=Math.sin(o.box.ry);return[o.x+lx*c+lz*s,o.z-lx*s+lz*c];}
function segHitsBox(ax,az,bx,bz,o,pad){const[a1,a2]=toLocal(o,ax,az),[b1,b2]=toLocal(o,bx,bz);const hw=o.box.hw+pad,hd=o.box.hd+pad;let t0=0,t1=1;const d1=b1-a1,d2=b2-a2;
  for(const[p,d,h]of[[a1,d1,hw],[a2,d2,hd]]){if(Math.abs(d)<1e-6){if(p<-h||p>h)return false;continue;}let u=(-h-p)/d,v=(h-p)/d;if(u>v)[u,v]=[v,u];t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1)return false;}return true;}
// 盒子碰撞（推出）
function pushBox(o,b,r){const c=Math.cos(b.box.ry),s=Math.sin(b.box.ry),dx=o.x-b.x,dz=o.z-b.z;let lx=dx*c-dz*s,lz=dx*s+dz*c;const hw=b.box.hw,hd=b.box.hd;
  const cx=clamp(lx,-hw,hw),cz=clamp(lz,-hd,hd);let ex=lx-cx,ez=lz-cz,d=Math.hypot(ex,ez);if(d>=r)return false;
  if(d>1e-4){lx=cx+ex/d*r;lz=cz+ez/d*r;}else{const px=hw-Math.abs(lx),pz=hd-Math.abs(lz);if(px<pz)lx=Math.sign(lx||1)*(hw+r);else lz=Math.sign(lz||1)*(hd+r);}
  o.x=b.x+lx*c+lz*s;o.z=b.z-lx*s+lz*c;return true;}
function collideObs(o,r,list=obstacles,y){for(const b of list){if(b.r<=0||b.navOnly)continue;if(y!==undefined&&b.y!==undefined&&Math.abs(b.y-y)>0.9)continue;const dx=o.x-b.x,dz=o.z-b.z;if(Math.abs(dx)>b.r+r+0.5||Math.abs(dz)>b.r+r+0.5)continue;
  if(b.box){pushBox(o,b,r);continue;}const d=Math.hypot(dx,dz),R=b.r+r;if(d<R&&d>1e-3){o.x=b.x+dx/d*R;o.z=b.z+dz/d*R;}}}
// ---------- 自己的家（無接縫：直接走進去） ----------
const WALLS=[];const inHouse=(x,z,m=0)=>Math.abs(x-HOME.x)<HOME.w-m&&Math.abs(z-HOME.z)<HOME.d-m;
const DOOR_OUT={x:HOME.x+HOME.w+1.4,z:HOME.z},DOOR_IN={x:HOME.x+HOME.w-1.4,z:HOME.z};
function pushWalls(o,r){for(const w of WALLS){const cx=clamp(o.x,w.x0,w.x1),cz=clamp(o.z,w.z0,w.z1),dx=o.x-cx,dz=o.z-cz,d=Math.hypot(dx,dz);
  if(d<r){if(d>1e-4){o.x=cx+dx/d*r;o.z=cz+dz/d*r;}else{const l=o.x-w.x0,rr=w.x1-o.x,b=o.z-w.z0,t=w.z1-o.z,m=Math.min(l,rr,b,t);if(m===l)o.x=w.x0-r;else if(m===rr)o.x=w.x1+r;else if(m===b)o.z=w.z0-r;else o.z=w.z1+r;}}}}
function hitsWall(x0,x1,z0,z1){return WALLS.some(w=>x1>w.x0&&x0<w.x1&&z1>w.z0&&z0<w.z1);}
const HOMEV={walls:[],roof:null,door:null,doorA:0,light:null};
const indoorWin=[],indoorObs=[];
{const g=new THREE.Group(),{x:HX,z:HZ,w:W,d:D,h:WH}=HOME,T=0.3;
 const top=toon(0xd8c8b8);
 const wp=canvasTex(128,128,(c)=>{c.fillStyle='#fff6ee';c.fillRect(0,0,128,128);c.fillStyle='#ffe2d6';for(let y=0;y<128;y+=32)for(let x=0;x<128;x+=32){c.beginPath();c.arc(x+(y%64?16:0),y+16,5,0,7);c.fill();}},[1,1]);
 const inn=toon(0xffffff,{map:wp}),wain=toon(0xf2c4b4);const out=HM.timberA;
 const fl=mk(new THREE.BoxGeometry(W*2+0.4,0.24,D*2+0.4),toon(0xf0c8a4,{map:TEX.wood}),HX,-0.1,HZ);fl.material.map=TEX.wood.clone();fl.material.map.repeat.set(5,4);fl.material.map.needsUpdate=true;fl.receiveShadow=true;g.add(fl);
 g.add(mk(scaleUV(new THREE.BoxGeometry(W*2+0.7,0.5,D*2+0.7),6,0.3),HM.stone,HX,0.0,HZ)).position.y=-0.02;
 function wall(cx,cz,len,alongX,innerSign){const sx=alongX?len:T,sz=alongX?T:len;
   const geo=scaleUV(new THREE.BoxGeometry(sx,WH,sz),Math.max(1,Math.round(len/4.5)),1);
   const mats=[out,out,top,top,out,out];const idx=alongX?(innerSign>0?4:5):(innerSign>0?0:1);mats[idx]=inn;
   const full=mk(geo,mats,cx,WH/2+0.02,cz);const sh=0.7;const stub=mk(new THREE.BoxGeometry(sx,sh,sz),mats.map(m=>m===inn?wain:m===out?HM.stone:m),cx,sh/2,cz);
   g.add(full);stub.visible=false;g.add(stub);
   const wb=mk(new THREE.BoxGeometry(alongX?len-0.02:0.02,0.9,alongX?0.02:len-0.02),wain,cx+(alongX?0:innerSign*(T/2+0.012)),0.45,cz+(alongX?innerSign*(T/2+0.012):0));g.add(wb);
   HOMEV.walls.push({full,stub,wb,alongX,pos:alongX?cz:cx,innerSign,deco:[]});
   WALLS.push({x0:cx-sx/2,x1:cx+sx/2,z0:cz-sz/2,z1:cz+sz/2,y1:WH});}
 wall(HX,HZ-D,W*2+T,true,1);wall(HX,HZ+D,W*2+T,true,-1);wall(HX-W,HZ,D*2,false,1);
 const dw=1.15,seg=(D-dw);wall(HX+W,HZ-dw-seg/2,seg,false,-1);wall(HX+W,HZ+dw+seg/2,seg,false,-1);
 {const lh=WH-3.0;const m=mk(new THREE.BoxGeometry(T,lh,dw*2),[out,inn,top,top,out,out],HX+W,3.0+lh/2,HZ);g.add(m);HOMEV.walls.push({full:m,stub:null,alongX:false,pos:HX+W,innerSign:-1,deco:[]});}
 const wallOf=(x,z)=>HOMEV.walls.filter(w=>w.alongX?Math.abs(z-w.pos)<0.5&&w.stub:Math.abs(x-w.pos)<0.5&&w.stub);
 // 門（會自動打開）
 {const hinge=new THREE.Group();hinge.position.set(HX+W,0,HZ-dw);const leaf=mk(new THREE.BoxGeometry(0.12,2.95,dw*2-0.06),HM.door,0,1.5,dw-0.03);hinge.add(leaf);
  hinge.add(mk(new THREE.SphereGeometry(0.1,8,6),HM.gold,0.12,1.45,dw*2-0.35));const wn=mk(new THREE.CircleGeometry(0.3,18),basic(0x9fd6ff),0.07,2.3,dw);wn.rotation.y=Math.PI/2;hinge.add(wn);g.add(hinge);HOMEV.door=hinge;
  const arch=mk(new THREE.BoxGeometry(0.5,0.3,dw*2+0.6),HM.wood,HX+W,3.05,HZ);g.add(arch);for(const s of[-1,1])g.add(mk(new THREE.BoxGeometry(0.45,3.0,0.3),HM.wood,HX+W,1.5,HZ+s*(dw+0.15)));
  const lamp=mk(new THREE.SphereGeometry(0.22,10,8),basic(0xfff0c8),HX+W+0.5,3.5,HZ+dw+0.9);g.add(lamp);}
 g.add(mk(new THREE.BoxGeometry(1.4,0.18,2.6),HM.stone,HX+W+0.8,0.05,HZ));
 const mat=mk(new THREE.PlaneGeometry(1.4,2.0),toon(0xb9a6f2),HX+W-1.0,0.03,HZ);mat.rotation.x=-Math.PI/2;g.add(mat);
 // 窗戶（內外兩面），跟著牆一起隱藏
 const winAt=(x,z,ry)=>{const list=wallOf(x,z);for(const side of[1,-1]){const o=new THREE.Group();o.position.set(x,2.3,z);o.rotation.y=ry+(side<0?Math.PI:0);
   const gm=side>0?HM.glass:basic(0x9fd6ff);if(side<0)indoorWin.push(gm);
   o.add(mk(new THREE.BoxGeometry(1.5,1.4,0.08),side>0?HM.wood:toon(0xffffff),0,0,T/2+0.03));o.add(mk(new THREE.PlaneGeometry(1.25,1.15),gm,0,0,T/2+0.08));o.add(mk(new THREE.BoxGeometry(1.25,0.07,0.04),side>0?HM.wood:toon(0xffffff),0,0.1,T/2+0.1));
   if(side>0){for(const s of[-1,1])o.add(mk(new THREE.BoxGeometry(0.62,1.4,0.08),HM.shutter,s*1.06,0,T/2+0.06));o.add(mk(new THREE.BoxGeometry(1.7,0.28,0.4),HM.wood,0,-0.85,T/2+0.22));for(let i=0;i<5;i++)o.add(mk(new THREE.SphereGeometry(0.15,8,6),i%2?HM.flower:HM.vine,(i-2)*0.3,-0.65,T/2+0.3));}
   g.add(o);for(const w of list)w.deco.push(o);}};
 winAt(HX-3.5,HZ+D,0);winAt(HX+3,HZ+D,0);winAt(HX-3.5,HZ-D,Math.PI);winAt(HX+3,HZ-D,Math.PI);winAt(HX-W,HZ-2.5,-Math.PI/2);winAt(HX-W,HZ+2.5,-Math.PI/2);winAt(HX+W,HZ-3.6,Math.PI/2);winAt(HX+W,HZ+3.6,Math.PI/2);
 // 屋頂群組（二樓外觀、紅瓦、尖塔、煙囪）— 進屋時隱藏
 const roof=new THREE.Group();{const b=MB();const W2=W*2+0.8,D2=D*2+0.8,h2=3.0,y1=WH+0.02;
  b.add('wood',new THREE.BoxGeometry(W*2+1.0,0.3,D*2+1.0),M4(0,y1+0.15,0));b.add('timberB',scaleUV(new THREE.BoxGeometry(W2,h2,D2),3,1),M4(0,y1+0.3+h2/2,0));
  const y2=y1+0.3+h2;gableRoof(b,'tile',0,0,y2,D2,W2,D2*0.55,0.6,'x');
  for(const xx of[-4.5,0,4.5])for(const s of[-1,1])windowAt(b,xx,y1+1.8,s*D2/2,s>0?0:Math.PI,{shutter:'shutter',box:xx===0,arch:xx===0});
  for(const zz of[-3,3])windowAt(b,W2/2,y1+1.8,zz,Math.PI/2,{shutter:'shutter'});
  // 尖塔（前右角）
  {const tx=W2/2-0.3,tz=D2/2-0.3,ty0=1.2,th=y2+D2*0.3-ty0;b.add('timberA',scaleUV(new THREE.CylinderGeometry(1.5,1.5,th,16),4,2),M4(tx,ty0+th/2,tz));b.add('stone',new THREE.CylinderGeometry(1.6,1.7,1.2,16),M4(tx,0.6,tz));
   b.add('wood',new THREE.CylinderGeometry(1.75,1.75,0.3,16),M4(tx,ty0+th,tz));b.add('tile',scaleUV(new THREE.ConeGeometry(2.0,4.6,12),4,2),M4(tx,ty0+th+2.4,tz));b.add('gold',new THREE.SphereGeometry(0.22,8,6),M4(tx,ty0+th+4.8,tz));
   windowAt(b,tx+1.5*Math.cos(0.78),ty0+th*0.75,tz+1.5*Math.sin(0.78),0.78,{w:0.6,h:0.9,arch:true});}
  // 老虎窗＋煙囪
  for(const xx of[-3.5,1.5]){const a2=D2/2,dz=a2/2,dy=y2+D2*0.55*(1-(dz+0.9)/a2)+0.65;b.add('timberB',new THREE.BoxGeometry(1.4,1.3,1.8),M4(xx,dy,dz));windowAt(b,xx,dy,dz+0.9,0,{w:0.7,h:0.8});b.add('tile',new THREE.ConeGeometry(1.05,0.9,4),M4(xx,dy+1.1,dz,0,Math.PI/4,0,1.05,1,1.25));}
  b.add('stone',scaleUV(new THREE.BoxGeometry(1.0,4.5,1.0),1,3),M4(-3,y2+3.5,-2.2));b.add('wood',new THREE.BoxGeometry(1.25,0.25,1.25),M4(-3,y2+5.8,-2.2));
  for(let i=0;i<12;i++)b.add(i%3?'vine':'vine2',new THREE.SphereGeometry(0.25+(i%4)*0.06,8,6),M4(W2/2+0.15,y1+0.4+(i%5)*0.35,-D2/2+1+i*0.9,0,0,0,0.6,1,1.2));
  const rg=b.build();roof.add(rg);}
 roof.position.set(HX,0,HZ);g.add(roof);HOMEV.roof=roof;bakeWallDeco(HOMEV.walls);obstacles.push({x:HX+W+0.7,z:HZ+D+0.7,r:1.1});
 g.traverse(o=>{if(o.isMesh&&o.material!==HM.glass){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);
 const L=new THREE.PointLight(0xffe0c0,0,16,1.6);L.position.set(HX,3.4,HZ);scene.add(L);HOMEV.light=L;}
// 牆上裝飾（窗戶等）依牆面合併成一組，減少繪製次數
function bakeWallDeco(walls){const byKey=new Map();for(const w of walls){if(!w.deco||!w.deco.length)continue;const k=(w.alongX?'x':'z')+w.pos.toFixed(2);let c=byKey.get(k);
    if(!c){const parent=w.deco[0].parent;c=new THREE.Group();parent.add(c);byKey.set(k,c);}for(const d of w.deco)if(d.parent!==c)c.attach(d);w.deco=[c];}
  for(const c of byKey.values())batchStatic(c);}
// 牆的剖面顯示：在屋內時，擋住鏡頭的那面牆會降低
function homeFrame(cam,dt){const inside=inHouse(ply.x,ply.z,-0.2);HOMEV.roof.visible=!inside;
  for(const w of HOMEV.walls){const c=w.alongX?cam.z:cam.x;const outerSide=(c-w.pos)*w.innerSign<0;const cut=inside&&outerSide;
    w.full.visible=!cut;if(w.stub)w.stub.visible=cut;if(w.wb)w.wb.visible=!cut;for(const d of w.deco)d.visible=!cut;}
  const near=[ply,...npcsNearDoor()].some(o=>Math.hypot(o.x-(HOME.x+HOME.w),o.z-HOME.z)<2.6);HOMEV.doorA+=((near?-1.75:0)-HOMEV.doorA)*Math.min(1,dt*8);HOMEV.door.rotation.y=HOMEV.doorA;if(typeof castleFrame==='function')castleFrame(cam);}
function npcsNearDoor(){return typeof pets!=='undefined'?pets:[];}
const HOUSE={x:HOME.x,z:HOME.z},DOOR=DOOR_OUT,BOARD={x:5,z:-6};
// ---------- 樹（動森風：三團樹冠、層層松樹） ----------
const TG=(()=>{
  const sph=new THREE.SphereGeometry(1,18,14);
  const flares=(r,h)=>[0,1,2,3].map(i=>{const a=i*Math.PI/2+0.4;return[new THREE.ConeGeometry(0.2*r,0.75*r,6),M4(Math.cos(a)*0.36*r,0.2,Math.sin(a)*0.36*r,0,-a,-2.0)];});
  const trunk=mergeGeos([[new THREE.CylinderGeometry(0.24,0.46,3.1,12),M4(0,1.55,0)],[new THREE.CylinderGeometry(0.08,0.16,1.3,8),M4(0.35,2.6,0.1,0,0,-0.7)],[new THREE.CylinderGeometry(0.08,0.16,1.3,8),M4(-0.3,2.55,-0.2,0.3,0,0.7)],...flares(1)]);
  const clump=(cx,cy,cz,r,seed0)=>{const g=new THREE.SphereGeometry(1,14,10);const p=g.attributes.position;let sd=seed0;const rr=()=>{sd=(sd*9301+49297)%233280;return sd/233280;};
    const offs=[];for(let k=0;k<3;k++)offs.push([rr()*6.28,rr()*6.28,0.04+rr()*0.05]);
    for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k);let d=1;for(const[a,b,amp]of offs){d+=amp*Math.sin(x*1.7+a)*Math.cos(z*1.5+b)*Math.cos(y*1.3+a);}
      p.setXYZ(k,x*r*d,y*r*d*0.88,z*r*d);}g.computeVertexNormals();return[g,M4(cx,cy,cz)];};
  const canopy=mergeGeos([clump(0,3.55,0,1.25,3),clump(-0.95,2.85,0.35,0.95,7),clump(0.95,2.9,0.3,0.95,11),clump(0.1,2.75,-0.85,0.95,17),clump(-0.4,3.0,0.9,0.8,23),clump(0.55,3.9,0.45,0.7,29),clump(-0.6,3.85,-0.35,0.72,31)]);
  {// 法線往樹冠中心球面混合 → 整團像一顆柔軟的大球，卡通光影更圓滑
   const p=canopy.attributes.position,n=canopy.attributes.normal,col=[],v3=new THREE.Vector3(),w3=new THREE.Vector3();
   for(let k=0;k<p.count;k++){v3.set(p.getX(k),(p.getY(k)-3.2)*1.25,p.getZ(k)).normalize();w3.set(n.getX(k),n.getY(k),n.getZ(k)).lerp(v3,0.7).normalize();n.setXYZ(k,w3.x,w3.y,w3.z);
     const y=p.getY(k),ny=w3.y;const v=clamp(0.66+(y-2.2)*0.14+ny*0.1,0.6,1.0);col.push(v,v,Math.min(1,v*0.96+0.04));}
   canopy.setAttribute('color',new THREE.Float32BufferAttribute(col,3));}
  const ptrunk=mergeGeos([[new THREE.CylinderGeometry(0.16,0.32,2.4,10),M4(0,1.2,0)],...flares(0.75)]);
  const tiers=[];for(let i=0;i<5;i++){const r=1.6-i*0.27,h=1.25;const c=new THREE.ConeGeometry(r,h,20,1,true);const p=c.attributes.position;
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
  leaf:[0x6cbf5a,0x7ccb62,0x5eb258].map(c=>toon(c,{vertexColors:true})),cherry:[0xffbcd6,0xffcadf].map(c=>toon(c,{vertexColors:true})),
  pine:[0x3e8c64,0x4a986e].map(c=>toon(c,{side:THREE.DoubleSide,vertexColors:true})),pineW:[0x4a8fa0,0x5a86b0].map(c=>toon(c,{side:THREE.DoubleSide,vertexColors:true})),fruit:Object.fromEntries(Object.entries(FRUITS).map(([k,f])=>[k,toon(f.col)]))};
const trees=[];
// 樹幹＋樹冠合成一個 mesh（用頂點顏色畫樹幹），每棵樹只要一次繪製
const TREE_GEO={};
function treeGeo(trunkG,trunkHex,crownG,crownHex){const key=trunkG.uuid+crownHex;if(TREE_GEO[key])return TREE_GEO[key];const tc=new THREE.Color(trunkHex),cc=new THREE.Color(crownHex);
  const add=(g,f)=>{const n=g.attributes.position.count,col=new Float32Array(n*3),src=g.attributes.color;for(let i=0;i<n;i++){const v=f(i,src);col.set(v,i*3);}return col;};
  const tg=trunkG.index?trunkG.toNonIndexed():trunkG.clone(),cg=crownG.index?crownG.toNonIndexed():crownG.clone();
  const tcol=add(tg,()=>[tc.r/cc.r,tc.g/cc.g,tc.b/cc.b]),ccol=add(cg,(i,src)=>src?[src.getX(i),src.getY(i),src.getZ(i)]:[1,1,1]);
  const out=mergeGeos([[tg,new THREE.Matrix4()],[cg,new THREE.Matrix4()]]);const col=new Float32Array((tcol.length+ccol.length));col.set(tcol,0);col.set(ccol,tcol.length);out.setAttribute('color',new THREE.BufferAttribute(col,3));
  return TREE_GEO[key]=out;}
function tree(x,z,s,kind){const fruit=(kind==='broad'||kind==='cherry'||kind==='fruit')&&(kind==='fruit'||rnd()<0.4)?Object.keys(FRUITS)[(rnd()*4)|0]:null;if(kind==='fruit')kind='broad';
  const root=new THREE.Group();root.position.set(x,H(x,z)-0.08,z);
  const yawG=new THREE.Group();root.add(yawG);const pivot=new THREE.Group();yawG.add(pivot);
  const body=new THREE.Group();body.rotation.y=rnd()*6;body.scale.setScalar(s);pivot.add(body);
  if(kind==='pine'||kind==='pineW'){const m=TM[kind][(rnd()*2)|0];body.add(new THREE.Mesh(treeGeo(TG.ptrunk,0xa86a48,TG.pine,m.color.getHex()),m));}
  else{const m=kind==='cherry'?TM.cherry[(rnd()*2)|0]:TM.leaf[(rnd()*3)|0];body.add(new THREE.Mesh(treeGeo(TG.trunk,0xc8935e,TG.canopy,m.color.getHex()),m));if(fruit)body.add(new THREE.Mesh(TG.fruit,TM.fruit[fruit]));}
  const stump=mk(TG.stump,TM.trunk,0,0.2,0);stump.scale.setScalar(s);stump.visible=false;const st=mk(new THREE.CircleGeometry(0.34,12),TM.stumpTop,0,0.201,0);st.rotation.x=-Math.PI/2;stump.add(st);root.add(stump);
  shadowAll(root);scene.add(root);
  const o={x,z,r:0.5*s};obstacles.push(o);
  trees.push({x,z,s,kind,fruit,root,yawG,pivot,body,stump,o,max:4+Math.round(s*2),hp:4+Math.round(s*2),state:'alive',t:0,shake:0});
}
const rockG=new THREE.DodecahedronGeometry(0.8,0),rockM=toon(0xb4bdbf),rocks=[];
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
const LAMPG=new THREE.Group(),LAMPBM=basic(0xe8e2d8),LAMPM=toon(0x9a8478);scene.add(LAMPG);lamps.push({bm:LAMPBM,L:null});
function lampPost(x,z){const y=H(x,z);LAMPG.add(mk(new THREE.CylinderGeometry(0.08,0.1,2.8,6),LAMPM,x,y+1.4,z));LAMPG.add(mk(new THREE.SphereGeometry(0.26,10,8),LAMPBM,x,y+2.9,z));LAMPG.add(mk(new THREE.ConeGeometry(0.36,0.25,8),LAMPM,x,y+3.2,z));
  obstacles.push({x,z,r:0.25});}
lampPost(-7,4);lampPost(3,-1,false);
function sign(x,z,ry,lines){const g=new THREE.Group(),wood=toon(0xc89a70,{map:TEX.bark});
  for(const s of[-1,1])g.add(mk(new THREE.BoxGeometry(0.13,1.95,0.13),wood,s*0.72,0.97,-0.14));
  const t=textTex(lines),side=toon(0xf3c8a0);
  g.add(mk(new THREE.BoxGeometry(1.8,0.9,0.1),[side,side,side,side,toon(0xffffff,{map:t}),side],0,1.55,0));
  g.position.set(x,H(x,z),z);g.rotation.y=ry;shadowAll(g);scene.add(g);batchStatic(g);obstacles.push({x,z,r:0.5});}
sign(46,3,-Math.PI/2,['⚠ 東邊野外','果凍怪出沒']);sign(2.5,-17,0,['↑ 北邊草原','雜草很多']);sign(-14,12,Math.PI*0.75,['↙ 龍蝦村','大家的家']);
sign(-47,35,Math.PI*0.75,['歡迎來到','龍蝦村 🦞']);

// ---------- 龍蝦村 ----------
const V2HOUSES=[[-24,-14],[24,-15],[-26,8],[26,8],[-13,-26],[12,-27],[-19,23],[20,23]].map(([dx,dz],i)=>{
  const x=V2.x+dx,z=V2.z+dz,ry=Math.atan2(V2.x-x,V2.z-z)-Math.PI/2;return medievalHouse(x,z,ry,{seed:i+1,turret:i%3===0?1:i%3===1?-1:0,s:1.0});});
// 外圈更多房子（中世紀城鎮）
const V2EXTRA=[[-38,12],[-37,-14],[-22,-35],[22,-33],[36,-6],[37,18],[27,34],[4,40],[-20,37],[-38,31]].map(([dx,dz],i)=>{
  const x=V2.x+dx,z=V2.z+dz,ry=Math.atan2(V2.x-x,V2.z-z)-Math.PI/2;return medievalHouse(x,z,ry,{seed:i+20,turret:i%2?1:0,roof:i%4===3?'slate':'tile',W:7+(i%3)*0.8,D:6+(i%2)*0.6});});
// 中央噴水池
const FOUNTAINS=[];
function fountain(x,z,s=1){const b=MB();const y=H(x,z);
  const oct=(r,h,yy)=>{b.add('stone',scaleUV(new THREE.CylinderGeometry(r,r*1.04,h,8),r*2,0.5),M4(0,yy+h/2,0,0,Math.PI/8,0));};
  oct(4.2,0.8,0);oct(1.0,1.8,0.8);oct(2.0,0.35,2.4);oct(0.5,1.4,2.75);oct(1.1,0.3,4.0);b.add('gold',new THREE.SphereGeometry(0.35,10,8),M4(0,4.6,0));
  const g=b.build();const wm=toon(0x8fd8f8,{transparent:true,opacity:0.85});
  const w1=mk(new THREE.CircleGeometry(3.8,8),wm,0,0.72,0);w1.rotation.x=-Math.PI/2;w1.rotation.z=Math.PI/8;g.add(w1);const w2=mk(new THREE.CircleGeometry(1.8,8),wm,0,2.7,0);w2.rotation.x=-Math.PI/2;g.add(w2);
  const sp=new THREE.Group();const spm=basic(0xe8f8ff,{transparent:true,opacity:0.55,depthWrite:false});
  sp.add(mk(new THREE.CylinderGeometry(0.12,0.2,1.2,8,1,true),spm,0,5.2,0));const c1=mk(new THREE.CylinderGeometry(1.9,0.4,1.7,16,1,true),spm,0,3.4,0);sp.add(c1);const c2=mk(new THREE.CylinderGeometry(3.9,1.7,1.9,20,1,true),spm,0,1.6,0);sp.add(c2);g.add(sp);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+Math.PI/8;const pot=mk(new THREE.SphereGeometry(0.32,8,6),HM[i%2?'flower':'flower2'],Math.cos(a)*4.1,1.0,Math.sin(a)*4.1);g.add(pot);}
  sp.userData.dyn=true;g.position.set(x,y,z);g.scale.setScalar(s);scene.add(g);batchStatic(g);obstacles.push({x,z,r:4.4*s});FOUNTAINS.push({sp,t:Math.random()*5});}
fountain(V2.x,V2.z);
// 鎮公所（大鐘塔）
{const x=V2.x+0,z=V2.z-37,ry=Math.atan2(V2.x-x,V2.z-z)-Math.PI/2;const b=MB();
 b.add('stone',scaleUV(new THREE.BoxGeometry(9,1.0,14),5,0.5),M4(0,0.5,0));b.add('timberA',scaleUV(new THREE.BoxGeometry(8.6,3.6,13.6),2,1),M4(0,2.8,0));b.add('wood',new THREE.BoxGeometry(9.4,0.3,14.4),M4(0,4.75,0));
 b.add('timberB',scaleUV(new THREE.BoxGeometry(9.2,3.2,14.2),2,1),M4(0,6.5,0));gableRoof(b,'slate',0,0,8.1,9.2,14.2,6,0.6);
 for(const zz of[-4.5,-1.5,1.5,4.5]){windowAt(b,4.3,2.9,zz,Math.PI/2,{shutter:'shutterB',arch:true,box:true});windowAt(b,4.6,6.5,zz,Math.PI/2,{shutter:'shutterB'});}
 b.add('door',new THREE.BoxGeometry(0.2,2.6,2.2),M4(4.35,2.3,0));
 // 鐘塔
 b.add('stone',scaleUV(new THREE.BoxGeometry(4,14,4),2,6),M4(-1,7,0));b.add('wood',new THREE.BoxGeometry(4.6,0.4,4.6),M4(-1,14.2,0));b.add('timberB',new THREE.BoxGeometry(4.2,3,4.2),M4(-1,15.9,0));
 b.add('slate',scaleUV(new THREE.ConeGeometry(3.4,6,4),3,2),M4(-1,20.4,0,0,Math.PI/4,0));b.add('gold',new THREE.SphereGeometry(0.35,10,8),M4(-1,23.5,0));
 for(const s of[-1,1]){b.add('slate',scaleUV(new THREE.ConeGeometry(1.4,4,10),2,2),M4(3.8,10.5,s*6.6));b.add('timberA',new THREE.CylinderGeometry(1.1,1.1,5,12),M4(3.8,6.5,s*6.6));}
 const g=b.build();const cf=canvasTex(128,128,(c)=>{c.fillStyle='#fff8e8';c.beginPath();c.arc(64,64,60,0,7);c.fill();c.strokeStyle='#7a4a2e';c.lineWidth=6;c.stroke();c.lineWidth=7;c.beginPath();c.moveTo(64,64);c.lineTo(64,22);c.moveTo(64,64);c.lineTo(94,70);c.stroke();});
 const clk=mk(new THREE.CircleGeometry(1.3,24),toon(0xffffff,{map:cf}),1.12,15.9,0);clk.rotation.y=Math.PI/2;g.add(clk);
 g.position.set(x,H(x,z),z);g.rotation.y=ry;scene.add(g);obstacles.push({x,z,r:8.4,box:{ry,hw:4.9,hd:7.8}});}
// 風車
const WINDMILLS=[];
function windmill(x,z,ry,roofK='slate'){const b=MB();b.add('stone',scaleUV(new THREE.CylinderGeometry(2.2,3.0,11,14),5,4),M4(0,5.5,0));b.add('wood',new THREE.CylinderGeometry(3.3,3.3,0.4,14),M4(0,6,0));
  b.add('timberB',new THREE.CylinderGeometry(2.4,2.3,2.4,14),M4(0,12.2,0));b.add(roofK,scaleUV(new THREE.ConeGeometry(3.0,4.2,14),4,2),M4(0,15.5,0));b.add('door',new THREE.BoxGeometry(0.3,2.2,1.4),M4(2.9,1.3,0,0,0,0.07));
  for(const yy of[3.5,8])windowAt(b,2.65-yy*0.07,yy,0,Math.PI/2,{w:0.7,h:1.0,arch:true});
  const g=b.build();const sails=new THREE.Group();sails.position.set(2.8,12.3,0);
  const sm=toon(0xf6ecd8),wd=HM.wood;sails.add(mk(new THREE.CylinderGeometry(0.4,0.4,0.8,10),wd,0,0,0)).rotation.z=Math.PI/2;
  for(let i=0;i<4;i++){const arm=new THREE.Group();arm.rotation.x=i*Math.PI/2;arm.add(mk(new THREE.BoxGeometry(0.2,8.5,0.25),wd,0.35,4.3,0));const sl=mk(new THREE.BoxGeometry(0.08,6.6,1.7),sm,0.4,5.1,0.95);arm.add(sl);
    for(let k=0;k<5;k++)arm.add(mk(new THREE.BoxGeometry(0.12,0.1,1.8),wd,0.42,2.2+k*1.5,0.95));sails.add(arm);}
  g.add(sails);g.position.set(x,H(x,z),z);g.rotation.y=ry;shadowAll(g);scene.add(g);obstacles.push({x,z,r:3.2});WINDMILLS.push(sails);}
windmill(V2.x-46,V2.z-28,Math.atan2(30,30));windmill(V2.x+45,V2.z-24,-Math.PI*0.75,'tile');windmill(V2.x-30,V2.z+48,Math.PI*0.25,'tile');
// 攤位（拉麵店、雜貨店、家具店）
const STALLS={};
function makeStall(key,dx,dz,ry,o){
  const x=o.abs?dx:V2.x+dx,z=o.abs?dz:V2.z+dz,g=new THREE.Group(),wood=toon(0xd8a880,{map:TEX.wood});
  g.add(mk(new THREE.BoxGeometry(3.6,1.1,1.0),wood,0,0.55,0));g.add(mk(new THREE.BoxGeometry(3.8,0.12,1.2),toon(o.top||0xf6e0c8),0,1.14,0));
  for(const[px,pz]of[[-1.75,-1.5],[1.75,-1.5],[-1.75,0.45],[1.75,0.45]])g.add(mk(new THREE.BoxGeometry(0.14,2.9,0.14),wood,px,1.45,pz));
  const stripe=canvasTex(128,32,(c)=>{for(let i=0;i<8;i++){c.fillStyle=i%2?'#ffffff':o.roof;c.fillRect(i*16,0,16,32);}});
  const roof=mk(new THREE.BoxGeometry(4.2,0.14,2.5),toon(0xffffff,{map:stripe}),0,3.0,-0.5);roof.rotation.x=0.18;g.add(roof);
  const scal=mk(new THREE.BoxGeometry(4.2,0.35,0.06),toon(0xffffff,{map:stripe}),0,2.85,0.72);g.add(scal);
  const t=textTex([o.label],'#fff6ea','#7a4a34',256,96,50);const sb=mk(new THREE.BoxGeometry(2.0,0.7,0.1),[toon(0xf3c8a0),toon(0xf3c8a0),toon(0xf3c8a0),toon(0xf3c8a0),toon(0xffffff,{map:t}),toon(0xf3c8a0)],0,3.55,0.5);g.add(sb);
  {const crate=new THREE.Group();crate.add(mk(new THREE.BoxGeometry(1.1,0.84,0.95),toon(0xc89a70,{map:TEX.wood}),0,0.42,0));
   for(const y of[0.05,0.79])crate.add(mk(new THREE.BoxGeometry(1.14,0.08,0.99),toon(0xa87a50),0,y,0));crate.position.set(0,0,-1.1);g.add(crate);}
  if(o.extra)o.extra(g);
  g.position.set(x,H(x,z),z);g.rotation.y=ry;shadowAll(g);scene.add(g);batchStatic(g);
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
 g.position.set(STAGE.x,H(STAGE.x,STAGE.z),STAGE.z);g.rotation.y=Math.PI;shadowAll(g);scene.add(g);batchStatic(g);
 obstacles.push({x:STAGE.x,z:STAGE.z,r:2.5},{x:STAGE.x-2.8,z:STAGE.z,r:2.2},{x:STAGE.x+2.8,z:STAGE.z,r:2.2});}

// 城鎮路燈與石板路
{const pt=canvasTex(128,128,(g)=>{g.fillStyle='#d8c8b0';g.fillRect(0,0,128,128);const cs=['#e4d6bf','#cdbba0','#dccdb4','#c4b296'];for(let r=0;r<6;r++)for(let c=-1;c<6;c++){g.fillStyle=cs[(r*2+c+6)%4];g.beginPath();g.ellipse(c*24+(r%2)*12+12,r*22+11,10,9,0,0,7);g.fill();}},[1,1]);
 const m=toon(0xe8c99a);
 const boxes=obstacles.filter(o=>Math.hypot(o.x-V2.x,o.z-V2.z)<60&&(o.box||o.r>=0.7)&&Math.hypot(o.x-V2.x,o.z-V2.z)>6).map(o=>o.box?o:{x:o.x,z:o.z,r:o.r,box:{ry:0,hw:o.r*0.8,hd:o.r*0.8}});
 const clear=(ax,az,bx,bz,skip)=>!boxes.some(o=>o!==skip&&segHitsBox(ax,az,bx,bz,o,1.0));
 const road=(ax,az,bx,bz)=>{const L=Math.hypot(bx-ax,bz-az);if(L<0.3)return;const geo=scaleUV(new THREE.PlaneGeometry(2.6,L+1.2),1,(L+1.2)/2.6);geo.rotateX(-Math.PI/2);const mm=new THREE.Mesh(geo,m);mm.position.set((ax+bx)/2,0.018,(az+bz)/2);mm.rotation.y=Math.atan2(bx-ax,bz-az);mm.receiveShadow=true;scene.add(mm);};
 // 格子 A* 尋路：路線繞開所有建築
 const GS=1,GR=62,GN=GR*2+1,blk=new Uint8Array(GN*GN);const gi=(x,z)=>Math.round(x-V2.x+GR)+Math.round(z-V2.z+GR)*GN;
 for(let j=0;j<GN;j++)for(let i=0;i<GN;i++){const x=V2.x-GR+i,z=V2.z-GR+j;for(const o of boxes){const[lx,lz]=toLocal(o,x,z);if(Math.abs(lx)<o.box.hw+1.6&&Math.abs(lz)<o.box.hd+1.6){blk[i+j*GN]=1;break;}}}
 function astar(sx,sz){const si=gi(sx,sz);const g=new Float32Array(GN*GN).fill(1e9),from=new Int32Array(GN*GN).fill(-1),open=[si];g[si]=0;const seen=new Uint8Array(GN*GN);
   const hgo=k=>{const i=k%GN,j=(k/GN)|0;return Math.max(0,Math.hypot(i-GR,j-GR)-13.5);};
   while(open.length){let bi=0;for(let q=1;q<open.length;q++)if(g[open[q]]+hgo(open[q])<g[open[bi]]+hgo(open[bi]))bi=q;const k=open.splice(bi,1)[0];if(seen[k])continue;seen[k]=1;
     const i=k%GN,j=(k/GN)|0;if(Math.hypot(i-GR,j-GR)<=13.5){const path=[];let c=k;while(c>=0){path.push([V2.x-GR+c%GN,V2.z-GR+((c/GN)|0)]);c=from[c];}return path.reverse();}
     for(const[di,dj,w]of[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.41],[1,-1,1.41],[-1,1,1.41],[-1,-1,1.41]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=GN||nj>=GN)continue;const nk=ni+nj*GN;if(blk[nk]&&!(Math.hypot(ni-i,nj-j)>0&&Math.hypot(V2.x-GR+ni-sx,V2.z-GR+nj-sz)<2.2))continue;
       if(g[k]+w<g[nk]){g[nk]=g[k]+w;from[nk]=k;open.push(nk);}}}return null;}
 const freeSeg=(ax,az,bx,bz)=>{const L=Math.hypot(bx-ax,bz-az),n=Math.ceil(L/0.5);for(let q=0;q<=n;q++){const x=lerp(ax,bx,q/n),z=lerp(az,bz,q/n);const i=Math.round(x-V2.x+GR),j=Math.round(z-V2.z+GR);if(blk[i+j*GN]&&Math.hypot(x-ax,z-az)>2.2)return false;}return true;};
 for(const h of[...V2HOUSES,...V2EXTRA]){const path=astar(h.door.x,h.door.z);if(!path){window.ROADFAIL=(window.ROADFAIL||0)+1;continue;}
   const pts=[path[0]];let cur=0;while(cur<path.length-1){let nx=path.length-1;while(nx>cur+1&&!freeSeg(path[cur][0],path[cur][1],path[nx][0],path[nx][1]))nx--;pts.push(path[nx]);cur=nx;}
   pts[0]=[h.door.x,h.door.z];for(let k=0;k<pts.length-1;k++)road(pts[k][0],pts[k][1],pts[k+1][0],pts[k+1][1]);}
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2+0.3;lampPost(V2.x+Math.cos(a)*15.5,V2.z+Math.sin(a)*15.5,false);}}
// ---------- 倉鼠精靈村 ----------
const V3HOUSES=[[-18,-10],[18,-10],[-19,9],[19,8],[0,-21],[-9,21]].map(([dx,dz],i)=>{
  const x=V3.x+dx,z=V3.z+dz,ry=Math.atan2(V3.x-x,V3.z-z)-Math.PI/2;return medievalHouse(x,z,ry,{seed:i+40,roof:'slate',turret:i%2?-1:0,W:6.8,D:5.8,s:0.95});});
windmill(V3.x-30,V3.z+12,Math.PI*0.4);
{const g=new THREE.Group(),pk=toon(0xffb3c8),wd=toon(0xd8a880,{map:TEX.wood});
 const wheel=new THREE.Group();wheel.add(mk(new THREE.TorusGeometry(2.0,0.16,10,40),pk));wheel.add(mk(new THREE.TorusGeometry(2.0,0.16,10,40),pk,0,0,1.4));
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2;const b=mk(new THREE.CylinderGeometry(0.06,0.06,1.4,6),toon(0xfff3c0),Math.cos(a)*2,Math.sin(a)*2,0.7);b.rotation.x=Math.PI/2;wheel.add(b);}
 for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const sp=mk(new THREE.CylinderGeometry(0.05,0.05,2,6),toon(0xffd6e0),Math.cos(a)*1,Math.sin(a)*1,0);sp.rotation.z=a+Math.PI/2;wheel.add(sp);}
 wheel.add(mk(new THREE.CylinderGeometry(0.2,0.2,1.8,10),wd,0,0,0.7)).children;wheel.children[wheel.children.length-1].rotation.x=Math.PI/2;
 wheel.position.set(0,2.4,-0.7);g.add(wheel);g.userData.wheel=wheel;
 for(const z of[-1.0,1.0])for(const s of[-1,1]){const l=mk(new THREE.BoxGeometry(0.2,2.6,0.2),wd,s*0.8,1.2,z);l.rotation.z=s*0.3;g.add(l);}
 g.add(mk(new THREE.CylinderGeometry(2.6,2.8,0.3,24),toon(0xf2dcae),0,0.15,0));
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2;const sd=mk(new THREE.SphereGeometry(0.16,8,6),toon(0x5a4030),Math.cos(a)*2.3,0.35,Math.sin(a)*2.3);sd.scale.set(0.7,0.5,1.3);sd.rotation.y=-a;g.add(sd);}
 wheel.userData.dyn=true;g.position.set(V3.x,H(V3.x,V3.z),V3.z);g.rotation.y=0;shadowAll(g);scene.add(g);batchStatic(g);obstacles.push({x:V3.x,z:V3.z,r:2.8});var HAMWHEEL=wheel;}
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
// ---------- 洞窟入口（大山＋大洞口） ----------
const CAVE_FRONT=(()=>{const ry=Math.atan2(-CAVE_DOOR.x,-CAVE_DOOR.z);return{x:CAVE_DOOR.x+Math.sin(ry)*4.2,z:CAVE_DOOR.z+Math.cos(ry)*4.2,ry};})();
{const g=new THREE.Group(),rm=toon(0x9a8ca8),rm2=toon(0x8a7c9a),rm3=toon(0xa898b6),grassTop=toon(0x7fbf6a);
 const rockGeo=(r,seed)=>{const geo=new THREE.SphereGeometry(r,20,14);const p=geo.attributes.position;for(let k=0;k<p.count;k++){const x=p.getX(k),y=p.getY(k),z=p.getZ(k);const d=1+0.08*Math.sin(x*1.3/r*3+seed)*Math.cos(z*1.1/r*3+seed*2)+0.05*Math.sin(y*2/r*3+seed);p.setXYZ(k,x*d,y*d,z*d);}geo.computeVertexNormals();return geo;};
 // 山體（在洞口後方）
 [[0,3.5,-8.6,7.5,1],[-7,2.2,-5.6,5.5,2],[7,2.2,-5.6,5.5,3],[-3.5,8,-9.5,5,4],[3.8,7.6,-10,5.2,5],[0,11,-11.5,4.6,6],[-11,1.2,-3.5,3.6,7],[11,1.2,-3.5,3.6,8],[0,1,-15,7,9]].forEach(([x,y,z,r,sd],i)=>{
   const b=mk(rockGeo(r,sd),[rm,rm2,rm3][i%3],x,y,z);b.scale.y=0.9;g.add(b);});
 for(const[x,y,z,r]of[[0,14,-12,2.2],[-4,11.2,-9.9,1.8],[4.4,10.8,-10.5,1.9]]){const t=mk(new THREE.SphereGeometry(r,16,10,0,Math.PI*2,0,Math.PI/2),grassTop,x,y,z);t.scale.y=0.45;g.add(t);}
 // 洞口：石拱＋深色洞
 const arch=mk(new THREE.TorusGeometry(3.4,0.75,10,28,Math.PI),toon(0x7a6c8c),0,0,0.6);g.add(arch);
 const hole=mk(new THREE.CircleGeometry(3.25,32,0,Math.PI),basic(0x140f1e),0,0.02,0.4);g.add(hole);
 const hole2=mk(new THREE.CylinderGeometry(3.25,3.25,4,24,1,true,-Math.PI/2,Math.PI),basic(0x0e0a16,{side:THREE.BackSide}),0,0,-1.6);hole2.rotation.x=-Math.PI/2;g.add(hole2);
 for(const s of[-1,1])for(const[dx,y,c]of[[5.2,0.8,0x8fe8ff],[6.4,1.5,0xff9ed6],[7.6,0.6,0xd0a8ff]]){const cr=mk(new THREE.OctahedronGeometry(0.45),basic(c),s*dx,y,-0.6);cr.scale.y=1.9;cr.rotation.z=s*0.3;g.add(cr);}
 // 兩支火把
 for(const s of[-1,1]){g.add(mk(new THREE.CylinderGeometry(0.1,0.12,2.2,8),toon(0x8a6040),s*4.4,1.1,1.2));const f=mk(new THREE.ConeGeometry(0.22,0.55,8),basic(0xffb36e),s*4.4,2.45,1.2);g.add(f);}
 g.position.set(CAVE_DOOR.x,H(CAVE_DOOR.x,CAVE_DOOR.z)-0.1,CAVE_DOOR.z);g.rotation.y=CAVE_FRONT.ry;shadowAll(g);scene.add(g);
 const toW=(lx,lz)=>({x:CAVE_DOOR.x+Math.cos(CAVE_FRONT.ry)*lx+Math.sin(CAVE_FRONT.ry)*lz,z:CAVE_DOOR.z-Math.sin(CAVE_FRONT.ry)*lx+Math.cos(CAVE_FRONT.ry)*lz});
 for(const[lx,lz,r]of[[0,-8.6,6.2],[-7,-5.6,4.8],[7,-5.6,4.8],[-11,-3.5,3],[11,-3.5,3],[0,-15,6],[-4.3,0.2,0.9],[4.3,0.2,0.9],[0,-2.2,2.0]]){const p=toW(lx,lz);obstacles.push({x:p.x,z:p.z,r});}}
{const p={x:CAVE_FRONT.x+Math.cos(CAVE_FRONT.ry)*8,z:CAVE_FRONT.z-Math.sin(CAVE_FRONT.ry)*8};sign(p.x,p.z,CAVE_FRONT.ry,['⛰️ 果凍怪洞窟','⚠ 非常危險']);}
// ---------- 洞窟內部 ----------
const caveObs=[];const CAVE_EXIT={x:CAVE.x,z:CAVE.z+CAVE.r-3.5};
{const g=new THREE.Group();g.position.set(CAVE.x,0,CAVE.z);
 const fl=mk(new THREE.CircleGeometry(CAVE.r+3,48),toon(0x6a5a7c,{map:TEX.soil}),0,0,0);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;g.add(fl);
 g.add(mk(new THREE.CylinderGeometry(CAVE.r+1,CAVE.r+3,12,40,1,true),toon(0x4e4262,{side:THREE.BackSide,flatShading:true}),0,6,0));
 const sm=toon(0x7a6c8c,{flatShading:true}),cols=[0x8fe8ff,0xff9ed6,0xd0a8ff,0xfff08a,0x9ff0c8];
 for(let i=0;i<22;i++){const a=SR(0,6.28),d=SR(5,CAVE.r-3);const x=Math.cos(a)*d,z=Math.sin(a)*d;if(Math.hypot(x,z-(CAVE.r-3))<8)continue;const h=SR(1.5,4),r=SR(0.5,1.1);
   g.add(mk(new THREE.ConeGeometry(r,h,7),sm,x,h/2,z));caveObs.push({x:CAVE.x+x,z:CAVE.z+z,r:r+0.1});}
 for(let i=0;i<26;i++){const a=SR(0,6.28),d=SR(CAVE.r-4,CAVE.r);const x=Math.cos(a)*d,z=Math.sin(a)*d;const cl=new THREE.Group();const c=cols[i%5];
   for(let k=0;k<3;k++){const cr=mk(new THREE.OctahedronGeometry(SR(0.25,0.5)),basic(c),SR(-0.4,0.4),SR(0.3,0.8),SR(-0.4,0.4));cr.scale.y=1.8;cr.rotation.set(SR(-0.4,0.4),SR(0,3),SR(-0.4,0.4));cl.add(cr);}
   cl.position.set(x,0,z);g.add(cl);}
 const ex=new THREE.Group();ex.add(mk(new THREE.TorusGeometry(3.4,0.75,10,28,Math.PI),toon(0x7a6c8c)));const pt=mk(new THREE.CircleGeometry(3.25,32,0,Math.PI),basic(0xfff3d8));ex.add(pt);
  const glow=mk(new THREE.CircleGeometry(4.6,32,0,Math.PI),basic(0xfff3c0,{transparent:true,opacity:0.25,depthWrite:false}),0,0,-0.05);ex.add(glow);
  for(const s2 of[-1,1]){ex.add(mk(new THREE.SphereGeometry(1.6,12,10),toon(0x6a5c7c),s2*4.6,0.9,0.4));ex.add(mk(new THREE.SphereGeometry(1.1,12,10),toon(0x7a6c8c),s2*3.8,3.3,0.2));}
  ex.position.set(0,0,CAVE.r-0.6);ex.rotation.y=Math.PI;g.add(ex);
 shadowAll(g);scene.add(g);batchStatic(g);
}
// ---------- 大型遊樂園 ----------
const PARKV={};
{const C=PARK,dir=Math.atan2(-30-C.x,-68-C.z);// 入口朝向東邊小路
 const at=(a,d)=>({x:C.x+Math.sin(a)*d,z:C.z+Math.cos(a)*d});
 const U={x:Math.sin(dir),z:Math.cos(dir)},V={x:Math.cos(dir),z:-Math.sin(dir)};const P=(uu,vv)=>({x:C.x+U.x*uu+V.x*vv,z:C.z+U.z*uu+V.z*vv});PARKV.P=P;PARKV.U=U;PARKV.V=V;
 const KC=P(-24,0),KW=11,KD=8;PARKV.KC={x:KC.x,z:KC.z,w:KW,d:KD};const nearCastle=(x,z,m)=>Math.abs(x-KC.x)<KW+m&&Math.abs(z-KC.z)<KD+m;
 PARKV.gateYaw=dir;PARKV.gate=at(dir,C.r);PARKV.gateOut=at(dir,C.r+3.5);PARKV.gateIn=at(dir,C.r-3);
 // 地面
 const pt=canvasTex(256,256,(g)=>{g.fillStyle='#f6dfc0';g.fillRect(0,0,256,256);const cs=['#ffe9cf','#f2d2ae','#fbe2c4','#ffd9d2'];for(let y=0;y<256;y+=32)for(let x=(y/32)%2?-16:0;x<256;x+=32){g.fillStyle=cs[((x*5+y*3)>>4)%4];g.beginPath();g.roundRect?g.roundRect(x+2,y+2,28,28,7):g.rect(x+2,y+2,28,28);g.fill();}},[9,9]);
 const fl=mk(new THREE.CircleGeometry(C.r,96),toon(0xffffff,{map:pt}),C.x,0.03,C.z);pt.repeat.set(14,14);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;scene.add(fl);
 const rim=mk(new THREE.RingGeometry(C.r,C.r+0.7,64),toon(0xff9ec4),C.x,0.04,C.z);rim.rotation.x=-Math.PI/2;scene.add(rim);
 // 外圍彩色柵欄（入口留空）
 {const posts=new THREE.Group(),cols=[0xff9ec4,0xffd36e,0x8fdcb4,0x8fd0ff,0xb9a6f2];for(let i=0;i<130;i++){const a=i/130*Math.PI*2;if(Math.abs(angDiff(a,dir))<0.13)continue;const p=at(a,C.r+0.35);if(nearCastle(p.x,p.z,4.5))continue;
   posts.add(mk(new THREE.CylinderGeometry(0.12,0.14,1.1,8),toon(cols[i%5]),p.x,0.55,p.z));posts.add(mk(new THREE.SphereGeometry(0.17,10,8),toon(0xffffff),p.x,1.18,p.z));}
  shadowAll(posts);scene.add(posts);batchStatic(posts);}
 // 入口拱門
 {const g=new THREE.Group();for(const s of[-1,1]){g.add(mk(new THREE.CylinderGeometry(0.45,0.55,6,14),toon(0xff9ec4),s*3.6,3,0));g.add(mk(new THREE.SphereGeometry(0.7,16,12),toon(0xffd36e),s*3.6,6.4,0));
   g.add(mk(new THREE.ConeGeometry(0.6,1.2,12),toon(0x8fd0ff),s*3.6,7.4,0));}
  g.add(mk(new THREE.BoxGeometry(7.6,1.3,0.5),toon(0xffffff),0,5.6,0));const t=textTex(['🎡 龍蝦樂園 🎠'],'#fff6ea','#e0607a',512,96,48);
  for(const s of[1,-1]){const sg=mk(new THREE.PlaneGeometry(7.2,1.15),toon(0xffffff,{map:t}),0,5.6,s*0.27);if(s<0)sg.rotation.y=Math.PI;g.add(sg);}
  g.position.set(PARKV.gate.x,0,PARKV.gate.z);g.rotation.y=dir;shadowAll(g);scene.add(g);batchStatic(g);
  for(const s of[-1,1])obstacles.push({x:PARKV.gate.x+Math.cos(dir)*s*3.6,z:PARKV.gate.z-Math.sin(dir)*s*3.6,r:0.6});}
 // 摩天輪（大包廂，角色和寵物可以一起坐）
 {const F=Object.assign(P(-2,23),{R:14,n:12,ang:0,yaw:dir,zr:2.7});F.cy=F.R+3.6;PARKV.ferris=F;
  const g=new THREE.Group();g.position.set(F.x,0,F.z);g.rotation.y=F.yaw;
  const wh=new THREE.Group();wh.position.y=F.cy;g.add(wh);F.wheel=wh;
  const pk=toon(0xff9ec4),wt=toon(0xffffff),yl=toon(0xffd36e);
  for(const zz of[-F.zr,F.zr]){wh.add(mk(new THREE.TorusGeometry(F.R,0.22,8,80),pk,0,0,zz));wh.add(mk(new THREE.TorusGeometry(F.R*0.55,0.14,8,56),wt,0,0,zz));
    for(let i=0;i<F.n*2;i++){const a=i/(F.n*2)*Math.PI*2;const sp=mk(new THREE.CylinderGeometry(0.08,0.08,F.R,6),i%2?wt:pk,Math.cos(a)*F.R/2,Math.sin(a)*F.R/2,zz);sp.rotation.z=a-Math.PI/2;wh.add(sp);}
    for(let i=0;i<F.n*2;i++){const a=(i+0.5)/(F.n*2)*Math.PI*2;wh.add(mk(new THREE.SphereGeometry(0.22,8,6),basic(0xfff3c0),Math.cos(a)*F.R,Math.sin(a)*F.R,zz*1.06));}}
  for(let i=0;i<F.n;i++){const a=i/F.n*Math.PI*2;const b=mk(new THREE.CylinderGeometry(0.1,0.1,F.zr*2,6),yl,Math.cos(a)*F.R,Math.sin(a)*F.R,0);b.rotation.x=Math.PI/2;wh.add(b);}
  {const hub=mk(new THREE.CylinderGeometry(1.0,1.0,F.zr*2+0.6,18),yl,0,0,0);hub.rotation.x=Math.PI/2;wh.add(hub);}
  for(const zz of[-F.zr-0.8,F.zr+0.8])for(const s of[-1,1]){const L=Math.hypot(F.cy,F.R*0.5);const leg=mk(new THREE.CylinderGeometry(0.3,0.45,L,10),toon(0xb9a6f2),s*F.R*0.25,F.cy/2,zz);leg.rotation.z=s*Math.atan2(F.R*0.5,F.cy);g.add(leg);}
  {const ax=mk(new THREE.CylinderGeometry(0.35,0.35,F.zr*2+2.2,10),toon(0xb9a6f2),0,F.cy,0);ax.rotation.x=Math.PI/2;g.add(ax);}
  // 包廂：半徑 2.1，地板在吊點下方 3.3
  F.cars=[];const cc=[0xff9ec4,0x8fd0ff,0xffd36e,0x8fdcb4,0xb9a6f2,0xffb38a];F.drop=3.3;
  for(let i=0;i<F.n;i++){const car=new THREE.Group();const c=toon(cc[i%6]),cd=toon(cc[i%6],{side:THREE.DoubleSide});
    car.add(mk(new THREE.CylinderGeometry(2.1,1.9,0.25,20),c,0,-F.drop-0.12,0));
    car.add(mk(new THREE.CylinderGeometry(2.1,2.1,1.0,24,1,true),cd,0,-F.drop+0.5,0));car.add(mk(new THREE.TorusGeometry(2.1,0.1,6,24),wt,0,-F.drop+1.0,0)).rotation&&0;car.children[car.children.length-1].rotation.x=Math.PI/2;
    const top=mk(new THREE.SphereGeometry(2.25,20,10,0,Math.PI*2,0,Math.PI/2),c,0,-0.9,0);top.scale.y=0.42;car.add(top);car.add(mk(new THREE.CylinderGeometry(2.3,2.3,0.12,24),wt,0,-0.9,0));
    for(let k=0;k<4;k++){const a=k/4*Math.PI*2+Math.PI/4;car.add(mk(new THREE.CylinderGeometry(0.06,0.06,F.drop-1.9,6),wt,Math.cos(a)*2.0,-F.drop+1.0+(F.drop-1.9)/2,Math.sin(a)*2.0));}
    car.add(mk(new THREE.CylinderGeometry(0.08,0.08,0.5,6),yl,0,-0.3,0));car.add(mk(new THREE.SphereGeometry(0.18,8,6),yl,0,-0.05,0));
    g.add(car);F.cars.push(car);}
  for(const car of F.cars){car.userData.dyn=true;}wh.userData.dyn=true;
  // 月台
  {const pf=mk(new THREE.BoxGeometry(5.2,0.3,5.2),toon(0xffe0ea),0,0.15,F.R*0+0);g.add(pf);
   const t=textTex(['🎡 摩天輪','按互動搭乘'],'#fff6ea','#7a4a34',256,128,36);const sg=mk(new THREE.BoxGeometry(1.8,0.9,0.1),[wt,wt,wt,wt,toon(0xffffff,{map:t}),wt],3.6,1.5,4.2);g.add(sg);g.add(mk(new THREE.CylinderGeometry(0.06,0.06,1.1,6),wt,3.6,0.55,4.2));}
  shadowAll(g);scene.add(g);
  const toW=(lx,lz)=>({x:F.x+Math.cos(F.yaw)*lx+Math.sin(F.yaw)*lz,z:F.z-Math.sin(F.yaw)*lx+Math.cos(F.yaw)*lz});F.toW=toW;F.board=toW(0,4.4);F.exit=toW(2.6,5.0);
  for(const s of[-1,1])for(const zz of[-F.zr-0.8,F.zr+0.8]){const p=toW(s*F.R*0.5,zz);obstacles.push({x:p.x,z:p.z,r:0.7});}
  batchStatic(wh);for(const car of F.cars)batchStatic(car);batchStatic(g);}
 // 旋轉木馬
 {const K=Object.assign(P(17,15),{r:5,ang:0,n:8});PARKV.carousel=K;const g=new THREE.Group();g.position.set(K.x,0,K.z);
  g.add(mk(new THREE.CylinderGeometry(K.r+0.3,K.r+0.5,0.5,32),toon(0xffe0ea),0,0.25,0));
  const rot=new THREE.Group();g.add(rot);K.rot=rot;rot.add(mk(new THREE.CylinderGeometry(K.r,K.r,0.12,32),toon(0xfff6ea),0,0.56,0));
  rot.add(mk(new THREE.CylinderGeometry(0.45,0.45,4.6,14),toon(0xffd36e),0,2.8,0));
  const cn=mk(new THREE.ConeGeometry(K.r+0.6,2.2,16),toon(0xff9ec4),0,6.2,0);rot.add(cn);
  const st=canvasTex(256,32,(c)=>{for(let i=0;i<16;i++){c.fillStyle=i%2?'#ffffff':'#ff9ec4';c.fillRect(i*16,0,16,32);}});
  rot.add(mk(new THREE.CylinderGeometry(K.r+0.6,K.r+0.6,0.6,32,1,true),toon(0xffffff,{map:st,side:THREE.DoubleSide}),0,4.85,0));
  rot.add(mk(new THREE.SphereGeometry(0.4,12,10),toon(0xffd36e),0,7.4,0));
  K.horses=[];const hc=[0xffffff,0xffd6e6,0xd6ecff,0xfff3c0];
  for(let i=0;i<K.n;i++){const a=i/K.n*Math.PI*2,rr=K.r-1.3;const pole=mk(new THREE.CylinderGeometry(0.05,0.05,4.2,6),toon(0xffd36e),Math.cos(a)*rr,2.7,Math.sin(a)*rr);rot.add(pole);
    const h=new THREE.Group();const c=toon(hc[i%4]);const b=mk(new THREE.SphereGeometry(0.42,14,10),c,0,0,0);b.scale.set(0.8,0.75,1.4);h.add(b);
    const nk=mk(new THREE.SphereGeometry(0.26,12,8),c,0,0.45,0.48);nk.scale.set(0.8,1.2,1);h.add(nk);const hd=mk(new THREE.SphereGeometry(0.24,12,8),c,0,0.75,0.68);hd.scale.set(0.75,0.75,1.2);h.add(hd);
    h.add(mk(new THREE.SphereGeometry(0.13,8,6),toon(0xff9ec4),0,0.92,0.45));for(const s of[-1,1])for(const zz of[-0.35,0.35]){const lg=mk(new THREE.CylinderGeometry(0.06,0.05,0.5,6),c,s*0.18,-0.4,zz);lg.rotation.x=zz>0?0.5:-0.5;h.add(lg);}
    h.add(mk(new THREE.BoxGeometry(0.5,0.08,0.45),toon(0xff6f9f),0,0.32,-0.05));
    h.position.set(Math.cos(a)*rr,1.6,Math.sin(a)*rr);h.rotation.y=-a;h.userData.dyn=true;rot.add(h);K.horses.push({h,a,rr});}
  shadowAll(g);scene.add(g);rot.userData.dyn=true;batchStatic(g);batchStatic(rot);for(const h of K.horses)batchStatic(h.h);obstacles.push({x:K.x,z:K.z,r:K.r+0.3});}
 // 咖啡杯
 {const T=Object.assign(P(27,-10),{ang:0});PARKV.teacups=T;const g=new THREE.Group();g.position.set(T.x,0,T.z);
  g.add(mk(new THREE.CylinderGeometry(4.2,4.4,0.3,32),toon(0xd6ecff),0,0.15,0));const plate=new THREE.Group();g.add(plate);T.plate=plate;T.cups=[];
  [0xff9ec4,0xffd36e,0x8fdcb4,0xb9a6f2].forEach((c,i)=>{const a=i/4*Math.PI*2;const cup=new THREE.Group();const m=toon(c);
    cup.add(mk(new THREE.CylinderGeometry(1.05,0.75,0.95,20,1,true),toon(c,{side:THREE.DoubleSide}),0,0.75,0));cup.add(mk(new THREE.CylinderGeometry(0.75,0.75,0.08,20),m,0,0.3,0));
    {const tr=mk(new THREE.TorusGeometry(1.05,0.08,6,24),toon(0xffffff),0,1.22,0);tr.rotation.x=Math.PI/2;cup.add(tr);}const hd=mk(new THREE.TorusGeometry(0.3,0.08,6,14),m,1.15,0.8,0);cup.add(hd);
    cup.position.set(Math.cos(a)*2.4,0,Math.sin(a)*2.4);cup.userData.dyn=true;plate.add(cup);T.cups.push(cup);});
  shadowAll(g);scene.add(g);plate.userData.dyn=true;batchStatic(g);for(const c of T.cups)batchStatic(c);obstacles.push({x:T.x,z:T.z,r:4.2});}
 // 氣球攤、爆米花車、長椅、路燈、花圃、彩旗
 {const g=new THREE.Group();const bal=[0xff9ec4,0xffd36e,0x8fdcb4,0x8fd0ff,0xb9a6f2,0xff8f7a];
  const bp=at(dir+0.5,C.r-4);g.add(mk(new THREE.CylinderGeometry(0.5,0.6,1.0,12),toon(0xffffff),bp.x,0.5,bp.z));
  for(let i=0;i<9;i++){const a=i*0.7,r=0.25+((i*37)%5)*0.12;const x=bp.x+Math.cos(a)*r,z=bp.z+Math.sin(a)*r,y=2.6+((i*13)%7)*0.18;
    const b=mk(new THREE.SphereGeometry(0.35,14,10),toon(bal[i%6]),x,y,z);b.scale.y=1.18;g.add(b);
    const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,y-0.4,z),new THREE.Vector3(bp.x,1.0,bp.z)]);g.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color:0xffffff})));}
  obstacles.push({x:bp.x,z:bp.z,r:0.7});
  const pp=at(dir-0.55,C.r-4.5);{const cart=new THREE.Group();cart.add(mk(new THREE.BoxGeometry(1.8,1.0,1.1),toon(0xff6f6f),0,0.8,0));cart.add(mk(new THREE.BoxGeometry(1.2,1.0,0.9),toon(0xfff6d6,{transparent:true,opacity:0.85}),0,1.8,0));
    for(let k=0;k<10;k++)cart.add(mk(new THREE.SphereGeometry(0.1,6,5),toon(0xfff3c0),R(-0.45,0.45),1.45+R(0,0.5),R(-0.3,0.3)));
    const rf=mk(new THREE.ConeGeometry(1.3,0.7,4),toon(0xffffff),0,2.65,0);rf.rotation.y=Math.PI/4;cart.add(rf);for(const s of[-1,1]){const w=mk(new THREE.CylinderGeometry(0.3,0.3,0.12,12),toon(0xffd36e),s*0.7,0.3,0.6);w.rotation.x=Math.PI/2;cart.add(w);}
    cart.position.set(pp.x,0,pp.z);cart.rotation.y=dir;g.add(cart);obstacles.push({x:pp.x,z:pp.z,r:1.0});}
  for(let i=0;i<10;i++){const a=dir+(i<5?1:-1)*(0.9+(i%5)*0.32),p=at(a,C.r-2.2);if(!farFrom(p.x,p.z,1.2)||nearCastle(p.x,p.z,2))continue;const bn=new THREE.Group();bn.add(mk(new THREE.BoxGeometry(1.6,0.12,0.55),toon(0xd8a880,{map:TEX.wood}),0,0.5,0));bn.add(mk(new THREE.BoxGeometry(1.6,0.5,0.1),toon(0xd8a880,{map:TEX.wood}),0,0.8,-0.25));
    for(const s of[-1,1])bn.add(mk(new THREE.BoxGeometry(0.1,0.5,0.5),toon(0x9a8478),s*0.7,0.25,0));bn.position.set(p.x,0,p.z);bn.rotation.y=a+Math.PI;g.add(bn);}
  for(let i=0;i<9;i++){const a=dir+0.6+i*0.7,p=at(a,C.r-6.5);if(!farFrom(p.x,p.z,1.8)||nearCastle(p.x,p.z,2.5))continue;const fb=mk(new THREE.CylinderGeometry(1.1,1.2,0.4,16),toon(0xd8a880),p.x,0.2,p.z);g.add(fb);
    for(let k=0;k<7;k++){const aa=k/7*6.28;g.add(mk(new THREE.SphereGeometry(0.18,8,6),toon(bal[(k+i)%6]),p.x+Math.cos(aa)*0.6,0.55,p.z+Math.sin(aa)*0.6));}g.add(mk(new THREE.SphereGeometry(0.45,10,8),toon(0x7fcc5e),p.x,0.7,p.z));obstacles.push({x:p.x,z:p.z,r:1.2});}
  // 彩旗：從拱門到中央
  for(let i=0;i<3;i++){if(i===1)continue;const a=dir+(i-1)*0.35,p0=at(a,C.r-1),p1=at(a,8);const N=14;for(let k=0;k<=N;k++){const t=k/N;const x=lerp(p0.x,p1.x,t),z=lerp(p0.z,p1.z,t),y=5.2-Math.sin(t*Math.PI)*1.0;
     const f=mk(new THREE.ConeGeometry(0.22,0.45,3),toon(bal[k%6]),x,y,z);f.rotation.x=Math.PI;g.add(f);}
    g.add(mk(new THREE.CylinderGeometry(0.1,0.12,5.4,8),toon(0xffffff),p0.x,2.7,p0.z));}
  fountain(C.x,C.z,0.85);
  shadowAll(g);scene.add(g);batchStatic(g);}
 for(let i=0;i<14;i++){const a=dir+0.25+i*0.45,p=at(a,C.r-1.6);if(!farFrom(p.x,p.z,1)||nearCastle(p.x,p.z,2))continue;lampPost(p.x,p.z,false);}
 for(const[uu,vv]of[[34,4],[34,-4],[26,5],[26,-5],[12,5],[12,-5],[-8,5],[-8,-5]]){const p=P(uu,vv);if(farFrom(p.x,p.z,1))lampPost(p.x,p.z,false);}
 // 散步點
 // ===== 雲霄飛車 =====
 {const CC=P(3,-24),A=12.5,B=7.5;const key=[[0,1.2],[0.45,1.2],[0.9,4.5],[1.35,9],[1.75,12.5],[2.15,5],[2.6,2.5],[3.05,8],[3.55,3.5],[4.05,6.5],[4.5,2.8],[5.0,5.2],[5.45,2.2],[5.85,1.2]];
  const pts=key.map(([t,y])=>{const rr=1+0.08*Math.sin(t*3);return new THREE.Vector3(CC.x+U.x*Math.cos(t)*A*rr+V.x*Math.sin(t)*B*rr,y,CC.z+U.z*Math.cos(t)*A*rr+V.z*Math.sin(t)*B*rr);});
  const curve=new THREE.CatmullRomCurve3(pts,true,'centripetal');const N=420;const sp=curve.getSpacedPoints(N);sp.pop();const L=curve.getLength();
  const CO={curve,L,N,sp,s:0,cars:[],v:[]};PARKV.coaster=CO;
  PARKV.coasterIn=(x,z)=>{const dx=x-CC.x,dz=z-CC.z;const cu=dx*U.x+dz*U.z,cv=dx*V.x+dz*V.z;return (cu/(A+3))**2+(cv/(B+3))**2<1;};
  // 每點速度：從車站到最高點是爬升段（慢速），之後依高度落差加速
  let top=0;for(let i=0;i<N;i++)if(sp[i].y>sp[top].y)top=i;
  for(let i=0;i<N;i++){let v;if(i<=top)v=4.2;else{v=Math.sqrt(4.2*4.2+2*9.8*(sp[top].y-sp[i].y))*0.82;}if(i>N*0.94)v=Math.min(v,3.5);CO.v.push(Math.max(3.2,v));}
  const b=MB();const lat=[],up=new THREE.Vector3(0,1,0),tmp=new THREE.Vector3();
  const rail=[[],[]];for(let i=0;i<N;i++){const p=sp[i],q=sp[(i+1)%N],r0=sp[(i-1+N)%N];const t=tmp.copy(q).sub(r0).normalize();const l=new THREE.Vector3().crossVectors(t,up).normalize();lat.push(l);
    rail[0].push(p.clone().addScaledVector(l,0.8));rail[1].push(p.clone().addScaledVector(l,-0.8));}
  const rmat=toon(0xff8fb8),smat=toon(0xb9a6f2),tmat=toon(0xfff6ea);const g=new THREE.Group();
  for(const rp of rail){g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp,true),N,0.11,6,true),rmat));}
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp.map(p=>p.clone().add(new THREE.Vector3(0,-0.32,0))),true),N,0.2,8,true),smat));
  const ties=[],sups=[];const o3=new THREE.Object3D();
  for(let i=0;i<N;i+=2){const p=sp[i];o3.position.copy(p).y-=0.12;o3.lookAt(tmp.copy(sp[(i+1)%N]).setY(sp[(i+1)%N].y-0.12));o3.updateMatrix();ties.push([new THREE.BoxGeometry(1.9,0.12,0.32),o3.matrix.clone()]);}
  for(let i=0;i<N;i+=9){const p=sp[i];if(p.y<1.6)continue;const h=p.y-0.3;sups.push([new THREE.CylinderGeometry(0.16,0.24,h,8),M4(p.x,h/2,p.z)]);sups.push([new THREE.CylinderGeometry(0.4,0.5,0.3,8),M4(p.x,0.15,p.z)]);obstacles.push({x:p.x,z:p.z,r:0.45});}
  g.add(new THREE.Mesh(mergeGeos(ties),tmat));g.add(new THREE.Mesh(mergeGeos(sups),smat));
  // 車站
  const st=sp[Math.floor(N*0.03)],sl=lat[Math.floor(N*0.03)];const sx=st.x+sl.x*3.2,sz=st.z+sl.z*3.2;const syaw=Math.atan2(sp[Math.floor(N*0.03)+1].x-st.x,sp[Math.floor(N*0.03)+1].z-st.z);
  {const sg=new THREE.Group();sg.add(mk(new THREE.BoxGeometry(3.6,0.9,12),toon(0xffe0ea),0,0.45,0));for(const zz of[-5.5,5.5])for(const xx of[-1.5,1.5])sg.add(mk(new THREE.CylinderGeometry(0.15,0.15,4,8),toon(0xffffff),xx,2.5,zz));
   const roof=mk(new THREE.BoxGeometry(5.6,0.3,13),toon(0xff8fb8),-0.8,4.6,0);roof.rotation.z=0.12;sg.add(roof);
   const t=textTex(['🎢 雲霄飛車','按互動搭乘'],'#fff6ea','#e0607a',256,128,36);const sgn=mk(new THREE.BoxGeometry(0.12,1.2,3),[toon(0xffffff,{map:t}),toon(0xffffff,{map:t}),tmat,tmat,tmat,tmat],1.75,3.6,0);sg.add(sgn);
   sg.position.set(sx,0,sz);sg.rotation.y=syaw;g.add(sg);obstacles.push({x:sx-Math.sin(syaw)*3,z:sz-Math.cos(syaw)*3,r:1.6},{x:sx+Math.sin(syaw)*3,z:sz+Math.cos(syaw)*3,r:1.6});}
  CO.board={x:sx+sl.x*2.6,z:sz+sl.z*2.6};CO.exit={x:sx+sl.x*3.4,z:sz+sl.z*3.4};
  // 車廂（比角色大）
  const cc=[0xff6f9f,0xffd36e,0x8fd0ff,0x8fdcb4];
  for(let k=0;k<4;k++){const car=new THREE.Group();const c=toon(cc[k]);
    car.add(mk(new THREE.BoxGeometry(2.5,0.35,2.7),c,0,0.2,0));for(const s of[-1,1])car.add(mk(new THREE.BoxGeometry(0.18,0.85,2.7),c,s*1.16,0.75,0));
    car.add(mk(new THREE.BoxGeometry(2.5,0.85,0.2),c,0,0.75,-1.25));const fr=mk(new THREE.CylinderGeometry(1.25,1.25,0.5,16,1,false,0,Math.PI),c,0,0.6,1.25);fr.rotation.z=Math.PI/2;fr.rotation.y=Math.PI/2;fr.scale.set(1,1,0.7);car.add(fr);
    car.add(mk(new THREE.BoxGeometry(2.1,0.9,0.25),toon(0xfff6ea),0,0.85,-0.95));car.add(mk(new THREE.TorusGeometry(0.5,0.07,6,16,Math.PI),tmat,0,1.25,0.35)).rotation&&0;car.children[car.children.length-1].rotation.y=Math.PI/2;
    for(const s of[-1,1])for(const zz of[-0.9,0.9]){const w=mk(new THREE.CylinderGeometry(0.22,0.22,0.15,10),toon(0x7a6c8c),s*1.0,-0.05,zz);w.rotation.z=Math.PI/2;car.add(w);}
    shadowAll(car);scene.add(car);batchStatic(car);CO.cars.push(car);}
  shadowAll(g);scene.add(g);}
 // ===== 樂園商店 =====
 {const sp=P(30,10),ft=P(30,0);makeStall('park',sp.x,sp.z,yawTo(sp.x,sp.z,ft.x,ft.z),{abs:true,label:'🎁 樂園商店',roof:'#ff8fb8',top:0xfff0f6,extra:g=>{
   for(let i=0;i<3;i++){const c=mk(new THREE.CylinderGeometry(0.06,0.07,0.75,8),toon(0xd9924a),-1.3+i*0.2,1.55,0.1);c.rotation.z=0.25;g.add(c);}
   for(let i=0;i<3;i++){const pl=makeCritter({species:'lobster',body:['#f0874f','#ff9ec4','#8fd0ff'][i],accent:'#6e3428',mouth:'w'},false);pl.setFace('happy');pl.g.scale.setScalar(0.24);pl.g.position.set(0.2+i*0.55,1.2,0.1);g.add(pl.g);}}});}
 // ===== 大城堡：龍蝦樂園主題餐廳 =====
 {const X=KC.x,Z=KC.z,W=KW,D=KD,WH=7,T=0.5,g=new THREE.Group();const CV={walls:[],roof:null,diners:[],waiters:[],light:null};PARKV.castle=CV;
  const stoneO=HM.stone;const wp=canvasTex(128,128,(c)=>{c.fillStyle='#fff3e6';c.fillRect(0,0,128,128);c.fillStyle='#ffd9e4';c.fillRect(0,96,128,32);c.fillStyle='#f6c35a';for(let y=0;y<96;y+=32)for(let x=0;x<128;x+=32){c.beginPath();c.arc(x+(y%64?16:0)+8,y+16,4,0,7);c.fill();}},[1,1]);
  const inn=toon(0xffffff,{map:wp}),top=toon(0xc8bca8);
  const fl=canvasTex(128,128,(c)=>{for(let y=0;y<4;y++)for(let x=0;x<4;x++){c.fillStyle=(x+y)%2?'#fff3e6':'#ffd6e2';c.fillRect(x*32,y*32,32,32);}},[W,D]);
  const floor=mk(new THREE.BoxGeometry(W*2,0.1,D*2),toon(0xffffff,{map:fl}),X,0.0,Z);floor.receiveShadow=true;g.add(floor);
  const carpet=mk(new THREE.BoxGeometry(W*2-1,0.03,2.6),toon(0xd94a5e),X+0.5,0.06,Z);g.add(carpet);
  function wall(cx,cz,len,alongX,innerSign){const sx=alongX?len:T,sz=alongX?T:len;const geo=scaleUV(new THREE.BoxGeometry(sx,WH,sz),Math.max(1,Math.round(len/3)),3);
    const mats=[stoneO,stoneO,top,top,stoneO,stoneO];const idx=alongX?(innerSign>0?4:5):(innerSign>0?0:1);mats[idx]=inn;
    const full=mk(geo,mats,cx,WH/2,cz);const stub=mk(new THREE.BoxGeometry(sx,0.9,sz),mats.map(m=>m===inn?toon(0xffd9e4):m),cx,0.45,cz);stub.visible=false;g.add(full,stub);
    CV.walls.push({full,stub,alongX,pos:alongX?cz:cx,innerSign,deco:[]});WALLS.push({x0:cx-sx/2,x1:cx+sx/2,z0:cz-sz/2,z1:cz+sz/2,y1:WH});}
  wall(X,Z-D,W*2+T,true,1);wall(X,Z+D,W*2+T,true,-1);wall(X-W,Z,D*2,false,1);const dw=1.8,seg=D-dw;wall(X+W,Z-dw-seg/2,seg,false,-1);wall(X+W,Z+dw+seg/2,seg,false,-1);
  {const lh=WH-4.6;const m=mk(new THREE.BoxGeometry(T,lh,dw*2),[stoneO,inn,top,top,stoneO,stoneO],X+W,4.6+lh/2,Z);g.add(m);CV.walls.push({full:m,stub:null,alongX:false,pos:X+W,innerSign:-1,deco:[]});}
  const wallOf=(x,z)=>CV.walls.filter(w=>w.stub&&(w.alongX?Math.abs(z-w.pos)<0.6:Math.abs(x-w.pos)<0.6));
  // 正面拱門與看板（貼在正面牆上）
  {const front=wallOf(X+W,Z+3);const fg=new THREE.Group();const arch=mk(new THREE.TorusGeometry(2.0,0.4,8,20,Math.PI),toon(0xe8dcc8),0,4.6-2.0+0.0,0);arch.position.set(X+W+0.3,2.6,Z);arch.rotation.y=Math.PI/2;fg.add(arch);
   for(const s of[-1,1])fg.add(mk(new THREE.BoxGeometry(0.7,2.8,0.7),toon(0xe8dcc8),X+W+0.3,1.4,Z+s*2.05));
   const t1=textTex(['🏰 龍蝦樂園餐廳'],'#ff8fb8','#ffffff',512,96,52);{const sg=mk(new THREE.PlaneGeometry(7,1.3),toon(0xffffff,{map:t1}),X+W+0.3,5.6,Z);sg.rotation.y=Math.PI/2;fg.add(sg);}
   const t2=textTex(['🎉 六週年慶典 🎉'],'#ffd36e','#c0405a',512,96,52);for(const s of[-1,1]){const bn=mk(new THREE.PlaneGeometry(4,1.0),toon(0xffffff,{map:t2,side:THREE.DoubleSide}),X+W+0.3,3.8,Z+s*5.0);bn.rotation.y=Math.PI/2;fg.add(bn);}
   for(const s of[-1,1])for(const zz of[2.9,6.8]){const fl2=mk(new THREE.PlaneGeometry(0.9,2.2),toon(s>0?0xff8fb8:0x8fd0ff,{side:THREE.DoubleSide}),X+W+0.32,4.4,Z+s*zz);fl2.rotation.y=Math.PI/2;fg.add(fl2);}
   g.add(fg);for(const w of front)w.deco.push(fg);}
  // 窗戶（內外）
  const winAt=(x,z,ry)=>{const list=wallOf(x,z);for(const side of[1,-1]){const o=new THREE.Group();o.position.set(x,3.6,z);o.rotation.y=ry+(side<0?Math.PI:0);
    o.add(mk(new THREE.BoxGeometry(1.4,2.4,0.1),side>0?toon(0xe8dcc8):toon(0xf6c35a),0,0,T/2+0.03));o.add(mk(new THREE.PlaneGeometry(1.1,2.1),side>0?HM.glass:basic(0xbfe6ff),0,0,T/2+0.09));
    o.add(mk(new THREE.CircleGeometry(0.7,16,0,Math.PI),side>0?toon(0xe8dcc8):toon(0xf6c35a),0,1.2,T/2+0.04));o.add(mk(new THREE.CircleGeometry(0.55,16,0,Math.PI),side>0?HM.glass:basic(0xbfe6ff),0,1.2,T/2+0.1));g.add(o);for(const w of list)w.deco.push(o);}};
  for(const xx of[-7,-2.5,2.5,7]){winAt(X+xx,Z+D,0);winAt(X+xx,Z-D,Math.PI);}for(const zz of[-4,4])winAt(X-W,Z+zz,-Math.PI/2);
  // 屋頂群組：城垛、塔樓、主堡
  const roof=new THREE.Group();{const b=MB();b.add('stone',scaleUV(new THREE.BoxGeometry(W*2+0.8,0.6,D*2+0.8),6,1),M4(X,WH+0.3,Z));
   for(let i=0;i<=22;i+=2){for(const s of[-1,1]){b.add('stone',new THREE.BoxGeometry(0.9,0.9,0.6),M4(X-W+i,WH+1.05,Z+s*(D+0.1)));}}for(let i=0;i<=16;i+=2)for(const s of[-1,1])b.add('stone',new THREE.BoxGeometry(0.6,0.9,0.9),M4(X+s*(W+0.1),WH+1.05,Z-D+i));
   b.add('timberA',scaleUV(new THREE.BoxGeometry(12,5,8),3,1),M4(X-2,WH+3.1,Z));gableRoof(b,'slate',X-2,Z,WH+5.6,8,12,5,0.6);
   b.add('stone',scaleUV(new THREE.CylinderGeometry(2.4,2.6,14,16),5,4),M4(X-2,WH+7,Z));b.add('stone',new THREE.CylinderGeometry(2.8,2.8,0.6,16),M4(X-2,WH+14.2,Z));b.add('tile',scaleUV(new THREE.ConeGeometry(3.1,7,16),4,3),M4(X-2,WH+18,Z));b.add('gold',new THREE.SphereGeometry(0.4,10,8),M4(X-2,WH+21.7,Z));
   for(const s of[-1,1])windowAt(b,X-2+2.45,WH+10,Z+s*0.9,Math.PI/2,{w:0.7,h:1.3,arch:true});
   for(const[sx,sz]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const tx=X+sx*(W+1.2),tz=Z+sz*(D+1.2);b.add('stone',scaleUV(new THREE.CylinderGeometry(2.5,2.7,13,16),5,4),M4(tx,6.5,tz));b.add('stone',new THREE.CylinderGeometry(2.9,2.9,0.5,16),M4(tx,13.2,tz));
     b.add(sx>0?'tile':'slate',scaleUV(new THREE.ConeGeometry(3.1,6,16),4,3),M4(tx,16.4,tz));b.add('gold',new THREE.SphereGeometry(0.3,8,6),M4(tx,19.5,tz));windowAt(b,tx+sx*2.45,9,tz,sx>0?Math.PI/2:-Math.PI/2,{w:0.7,h:1.2,arch:true});}
   roof.add(b.build());
   // 旗子（有「6」字樣）
   const ft=textTex(['6'],'#ff8fb8','#ffffff',128,128,96);const flag=mk(new THREE.PlaneGeometry(2.4,1.6),toon(0xffffff,{map:ft,side:THREE.DoubleSide}),X-2+1.2,WH+23.2,Z);roof.add(flag);roof.add(mk(new THREE.CylinderGeometry(0.06,0.06,3.5,6),toon(0xffffff),X-2,WH+22.6,Z));CV.flag=flag;}
  g.add(roof);CV.roof=roof;bakeWallDeco(CV.walls);
  // 塔樓下段（一直顯示）＋碰撞
  for(const[sx,sz]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const tx=X+sx*(W+1.2),tz=Z+sz*(D+1.2);g.add(mk(scaleUV(new THREE.CylinderGeometry(2.6,2.7,1.2,16),5,0.5),stoneO,tx,0.6,tz));obstacles.push({x:X+sx*(W+2.4),z:Z+sz*(D+2.4),r:2.2});}
  const gi=new THREE.Group();g.add(gi);CV.interior=gi;
  // ---- 室內：舞台、大蛋糕、氣球、彩旗、餐桌、吃飯的龍蝦 ----
  const st=mk(new THREE.BoxGeometry(4,0.7,10),toon(0xd8a880,{map:TEX.wood}),X-W+2.3,0.35,Z);gi.add(st);
  {const ck=new THREE.Group();[[1.6,0.9,0xfff3e6],[1.2,0.8,0xffd6e2],[0.8,0.7,0xfff3e6]].reduce((y,[r,h,c])=>{ck.add(mk(new THREE.CylinderGeometry(r,r,h,24),toon(c),0,y+h/2,0));for(let i=0;i<10;i++){const a=i/10*6.28;ck.add(mk(new THREE.SphereGeometry(0.13,8,6),toon(0xff6f8f),Math.cos(a)*r,y+h,Math.sin(a)*r));}return y+h;},0);
   const six=textTex(['6'],'rgba(0,0,0,0)','#ff6f8f',128,128,110);const c6=mk(new THREE.PlaneGeometry(1.1,1.1),new THREE.MeshBasicMaterial({map:six,transparent:true,side:THREE.DoubleSide}),0,3.0,0);c6.rotation.y=Math.PI/2;c6.userData.dyn=true;ck.add(c6);
   ck.add(mk(new THREE.ConeGeometry(0.1,0.3,6),basic(0xffd36e),0,3.7,0));ck.position.set(X-W+2.3,0.7,Z);gi.add(ck);CV.cake=c6;}
  {const t=textTex(['🎉 龍蝦樂園 6 週年快樂！🎉'],'#ff8fb8','#ffffff',1024,128,72);const bn=mk(new THREE.PlaneGeometry(12,1.5),toon(0xffffff,{map:t}),X-W+T/2+0.06,5.2,Z);bn.rotation.y=Math.PI/2;bn.userData.dyn=true;gi.add(bn);for(const w of wallOf(X-W,Z))w.deco.push(bn);}
  const bal=[0xff9ec4,0xffd36e,0x8fdcb4,0x8fd0ff,0xb9a6f2,0xff8f7a];
  for(const[bx,bz]of[[X-W+1,Z-D+1],[X-W+1,Z+D-1],[X+W-1,Z-D+1],[X+W-1,Z+D-1],[X-W+2.3,Z-5.5],[X-W+2.3,Z+5.5]])for(let i=0;i<6;i++){const y=2.6+(i%3)*0.5;{const bb=mk(new THREE.SphereGeometry(0.4,12,10),toon(bal[(i+(bx|0))%6]),bx+Math.cos(i)*0.4,y,bz+Math.sin(i)*0.4);bb.scale.y=1.15;gi.add(bb);}}
  for(let r=0;r<3;r++){const z0=Z-D+3+r*5;for(let k=0;k<=20;k++){const x=X-W+1+k*(W*2-2)/20;const y=6.1-Math.sin(k/20*Math.PI)*0.8;const f=mk(new THREE.ConeGeometry(0.25,0.5,3),toon(bal[k%6]),x,y,z0);f.rotation.x=Math.PI;gi.add(f);}}
  for(const xx of[-3,4]){const ch=mk(new THREE.TorusGeometry(1.4,0.08,6,24),toon(0xf6c35a),X+xx,5.6,Z);ch.rotation.x=Math.PI/2;gi.add(ch);for(let i=0;i<8;i++){const a=i/8*6.28;gi.add(mk(new THREE.SphereGeometry(0.14,8,6),basic(0xfff3c0),X+xx+Math.cos(a)*1.4,5.75,Z+Math.sin(a)*1.4));}}
  // 餐桌與客人
  const looks=[{body:'#f0874f',accent:'#6e3428'},{body:'#ff8fa3',accent:'#8a2a4a'},{body:'#ffb3a0',accent:'#8a3a3a'},{body:'#ffd36e',accent:'#8a5a1a'},{body:'#e9773e',accent:'#4a2a1a'},{body:'#ff9ec4',accent:'#6a2a4a'},{body:'#c4b2f0',accent:'#4a3268'},{body:'#8fd0ff',accent:'#2a4a8a'}];
  const eyes=['round','dot','big','oval','star','smile'],mouths=['w','open','smile','w','o'];let n=0;
  for(const tx of[-4.5,0,4.5])for(const tz of[-4.6,4.6]){const cx=X+tx,cz=Z+tz;const tb=new THREE.Group();tb.add(mk(new THREE.CylinderGeometry(1.25,1.25,0.12,24),toon(0xffffff),0,1.05,0));tb.add(mk(new THREE.CylinderGeometry(1.3,1.3,0.06,24),toon(0xff8fb8),0,0.98,0));
    tb.add(mk(new THREE.CylinderGeometry(0.14,0.3,1.0,10),toon(0xd8a880),0,0.5,0));
    for(let i=0;i<3;i++){const a=i/3*6.28+0.5;const bw=mk(new THREE.CylinderGeometry(0.24,0.16,0.18,14),toon(0xfff6ea),Math.cos(a)*0.7,1.2,Math.sin(a)*0.7);tb.add(bw);tb.add(mk(new THREE.CylinderGeometry(0.2,0.2,0.04,12),toon(i%2?0xffc46a:0xff8f6f),Math.cos(a)*0.7,1.29,Math.sin(a)*0.7));}
    tb.add(mk(new THREE.ConeGeometry(0.28,0.4,10),toon(0xfff3e6),0,1.32,0));tb.add(mk(new THREE.SphereGeometry(0.1,8,6),toon(0xff4d6d),0,1.55,0));
    tb.position.set(cx,0,cz);shadowAll(tb);gi.add(tb);obstacles.push({x:cx,z:cz,r:1.35});
    for(let i=0;i<3;i++){const a=i/3*Math.PI*2+0.5+(tz>0?Math.PI/3:0);const dx=Math.cos(a)*1.85,dz=Math.sin(a)*1.85;
      const lk=Object.assign({species:n%5===3?'hamster':'lobster',eyes:eyes[n%6],mouth:mouths[n%5],blushShape:'oval'},looks[n%8]);const c=makeCritter(lk,false);c.setFace('happy');
      c.g.userData.dyn=true;c.g.position.set(cx+dx,0.25,cz+dz);c.g.rotation.y=Math.atan2(-dx,-dz);gi.add(c.g);gi.add(mk(new THREE.CylinderGeometry(0.5,0.5,0.25,12),toon(0xd8a880),cx+dx,0.12,cz+dz));
      CV.diners.push({c,pose:newPose(),ph:Math.random()*6,x:cx+dx,z:cz+dz});n++;}}
  // （服務生已移除）
  // 室內光
  CV.lightPos={x:X,z:Z};
  g.traverse(o=>{if(o.isMesh&&o.material!==HM.glass){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);batchStatic(gi);
  obstacles.push({x:X,z:Z,r:Math.hypot(W,D)+3,box:{ry:0,hw:W+3.5,hd:D+3.5},navOnly:true});
  CV.inside=(x,z,m=0)=>Math.abs(x-X)<W-m&&Math.abs(z-Z)<D-m;CV.door={x:X+W+2,z:Z};}
 PARKV.poi=[];for(let t=0;t<400&&PARKV.poi.length<40;t++){const a=Math.random()*Math.PI*2,d=4+Math.random()*(C.r-8);const p=at(a,d);if(farFrom(p.x,p.z,1.5)&&!nearCastle(p.x,p.z,3)&&!PARKV.coasterIn(p.x,p.z))PARKV.poi.push(p);}
 for(const p of[PARKV.ferris.exit,PARKV.gateIn,PARKV.coaster.exit])PARKV.poi.push(p);}
sign(-7.8,-30.3,0.464,['🎡 龍蝦樂園','↑ 往這邊走']);
// ---------- 轉蛋機 ----------
const GACHAS=[];
function gachaMachine(x,z,ry){const g=new THREE.Group();const pk=toon(0xff9ec4);
  g.add(mk(new THREE.BoxGeometry(1.4,1.3,1.2),pk,0,0.65,0));g.add(mk(new THREE.BoxGeometry(1.5,0.12,1.3),toon(0xffffff),0,1.32,0));
  const dome=mk(new THREE.SphereGeometry(0.78,24,16),new THREE.MeshBasicMaterial({color:0xeaf6ff,transparent:true,opacity:0.28,depthWrite:false}),0,2.1,0);dome.renderOrder=5;g.add(dome);
  const rim=mk(new THREE.TorusGeometry(0.62,0.06,6,24),toon(0xffffff),0,1.48,0);rim.rotation.x=Math.PI/2;g.add(rim);
  const cc=[0xff9ec4,0xffd36e,0x8fdcb4,0x8fd0ff,0xb9a6f2,0xff8f7a];const pos=[];
  for(let t=0;t<200&&pos.length<11;t++){const x=(Math.random()-0.5)*1.0,y=1.62+Math.random()*0.75,z=(Math.random()-0.5)*1.0;if(Math.hypot(x,y-2.1,z)>0.78-0.19-0.05||y<1.6)continue;if(pos.some(p=>Math.hypot(p[0]-x,p[1]-y,p[2]-z)<0.36))continue;pos.push([x,y,z]);}
  pos.forEach((p,i)=>g.add(mk(new THREE.SphereGeometry(0.18,12,10),toon(cc[i%6]),p[0],p[1],p[2])));
  g.add(mk(new THREE.SphereGeometry(0.2,10,8),toon(0xffd36e),0,2.85,0));
  const kn=mk(new THREE.CylinderGeometry(0.22,0.22,0.12,14),toon(0xffffff),0.25,0.9,0.62);kn.rotation.x=Math.PI/2;g.add(kn);g.add(mk(new THREE.BoxGeometry(0.42,0.32,0.08),toon(0x6a4a5a),-0.3,0.35,0.6));
  g.add(mk(new THREE.CircleGeometry(0.28,20),toon(0xffd36e),0,1.05,0.61));
  g.position.set(x,H(x,z),z);g.rotation.y=ry;shadowAll(g);dome.castShadow=false;scene.add(g);obstacles.push({x,z,r:0.8});GACHAS.push({x,z,ry,front:{x:x+Math.sin(ry)*1.4,z:z+Math.cos(ry)*1.4}});}
gachaMachine(-3,-7,0.3);
{const p={x:PARKV.gateIn.x+Math.cos(PARKV.gateYaw)*4,z:PARKV.gateIn.z-Math.sin(PARKV.gateYaw)*4};gachaMachine(p.x,p.z,PARKV.gateYaw+Math.PI);}
// ---------- 種樹、石頭 ----------
const okSpot=(x,z,r)=>Math.hypot(x,z)>=r&&Math.hypot(x-HOME.x,z-HOME.z)>=12&&Math.hypot(x-PARK.x,z-PARK.z)>=PARK.r+5&&Math.hypot(x-POND.x,z-POND.z)>=POND.r+5&&Math.hypot(x-CAVE_DOOR.x,z-CAVE_DOOR.z)>=18&&Math.hypot(x-V2.x,z-V2.z)>=r+30&&Math.hypot(x-V3.x,z-V3.z)>=r+14&&!PATHS.some(p=>segDist(x,z,...p)<4);
for(let i=0;i<26;i++){const a=SR(0,6.28),d=SR(17,24);const x=Math.cos(a)*d,z=Math.sin(a)*d;if(okSpot(x,z,16)&&farFrom(x,z,2.2))tree(x,z,SR(0.85,1.2),rnd()<0.35?'cherry':rnd()<0.3?'fruit':'broad');}
for(let i=0;i<22;i++){const a=SR(0,6.28),d=SR(39,45);const x=V2.x+Math.cos(a)*d,z=V2.z+Math.sin(a)*d;if(farFrom(x,z,2.2)&&!onPath(x,z))tree(x,z,SR(0.85,1.2),rnd()<0.5?'cherry':'fruit');}
for(let i=0;i<300;i++){const x=SR(-112,112),z=SR(-112,112);if(!okSpot(x,z,22))continue;
  if(ZONE.meadow(x,z)&&rnd()<0.88)continue;const wild=x>50;if(!wild&&rnd()<0.45)continue;if(!farFrom(x,z,2.6))continue;
  tree(x,z,SR(0.8,1.3),wild?(rnd()<0.7?'pineW':'pine'):(rnd()<0.25?'cherry':rnd()<0.25?'pine':rnd()<0.2?'fruit':'broad'));}
for(let i=0;i<70;i++){const x=SR(-110,110),z=SR(-110,110);if(!okSpot(x,z,16)||!farFrom(x,z,1.5))continue;rock(x,z,SR(0.6,1.4));}
for(let i=0;i<6;i++){const a=SR(0,6.28);const x=Math.cos(a)*13,z=Math.sin(a)*13+3;if(farFrom(x,z,1.5)&&!onPath(x,z)&&!inHouse(x,z,-2))rock(x,z,SR(0.6,0.9));}
// ---------- 草叢、灌木、小花（色塊細節） ----------
{const blade=mergeGeos([0,1,2,3,4].map(i=>{const a=i*1.26;return[new THREE.ConeGeometry(0.06,0.55,3),M4(Math.cos(a)*0.08,0.26,Math.sin(a)*0.08,Math.sin(a)*0.35,0,-Math.cos(a)*0.35,1,0.7+((i*37)%5)*0.12,1)];}));
 const N=2600,im=new THREE.InstancedMesh(blade,toon(0xffffff),N),m=new THREE.Matrix4(),col=new THREE.Color(),q=new THREE.Quaternion(),e=new THREE.Euler();let k=0;
 const pal=[0x6cbf4e,0x7fcc58,0x5aad48,0x8fd862];
 for(let t=0;t<N*3&&k<N;t++){const x=SR(-110,110),z=SR(-110,110);if(onPath(x,z)||Math.hypot(x-POND.x,z-POND.z)<POND.r+0.5)continue;if(Math.hypot(x,z)<8||inHouse(x,z,-1)||Math.hypot(x-PARK.x,z-PARK.z)<PARK.r+1||Math.hypot(x-V2.x,z-V2.z)<15||Math.hypot(x-V3.x,z-V3.z)<13)continue;
   const sc=SR(0.8,1.6);q.setFromEuler(e.set(0,SR(0,6.28),0));m.compose(new THREE.Vector3(x,H(x,z)-0.05,z),q,new THREE.Vector3(sc,sc,sc));im.setMatrixAt(k,m);
   col.setHex(pal[(rnd()*4)|0]);if(x>45)col.lerp(new THREE.Color(0x4f9a74),0.6);im.setColorAt(k,col);k++;}
 im.count=k;im.receiveShadow=true;scene.add(im);}
{const bushG=mergeGeos([[new THREE.SphereGeometry(0.7,12,8),M4(0,0.45,0,0,0,0,1.1,0.8,1)],[new THREE.SphereGeometry(0.5,10,7),M4(0.6,0.35,0.2)],[new THREE.SphereGeometry(0.5,10,7),M4(-0.55,0.32,-0.1)]]);
 const N=170,im=new THREE.InstancedMesh(bushG,toon(0xffffff),N),m=new THREE.Matrix4(),col=new THREE.Color(),q=new THREE.Quaternion(),e=new THREE.Euler();let k=0;const pal=[0x5fae4c,0x6fbc56,0x4f9e48];
 for(let t=0;t<N*4&&k<N;t++){const x=SR(-110,110),z=SR(-110,110);if(!okSpot(x,z,12)||!farFrom(x,z,1.2))continue;const sc=SR(0.7,1.4);q.setFromEuler(e.set(0,SR(0,6.28),0));
   m.compose(new THREE.Vector3(x,H(x,z),z),q,new THREE.Vector3(sc,sc,sc));im.setMatrixAt(k,m);col.setHex(pal[(rnd()*3)|0]);im.setColorAt(k,col);k++;}
 im.count=k;im.castShadow=true;im.receiveShadow=true;scene.add(im);}
{const petal=mergeGeos([0,1,2,3,4].map(i=>{const a=i*1.2566;return[new THREE.CircleGeometry(0.09,6),M4(Math.cos(a)*0.08,0.22,Math.sin(a)*0.08,-Math.PI/2,0,0)];}).concat([[new THREE.CylinderGeometry(0.012,0.012,0.22,4),M4(0,0.11,0)]]));
 const N=900,im=new THREE.InstancedMesh(petal,toon(0xffffff,{side:THREE.DoubleSide}),N),m=new THREE.Matrix4(),col=new THREE.Color(),q=new THREE.Quaternion();let k=0;const pal=[0xffffff,0xffd0e0,0xfff08a,0xd8c8ff,0xff9ec0];
 for(let t=0;t<N*3&&k<N;t++){let x,z;const r=rnd();if(r<0.5){x=SR(-72,42);z=SR(-78,-14);}else{x=SR(-110,110);z=SR(-110,110);}if(onPath(x,z)||inHouse(x,z,-1)||Math.hypot(x-PARK.x,z-PARK.z)<PARK.r+1||Math.hypot(x-POND.x,z-POND.z)<POND.r+0.5)continue;
   q.identity();const sc=SR(0.8,1.3);m.compose(new THREE.Vector3(x,H(x,z),z),q,new THREE.Vector3(sc,sc,sc));im.setMatrixAt(k,m);col.setHex(pal[(rnd()*5)|0]);im.setColorAt(k,col);k++;}
 im.count=k;scene.add(im);}
// 雲、星星、月亮
const clouds=[];{const cm=toon(0xffffff,{emissive:0x5a6878,fog:false}),cm2=toon(0xf2f8ff,{emissive:0x46566a,fog:false});
 for(let i=0;i<34;i++){const g=new THREE.Group();const n=4+((rnd()*5)|0),big=SR(1,1.8);for(let k=0;k<n;k++){const r=SR(3.5,6.5)*big;const s=mk(new THREE.SphereGeometry(r,14,10),k%3?cm:cm2,(k-n/2)*3.6*big+SR(-1,1),SR(0,2.5)*big,SR(-2.5,2.5)*big);s.scale.y=0.62;g.add(s);}
  const flat=mk(new THREE.CylinderGeometry(n*2.2*big,n*2.2*big,0.6,16),cm2,0,-1.5*big,0);flat.scale.z=0.45;g.add(flat);
  const a=SR(0,6.28),d=SR(60,280);g.position.set(Math.cos(a)*d,SR(52,95),Math.sin(a)*d);g.rotation.y=SR(0,3);scene.add(g);batchStatic(g);clouds.push(g);}}
// 遠方的地面與山（空氣感淡化）
{const og=mk(new THREE.RingGeometry(112,900,64,1),toon(0x7fbd52),0,-6,0);og.rotation.x=-Math.PI/2;og.receiveShadow=false;scene.add(og);
 const mtn=new THREE.Group();const mc=[0x9cc4e2,0x8db8dc,0xa8cde8];
 for(let i=0;i<40;i++){const a=i/40*Math.PI*2+SR(-0.05,0.05),d=SR(330,420),h=SR(40,110),r=SR(45,90);const m=mk(new THREE.ConeGeometry(r,h,7),new THREE.MeshBasicMaterial({color:mc[i%3],fog:false}),Math.cos(a)*d,h/2-6,Math.sin(a)*d);m.rotation.y=SR(0,3);mtn.add(m);
   const cap=mk(new THREE.ConeGeometry(r*0.32,h*0.32,7),new THREE.MeshBasicMaterial({color:0xdbeaf6,fog:false}),Math.cos(a)*d,h-6-h*0.16+0.5,Math.sin(a)*d);cap.rotation.y=m.rotation.y;if(h>80)mtn.add(cap);}
 mtn.renderOrder=-5;scene.add(mtn);batchStatic(mtn);var MOUNTAINS=mtn;}
// ---------- 岩壁與岩塊（灰色層狀岩，頂端長草） ----------
function rockMass(list,grassTop=true){const pos=[],nor=[],col=[];const top=new THREE.Color(0x84c252),topR=new THREE.Color(0xc6ced0),side=new THREE.Color(0xa3aeb4),side2=new THREE.Color(0x8794a0),c=new THREE.Color();
  for(const[x,y,z,w,h,d,ry,gt]of list){const segs=Math.max(2,Math.round(h/1.1));const geo0=new THREE.CylinderGeometry(0.5,0.56,h,7,segs);geo0.scale(w,1,d);const geo=geo0.toNonIndexed();geo0.dispose();const p=geo.attributes.position;const sd=x*0.37+z*0.71;
    for(let k=0;k<p.count;k++){let px=p.getX(k),py=p.getY(k),pz=p.getZ(k);const ang=Math.atan2(pz,px);const rj=1+0.13*Math.sin(ang*3+sd)+0.07*Math.sin(ang*5+sd*2);const layer=Math.round((py+h/2)/(h/segs));const band=(layer%2?0.05:-0.03)+0.04*Math.sin(layer*2.1+sd);
      const top=py>h/2-0.01;const f=top?rj*0.96:rj*(1+band);p.setXYZ(k,px*f,py,pz*f);}
    geo.computeVertexNormals();geo.applyMatrix4(M4(x,y,z,0,ry,0));const pp=geo.attributes.position,nn=geo.attributes.normal;
    for(let k=0;k<pp.count;k++){pos.push(pp.getX(k),pp.getY(k),pp.getZ(k));nor.push(nn.getX(k),nn.getY(k),nn.getZ(k));const ny=nn.getY(k);
      if(ny>0.6)c.copy((gt??grassTop)?top:topR);else{c.copy(side).lerp(side2,0.5+0.5*Math.sin((pp.getY(k))*1.7+sd));}col.push(c.r,c.g,c.b);}geo.dispose();}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(g,toon(0xffffff,{vertexColors:true}));m.castShadow=m.receiveShadow=true;scene.add(m);return m;}
{// 世界邊界的高崖（像山谷一樣圍起來）
 const L=[];for(const side of[0,1,2,3])for(let t=-126;t<=126;t+=9){const off=SR(-2,2),h=SR(9,20),w=SR(9,14),d=SR(8,13);const e=121+SR(0,6);
   const[x,z]=side===0?[t+off,-e]:side===1?[t+off,e]:side===2?[-e,t+off]:[e,t+off];L.push([x,(h+5.5)/2-7,z,w,h+5.5,d,SR(-0.2,0.2)]);
   if(rnd()<0.5)L.push([x+SR(-3,3),h+SR(-1,2),z+SR(-3,3),w*0.6,SR(3,6),d*0.6,SR(-0.4,0.4)]);}
 rockMass(L);
 // 草原上的岩塊（有高低差的地方）
 const R2=[];let tries=0;while(R2.length<60&&tries++<3000){const x=SR(-108,108),z=SR(-108,108);if(!okSpot(x,z,20)||!farFrom(x,z,3.5)||Math.hypot(x-PARK.x,z-PARK.z)<PARK.r+8)continue;
   const h0=H(x,z),sl=Math.abs(H(x+2,z)-H(x-2,z))+Math.abs(H(x,z+2)-H(x,z-2));if(h0<0.6&&sl<0.6&&rnd()<0.85)continue;
   const big=rnd()<0.35,w=big?SR(4,7):SR(1.6,3.2),hh=big?SR(2.5,4.5):SR(0.8,1.8),d=w*SR(0.6,1.1);const ry=SR(0,3);R2.push([x,h0+hh/2-0.5,z,w,hh,d,ry,big]);
   if(big&&rnd()<0.6)R2.push([x+SR(-1.5,1.5),h0+hh+0.3,z+SR(-1.5,1.5),w*0.55,SR(1,2),d*0.55,ry+0.3,true]);
   obstacles.push({x,z,r:Math.max(w,d)*0.5+0.1});}
 rockMass(R2,false);}
// 小石子（地面細節）
{const pg=new THREE.DodecahedronGeometry(0.18,0);const N=520,im=new THREE.InstancedMesh(pg,toon(0xffffff),N),m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),col=new THREE.Color();let k=0;
 for(let t=0;t<N*3&&k<N;t++){const x=SR(-110,110),z=SR(-110,110);if(inHouse(x,z,-1)||Math.hypot(x-PARK.x,z-PARK.z)<PARK.r+1||Math.hypot(x-V2.x,z-V2.z)<16||Math.hypot(x-POND.x,z-POND.z)<POND.r)continue;
   const s=SR(0.5,1.6);q.setFromEuler(e.set(SR(0,3),SR(0,3),SR(0,3)));m.compose(new THREE.Vector3(x,H(x,z)+0.02,z),q,new THREE.Vector3(s,s*0.6,s));im.setMatrixAt(k,m);col.setHex([0xb8c0c2,0xa6b0b6,0xc8ccc4][(rnd()*3)|0]);im.setColorAt(k,col);k++;}
 im.count=k;im.receiveShadow=true;scene.add(im);}
const starMat=new THREE.PointsMaterial({color:0xfff0fa,size:2,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false});
const stars=(()=>{const p=[];for(let i=0;i<550;i++){const u=Math.random()*6.28,v=Math.random()*1.3;p.push(Math.cos(u)*Math.cos(v)*300,Math.sin(v)*300+10,Math.sin(u)*Math.cos(v)*300);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));const s=new THREE.Points(g,starMat);scene.add(s);return s;})();
const moon=mk(new THREE.SphereGeometry(9,16,12),basic(0xfff3e0,{fog:false}));scene.add(moon);

// ---------- 雜草（沒有圓球了） ----------
const weedG=new THREE.ConeGeometry(0.11,0.85,4),weedM=toon(0x5fae4c),weeds=[],weedTimers=[];
function weedSpot(){for(let k=0;k<40;k++){const x=R(-68,38),z=R(-74,-18);if(farFrom(x,z,0.8)&&Math.hypot(x-PARK.x,z-PARK.z)>PARK.r+3&&Math.hypot(x-ply.x,z-ply.z)>6&&!weeds.some(w=>Math.hypot(w.x-x,w.z-z)<2)&&!farmAt(x,z))return[x,z];}return[R(-60,30),R(-70,-20)];}
function spawnWeed(){const[x,z]=weedSpot(),g=new THREE.Group();
  for(let i=0;i<6;i++){const b=mk(weedG,weedM,R(-0.2,0.2),0.35,R(-0.2,0.2));b.rotation.set(R(-0.5,0.5),R(0,3),R(-0.5,0.5));b.scale.set(1,R(0.8,1.3),0.4);g.add(b);}
  g.position.set(x,H(x,z),z);g.ph=Math.random()*6;g.scale.setScalar(0.01);g.grow=0;shadowAll(g);scene.add(g);batchStatic(g);weeds.push({x,z,g});}

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
  if(Math.hypot(x-V2.x,z-V2.z)<24||inHouse(x,z,-1.5)||Math.hypot(x-PARK.x,z-PARK.z)<PARK.r+2)return false;if(Math.abs(x)>110||Math.abs(z)>110)return false;return farFrom(x,z,0.7)&&!weeds.some(w=>Math.hypot(w.x-x,w.z-z)<1);}
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
  else if(id==='plush'){const c=makeCritter({species:'lobster',body:'#f0874f',accent:'#6e3428',mouth:'w',eyes:'round',blushShape:'oval'},false);c.setFace('happy');
    c.g.scale.setScalar(0.42);c.legs.forEach((l,i)=>{l.rotation.x=-1.3;});g.add(c.g);g.add(mk(new THREE.CylinderGeometry(0.42,0.46,0.06,16),toon(0xffd6e6),0,0.03,0));}
  else if(id==='shelf'){g.add(mk(new THREE.BoxGeometry(1.6,2,0.5),wd,0,1,0));const bc=[0xff9ec7,0x8fdcb4,0xb9a6f2,0xffd36e,0x8fd0ff];
    for(let r=0;r<2;r++)for(let i=0;i<5;i++)g.add(mk(new THREE.BoxGeometry(0.2,0.5,0.35),toon(bc[(i+r*2)%5]),-0.55+i*0.27,0.6+r*0.75,0.08));}
  return g;
}
function placeFurn(id,x,z,ry,fx=true,y=null){
  if(y===null||y===true||y===false)y=supportY(x,z);
  const g=buildFurn(id);g.position.set(x,y,z);g.rotation.y=ry;shadowAll(g);scene.add(g);
  const o={x,z,r:ITEMS[id].r*fsOf(id),y};obstacles.push(o);const p={id,x,z,y,ry,g,o,pop:fx?0:1,indoor:false};placed.push(p);
  if(id==='lantern'||id==='campfire'){const L=lightPool.find(l=>!l.used);if(L){L.used=p;p.light=L.L;L.L.position.set(x,y+(id==='lantern'?2.4:1.2),z);}}
  if(fx){g.scale.setScalar(0.01);}
  return p;
}
function removeFurn(p){scene.remove(p.g);const i=placed.indexOf(p);if(i>=0)placed.splice(i,1);const oi=obstacles.indexOf(p.o);if(oi>=0)obstacles.splice(oi,1);
  if(p.light){const L=lightPool.find(l=>l.used===p);if(L){L.used=null;L.L.intensity=0;L.L.position.y=-50;}}}
function defaultInterior(){const X=HOME.x,Z=HOME.z;
  placeFurn('bed',X-HOME.w+1.9,Z+HOME.d-1.6,Math.PI/2,false);
  placeFurn('table',X+1.2,Z+3.0,0,false);
  placeFurn('chair',X-0.7,Z+3.0,Math.PI/2,false);placeFurn('chair',X+3.1,Z+3.0,-Math.PI/2,false);
  placeFurn('shelf',X-3.2,Z-HOME.d+0.75,0,false);placeFurn('rug',X-1.0,Z-0.6,0,false);
  placeFurn('bathtub',X+3.6,Z-3.8,0,false);
}
// ---------- 木方塊（建築） ----------
const BLK=0.8,blocks=new Map(),bKey=(i,j,k)=>i+','+j+','+k;
const blockTex=canvasTex(64,64,(g)=>{g.fillStyle='#e2b07c';g.fillRect(0,0,64,64);g.fillStyle='#d49c66';for(let y=0;y<64;y+=16)g.fillRect(0,y+14,64,2);
  g.fillStyle='#c98d58';for(let y=0;y<64;y+=16)g.fillRect(((y*7)%48)+8,y,2,14);g.strokeStyle='#b97e4c';g.lineWidth=4;g.strokeRect(2,2,60,60);});
blockTex.wrapS=blockTex.wrapT=THREE.ClampToEdgeWrapping;blockTex.magFilter=THREE.NearestFilter;
const blockIM=new THREE.InstancedMesh(new THREE.BoxGeometry(BLK,BLK,BLK),toon(0xffffff,{map:blockTex}),3000);blockIM.count=0;blockIM.castShadow=blockIM.receiveShadow=true;blockIM.frustumCulled=false;scene.add(blockIM);
function rebuildBlocks(){const m=new THREE.Matrix4();let n=0;for(const b of blocks.values()){if(n>=3000)break;m.makeTranslation(b.i*BLK,b.j*BLK+BLK/2,b.k*BLK);blockIM.setMatrixAt(n++,m);}blockIM.count=n;blockIM.instanceMatrix.needsUpdate=true;}
const bCell=(x,z)=>[Math.round(x/BLK),Math.round(z/BLK)];
function baseJ(i,k){const x=i*BLK,z=k*BLK,h=BLK*0.45;const mn=Math.min(H(x-h,z-h),H(x+h,z-h),H(x-h,z+h),H(x+h,z+h),H(x,z));return Math.floor((mn+0.03)/BLK);}
function colTopJ(i,k){let t=-1e9;for(const b of blocks.values())if(b.i===i&&b.k===k&&b.j>t)t=b.j;return t;}
function supportY(x,z){const[i,k]=bCell(x,z);const t=colTopJ(i,k);const g=Math.max(H(x,z),inHouse(x,z)?0.02:-1e9);return t>-1e9?Math.max(g,(t+1)*BLK):g;}
function addBlock(i,j,k){blocks.set(bKey(i,j,k),{i,j,k});rebuildBlocks();}
function delBlock(i,j,k){blocks.delete(bKey(i,j,k));rebuildBlocks();for(const p of placed){const y=supportY(p.x,p.z);if(Math.abs(y-p.y)>0.01&&Math.round(p.x/BLK)===i&&Math.round(p.z/BLK)===k){p.y=y;p.o.y=y;p.g.position.y=y;}}}
// 角色站立高度（含方塊）
function standY(x,z,y,r=0.28){let best=Math.max(H(x,z),inHouse(x,z)?0.02:-1e9);if(!blocks.size)return best;
  const i0=Math.round((x-r)/BLK),i1=Math.round((x+r)/BLK),k0=Math.round((z-r)/BLK),k1=Math.round((z+r)/BLK);
  for(let i=i0;i<=i1;i++)for(let k=k0;k<=k1;k++){const cx=i*BLK,cz=k*BLK;if(Math.abs(x-cx)>BLK/2+r-0.05||Math.abs(z-cz)>BLK/2+r-0.05)continue;
    for(const b of blocks.values()){if(b.i!==i||b.k!==k)continue;const top=(b.j+1)*BLK;if(top<=y+0.3&&top>best)best=top;}}return best;}
// 水平碰撞（比腳高的方塊擋住）
function pushBlocks(o,y,r=0.42,hgt=1.3){if(!blocks.size)return;const i0=Math.round((o.x-r)/BLK)-1,i1=Math.round((o.x+r)/BLK)+1,k0=Math.round((o.z-r)/BLK)-1,k1=Math.round((o.z+r)/BLK)+1;
  for(const b of blocks.values()){if(b.i<i0||b.i>i1||b.k<k0||b.k>k1)continue;const by=b.j*BLK;if(by+BLK<=y+0.3||by>=y+hgt)continue;
    const x0=b.i*BLK-BLK/2,x1=x0+BLK,z0=b.k*BLK-BLK/2,z1=z0+BLK;const cx=clamp(o.x,x0,x1),cz=clamp(o.z,z0,z1),dx=o.x-cx,dz=o.z-cz,d=Math.hypot(dx,dz);
    if(d<r){if(d>1e-4){o.x=cx+dx/d*r;o.z=cz+dz/d*r;}else{const l=o.x-x0,rr=x1-o.x,bb=o.z-z0,t=z1-o.z,m=Math.min(l,rr,bb,t);if(m===l)o.x=x0-r;else if(m===rr)o.x=x1+r;else if(m===bb)o.z=z0-r;else o.z=z1+r;}}}}
function headBlocked(x,z,y){if(!blocks.size)return false;const[i,k]=bCell(x,z);const j=Math.floor((y+1.35)/BLK);return blocks.has(bKey(i,j,k));}

// ---------- 村莊廣場、農田 ----------
const plazaTex=canvasTex(256,256,(g)=>{g.fillStyle='#e8cfa4';g.fillRect(0,0,256,256);const cs=['#f2dcb4','#e0c494','#ead2a8','#d8b88a'];
  for(let y=0;y<256;y+=32)for(let x=(y/32)%2?-16:0;x<256;x+=32){g.fillStyle=cs[((x*7+y*3)>>4)%4];g.beginPath();g.roundRect?g.roundRect(x+2,y+2,28,28,6):g.rect(x+2,y+2,28,28);g.fill();}},[6,6]);
for(const[V,r]of[[V2,13],[V3,11]]){const m=mk(new THREE.CircleGeometry(r,48),toon(0xffffff,{map:plazaTex,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),V.x,0.04,V.z);m.renderOrder=2;m.rotation.x=-Math.PI/2;m.receiveShadow=true;scene.add(m);
  const rim=mk(new THREE.RingGeometry(r,r+0.5,48),toon(0xc8a878,{polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),V.x,0.045,V.z);rim.renderOrder=2;rim.rotation.x=-Math.PI/2;scene.add(rim);}
const FIELDS=[];
function decoField(cx,cz,cols,rows,types){const spots=[];const fm=new THREE.Group();
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const x=cx+(i-(cols-1)/2)*TILE,z=cz+(j-(rows-1)/2)*TILE;const t=mk(soilG,soilM[(i+j)%3?'wet':'dry'],x,H(x,z)+0.04,z);t.receiveShadow=true;fm.add(t);
    const type=types[(i+j*cols)%types.length],st=2+((i*3+j)%2);const c=cropMesh(type,st);c.position.set(x,H(x,z)+0.1,z);c.rotation.y=(i*1.7+j)%6;fm.add(c);if(j===0||j===rows-1)spots.push({x,z:z+(j===0?-1.1:1.1)});}
  const post=new THREE.CylinderGeometry(0.07,0.08,0.8,6),rail=toon(0xe8d0b0);const W=cols*TILE/2+0.6,D=rows*TILE/2+0.6;
  for(const[x0,z0,x1,z1]of[[-W,-D,W,-D],[-W,D,W,D],[-W,-D,-W,D],[W,-D,W,D]]){const L=Math.hypot(x1-x0,z1-z0),n=Math.ceil(L/1.4);
    for(let k=0;k<=n;k++){const x=cx+lerp(x0,x1,k/n),z=cz+lerp(z0,z1,k/n);fm.add(mk(post,rail,x,H(x,z)+0.4,z));}
    const rl=mk(new THREE.BoxGeometry(L,0.07,0.06),rail,cx+(x0+x1)/2,H(cx,cz)+0.55,cz+(z0+z1)/2);rl.rotation.y=-Math.atan2(z1-z0,x1-x0);fm.add(rl);}
  shadowAll(fm);scene.add(fm);batchStatic(fm);FIELDS.push({cx,cz,spots});return spots;}
decoField(V2.x-31,V2.z-2,6,5,['carrot','tomato','pumpkin']);
decoField(V3.x+12,V3.z+22,6,4,['strawberry','carrot','pumpkin']);
decoField(V3.x-14,V3.z-24,5,4,['tomato','strawberry']);

shadowAll(LAMPG);batchStatic(LAMPG);
