// ===================== extra.js：第一人稱、木方塊建築、遊樂園、轉蛋 =====================
// ---------- 第一人稱 ----------
function fpAllowed(){return decoMode||!!carry||isBlk(ply.held);}
function setFP(on){if(on===fpMode)return;fpMode=on;document.body.classList.toggle('fp',on);$('fpBtn').classList.toggle('on',on);snapCam=true;
  if(on){fpPitch=0.45;camYaw=ply.face+Math.PI;}else{P.g.visible=true;camYaw=ply.face+Math.PI;}SFX.click();showHbLabel(on?'👁️ 第一人稱（拖曳畫面轉視角）':'🎥 第三人稱');}
$('fpBtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!paused&&fpAllowed())setFP(!fpMode);});
addEventListener('keydown',e=>{if(e.code===KB.fp&&!kbWait&&!paused&&started&&e.target.tagName!=='INPUT'){if(fpMode||fpAllowed())setFP(!fpMode);}});

// ---------- 射線（第一人稱瞄準） ----------
const _rd=new THREE.Vector3();
function castRay(maxD=7.5){camera.getWorldDirection(_rd);const o=camera.position;let prev=null;
  for(let t=0.25;t<maxD;t+=0.035){const x=o.x+_rd.x*t,y=o.y+_rd.y*t,z=o.z+_rd.z*t;const i=Math.round(x/BLK),j=Math.floor(y/BLK),k=Math.round(z/BLK);
    if(blocks.has(bKey(i,j,k)))return{type:'block',i,j,k,prev,x,y,z};
    const gy=Math.max(H(x,z),inHouse(x,z)?0.02:-1e9);if(y<=gy)return{type:'ground',x,y:gy,z,prev};
    prev=[i,j,k];}
  return null;}

// ---------- 木方塊：目標格子 ----------
function cellFree(i,j,k){if(blocks.has(bKey(i,j,k)))return false;const x0=i*BLK-BLK/2,x1=x0+BLK,z0=k*BLK-BLK/2,z1=z0+BLK,y0=j*BLK,y1=y0+BLK;
  {const cx=clamp(ply.x,x0,x1),cz=clamp(ply.z,z0,z1);if(Math.hypot(ply.x-cx,ply.z-cz)<0.38&&y1>ply.y+0.05&&y0<ply.y+1.4)return false;}
  if(hitsWall(x0+0.02,x1-0.02,z0+0.02,z1-0.02))return false;
  for(const o of obstacles){if(o.r<=0.05)continue;const oy=o.y!==undefined?o.y:H(o.x,o.z);if(y0>oy+1.6||y1<oy+0.05)continue;const cx=clamp(o.x,x0,x1),cz=clamp(o.z,z0,z1);if(Math.hypot(o.x-cx,o.z-cz)<o.r*0.85)return false;}
  for(const n of npcs){if(n.away)continue;const cx=clamp(n.x,x0,x1),cz=clamp(n.z,z0,z1);if(Math.hypot(n.x-cx,n.z-cz)<0.5&&y0<H(n.x,n.z)+1.4)return false;}
  if(j*BLK>30||Math.hypot(i*BLK-ply.x,k*BLK-ply.z)>8)return false;
  if(Math.hypot(i*BLK-BOARD.x,k*BLK-BOARD.z)<2)return false;
  return true;}
function buildTarget(){if(ply.cave)return null;let i,j,k;
  if(fpMode){const h=fpHit;if(!h)return null;if(h.type==='block'){if(!h.prev)return null;[i,j,k]=h.prev;}else{i=Math.round(h.x/BLK);k=Math.round(h.z/BLK);j=baseJ(i,k);const t=colTopJ(i,k);if(t>-1e9&&t>=j)j=t+1;}}
  else{const x=ply.x+Math.sin(ply.face)*1.25,z=ply.z+Math.cos(ply.face)*1.25;[i,k]=bCell(x,z);const t=colTopJ(i,k);j=t>-1e9?t+1:baseJ(i,k);if(j*BLK>ply.y+2.6)return{i,j,k,ok:false};}
  return{i,j,k,ok:cellFree(i,j,k)};}
function blockTarget(){if(ply.cave)return null;
  if(fpMode){const h=fpHit;return h&&h.type==='block'?{i:h.i,j:h.j,k:h.k}:null;}
  const x=ply.x+Math.sin(ply.face)*1.25,z=ply.z+Math.cos(ply.face)*1.25;const[i,k]=bCell(x,z);const t=colTopJ(i,k);if(t<=-1e9||t*BLK>ply.y+2.6)return null;return{i,j:t,k};}
function placeBlock(){const t=buildTarget(),bk=ply.held;if(!t||!t.ok||!isBlk(bk)||!(inv[bk]>0)){SFX.deny();return;}addBlock(t.i,t.j,t.k,bk);inv[bk]--;SFX.place();P.sqv+=3;
  burst(t.i*BLK,t.j*BLK+BLK,t.k*BLK,[BLK_HEX[bk]??0xe2b07c,0xffffff,0xf3d3b8],7,2.5,cubeG);if(!(inv[bk]>0)){ply.held=null;refreshHeld();toast(`${ITEMS[bk].n}用完了～可以在合成選單的「方塊」做更多`);}renderHotbar();save();}
function removeBlock(){const t=blockTarget();if(!t)return;const c=delBlock(t.i,t.j,t.k);inv[c]=(inv[c]||0)+1;renderHotbar(c);SFX.chop();
  burst(t.i*BLK,t.j*BLK+BLK/2,t.k*BLK,[BLK_HEX[c]??0xe2b07c,0xc98d58,0xffffff],10,3.5,cubeG);save();}
$('btnDel').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!paused&&!ply.act)removeBlock();});
addEventListener('keydown',e=>{if(e.code===KB.del&&!e.repeat&&!paused&&started&&isBlk(ply.held)&&e.target.tagName!=='INPUT'&&!kbWait)removeBlock();});
// 只有滑鼠右鍵才拆方塊（手機長按也會觸發 contextmenu，以前會誤拆）
let lastPtrType='mouse';addEventListener('pointerdown',e=>{lastPtrType=e.pointerType;},true);
addEventListener('contextmenu',e=>{if(fpMode&&isBlk(ply.held)){e.preventDefault();if(lastPtrType==='mouse'&&e.button===2)removeBlock();}});
// 方塊預覽外框
const bGhost=(()=>{const g=new THREE.Group();const m=new THREE.Mesh(new THREE.BoxGeometry(BLK*1.02,BLK*1.02,BLK*1.02),basic(0x8fdcb4,{transparent:true,opacity:0.35,depthWrite:false}));g.add(m);
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BLK*1.04,BLK*1.04,BLK*1.04)),new THREE.LineBasicMaterial({color:0xffffff}));g.add(e);g.visible=false;scene.add(g);g.userData={m,e};return g;})();
const bGhostDel=(()=>{const e=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BLK*1.06,BLK*1.06,BLK*1.06)),new THREE.LineBasicMaterial({color:0xff7a5a}));e.visible=false;scene.add(e);return e;})();
function updateBuildGhost(T){
  fpHit=fpMode?castRay():null;
  if(fpMode&&!fpAllowed())setFP(false);
  document.body.classList.toggle('canfp',fpAllowed()&&!ply.sitting&&!ply.sleeping&&!ply.riding);document.body.classList.toggle('building',isBlk(ply.held));
  let t=null,mode=null;
  if(isBlk(ply.held)){t=buildTarget();mode='build';}
  {const dt2=isBlk(ply.held)?blockTarget():null;bGhostDel.visible=!!dt2;if(dt2)bGhostDel.position.set(dt2.i*BLK,dt2.j*BLK+BLK/2,dt2.k*BLK);$('btnDel').classList.toggle('dim',!dt2);}
  if(!t){bGhost.visible=false;return;}
  bGhost.visible=true;bGhost.position.set(t.i*BLK,t.j*BLK+BLK/2,t.k*BLK);const ok=mode==='del'||t.ok;
  bGhost.userData.m.material.color.setHex(mode==='del'?0xff9e6f:ok?0x8fdcb4:0xff6f6f);bGhost.userData.m.material.opacity=0.28+Math.sin(T*6)*0.08;bGhost.userData.e.material.color.setHex(mode==='del'?0xffd0b0:0xffffff);}

