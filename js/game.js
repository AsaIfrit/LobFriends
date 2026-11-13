// ===================== game.js：玩家、NPC、怪物、戰鬥、農耕、家具、主迴圈 =====================
// ---------- 特效 ----------
const parts=[],puffs=[],partG=new THREE.OctahedronGeometry(0.11),cubeG=new THREE.BoxGeometry(0.14,0.14,0.14),puffG=new THREE.SphereGeometry(0.22,8,6);
const pMats={};const pMat=c=>pMats[c]||(pMats[c]=basic(c));
function burst(x,y,z,color,n=8,spd=4,geo=partG,life=0.7,grav=14){for(let i=0;i<n;i++){const p=new THREE.Mesh(geo,pMat(Array.isArray(color)?color[i%color.length]:color));p.position.set(x,y,z);
  p.v=new THREE.Vector3(R(-1,1)*spd,R(0.6,1.4)*spd,R(-1,1)*spd);p.life=p.max=life*R(0.7,1.2);p.s0=R(0.7,1.4);p.grav=grav;scene.add(p);parts.push(p);}}
function puff(x,y,z,col=0xf6f0e6,s=1){const m=new THREE.Mesh(puffG,basic(col,{transparent:true,opacity:0.8,depthWrite:false}));m.position.set(x+R(-.2,.2),y+0.15,z+R(-.2,.2));
  m.v=new THREE.Vector3(R(-.5,.5),R(0.5,1.1),R(-.5,.5));m.life=m.max=0.55;m.s=s;scene.add(m);puffs.push(m);}
