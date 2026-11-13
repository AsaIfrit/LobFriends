// ===================== extra.js：第一人稱、木方塊建築、遊樂園、轉蛋 =====================
// ---------- 第一人稱 ----------
function fpAllowed(){return decoMode||!!carry||ply.held==='plank';}
function setFP(on){if(on===fpMode)return;fpMode=on;document.body.classList.toggle('fp',on);$('fpBtn').classList.toggle('on',on);snapCam=true;
  if(on){fpPitch=0.45;camYaw=ply.face+Math.PI;}else{P.g.visible=true;camYaw=ply.face+Math.PI;}SFX.click();showHbLabel(on?'👁️ 第一人稱（拖曳畫面轉視角）':'🎥 第三人稱');}
$('fpBtn').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!paused&&fpAllowed())setFP(!fpMode);});
addEventListener('keydown',e=>{if(e.code==='KeyV'&&!paused&&started&&e.target.tagName!=='INPUT'){if(fpMode||fpAllowed())setFP(!fpMode);}});

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
function placeBlock(){const t=buildTarget();if(!t||!t.ok||!(inv.plank>0)){SFX.deny();return;}addBlock(t.i,t.j,t.k);inv.plank--;SFX.place();P.sqv+=3;
  burst(t.i*BLK,t.j*BLK+BLK,t.k*BLK,[0xe2b07c,0xffffff,0xf3d3b8],7,2.5,cubeG);if(!(inv.plank>0)){ply.held=null;refreshHeld();toast('木塊用完了～用木材在合成選單做更多吧');}renderHotbar();save();}
function removeBlock(){const t=blockTarget();if(!t)return;delBlock(t.i,t.j,t.k);inv.plank=(inv.plank||0)+1;renderHotbar('plank');SFX.chop();
  burst(t.i*BLK,t.j*BLK+BLK/2,t.k*BLK,[0xe2b07c,0xc98d58,0xffffff],10,3.5,cubeG);save();}
// 方塊預覽外框
const bGhost=(()=>{const g=new THREE.Group();const m=new THREE.Mesh(new THREE.BoxGeometry(BLK*1.02,BLK*1.02,BLK*1.02),basic(0x8fdcb4,{transparent:true,opacity:0.35,depthWrite:false}));g.add(m);
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BLK*1.04,BLK*1.04,BLK*1.04)),new THREE.LineBasicMaterial({color:0xffffff}));g.add(e);g.visible=false;scene.add(g);g.userData={m,e};return g;})();
function updateBuildGhost(T){
  fpHit=fpMode?castRay():null;
  if(fpMode&&!fpAllowed())setFP(false);
  document.body.classList.toggle('canfp',fpAllowed()&&!ply.sitting&&!ply.sleeping&&!ply.riding);document.body.classList.toggle('building',ply.held==='plank');
  let t=null,mode=null;
  if(ply.held==='plank'){t=buildTarget();mode='build';}else if(decoMode&&!carry&&!nearestFurn(null,1.3)){t=blockTarget();mode='del';}
  if(!t){bGhost.visible=false;return;}
  bGhost.visible=true;bGhost.position.set(t.i*BLK,t.j*BLK+BLK/2,t.k*BLK);const ok=mode==='del'||t.ok;
  bGhost.userData.m.material.color.setHex(mode==='del'?0xff9e6f:ok?0x8fdcb4:0xff6f6f);bGhost.userData.m.material.opacity=0.28+Math.sin(T*6)*0.08;bGhost.userData.e.material.color.setHex(mode==='del'?0xffd0b0:0xffffff);}

// ---------- 遊樂園 ----------
const PARK_OBS=obstacles.filter(o=>Math.hypot(o.x-PARK.x,o.z-PARK.z)<PARK.r+1&&o.r>0);
function parkPush(n){for(const o of PARK_OBS){const dx=n.x-o.x,dz=n.z-o.z,d=Math.hypot(dx,dz),r=o.r+0.5;if(d<r&&d>1e-3){n.x=o.x+dx/d*r;n.z=o.z+dz/d*r;}}
  const dx=n.x-PARK.x,dz=n.z-PARK.z,d=Math.hypot(dx,dz);if(d>PARK.r-1&&!(n.away||Math.hypot(n.x-PARKV.gate.x,n.z-PARKV.gate.z)<5)){n.x=PARK.x+dx/d*(PARK.r-1);n.z=PARK.z+dz/d*(PARK.r-1);}}