// ---------- 遊樂園 ----------
const PARK_OBS=obstacles.filter(o=>Math.hypot(o.x-PARK.x,o.z-PARK.z)<PARK.r+1&&o.r>0&&!o.navOnly);
function parkPush(n){for(const o of PARK_OBS){const dx=n.x-o.x,dz=n.z-o.z,d=Math.hypot(dx,dz),r=o.r+0.5;if(d<r&&d>1e-3){n.x=o.x+dx/d*r;n.z=o.z+dz/d*r;}}
  const dx=n.x-PARK.x,dz=n.z-PARK.z,d=Math.hypot(dx,dz);if(d>PARK.r-1&&!(n.away||Math.hypot(n.x-PARKV.gate.x,n.z-PARKV.gate.z)<5)){n.x=PARK.x+dx/d*(PARK.r-1);n.z=PARK.z+dz/d*(PARK.r-1);}}
const parkRiders=[];
{const looks=[{body:'#ff8fa3',accent:'#8a2a4a',eyes:'big',mouth:'open'},{species:'hamster',body:'#ffe6b8',accent:'#e8a070',ears:'round',mouth:'w'},{body:'#8fc8ff',accent:'#2a4a8a',mouth:'smile'},
  {species:'hamster',body:'#f5f5f5',accent:'#c8c0b8',ears:'bunny',eyes:'dot'},{body:'#ffd36e',accent:'#8a5a1a',eyes:'star',mouth:'open'},{body:'#c4b2f0',accent:'#4a3268',mouth:'w'},{species:'hamster',body:'#c98a5a',accent:'#7a4a2a',ears:'bear'},{body:'#ff8fa3',accent:'#8a2a4a',eyes:'star',mouth:'open'},{species:'hamster',body:'#fff3e2',accent:'#ffb3c8',ears:'bunny',mouth:'open'}];
 [['ferris',1],['ferris',4],['ferris',7],['carousel',0],['carousel',3],['carousel',5],['ferris',9],['coaster',2],['coaster',3]].forEach(([kind,i],n)=>{const c=makeCritter(Object.assign({species:'lobster',blush:true},looks[n]),false);c.setFace('happy');c.g.scale.setScalar(0.85);scene.add(c.g);parkRiders.push({kind,i,c,pose:newPose()});});}
const _wp=new THREE.Vector3();
function seatPos(kind,i,off=-0.75){if(kind==='coaster'){const car=PARKV.coaster.cars[i];const v=new THREE.Vector3(0,0.38,-0.2);car.localToWorld(v);return{x:v.x,y:v.y,z:v.z,ry:car.rotation.y,q:car.quaternion};}if(kind==='ferris'){const F=PARKV.ferris;F.cars[i].getWorldPosition(_wp);const c=Math.cos(F.yaw),s=Math.sin(F.yaw);return{x:_wp.x+c*off,y:_wp.y-F.drop,z:_wp.z-s*off,ry:F.yaw};}
  if(kind==='teacup'){const cup=PARKV.teacups.cups[i];const v=new THREE.Vector3(off===-0.75?-0.38:0.52,0.53,0);cup.localToWorld(v);cup.getWorldPosition(_wp);return{x:v.x,y:v.y,z:v.z,ry:Math.atan2(_wp.x-v.x,_wp.z-v.z)};}
  const K=PARKV.carousel,h=K.horses[i];h.h.getWorldPosition(_wp);const ry=K.ang-h.a;return{x:_wp.x-Math.sin(ry)*0.38,y:_wp.y+0.36,z:_wp.z-Math.cos(ry)*0.38,ry};}