const rings=[];
function ring(x,y,z,col,r0,r1,dur){const m=new THREE.Mesh(new THREE.RingGeometry(0.85,1,40),basic(col,{transparent:true,opacity:0.9,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);scene.add(m);rings.push({m,r0,r1,t:0,dur});}
const trails=[];const trailGeo={arc:new THREE.RingGeometry(0.9,2.7,28,1,-Math.PI/2-1.2,2.4),full:new THREE.RingGeometry(0.9,3.4,40,1,0,Math.PI*2),line:new THREE.PlaneGeometry(0.5,4.2)};
trailGeo.arc.rotateX(-Math.PI/2);trailGeo.full=new THREE.RingGeometry(0.9,3.0,28,1,-0.3,Math.PI*0.9);trailGeo.full.rotateY(Math.PI/2);trailGeo.full.translate(0,-0.3,0.4);trailGeo.line.rotateX(-Math.PI/2);trailGeo.line.translate(0,0,2.4);
function slash(kind,scale=1){const geo=kind==='c3'?trailGeo.full:kind==='line'?trailGeo.line:trailGeo.arc;
  const m=new THREE.Mesh(geo,basic(kind==='c2'?0xe8dcff:0xfff0e0,{transparent:true,opacity:0.85,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  m.position.set(ply.x,ply.y+0.75,ply.z);m.rotation.y=ply.face;m.scale.setScalar(scale);if(kind==='c2')m.rotation.z=0.25;if(kind==='c1')m.rotation.z=-0.2;scene.add(m);trails.push({m,t:0,dur:kind==='c3'?0.35:0.22,s0:scale});}
const dmgs=[];
function dmgNum(x,y,z,txt,crit){const cv=document.createElement('canvas');cv.width=128;cv.height=64;const c=cv.getContext('2d');c.font='900 46px "Zen Maru Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.lineWidth=10;c.strokeStyle=crit?'#ff7f6a':'#e0609a';c.strokeText(txt,64,34);c.fillStyle=crit?'#fff36e':'#ffffff';c.fillText(txt,64,34);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),depthTest:false,depthWrite:false,transparent:true}));s.renderOrder=20;s.position.set(x+R(-.3,.3),y,z);s.scale.set(crit?2.2:1.5,crit?1.1:0.75,1);scene.add(s);dmgs.push({s,t:0,vy:3});}
let hitStop=0;

// ---------- 玩家 ----------
let P=null,creatorOpen=false,creatorThen=null;
let look=Object.assign({},DEF_LOOK);
try{const l=localStorage.getItem('lobster-look');if(l)look=Object.assign({},DEF_LOOK,JSON.parse(l));}catch(e){}
let toolShow=null;
function refreshHeld(){if(!P)return;const k=(creatorOpen||ply.sitting||ply.sleeping||ply.riding)?null:(toolShow||(ply.held&&P.T[ply.held]?ply.held:null)||(ply.weapon));for(const t in P.T)P.T[t].visible=(t===k);}
function rebuildPlayer(){if(P)scene.remove(P.g);P=makeCritter(look,true);scene.add(P.g);refreshHeld();P.g.position.set(ply.x,ply.y,ply.z);}
rebuildPlayer();

// ---------- NPC ----------
const NPCS=[
  {name:'龍蝦村長',voice:0.8,home:{x:V2.x+3,z:V2.z+2},house:0,look:{body:'#e9773e',accent:'#6e3428',eyeSize:1.0,glasses:true,scarf:'#fff3a8'},
   lines:['歡迎來到龍蝦村～我是村長。','我們龍蝦精靈最喜歡圓滾滾的東西、熱拉麵，還有午睡。','舞台上那四個孩子每天都在練舞，去看看吧！','東邊野外的粉紅史萊姆晚上會變兇，要小心喔。']},
  {name:'小栗',voice:1.0,stall:'store',shop:'store',look:{body:'#c98a5a',accent:'#5a3022',patch:'#ffd9a0',hat:'beret',hatColor:'#ff8f73',apron:'#fff3ea'},
   lines:['歡迎光臨小栗雜貨店！種子、蛋糕、工具都有，也收購各種東西喔～']},
  {name:'木木',voice:0.9,stall:'furn',shop:'furn',look:{body:'#f2c49a',accent:'#7a4a2a',scarf:'#a894e8',mouth:'smile'},
   lines:['這裡是木木家具店！用家具把家裡布置得可愛一點吧～']},
  {name:'麵麵師傅',voice:0.85,stall:'ramen',shop:'ramen',look:{body:'#ff9a6a',accent:'#7a3428',hat:'chef',mouth:'smile'},
   lines:['來碗熱騰騰的拉麵吧！吃了精神百倍喔！']},
  {name:'波波',voice:1.15,home:{x:V2.x+7,z:V2.z-4},house:1,look:{body:'#9edbb0',accent:'#3f6e55',patch:'#fff3a8',mouth:'w',hat:'flower'},
   lines:['你想當農夫嗎？先用工作台做一把鋤頭，在草地上翻土！','種子可以在小栗的雜貨店買，種下去之後記得澆水～','作物每長大一階段，土就會乾掉，要再澆一次水喔！']},
  {name:'嚕嚕',voice:0.9,home:{x:V2.x-7,z:V2.z+6},house:2,look:{body:'#c4b2f0',accent:'#5a4690',patch:'#ffc4dc',sleepy:true,mouth:'o',hat:'nightcap',hatColor:'#8fb0f0'},
   lines:['呼啊…我最喜歡睡覺了…','躺在床上時間會變快 5 倍喔…zzz','累了也可以泡澡…家具店有賣浴缸…']},
  {name:'薩薩子',voice:1.35,home:{x:8,z:2},house:-1,look:{body:'#ffb3a0',accent:'#8a3a3a',patch:'#fff0a0',eyeSize:1.3,lash:'one',lashSize:1.3,lashY:0.45,mouth:'open',hat:'bow',hatColor:'#ff9ec7',blush:true},
   lines:['嗨嗨！我是薩薩子～你是新來的嗎？先徒手砍棵樹吧！','木材拿去做 🧰 工作台，放下後就能做武器跟工具喔！','打倒史萊姆會掉金幣跟經驗值，升級可以點天賦 ⭐','西南邊的龍蝦村有拉麵店跟舞台，順著小路走就到了～']},
  {name:'糰糰長老',voice:0.75,home:{x:V3.x+3,z:V3.z+3},door:V3HOUSES[0].door,look:{species:'hamster',body:'#fff3e2',accent:'#e8c49a',ears:'round',eyeSize:0.9,mouth:'smile',glasses:true,hat:'straw',hatColor:'#ff9ec4'},
   lines:['歡迎來到倉鼠精靈村，我是長老糰糰。','我們倉鼠精靈最喜歡葵花籽，還有在大滾輪上跑步！','龍蝦精靈是我們的老朋友，常常一起吃拉麵喔。']},
  {name:'米米',voice:1.25,home:{x:V3.x-6,z:V3.z-3},door:V3HOUSES[1].door,look:{species:'hamster',body:'#ffe6b8',accent:'#ffb38a',ears:'bear',eyeSize:1.3,mouth:'open',blush:true,hat:'bow',hatColor:'#ff8fb0'},
   lines:['嘿嘿～你看到廣場的大滾輪了嗎？超好玩的！','把種子塞在臉頰裡可以帶好多好多走喔！','東邊的史萊姆軟軟的，可是撞到很痛…']},
  {name:'豆豆',voice:1.05,home:{x:V3.x+7,z:V3.z+5},door:V3HOUSES[3].door,look:{species:'hamster',body:'#d9d4e8',accent:'#9a90b8',ears:'round',eyeSize:1.0,mouth:'w',scarf:'#8fc8f0'},
   lines:['我在研究怎麼讓南瓜長得更大…','聽說學了「綠手指」天賦，作物會長得更快！','雜貨店的小栗是我的好朋友～']},
  {name:'嘟嘟',voice:1.15,home:{x:V3.x-5,z:V3.z+7},door:V3HOUSES[2].door,look:{species:'hamster',body:'#c9a07a',accent:'#f2dcc0',ears:'cat',eyeSize:1.1,mouth:'v',blush:true,hat:'beret',hatColor:'#7cc49a'},
   lines:['你也是來看向日葵的嗎？','捕蟲網可以抓蝴蝶，藍閃蝶只住在東邊的森林裡喔。','晚上記得早點睡，不然會昏倒的！']}
];
function nameTag(txt){const cv=document.createElement('canvas');cv.width=256;cv.height=64;const c=cv.getContext('2d');c.font='900 30px "Zen Maru Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';
  const w=c.measureText(txt).width+30;c.fillStyle='rgba(255,250,240,.95)';c.strokeStyle='#e0a080';c.lineWidth=4;const x0=128-w/2;
  c.beginPath();c.moveTo(x0+16,6);c.arcTo(x0+w,6,x0+w,58,16);c.arcTo(x0+w,58,x0,58,16);c.arcTo(x0,58,x0,6,16);c.arcTo(x0,6,x0+w,6,16);c.fill();c.stroke();
  c.fillStyle='#6d5048';c.fillText(txt,128,33);const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),depthWrite:false,transparent:true}));s.scale.set(2.4,0.6,1);return s;}
const H2=V2HOUSES,H3=V3HOUSES;
NPCS.push(
  {name:'阿農',voice:0.95,job:'farm',field:0,home:{x:V2.x-24,z:V2.z-2},door:H2[2].door,look:{body:'#e9773e',accent:'#6e3428',mouth:'smile',eyes:'dot',hat:'straw'},lines:['今天的紅蘿蔔長得特別好！','澆水要澆在土上，不是葉子上喔～','想種田的話，先去做一把鋤頭吧！']},
  {name:'小樵',voice:0.85,job:'chop',home:{x:V2.x+30,z:V2.z+30},door:H2[7].door,look:{body:'#d9773a',accent:'#4a2a1a',brow:'thick',mouth:'zigzag'},lines:['嘿咻！嘿咻！砍樹是很好的運動！','砍倒的樹過一陣子會再長回來，大自然真神奇。']},
  {name:'漁漁',voice:1.1,job:'fish',home:{x:POND.x-POND.r-1.6,z:POND.z+3},look:{body:'#8fc8ff',accent:'#2a4a8a',eyes:'oval',mouth:'w'},lines:['噓…魚快上鉤了…','浮標沉下去的瞬間要馬上拉竿喔！','聽說池塘裡有小章魚！']},
  {name:'跳跳',voice:1.3,job:'net',home:{x:-10,z:-40},look:{body:'#ffb3a0',accent:'#8a3a3a',eyes:'big',mouth:'open',blushShape:'oval'},lines:['等等我～那隻蝴蝶好漂亮！','藍閃蝶只住在東邊的森林裡喔！']},
  {name:'米糰',voice:1.2,job:'farm',field:1,home:{x:V3.x+8,z:V3.z+18},door:H3[5].door,look:{species:'hamster',body:'#ffe6b8',accent:'#e8a070',ears:'round',mouth:'w',blushShape:'round'},lines:['草莓快熟了，好想偷吃一顆…','倉鼠精靈最會種田了！']},
  {name:'豆花',voice:1.15,job:'farm',field:2,home:{x:V3.x-14,z:V3.z-19},door:H3[4].door,look:{species:'hamster',body:'#f5f5f5',accent:'#c8c0b8',ears:'bear',eyes:'dot',mouth:'smile'},lines:['番茄紅了就可以收成囉～']},
  {name:'栗栗',voice:1.0,job:'chop',home:{x:V3.x-26,z:V3.z+4},door:H3[2].door,look:{species:'hamster',body:'#c98a5a',accent:'#7a4a2a',ears:'round',brow:'thin',mouth:'zigzag'},lines:['倉鼠的臉頰可以塞好多木材！']},
  {name:'泡泡',voice:1.25,job:'walk',home:{x:V2.x-6,z:V2.z+8},door:H2[6].door,look:{body:'#ff8fa3',accent:'#8a2a4a',eyes:'star',mouth:'open',blushShape:'heart'},lines:['我要去舞台看表演！','你今天也很可愛喔～']},
  {name:'墨墨',voice:0.9,job:'walk',home:{x:V2.x+10,z:V2.z-10},door:H2[5].door,look:{body:'#b9a6f2',accent:'#4a3268',eyes:'round',lash:'two',mouth:'smile'},lines:['拉麵店的特製拉麵超好吃！','晚上的星空很漂亮喔。']},
  {name:'棉棉',voice:1.2,job:'walk',home:{x:V3.x+4,z:V3.z-6},door:H3[1].door,look:{species:'hamster',body:'#fff3e2',accent:'#ffb3c8',ears:'bunny',eyes:'big',mouth:'w',blushShape:'heart'},lines:['我最喜歡在大滾輪上跑步了！','你要不要也來試試看？']}
);
// 遊樂園的遊客
{const nm=['小丸','圓圓','滴滴','噗噗','咕咕','麻糬','布丁','可可','奶昔','果凍','湯圓','餅餅'];const bodies=['#ff8fa3','#8fc8ff','#ffd36e','#8fdcb4','#c4b2f0','#ffb38a','#f5f5f5','#ffe6b8','#9edbb0','#ff9ec4','#cfe4ff','#e9773e'];
 const acc=['#8a2a4a','#2a4a8a','#8a5a1a','#2a6a4a','#4a3268','#8a3a2a','#9a90b8','#e8a070','#3f6e55','#8a2a4a','#2a4a8a','#6e3428'];
 const eyes=['round','dot','big','oval','star','round'],mouths=['w','smile','open','v','o','smile'],LINES=[['摩天輪上可以看到整個島喔！','晚上的燈光超漂亮～'],['旋轉木馬轉啊轉～好開心！','你也去騎騎看嘛！'],['咖啡杯轉太快頭好暈…','爆米花好香喔！'],['氣球要哪個顏色好呢？','我最喜歡粉紅色的氣球！'],['聽說轉蛋可以抽到小恐龍！','一百個金幣抽一次喔～']];
 for(let i=0;i<12;i++){const ham=i%3===1;const p=PARKV.poi[(i*5)%PARKV.poi.length];NPCS.push({name:nm[i],voice:0.9+(i%5)*0.1,job:'park',home:{x:p.x,z:p.z},door:PARKV.gateOut,
   look:Object.assign({species:ham?'hamster':'lobster',body:bodies[i],accent:acc[i],eyes:eyes[i%6],mouth:mouths[(i+2)%6],blush:i%2===0},ham?{ears:['round','bear','cat','bunny'][i%4]}:{}),lines:LINES[i%5]});}}
const npcs=NPCS.map(d=>{const c=makeCritter(Object.assign({species:'lobster'},d.look),!!d.job);const tag=nameTag(d.name);tag.position.y=2.4;c.g.add(tag);
  let hx,hz,face=0;if(d.stall){const s=STALLS[d.stall];hx=s.keeper.x;hz=s.keeper.z;face=s.ry;}else{hx=d.home.x;hz=d.home.z;}
  c.g.position.set(hx,H(hx,hz)+(d.stall?0.84:0),hz);scene.add(c.g);
  let door=d.door||(d.house>=0?V2HOUSES[d.house].door:null);if(!door){let bd=1e9;for(const h of[...V2HOUSES,...V3HOUSES]){const dd=Math.hypot(h.door.x-hx,h.door.z-hz);if(dd<bd){bd=dd;door=h.door;}}}
  const k=NPCS.indexOf(d)%5;
  return Object.assign({},d,{c,tag,x:hx,z:hz,hx,hz,face,tx:hx,tz:hz,wait:R(1,3),walk:0,talking:false,away:false,pose:newPose(),door,onPost:true,sleepH:20+k*0.5,wakeH:5.5+k*0.5});});
function nearestNpc(){if(ply.indoor||ply.cave)return null;let best=null,bd=1e9;for(const n of npcs){if(n.away)continue;const d=Math.hypot(n.x-ply.x,n.z-ply.z);if(d<(n.stall?3.4:2.6)&&d<bd){bd=d;best=n;}}return best;}
// 舞台上的四隻龍蝦精靈
const DANCE_COL=[['#ff8fa3','#8a2a4a'],['#8fc8ff','#2a4a8a'],['#ffd36e','#8a5a1a'],['#8fdcb4','#2a6a4a']];
const dancers=DANCE_COL.map(([b,a],i)=>{const c=makeCritter({species:'lobster',body:b,accent:a,eyeSize:1.1,mouth:i%2?'open':'smile',blush:true});c.setFace('happy');
  const lx=-2.7+i*1.8,x=STAGE.x-lx,z=STAGE.z-0.3;c.g.position.set(x,H(STAGE.x,STAGE.z)+0.68,z);c.g.rotation.y=Math.PI;scene.add(c.g);return{c,i,x,z,pose:newPose()};});

// ---------- 史萊姆 ----------
const monsters=[];
const hpBgM=basic(0x5a4070,{depthTest:false}),hpFgM=basic(0xff6f9f,{depthTest:false});
const CAVE_SLIMES=[{c:'#7ab8ff',hp:10,dmg:2,sp:1.0,coin:5,xp:5,w:4},{c:'#7fe08a',hp:12,dmg:2,sp:1.25,coin:5,xp:6,w:3},{c:'#b98aff',hp:16,dmg:3,sp:1.0,coin:7,xp:8,w:2},{c:'#ff6a6a',hp:14,dmg:3,sp:1.4,coin:7,xp:8,w:2},{c:'#ffd24a',hp:22,dmg:3,sp:1.1,coin:20,xp:12,w:0.6}];
function spawnCaveSlime(){let x=CAVE.x,z=CAVE.z;for(let k=0;k<30;k++){const a=R(0,6.28),d=R(4,CAVE.r-3);x=CAVE.x+Math.cos(a)*d;z=CAVE.z+Math.sin(a)*d;if(farFrom(x,z,1.2,caveObs)&&Math.hypot(x-ply.x,z-ply.z)>10)break;}
  let tot=CAVE_SLIMES.reduce((a,b)=>a+b.w,0),r=Math.random()*tot,d=CAVE_SLIMES[0];for(const c of CAVE_SLIMES){r-=c.w;if(r<=0){d=c;break;}}
  const size=R(0.95,1.3)*(d.w<1?1.3:1);const c=makeSlime(true,size,d.c,true);const g=c.g;
  const bar=new THREE.Group(),bg=mk(new THREE.PlaneGeometry(1,0.14),hpBgM),fg=mk(new THREE.PlaneGeometry(1,0.14),hpFgM,0,0,0.001);bg.renderOrder=fg.renderOrder=9;bar.add(bg,fg);bar.position.y=1.6;bar.visible=false;g.add(bar);
  g.position.set(x,0,z);c.m.scale.setScalar(0.01);scene.add(g);const hp=d.hp+Math.floor(ply.lv*1.2);
  monsters.push({g,c,mat:c.mat,bar,fg,x,z,y:0,vy:0,hp,max:hp,size,t:Math.random()*5,dir:Math.random()*6.28,wt:0,kx:0,kz:0,cool:0,dead:-1,flash:0,spawn:0,ifr:0,hop:R(0.3,1),shake:0,night:true,sq:0,sqv:0,cave:true,dmg:d.dmg,spd:d.sp,coin:d.coin,xpv:d.xp});}
function spawnMonster(){
  let x=80,z=0;const n=isNight(),zmin=n?36:56;
  for(let k=0;k<40;k++){x=R(zmin,106);z=R(-104,104);if(farFrom(x,z,1.2)&&Math.hypot(x-ply.x,z-ply.z)>20)break;}
  const size=R(0.85,1.15)*(n?1.12:1);const c=makeSlime(n,size);const g=c.g;
  const bar=new THREE.Group(),bg=mk(new THREE.PlaneGeometry(1,0.14),hpBgM),fg=mk(new THREE.PlaneGeometry(1,0.14),hpFgM,0,0,0.001);bg.renderOrder=fg.renderOrder=9;bar.add(bg,fg);bar.position.y=1.6;bar.visible=false;g.add(bar);
  g.position.set(x,H(x,z),z);c.m.scale.setScalar(0.01);scene.add(g);
  const hp=(n?6:4)+Math.floor(ply.lv*0.8);
  monsters.push({g,c,mat:c.mat,bar,fg,x,z,y:0,vy:0,hp,max:hp,size,t:Math.random()*5,dir:Math.random()*6.28,wt:0,kx:0,kz:0,cool:0,dead:-1,flash:0,spawn:0,ifr:0,hop:R(0.3,1),shake:0,night:n,sq:0,sqv:0});
}
const reticle=mk(new THREE.RingGeometry(0.95,1.18,36),basic(0xff8fa3,{transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));reticle.rotation.x=-Math.PI/2;reticle.visible=false;scene.add(reticle);
{const tri=new THREE.Group();for(let i=0;i<3;i++){const t=mk(new THREE.ConeGeometry(0.16,0.3,3),basic(0xffd36e));const a=i/3*Math.PI*2;t.position.set(Math.cos(a)*1.4,0,Math.sin(a)*1.4);t.rotation.z=Math.PI/2;t.rotation.y=-a;tri.add(t);}reticle.add(tri);tri.rotation.x=Math.PI/2;}
let lockT=null;
function nearestMonster(r,from=ply){if(ply.indoor)return null;let best=null,bd=r;for(const m of monsters){if(m.dead>=0||m.spawn<1||!!m.cave!==!!ply.cave)continue;const d=Math.hypot(m.x-from.x,m.z-from.z);if(d<bd){bd=d;best=m;}}return best;}

// ---------- 掉落物（金幣、經驗、素材） ----------
const drops=[];
const dropGeo={wood:new THREE.BoxGeometry(0.34,0.22,0.22),stone:new THREE.DodecahedronGeometry(0.17,0),gem:new THREE.OctahedronGeometry(0.18),coin:new THREE.CylinderGeometry(0.17,0.17,0.06,14),xp:new THREE.IcosahedronGeometry(0.13,0)};
const dropMat={wood:toon(0xe8b48a),stone:toon(0xd6cdee),gem:basic(0x8fe8ff),coin:toon(0xffd36e,{emissive:0x553300}),xp:basic(0x9ff0c8)};
let pickCombo=0,pickComboT=0;
const fruitGeo=new THREE.SphereGeometry(0.24,12,10);
function spawnDrops(kind,x,y,z,n,val=1){if(!dropGeo[kind]){dropGeo[kind]=fruitGeo;dropMat[kind]=toon(FRUITS[kind]?FRUITS[kind].col:0xffffff);}for(let i=0;i<n;i++){const m=mk(dropGeo[kind],dropMat[kind],x,y,z);if(kind==='coin')m.rotation.x=Math.PI/2;scene.add(m);
  drops.push({m,kind,val,v:new THREE.Vector3(R(-2.8,2.8),R(4.5,7.5),R(-2.8,2.8)),t:0});}}
function grantXP(n){ply.xp+=n;let up=false;while(ply.xp>=xpNeed(ply.lv)){ply.xp-=xpNeed(ply.lv);ply.lv++;ply.sp++;ply.max=10+(ply.lv-1);ply.hp=ply.max;up=true;}
  if(up)levelUpFX();updateHUD();}

// ---------- 投射物 ----------
const projs=[];
const arrowGeo=(()=>{const g=mergeGeos([[new THREE.CylinderGeometry(0.03,0.03,0.8,5),M4(0,0,0,Math.PI/2)],[new THREE.ConeGeometry(0.07,0.18,5),M4(0,0,0.48,Math.PI/2)],[new THREE.BoxGeometry(0.14,0.02,0.16),M4(0,0,-0.35)]]);return g;})();
const _wt=new THREE.Vector3();function weaponTip(){const t=ply.weapon==='staff'?P.T.staff.userData.gem:P.T.bow;t.getWorldPosition(_wt);return{x:_wt.x,y:_wt.y,z:_wt.z};}
function fireArrow(dir,dmg){const o=weaponTip();const m=mk(arrowGeo,toon(0xfff0d8),o.x,o.y,o.z);m.rotation.y=dir;scene.add(m);
  projs.push({kind:'arrow',m,x:o.x+Math.sin(dir)*0.3,hy:o.y-H(o.x,o.z),z:o.z+Math.cos(dir)*0.3,vx:Math.sin(dir)*28,vz:Math.cos(dir)*28,life:0.9,dmg,hit:new Set(),homing:TL('bow',3)});}
function fireOrb(dir,dmg){const m=new THREE.Group();m.add(mk(new THREE.SphereGeometry(0.28,14,10),basic(0xff9ed6)));m.add(mk(new THREE.SphereGeometry(0.45,14,10),basic(0xffd6f0,{transparent:true,opacity:0.4,depthWrite:false})));
  const o=weaponTip();m.position.set(o.x,o.y,o.z);scene.add(m);
  const t=nearestMonster(14);let vx=Math.sin(dir)*14,vz=Math.cos(dir)*14;
  projs.push({kind:'orb',m,x:m.position.x,hy:o.y-(ply.cave||ply.indoor?0:H(o.x,o.z)),z:m.position.z,vx,vz,life:1.2,dmg,hit:new Set(),target:t});}
function fireWave(dmg){const m=new THREE.Mesh(trailGeo.arc,basic(0xfff0d0,{transparent:true,opacity:0.8,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  m.position.set(ply.x,ply.y+0.75,ply.z);m.rotation.y=ply.face;scene.add(m);projs.push({kind:'wave',m,x:ply.x,y:ply.y+0.75,z:ply.z,vx:Math.sin(ply.face)*16,vz:Math.cos(ply.face)*16,life:0.55,dmg,hit:new Set()});}
function fireStar(x,z,target,dmg){const m=mk(new THREE.OctahedronGeometry(0.16),basic(0xfff07a),x,H(x,z)+1,z);scene.add(m);
  const a=R(0,6.28);projs.push({kind:'star',m,x,y:H(x,z)+1,z,vx:Math.cos(a)*7,vz:Math.sin(a)*7,life:1.4,dmg,hit:new Set(),target,homing:true});}
function explode(x,z,dmg){const rad=2.4*(TL('staff',2)?1.5:1);ring(x,H(x,z)+0.15,z,0xff9ed6,0.3,rad,0.4);ring(x,H(x,z)+0.2,z,0xffffff,0.2,rad*0.7,0.3);
  burst(x,H(x,z)+0.6,z,[0xff9ed6,0xffd6f0,0xffffff,0xfff07a],18,6);SFX.boom();hitStop=Math.max(hitStop,0.05);
  for(const m of monsters){if(m.dead>=0)continue;const d=Math.hypot(m.x-x,m.z-z);if(d<rad)damageMonster(m,dmg,(m.x-x)/(d||1),(m.z-z)/(d||1),true);}
  if(TL('staff',3))for(let i=0;i<3;i++)fireStar(x,z,null,Math.max(1,Math.round(dmg*0.5)));}

// ---------- 家具擺放／布置 ----------
let decoMode=false,carry=null,ghost=null,ghostOK=false,fpMode=false,fpPitch=0.3,fpHit=null;
const ghostOkM=basic(0x8fdcb4,{transparent:true,opacity:.5,depthWrite:false}),ghostNoM=basic(0xff6f6f,{transparent:true,opacity:.45,depthWrite:false});
function startCarry(id,orig){if(ghost)scene.remove(ghost);carry={id,orig,ry:orig?orig.ry:Math.round(ply.face/(Math.PI/2))*(Math.PI/2)};
  ghost=buildFurn(id);ghost.traverse(o=>{if(o.isMesh)o.material=ghostOkM;});scene.add(ghost);document.body.classList.add('carrying');renderHotbar();}
function endCarry(){if(ghost)scene.remove(ghost);ghost=null;carry=null;document.body.classList.remove('carrying');renderHotbar();}
function ghostSpot(){if(fpMode&&fpHit){let x=Math.round(fpHit.x*2)/2,z=Math.round(fpHit.z*2)/2;return[x,z];}
  const d=1.3+(carry?ITEMS[carry.id].r*fsOf(carry.id):0.8);let x=ply.x+Math.sin(ply.face)*d,z=ply.z+Math.cos(ply.face)*d;x=Math.round(x*2)/2;z=Math.round(z*2)/2;return[x,z];}
function carryRotate(){if(!carry)return;carry.ry+=Math.PI/2;SFX.click();}
function carryPlace(){if(!carry)return;const[x,z]=ghostSpot();if(!ghostOK){SFX.deny();toast('這裡放不下喔');return;}
  const y=supportY(x,z);const p=placeFurn(carry.id,x,z,carry.ry,true,y);if(!carry.orig){inv[carry.id]--;}SFX.place();burst(x,y+0.5,z,PAST.map(c=>parseInt(c.slice(1),16)),10,3);
  const id=carry.id,fromInv=!carry.orig;endCarry();if(fromInv&&inv[id]>0)startCarry(id,null);if(id==='bench')toast('工作台放好了！靠近它可以做進階道具 🔨');save();}
function carryStore(){if(!carry)return;addItem(carry.id,carry.orig?1:0);SFX.pickup(3);toast(`收進背包：${ITEMS[carry.id].n}`);endCarry();save();}
function carryCancel(){if(!carry)return;if(carry.orig){const o=carry.orig;placeFurn(carry.id,o.x,o.z,o.ry,false,o.y);}endCarry();}

// ---------- 輸入 ----------
const keys={};let holdAtk=false,holdAct=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(e.repeat&&['KeyJ','KeyE','KeyF'].includes(e.code))return;keys[e.code]=true;
  const act=e.code==='KeyE'||e.code==='KeyF'||e.code==='Enter';
  if(e.code==='KeyB'&&$('bag').classList.contains('show')){closePanel('bag');return;}
  if(e.code==='Escape'){if(typeof closeSocial==='function'&&$('social').classList.contains('show'))closeSocial();closeAllPanels();if(dlg)endTalk();if(carry)carryCancel();return;}
  if(dlg&&(act||e.code==='Space')){$('dlg').click();e.preventDefault();return;}
  if(ply.sleeping&&(act||e.code==='Space')){wakeUp();return;}
  if(paused)return;
  if(e.code==='Space'){jump();e.preventDefault();}
  if(e.code==='KeyJ'){holdAtk=true;attack();}
  if(act){holdAct=true;doAction();}
  if(e.code==='KeyR')carryRotate();
  if(e.code==='KeyC')openCraft();
  if(e.code==='KeyT')openTalents();
  if(/^Digit[0-9]$/.test(e.code)){const d=+e.code.slice(5);useHb(d===0?9:d-1);}
  if(e.code==='KeyB')openBag();});
addEventListener('keyup',e=>{keys[e.code]=false;if(e.code==='KeyJ')holdAtk=false;if(['KeyE','KeyF','Enter'].includes(e.code))holdAct=false;});
let camYaw=0,camPitch=0.42,camDist=10,previewYaw=0;
const joy={id:null,ox:0,oy:0,x:0,y:0},look2={id:null,lx:0,ly:0,sx:0,sy:0,t:0,mouse:false};
const cv=$('c');
cv.addEventListener('pointerdown',e=>{initAudio();
  if(e.pointerType!=='mouse'&&e.clientX<innerWidth*0.5&&joy.id===null&&!ply.sleeping&&!creatorOpen){joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;joy.x=joy.y=0;
    const b=$('joyBase');b.style.display='block';b.style.left=e.clientX+'px';b.style.top=e.clientY+'px';$('joyKnob').style.transform='';}
  else if(look2.id===null){look2.id=e.pointerId;look2.lx=look2.sx=e.clientX;look2.ly=look2.sy=e.clientY;look2.t=performance.now();look2.mouse=e.pointerType==='mouse';}
  try{cv.setPointerCapture(e.pointerId);}catch(_){}});
cv.addEventListener('pointermove',e=>{
  if(e.pointerId===joy.id){let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const d=Math.hypot(dx,dy),mx=52;if(d>mx){dx*=mx/d;dy*=mx/d;}joy.x=dx/mx;joy.y=dy/mx;$('joyKnob').style.transform=`translate(${dx}px,${dy}px)`;}
  else if(e.pointerId===look2.id&&creatorOpen){previewYaw+=(e.clientX-look2.lx)*0.012;look2.lx=e.clientX;}
  else if(e.pointerId===look2.id){camYaw-=(e.clientX-look2.lx)*0.006;if(fpMode)fpPitch=clamp(fpPitch+(e.clientY-look2.ly)*0.004,-1.2,1.35);else camPitch=clamp(camPitch+(e.clientY-look2.ly)*0.004,0.12,1.2);look2.lx=e.clientX;look2.ly=e.clientY;}});
function endPtr(e){if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;$('joyBase').style.display='none';}
  if(e.pointerId===look2.id){if(look2.mouse&&!paused&&!creatorOpen&&Math.hypot(e.clientX-look2.sx,e.clientY-look2.sy)<6&&performance.now()-look2.t<300){if(fpMode)doAction();else attack();}look2.id=null;}}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
let wheelAcc=0,wheelT=0;
cv.addEventListener('wheel',e=>{e.preventDefault();const d=e.deltaY||e.deltaX;
  if(e.shiftKey){camDist=clamp(camDist+d*0.01,5,18);return;}
  if(!started||paused||creatorOpen)return;wheelAcc+=d;const now=performance.now();
  if(Math.abs(wheelAcc)>=40&&now-wheelT>90){cycleSlot(wheelAcc>0?1:-1);wheelAcc=0;wheelT=now;}},{passive:false});
function jump(){if(ply.ground&&ply.atkT<0&&!ply.sleeping&&!ply.sitting){ply.vy=8.5;ply.ground=false;SFX.jump();P.sqv+=4.5;puff(ply.x,ply.y,ply.z);}}

// ---------- 互動判定 ----------
function nearestWeed(r){let best=null,bd=r;for(const w of weeds){if(w.g.grow<1)continue;const d=Math.hypot(w.x-ply.x,w.z-ply.z);if(d<bd){bd=d;best=w;}}return best;}
function nearestTree(){let best=null,bd=1e9;for(const t of trees){if(t.state!=='alive')continue;const d=Math.hypot(t.x-ply.x,t.z-ply.z)-t.o.r;if(d<1.5&&d<bd){bd=d;best=t;}}return best;}
function nearestRock(){let best=null,bd=1e9;for(const r of rocks){if(r.state!=='alive')continue;const d=Math.hypot(r.x-ply.x,r.z-ply.z)-r.o.r;if(d<1.4&&d<bd){bd=d;best=r;}}return best;}
function nearestFurn(id,r){let best=null,bd=r;for(const p of placed){if(p.indoor!==ply.indoor)continue;if(id&&p.id!==id)continue;const d=Math.hypot(p.x-ply.x,p.z-ply.z)-Math.min(ITEMS[p.id].r*fsOf(p.id),1.4);if(d<bd){bd=d;best=p;}}return best;}
const interactive=p=>{const it=ITEMS[p.id];return it.bed||it.sit||it.bath||p.id==='bench';};
function nearestUse(r){let best=null,bd=r;for(const p of placed){if(p.indoor!==ply.indoor||!interactive(p))continue;const d=Math.hypot(p.x-ply.x,p.z-ply.z)-ITEMS[p.id].r*fsOf(p.id);if(d<bd){bd=d;best=p;}}return best;}
function nearestBug(r){let best=null,bd=r;for(const b of butterflies){if(!b.g.visible)continue;const d=Math.hypot(b.x-ply.x,b.z-ply.z);if(d<bd){bd=d;best=b;}}return best;}
function frontGrid(){const x=ply.x+Math.sin(ply.face)*1.9,z=ply.z+Math.cos(ply.face)*1.9;return[Math.round(x/TILE),Math.round(z/TILE)];}
function frontTile(){const[gx,gz]=frontGrid();return farm.get(gkey(gx,gz));}
function ripeTile(){let best=null,bd=1.9;for(const t of farm.values()){if(!t.crop||t.crop.stage<3)continue;const d=Math.hypot(t.x-ply.x,t.z-ply.z);if(d<bd){bd=d;best=t;}}return best;}
function context(){
  if(ply.sleeping)return'none';
  if(ply.riding)return'getoff';
  if(ply.sitting)return'stand';
  if(carry)return'place';
  if(ply.held==='plank'){const t=buildTarget();return t&&t.ok?'build':'none';}
  if(decoMode&&nearestFurn(null,1.3))return'move';
  if(decoMode){const t=blockTarget();if(t)return'unblock';}
  const fr=nearestUse(1.3);
  if(ply.fishing)return ply.fishing.phase==='bite'?'reel':'wait';
  if(ply.cave){if(Math.hypot(ply.x-CAVE_EXIT.x,ply.z-CAVE_EXIT.z)<2.6)return'leave';return'none';}
  if(Math.hypot(ply.x-BOARD.x,ply.z-BOARD.z)<3.3)return'board';
  if(GACHAS.some(g=>Math.hypot(ply.x-g.front.x,ply.z-g.front.z)<2.2))return'gacha';
  if(Math.hypot(ply.x-PARKV.ferris.board.x,ply.z-PARKV.ferris.board.z)<2.6)return'ferris';
  {const K=PARKV.carousel;const d=Math.hypot(ply.x-K.x,ply.z-K.z);if(d<K.r+1.9&&d>K.r-0.5)return'carousel';}
  if(nearestNpc())return'talk';
  {const pt=nearestPet(1.8);if(pt&&!pt.follow){if(pt.aff>=100)return'invite';if(hasFoodFor(pt))return'feed';}}
  if(Math.hypot(ply.x-CAVE_FRONT.x,ply.z-CAVE_FRONT.z)<4)return'cave';

  if(ply.held==='rod'&&Math.hypot(ply.x-POND.x,ply.z-POND.z)<POND.r+2.4)return'fish';
  if(fr){const it=ITEMS[fr.id];if(fr.id==='bench')return'bench';if(it.bed)return'sleep';if(it.sit)return'sit';if(it.bath)return'bath';}
  if(ply.held==='net'&&nearestBug(2.8))return'catch';
  if(ripeTile())return'harvest';
  const[gx,gz]=frontGrid(),ft=farm.get(gkey(gx,gz));
  if(ply.held==='hoe'&&ft)return'untill';
  if(ply.held==='hoe'&&canTill(gx,gz))return'till';
  if(ply.held==='can'&&ft)return'water';
  if(ply.held&&ply.held.startsWith('seed_')&&ft&&!ft.crop)return'plant';
  if(nearestWeed(1.9))return'weed';
  if(nearestTree())return'tree';
  if(nearestRock())return'rock';
  return'none';
}
const CTX={getoff:['🚶','下來'],build:['🧱','蓋方塊'],unblock:['🔨','拆方塊'],gacha:['🥚','轉蛋'],ferris:['🎡','搭摩天輪'],carousel:['🎠','騎木馬'],place:['✨','放置'],move:['🫳','搬動'],stand:['🧍','起來'],board:['📋','告示板'],talk:['💬','對話'],enter:['🚪','進屋'],exit:['🚪','出門'],sleep:['🛏️','躺下'],sit:['🪑','坐下'],bath:['🛁','泡澡'],
  catch:['🥅','捕捉'],harvest:['🧺','收成'],till:['🟫','翻土'],water:['💧','澆水'],plant:['🌱','播種'],bench:['🧰','合成'],cave:['⛰️','進入洞窟'],leave:['🌤️','離開洞窟'],fish:['🎣','釣魚'],wait:['🎣','收竿'],reel:['❗','拉竿！'],feed:['🍎','餵食'],invite:['💕','邀請'],pat:['🤲','摸摸'],untill:['🟩','剷平'],weed:['🌿','拔草'],tree:['🪓','砍樹'],rock:['⛏️','挖礦'],none:['🤚','互動']};
const ACT_DUR={pull:0.4,chop:0.42,mine:0.38,till:0.45,water:0.7,plant:0.45,catch:0.45,harvest:0.5};
const ACT_HIT={pull:0.5,chop:0.6,mine:0.6,till:0.62,water:0.5,plant:0.55,catch:0.55,harvest:0.5};
function faceTo(x,z){ply.face=Math.atan2(x-ply.x,z-ply.z);}
const EN_COST={pull:0.6,chop:1.2,mine:1.2,till:1,water:0.4,plant:0.3,catch:0.5,harvest:0.4};
function useEn(v){ply.en=Math.max(0,ply.en-v);}
function startAct(a,target,tool){useEn(EN_COST[a]||0.3);ply.act=a;ply.actT=0;ply.hit=0;ply.target=target;toolShow=tool||null;refreshHeld();}
function doAction(){
  if(ply.act||ply.atkT>=0||ply.sleeping)return;
  const c=context();
  switch(c){
    case'place':carryPlace();break;
    case'move':{const p=nearestFurn(null,1.3);const orig={x:p.x,z:p.z,ry:p.ry,y:p.y};removeFurn(p);SFX.pickup(2);startCarry(p.id,orig);break;}
    case'stand':standUp();break;
    case'board':renderBoard();openPanel('board');break;
    case'talk':{const n=nearestNpc();faceTo(n.x,n.z);talkTo(n);break;}
    case'bench':openCraft();break;
    case'getoff':getOff();break;
    case'build':placeBlock();break;
    case'unblock':removeBlock();break;
    case'gacha':openGacha();break;
    case'ferris':rideFerris();break;
    case'carousel':rideCarousel();break;
    case'sleep':{const b=nearestUse(1.3);lieDown(b);break;}
    case'sit':case'bath':sitOn(nearestUse(1.3),c);break;
    case'catch':{const b=nearestBug(2.8);faceTo(b.x,b.z);startAct('catch',b,'net');SFX.net();break;}
    case'harvest':{const t=ripeTile();faceTo(t.x,t.z);startAct('harvest',t);break;}
    case'till':{const[gx,gz]=frontGrid();startAct('till',{gx,gz},'hoe');break;}
    case'untill':{const[gx,gz]=frontGrid();startAct('till',{gx,gz,untill:true},'hoe');break;}
    case'cave':enterCave();break;
    case'leave':leaveCave();break;
    case'fish':startFishing();break;
    case'wait':endFishing('收竿了');break;
    case'reel':catchFish();break;
    case'feed':case'invite':petAction(nearestPet(1.8),c);break;
    case'water':startAct('water',frontTile(),'can');SFX.water();break;
    case'plant':startAct('plant',frontTile());break;
    case'weed':{const w=nearestWeed(1.9);faceTo(w.x,w.z);startAct('pull',w,'_none');break;}
    case'tree':{const t=nearestTree();faceTo(t.x,t.z);startAct('chop',t,has('axe2')?'axe2':has('axe1')?'axe1':'stick');break;}
    case'rock':{const r=nearestRock();faceTo(r.x,r.z);startAct('mine',r,has('pick2')?'pick2':has('pick1')?'pick1':'stick');break;}
  }
}
function actImpact(){
  const t=ply.target;
  if(ply.act==='pull'){const i=weeds.indexOf(t);if(i<0)return;weeds.splice(i,1);scene.remove(t.g);burst(t.x,H(t.x,t.z)+0.5,t.z,[0x5fae4c,0x8fd97a],12,4);SFX.pull();addItem('weed',1);
    spawnDrops('xp',t.x,H(t.x,t.z)+0.5,t.z,1,2);if(Q.weed.state==='active')progress('weed');else if(!ply.hintWeed){ply.hintWeed=1;toast('告示板有拔草委託喔 📋');}weedTimers.push(25);}
  else if(ply.act==='chop'){if(t.state!=='alive')return;t.hp-=chopPow();t.shake=1;SFX.chop();hitStop=0.035;
    const hx=t.x-Math.sin(ply.face)*0.45,hz=t.z-Math.cos(ply.face)*0.45;
    burst(hx,H(t.x,t.z)+1,hz,0xf3d3b8,5,3.5,cubeG);burst(t.x,H(t.x,t.z)+2.8*t.s,t.z,t.kind==='cherry'?[0xffb6cf,0xffe0ec]:t.kind.startsWith('pine')?[0x3e8c64,0x8fd0a8]:[0x79c45a,0xb8e89a],6,2.5);
    if(TL('wood',2)){burst(hx,H(t.x,t.z)+1.2,hz,[0xff9ed6,0xfff07a,0xffffff],8,4);ring(t.x,H(t.x,t.z)+0.1,t.z,0xff9ed6,0.3,1.6,0.3);}
    if(t.hp<=0){t.state='falling';t.t=0;t.yawG.rotation.y=ply.face;SFX.fall();}}
  else if(ply.act==='mine'){if(t.state!=='alive')return;const pw=minePow();
    if(pw===0){SFX.thud();t.shake=0.5;if(!ply.hintRock||performance.now()-ply.hintRock>4000){ply.hintRock=performance.now();toast('好硬！需要 ⛏️ 鎬子才挖得動');}return;}
    t.hp-=pw;t.shake=1;SFX.mine();hitStop=0.035;burst(t.x,H(t.x,t.z)+0.6,t.z,[0xdcd3ec,0xffffff],6,3.5,cubeG);
    if(TL('mine',2))burst(t.x,H(t.x,t.z)+0.9,t.z,[0xff9ed6,0xfff07a],8,4);
    if(t.hp<=0){t.state='gone';t.t=0;t.m.visible=false;t.o.r=0;SFX.rock();burst(t.x,H(t.x,t.z)+0.5,t.z,[0xdcd3ec,0xc3b0ff,0xffffff],16,5,cubeG);
      spawnDrops('stone',t.x,H(t.x,t.z)+0.6,t.z,1+Math.round(t.s*1.5));if(Math.random()<(TL('mine',3)?0.3:0.04))spawnDrops('gem',t.x,H(t.x,t.z)+0.8,t.z,1);
      spawnDrops('xp',t.x,H(t.x,t.z)+0.6,t.z,2,2);}}
  else if(ply.act==='till'&&t.untill){const tl=farm.get(gkey(t.gx,t.gz));if(!tl)return;scene.remove(tl.m);if(tl.crop&&tl.crop.mesh)scene.remove(tl.crop.mesh);farm.delete(gkey(t.gx,t.gz));SFX.till();burst(tl.x,H(tl.x,tl.z)+0.2,tl.z,[0x86cf6c,0xc7976a],10,3,cubeG);}
  else if(ply.act==='till'){if(!canTill(t.gx,t.gz))return;const tl=till(t.gx,t.gz);SFX.till();burst(tl.x,H(tl.x,tl.z)+0.2,tl.z,[0xc7976a,0x8c6040],10,3,cubeG);}
  else if(ply.act==='water'){const[gx,gz]=frontGrid();const R3=TL('farm',2)?1:0;let n=0;
    for(let dx=-R3;dx<=R3;dx++)for(let dz=-R3;dz<=R3;dz++){const tt=farm.get(gkey(gx+dx,gz+dz));if(tt){setWet(tt,true);n++;burst(tt.x,H(tt.x,tt.z)+0.3,tt.z,[0x9fdcff,0xd8f2ff],5,2.5);}}
    if(R3)ring(gx*TILE,H(gx*TILE,gz*TILE)+0.2,gz*TILE,0x9fdcff,0.3,2.2,0.4);}
  else if(ply.act==='plant'){if(!t||t.crop||!(inv[ply.held]>0))return;const type=ITEMS[ply.held].crop;inv[ply.held]--;t.crop={type,stage:0,g:0};setCropStage(t,0);SFX.plant();
    burst(t.x,H(t.x,t.z)+0.3,t.z,[0x8fd97a,0xffffff],6,2);if(!(inv[ply.held]>0)){ply.held=null;refreshHeld();}renderHotbar();}
  else if(ply.act==='catch'){const b=t;if(butterflies.includes(b)&&Math.hypot(b.x-ply.x,b.z-ply.z)<3.2){const i=butterflies.indexOf(b);butterflies.splice(i,1);scene.remove(b.g);
      addItem(b.sp);SFX.catchBug();burst(b.x,H(b.x,b.z)+b.y,b.z,PAST.map(c=>parseInt(c.slice(1),16)),12,3);toast(`抓到了 ${ITEMS[b.sp].n}！🦋`);spawnDrops('xp',b.x,H(b.x,b.z)+1,b.z,3,3);
      P.setFace('happy');setTimeout(()=>P.setFace('open'),900);}else{SFX.deny();toast('跑掉了…');}}
  else if(ply.act==='harvest'){const tt=t;if(!tt.crop||tt.crop.stage<3)return;const type=tt.crop.type;scene.remove(tt.crop.mesh);tt.crop=null;setWet(tt,false);
    const n=1+(TL('farm',3)?1:0)+(Math.random()<0.25?1:0);addItem(type,n);SFX.harvest();burst(tt.x,H(tt.x,tt.z)+0.6,tt.z,[CROPS[type].col,0x8fd97a,0xffffff],14,4);
    const sp=worldToScreen(tt.x,H(tt.x,tt.z)+1,tt.z);floatTxt(`+${n} ${CROPS[type].i}`,sp.x,sp.y);spawnDrops('xp',tt.x,H(tt.x,tt.z)+0.8,tt.z,2,3);if(Q.farm.state==='active')for(let i=0;i<n;i++)progress('farm');save();}
}

// ---------- 坐下／泡澡／睡覺／進出屋 ----------
function furnBase(p){return p.y!==undefined?p.y:H(p.x,p.z);}
function sitOn(p,kind){if(fpMode)setFP(false);const it=ITEMS[p.id];ply.sitting={p,kind};setTimeout(refreshHeld,0);ply.act=null;ply.atkT=-1;SFX.sit();if(kind==='bath'){SFX.splash();toast('泡澡中～精神慢慢恢復 ♨️');}
  P.setFace(kind==='bath'?'happy':'open');}
function standUp(){const s=ply.sitting;if(!s)return;const p=s.p;ply.sitting=null;setTimeout(refreshHeld,0);const off=ITEMS[p.id].r*fsOf(p.id)+0.9;ply.x=p.x+Math.sin(p.ry)*off;ply.z=p.z+Math.cos(p.ry)*off;ply.y=furnBase(p);ply.face=p.ry;P.setFace('open');SFX.jump();}
function quickFade(mid){const f=$('fade');f.style.transition='opacity .28s';f.textContent='';f.style.opacity=1;paused=true;
  setTimeout(()=>{mid();setTimeout(()=>{f.style.opacity=0;paused=false;setTimeout(()=>f.style.transition='',300);},120);},300);}
function enterCave(){SFX.door();if(carry)carryCancel();quickFade(()=>{ply.cave=true;ply.x=CAVE_EXIT.x;ply.z=CAVE_EXIT.z-2;ply.y=0;ply.vy=0;ply.face=Math.PI;camYaw=0;snapCam=true;toast('⛰️ 史萊姆洞窟…小心兇猛的史萊姆！');});}
function leaveCave(){SFX.door();quickFade(()=>{ply.cave=false;ply.x=CAVE_FRONT.x+Math.sin(CAVE_FRONT.ry)*1.5;ply.z=CAVE_FRONT.z+Math.cos(CAVE_FRONT.ry)*1.5;ply.y=H(ply.x,ply.z);ply.vy=0;ply.face=CAVE_FRONT.ry;camYaw=CAVE_FRONT.ry+Math.PI;snapCam=true;});}
let zzT=0;
function lieDown(p){if(fpMode)setFP(false);ply.sleeping={p};setTimeout(refreshHeld,0);ply.act=null;ply.atkT=-1;holdAtk=holdAct=false;document.body.classList.add('sleeping');SFX.lie();P.setFace('sleep');
  if(joy.id!==null){joy.id=null;joy.x=joy.y=0;$('joyBase').style.display='none';}toast('躺下了…時間 ×5 流動 💤');}
function wakeUp(){if(!ply.sleeping)return;const p=ply.sleeping.p;ply.sleeping=null;setTimeout(refreshHeld,0);document.body.classList.remove('sleeping');
  ply.x=p.x+Math.sin(p.ry+Math.PI/2)*2.2;ply.z=p.z+Math.cos(p.ry+Math.PI/2)*2.2;if(inHouse(p.x,p.z)){ply.x=clamp(ply.x,HOME.x-HOME.w+0.7,HOME.x+HOME.w-0.7);ply.z=clamp(ply.z,HOME.z-HOME.d+0.7,HOME.z+HOME.d-0.7);}
  ply.y=furnBase(p);P.m.rotation.set(0,0,0);P.m.position.set(0,0,0);P.setFace('open');SFX.wake();P.sqv+=5;
  toast(ply.en>=95?'睡飽飽！精神滿滿 ☀️':`起床了！精神 ${Math.round(ply.en)}%`);save();}
function fade(text,mid,after){const f=$('fade');paused=true;f.textContent=text;f.style.opacity=1;f.style.pointerEvents='auto';
  setTimeout(()=>{mid();setTimeout(()=>{f.style.opacity=0;f.style.pointerEvents='none';paused=false;after&&after();},1400);},900);}
function faint(reason){const lost=Math.floor(ply.coins*0.3);SFX.hurt();if(ply.fishing)endFishing();if(ply.sleeping)wakeUp();ply.sitting=null;if(carry)carryCancel();
  fade(reason,()=>{if(hour()>=8)day++;tmin=8*60;ply.coins-=lost;ply.hp=Math.ceil(ply.max*0.6);ply.en=60;
    ply.riding=null;ply.indoor=false;ply.cave=false;ply.x=HOME.x;ply.z=HOME.z+1;ply.y=0.02;ply.vy=0;ply.kx=ply.kz=0;ply.face=0;camYaw=Math.PI/2;snapCam=true;
    for(const m of monsters)scene.remove(m.g);monsters.length=0;warnLv=0;updateHUD();save();},()=>toast(lost?`在家裡醒來…掉了 🪙${lost}`:'在家裡醒來…'));}

// ---------- 戰鬥 ----------
function attack(){if(paused||ply.act||ply.sleeping||ply.sitting||ply.riding||carry||ply.held==='plank')return;if(ply.cool>0)return;
  const w=ply.weapon;if(ply.atkT>=0){if((w==='sword'||w==='stick')&&ply.atkT>ply.atkDur*0.35)ply.queued=true;return;}startAttack();}
function lockOn(range=9){const t=nearestMonster(range);if(t)faceTo(t.x,t.z);return t;}
function startAttack(){useEn(0.7);
  const w=ply.weapon;ply.atkT=0;ply.hitDone=false;ply.queued=false;toolShow=null;if(ply.held){ply.held=null;renderHotbar();}refreshHeld();
  if(w==='bow'){ply.atkDur=0.4;lockOn(16);SFX.bow();return;}
  if(w==='staff'){ply.atkDur=0.5;lockOn(14);ring(ply.x,ply.y+0.1,ply.z,0xff9ed6,0.4,1.4,0.5);SFX.magic();return;}
  if(w==='spear'){ply.atkDur=0.38;const t=lockOn(10);if(t){const d=Math.hypot(t.x-ply.x,t.z-ply.z);const L=Math.min(Math.max(0,d-2.8),TL('spear',3)?11:5.5);if(L>0.3){ply.dashT=0.14;ply.dvx=(t.x-ply.x)/d*L/0.14;ply.dvz=(t.z-ply.z)/d*L/0.14;if(TL('spear',3))ply.ifr=0.4;}}SFX.thrust();return;}
  ply.combo=(ply.comboT>0&&ply.combo<3)?ply.combo+1:1;ply.atkDur=ply.combo===3?0.34:0.28;
  const t=lockOn(9);if(t){const d=Math.hypot(t.x-ply.x,t.z-ply.z);if(d>2.0){const L=Math.min(d-1.6,6.5);ply.dashT=0.13;ply.dvx=(t.x-ply.x)/d*L/0.13;ply.dvz=(t.z-ply.z)/d*L/0.13;puff(ply.x,ply.y,ply.z);}}
  SFX.swing(ply.combo);slash('c'+ply.combo,ply.combo===3&&ply.weapon==='sword'&&TL('sword',2)?1.4:1);
}
function damageMonster(m,dmg,nx,nz,crit){if(m.dead>=0||m.ifr>0)return;m.hp-=dmg;m.ifr=0.1;m.flash=1;m.shake=0.3;m.kx=nx*(crit?13:8);m.kz=nz*(crit?13:8);m.vy=crit?7:3.5;m.sqv-=4;
  m.bar.visible=true;const r=Math.max(0,m.hp/m.max);m.fg.scale.x=r||0.001;m.fg.position.x=-(1-r)/2;
  dmgNum(m.x,H(m.x,m.z)+m.y+1.5*m.size,m.z,crit?dmg+'!':String(dmg),crit);burst(m.x,H(m.x,m.z)+m.y+0.6,m.z,[0xffffff,0xffd36e,0xff9ec7],crit?12:7,5);SFX.squish();
  if(m.hp<=0)killMonster(m);}
function doHit(){
  const w=ply.weapon,fx=Math.sin(ply.face),fz=Math.cos(ply.face);let hits=0;const atk=weaponAtk();
  if(w==='spear'){const L=4.4;const cand=[];for(const m of monsters){if(m.dead>=0)continue;const dx=m.x-ply.x,dz=m.z-ply.z;const along=dx*fx+dz*fz,side=Math.abs(-dx*fz+dz*fx);
      if(along>-0.3&&along<L&&side<1.0+m.size*0.3)cand.push([along,m]);}
    cand.sort((a,b)=>a[0]-b[0]);const list=TL('spear',2)?cand:cand.slice(0,1);
    for(const[,m]of list){damageMonster(m,atk+1,fx,fz,TL('spear',2));hits++;}slash('line');if(hits){SFX.hit(false);hitStop=0.06;}return;}
  const c3=ply.combo===3,reach=c3?(w==='sword'&&TL('sword',2)?4.6:3.5):2.9;
  for(const m of monsters){if(m.dead>=0)continue;const dx=m.x-ply.x,dz=m.z-ply.z,d=Math.hypot(dx,dz)||0.01;
    if(d<reach+m.size*0.3&&(dx*fx+dz*fz)/d>(c3?0.35:-0.1)){hits++;damageMonster(m,atk*(c3?2:1),dx/d,dz/d,c3);}}
  if(hits){SFX.hit(c3);hitStop=c3?0.1:0.06;}
  if(c3){const fx3=ply.x+fx*1.8,fz3=ply.z+fz*1.8;ring(fx3,H(fx3,fz3)+0.1,fz3,0xfff0e0,0.3,1.8,0.3);burst(fx3,H(fx3,fz3)+0.2,fz3,[0xffffff,0xfff0d0],10,4);SFX.land();P.sqv-=5;if(w==='sword'&&TL('sword',3))fireWave(atk*2);}
}
function rangedFire(){const w=ply.weapon,atk=weaponAtk();
  if(w==='bow'){const spread=TL('bow',2)?[-0.18,0,0.18]:[0];spread.forEach(s=>fireArrow(ply.face+s,atk));ply.cool=0.12;}
  else{fireOrb(ply.face,atk+1);ply.cool=0.35;}}
function killMonster(m){m.dead=0;m.bar.visible=false;burst(m.x,H(m.x,m.z)+m.y+0.6,m.z,[0xff9ec7,0xffc4dc,0xffffff,0xffd36e],20,6);ring(m.x,H(m.x,m.z)+0.15,m.z,0xff9ec7,0.3,2.2,0.4);
  SFX.mdie();const hy=H(m.x,m.z)+m.y+0.8;if(m.cave){spawnDrops('coin',m.x,hy,m.z,m.coin,1);spawnDrops('xp',m.x,hy,m.z,m.xpv,3);if(Math.random()<0.3)spawnDrops('gem',m.x,hy,m.z,1);}else{spawnDrops('coin',m.x,hy,m.z,m.night?4:3,1);spawnDrops('xp',m.x,hy,m.z,m.night?5:4,3);}progress('hunt');}

// ---------- 世界初始物件 ----------
for(let i=0;i<45;i++)spawnWeed();
for(let i=0;i<16;i++)spawnButterfly();

// ---------- 姿勢（柔軟動作） ----------
function playerPose(T,moving,run){
  const p=newPose();const w=ply.walk;
  if(ply.sitting){const bath=ply.sitting.kind==='bath';p.legs=bath?[-1.0,-1.2]:[-1.45,-1.45];p.sq=Math.sin(T*2.2)*0.04;p.arms=bath?[[0.3,0,-1.5],[0.3,0,1.5]]:[[-0.6,0,-0.3],[-0.6,0,0.3]];if(bath){p.lean=-1.15;p.k=8;}return p;}
  if(ply.fishing){const f=ply.fishing;p.arms[0]=f.phase==='bite'?[-2.4,0,-0.2]:f.phase==='cast'&&f.t<0.25?[-2.8,0,-0.2]:[-1.25,0,-0.15];p.hold=1.35;p.sq=Math.sin(T*2.4)*0.04;if(f.phase==='bite'){p.sq=Math.sin(T*30)*0.06;}return p;}
  if(moving){const amp=run?1:0.6;p.legs=[Math.sin(w)*0.9*amp,-Math.sin(w)*0.9*amp];p.arms[0][0]=-Math.sin(w)*1.1*amp;p.arms[1][0]=Math.sin(w)*1.1*amp;
    p.lean=run?0.3:0.1;p.y=Math.abs(Math.sin(w))*(run?0.16:0.1);p.sq=Math.abs(Math.cos(w))*0.07-0.035;p.k=18;}
  else{p.sq=Math.sin(T*2.4)*0.045;p.arms[0][2]=-0.35-Math.sin(T*2.4)*0.07;p.arms[1][2]=0.35+Math.sin(T*2.4)*0.07;}
  if(!ply.ground){p.sq=0.12;p.legs=[-0.6,0.35];p.arms[0][2]=-1.25;p.arms[1][2]=1.25;}
  if(ply.held||ply.weapon!=='stick')p.arms[0][0]-=0.25;
  if(carry){p.arms=[[-1.2,0,-0.2],[-1.2,0,0.2]];}
  if(ply.act){const s=clamp(ply.actT/ACT_DUR[ply.act],0,1);
    switch(ply.act){
      case'chop':case'mine':case'till':{const up=s<0.45,k=up?s/0.45:Math.min(1,(s-0.45)/0.3);
        p.arms[0]=up?[lerp(0,-2.9,easeOut(k)),0,-0.2]:[lerp(-2.9,-0.55,easeOut(k)),0,-0.12];p.arms[1]=[p.arms[0][0],0,0.22];p.hold=2.3;p.lean=up?-0.18:0.32;p.sq=up?0.12:-0.14;p.k=up?12:45;p.legs=[-0.25,0.25];break;}
      case'pull':{const down=s<0.5;p.sq=down?-0.28:0.2;p.arms=[[-0.9,0,-0.3],[-0.9,0,0.3]];p.lean=down?0.45:-0.15;p.k=22;break;}
      case'water':p.arms[0]=[-1.25,0,-0.2];p.hold=1.2+Math.sin(s*Math.PI)*1.0;p.lean=0.1;p.k=10;break;
      case'plant':p.sq=-0.22;p.lean=0.5;p.arms=[[-1.0,0,-0.2],[-1.0,0,0.2]];break;
      case'catch':{const up=s<0.35;p.arms[0]=up?[-2.9,0,-0.1]:[-0.6,0,-0.1];p.arms[1]=up?[-2.6,0,0.2]:[-0.5,0,0.3];p.hold=2.3;p.lean=up?-0.2:0.38;p.k=up?16:38;p.sq=up?0.12:-0.12;break;}
      case'harvest':{const up=s>0.5;p.sq=up?0.18:-0.26;p.lean=up?-0.12:0.45;p.arms=[[up?-2.7:-1.0,0,-0.35],[up?-2.7:-1.0,0,0.35]];p.k=20;break;}
    }}
  if(ply.atkT>=0){const s=clamp(ply.atkT/ply.atkDur,0,1),wp=ply.weapon;
    if(wp==='spear'){const back=s<0.3;p.arms[0]=[-1.55,0,back?-0.6:-0.04];p.hold=Math.PI;p.lean=back?-0.12:0.38;p.k=back?14:55;p.sq=back?-0.12:0.1;p.legs=back?[0.35,-0.2]:[-0.7,0.55];p.arms[1]=[-0.8,0,0.6];}
    else if(wp==='bow'){p.arms[0]=[-1.5,0,-0.1];p.hold=Math.PI/2;p.arms[1]=[-1.45,0,0.9-Math.min(s,0.5)*1.4];p.lean=0.05;p.k=22;p.sq=s<0.5?-0.06:0.05;}
    else if(wp==='staff'){const up=s<0.55;p.arms[0]=up?[-2.75,0,-0.3]:[-1.3,0,-0.1];p.hold=1.2;p.arms[1]=up?[-2.3,0,0.45]:[-0.6,0,0.6];p.sq=up?0.15:-0.1;p.k=up?12:38;}
    else{const c=ply.combo;
      if(c===3){const up=s<0.3;p.arms[0]=up?[-3.0,0,-0.15]:[-0.35,0,-0.1];p.arms[1]=up?[-2.8,0,0.25]:[-0.4,0,0.3];p.hold=up?2.0:2.6;p.lean=up?-0.2:0.45;p.sq=up?0.14:-0.18;p.k=up?20:60;p.legs=up?[0.2,-0.2]:[-0.6,0.5];}
      else{const sw=c===1?lerp(1.4,-1.3,easeOut(s)):lerp(-1.3,1.4,easeOut(s));p.arms[0]=[-1.5,0,sw];p.hold=Math.PI*0.95;p.twist=-sw*0.3;p.arms[1]=[-0.4,0,0.7];p.lean=0.15;p.k=45;p.legs=[-0.35,0.3];}}}
  return p;
}
function walkPose(p,w,moving,T,ph=0){if(moving){p.legs=[Math.sin(w)*0.6,-Math.sin(w)*0.6];p.arms[0][0]=-Math.sin(w)*0.6;p.arms[1][0]=Math.sin(w)*0.6;p.y=Math.abs(Math.sin(w))*0.08;p.lean=0.08;p.sq=Math.abs(Math.cos(w))*0.05-0.025;}
  else{p.sq=Math.sin(T*2.2+ph)*0.04;p.arms[0][2]=-0.35-Math.sin(T*2.2+ph)*0.06;p.arms[1][2]=0.35+Math.sin(T*2.2+ph)*0.06;}return p;}

// ---------- 主迴圈 ----------
const clock=new THREE.Clock();let miniT=0,hudT=0,saveT=0,snapCam=true,warnLv=0,bfT=0;
const camPos=new THREE.Vector3(),camTgt=new THREE.Vector3();
function loop(){
  requestAnimationFrame(loop);
  const rawDt=Math.min(clock.getDelta(),0.05);let dt=rawDt;const T=clock.elapsedTime;
  if(hitStop>0){hitStop-=dt;dt*=0.08;}
  if(!paused&&started)step(dt,T);else{npcUpdate(rawDt,T);danceUpdate(rawDt,T);}
  boardMark.visible=Object.values(Q).some(q=>q.state!=='active');boardMark.position.y=3.6+Math.sin(T*3)*0.15;boardMark.rotation.y=T*2;
  for(const w of weeds){w.g.rotation.z=Math.sin(T*2+w.g.ph)*0.08;if(w.g.grow<1){w.g.grow=Math.min(1,w.g.grow+rawDt*2);w.g.scale.setScalar(easeOutBack(w.g.grow)||0.01);}}
  if(typeof HAMWHEEL!=='undefined')HAMWHEEL.rotation.z+=rawDt*0.9;
  for(const c of clouds){c.position.x+=rawDt*1.5;if(c.position.x>180)c.position.x=-180;}
  if(creatorOpen||!started){
    P.g.position.set(ply.x,ply.y,ply.z);P.g.rotation.y=creatorOpen?previewYaw+Math.sin(T*0.6)*0.25:Math.PI*0.15;
    const p=walkPose(newPose(),0,false,T);applyPose(P,p,rawDt);if(P.tail)P.tail.rotation.y=Math.sin(T*3)*0.3;
    let D=7,cy=1.9,ly=0.9;
    if(!creatorOpen){const a=T*0.06;const wide=innerWidth>innerHeight;P.g.rotation.y=Math.PI*0.12;
      camera.setViewOffset(innerWidth,innerHeight,wide?-innerWidth*0.3:0,wide?0:-innerHeight*0.22,innerWidth,innerHeight);
      camPos.set(ply.x+Math.sin(a)*8.5,ply.y+2.6,ply.z+Math.cos(a)*8.5);camera.position.lerp(camPos,1-Math.pow(0.001,rawDt));camera.lookAt(ply.x,ply.y+0.9,ply.z);P.g.rotation.y=Math.atan2(camera.position.x-ply.x,camera.position.z-ply.z);updateSky();}
    else if(creatorOpen){const sh=document.querySelector('#creator .sheet').getBoundingClientRect();const pw=Math.max(0,sh.right);const avail=Math.max(120,innerWidth-pw);
      camera.setViewOffset(innerWidth,innerHeight,-pw/2,0,innerWidth,innerHeight);D=Math.max(4.8,2.25*innerHeight/avail);cy=1.45;ly=0.85;
      camPos.set(ply.x,ply.y+cy,ply.z+D);camera.position.lerp(camPos,1-Math.pow(0.001,rawDt));
      camera.lookAt(ply.x,ply.y+ly,ply.z);updateSky();}
  }else{
    if(camera.view&&camera.view.enabled)camera.clearViewOffset();
    const sl=ply.sleeping,si=ply.sitting,ins=inHouse(ply.x,ply.z),rideF=ply.riding&&ply.riding.kind==='ferris';
    P.g.visible=!fpMode;
    if(fpMode){camera.position.set(ply.x,ply.y+1.15,ply.z);const cp=Math.cos(fpPitch);camTgt.set(ply.x-Math.sin(camYaw)*cp,ply.y+1.15-Math.sin(fpPitch),ply.z-Math.cos(camYaw)*cp);camera.lookAt(camTgt);snapCam=true;}
    else{
    const dist=rideF?22:ins?Math.min(camDist,10):sl?6:camDist,pit=rideF?0.3:ins?clamp(camPitch+0.15,0.45,1.2):sl?0.75:camPitch;
    camTgt.set(ply.x,ply.y+(sl?0.6:1.3),ply.z);const cp=Math.cos(pit);
    camPos.set(camTgt.x+Math.sin(camYaw)*cp*dist,camTgt.y+Math.sin(pit)*dist,camTgt.z+Math.cos(camYaw)*cp*dist);
    if(!ply.cave)camPos.y=Math.max(camPos.y,H(camPos.x,camPos.z)+0.8);
    if(snapCam){camera.position.copy(camPos);snapCam=false;}else camera.position.lerp(camPos,1-Math.pow(0.0001,rawDt));camera.lookAt(camTgt);}
  }
  skyDome.position.copy(camera.position);if(started)homeFrame(camera.position,rawDt);
  for(const m of monsters)if(m.bar.visible)m.bar.quaternion.copy(camera.quaternion);
  if(typeof netFrame==='function')netFrame(rawDt,T);
  renderer.setRenderTarget(rt);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCam);
  uiFrame(rawDt);
}
// 繞開障礙物移動（不穿模）
function toLocal(o,x,z){const c=Math.cos(o.box.ry),s=Math.sin(o.box.ry),dx=x-o.x,dz=z-o.z;return[dx*c-dz*s,dx*s+dz*c];}
function toWorld(o,lx,lz){const c=Math.cos(o.box.ry),s=Math.sin(o.box.ry);return[o.x+lx*c+lz*s,o.z-lx*s+lz*c];}
function segHitsBox(ax,az,bx,bz,o,pad){const[a1,a2]=toLocal(o,ax,az),[b1,b2]=toLocal(o,bx,bz);const hw=o.box.hw+pad,hd=o.box.hd+pad;let t0=0,t1=1;const d1=b1-a1,d2=b2-a2;
  for(const[p,d,h]of[[a1,d1,hw],[a2,d2,hd]]){if(Math.abs(d)<1e-6){if(p<-h||p>h)return false;continue;}let u=(-h-p)/d,v=(h-p)/d;if(u>v)[u,v]=[v,u];t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1)return false;}return true;}
function steer(n,tx,tz,spd,dt,arrive=0.3){
  if(n.detour){n.detT-=dt;if(n.detT<=0||Math.hypot(n.detour.x-n.x,n.detour.z-n.z)<0.5)n.detour=null;}
  const fx=tx,fz=tz;if(Math.hypot(fx-n.x,fz-n.z)<=arrive){n.stuckN=0;return false;}
  if(n.detour){tx=n.detour.x;tz=n.detour.z;}
  // 房子（方形）：繞到轉角
  for(const o of obstacles){if(!o.box)continue;if(Math.abs(o.x-n.x)>o.r+9||Math.abs(o.z-n.z)>o.r+9)continue;
    if(!segHitsBox(n.x,n.z,tx,tz,o,0.55))continue;let best=null,bc=1e9;
    for(const[sx,sz]of[[1,1],[1,-1],[-1,1],[-1,-1]]){const[cx,cz]=toWorld(o,sx*(o.box.hw+1.1),sz*(o.box.hd+1.1));if(Math.hypot(cx-n.x,cz-n.z)<0.9)continue;const vis=!segHitsBox(n.x,n.z,cx,cz,o,0.5);const cost=Math.hypot(cx-n.x,cz-n.z)+Math.hypot(tx-cx,tz-cz)+(vis?0:50)+(segHitsBox(cx,cz,tx,tz,o,0.5)?12:0);if(cost<bc){bc=cost;best=[cx,cz];}}
    if(best){tx=best[0];tz=best[1];}break;}
  const dx=tx-n.x,dz=tz-n.z,d=Math.hypot(dx,dz)||1e-3;let ux=dx/d,uz=dz/d,best=null,bA=1e9;
  for(const o of obstacles){if(o.r<=0.2||o.box)continue;const ox=o.x-n.x,oz=o.z-n.z;if(Math.abs(ox)>o.r+6||Math.abs(oz)>o.r+6)continue;const R=o.r+0.6;
    if(Math.hypot(fx-o.x,fz-o.z)<R)continue;const along=ox*ux+oz*uz;if(along<-0.5||along>Math.min(d,5)+o.r)continue;const perp=ox*uz-oz*ux;if(Math.abs(perp)<R&&along<bA){bA=along;best={o,perp,ox,oz,R};}}
  let vx=ux,vz=uz;
  if(best){const dd=Math.hypot(best.ox,best.oz)||1;let side;if(n.avO===best.o)side=n.avS;else{side=best.perp>=0?1:-1;n.avO=best.o;n.avS=side;}
    const t1=-best.oz/dd*side,t2=best.ox/dd*side;const w=dd<best.R+1.2?0.1:0.45;vx=ux*w+t1*(1-w);vz=uz*w+t2*(1-w);if(dd<best.R+0.2){vx-=best.ox/dd*0.5;vz-=best.oz/dd*0.5;}const l=Math.hypot(vx,vz)||1;vx/=l;vz/=l;}
  else n.avO=null;
  const v=Math.min(spd,Math.hypot(fx-n.x,fz-n.z)*4);n.x+=vx*v*dt;n.z+=vz*v*dt;n.face+=angDiff(n.face,Math.atan2(vx,vz))*Math.min(1,dt*7);n.walk=(n.walk||0)+dt*8*(spd/1.4);
  // 卡住偵測：先換邊，再隨機繞道
  n.stT=(n.stT||0)+dt;if(n.stT>1.5){const md=Math.hypot(n.x-(n.sx??n.x),n.z-(n.sz??n.z));
    if(md<0.6){n.stuckN=(n.stuckN||0)+1;if(n.stuckN===1)n.avS=-(n.avS||1);else{const base=Math.atan2(fx-n.x,fz-n.z)+(Math.random()<0.5?1:-1)*(Math.PI/2+Math.random()*0.8);const L=4+Math.min(n.stuckN,6)*1.2;let px=n.x+Math.sin(base)*L,pz=n.z+Math.cos(base)*L;if(!farFrom(px,pz,0.6)){px=n.x-Math.sin(base)*L;pz=n.z-Math.cos(base)*L;}n.detour={x:px,z:pz};n.detT=4;n.avO=null;}}else n.stuckN=0;
    n.sx=n.x;n.sz=n.z;n.stT=0;}
  return true;}
function bodyCollide(n,r=0.5){collideObs(n,r);pushWalls(n,r);}
function npcNight(n,h){return h>=n.sleepH||h<n.wakeH;}
function npcUpdate(dt,T){
  const h=hour();
  for(const n of npcs){const g=n.c.g;let moving=false;const night=npcNight(n,h);if(!n.init){n.init=1;if(night&&n.door)n.away=true;}
    if(n.stall&&!night&&n.onPost){n.away=false;const d=angDiff(n.face,n.talking?Math.atan2(ply.x-n.x,ply.z-n.z):STALLS[n.stall].ry);n.face+=d*Math.min(1,dt*6);}
    else if(n.talking){n.face+=angDiff(n.face,Math.atan2(ply.x-n.x,ply.z-n.z))*Math.min(1,dt*8);}
    else if(night&&n.door){n.working=false;n.onPost=false;if(!n.away){moving=steer(n,n.door.x,n.door.z,1.7,dt,0.5);n.homeT=(n.homeT||0)+dt;if(!moving||(n.homeT>20&&Math.hypot(ply.x-n.x,ply.z-n.z)>30&&Math.hypot(ply.x-n.door.x,ply.z-n.door.z)>30)){n.away=true;n.homeT=0;}}}
    else if(n.stall){if(n.away){n.away=false;n.x=n.door.x;n.z=n.door.z;}moving=steer(n,n.hx,n.hz,1.7,dt,0.3);if(!moving){n.onPost=true;n.x=n.hx;n.z=n.hz;}}
    else{if(n.away){n.away=false;n.x=n.door.x;n.z=n.door.z;}
      if(n.job&&n.job!=='walk'){moving=jobUpdate(n,dt,T);if(n.job==='park')parkPush(n);}else{
      const dx=n.tx-n.x,dz=n.tz-n.z,d=Math.hypot(dx,dz);
      if(d>0.3){moving=steer(n,n.tx,n.tz,1.3,dt);}
      else{n.wait-=dt;if(n.wait<=0){n.wait=R(2,5);const a=R(0,6.28),r=R(0.5,4);n.tx=n.hx+Math.cos(a)*r;n.tz=n.hz+Math.sin(a)*r;if(!farFrom(n.tx,n.tz,0.6)){n.tx=n.hx;n.tz=n.hz;}}}}
      if(Math.hypot(ply.x-n.x,ply.z-n.z)<3.5&&!moving&&!n.working)n.face+=angDiff(n.face,Math.atan2(ply.x-n.x,ply.z-n.z))*Math.min(1,dt*4);}
    if(moving&&!(n.stall&&Math.hypot(n.x-n.hx,n.z-n.hz)<2.2))bodyCollide(n);
    g.visible=!n.away;if(n.away)continue;
    g.position.set(n.x,H(n.x,n.z)+(n.stall&&n.onPost?0.84:0),n.z);g.rotation.y=n.face;
    if(n.job){for(const t in n.c.T)n.c.T[t].visible=false;const tl={farm:'can',chop:'axe1',fish:'rod',net:'net'}[n.job];if(tl&&n.c.T[tl]&&!n.talking)n.c.T[tl].visible=n.working||n.job==='net';}
    const p=walkPose(n.pose,n.walk,moving,T,n.hx);if(n.working&&!n.talking&&!moving)workPose(n,p,T);if(n.talking){p.sq=Math.abs(Math.sin(T*7))*0.06;p.arms[1]=[-0.5-Math.abs(Math.sin(T*4))*0.8,0,0.5];}
    applyPose(n.c,p,dt);if(n.c.tail)n.c.tail.rotation.y=Math.sin(T*(moving?8:2.5)+n.hz)*0.35;
    n.c.setFace(n.talking||(n.working&&n.job==='park')?'happy':'open');n.tag.visible=Math.hypot(ply.x-n.x,ply.z-n.z)<14;
  }
}
function workPose(n,p,T){const ph=(T*(n.job==='chop'?2.2:1.2)+n.hx)%1;
  if(n.job==='chop'){const up=ph<0.45;p.arms[0]=up?[-2.9,0,-0.2]:[-0.55,0,-0.12];p.arms[1]=[p.arms[0][0],0,0.22];p.hold=2.3;p.lean=up?-0.15:0.3;p.sq=up?0.1:-0.12;p.k=up?12:40;
    if(!up&&!n.hitDone){n.hitDone=true;if(n.tree){n.tree.shake=1;if(Math.hypot(ply.x-n.x,ply.z-n.z)<14)SFX.chop();burst(n.tree.x,H(n.tree.x,n.tree.z)+1,n.tree.z,0xf3d3b8,3,3,cubeG);}}if(up)n.hitDone=false;}
  else if(n.job==='farm'){p.arms[0]=[-1.25,0,-0.2];p.hold=1.2+Math.sin(T*3)*0.7;p.lean=0.12;if(Math.random()<0.15){const fx=n.x+Math.sin(n.face)*1.2,fz=n.z+Math.cos(n.face)*1.2;burst(fx,H(fx,fz)+0.4,fz,0x9fdcff,1,1.5);}}
  else if(n.job==='fish'){p.arms[0]=[-1.25,0,-0.15];p.hold=1.35;p.sq=Math.sin(T*2)*0.04;}
  else if(n.job==='park'){const k=(n.hx*7|0)%3;if(k===0){p.y=Math.abs(Math.sin(T*5+n.hx))*0.18;p.arms[0]=[-2.6,0,-0.3];p.arms[1]=[-2.6,0,0.3];}else if(k===1){p.arms[1]=[-0.5-Math.abs(Math.sin(T*4))*0.9,0,0.5];}}
  else if(n.job==='net'){const up=ph<0.35;p.arms[0]=up?[-2.9,0,-0.1]:[-0.6,0,-0.1];p.hold=2.3;p.lean=up?-0.2:0.35;p.k=up?16:38;}}
function jobUpdate(n,dt,T){
  if(!n.jt){n.jt=0;n.phase='go';n.target=null;}
  n.jt-=dt;
  if(n.phase==='go'&&!n.target){
    if(n.job==='farm'){const sp=FIELDS[n.field].spots;const s=sp[(Math.random()*sp.length)|0];n.target={x:s.x,z:s.z,face:Math.atan2(FIELDS[n.field].cx-s.x,FIELDS[n.field].cz-s.z)};}
    else if(n.job==='chop'){let best=null,bd=1e9;for(const t of trees){if(t.state!=='alive')continue;const d=Math.hypot(t.x-n.hx,t.z-n.hz)+Math.random()*12;if(d<bd&&d<36){bd=d;best=t;}}
      if(best){const a=Math.atan2(n.x-best.x,n.z-best.z);n.tree=best;n.target={x:best.x+Math.sin(a)*(best.o.r+1.1),z:best.z+Math.cos(a)*(best.o.r+1.1),face:a+Math.PI};}}
    else if(n.job==='fish'){n.target={x:n.hx,z:n.hz,face:Math.atan2(POND.x-n.hx,POND.z-n.hz)};}
    else if(n.job==='park'){const p=PARKV.poi[(Math.random()*PARKV.poi.length)|0];n.target={x:p.x+R(-1,1),z:p.z+R(-1,1),face:R(0,6.28)};}
    else if(n.job==='net'){const b=butterflies.filter(b=>Math.hypot(b.x-n.hx,b.z-n.hz)<30)[0];if(b){n.target={x:b.x,z:b.z,face:0,bug:b};}else{const a=R(0,6.28);n.target={x:n.hx+Math.cos(a)*8,z:n.hz+Math.sin(a)*8,face:a};}}
    if(!n.target)n.target={x:n.hx,z:n.hz,face:0};}
  if(n.phase==='go'){const t=n.target;if(t.bug){t.x=t.bug.x;t.z=t.bug.z;}const dx=t.x-n.x,dz=t.z-n.z,d=Math.hypot(dx,dz);n.working=false;
    if(d>(t.bug?1.4:0.3)){const sp=n.job==='net'?2.4:1.5;n.goT=(n.goT||0)+dt;if(n.goT>25){n.goT=0;n.target=null;return false;}return steer(n,t.x,t.z,sp,dt,t.bug?1.4:0.3);}n.goT=0;
    n.phase='work';n.jt=n.job==='fish'?R(20,40):n.job==='net'?1.2:n.job==='park'?R(3,9):R(4,8);if(n.job==='park'){const F=PARKV.ferris;n.face=Math.random()<0.5?Math.atan2(F.x-n.x,F.z-n.z):R(0,6.28);}n.face=t.bug?Math.atan2(dx,dz):t.face;return false;}
  n.working=true;if(n.job==='chop'&&n.tree&&n.tree.state!=='alive'){n.jt=0;}
  if(n.job==='net'&&n.target.bug&&n.jt<0.6&&!n.target.caught){n.target.caught=true;const b=n.target.bug;const i=butterflies.indexOf(b);if(i>=0&&Math.hypot(b.x-n.x,b.z-n.z)<2.5){butterflies.splice(i,1);scene.remove(b.g);burst(b.x,H(b.x,b.z)+1.2,b.z,PAST.map(c=>parseInt(c.slice(1),16)),8,2);n.c.setFace('happy');}}
  if(n.jt<=0){n.phase='go';n.target=null;n.working=false;n.tree=null;}
  return false;}
const STAGE_FRONT={x:STAGE.x,z:STAGE.z-3.6};
function danceUpdate(dt,T){const beat=T*104/60,b8=beat%8,ph=beat%1;const h=hour();
  for(const d of dancers){const night=h>=20.5+d.i*0.5||h<5.5+d.i*0.25;if(!d.init){d.init=1;if(night){d.mode='home';d.c.g.visible=false;}}
    if(!d.door){let bd=1e9;for(const hs of V2HOUSES){const dd=Math.hypot(hs.door.x-d.x,hs.door.z-d.z)+d.i*3;if(dd<bd){bd=dd;d.door=hs.door;}}}
    if(night||d.mode){const g=d.c.g;
      if(night&&!d.mode){d.mode='down';d.wx=d.x;d.wz=d.z;d.t=0;}
      if(d.mode==='down'){d.t+=dt;const s=Math.min(1,d.t/0.6);const fx=lerp(d.x,STAGE_FRONT.x+(d.i-1.5)*1.2,s),fz=lerp(d.z,STAGE_FRONT.z,s);g.position.set(fx,lerp(H(STAGE.x,STAGE.z)+0.68,H(fx,fz),s)+Math.sin(s*Math.PI)*1.2,fz);
        if(s>=1){d.mode='walk';d.wx=fx;d.wz=fz;}}
      else if(d.mode==='walk'){const nv=d.nav||(d.nav={x:d.wx,z:d.wz,face:0,walk:0});if(steer(nv,d.door.x,d.door.z,1.8,dt,0.5)){bodyCollide(nv);d.wx=nv.x;d.wz=nv.z;g.rotation.y=nv.face;g.position.set(nv.x,H(nv.x,nv.z),nv.z);applyPose(d.c,walkPose(d.pose,nv.walk,true,T),dt);}else{d.mode='home';d.nav=null;g.visible=false;}}
      else if(d.mode==='home'&&!night){d.mode=null;g.visible=true;g.rotation.y=Math.PI;d.c.m.scale.setScalar(0.01);d.c.sqv+=8;}
      if(d.mode)continue;}
    d.c.g.position.y=H(STAGE.x,STAGE.z)+0.68;d.c.g.position.z=d.z;d.c.g.rotation.y=Math.PI;const p=d.pose;p.k=22;const hop=Math.abs(Math.sin(beat*Math.PI));p.y=hop*0.35;p.sq=(ph<0.15?-0.2:0.1);
    const alt=Math.floor(beat)%2;p.arms[0]=[alt?-2.8:-0.4,0,-0.4];p.arms[1]=[alt?-0.4:-2.8,0,0.4];p.legs=[alt?-0.5:0.2,alt?0.2:-0.5];
    if(b8>=6){p.twistHard=((b8-6)/2)*Math.PI*2*(d.i%2?1:-1);}else{p.twistHard=undefined;p.twist=Math.sin(beat*Math.PI*0.5+d.i)*0.4;}
    d.c.g.position.x=d.x+Math.sin(beat*Math.PI*0.25)*0.35;applyPose(d.c,p,dt);if(d.c.tail)d.c.tail.rotation.y=Math.sin(T*10+d.i)*0.5;}}
function step(dt,T){
  // ---- 時間、精神 ----
  const mult=ply.sleeping?5:1;
  const gmin=dt*MIN_PER_SEC*mult;tmin+=gmin;if(tmin>=1440){tmin-=1440;day++;}
  const gh=gmin/60;
  if(ply.sleeping){ply.en=Math.min(100,ply.en+gh*22);ply.hp=Math.min(ply.max,ply.hp+gh*3);
    zzT-=dt;if(zzT<=0){zzT=0.9;const d=document.createElement('div');d.className='zz';d.textContent='Z';d.style.fontSize=R(18,30)+'px';d.style.left=(innerWidth/2+R(-20,30))+'px';d.style.top=(innerHeight*0.42)+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),2200);}}
  else if(ply.sitting&&ply.sitting.kind==='bath'){ply.en=Math.min(100,ply.en+gh*12);ply.hp=Math.min(ply.max,ply.hp+gh*4);if(Math.random()<dt*3)SFX.bubble();
    if(Math.random()<dt*6)puff(ply.x+R(-0.5,0.5),ply.y+0.6,ply.z+R(-0.4,0.4),0xffffff,0.6);}

  if(!ply.sleeping){
    if(ply.en<30&&warnLv<1){warnLv=1;toast('😪 好睏…找張床躺一下吧');}
    if(ply.en<12&&warnLv<2){warnLv=2;toast('💤 快撐不住了！精神用光會昏倒');}
    if(ply.en<=0){faint('撐不住了… 倒頭就睡 💫');return;}}
  if(ply.en>40)warnLv=0;
  if(isNight()&&!ply.nightWarned&&!ply.indoor){ply.nightWarned=true;toast('🌙 天黑了，史萊姆變兇了！');}if(!isNight())ply.nightWarned=false;
  const sleepy=ply.sleeping?0:clamp((30-ply.en)/30,0,1);
  $('vig').style.opacity=ply.sleeping?0.5:sleepy*(0.7+Math.sin(T*2)*0.25);
  updateSky();npcUpdate(dt,T);danceUpdate(dt,T);
  // ---- 農田生長 ----
  for(const t of farm.values()){
    if(t.pop!==undefined&&t.pop<1){t.pop=Math.min(1,t.pop+dt*3);t.m.scale.setScalar(easeOutBack(t.pop));}
    if(t.crop){const c=t.crop;if(c.pop<1){c.pop=Math.min(1,c.pop+dt*2.5);c.mesh.scale.setScalar(easeOutBack(c.pop)+0.001);}
      if(c.stage<3&&t.wet){c.g+=gh*(TL('farm',1)?1.5:1);if(c.g>=CROPS[c.type].hrs){c.g=0;setCropStage(t,c.stage+1);setWet(t,false);burst(t.x,H(t.x,t.z)+0.5,t.z,[0x8fd97a,0xfff07a,0xffffff],8,2.5);}}
      if(c.stage===3)c.mesh.rotation.z=Math.sin(T*2+t.gx)*0.05;}}
  // ---- 移動 ----
  let ix=0,iz=0;
  if(!ply.sleeping){if(keys.KeyW||keys.ArrowUp)iz-=1;if(keys.KeyS||keys.ArrowDown)iz+=1;if(keys.KeyA||keys.ArrowLeft)ix-=1;if(keys.KeyD||keys.ArrowRight)ix+=1;
    if(joy.id!==null){ix+=joy.x;iz+=joy.y;}}
  let mag=Math.hypot(ix,iz);if(mag>1){ix/=mag;iz/=mag;mag=1;}
  if(ply.sitting&&mag>0.3)standUp();
  if(ply.fishing&&mag>0.3)endFishing('收竿了');
  const run=(keys.ShiftLeft||keys.ShiftRight||(joy.id!==null&&mag>0.95))&&!fpMode;
  const busy=ply.act||ply.atkT>=0;
  const spd=(run?11:5.5)*(1-sleepy*0.4)*(busy?0.25:1)*(fpMode?0.7:1);
  const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw);
  const mx=fx*-iz+rx*ix,mz=fz*-iz+rz*ix;
  let moving=false;
  if(ply.sleeping){const p=ply.sleeping.p,b=furnBase(p);const fs=fsOf(p.id);P.g.position.set(p.x,b+0.62*fs,p.z);P.g.rotation.y=p.ry;P.m.rotation.set(-Math.PI/2,0,0);P.m.position.set(0,0.72,0.45*fs);
    P.m.scale.set(1,1+Math.sin(T*1.5)*0.035,1);ply.x=p.x;ply.z=p.z;ply.y=b;if(P.tail)P.tail.rotation.y=Math.sin(T*1.2)*0.2;}
  else if(ply.riding){updateRide(dt,T);}
  else if(ply.sitting){const p=ply.sitting.p,b=furnBase(p),bath=ply.sitting.kind==='bath';ply.x=p.x;ply.z=p.z;ply.y=b;ply.face=p.ry;
    if(bath){const ry=p.ry+Math.PI/2;P.g.position.set(p.x+Math.sin(ry)*0.55,b+0.32,p.z+Math.cos(ry)*0.55);P.g.rotation.y=ry;}else{P.g.position.set(p.x,b+(p.id==='sofa'?0.32:0.38)*fsOf(p.id),p.z);P.g.rotation.y=p.ry;}applyPose(P,playerPose(T,false,false),dt);}
  else{
  if(mag>0.05){ply.x+=mx*spd*dt;ply.z+=mz*spd*dt;moving=true;
    if(!busy&&!fpMode)ply.face+=angDiff(ply.face,Math.atan2(mx,mz))*Math.min(1,dt*12);ply.walk+=dt*spd*1.5;}
  if(fpMode)ply.face=camYaw+Math.PI;
  if(ply.dashT>0){ply.dashT-=dt;ply.x+=ply.dvx*dt;ply.z+=ply.dvz*dt;if(Math.random()<0.6)puff(ply.x,ply.y,ply.z);}
  ply.x+=ply.kx*dt;ply.z+=ply.kz*dt;ply.kx*=Math.pow(0.02,dt);ply.kz*=Math.pow(0.02,dt);
  const obs=ply.cave?caveObs:obstacles;
  for(const o of obs){if(o.r<=0)continue;if(o.y!==undefined&&Math.abs(o.y-ply.y)>0.9)continue;if(o.box){pushBox(ply,o,0.6);continue;}const dx=ply.x-o.x,dz=ply.z-o.z,d=Math.hypot(dx,dz),r=o.r+0.6;if(d<r&&d>0.001){ply.x=o.x+dx/d*r;ply.z=o.z+dz/d*r;}}
  if(!ply.cave){pushWalls(ply,0.45);pushBlocks(ply,ply.y);}
  if(!ply.cave)for(const n of npcs){if(n.away)continue;const dx=ply.x-n.x,dz=ply.z-n.z,d=Math.hypot(dx,dz);if(d<1.4&&d>0.001){ply.x=n.x+dx/d*1.4;ply.z=n.z+dz/d*1.4;}}
  if(ply.cave){const dx=ply.x-CAVE.x,dz=ply.z-CAVE.z,d=Math.hypot(dx,dz);if(d>CAVE.r-0.8){ply.x=CAVE.x+dx/d*(CAVE.r-0.8);ply.z=CAVE.z+dz/d*(CAVE.r-0.8);}}
  else{ply.x=clamp(ply.x,-112,112);ply.z=clamp(ply.z,-112,112);}
  const gH=ply.cave?0:standY(ply.x,ply.z,ply.y);ply.vy-=24*dt;ply.y+=ply.vy*dt;if(ply.vy>0&&!ply.cave&&headBlocked(ply.x,ply.z,ply.y))ply.vy=0;if(ply.y>gH+0.3)ply.ground=false;
  if(ply.y<=gH){if(!ply.ground){const imp=clamp(-ply.vy/10,0.2,1);P.sqv-=7*imp;if(ply.vy<-6){SFX.land();for(let i=0;i<4;i++)puff(ply.x,gH,ply.z);}}ply.y=gH;ply.vy=0;ply.ground=true;}
  P.g.position.set(ply.x,ply.y,ply.z);P.g.rotation.y=ply.face;
  const walkMove=moving&&ply.ground&&!busy;
  if(walkMove){const st=Math.floor(ply.walk/Math.PI);if(st!==ply.lastStep){ply.lastStep=st;SFX.step();if(run)puff(ply.x-Math.sin(ply.face)*0.4,ply.y,ply.z-Math.cos(ply.face)*0.4);}}
  if(run&&walkMove){ply.runDust-=dt;if(ply.runDust<=0){ply.runDust=0.07;puff(ply.x-Math.sin(ply.face)*0.5,ply.y,ply.z-Math.cos(ply.face)*0.5);}}
  applyPose(P,playerPose(T,walkMove,run&&walkMove),dt);
  if(P.tail)P.tail.rotation.y=Math.sin(T*(walkMove?(run?16:10):3))*0.35;
  if(P.T.staff&&P.T.staff.visible)P.T.staff.userData.gem.rotation.y=T*3;
  // 攻擊時間軸
  if(ply.atkT>=0){ply.atkT+=dt;const w=ply.weapon;
    if(w==='bow'||w==='staff'){if(!ply.hitDone&&ply.atkT>=(w==='bow'?0.2:0.28)){ply.hitDone=true;rangedFire();}}
    else{const hitAt=w==='spear'?0.13:(ply.combo===3?0.13:0.09);if(!ply.hitDone&&ply.atkT>=hitAt){ply.hitDone=true;doHit();}}
    if(ply.atkT>=ply.atkDur){ply.atkT=-1;if(w==='sword'||w==='stick'){ply.comboT=0.55;if(ply.combo===3)ply.combo=0;if(ply.queued||holdAtk){ply.queued=false;startAttack();}}}}
  else{if(ply.comboT>0){ply.comboT-=dt;if(ply.comboT<=0)ply.combo=0;}if(holdAtk&&!ply.act&&!paused&&ply.cool<=0)attack();}
  if(ply.cool>0)ply.cool-=dt;
  // 動作時間軸
  if(ply.act){ply.actT+=dt;const dur=ACT_DUR[ply.act],s=ply.actT/dur;
    if(!ply.hit&&s>=ACT_HIT[ply.act]){ply.hit=1;actImpact();}
    if(s>=1){const was=ply.act;ply.act=null;ply.hit=0;toolShow=null;refreshHeld();
      if(holdAct&&!paused){const c=context();if(['tree','rock','weed','till','water','plant','harvest'].includes(c))doAction();}}}
  }
  // ---- 鎖定 ----
  const lt=(ply.riding||ply.sitting||ply.sleeping)?null:nearestMonster(ply.weapon==='bow'?16:ply.weapon==='staff'?14:9);if(lt!==lockT){lockT=lt;if(lt)SFX.lock();}
  if(lockT){reticle.visible=true;reticle.position.set(lockT.x,H(lockT.x,lockT.z)+0.08,lockT.z);reticle.rotation.z=T*2;reticle.scale.setScalar(lockT.size*(1+Math.sin(T*8)*0.08));}else reticle.visible=false;
  updatePets(dt,T);updateFishing(dt,T);updateHoePreview(T);updatePark(dt,T);updateBuildGhost(T);
  caveLight.intensity=ply.cave?1.1:0;if(ply.cave)caveLight.position.set(ply.x,ply.y+4,ply.z);
  // 回復
  if(!ply.indoor&&(Math.hypot(ply.x,ply.z)<22||Math.hypot(ply.x-V2.x,ply.z-V2.z)<30)&&ply.hp<ply.max)ply.hp=Math.min(ply.max,ply.hp+dt*0.5);
  if(inHouse(ply.x,ply.z)&&ply.hp<ply.max)ply.hp=Math.min(ply.max,ply.hp+dt*0.8);
  if(!ply.indoor&&nearestFurn('campfire',3.5)&&ply.hp<ply.max){ply.hp=Math.min(ply.max,ply.hp+dt*1.2);if(Math.random()<dt*3)burst(ply.x,ply.y+1.2,ply.z,0xff9ec7,1,1);}
  ply.ifr-=dt;
  for(let i=weedTimers.length-1;i>=0;i--){weedTimers[i]-=dt;if(weedTimers[i]<=0){weedTimers.splice(i,1);spawnWeed();}}
  // ---- 蝴蝶 ----
  const day_=hour()>=6&&hour()<19;bfT-=dt;if(bfT<=0){bfT=4;if(butterflies.length<16)spawnButterfly();}
  for(const b of butterflies){b.g.visible=day_&&!ply.indoor;if(!b.g.visible)continue;const dx=b.tx-b.x,dz=b.tz-b.z,d=Math.hypot(dx,dz);
    if(d<0.5){const a=R(0,6.28),r=R(2,6);b.tx=b.x+Math.cos(a)*r;b.tz=b.z+Math.sin(a)*r;}else{b.x+=dx/d*b.spd*dt;b.z+=dz/d*b.spd*dt;}
    const fl=Math.sin(T*18+b.ph)*1.1;b.wl.rotation.z=fl;b.wr.rotation.z=-fl;b.y=1.1+Math.sin(T*2+b.ph)*0.35;
    b.g.position.set(b.x,H(b.x,b.z)+b.y,b.z);b.g.rotation.y=Math.atan2(dx,dz);}
  // ---- 樹、石頭 ----
  for(const t of trees){
    if(t.shake>0){t.shake=Math.max(0,t.shake-dt*4);t.pivot.rotation.z=Math.sin(t.shake*30)*0.09*t.shake;t.pivot.rotation.x=t.state==='alive'?Math.cos(t.shake*26)*0.04*t.shake:t.pivot.rotation.x;}
    if(t.state==='falling'){t.t+=dt;const s=Math.min(t.t/0.9,1);t.pivot.rotation.x=(s*s)*Math.PI/2;
      if(s>=1){t.state='down';t.t=0;const fx2=Math.sin(t.yawG.rotation.y),fz2=Math.cos(t.yawG.rotation.y);
        const cx=t.x+fx2*2.8*t.s,cz=t.z+fz2*2.8*t.s;burst(cx,H(cx,cz)+0.5,cz,t.kind==='cherry'?[0xffb6cf,0xffe0ec,0xffffff]:[0x79c45a,0xb8e89a,0xffffff],22,5);
        for(let i=0;i<6;i++)puff(cx+R(-1,1),H(cx,cz),cz+R(-1,1),0xf6f0e6,1.4);
        spawnDrops('wood',t.x+fx2*1.4*t.s,H(t.x,t.z)+0.8,t.z+fz2*1.4*t.s,2+Math.round(t.s*2)+(TL('wood',3)?2:0));if(t.fruit)spawnDrops(t.fruit,cx,H(cx,cz)+1,cz,2+((Math.random()*3)|0));spawnDrops('xp',t.x,H(t.x,t.z)+1,t.z,2,3);}}
    else if(t.state==='down'){t.t+=dt;const s=Math.min(t.t/0.45,1);t.body.scale.setScalar(t.s*(1-s)+0.001);if(s>=1){t.state='stump';t.t=0;t.stump.visible=true;t.o.r=0.38*t.s;t.regrow=R(70,110);}}
    else if(t.state==='stump'){t.t+=dt*mult;if(t.t>t.regrow&&Math.hypot(t.x-ply.x,t.z-ply.z)>3){t.state='grow';t.t=0;t.yawG.rotation.y=0;t.pivot.rotation.set(0,0,0);t.stump.visible=false;}}
    else if(t.state==='grow'){t.t+=dt;const s=Math.min(t.t/1.4,1);t.body.scale.setScalar(t.s*easeOutBack(s)+0.001);if(s>=1){t.state='alive';t.hp=t.max;t.o.r=0.5*t.s;}}}
  for(const r of rocks){if(r.shake>0){r.shake=Math.max(0,r.shake-dt*5);r.m.position.x=r.x+Math.sin(r.shake*40)*0.08*r.shake;r.m.position.z=r.z+Math.cos(r.shake*33)*0.05*r.shake;}
    if(r.state==='gone'){r.t+=dt*mult;if(r.t>100&&Math.hypot(r.x-ply.x,r.z-ply.z)>4){r.state='alive';r.hp=r.max;r.m.visible=true;r.o.r=0.7*r.s;r.pop=0;}}
    if(r.pop!==undefined&&r.pop<1){r.pop=Math.min(1,r.pop+dt*2.5);const e=easeOutBack(r.pop);r.m.scale.set(r.s*e+0.001,r.s*0.75*e+0.001,r.s*e+0.001);}}
  for(const p of placed){if(p.pop<1){p.pop=Math.min(1,p.pop+dt*3);p.g.scale.setScalar(easeOutBack(p.pop)+0.001);}
    if(p.g.userData.flame){const f=p.g.userData.flame;f.scale.set(1+Math.sin(T*13)*0.1,1+Math.sin(T*17)*0.15,1+Math.cos(T*11)*0.1);if(Math.random()<dt*6)burst(p.x,H(p.x,p.z)+1.3,p.z,[0xffd36e,0xffa36e],1,1.2,partG,0.6);}}
  if(ghost){const[x,z]=ghostSpot();const gy=supportY(x,z);ghost.position.set(x,gy+Math.sin(T*5)*0.05+0.05,z);ghost.rotation.y=carry.ry;
    const r=ITEMS[carry.id].r*fsOf(carry.id),rr=Math.max(r*0.8,0.3);ghostOK=(r===0||!obstacles.some(o=>o.r>0&&(o.y===undefined||Math.abs(o.y-gy)<0.9)&&Math.hypot(o.x-x,o.z-z)<o.r+r*0.9))&&!hitsWall(x-rr,x+rr,z-rr,z+rr)&&Math.hypot(x-BOARD.x,z-BOARD.z)>2&&Math.hypot(x-ply.x,z-ply.z)<9;
    const mat=ghostOK?ghostOkM:ghostNoM;ghost.traverse(o=>{if(o.isMesh)o.material=mat;});}
  // ---- 史萊姆 ----
  const night=isNight(),zmin=night?36:52,cap=night?14:8;
  if(ply.cave){if(monsters.filter(m=>m.dead<0&&m.cave).length<10&&Math.random()<dt*1.2)spawnCaveSlime();}
  else if(monsters.filter(m=>m.dead<0&&!m.cave).length<cap&&Math.random()<dt*0.8)spawnMonster();
  for(let i=monsters.length-1;i>=0;i--){const m=monsters[i];m.t+=dt;const c=m.c;
    if(m.spawn<1){m.spawn=Math.min(1,m.spawn+dt*2);c.m.scale.setScalar(easeOutBack(m.spawn)+0.001);}
    if(m.dead>=0){m.dead+=dt;c.m.scale.set(1+m.dead*3,Math.max(0.01,1-m.dead*3.2),1+m.dead*3);if(m.dead>0.3){scene.remove(m.g);monsters.splice(i,1);}continue;}
    m.ifr-=dt;
    if(m.flash>0){m.flash=Math.max(0,m.flash-dt*6);m.mat.emissive.setRGB(m.flash,m.flash,m.flash);}
    const dx=ply.x-m.x,dz=ply.z-m.z,d=Math.hypot(dx,dz)||0.01;
    const aggro=m.cave?16:(night?18:12);const chase=m.cave?(ply.cave&&d<aggro&&m.flash<0.3):(!ply.indoor&&!ply.cave&&d<aggro&&ply.x>zmin-6&&m.flash<0.3);
    if(m.y===0&&m.vy===0){m.hop-=dt;if(m.hop<=0){m.hop=chase?R(0.15,0.35):R(0.8,2.2);m.vy=chase?(night?6:5):4;m.sqv+=4;
      if(chase){m.dir=Math.atan2(dx,dz);}else if(Math.random()<0.6)m.dir=Math.random()*6.28;else m.dir=-1;}}
    let vx=0,vz=0;if(m.y>0&&m.dir>=0){const sp=(chase?(night?4.2:3.2):1.6)*(m.spd||1);vx=Math.sin(m.dir)*sp;vz=Math.cos(m.dir)*sp;}
    m.x+=(vx+m.kx)*dt;m.z+=(vz+m.kz)*dt;m.kx*=Math.pow(0.008,dt);m.kz*=Math.pow(0.008,dt);
    if(m.cave){const dx2=m.x-CAVE.x,dz2=m.z-CAVE.z,dd=Math.hypot(dx2,dz2);if(dd>CAVE.r-1.5){m.x=CAVE.x+dx2/dd*(CAVE.r-1.5);m.z=CAVE.z+dz2/dd*(CAVE.r-1.5);m.dir=Math.atan2(-dx2,-dz2);}}
    else{if(m.x<zmin){m.x=zmin;m.dir=Math.PI/2;}
    m.x=clamp(m.x,-110,110);m.z=clamp(m.z,-110,110);}
    for(const o of(m.cave?caveObs:obstacles)){if(o.r<=0)continue;if(o.box){pushBox(m,o,0.6*m.size);continue;}const ox=m.x-o.x,oz=m.z-o.z,od=Math.hypot(ox,oz),r=o.r+0.6*m.size;if(od<r&&od>0.001){m.x=o.x+ox/od*r;m.z=o.z+oz/od*r;}}
    const wasAir=m.y>0;m.vy-=20*dt;m.y=Math.max(0,m.y+m.vy*dt);if(m.y===0){if(wasAir){m.sqv-=6;}m.vy=0;}
    m.sqv+=((m.y>0?0.12:0)-m.sq)*150*dt-m.sqv*10*dt;m.sq+=m.sqv*dt;const s=clamp(m.sq,-0.45,0.4);
    if(m.spawn>=1)c.m.scale.set(1-s*0.6,1+s,1-s*0.6);
    let jx=0,jz=0;if(m.shake>0){m.shake-=dt;jx=Math.sin(m.shake*90)*0.1;jz=Math.cos(m.shake*70)*0.08;}
    m.g.position.set(m.x+jx,H(m.x,m.z)+m.y,m.z+jz);if(m.dir>=0)m.g.rotation.y+=angDiff(m.g.rotation.y,m.dir)*Math.min(1,dt*8);
    m.cool-=dt;
    if(!ply.riding&&!!m.cave===!!ply.cave&&!ply.sitting&&d<1.1+m.size*0.35&&m.cool<=0&&ply.ifr<=0&&m.flash<0.3&&ply.y<(ply.sleeping?ply.y+1:H(ply.x,ply.z)+0.8)){
      if(ply.sleeping){wakeUp();toast('被吵醒了！😾');}
      m.cool=1;ply.ifr=0.9;ply.hp-=m.dmg||(night?2:1);ply.kx=dx/d*10;ply.kz=dz/d*10;ply.vy=4;ply.ground=false;SFX.hurt();P.sqv-=5;
      burst(ply.x,ply.y+0.8,ply.z,[0xff9ec7,0xffffff],8,3);hurtFX();updateHUD();
      if(ply.hp<=0){ply.hp=0;faint('被史萊姆打倒了… 💫');return;}}
    if(m.cave&&!ply.cave&&Math.random()<dt*0.02){scene.remove(m.g);monsters.splice(i,1);}
  }
  // ---- 投射物 ----
  for(let i=projs.length-1;i>=0;i--){const p=projs[i];p.life-=dt;
    if(p.homing||p.kind==='orb'){const tg=p.target&&p.target.dead<0?p.target:nearestMonster(12,p);p.target=tg;if(tg){const a=Math.atan2(tg.x-p.x,tg.z-p.z),sp=Math.hypot(p.vx,p.vz);const cur=Math.atan2(p.vx,p.vz);const na=cur+angDiff(cur,a)*Math.min(1,dt*(p.kind==='star'?8:4));p.vx=Math.sin(na)*sp;p.vz=Math.cos(na)*sp;}}
    if(p.kind==='star'){const sp=Math.hypot(p.vx,p.vz);if(sp<16){p.vx*=1+dt*2;p.vz*=1+dt*2;}}
    p.x+=p.vx*dt;p.z+=p.vz*dt;if(p.hy!==undefined)p.hy+=(1.0-p.hy)*Math.min(1,dt*4);const gy=(ply.cave||ply.indoor)?0:H(p.x,p.z);p.m.position.set(p.x,(p.kind==='wave'?p.y:gy+(p.hy!==undefined?p.hy:(p.kind==='arrow'?0.9:1))),p.z);
    if(p.kind!=='wave')p.m.rotation.y=Math.atan2(p.vx,p.vz);else p.m.material.opacity=0.8*p.life/0.55;
    if(p.kind==='star')p.m.rotation.x+=dt*10;
    let done=p.life<=0;
    for(const m of monsters){if(m.dead>=0||p.hit.has(m))continue;if(Math.hypot(m.x-p.x,m.z-p.z)<0.7+m.size*0.4){p.hit.add(m);
      if(p.kind==='orb'){explode(p.x,p.z,p.dmg);done=true;break;}
      damageMonster(m,p.dmg,p.vx/Math.hypot(p.vx,p.vz),p.vz/Math.hypot(p.vx,p.vz),false);if(p.kind==='arrow'){SFX.arrowHit();done=true;break;}if(p.kind==='star'){done=true;break;}}}
    if(done&&p.kind==='orb'&&p.life<=0)explode(p.x,p.z,p.dmg);
    if(done){scene.remove(p.m);projs.splice(i,1);}}
  // ---- 掉落物 ----
  if(pickComboT>0){pickComboT-=dt;if(pickComboT<=0)pickCombo=0;}
  for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.t+=dt;const m=d.m;m.rotation.y+=dt*5;
    if(d.t<0.5){d.v.y-=20*dt;m.position.addScaledVector(d.v,dt);const g=H(m.position.x,m.position.z)+0.2;if(m.position.y<g){m.position.y=g;d.v.y=Math.abs(d.v.y)*0.5;d.v.x*=0.6;d.v.z*=0.6;}continue;}
    if(d.kind==='coin'||d.kind==='xp'){scene.remove(m);drops.splice(i,1);const sp=worldToScreen(m.position.x,m.position.y,m.position.z);flyReward(d.kind,d.val,sp.x,sp.y);continue;}
    const tx=ply.x-m.position.x,ty=ply.y+0.8-m.position.y,tz=ply.z-m.position.z,dd=Math.hypot(tx,ty,tz);
    if(dd>9||ply.indoor||ply.sleeping){m.position.y=H(m.position.x,m.position.z)+0.3+Math.sin(T*3+i)*0.1;continue;}
    const sp=Math.min(22,4+(d.t-0.5)*30);m.position.x+=tx/dd*sp*dt;m.position.y+=ty/dd*sp*dt;m.position.z+=tz/dd*sp*dt;
    if(dd<0.6){scene.remove(m);drops.splice(i,1);pickCombo++;pickComboT=0.6;addItem(d.kind,1);SFX.pickup(pickCombo);}}
  // ---- 特效更新 ----
  for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.life-=dt;p.v.y-=p.grav*dt;p.position.addScaledVector(p.v,dt);p.rotation.x+=dt*8;p.rotation.y+=dt*6;p.scale.setScalar(Math.max(0.01,p.life/p.max)*p.s0);if(p.life<=0){scene.remove(p);parts.splice(i,1);}}
  for(let i=puffs.length-1;i>=0;i--){const p=puffs[i];p.life-=dt;p.position.addScaledVector(p.v,dt);const k=1-p.life/p.max;p.scale.setScalar((0.5+k*1.3)*p.s);p.material.opacity=0.8*(1-k);if(p.life<=0){scene.remove(p);p.material.dispose();puffs.splice(i,1);}}
  for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.t+=dt;const s=r.t/r.dur;r.m.scale.setScalar(lerp(r.r0,r.r1,easeOut(s)));r.m.material.opacity=0.9*(1-s);if(s>=1){scene.remove(r.m);r.m.geometry.dispose();r.m.material.dispose();rings.splice(i,1);}}
  for(let i=trails.length-1;i>=0;i--){const r=trails[i];r.t+=dt;const s=r.t/r.dur;r.m.position.set(ply.x,ply.y+0.75,ply.z);r.m.material.opacity=0.85*(1-s);r.m.scale.setScalar(r.s0*(1+s*0.25));if(s>=1){scene.remove(r.m);r.m.material.dispose();trails.splice(i,1);}}
  for(let i=dmgs.length-1;i>=0;i--){const d=dmgs[i];d.t+=dt;d.vy-=6*dt;d.s.position.y+=d.vy*dt;d.s.material.opacity=d.t>0.6?1-(d.t-0.6)/0.3:1;
    if(d.t<0.12)d.s.scale.multiplyScalar(1+dt*3);if(d.t>0.9){scene.remove(d.s);d.s.material.map.dispose();d.s.material.dispose();dmgs.splice(i,1);}}
  // ---- UI ----
  const c=context();if(c!==lastCtx){lastCtx=c;$('actIcon').textContent=CTX[c][0];$('actTxt').textContent=CTX[c][1];$('btnAct').classList.toggle('dim',c==='none');if(c!=='none')bump($('btnAct'),'boing');}
  hudT-=dt;if(hudT<=0){hudT=0.25;updateHUD();}
  miniT-=dt;if(miniT<=0){miniT=0.1;drawMini();}
  saveT-=dt;if(saveT<=0){saveT=15;save();}
}
let lastCtx='';
const _v3=new THREE.Vector3();
function worldToScreen(x,y,z){_v3.set(x,y,z).project(camera);return{x:(_v3.x*0.5+0.5)*innerWidth,y:(-_v3.y*0.5+0.5)*innerHeight};}