const parkRiders=[];
{const looks=[{body:'#ff8fa3',accent:'#8a2a4a',eyes:'big',mouth:'open'},{species:'hamster',body:'#ffe6b8',accent:'#e8a070',ears:'round',mouth:'w'},{body:'#8fc8ff',accent:'#2a4a8a',mouth:'smile'},
  {species:'hamster',body:'#f5f5f5',accent:'#c8c0b8',ears:'bunny',eyes:'dot'},{body:'#ffd36e',accent:'#8a5a1a',eyes:'star',mouth:'open'},{body:'#c4b2f0',accent:'#4a3268',mouth:'w'},{species:'hamster',body:'#c98a5a',accent:'#7a4a2a',ears:'bear'}];
 [['ferris',1],['ferris',4],['ferris',7],['carousel',0],['carousel',3],['carousel',5],['ferris',9]].forEach(([kind,i],n)=>{const c=makeCritter(Object.assign({species:'lobster',blush:true},looks[n]),false);c.setFace('happy');c.g.scale.setScalar(0.85);scene.add(c.g);parkRiders.push({kind,i,c,pose:newPose()});});}
const _wp=new THREE.Vector3();
function seatPos(kind,i){if(kind==='ferris'){PARKV.ferris.cars[i].getWorldPosition(_wp);return{x:_wp.x,y:_wp.y-1.68,z:_wp.z,ry:PARKV.ferris.yaw};}
  const K=PARKV.carousel,h=K.horses[i];h.h.getWorldPosition(_wp);return{x:_wp.x,y:_wp.y+0.12,z:_wp.z,ry:K.ang-h.a};}
function sitPoseOn(p,kind,T){p.legs=kind==='ferris'?[-1.45,-1.45]:[-0.5,-0.5];p.sq=Math.sin(T*2.2)*0.04;p.arms=kind==='ferris'?[[-0.4,0,-0.6],[-0.4,0,0.6]]:[[-1.0,0,-0.3],[-1.0,0,0.3]];p.k=10;return p;}
function updatePark(dt,T){const F=PARKV.ferris,K=PARKV.carousel,TC=PARKV.teacups;const near=Math.hypot(ply.x-PARK.x,ply.z-PARK.z)<140;
  F.ang+=dt*0.1;F.wheel.rotation.z=F.ang;for(let i=0;i<F.n;i++){const a=F.ang+i/F.n*Math.PI*2;F.cars[i].position.set(Math.cos(a)*F.R,F.cy+Math.sin(a)*F.R,0);F.cars[i].rotation.z=Math.sin(T*1.3+i)*0.04;}
  K.ang+=dt*0.45;K.rot.rotation.y=K.ang;K.horses.forEach((h,i)=>{h.h.position.y=1.6+Math.sin(T*2.4+i*1.3)*0.28;});
  TC.plate.rotation.y+=dt*0.5;TC.cups.forEach((c,i)=>c.rotation.y+=dt*(1.2+i*0.3));
  const h=hour(),open=h>=7&&h<21;
  for(const r of parkRiders){r.c.g.visible=open&&near&&!(ply.riding&&ply.riding.kind===r.kind&&ply.riding.i===r.i);if(!r.c.g.visible)continue;const s=seatPos(r.kind,r.i);
    r.c.g.position.set(s.x,s.y+(r.kind==='ferris'?0.18:0),s.z);r.c.g.rotation.y=s.ry;applyPose(r.c,sitPoseOn(r.pose,r.kind,T+r.i),dt);}
}
function rideFerris(){const F=PARKV.ferris;let bi=0,bd=1e9;for(let i=0;i<F.n;i++){const a=F.ang+i/F.n*Math.PI*2;const d=Math.abs(angDiff(a,-Math.PI/2));if(d<bd){bd=d;bi=i;}}
  if(fpMode)setFP(false);if(carry)carryCancel();ply.riding={kind:'ferris',i:bi,a0:F.ang};ply.atkT=-1;ply.act=null;refreshHeld();SFX.jump();P.sqv+=4;toast('🎡 摩天輪出發！轉一圈會自動下車，也可以按「下來」');}
function rideCarousel(){const K=PARKV.carousel;let bi=0,bd=1e9;K.horses.forEach((h,i)=>{h.h.getWorldPosition(_wp);const d=Math.hypot(_wp.x-ply.x,_wp.z-ply.z);if(d<bd){bd=d;bi=i;}});
  if(fpMode)setFP(false);if(carry)carryCancel();ply.riding={kind:'carousel',i:bi};ply.atkT=-1;ply.act=null;refreshHeld();SFX.jump();P.sqv+=4;toast('🎠 騎上木馬了！');}