function sitPoseOn(p,kind,T){p.legs=kind==='ferris'?[-0.2,0.2]:[-0.5,-0.5];p.sq=Math.sin(T*2.2)*0.04;p.arms=kind==='ferris'?[[-0.3+Math.sin(T*1.7)*0.2,0,-0.5],[-2.4+Math.sin(T*3)*0.3,0,0.4]]:[[-1.0,0,-0.3],[-1.0,0,0.3]];p.k=10;return p;}
function updatePark(dt,T){const F=PARKV.ferris,K=PARKV.carousel,TC=PARKV.teacups;const near=Math.hypot(ply.x-PARK.x,ply.z-PARK.z)<95;
  F.ang+=dt*0.1;F.wheel.rotation.z=F.ang;for(let i=0;i<F.n;i++){const a=F.ang+i/F.n*Math.PI*2;F.cars[i].position.set(Math.cos(a)*F.R,F.cy+Math.sin(a)*F.R,0);F.cars[i].rotation.z=Math.sin(T*1.3+i)*0.04;}
  K.ang-=dt*0.45;K.rot.rotation.y=K.ang;K.horses.forEach((h,i)=>{h.h.position.y=1.6+Math.sin(T*2.4+i*1.3)*0.28;});
  // 雲霄飛車
  {const CO=PARKV.coaster;const i0=Math.floor(CO.s*CO.N)%CO.N;const v=CO.v[i0];const ds=v*dt/CO.L;CO.s=(CO.s+ds)%1;CO.lap=(CO.lap||0)+ds;
   for(let k=0;k<CO.cars.length;k++){const u=((CO.s-k*3.0/CO.L)%1+1)%1;const p=CO.curve.getPointAt(u),q=CO.curve.getPointAt((u+0.004)%1);const car=CO.cars[k];car.position.copy(p);car.position.y+=0.15;car.lookAt(q.x,q.y+0.15,q.z);const so=CO.carSolids&&CO.carSolids[k];if(so){so.x=p.x;so.z=p.z;so.ry=Math.atan2(q.x-p.x,q.z-p.z);so.y0=p.y-0.3;so.top=p.y+1.25;}}}
  // 城堡餐廳
  {const CV=PARKV.castle;const nearC=CV.interior.visible;
   if(nearC){for(const d of CV.diners){const p=d.pose;const ph=(T*1.6+d.ph)%(Math.PI*2);p.sq=Math.sin(T*3+d.ph)*0.05;p.k=12;const bite=Math.sin(ph)>0.2;
      p.arms=[[bite?-2.0:-0.9,0,-0.5],[-0.6-Math.sin(T*2+d.ph)*0.3,0,0.5]];p.legs=[-1.2,-1.2];p.y=Math.abs(Math.sin(T*2.2+d.ph))*0.05;applyPose(d.c,p,dt);if(Math.random()<dt*0.08)burst(d.x,1.9,d.z,[0xff9ec7,0xffd36e],2,1.2);}
    for(const w of CV.waiters){const r=w.route,tg=r[w.k];const dx=tg[0]-w.x,dz=tg[1]-w.z,dd=Math.hypot(dx,dz);if(dd<0.3){w.k=(w.k+1)%r.length;}else{w.x+=dx/dd*1.4*dt;w.z+=dz/dd*1.4*dt;w.face+=angDiff(w.face,Math.atan2(dx,dz))*Math.min(1,dt*6);w.walk+=dt*8;}
      w.c.g.position.set(w.x,0.05,w.z);w.c.g.rotation.y=w.face;const p=walkPose(w.pose,w.walk,true,T);p.arms[0]=[-1.6,0,-0.3];applyPose(w.c,p,dt);}
    CV.flag.rotation.y=Math.sin(T*1.5)*0.25;CV.cake.rotation.y=Math.PI/2+Math.sin(T)*0.2;}}
  TC.plate.rotation.y+=dt*0.5;TC.cups.forEach((c,i)=>c.rotation.y+=dt*(1.2+i*0.3));
  const h=hour(),open=h>=7&&h<21;
  for(const r of parkRiders){r.c.g.visible=open&&near&&!(ply.riding&&ply.riding.kind===r.kind&&ply.riding.i===r.i);if(!r.c.g.visible)continue;const s=seatPos(r.kind,r.i);
    r.c.g.position.set(s.x,s.y,s.z);if(s.q)r.c.g.quaternion.copy(s.q);else r.c.g.rotation.set(0,s.ry,0);if(r.kind==='coaster'){const p=r.pose;p.arms=[[-2.8,0,-0.5],[-2.8,0,0.5]];p.legs=[-1.4,-1.4];p.k=14;applyPose(r.c,p,dt);}else applyPose(r.c,sitPoseOn(r.pose,r.kind,T+r.i),dt);}
}
function rideFerris(){const F=PARKV.ferris;let bi=0,bd=1e9;for(let i=0;i<F.n;i++){const a=F.ang+i/F.n*Math.PI*2;const d=Math.abs(angDiff(a,-Math.PI/2));if(d<bd){bd=d;bi=i;}}
  if(fpMode)setFP(false);if(carry)carryCancel();ply.riding={kind:'ferris',i:bi,a0:F.ang};const pt=pets.find(p=>p.follow);if(pt)pt.happy=1.5;ply.atkT=-1;ply.act=null;refreshHeld();SFX.jump();P.sqv+=4;toast('🎡 摩天輪出發！轉一圈會自動下車，也可以按「下來」');}
function rideCoaster(){if(fpMode)setFP(false);if(carry)carryCancel();ply.riding={kind:'coaster',i:0,lap0:PARKV.coaster.lap||0};ply.atkT=-1;ply.act=null;refreshHeld();SFX.jump();P.sqv+=4;const pt=pets.find(p=>p.follow);if(pt)pt.happy=1.5;toast('🎢 雲霄飛車出發！抓緊囉～跑一圈會自動下車');}
function rideCarousel(){const K=PARKV.carousel;let bi=0,bd=1e9;K.horses.forEach((h,i)=>{h.h.getWorldPosition(_wp);const d=Math.hypot(_wp.x-ply.x,_wp.z-ply.z);if(d<bd){bd=d;bi=i;}});
  if(fpMode)setFP(false);if(carry)carryCancel();ply.riding={kind:'carousel',i:bi};ply.atkT=-1;ply.act=null;refreshHeld();SFX.jump();P.sqv+=4;toast('🎠 騎上木馬了！');}