// ---------- 洞窟燈光 ----------
const caveLight=new THREE.PointLight(0xffd8b0,0,22,1.4);caveLight.position.set(CAVE.x,4,CAVE.z);scene.add(caveLight);

// ---------- 鋤頭預覽地塊 ----------
const hoePrev=(()=>{const t=canvasTex(64,64,(g)=>{g.clearRect(0,0,64,64);g.strokeStyle='#fff';g.lineWidth=7;g.setLineDash([10,6]);g.strokeRect(5,5,54,54);g.fillStyle='rgba(255,255,255,.45)';g.fillRect(5,5,54,54);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(TILE*0.98,TILE*0.98),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-6,color:0x8fdcb4}));m.rotation.x=-Math.PI/2;m.visible=false;m.renderOrder=3;scene.add(m);
  const ghost=new THREE.Mesh(m.geometry,new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,depthTest:false,opacity:0.35,color:0x8fdcb4}));ghost.renderOrder=4;m.add(ghost);m.userData.ghost=ghost;return m;})();
function updateHoePreview(T){const h=ply.held;const show=!ply.indoor&&!ply.cave&&!ply.sleeping&&!ply.sitting&&!ply.fishing&&(h==='hoe'||h==='can'||(h&&h.startsWith('seed_')));
  if(!show){hoePrev.visible=false;return;}const[gx,gz]=frontGrid(),ft=farm.get(gkey(gx,gz));let col=null;
  if(h==='hoe')col=ft?0xffb35a:(canTill(gx,gz)?0x8fdcb4:0xff6f6f);else if(h==='can')col=ft?0x8fd0ff:null;else col=ft&&!ft.crop?0x8fdcb4:(ft?null:0xff6f6f);
  if(col===null){hoePrev.visible=false;return;}hoePrev.visible=true;hoePrev.material.color.setHex(col);hoePrev.userData.ghost.material.color.setHex(col);const x=gx*TILE,z=gz*TILE;hoePrev.position.set(x,H(x,z)+(ft?0.16:0.18),z);hoePrev.material.opacity=0.75+Math.sin(T*6)*0.25;}

