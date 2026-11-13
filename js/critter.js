// ===================== critter.js：龍蝦精靈／倉鼠精靈／果凍怪，臉部貼圖與骨架 =====================
const FACE={phiS:Math.PI/2-0.95,phiL:1.9,thS:0.2*Math.PI,thL:0.52*Math.PI,W:512,H:384};
const faceGeo=new THREE.SphereGeometry(1,36,26,FACE.phiS,FACE.phiL,FACE.thS,FACE.thL);
function faceUV(X,Y){const th=Math.acos(clamp(Y,-1,1)),s=Math.max(0.25,Math.sin(th));const ph=Math.acos(clamp(-X/s,-1,1));
  return{x:(ph-FACE.phiS)/FACE.phiL*FACE.W,y:(th-FACE.thS)/FACE.thL*FACE.H,kx:FACE.W/(FACE.phiL*s),ky:FACE.H/(FACE.thL*s)};}
function heartPath(g,x,y,hs){g.beginPath();g.moveTo(x,y+hs*0.9);g.bezierCurveTo(x-hs*1.6,y-hs*0.1,x-hs*0.7,y-hs*1.3,x,y-hs*0.45);g.bezierCurveTo(x+hs*0.7,y-hs*1.3,x+hs*1.6,y-hs*0.1,x,y+hs*0.9);}
function starPath(g,x,y,r1,r2,n=4){g.beginPath();for(let k=0;k<n*2;k++){const a=k*Math.PI/n-Math.PI/2,r=k%2?r2:r1;g[k?'lineTo':'moveTo'](x+Math.cos(a)*r,y+Math.sin(a)*r);}g.closePath();}
function drawFace(g,o,mode,d){
  g.clearRect(0,0,FACE.W,FACE.H);
  const P=(x,y)=>faceUV(x/(d.RR*d.sx),(y-d.cy)/(d.RR*d.sy));
  const ux=(p,w)=>w/(d.RR*d.sx)*p.kx,uy=(p,w)=>w/(d.RR*d.sy)*p.ky;
  const dark='#2a1c18',eyeC=o.eyeColor||dark,es=o.eyeSize,gap=o.eyeGap,ey=o.eyeY;
  g.lineCap='round';g.lineJoin='round';
  if(o.shine){const p=P(-0.3,d.cy+0.34);g.fillStyle='rgba(255,255,255,.8)';g.beginPath();g.ellipse(p.x,p.y,ux(p,0.14),uy(p,0.07),-0.5,0,7);g.fill();
    g.beginPath();g.ellipse(p.x+ux(p,0.2),p.y-uy(p,0.04),ux(p,0.035),uy(p,0.03),0,0,7);g.fill();}
  const bsh=o.blushShape&&o.blushShape!=='none'?o.blushShape:(o.blush===true?'oval':'none');
  if(bsh!=='none'){const bs=o.blushSize||1,bg=o.blushGap||0.42,by=ey-(o.blushY??0.14),col=o.blushColor||'#ff8ca0';
    for(const s of[-1,1]){const p=P(s*bg,by);const rx=ux(p,0.11*bs),ry=uy(p,0.07*bs);g.fillStyle=col;g.strokeStyle=col;g.globalAlpha=bsh==='lines'?0.85:0.55;
      if(bsh==='oval'){g.beginPath();g.ellipse(p.x,p.y,rx,ry,0,0,7);g.fill();}
      else if(bsh==='round'){g.beginPath();g.ellipse(p.x,p.y,rx*0.75,ry*1.1,0,0,7);g.fill();}
      else if(bsh==='heart'){heartPath(g,p.x,p.y,rx*0.7);g.fill();}
      else if(bsh==='star'){starPath(g,p.x,p.y,rx*0.9,rx*0.35,5);g.fill();}
      else if(bsh==='lines'){g.lineWidth=uy(p,0.02);for(let k=-1;k<=1;k++){const cx=p.x+k*rx*0.55;g.beginPath();g.moveTo(cx+rx*0.2,p.y-ry*0.7);g.lineTo(cx-rx*0.2,p.y+ry*0.7);g.stroke();}}
      g.globalAlpha=1;}}
  for(const s of[-1,1]){const p=P(s*gap,ey);const rx=ux(p,0.085*es),ry=uy(p,0.1*es);let ex=rx,eyy=ry;
    if(mode==='sleep'||o.sleepy){g.strokeStyle=eyeC;g.lineWidth=uy(p,0.03);g.beginPath();g.moveTo(p.x-rx*1.15,p.y+ry*0.15);g.lineTo(p.x+rx*1.15,p.y+ry*0.15);g.stroke();}
    else if(mode==='happy'){g.strokeStyle=eyeC;g.lineWidth=uy(p,0.03);g.beginPath();g.arc(p.x,p.y+ry*0.5,rx*1.0,Math.PI*1.15,Math.PI*1.85);g.stroke();}
    else{const st=o.eyes||'round';g.fillStyle=eyeC;g.strokeStyle=eyeC;g.lineWidth=uy(p,0.03);
      if(st==='smile'){g.beginPath();g.arc(p.x,p.y+ry*0.5,rx*1.0,Math.PI*1.15,Math.PI*1.85);g.stroke();}
      else if(st==='line'){g.beginPath();g.moveTo(p.x-rx*1.15,p.y);g.lineTo(p.x+rx*1.15,p.y);g.stroke();}
      else if(st==='dot'){ex=rx*0.55;eyy=ry*0.55;g.beginPath();g.ellipse(p.x,p.y,ex,eyy,0,0,7);g.fill();}
      else if(st==='heart'){const hs=rx*1.1;g.fillStyle='#ff5a8a';heartPath(g,p.x,p.y,hs);g.fill();g.fillStyle='#fff';g.beginPath();g.arc(p.x-hs*0.45,p.y-hs*0.35,hs*0.18,0,7);g.fill();}
      else{if(st==='big'){ex*=1.15;eyy*=1.3;}if(st==='oval'){ex*=0.72;eyy*=1.45;}
        g.beginPath();g.ellipse(p.x,p.y,ex,eyy,0,0,7);g.fill();
        if(st==='big'){g.fillStyle='rgba(255,255,255,.25)';g.beginPath();g.ellipse(p.x,p.y+eyy*0.45,ex*0.7,eyy*0.38,0,0,7);g.fill();}
        g.fillStyle='#fff';
        if(st==='star'){starPath(g,p.x+ex*0.2,p.y-eyy*0.25,ex*0.55,ex*0.16,4);g.fill();}
        else{const hk=st==='big'?0.42:0.34;g.beginPath();g.ellipse(p.x+ex*0.28,p.y-eyy*0.36,ex*hk,eyy*hk*0.88,0,0,7);g.fill();g.beginPath();g.arc(p.x-ex*0.3,p.y+eyy*0.42,ex*(st==='big'?0.2:0.13),0,7);g.fill();}}
      const ln={one:1,two:2,three:3}[o.lash];
      if(ln){const L=uy(p,0.075*(o.lashSize||1)),spread=(o.lashGap??0.6)*0.5,base=lerp(0.12,0.45,o.lashY??0.5)*Math.PI;g.strokeStyle=eyeC;g.lineWidth=uy(p,0.024);
        for(let k=0;k<ln;k++){const a0=base+(k-(ln-1)/2)*spread;const ang=s>0?-a0:Math.PI+a0;const sx2=p.x+Math.cos(ang)*ex,sy2=p.y+Math.sin(ang)*eyy;
          const da=ang+(s>0?-0.25:0.25);g.beginPath();g.moveTo(sx2,sy2);g.lineTo(sx2+Math.cos(da)*L,sy2+Math.sin(da)*L);g.stroke();}}}
    if(o.brows){g.strokeStyle=dark;g.lineWidth=uy(p,0.032);g.beginPath();g.moveTo(p.x-s*rx*1.2,p.y-ry*1.6);g.lineTo(p.x+s*rx*0.8,p.y-ry*1.1);g.stroke();}
    const bw=o.brow;if(bw&&bw!=='none'){const bp=P(s*(o.browGap??0.22),ey+(o.browY??0.17));const L=ux(bp,0.11*(o.browSize||1)),T=uy(bp,0.03*(o.browSize||1));
      g.strokeStyle=o.browColor||eyeC;g.fillStyle=o.browColor||eyeC;
      if(bw==='round'){g.beginPath();g.ellipse(bp.x,bp.y,L*0.45,T*1.2,0,0,7);g.fill();}
      else{g.lineWidth=bw==='thick'?T*1.6:T*0.8;g.beginPath();
        if(bw==='angry'){g.moveTo(bp.x+s*L*0.6,bp.y-T*1.2);g.lineTo(bp.x-s*L*0.6,bp.y+T*1.2);}
        else if(bw==='worried'){g.moveTo(bp.x+s*L*0.6,bp.y+T*1.2);g.lineTo(bp.x-s*L*0.6,bp.y-T*1.2);}
        else{g.moveTo(bp.x-L*0.6,bp.y+T*0.4);g.quadraticCurveTo(bp.x,bp.y-T*1.4,bp.x+L*0.6,bp.y+T*0.4);}
        g.stroke();}}}
  const ms=o.mouthSize,mw=o.mouthW||1,p=P(0,ey-o.mouthY),X=w=>ux(p,w)*mw,Y=w=>uy(p,w);
  const mc=o.mouthColor||dark;g.strokeStyle=mc;g.fillStyle=mc;g.lineWidth=Y(0.03*Math.sqrt(ms));
  const m=(mode==='sleep'&&(o.mouth==='open'||o.mouth==='v'))?'o':o.mouth;
  if(m==='zigzag'){g.beginPath();for(let i=0;i<=6;i++){const x=p.x+X((-0.13+i*0.0433)*ms),y=p.y+Y((i%2?0.022:-0.01)*ms);i?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}
  else if(m==='smile'){g.beginPath();g.ellipse(p.x,p.y-Y(0.04*ms),X(0.065*ms),Y(0.065*ms),0,Math.PI*0.15,Math.PI*0.85);g.stroke();}
  else if(m==='w'){for(const s of[-1,1]){g.beginPath();g.ellipse(p.x+s*X(0.036*ms),p.y-Y(0.015*ms),X(0.036*ms),Y(0.036*ms),0,Math.PI*0.05,Math.PI*0.95);g.stroke();}}
  else if(m==='open'){g.beginPath();g.moveTo(p.x-X(0.065*ms),p.y-Y(0.02*ms));g.quadraticCurveTo(p.x,p.y+Y(0.13*ms),p.x+X(0.065*ms),p.y-Y(0.02*ms));g.closePath();g.fill();
    g.fillStyle='#ff8a9a';g.beginPath();g.ellipse(p.x,p.y+Y(0.04*ms),X(0.03*ms),Y(0.018*ms),0,0,7);g.fill();}
  else if(m==='v'){g.beginPath();g.moveTo(p.x-X(0.06*ms),p.y-Y(0.03*ms));g.lineTo(p.x+X(0.06*ms),p.y-Y(0.03*ms));g.lineTo(p.x,p.y+Y(0.06*ms));g.closePath();g.fill();}
  else if(m==='o'){g.beginPath();g.ellipse(p.x,p.y,X(0.035*ms),Y(0.035*ms),0,0,7);g.stroke();}
  else if(m==='line'){g.beginPath();g.moveTo(p.x-X(0.06*ms),p.y);g.lineTo(p.x+X(0.06*ms),p.y);g.stroke();}
}
const G={body:new THREE.SphereGeometry(0.8,32,24),leg:new THREE.CylinderGeometry(0.13,0.15,0.22,10),foot:new THREE.SphereGeometry(0.17,12,10),
  arm:new THREE.SphereGeometry(0.1,10,8),hand:new THREE.SphereGeometry(0.14,12,10),
  hornT:new THREE.TorusGeometry(0.21,0.085,8,16,Math.PI*0.95),hornCap:new THREE.SphereGeometry(0.085,8,6),patch:new THREE.BoxGeometry(0.11,0.11,0.03),
  horn:(()=>{const pts=[];const Hh=0.82,Rr=0.3;for(let i=20;i>=0;i--){const th=Math.PI*i/20;pts.push(new THREE.Vector2(Math.max(0.0001,Rr*Math.sin(th)*Math.sin(th/2)),Hh/2*Math.cos(th)+Hh/2));}return new THREE.LatheGeometry(pts,18);})(),
  hornTip:(()=>{const pts=[];const Hh=0.82,Rr=0.3;for(let i=6;i>=0;i--){const th=Math.PI*i/20;pts.push(new THREE.Vector2(Math.max(0.0001,Rr*1.06*Math.sin(th)*Math.sin(th/2)),Hh/2*Math.cos(th)+Hh/2+0.005));}return new THREE.LatheGeometry(pts,18);})(),
  nub:new THREE.SphereGeometry(0.14,10,8),tailSeg:new THREE.SphereGeometry(0.12,10,8),tailBall:new THREE.SphereGeometry(0.17,12,10),slime:new THREE.SphereGeometry(0.8,28,20)};
const DEF_LOOK={earSize:1,earGap:1,earY:0,tailSize:1,tailY:0,tailZ:0,name:'小蝦',species:'lobster',eyes:'round',tail:'seg',body:'#f0874f',accent:'#6e3428',ears:'round',eyeSize:1.1,eyeGap:0.22,eyeY:1.0,eyeColor:'#2a1c18',mouthColor:'#2a1c18',brow:'none',browSize:1,browGap:0.22,browY:0.17,lash:'none',lashSize:1,lashGap:0.6,lashY:0.5,mouth:'zigzag',mouthSize:1,mouthW:1,mouthY:0.15,blush:false,blushShape:'none',blushColor:'#ff8ca0',blushSize:1,blushGap:0.42,blushY:0.14,hat:'none'};
// ---------- 寶箱武器外觀 ----------
let SKM=null;
function buildSkins(T,G2){if(!SKM)SKM={dark:toon(0x3a3238),iron:toon(0x6a6470),flame:basic(0xff6a10),core:basic(0xffb83a),ember:basic(0xff3a10),
  silver:toon(0xd8d8ec),steel:toon(0x9a9ab8),volt:basic(0x9a5cff),voltW:basic(0xeadcff),jade:toon(0x3fae6c),jadeD:toon(0x1f5a3c),bone:toon(0xeae0c8),wind:basic(0xa8ffd0),
  ice:basic(0xbfe6ff),iceW:basic(0xf0faff),iceD:toon(0x7fb8e8),handle:toon(0x2e2c34)};const M=SKM;
  // 火焰之劍
  {const g=G2();g.add(mk(new THREE.CylinderGeometry(0.06,0.065,0.34,8),M.dark,0,0.1,0));g.add(mk(new THREE.SphereGeometry(0.085,8,6),M.iron,0,-0.09,0));
   const gd=mk(new THREE.BoxGeometry(0.5,0.1,0.14),M.iron,0,0.3,0);g.add(gd);for(const s of[-1,1]){const h=mk(new THREE.ConeGeometry(0.07,0.2,5),M.iron,s*0.27,0.36,0);h.rotation.z=-s*0.6;g.add(h);}
   const bl=mk(new THREE.CylinderGeometry(0.06,0.11,1.05,6),M.flame,0,0.88,0);bl.scale.z=0.35;g.add(bl);const cr=mk(new THREE.CylinderGeometry(0.025,0.05,0.95,6),M.core,0,0.86,0.03);cr.scale.z=0.4;g.add(cr);
   const tp=mk(new THREE.ConeGeometry(0.1,0.32,6),M.flame,0,1.55,0);tp.scale.z=0.35;g.add(tp);
   for(let i=0;i<5;i++){const s=i%2?1:-1;const f=mk(new THREE.ConeGeometry(0.05,0.22,5),i%2?M.ember:M.core,s*0.1,0.55+i*0.2,0);f.rotation.z=-s*0.5;f.scale.z=0.4;g.add(f);}T.flame=g;}
  // 雷電長槍
  {const g=G2();g.add(mk(new THREE.CylinderGeometry(0.04,0.045,2.2,8),M.steel,0,0.7,0));for(const y of[-0.2,0.4,1.1,1.55])g.add(mk(new THREE.CylinderGeometry(0.06,0.06,0.08,8),M.silver,0,y,0));
   const hd=mk(new THREE.ConeGeometry(0.1,0.62,4),M.silver,0,2.1,0);hd.scale.z=0.35;g.add(hd);const ed=mk(new THREE.ConeGeometry(0.05,0.5,4),M.volt,0,2.07,0.03);ed.scale.z=0.3;g.add(ed);
   for(const s of[-1,1]){const w=mk(new THREE.ConeGeometry(0.05,0.3,4),M.silver,s*0.12,1.78,0);w.rotation.z=s*2.4;g.add(w);}
   const zz=(x,y,r)=>{const b=mk(new THREE.BoxGeometry(0.025,0.16,0.025),M.volt,x,y,0.02);b.rotation.z=r;g.add(b);};
   for(let i=0;i<6;i++){zz(0.06*(i%2?1:-1),1.25+i*0.09,i%2?0.7:-0.7);}zz(-0.1,0.3,0.6);zz(-0.13,0.42,-0.6);zz(0.1,1.68,0.8);T.thunder=g;}
  // 旋風之弓
  {const g=G2();const arc=mk(new THREE.TorusGeometry(0.66,0.045,6,26,Math.PI*0.86),M.jade);arc.rotation.set(0,Math.PI/2,Math.PI/2+Math.PI*0.07);arc.position.z=-0.35;g.add(arc);
   const arc2=mk(new THREE.TorusGeometry(0.7,0.02,5,26,Math.PI*0.8),M.jadeD);arc2.rotation.copy(arc.rotation);arc2.rotation.z+=0.03;arc2.position.z=-0.37;g.add(arc2);
   g.add(mk(new THREE.CylinderGeometry(0.012,0.012,1.25,4),M.wind,0,0,0.24));g.add(mk(new THREE.CylinderGeometry(0.065,0.065,0.22,6),M.jadeD,0,0,0.29));
   for(const s of[-1,1]){const o=mk(new THREE.BoxGeometry(0.05,0.08,0.22),M.bone,0,s*0.32,0.14);o.rotation.x=s*0.6;g.add(o);const t=mk(new THREE.ConeGeometry(0.04,0.18,4),M.bone,0,s*0.2,0.3);t.rotation.x=s*-1.0;g.add(t);
     for(let k=0;k<2;k++){const d=mk(new THREE.OctahedronGeometry(0.045),M.wind,0,s*(0.68+k*0.08),0.05+k*0.06);d.scale.y=1.8;g.add(d);}}T.windbow=g;}
  // 冰凍之杖
  {const g=G2();g.add(mk(new THREE.CylinderGeometry(0.045,0.06,1.25,6),M.handle,0,0.52,0));const st=mk(new THREE.OctahedronGeometry(0.15),M.iceW,0,1.32,0);st.scale.y=1.6;g.add(st);g.userData.gem=st;
   for(let i=0;i<7;i++){const s=i%2?1:-1,k=(i/2)|0;const c=mk(new THREE.OctahedronGeometry(0.1),i%3?M.ice:M.iceD,s*(0.1+k*0.03),1.12+k*0.12,0);c.scale.set(0.7,2.4,0.45);c.rotation.z=-s*(0.5+k*0.08);g.add(c);}
   const tp=mk(new THREE.OctahedronGeometry(0.09),M.ice,0,1.62,0);tp.scale.y=2;g.add(tp);T.icestaff=g;}
}
function buildTools(hold){
  const T={},wood=toon(0xe0b48f),stoneC=toon(0xcfc6dc),pinkC=toon(0xff9f8a),cream=toon(0xffe9cf);
  const G2=()=>new THREE.Group();
  T.stick=G2();T.stick.add(mk(new THREE.CylinderGeometry(0.05,0.07,1.2,6),wood,0,0.55,0));{const lf=mk(new THREE.SphereGeometry(0.13,6,4),toon(0x8fd97a),0,1.05,0.08);lf.scale.set(1,0.4,1.6);T.stick.add(lf);}
  T.sword=G2();T.sword.add(mk(new THREE.CylinderGeometry(0.06,0.06,0.32,6),pinkC,0,0.12,0));T.sword.add(mk(new THREE.BoxGeometry(0.42,0.08,0.12),pinkC,0,0.3,0));
  T.sword.add(mk(new THREE.BoxGeometry(0.17,1.0,0.06),cream,0,0.85,0));{const tip=mk(new THREE.ConeGeometry(0.12,0.22,4),cream,0,1.46,0);tip.rotation.y=Math.PI/4;tip.scale.z=0.35;T.sword.add(tip);}
  T.churro=G2();{const dough=toon(0xd9924a),sug=toon(0xfff3dc);T.churro.add(mk(new THREE.CylinderGeometry(0.11,0.12,0.36,8),toon(0xffffff),0,0.12,0));T.churro.add(mk(new THREE.CylinderGeometry(0.115,0.125,0.08,8),toon(0xff6f8f),0,0.2,0));
    const c=mk(new THREE.CylinderGeometry(0.075,0.09,1.25,8),dough,0,0.85,0);T.churro.add(c);T.churro.add(mk(new THREE.SphereGeometry(0.075,8,6),dough,0,1.48,0));
    for(let i=0;i<14;i++){const a=i*2.4;T.churro.add(mk(new THREE.SphereGeometry(0.022,5,4),sug,Math.cos(a)*0.085,0.35+i*0.08,Math.sin(a)*0.085));}}
  T.spear=G2();T.spear.add(mk(new THREE.CylinderGeometry(0.045,0.05,2.1,6),wood,0,0.7,0));T.spear.add(mk(new THREE.ConeGeometry(0.12,0.4,6),stoneC,0,1.95,0));
  {const rb=mk(new THREE.TorusGeometry(0.09,0.035,6,10),pinkC,0,1.68,0);rb.rotation.x=Math.PI/2;T.spear.add(rb);}
  T.bow=G2();{const arc=mk(new THREE.TorusGeometry(0.62,0.04,6,22,Math.PI*0.86),wood);arc.rotation.set(0,Math.PI/2,Math.PI/2+Math.PI*0.07);arc.position.z=-0.35;T.bow.add(arc);
    T.bow.add(mk(new THREE.CylinderGeometry(0.01,0.01,1.18,4),toon(0xfff6ea),0,0,0.22));T.bow.add(mk(new THREE.CylinderGeometry(0.06,0.06,0.18,6),pinkC,0,0,0.27));}
  T.staff=G2();T.staff.add(mk(new THREE.CylinderGeometry(0.05,0.06,1.4,6),wood,0,0.6,0));{const st=mk(new THREE.OctahedronGeometry(0.2),basic(0xff9ed6),0,1.42,0);T.staff.add(st);T.staff.userData.gem=st;
    const rg=mk(new THREE.TorusGeometry(0.22,0.03,6,16),toon(0xffd36e),0,1.42,0);T.staff.add(rg);}
  for(const[k,mat]of[['axe1',cream],['axe2',stoneC]]){const s=G2();s.add(mk(new THREE.CylinderGeometry(0.05,0.06,1.1,6),wood,0,0.5,0));s.add(mk(new THREE.BoxGeometry(0.06,0.38,0.42),mat,0,0.95,0.2));T[k]=s;}
  for(const[k,mat]of[['pick1',cream],['pick2',stoneC]]){const s=G2();s.add(mk(new THREE.CylinderGeometry(0.05,0.06,1.1,6),wood,0,0.5,0));s.add(mk(new THREE.BoxGeometry(0.08,0.1,0.9),mat,0,1.05,0));
    for(const z of[-1,1]){const tp=mk(new THREE.ConeGeometry(0.06,0.18,4),mat,0,1.0,z*0.5);tp.rotation.x=z*Math.PI/2+z*0.4;s.add(tp);}T[k]=s;}
  T.hoe=G2();T.hoe.add(mk(new THREE.CylinderGeometry(0.05,0.06,1.25,6),wood,0,0.55,0));T.hoe.add(mk(new THREE.BoxGeometry(0.34,0.05,0.28),stoneC,0,1.17,0.12));
  T.can=G2();{const bd=mk(new THREE.CylinderGeometry(0.2,0.22,0.3,12),toon(0x8fdcb4),0,-0.05,0.18);T.can.add(bd);const sp=mk(new THREE.CylinderGeometry(0.03,0.05,0.4,6),toon(0x8fdcb4),0,0.05,0.48);sp.rotation.x=1.1;T.can.add(sp);
    const hd=mk(new THREE.TorusGeometry(0.13,0.03,6,12,Math.PI),toon(0x6ac094),0,0.1,0.1);hd.rotation.y=Math.PI/2;T.can.add(hd);}
  T.net=G2();T.net.add(mk(new THREE.CylinderGeometry(0.04,0.05,1.3,6),wood,0,0.6,0));{const rg=mk(new THREE.TorusGeometry(0.3,0.03,6,18),toon(0xffd36e),0,1.5,0);T.net.add(rg);
    const nt=mk(new THREE.ConeGeometry(0.3,0.5,12,1,true),basic(0xffffff,{transparent:true,opacity:0.55,side:THREE.DoubleSide,depthWrite:false}),0,1.5,-0.25);nt.rotation.x=-Math.PI/2;T.net.add(nt);}
  T.rod=G2();T.rod.add(mk(new THREE.CylinderGeometry(0.025,0.05,2.0,6),wood,0,0.8,0));T.rod.add(mk(new THREE.CylinderGeometry(0.09,0.09,0.08,10),pinkC,0.07,0.15,0));
  {const tip=new THREE.Object3D();tip.position.y=1.8;T.rod.add(tip);T.rod.userData.tip=tip;}
  buildSkins(T,G2);
  for(const k in T){T[k].visible=false;hold.add(T[k]);}
  return T;
}
const BLINKERS=[];
function tickBlinks(dt){for(let i=BLINKERS.length-1;i>=0;i--){const b=BLINKERS[i];if(!b.g.parent){if(b.seen)BLINKERS.splice(i,1);continue;}b.seen=1;let o=b.g,vis=true;while(o){if(!o.visible){vis=false;break;}o=o.parent;}if(vis)b.blink(dt);}}
function makeCritter(o,withTools){
  o=Object.assign({},DEF_LOOK,o);
  const lob=o.species==='lobster';
  const sx=lob?1.06:1,sy=(lob?0.9:0.92)*(o.sy||1),sz=lob?1:0.95,cy=0.84,RR=0.8;
  const g=new THREE.Group(),m=new THREE.Group();g.add(m);
  const bodyM=o.flash?toon(new THREE.Color(o.body),{emissive:0x000000}):felt(o.body),accM=felt(o.accent);
  const body=mk(G.body,bodyM,0,cy,0);body.scale.set(sx,sy,sz);m.add(body);
  const fc=document.createElement('canvas');fc.width=FACE.W;fc.height=FACE.H;const ftex=new THREE.CanvasTexture(fc);ftex.anisotropy=4;
  const face=mk(faceGeo,new THREE.MeshToonMaterial({map:ftex,gradientMap:gradMap,transparent:true,depthWrite:false,alphaTest:0.02}),0,cy,0);
  face.scale.set(RR*sx*1.012,RR*sy*1.012,RR*sz*1.012);face.renderOrder=2;m.add(face);
  const dims={sx,sy,cy,RR};let shown='',want='open',blinkOn=false,blinkT=0.5+Math.random()*4,dbl=false;
  const draw=mode=>{if(mode===shown)return;shown=mode;drawFace(fc.getContext('2d'),o,mode,dims);ftex.needsUpdate=true;};
  const setFace=mode=>{want=mode;draw(blinkOn&&mode==='open'?'sleep':mode);};
  // 眨眼：每隔幾秒閉眼一下（偶爾連眨兩次）
  const blink=dt=>{blinkT-=dt;if(blinkT>0)return;
    if(blinkOn){blinkOn=false;draw(want);if(dbl){dbl=false;blinkT=0.12;}else blinkT=2.2+Math.random()*3.8;}
    else{if(want!=='open'){blinkT=0.5;return;}blinkOn=true;draw('sleep');blinkT=0.11;if(!dbl&&Math.random()<0.2)dbl=true;}};
  setFace('open');
  const topY=cy+RR*sy;
  const fz=(x,y)=>{const a=x/(RR*sx),b=(y-cy)/(RR*sy);const v=1-a*a-b*b;return v>0?Math.sqrt(v)*RR*sz:0;};
  const legs=[],arms=[];
  for(const s of[-1,1]){const l=new THREE.Group();l.position.set(s*0.3*sx,0.3,0.02);
    l.add(mk(G.leg,bodyM,0,-0.12,0));const ft=mk(G.foot,lob?bodyM:accM,0,-0.25,0.05);ft.scale.set(1,0.62,1.25);l.add(ft);m.add(l);legs.push(l);}
  for(const s of[-1,1]){const a=new THREE.Group();a.position.set(s*0.7*sx,0.8,0.06);
    const up=mk(G.arm,bodyM,0,-0.08,0);up.scale.set(1,1.4,1);a.add(up);a.add(mk(G.hand,bodyM,0,-0.2,0));a.rotation.z=s*0.35;m.add(a);arms.push(a);}
  const hold=new THREE.Group();hold.position.set(0,-0.22,0.02);hold.rotation.x=1.2;arms[0].add(hold);
  let tail=null;
  if(lob){
    for(const s of[-1,1]){const h=new THREE.Group();h.position.set(s*0.8*sx*o.earGap,cy-0.02+o.earY,0.3);h.scale.setScalar(0.86*o.earSize);
      h.add(mk(G.horn,accM));h.add(mk(G.hornTip,felt(o.patch||'#c98a4a')));
      const pt=mk(G.patch,felt(o.patch||'#c98a4a'),0,0.27,0.23);pt.scale.set(1.3,1.3,0.6);pt.rotation.set(-0.1,0,Math.PI/4);h.add(pt);
      h.rotation.set(0,s*0.12,s*0.2);m.add(h);}
    const nub=mk(G.nub,bodyM,0,topY-0.03,0.12);nub.scale.set(1,1.15,1);m.add(nub);
  }else{
    const ears=o.ears;const n0=m.children.length;
    for(const s of[-1,1]){
      if(ears==='round'){const e=mk(new THREE.SphereGeometry(0.2,12,10),accM,s*0.6,topY-0.2,-0.05);e.scale.set(1,1,0.6);m.add(e);}
      else if(ears==='cat'){const e=mk(new THREE.ConeGeometry(0.2,0.36,4),accM,s*0.42,topY-0.02,0);e.rotation.z=-s*0.4;m.add(e);}
      else if(ears==='bunny'){const e=mk(new THREE.SphereGeometry(0.14,12,10),accM,s*0.25,topY+0.16,-0.05);e.scale.set(1,1.8,0.6);e.rotation.z=-s*0.15;m.add(e);}
      else if(ears==='bear'){const e=mk(new THREE.SphereGeometry(0.18,12,10),accM,s*0.48,topY-0.08,0);e.scale.z=0.7;m.add(e);}}
    if(ears==='sprout'){m.add(mk(new THREE.CylinderGeometry(0.025,0.03,0.25,6),felt('#7cc48f'),0,topY+0.1,0));for(const s of[-1,1]){const l=mk(new THREE.SphereGeometry(0.11,10,6),felt('#8fdcb4'),s*0.1,topY+0.24,0);l.scale.set(1.4,0.5,0.8);l.rotation.z=s*0.4;m.add(l);}}
    for(let q=n0;q<m.children.length;q++){const e=m.children[q];e.position.x*=o.earGap;e.position.y=topY+(e.position.y-topY)*o.earSize+o.earY;e.scale.multiplyScalar(o.earSize);}
  }
  {let tt=o.tail||(lob?'seg':'pom');if(!lob&&tt==='seg')tt='pom';if(tt!=='none'){tail=new THREE.Group();tail.position.set(0,0.4+o.tailY,-0.72*sz-o.tailZ);tail.scale.setScalar(o.tailSize);const tm=tt==='fox'||tt==='heart'?accM:bodyM;
    if(tt==='seg'){[[0,0,-0.12],[0,0.02,-0.33],[0,0.08,-0.52]].forEach(([x,y,z])=>tail.add(mk(G.tailSeg,bodyM,x,y,z)));tail.add(mk(G.tailBall,bodyM,0,0.2,-0.68));}
    else if(tt==='pom'){tail.add(mk(new THREE.SphereGeometry(0.2,12,10),accM,0,0,-0.08));}
    else if(tt==='curl'){const c=mk(new THREE.TorusGeometry(0.2,0.08,8,20,Math.PI*1.6),bodyM,0,0.18,-0.18);c.rotation.y=Math.PI/2;tail.add(c);}
    else if(tt==='fox'){const f=mk(new THREE.SphereGeometry(0.22,14,10),accM,0,0.25,-0.42);f.scale.set(0.9,0.9,2.0);f.rotation.x=-0.6;tail.add(f);tail.add(mk(new THREE.SphereGeometry(0.15,12,8),felt('#ffffff'),0,0.55,-0.78));}
    else if(tt==='heart'){for(const s2 of[-1,1])tail.add(mk(new THREE.SphereGeometry(0.15,12,10),tm,s2*0.11,0.32,-0.2));const cn=mk(new THREE.ConeGeometry(0.2,0.3,12),tm,0,0.14,-0.2);cn.rotation.x=Math.PI;tail.add(cn);tail.add(mk(new THREE.CylinderGeometry(0.04,0.04,0.2,6),bodyM,0,0.05,-0.08));}
    m.add(tail);}}
  const hc=o.hatColor||'#ff9ec4';
  if(o.hat==='straw'){const h=new THREE.Group(),st=felt('#ffe08a');h.add(mk(new THREE.CylinderGeometry(0.85,0.85,0.06,26),st));h.add(mk(new THREE.CylinderGeometry(0.42,0.5,0.4,22),st,0,0.22,0));
    h.add(mk(new THREE.CylinderGeometry(0.505,0.505,0.11,22),felt(hc),0,0.08,0));h.position.y=topY-0.03;h.rotation.z=0.12;h.rotation.x=-0.08;m.add(h);}
  else if(o.hat==='bow'){const h=new THREE.Group();for(const s of[-1,1]){const b=mk(new THREE.SphereGeometry(0.15,10,8),felt(hc),s*0.15,0,0);b.scale.set(1.2,0.8,0.5);b.rotation.z=s*0.3;h.add(b);}h.add(mk(new THREE.SphereGeometry(0.07,8,6),felt(hc)));
    h.position.set(0.32,topY-0.12,0.25);h.rotation.z=-0.4;m.add(h);}
  else if(o.hat==='flower'){const h=new THREE.Group();for(let i=0;i<5;i++){const a=i/5*6.28;h.add(mk(new THREE.SphereGeometry(0.08,8,6),felt('#ffffff'),Math.cos(a)*0.1,Math.sin(a)*0.1,0));}h.add(mk(new THREE.SphereGeometry(0.06,8,6),felt('#ffd36e'),0,0,0.03));
    h.position.set(-0.36,topY-0.12,0.32);h.rotation.y=-0.4;m.add(h);}
  else if(o.hat==='beret'){const h=mk(new THREE.SphereGeometry(0.5,16,10),felt(hc),0.05,topY-0.02,0);h.scale.set(1,0.32,1);h.rotation.z=0.18;m.add(h);m.add(mk(new THREE.SphereGeometry(0.06,8,6),felt(hc),0.1,topY+0.14,0));}
  else if(o.hat==='nightcap'){const h=new THREE.Group();h.add(mk(new THREE.ConeGeometry(0.45,0.9,16),felt(hc),0,0.4,0));const tr=mk(new THREE.TorusGeometry(0.42,0.08,8,20),felt('#ffffff'));tr.rotation.x=Math.PI/2;h.add(tr);
    h.add(mk(new THREE.SphereGeometry(0.12,10,8),felt('#ffffff'),0.12,0.85,0));h.position.y=topY-0.1;h.rotation.z=-0.35;m.add(h);}
  else if(o.hat==='chef'){const h=new THREE.Group(),w=felt('#ffffff');h.add(mk(new THREE.CylinderGeometry(0.36,0.38,0.32,16),w,0,0.16,0));for(const[x,z]of[[0,0],[-0.18,0.05],[0.18,0.05],[0,-0.16]]){const p=mk(new THREE.SphereGeometry(0.24,12,8),w,x,0.42,z);h.add(p);}
    h.position.y=topY-0.06;m.add(h);}
  if(o.scarf){const sc=mk(new THREE.TorusGeometry(0.62*sx,0.09,8,24),felt(o.scarf),0,0.5,0.02);sc.rotation.x=Math.PI/2;m.add(sc);}
  if(o.apron){const ap=mk(new THREE.SphereGeometry(0.8,20,14,-0.6,1.2,1.4,0.85),felt(o.apron),0,cy,0.01);ap.scale.set(sx*1.02,sy*1.02,sz*1.03);m.add(ap);}
  if(o.glasses){const gm=basic(0x3a2a22);for(const s of[-1,1]){const r=mk(new THREE.TorusGeometry(0.13*o.eyeSize,0.02,6,16),gm,s*o.eyeGap,o.eyeY,fz(s*o.eyeGap,o.eyeY)+0.03);m.add(r);}
    m.add(mk(new THREE.BoxGeometry(Math.max(0.02,o.eyeGap*2-0.26*o.eyeSize),0.02,0.02),gm,0,o.eyeY+0.02,fz(0,o.eyeY)+0.03));}
  const T=withTools?buildTools(hold):{};
  shadowAll(g);g.traverse(o=>{if(o.isMesh&&o!==body)o.castShadow=false;});
  BLINKERS.push({g,blink});
  return{g,m,face,setFace,legs,arms,hold,T,tail,bodyM,o,lob,sq:0,sqv:0,topY};
}
function makeSlime(night,size=1,color=null,angry=false){
  const g=new THREE.Group(),m=new THREE.Group();g.add(m);
  const mat=toon(new THREE.Color(color||(night?'#ff6fa8':'#ff9ec7')),{emissive:0x000000});
  const b=mk(G.slime,mat,0,0.5,0);b.scale.set(1,0.78,1);m.add(b);
  const fc=document.createElement('canvas');fc.width=FACE.W;fc.height=FACE.H;const ftex=new THREE.CanvasTexture(fc);
  const face=mk(faceGeo,new THREE.MeshToonMaterial({map:ftex,gradientMap:gradMap,transparent:true,depthWrite:false,alphaTest:0.02}),0,0.5,0);
  face.scale.set(0.8*1.012,0.8*0.78*1.012,0.8*1.012);face.renderOrder=2;m.add(face);
  const o={eyeSize:1.15,eyeGap:0.22,eyeY:0.62,mouth:(night||angry)?'zigzag':'w',mouthSize:0.9,mouthY:0.15,blush:true,brows:night||angry,shine:false};
  const dims={sx:1,sy:0.78,cy:0.5,RR:0.8};
  const setFace=mode=>{drawFace(fc.getContext('2d'),o,mode,dims);ftex.needsUpdate=true;};setFace('open');
  g.scale.setScalar(size);shadowAll(g);
  return{g,m,mat,face,setFace,body:b};
}
// 柔軟的姿勢系統：所有角色共用
function newPose(){return{lean:0,twist:0,y:0,arms:[[0,0,-0.35],[0,0,0.35]],legs:[0,0],hold:1.2,sq:0,k:14};}
function applyPose(r,P,dt){
  const a=1-Math.exp(-(P.k||14)*dt);
  r.m.rotation.x=lerp(r.m.rotation.x,P.lean,a);
  if(P.twistHard!==undefined)r.m.rotation.y=P.twistHard;else r.m.rotation.y=lerp(r.m.rotation.y,P.twist,a);
  r.m.position.y=lerp(r.m.position.y,P.y,Math.min(1,a*1.6));
  for(let i=0;i<2;i++){const A=r.arms[i].rotation,t=P.arms[i];A.x=lerp(A.x,t[0],a);A.y=lerp(A.y,t[1],a);A.z=lerp(A.z,t[2],a);
    r.legs[i].rotation.x=lerp(r.legs[i].rotation.x,P.legs[i],a);}
  r.hold.rotation.x=lerp(r.hold.rotation.x,P.hold,a);
  r.sqv+=((P.sq-r.sq)*170-r.sqv*11)*dt;r.sq+=r.sqv*dt;const s=clamp(r.sq,-0.4,0.4);
  r.m.scale.set(1-s*0.55,1+s,1-s*0.55);
}

// ---------- 小動物（寵物）：圓滾細緻版 ----------
function animalFace(o){const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');
  const ex=o.ex||46,ey=o.ey||54,br='#7a4a3a';
  // 白色口鼻
  const mg=g.createRadialGradient(128,84,4,128,84,30);mg.addColorStop(0,'rgba(255,255,255,.95)');mg.addColorStop(0.75,'rgba(255,255,255,.85)');mg.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=mg;g.beginPath();g.ellipse(128,84,30,22,0,0,7);g.fill();
  // 腮紅
  for(const s of[-1,1]){const x=128+s*(ex+14),y=ey+22;const bg=g.createRadialGradient(x,y,1,x,y,14);bg.addColorStop(0,'rgba(240,120,130,.55)');bg.addColorStop(1,'rgba(240,120,130,0)');g.fillStyle=bg;g.beginPath();g.ellipse(x,y,15,9,0,0,7);g.fill();}
  // 小小斜斜的橢圓眼
  for(const s of[-1,1]){const x=128+s*ex;g.save();g.translate(x,ey);g.rotate(s*0.35);const eg=g.createRadialGradient(0,0,1,0,0,9);eg.addColorStop(0,'#6a3a2c');eg.addColorStop(0.7,br);eg.addColorStop(1,'rgba(122,74,58,.4)');
    g.fillStyle=eg;g.beginPath();g.ellipse(0,0,8.5,6,0,0,7);g.fill();g.restore();}
  // 鼻子＋ω 嘴
  g.fillStyle='#8a4a3c';g.beginPath();g.ellipse(128,77,7,5,0,0,7);g.fill();g.fillStyle='rgba(255,255,255,.5)';g.beginPath();g.ellipse(126,75.5,2.5,1.5,0,0,7);g.fill();
  g.strokeStyle='#8a4a3c';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(128,81);g.lineTo(128,85);g.moveTo(128,85);g.quadraticCurveTo(122,92,115,86);g.moveTo(128,85);g.quadraticCurveTo(134,92,141,86);g.stroke();
  if(o.nose==='cat'){g.strokeStyle='rgba(122,74,58,.35)';g.lineWidth=1.6;for(const s of[-1,1])for(let k=0;k<2;k++){g.beginPath();g.moveTo(128+s*30,84+k*6);g.lineTo(128+s*54,80+k*10);g.stroke();}}
  return new THREE.CanvasTexture(c);}
function faceDecal(tex,r,y,z,w=1){const m=mk(new THREE.SphereGeometry(r*1.012,24,16,Math.PI/2-0.75*w,1.5*w,Math.PI*0.3,Math.PI*0.42),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false}),0,y,z);m.renderOrder=2;return m;}
function makeAnimal(type){
  const g=new THREE.Group(),m=new THREE.Group();g.add(m);const pk=toon(0xffaabb);
  if(type==='bunny'||type==='bunny2'){
    const hood=toon(type==='bunny'?0xffffff:0xc8a080),cream=toon(type==='bunny'?0xffffff:0xfaeedd),white=toon(0xffffff);
    const body=mk(new THREE.SphereGeometry(0.4,24,18),cream,0,0.42,0);body.scale.set(1,1.12,0.92);m.add(body);
    const head=mk(new THREE.SphereGeometry(0.34,24,18),cream,0,0.88,0.02);m.add(head);
    m.add(mk(new THREE.SphereGeometry(0.356,24,10,0,Math.PI*2,0,Math.PI*0.3),hood,0,0.88,0.02));
    m.add(mk(new THREE.SphereGeometry(0.357,24,18,Math.PI*0.88,Math.PI*1.24,0,Math.PI*0.78),hood,0,0.88,0.02));
    for(const s2 of[-1,1]){const e=new THREE.Group();e.position.set(s2*0.13,1.12,-0.02);e.rotation.z=-s2*0.08;
      const eo=mk(new THREE.SphereGeometry(0.085,14,10),hood,0,0.24,0);eo.scale.set(1,3.0,0.6);e.add(eo);const ei=mk(new THREE.SphereGeometry(0.05,10,8),toon(0xff8aa8),0,0.22,0.045);ei.scale.set(1,3.3,0.3);e.add(ei);m.add(e);}
    for(const s2 of[-1,1]){const f=mk(new THREE.SphereGeometry(0.12,14,10),white,s2*0.17,0.08,0.24);f.scale.set(0.85,0.7,1.35);m.add(f);
      const pw=mk(new THREE.SphereGeometry(0.075,10,8),cream,s2*0.16,0.48,0.32);pw.scale.set(0.9,1.2,0.8);m.add(pw);}
    m.add(mk(new THREE.SphereGeometry(0.1,10,8),white,0,0.25,-0.36));
    const fc=document.createElement('canvas');fc.width=256;fc.height=128;const g2=fc.getContext('2d');
    for(const s2 of[-1,1]){const x=128+s2*34;const bg=g2.createRadialGradient(x+s2*12,80,1,x+s2*12,80,16);bg.addColorStop(0,'rgba(245,110,130,.75)');bg.addColorStop(1,'rgba(245,110,130,0)');g2.fillStyle=bg;g2.beginPath();g2.ellipse(x+s2*12,80,17,12,0,0,7);g2.fill();
      g2.fillStyle='#2a1c1c';g2.beginPath();g2.ellipse(x,62,5,5.5,0,0,7);g2.fill();}
    g2.fillStyle='#6a4038';g2.beginPath();g2.ellipse(128,72,4.5,3.2,0,0,7);g2.fill();g2.strokeStyle='#6a4038';g2.lineWidth=2;g2.lineCap='round';g2.beginPath();g2.moveTo(128,75);g2.quadraticCurveTo(124,80,120,77);g2.moveTo(128,75);g2.quadraticCurveTo(132,80,136,77);g2.stroke();
    m.add(faceDecal(new THREE.CanvasTexture(fc),0.34,0.88,0.02,0.9));
  }else if(type==='chick'){
    const y=toon(0xffe066),or=toon(0xffa040);const b=mk(new THREE.SphereGeometry(0.34,22,16),y,0,0.36,0);b.scale.set(1,1.05,1);m.add(b);
    const bk=mk(new THREE.SphereGeometry(0.055,10,8),or,0,0.355,0.335);bk.scale.set(1.15,0.9,0.75);m.add(bk);
    for(const s of[-1,1]){const w=mk(new THREE.SphereGeometry(0.12,10,8),y,s*0.32,0.33,-0.02);w.scale.set(0.45,0.9,1.3);w.rotation.z=s*0.4;m.add(w);
      const leg=new THREE.Group();leg.position.set(s*0.11,0.05,0.05);leg.add(mk(new THREE.CylinderGeometry(0.02,0.02,0.12,5),or,0,0.04,0));for(let k=-1;k<=1;k++){const t=mk(new THREE.BoxGeometry(0.03,0.02,0.1),or,k*0.04,-0.02,0.04);t.rotation.y=k*0.4;leg.add(t);}m.add(leg);}
    for(let k=0;k<3;k++){const f=mk(new THREE.ConeGeometry(0.035,0.14,6),y,(k-1)*0.05,0.72,0);f.rotation.z=(k-1)*0.4;m.add(f);}
    m.add(mk(new THREE.SphereGeometry(0.08,8,6),y,0,0.3,-0.33));
    {const fc=document.createElement('canvas');fc.width=256;fc.height=128;const g2=fc.getContext('2d');
     for(const s2 of[-1,1]){const x=128+s2*30;const bg=g2.createRadialGradient(x+s2*8,76,1,x+s2*8,76,14);bg.addColorStop(0,'rgba(240,110,120,.7)');bg.addColorStop(1,'rgba(240,110,120,0)');g2.fillStyle=bg;g2.beginPath();g2.ellipse(x+s2*8,76,15,10,0,0,7);g2.fill();
       g2.fillStyle='#3a2420';g2.beginPath();g2.ellipse(x,60,5,5.5,0,0,7);g2.fill();}
     m.add(faceDecal(new THREE.CanvasTexture(fc),0.36,0.36,0));}
  }else if(type==='cat'){
    const c=toon(0xc8c0d8),w=toon(0xfff8f0),st=toon(0x9a90b0);
    const b=mk(new THREE.SphereGeometry(0.3,20,14),c,0,0.32,-0.12);b.scale.set(1,0.9,1.35);m.add(b);
    const chest=mk(new THREE.SphereGeometry(0.2,16,12),w,0,0.3,0.12);m.add(chest);
    const head=mk(new THREE.SphereGeometry(0.3,22,16),c,0,0.62,0.18);head.scale.set(1.1,0.95,1);m.add(head);
    for(const s of[-1,1]){const e=mk(new THREE.ConeGeometry(0.11,0.2,4),c,s*0.18,0.88,0.15);e.rotation.z=-s*0.35;e.rotation.y=Math.PI/4;m.add(e);const ei=mk(new THREE.ConeGeometry(0.06,0.12,4),pk,s*0.18,0.87,0.18);ei.rotation.z=-s*0.35;ei.rotation.y=Math.PI/4;m.add(ei);
      m.add(mk(new THREE.SphereGeometry(0.08,10,8),w,s*0.12,0.06,0.15));m.add(mk(new THREE.SphereGeometry(0.08,10,8),c,s*0.14,0.06,-0.35));}
    for(let k=0;k<3;k++){const sp=mk(new THREE.BoxGeometry(0.06,0.04,0.02),st,(k-1)*0.07,0.86,0.04);m.add(sp);}
    const tail=new THREE.Group();tail.position.set(0,0.32,-0.5);for(let k=0;k<5;k++){tail.add(mk(new THREE.SphereGeometry(0.06,8,6),k%2?st:c,0,k*0.09,-Math.sin(k*0.5)*0.12));}m.add(tail);m.userData.tail=tail;
    m.add(faceDecal(animalFace({nose:'cat',ex:44,ey:54}),0.3,0.62,0.18,1.05));
  }else if(type==='puppy'){
    const c=toon(0xf2c890),w=toon(0xfff6ea),br=toon(0xb07a50);
    const b=mk(new THREE.SphereGeometry(0.32,20,14),c,0,0.34,-0.1);b.scale.set(1,0.9,1.3);m.add(b);m.add(mk(new THREE.SphereGeometry(0.2,14,10),w,0,0.3,0.15));
    const head=mk(new THREE.SphereGeometry(0.32,22,16),c,0,0.66,0.2);head.scale.set(1.1,0.95,1);m.add(head);
    const mz=mk(new THREE.SphereGeometry(0.15,16,12),w,0,0.57,0.43);mz.scale.set(1.25,0.95,0.55);m.add(mz);
    const dk=basic(0x3a2420);const ns=mk(new THREE.SphereGeometry(0.04,10,8),dk,0,0.625,0.515);ns.scale.set(1.3,0.85,0.8);m.add(ns);
    for(const s2 of[-1,1]){const mo=mk(new THREE.TorusGeometry(0.022,0.007,5,10,Math.PI),dk,s2*0.022,0.585,0.508);mo.rotation.z=Math.PI;m.add(mo);}
    for(const s of[-1,1]){const e=mk(new THREE.SphereGeometry(0.12,12,10),br,s*0.3,0.68,0.16);e.scale.set(0.55,1.3,0.75);e.rotation.z=s*0.25;m.add(e);
      m.add(mk(new THREE.SphereGeometry(0.09,10,8),w,s*0.14,0.07,0.17));m.add(mk(new THREE.SphereGeometry(0.09,10,8),c,s*0.15,0.07,-0.36));}
    const tail=new THREE.Group();tail.position.set(0,0.48,-0.5);const tl=mk(new THREE.SphereGeometry(0.07,8,6),c,0,0.1,-0.04);tl.scale.set(1,2.2,1);tail.add(tl);tail.rotation.x=-0.6;m.add(tail);m.userData.tail=tail;
    {const fc=document.createElement('canvas');fc.width=256;fc.height=128;const g2=fc.getContext('2d');
     for(const s2 of[-1,1]){const x=128+s2*40;const bg=g2.createRadialGradient(x+s2*10,78,1,x+s2*10,78,15);bg.addColorStop(0,'rgba(240,110,120,.7)');bg.addColorStop(1,'rgba(240,110,120,0)');g2.fillStyle=bg;g2.beginPath();g2.ellipse(x+s2*10,78,16,11,0,0,7);g2.fill();
       g2.fillStyle='#2a1c1c';g2.beginPath();g2.ellipse(x,58,5.5,6,0,0,7);g2.fill();}
     m.add(faceDecal(new THREE.CanvasTexture(fc),0.32,0.66,0.2,1.05));}
  }else if(type==='bear'||type==='fox'){
    const fox=type==='fox';const c=toon(fox?0xf59a4a:0xb98a62),w=toon(0xfff6ea),dk=toon(fox?0x5a3a2a:0x8a6040);
    const b=mk(new THREE.SphereGeometry(0.32,20,14),c,0,0.34,-0.1);b.scale.set(1,0.9,1.3);m.add(b);m.add(mk(new THREE.SphereGeometry(0.2,14,10),w,0,0.3,0.15));
    const head=mk(new THREE.SphereGeometry(0.32,22,16),c,0,0.66,0.2);head.scale.set(fox?1.15:1.1,0.95,1);m.add(head);
    for(const s of[-1,1]){if(fox){const e=mk(new THREE.ConeGeometry(0.13,0.3,4),c,s*0.19,0.95,0.16);e.rotation.z=-s*0.3;e.rotation.y=Math.PI/4;m.add(e);const t=mk(new THREE.ConeGeometry(0.06,0.12,4),dk,s*0.235,1.06,0.16);t.rotation.z=-s*0.3;t.rotation.y=Math.PI/4;m.add(t);}
      else{const e=mk(new THREE.SphereGeometry(0.11,12,10),c,s*0.22,0.92,0.16);e.scale.z=0.6;m.add(e);const ei=mk(new THREE.SphereGeometry(0.06,10,8),toon(0xf2c8a8),s*0.22,0.92,0.21);ei.scale.z=0.4;m.add(ei);}
      m.add(mk(new THREE.SphereGeometry(0.09,10,8),fox?dk:c,s*0.14,0.07,0.17));m.add(mk(new THREE.SphereGeometry(0.09,10,8),fox?dk:c,s*0.15,0.07,-0.36));}
    const tail=new THREE.Group();tail.position.set(0,0.38,-0.5);
    if(fox){const t1=mk(new THREE.SphereGeometry(0.16,12,10),c,0,0.12,-0.12);t1.scale.set(1,1,2);tail.add(t1);const t2=mk(new THREE.SphereGeometry(0.1,10,8),w,0,0.22,-0.42);tail.add(t2);tail.rotation.x=-0.5;}
    else tail.add(mk(new THREE.SphereGeometry(0.09,10,8),c,0,0,0));m.add(tail);m.userData.tail=tail;
    m.add(faceDecal(animalFace({nose:fox?'cat':'dog',ex:44,ey:54}),0.32,0.66,0.2,1.05));
  }else if(type==='dino'||type==='axolotl'){
    const ax=type==='axolotl';const c=toon(ax?0xffb3cf:0x8fdc8a),bl=toon(ax?0xff7aa8:0x5fb86a),bel=toon(ax?0xffe0ec:0xfff3c0);
    if(ax){const b=mk(new THREE.SphereGeometry(0.3,20,14),c,0,0.3,-0.15);b.scale.set(1,0.85,1.5);m.add(b);
      const head=mk(new THREE.SphereGeometry(0.33,22,16),c,0,0.5,0.25);head.scale.set(1.25,0.9,1);m.add(head);
      for(const s of[-1,1])for(let k=0;k<3;k++){const gl=mk(new THREE.SphereGeometry(0.07,8,6),bl,s*(0.36+k*0.02),0.55+(k-1)*0.13,0.18-k*0.04);gl.scale.set(2.6,0.8,0.8);gl.rotation.z=s*(0.5-(k-1)*0.45);m.add(gl);}
      for(const s of[-1,1])for(const zz of[0.15,-0.4]){m.add(mk(new THREE.SphereGeometry(0.08,8,6),c,s*0.22,0.07,zz));}
      const tail=new THREE.Group();tail.position.set(0,0.3,-0.55);const tl=mk(new THREE.SphereGeometry(0.16,12,8),c,0,0,-0.18);tl.scale.set(0.35,1,1.6);tail.add(tl);m.add(tail);m.userData.tail=tail;
      const fc=document.createElement('canvas');fc.width=256;fc.height=128;const g2=fc.getContext('2d');
      for(const s2 of[-1,1]){const x=128+s2*44;const bg=g2.createRadialGradient(x+s2*6,76,1,x+s2*6,76,14);bg.addColorStop(0,'rgba(240,90,130,.6)');bg.addColorStop(1,'rgba(240,90,130,0)');g2.fillStyle=bg;g2.beginPath();g2.ellipse(x+s2*6,76,15,10,0,0,7);g2.fill();g2.fillStyle='#2a1c1c';g2.beginPath();g2.ellipse(x,60,5,5.5,0,0,7);g2.fill();}
      g2.strokeStyle='#8a3a4a';g2.lineWidth=3;g2.lineCap='round';g2.beginPath();g2.moveTo(104,70);g2.quadraticCurveTo(128,84,152,70);g2.stroke();
      m.add(faceDecal(new THREE.CanvasTexture(fc),0.33,0.5,0.25,1.1));}
    else{const b=mk(new THREE.SphereGeometry(0.36,22,16),c,0,0.42,0);b.scale.set(1,1.1,1);m.add(b);const bel2=mk(new THREE.SphereGeometry(0.26,16,12),bel,0,0.38,0.13);bel2.scale.set(1,1.15,0.8);m.add(bel2);
      for(let k=0;k<4;k++){const sp=mk(new THREE.ConeGeometry(0.08,0.18,5),bl,0,0.82-k*0.16,-0.18-k*0.08);sp.rotation.x=-0.6-k*0.35;m.add(sp);}
      for(const s of[-1,1]){m.add(mk(new THREE.SphereGeometry(0.1,10,8),c,s*0.17,0.07,0.08));const arm=mk(new THREE.SphereGeometry(0.06,8,6),c,s*0.3,0.45,0.2);arm.scale.set(0.8,0.8,1.5);m.add(arm);}
      const tail=new THREE.Group();tail.position.set(0,0.25,-0.3);const tl=mk(new THREE.ConeGeometry(0.15,0.55,10),c,0,0,-0.2);tl.rotation.x=-Math.PI/2-0.3;tail.add(tl);m.add(tail);m.userData.tail=tail;
      const fc=document.createElement('canvas');fc.width=256;fc.height=128;const g2=fc.getContext('2d');
      for(const s2 of[-1,1]){const x=128+s2*34;const bg=g2.createRadialGradient(x+s2*10,78,1,x+s2*10,78,14);bg.addColorStop(0,'rgba(240,110,120,.65)');bg.addColorStop(1,'rgba(240,110,120,0)');g2.fillStyle=bg;g2.beginPath();g2.ellipse(x+s2*10,78,15,10,0,0,7);g2.fill();g2.fillStyle='#2a1c1c';g2.beginPath();g2.ellipse(x,60,5,5.5,0,0,7);g2.fill();}
      g2.strokeStyle='#3a5a2a';g2.lineWidth=3;g2.lineCap='round';g2.beginPath();g2.moveTo(116,72);g2.quadraticCurveTo(128,80,140,72);g2.stroke();
      m.add(faceDecal(new THREE.CanvasTexture(fc),0.36,0.6,0.02,0.95));}
  }
  shadowAll(g);g.traverse(o=>{if(o.isMesh&&o.material.transparent)o.castShadow=false;});return{g,m};
}