function rideTeacup(){const T=PARKV.teacups;let bi=0,bd=1e9;T.cups.forEach((c,i)=>{c.getWorldPosition(_wp);const d=Math.hypot(_wp.x-ply.x,_wp.z-ply.z);if(d<bd){bd=d;bi=i;}});
  if(fpMode)setFP(false);if(carry)carryCancel();ply.riding={kind:'teacup',i:bi,t0:performance.now()};const pt=pets.find(p=>p.follow);if(pt)pt.happy=1.5;ply.atkT=-1;ply.act=null;refreshHeld();SFX.jump();P.sqv+=4;toast(pt?`☕ 和 ${pt.d.name} 一起搭咖啡杯！轉 20 秒會自動下來`:'☕ 咖啡杯轉轉轉～20 秒會自動下來');}
function getOff(){const r=ply.riding;if(!r)return;ply.riding=null;refreshHeld();for(const p of pets)p.rideY=undefined;
  P.g.rotation.set(0,ply.face,0);if(r.kind==='coaster'){const e=PARKV.coaster.exit;ply.x=e.x;ply.z=e.z;}else if(r.kind==='ferris'){const e=PARKV.ferris.exit;ply.x=e.x;ply.z=e.z;}else if(r.kind==='teacup'){const T=PARKV.teacups;const a=Math.atan2(ply.z-T.z,ply.x-T.x);ply.x=T.x+Math.cos(a)*(T.R+1.6);ply.z=T.z+Math.sin(a)*(T.R+1.6);}else{const K=PARKV.carousel;const a=Math.atan2(ply.z-K.z,ply.x-K.x);ply.x=K.x+Math.cos(a)*(K.r+1.6);ply.z=K.z+Math.sin(a)*(K.r+1.6);}
  ply.y=H(ply.x,ply.z)+0.4;ply.vy=4;ply.ground=false;P.m.rotation.set(0,0,0);P.m.position.set(0,0,0);SFX.jump();}
function updateRide(dt,T){const r=ply.riding;const s=seatPos(r.kind,r.i);
  if(r.kind==='teacup'){const pt=pets.find(p=>p.follow);if(pt){const q=seatPos('teacup',r.i,1);pt.x=q.x;pt.z=q.z;pt.rideY=q.y-0.1;pt.face=q.ry;}if(performance.now()-r.t0>20000){getOff();toast('☕ 轉得頭暈暈～好好玩！');return;}}
  if(r.kind==='ferris'){const pt=pets.find(p=>p.follow);if(pt){const q=seatPos('ferris',r.i,0.95);pt.x=q.x;pt.z=q.z;pt.ry=q.y;pt.rideY=q.y;pt.face=q.ry+0.4;}}
  if(r.kind==='coaster'){const pt=pets.find(p=>p.follow);if(pt){const q=seatPos('coaster',1);pt.x=q.x;pt.z=q.z;pt.rideY=q.y;pt.face=q.ry;}
    ply.x=s.x;ply.z=s.z;ply.y=s.y;ply.vy=0;ply.face=s.ry;P.g.position.set(s.x,s.y,s.z);P.g.quaternion.copy(s.q);const p=newPose();p.legs=[-1.4,-1.4];p.arms=[[-2.8,0,-0.5],[-2.8,0,0.5]];p.sq=Math.sin(T*8)*0.04;applyPose(P,p,dt);
    if((PARKV.coaster.lap||0)-r.lap0>1.0){getOff();toast('🎢 好刺激！再來一次嗎？');}return;}ply.x=s.x;ply.z=s.z;ply.y=s.y;ply.vy=0;ply.face=s.ry;
  P.g.position.set(s.x,s.y,s.z);P.g.rotation.y=s.ry;applyPose(P,sitPoseOn(newPose(),r.kind,T),dt);if(P.tail)P.tail.rotation.y=Math.sin(T*3)*0.3;
  if(r.kind==='ferris'&&PARKV.ferris.ang-r.a0>Math.PI*2+0.05){getOff();toast('🎡 繞了一圈～風景好美！');}}

// ---------- 轉蛋 ----------
const GACHA_POOL=['cat','puppy','dino','bunny','chick','axolotl','fox','bear'];let gBusy=false;
let gKind='pet';const gPrice=()=>gKind==='hat'?500:100;
function openGacha(kind='pet'){gKind=kind;$('gTitle').textContent=kind==='hat'?'🎀 時裝轉蛋機':'🥚 寵物轉蛋機';renderGacha();$('gRes').innerHTML='';$('gEgg').className='';$('gEgg').style.opacity=0;openPanel('gacha');}
function renderGacha(){const pr=gPrice();
  if(gKind==='hat'){const own=HAT_IDS.filter(k=>inv[k]>0).length;$('gSub').textContent=`每次 🪙500，抽到帽子後在背包點一下就能戴上！已收集 ${own}/${HAT_IDS.length}（你有 🪙${ply.coins}）`;
    $('gList').innerHTML=HAT_IDS.map(k=>`<span class="${inv[k]>0?'own':'no'}" title="${ITEMS[k].n}">${itIcon(k)}</span>`).join('');}
  else{$('gSub').textContent=`每次 🪙100，會孵出滿好感度的寵物！（你有 🪙${ply.coins}）`;$('gList').innerHTML=GACHA_POOL.map(t=>`<span title="${PET_TYPES[t].n}">${PET_TYPES[t].i}</span>`).join('');}
  $('gBtn').textContent=`抽一次 🪙${pr}`;$('gBtn').disabled=gBusy||ply.coins<pr;$('gBtn').classList.toggle('pink',!$('gBtn').disabled);}
function pullHat(){const k=HAT_IDS[(Math.random()*HAT_IDS.length)|0];const it=ITEMS[k];const dup=inv[k]>0;
  if(dup){ply.coins+=250;updateHUD();}else{inv[k]=1;renderHotbar();}
  showReveal(itIcon(k),dup?`又抽到「${it.n}」`:`抽到了「${it.n}」！`,dup?'已經有這頂囉～退還 🪙250 給你':'打開背包 🎒 點一下就能戴上！<br><small>再點一次可以脫下</small>');save();}