// ---------- 寵物 ----------
const PET_DEF=[{type:'bunny',name:'小白兔',x:-20,z:-32,fav:'carrot'},{type:'bunny2',name:'奶茶兔',x:12,z:-46,fav:'carrot'},{type:'chick',name:'嗶嗶',x:7,z:12,fav:'strawberry'},
  {type:'cat',name:'喵喵',x:V2.x+6,z:V2.z+5,fav:'fish'},{type:'puppy',name:'汪汪',x:V3.x-5,z:V3.z-5,fav:'apple'},{type:'chick',name:'啾比',x:V3.x+6,z:V3.z+3,fav:'tomato'}];
function heartTex(aff){const cv=document.createElement('canvas');cv.width=160;cv.height=40;const g=cv.getContext('2d');g.font='26px sans-serif';g.textAlign='center';g.textBaseline='middle';
  const n=Math.floor(aff/20);for(let i=0;i<5;i++){g.globalAlpha=i<n?1:0.28;g.fillText(i<n?'💗':'🤍',16+i*32,21);}return new THREE.CanvasTexture(cv);}
const PET_TYPES={cat:{n:'小貓咪',i:'🐱',fav:'fish'},puppy:{n:'小狗狗',i:'🐶',fav:'apple'},dino:{n:'小恐龍',i:'🦖',fav:'pumpkin'},bunny:{n:'小兔子',i:'🐰',fav:'carrot'},
  chick:{n:'小雞',i:'🐥',fav:'strawberry'},axolotl:{n:'六角恐龍',i:'🦎',fav:'fish'},fox:{n:'小狐狸',i:'🦊',fav:'peach'},bear:{n:'小熊',i:'🐻',fav:'pear'}};