function getOff(){const r=ply.riding;if(!r)return;ply.riding=null;refreshHeld();
  if(r.kind==='ferris'){const e=PARKV.ferris.exit;ply.x=e.x;ply.z=e.z;}else{const K=PARKV.carousel;const a=Math.atan2(ply.z-K.z,ply.x-K.x);ply.x=K.x+Math.cos(a)*(K.r+1.4);ply.z=K.z+Math.sin(a)*(K.r+1.4);}
  ply.y=H(ply.x,ply.z)+0.4;ply.vy=4;ply.ground=false;P.m.rotation.set(0,0,0);P.m.position.set(0,0,0);SFX.jump();}
function updateRide(dt,T){const r=ply.riding;const s=seatPos(r.kind,r.i);ply.x=s.x;ply.z=s.z;ply.y=s.y;ply.vy=0;ply.face=s.ry;
  P.g.position.set(s.x,s.y,s.z);P.g.rotation.y=s.ry;applyPose(P,sitPoseOn(newPose(),r.kind,T),dt);if(P.tail)P.tail.rotation.y=Math.sin(T*3)*0.3;
  if(r.kind==='ferris'&&PARKV.ferris.ang-r.a0>Math.PI*2+0.05){getOff();toast('🎡 繞了一圈～風景好美！');}}

// ---------- 轉蛋 ----------
const GACHA_POOL=['cat','puppy','dino','bunny','chick','axolotl','fox','bear'];let gBusy=false;
function openGacha(){renderGacha();$('gRes').innerHTML='';$('gEgg').className='';$('gEgg').style.opacity=0;openPanel('gacha');}
function renderGacha(){$('gSub').textContent=`每次 🪙100，會孵出滿好感度的寵物！（你有 🪙${ply.coins}）`;$('gList').innerHTML=GACHA_POOL.map(t=>`<span title="${PET_TYPES[t].n}">${PET_TYPES[t].i}</span>`).join('');
  $('gBtn').disabled=gBusy||ply.coins<100;$('gBtn').classList.toggle('pink',!$('gBtn').disabled);}
$('gBtn').addEventListener('click',()=>{if(gBusy||ply.coins<100){SFX.deny();return;}gBusy=true;ply.coins-=100;updateHUD();renderGacha();$('gRes').innerHTML='';SFX.craft();
  const type=GACHA_POOL[(Math.random()*GACHA_POOL.length)|0];const m=$('gMach'),e=$('gEgg');m.classList.remove('shake');void m.offsetWidth;m.classList.add('shake');e.className='';e.textContent='🥚';e.style.opacity=0;
  setTimeout(()=>{m.classList.remove('shake');void e.offsetWidth;e.className='drop';SFX.pickup(3);},1000);
  setTimeout(()=>{e.className='drop crack';SFX.thud();},1750);
  setTimeout(()=>{e.className='';e.style.opacity=0;const r=$('gEgg').getBoundingClientRect();sparkle(r.left+r.width/2,r.top+r.height/2,24);SFX.levelup();
    const p=hatchPet(type);$('gRes').innerHTML=`<span class="pet">${PET_TYPES[type].i}</span>孵出了「${p.d.name}」！好感度 💗100`;gBusy=false;renderGacha();save();},2800);});
function hatchPet(type,name,silent){const base=PET_TYPES[type];const cnt=pets.filter(p=>p.d.type===type).length;
  const d={type,name:name||(base.n+(cnt?(cnt+1):'')),fav:base.fav,x:ply.x+Math.sin(ply.face)*1.6,z:ply.z+Math.cos(ply.face)*1.6,gacha:true};
  const p=makePet(d,100);p.happy=2;p.cave=!!ply.cave;
  if(!silent){if(pets.some(o=>o!==p&&o.follow)){sendHome(p);toast(`${d.name} 已經有夥伴陪你了，牠先自己回家等你 🏠`);}else{p.follow=true;toast(`${d.name} 成為你的夥伴了！🐾`);}
    burst(d.x,H(d.x,d.z)+0.6,d.z,PAST.map(c=>parseInt(c.slice(1),16)),20,4);ring(d.x,H(d.x,d.z)+0.1,d.z,0xff9ec7,0.3,3,0.6);}
  return p;}

loop();