$('gBtn').addEventListener('click',()=>{const pr=gPrice();if(gBusy||ply.coins<pr){SFX.deny();return;}gBusy=true;ply.coins-=pr;updateHUD();renderGacha();$('gRes').innerHTML='';SFX.craft();const kind=gKind;
  const type=GACHA_POOL[(Math.random()*GACHA_POOL.length)|0];const m=$('gMach'),e=$('gEgg');m.classList.remove('shake');void m.offsetWidth;m.classList.add('shake');e.className='';e.textContent=kind==='hat'?'🎁':'🥚';e.style.opacity=0;
  setTimeout(()=>{m.classList.remove('shake');void e.offsetWidth;e.className='drop';SFX.pickup(3);},1000);
  setTimeout(()=>{e.className='drop crack';SFX.thud();},1750);
  setTimeout(()=>{e.className='';e.style.opacity=0;const r=$('gEgg').getBoundingClientRect();sparkle(r.left+r.width/2,r.top+r.height/2,24);SFX.levelup();
    gBusy=false;closePanel('gacha');if(kind==='hat'){setTimeout(pullHat,250);return;}const p=hatchPet(type,null,false,true);setTimeout(()=>showPetReveal(p),250);save();},2800);});
let prT=null;
function showReveal(icon,title,msg){const R2=$('petReveal');$('prE').innerHTML=icon;$('prN').textContent=title;$('prM').innerHTML=msg;R2.classList.add('on');SFX.levelup();const r=$('prE').getBoundingClientRect();sparkle(r.left+r.width/2,r.top+r.height/2,28);paused=true;clearTimeout(prT);prT=setTimeout(hidePetReveal,5000);}
function showPetReveal(p){const R2=$('petReveal');$('prE').textContent=PET_TYPES[p.d.type].i;$('prN').textContent=`孵出了「${p.d.name}」！`;
  $('prM').innerHTML=(p.follow?'好感度 💗100，現在就跟著你走囉！🐾':'好感度 💗100<br>你已經有夥伴了，牠會先回家等你 🏠')+'<br><small>想換夥伴的話，到牠身邊按「邀請」</small>';
  R2.classList.add('on');SFX.levelup();const r=$('prE').getBoundingClientRect();sparkle(r.left+r.width/2,r.top+r.height/2,28);paused=true;clearTimeout(prT);prT=setTimeout(hidePetReveal,4500);}
function hidePetReveal(){const R2=$('petReveal');if(!R2.classList.contains('on'))return;R2.classList.remove('on');paused=false;SFX.close();}
$('prOk').addEventListener('click',hidePetReveal);$('petReveal').addEventListener('pointerdown',e=>{if(e.target.id==='petReveal')hidePetReveal();});
function hatchPet(type,name,silent,quiet){const base=PET_TYPES[type];const cnt=pets.filter(p=>p.d.type===type).length;
  const d={type,name:name||(base.n+(cnt?(cnt+1):'')),fav:base.fav,x:ply.x+Math.sin(ply.face)*1.6,z:ply.z+Math.cos(ply.face)*1.6,gacha:true};
  const p=makePet(d,100);p.happy=2;p.cave=!!ply.cave;
  if(!silent){if(pets.some(o=>o!==p&&o.follow)){sendHome(p);if(!quiet)toast(`${d.name} 已經有夥伴陪你了，牠先自己回家等你 🏠`);}else{p.follow=true;if(!quiet)toast(`${d.name} 成為你的夥伴了！🐾`);}
    burst(d.x,H(d.x,d.z)+0.6,d.z,PAST.map(c=>parseInt(c.slice(1),16)),20,4);ring(d.x,H(d.x,d.z)+0.1,d.z,0xff9ec7,0.3,3,0.6);}
  return p;}

// ---------- 手機：輕點畫面攻擊 ----------
function tapAct(){if(ply.sleeping||dlg)return;if(fpMode)doAction();else attack();}

// ---------- 洞窟層數（B1～B5）與水晶礦 ----------
let caveLv=1;const CAVE_DOWN={x:CAVE.x,z:CAVE.z-CAVE.r+5};
const CAVE_TINT=[[0x120c1e,0x2a1f3a,0xffffff],[0x0c1426,0x1c2a48,0xb8d0ff],[0x0a1c1c,0x183a3a,0xa8f0e0],[0x1e0c10,0x3a1c24,0xffb0b0],[0x16081e,0x2e1240,0xe0a8ff]];
function caveFog(){const t=CAVE_TINT[caveLv-1];return[t[0],t[1]];}
const caveMats=[];CAVEG.traverse(o=>{if(o.isMesh&&o.material.color&&!caveMats.includes(o.material)&&o.material.type!=='MeshBasicMaterial'){o.material.userData.base=o.material.color.clone();caveMats.push(o.material);}});
const caveDown=(()=>{const g=new THREE.Group();const pit=mk(new THREE.CircleGeometry(2.2,28),basic(0x05030a),0,0.04,0);pit.rotation.x=-Math.PI/2;g.add(pit);
  const rim=mk(new THREE.TorusGeometry(2.3,0.35,8,28),toon(0x6a5c7c),0,0.1,0);rim.rotation.x=Math.PI/2;g.add(rim);
  const glow=mk(new THREE.CylinderGeometry(2.1,1.6,2.5,24,1,true),basic(0xb48cff,{transparent:true,opacity:0.18,depthWrite:false,side:THREE.DoubleSide}),0,1.25,0);g.add(glow);
  for(let i=0;i<4;i++){const st=mk(new THREE.BoxGeometry(1.6,0.25,0.6),toon(0x8a7c9a),0,-0.2-i*0.25,-1.2+i*0.55);g.add(st);}
  const lb=new THREE.Sprite(new THREE.SpriteMaterial({map:textTex(['↓ 往下一層'],'#2a1f3a','#ffe6a0',256,64,34),depthWrite:false,transparent:true}));lb.scale.set(3,0.75,1);lb.position.y=3.2;g.add(lb);g.userData.lb=lb;
  g.position.set(CAVE_DOWN.x,0,CAVE_DOWN.z);scene.add(g);caveObs.push({x:CAVE_DOWN.x,z:CAVE_DOWN.z-2.6,r:0.01});return g;})();