function makePet(d,aff=0){const a=makeAnimal(d.type);a.g.position.set(d.x,H(d.x,d.z),d.z);scene.add(a.g);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:heartTex(aff),depthWrite:false,transparent:true}));sp.scale.set(1.6,0.4,1);sp.position.y=1.25;sp.visible=false;a.g.add(sp);
  const p={d,a,x:d.x,z:d.z,hx:d.x,hz:d.z,tx:d.x,tz:d.z,aff,follow:false,wait:R(1,3),face:R(0,6),t:R(0,5),sp,happy:0,findT:R(60,90),cave:false,indoor:false};pets.push(p);return p;}
const pets=[];PET_DEF.forEach(d=>makePet(d));
// 家裡／門口的等待位置
function homeSpot(p){const i=pets.indexOf(p);if(i%2===0){const a=i*1.3;return{x:DOOR_OUT.x+2.5+Math.cos(a)*1.6,z:HOME.z+Math.sin(a)*3.5,inside:false};}
  const spots=[[-2.5,-1.5],[1.5,0.5],[-4.5,1.5],[0.5,-3.0],[4.0,1.8],[-1.0,1.6]];const sp=spots[(i>>1)%spots.length];return{x:HOME.x+sp[0],z:HOME.z+sp[1],inside:true};}
// 經過門口的路徑
function viaDoor(px,pz,tx,tz){const pin=inHouse(px,pz,0.2),tin=inHouse(tx,tz,0.2);if(pin===tin)return[tx,tz];
  const a=pin?DOOR_IN:DOOR_OUT,b=pin?DOOR_OUT:DOOR_IN;if(Math.hypot(px-a.x,pz-a.z)>0.6&&!(Math.abs(pz-HOME.z)<0.9&&Math.abs(px-(HOME.x+HOME.w))<1.6))return[a.x,a.z];return[b.x,b.z];}
function nearestPet(r){let best=null,bd=r;for(const p of pets){if(!!p.cave!==!!ply.cave)continue;const d=Math.hypot(p.x-ply.x,p.z-ply.z);if(d<bd){bd=d;best=p;}}return best;}
const isFav=(p,k)=>p.d.fav==='fish'?ITEMS[k].k==='fish':k===p.d.fav;
function foodFor(p){const keys=Object.keys(inv).filter(k=>inv[k]>0&&(ITEMS[k].k==='food'||ITEMS[k].k==='fish'));return keys.find(k=>isFav(p,k))||keys[0];}
function hasFoodFor(p){return!!foodFor(p);}
function setAff(p,v){p.aff=clamp(v,0,100);p.sp.material.map.dispose();p.sp.material.map=heartTex(p.aff);p.sp.material.needsUpdate=true;}
function sendHome(o){o.follow=false;o.homing=true;o.wait=0;const h=homeSpot(o);o.hx=h.x;o.hz=h.z;o.tx=h.x;o.tz=h.z;}
function petAction(p,kind){if(!p)return;faceTo(p.x,p.z);const hy=H(p.x,p.z)+0.9;
  if(kind==='feed'){const k=foodFor(p);if(!k)return;inv[k]--;renderHotbar();const fav=isFav(p,k);setAff(p,p.aff+(fav?25:12));p.happy=1.2;SFX.eat();
    burst(p.x,hy,p.z,[0xff8fb0,0xffd6e6,0xffffff],fav?14:8,3);toast(`${p.d.name} 吃了 ${ITEMS[k].i}${fav?'，超喜歡！💕':'！'} 好感度 ${p.aff}/100`);if(p.aff>=100)setTimeout(()=>toast(`${p.d.name} 很想跟你一起走！按「邀請」吧 💕`),1200);}
  else if(kind==='invite'){for(const o of pets)if(o.follow){sendHome(o);toast(`${o.d.name} 先回家等你囉 🏠`);}p.follow=true;p.homing=false;p.happy=2;SFX.levelup();ring(p.x,H(p.x,p.z)+0.1,p.z,0xff9ec7,0.3,3,0.6);
    burst(p.x,hy,p.z,PAST.map(c=>parseInt(c.slice(1),16)),20,4);toast(`${p.d.name} 成為你的夥伴了！🐾`);}
  save();}