caveDown.children.forEach(c=>{c.visible=false;});// 傳送點保持乾淨，不顯示文字
// ---------- 傳送點（走進去就會自動傳送，持續向外擴散的光波） ----------
const PORTAL_TEX=canvasTex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,0.95)');gr.addColorStop(0.35,'rgba(220,235,255,0.55)');gr.addColorStop(0.7,'rgba(190,215,255,0.18)');gr.addColorStop(1,'rgba(190,215,255,0)');g.clearRect(0,0,128,128);g.fillStyle=gr;g.fillRect(0,0,128,128);});
const PORTAL_COL=canvasTex(16,128,(g)=>{const gr=g.createLinearGradient(0,128,0,0);gr.addColorStop(0,'rgba(230,240,255,0.7)');gr.addColorStop(0.4,'rgba(210,228,255,0.22)');gr.addColorStop(1,'rgba(210,228,255,0)');g.clearRect(0,0,16,128);g.fillStyle=gr;g.fillRect(0,0,16,128);});
PORTAL_TEX.wrapS=PORTAL_TEX.wrapT=PORTAL_COL.wrapS=PORTAL_COL.wrapT=THREE.ClampToEdgeWrapping;
const portals=[];const portalRingG=new THREE.RingGeometry(0.86,1,56);
function makePortal(o){const g=new THREE.Group();const add=THREE.AdditiveBlending;
  const disc=mk(new THREE.CircleGeometry(o.r*1.25,40),new THREE.MeshBasicMaterial({map:PORTAL_TEX,transparent:true,depthWrite:false,blending:add,color:o.col||0xffffff}),0,0.06,0);disc.rotation.x=-Math.PI/2;g.add(disc);
  const col=mk(new THREE.CylinderGeometry(o.r*0.95,o.r*1.05,2.6,32,1,true),new THREE.MeshBasicMaterial({map:PORTAL_COL,transparent:true,depthWrite:false,blending:add,side:THREE.DoubleSide,color:o.col||0xffffff}),0,1.3,0);g.add(col);
  const rings=[];for(let i=0;i<4;i++){const r=mk(portalRingG,new THREE.MeshBasicMaterial({color:o.col||0xe8f2ff,transparent:true,depthWrite:false,blending:add,side:THREE.DoubleSide}),0,0.08+i*0.005,0);r.rotation.x=-Math.PI/2;g.add(r);rings.push(r);}
  if(o.label){const lb=new THREE.Sprite(new THREE.SpriteMaterial({map:textTex([o.label],'#2a1f3a','#ffe6a0',256,64,34),depthWrite:false,transparent:true}));lb.scale.set(3,0.75,1);lb.position.y=3.1;g.add(lb);o.lb=lb;}
  g.position.set(o.x,o.y,o.z);scene.add(g);Object.assign(o,{g,disc,col,rings,t:R(0,2)});portals.push(o);return o;}
let portalLock=0;
function updatePortals(dt,T){let near=1e9;
  for(const p of portals){const on=p.on?p.on():true;p.g.visible=on&&(!!p.cave===!!ply.cave);if(!p.g.visible)continue;p.t+=dt;
    p.disc.material.opacity=0.75+Math.sin(T*3)*0.15;p.col.material.opacity=0.55+Math.sin(T*2.2)*0.15;
    p.rings.forEach((r,i)=>{const k=((p.t*0.55+i/p.rings.length)%1);r.scale.setScalar(p.r*(0.25+k*1.55));r.material.opacity=(k<0.15?k/0.15:1)*(1-k)*0.95;});
    if(Math.random()<dt*10){const a=R(0,6.28),rr=Math.sqrt(Math.random())*p.r;burst(p.x+Math.cos(a)*rr,p.y+0.15,p.z+Math.sin(a)*rr,[0xffffff,0xd8e8ff,0xbfe0ff],1,0.3,partG,R(1,1.6),-R(2.5,4));}
    const d=Math.hypot(ply.x-p.x,ply.z-p.z);near=Math.min(near,d-p.r);
    if(d<p.r*0.85&&!portalLock&&!paused&&!ply.downed&&!ply.riding&&!ply.sleeping&&!ply.sitting&&!ply.reviving&&ply.y<p.y+1){portalLock=1;SFX.cast();ring(p.x,p.y+0.2,p.z,0xffffff,0.4,p.r*2.2,0.5);p.go();}}
  if(portalLock&&near>0.8)portalLock=0;}
const ores=[];const oreG=new THREE.OctahedronGeometry(0.42);
dropGeo.crystal=new THREE.OctahedronGeometry(0.2);dropMat.crystal=basic(0xd0a8ff);
function spawnOres(){for(const o of ores){scene.remove(o.g);const i=caveObs.indexOf(o.o);if(i>=0)caveObs.splice(i,1);}ores.length=0;
  const col=[0xd0a8ff,0x9fd8ff,0x9ff0d8,0xffa8b8,0xe0a0ff][caveLv-1];const n=5+caveLv;
  for(let k=0;k<n*8&&ores.length<n;k++){const a=R(0,6.28),d=R(6,CAVE.r-4);const x=CAVE.x+Math.cos(a)*d,z=CAVE.z+Math.sin(a)*d;if(!farFrom(x,z,1.6,caveObs)||Math.hypot(x-CAVE_EXIT.x,z-CAVE_EXIT.z)<6||Math.hypot(x-CAVE_DOWN.x,z-CAVE_DOWN.z)<5)continue;
    const g=new THREE.Group();g.add(mk(new THREE.DodecahedronGeometry(0.7,0),toon(0x6a5c7c),0,0.25,0));const m=basic(col);
    for(let i=0;i<5;i++){const c=mk(oreG,m,Math.cos(i*1.3)*0.35,0.7+(i%2)*0.2,Math.sin(i*1.3)*0.35);c.scale.set(0.7,1.7+(i%3)*0.4,0.7);c.rotation.set(Math.cos(i)*0.4,i,Math.sin(i)*0.4);g.add(c);}
    g.position.set(x,0,z);scene.add(g);const o={x,z,r:0.9};caveObs.push(o);ores.push({ore:true,x,z,g,o,hp:3+caveLv,max:3+caveLv,state:'alive',shake:0});}}
function nearestOre(){let best=null,bd=1.9;for(const o of ores){if(o.state!=='alive')continue;const d=Math.hypot(o.x-ply.x,o.z-ply.z)-0.8;if(d<bd){bd=d;best=o;}}return best;}
function mineOre(o){if(o.state!=='alive')return;const pw=minePow();if(pw===0){SFX.thud();o.shake=0.5;toast('好硬！需要 ⛏️ 鎬子才挖得動水晶');return;}
  o.hp-=pw;o.shake=1;SFX.mine();hitStop=0.035;burst(o.x,1,o.z,[0xd0a8ff,0xffffff],7,3.5,cubeG);
  if(o.hp<=0){o.state='gone';scene.remove(o.g);const i=caveObs.indexOf(o.o);if(i>=0)caveObs.splice(i,1);SFX.rock();burst(o.x,0.8,o.z,[0xd0a8ff,0x9fd8ff,0xffffff],18,5,cubeG);
    if(TV('a_transmute')&&Math.random()<0.1*TV('a_transmute'))spawnDrops('coin',o.x,1.2,o.z,5*TV('a_transmute'),1);spawnDrops('crystal',o.x,1,o.z,1+Math.floor(caveLv/2)+(Math.random()<0.4?1:0));spawnDrops('xp',o.x,1,o.z,2+caveLv,3);}}
function setCaveLv(n){caveLv=clamp(n,1,5);const t=new THREE.Color(CAVE_TINT[caveLv-1][2]);for(const m of caveMats)m.color.copy(m.userData.base).multiply(t);
  for(let i=monsters.length-1;i>=0;i--)if(monsters[i].cave){scene.remove(monsters[i].g);monsters.splice(i,1);}
  caveDown.visible=caveLv<5;caveDown.userData.lb.material.map=textTex([caveLv<5?`↓ 往 B${caveLv+1}`:'最深處'],'#2a1f3a','#ffe6a0',256,64,34);spawnOres();}
function goDeeper(){if(caveLv>=5)return;SFX.door();quickFade(()=>{setCaveLv(caveLv+1);ply.x=CAVE_EXIT.x;ply.z=CAVE_EXIT.z-3.2;ply.y=0;ply.vy=0;ply.face=Math.PI;camYaw=0;snapCam=true;
  for(const p of pets)if(p.follow){p.x=ply.x+1;p.z=ply.z+1;}toast(`🕳️ 洞窟 B${caveLv}：果凍怪變得更強了！小心～`);});}
function updateOres(dt){for(const o of ores){if(o.shake>0){o.shake=Math.max(0,o.shake-dt*5);o.g.position.x=o.x+Math.sin(o.shake*40)*0.06*o.shake;}}}

// ---------- 可互動提示（黃色小方塊） ----------
const MARK=mk(new THREE.OctahedronGeometry(0.3),basic(0xffc83d));MARK.scale.set(0.7,1.3,0.7);MARK.visible=false;MARK.renderOrder=5;scene.add(MARK);
function markTarget(c){const g=(x,z,dy)=>({x,z,y:(ply.cave?0:H(x,z))+dy});
  switch(c){
    case'board':return g(BOARD.x,BOARD.z,3.4);
    case'revive':{const d=nearestDowned();return d&&g(d.x,d.z,1.8);}
    case'chest':{const c=nearestChest();return c&&{x:c.x,z:c.z,y:2.2};}
    case'pinvite':case'player':{const r=nearestRemote();return r&&g(r.x,r.z,3.0);}
    case'talk':{const n=nearestNpc();return n&&g(n.x,n.z,(n.stall&&n.onPost?0.84:0)+2.9);}
    case'feed':case'invite':case'petmenu':{const p=nearestPet(1.8);return p&&g(p.x,p.z,1.7);}
    case'cave':return g(CAVE_FRONT.x,CAVE_FRONT.z,4.2);
    case'leave':return{x:CAVE_EXIT.x,z:CAVE_EXIT.z+2,y:4.6};
    case'deeper':return{x:CAVE_DOWN.x,z:CAVE_DOWN.z,y:4.2};
    case'ore':{const o=nearestOre();return o&&{x:o.x,z:o.z,y:2.4};}
    case'gacha':case'fgacha':{let b=null,bd=1e9;for(const m of GACHAS){const d=Math.hypot(m.x-ply.x,m.z-ply.z);if(d<bd){bd=d;b=m;}}return b&&g(b.x,b.z,3.5);}
    case'ferris':return g(PARKV.ferris.board.x,PARKV.ferris.board.z,2.6);
    case'coaster':return g(PARKV.coaster.board.x,PARKV.coaster.board.z,2.6);
    case'teacup':{const T=PARKV.teacups;const a=Math.atan2(ply.z-T.z,ply.x-T.x);return g(T.x+Math.cos(a)*T.R,T.z+Math.sin(a)*T.R,3.0);}
    case'carousel':{const K=PARKV.carousel;const a=Math.atan2(ply.z-K.z,ply.x-K.x);return g(K.x+Math.cos(a)*K.r,K.z+Math.sin(a)*K.r,3.2);}
    case'bench':case'sleep':case'sit':case'bath':{const p=nearestUse(1.3);return p&&{x:p.x,z:p.z,y:p.y+2.2};}
    case'move':{const p=nearestFurn(null,1.3);return p&&{x:p.x,z:p.z,y:p.y+2.2};}
    case'catch':{const b=nearestBug(2.8);return b&&g(b.x,b.z,b.y+0.9);}
    case'harvest':{const t=ripeTile();return t&&g(t.x,t.z,1.6);}
    case'weed':{const w=nearestWeed(1.9);return w&&g(w.x,w.z,1.5);}
    case'tree':{const t=nearestTree();return t&&g(t.x,t.z,5.4*t.s);}
    case'rock':{const r=nearestRock();return r&&g(r.x,r.z,1.9*r.s);}
  }return null;}
function updateMark(c,T){const t=markTarget(c);if(!t||paused){MARK.visible=false;return;}MARK.visible=true;MARK.position.set(t.x,t.y+Math.sin(T*3)*0.12,t.z);MARK.rotation.y=T*2.2;}

// ---------- 表情按鈕（左下） ----------
$('btnEmote').addEventListener('click',e=>{if(!paused&&started)openSocial();});