function petMove(p,tx,tz,dt,sp){[tx,tz]=viaDoor(p.x,p.z,tx,tz);if(p.follow&&ply.riding)return false;return steer(p,tx,tz,sp,dt,0.25);}
function updatePets(dt,T){
  for(const p of pets){p.t+=dt;const g=p.a.g;let moving=false;
    if(p.follow){if(!!p.cave!==!!ply.cave||Math.hypot(p.x-ply.x,p.z-ply.z)>30){p.cave=!!ply.cave;p.x=ply.x-Math.sin(ply.face)*1.5;p.z=ply.z-Math.cos(ply.face)*1.5;}
      const tx=ply.x-Math.sin(ply.face)*1.8+Math.cos(ply.face)*0.8,tz=ply.z-Math.cos(ply.face)*1.8-Math.sin(ply.face)*0.8,d=Math.hypot(tx-p.x,tz-p.z);
      if(d>0.4){moving=petMove(p,tx,tz,dt,Math.min(d*2.5,11));}else p.face+=angDiff(p.face,ply.face)*Math.min(1,dt*3);
      p.findT-=dt;if(p.findT<=0&&!ply.sleeping){p.findT=R(70,110);const r=Math.random();const k=r<0.55?Object.keys(FRUITS)[(Math.random()*4)|0]:r<0.8?'weed':'gem';addItem(k,1);p.happy=1.2;toast(`${p.d.name} 找到了 ${ITEMS[k].i} ${ITEMS[k].n}！`);
        const sp=worldToScreen(p.x,H(p.x,p.z)+1,p.z);for(let i=0;i<3;i++)flyReward('coin',1,sp.x,sp.y);}}
    else{if(p.aff>=100&&!p.homing){sendHome(p);}
      if(p.cave&&!ply.cave){p.cave=false;p.x=CAVE_FRONT.x;p.z=CAVE_FRONT.z;}
      const far=Math.hypot(p.tx-p.x,p.tz-p.z)>12;const sp=p.homing&&far?3.2:1.4;
      if(Math.hypot(p.tx-p.x,p.tz-p.z)>0.3){moving=petMove(p,p.tx,p.tz,dt,sp);}
      else{p.wait-=dt;if(p.wait<=0){p.wait=R(2,5);const a=R(0,6.28),r=p.homing?R(0.3,1.6):R(0.5,5);p.tx=p.hx+Math.cos(a)*r;p.tz=p.hz+Math.sin(a)*r;
        if(p.homing&&inHouse(p.hx,p.hz)){p.tx=clamp(p.tx,HOME.x-HOME.w+0.8,HOME.x+HOME.w-0.8);p.tz=clamp(p.tz,HOME.z-HOME.d+0.8,HOME.z+HOME.d-0.8);}
        else if(!farFrom(p.tx,p.tz,0.5)){p.tx=p.hx;p.tz=p.hz;}}}
      if(Math.hypot(ply.x-p.x,ply.z-p.z)<3&&!moving)p.face+=angDiff(p.face,Math.atan2(ply.x-p.x,ply.z-p.z))*Math.min(1,dt*4);
      if(p.homing&&!moving&&Math.hypot(ply.x-p.x,ply.z-p.z)<6&&Math.random()<dt*0.3)p.happy=0.8;}
    if(!p.cave&&p.rideY===undefined){pushWalls(p,0.3);if(moving)collideObs(p,0.35);}
    const gy=p.rideY!==undefined&&ply.riding?p.rideY:p.cave?0:Math.max(H(p.x,p.z),inHouse(p.x,p.z)?0.02:-9);let hop=moving?Math.abs(Math.sin(p.t*11))*0.18:0;if(p.happy>0){p.happy-=dt;hop=Math.abs(Math.sin(p.t*14))*0.35;}
    g.position.set(p.x,gy+hop,p.z);g.rotation.y=p.face;const sq=moving||p.happy>0?1+Math.sin(p.t*22)*0.06:1+Math.sin(p.t*3)*0.03;p.a.m.scale.set(1/Math.sqrt(sq),sq,1/Math.sqrt(sq));
    if(p.a.m.userData.tail)p.a.m.userData.tail.rotation.z=Math.sin(p.t*(p.follow||p.happy>0?14:3))*0.45;
    g.visible=!!p.cave===!!ply.cave;p.sp.visible=g.visible&&!p.follow&&Math.hypot(ply.x-p.x,ply.z-p.z)<6;}
}