// ---------- 圖鑑 ----------
const DEX_PET_N={bunny:'小白兔',bunny2:'奶茶兔',chick:'小雞',cat:'小貓咪',puppy:'小狗狗',dino:'小恐龍',axolotl:'六角恐龍',fox:'小狐狸',bear:'小熊'};
const DEX={fruit:{n:'果實',i:'🍎',list:Object.keys(FRUITS),name:k=>FRUITS[k].n,icon:k=>FRUITS[k].i,hint:'砍樹時掉落的水果'},
  bug:{n:'昆蟲',i:'🦋',list:Object.keys(BUGS),name:k=>BUGS[k].n,icon:k=>'🦋',hint:'用捕蟲網抓到'},
  fish:{n:'魚類',i:'🐟',list:Object.keys(FISH),name:k=>FISH[k].n,icon:k=>FISH[k].i,hint:'在池塘釣到'},
  pet:{n:'寵物',i:'🐾',list:Object.keys(DEX_PET_N),name:k=>DEX_PET_N[k],icon:k=>(PET_TYPES[k]||PET_TYPES.bunny).i,hint:'好感度滿 💗100 才會登錄'}};
let dexGot={},dexAch={};try{const d=JSON.parse(localStorage.getItem('lobster-dex')||'{}');dexGot=d.got||{};dexAch=d.ach||{};}catch(e){}
function dexSave(){try{localStorage.setItem('lobster-dex',JSON.stringify({got:dexGot,ach:dexAch}));}catch(e){}}
function dexCat(k){if(FRUITS[k])return'fruit';if(BUGS[k])return'bug';if(FISH[k])return'fish';return null;}
function dexMark(cat,k,quiet){const key=cat+':'+k;if(dexGot[key])return;dexGot[key]=1;dexSave();if(!quiet){toast(`📖 圖鑑登錄：${DEX[cat].icon(k)} ${DEX[cat].name(k)}`);$('fab').classList.add('dot');}dexCheck(quiet);}
function dexCount(cat){return DEX[cat].list.filter(k=>dexGot[cat+':'+k]).length;}
function dexCheck(quiet){let all=true;for(const cat in DEX){const done=dexCount(cat)===DEX[cat].list.length;if(!done)all=false;
    if(done&&!dexAch[cat]){dexAch[cat]=1;if(!quiet){ply.coins+=100;toast(`🏆 成就達成：${DEX[cat].n}圖鑑全收集！獎勵 🪙100`);SFX.levelup();updateHUD();}}}
  if(all&&!dexAch.all){dexAch.all=1;if(!quiet){ply.coins+=500;toast('🏆✨ 圖鑑大師！全部圖鑑收集完成！獎勵 🪙500');SFX.levelup();updateHUD();}}dexSave();}
{const _add=addItem;addItem=function(k,n=1){_add(k,n);const c=dexCat(k);if(c&&started)dexMark(c,k);};}
setInterval(()=>{if(!started)return;for(const p of pets)if(p.aff>=100)dexMark('pet',p.d.type);},1000);
function dexSync(){for(const k in inv)if(inv[k]>0){const c=dexCat(k);if(c)dexMark(c,k,true);}for(const p of pets)if(p.aff>=100)dexMark('pet',p.d.type,true);}
let dexTab='fruit';
function renderDex(){const tabs=[...Object.entries(DEX).map(([k,d])=>[k,`${d.i} ${d.n} ${dexCount(k)}/${d.list.length}`]),['ach','🏆 成就']];
  $('dexTabs').innerHTML=tabs.map(([k,t])=>`<button class="tab ${k===dexTab?'on':''}" data-dt="${k}">${t}</button>`).join('');
  const tot=Object.keys(DEX).reduce((a,c)=>a+DEX[c].list.length,0),got=Object.keys(DEX).reduce((a,c)=>a+dexCount(c),0);$('dexSub').textContent=`收集進度 ${got}/${tot}`;
  if(dexTab==='ach'){const rows=[...Object.entries(DEX).map(([k,d])=>[dexAch[k],`${d.i} ${d.n}圖鑑全收集`,'🪙100']),[dexAch.all,'✨ 圖鑑大師（全部收集）','🪙500']];
    $('dexGrid').innerHTML=rows.map(([ok,t,r],i)=>`<div class="rc stg" style="--i:${i}"><div class="ic">${ok?'🏆':'🔒'}</div><div class="nm">${t}</div><div class="ds">${ok?'已達成！':'獎勵 '+r}</div></div>`).join('');return;}
  const D=DEX[dexTab];$('dexGrid').innerHTML=D.list.map((k,i)=>{const ok=dexGot[dexTab+':'+k];return`<div class="rc stg" style="--i:${i}"><div class="ic" style="${ok?'':'filter:grayscale(1) brightness(.3);opacity:.5'}">${D.icon(k)}</div><div class="nm">${ok?D.name(k):'？？？'}</div><div class="ds">${ok?'已登錄 ✅':D.hint}</div></div>`;}).join('');}
$('dexTabs').addEventListener('click',e=>{const b=e.target.closest('[data-dt]');if(!b)return;dexTab=b.dataset.dt;renderDex();SFX.click();});
function openDex(){dexSync();renderDex();openPanel('dex');$('fab').classList.remove('dot');}


function castleFrame(cam){const CV=PARKV.castle;const inside=CV.inside(ply.x,ply.z,-0.3);CV.roof.visible=!inside;const L=HOMEV.light;
  if(inside){L.position.set(CV.lightPos.x,5.5,CV.lightPos.z);L.intensity=0.35;L.distance=30;}else{L.position.set(HOME.x,3.4,HOME.z);L.distance=16;}
  CV.interior.visible=inside||Math.hypot(ply.x-(PARKV.KC.x+PARKV.KC.w),ply.z-PARKV.KC.z)<16;
  for(const w of CV.walls){const c=w.alongX?cam.z:cam.x;const cut=inside&&(c-w.pos)*w.innerSign<0;w.full.visible=!cut;if(w.stub)w.stub.visible=cut;for(const d of w.deco)d.visible=!cut;}}

// 洞窟的三個傳送點
makePortal({x:CAVE_FRONT.x,y:H(CAVE_FRONT.x,CAVE_FRONT.z),z:CAVE_FRONT.z,r:1.7,cave:false,go:()=>enterCave()});
makePortal({x:CAVE_EXIT.x,y:0,z:CAVE_EXIT.z+0.5,r:1.6,cave:true,go:()=>leaveCave()});
makePortal({x:CAVE_DOWN.x,y:0,z:CAVE_DOWN.z,r:1.7,cave:true,col:0xe0d0ff,on:()=>caveLv<5,go:()=>goDeeper()});