// ---------- 釣魚 ----------
let fishLine=null,bobber=null;
function startFishing(){useEn(0.5);faceTo(POND.x,POND.z);const d=Math.hypot(POND.x-ply.x,POND.z-ply.z);const into=Math.min(d-1.5,(d-POND.r)+3.0);
  const bx=ply.x+(POND.x-ply.x)/d*into,bz=ply.z+(POND.z-ply.z)/d*into;
  if(!bobber){bobber=new THREE.Group();bobber.add(mk(new THREE.SphereGeometry(0.13,10,8,0,Math.PI*2,0,Math.PI/2),toon(0xff5a5a)));const lo=mk(new THREE.SphereGeometry(0.13,10,8,0,Math.PI*2,Math.PI/2,Math.PI/2),toon(0xffffff));bobber.add(lo);scene.add(bobber);
    fishLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xffffff}));scene.add(fishLine);}
  bobber.visible=fishLine.visible=true;ply.fishing={phase:'cast',t:0,bx,bz,bite:R(2.5,6.5),nib:R(0.6,1.5)};toolShow='rod';refreshHeld();SFX.bow();}
function endFishing(msg){ply.fishing=null;if(bobber){bobber.visible=false;fishLine.visible=false;}toolShow=null;refreshHeld();if(msg)toast(msg);}
function catchFish(){const f=ply.fishing;if(!f||f.phase!=='bite')return;let tot=Object.values(FISH).reduce((a,b)=>a+b.w,0),r=Math.random()*tot,k='fish1';for(const[kk,v]of Object.entries(FISH)){r-=v.w;if(r<=0){k=kk;break;}}
  addItem(k,1);SFX.catchBug();SFX.splash();burst(f.bx,-0.3,f.bz,[0x9fdcff,0xffffff],16,4);spawnDrops('xp',f.bx,0.4,f.bz,3,3);P.setFace('happy');setTimeout(()=>P.setFace('open'),900);
  toast(`釣到了 ${FISH[k].i} ${FISH[k].n}！`);endFishing();save();}
const _tip=new THREE.Vector3();
function updateFishing(dt,T){const f=ply.fishing;if(!f)return;f.t+=dt;
  P.T.rod.userData.tip.getWorldPosition(_tip);let by=-0.33;
  if(f.phase==='cast'){const s=Math.min(1,f.t/0.55);const sx=_tip.x,sz=_tip.z;bobber.position.set(lerp(sx,f.bx,s),lerp(_tip.y,by,s)+Math.sin(s*Math.PI)*1.5,lerp(sz,f.bz,s));if(s>=1){f.phase='wait';f.t=0;SFX.splash();ring(f.bx,-0.36,f.bz,0xffffff,0.2,1.2,0.5);}}
  else if(f.phase==='wait'){by+=Math.sin(T*3)*0.03;f.nib-=dt;if(f.nib<=0){f.nib=R(0.8,1.6);by-=0.06;SFX.bubble();ring(f.bx,-0.36,f.bz,0xffffff,0.1,0.5,0.3);}
    if(f.t>f.bite){f.phase='bite';f.t=0;SFX.splash();SFX.lock();const sp=worldToScreen(ply.x,ply.y+2.2,ply.z);floatTxt('❗ 拉竿！',sp.x,sp.y);ring(f.bx,-0.36,f.bz,0xffffff,0.2,1.6,0.4);}
    bobber.position.set(f.bx,by,f.bz);}
  else if(f.phase==='bite'){bobber.position.set(f.bx+Math.sin(T*40)*0.04,by-0.18,f.bz);if(Math.random()<dt*20)burst(f.bx,-0.3,f.bz,0xffffff,1,1.5);if(f.t>1.1){endFishing('魚跑掉了…');return;}}
  const pos=fishLine.geometry.attributes.position;pos.setXYZ(0,_tip.x,_tip.y,_tip.z);pos.setXYZ(1,bobber.position.x,bobber.position.y+0.1,bobber.position.z);pos.needsUpdate=true;fishLine.geometry.computeBoundingSphere();}
