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
const trails=[];const trailGeo={arc:new THREE.RingGeometry(1.3,2.9,28,1,-Math.PI/2-1.0,2.0),full:new THREE.RingGeometry(1.25,2.9,28,1,1.75,1.95),line:new THREE.PlaneGeometry(0.5,3.4),spin:new THREE.RingGeometry(1.5,2.6,48,1)};
trailGeo.arc.rotateX(-Math.PI/2);trailGeo.arc.translate(0,0,0.25);trailGeo.full.rotateY(Math.PI/2);trailGeo.full.translate(0,0.15,0.35);trailGeo.line.rotateX(-Math.PI/2);trailGeo.line.translate(0,0,2.9);trailGeo.spin.rotateX(-Math.PI/2);trailGeo.spin.translate(0,0.5,0);
// 揮擊軌跡：kind＝arc（水平弧）、c3（直劈）、line（突刺）、spin（迴旋）；rz＝傾斜
function slash(kind,scale=1,off,rz=0,follow){const geo=kind==='c3'?trailGeo.full:kind==='line'?trailGeo.line:kind==='spin'?trailGeo.spin:trailGeo.arc;const sk=skinOf(ply.weapon);
  const col=sk==='skin_flame'?(rz>0?0xff4a10:0xff7a1a):sk==='skin_thunder'?0xb48cff:sk==='skin_dragon'?0xff3a2a:sk==='skin_shadow'?0x3a50ff:(rz>0?0xe8dcff:0xfff0e0);
  const m=new THREE.Mesh(geo,basic(col,{transparent:true,opacity:0.85,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  m.position.set(ply.x,ply.y+0.75,ply.z);m.rotation.order='YXZ';m.rotation.y=ply.face;m.rotation.z=rz;m.scale.setScalar(scale);scene.add(m);trails.push({m,t:0,dur:follow!==undefined?0.3:kind==='c3'||kind==='spin'?0.32:0.22,s0:scale,off,follow});if(off){const c=Math.cos(ply.face),sn=Math.sin(ply.face);m.position.set(ply.x+off.x*c,ply.y+off.y,ply.z-off.x*sn);}}
const dmgs=[];
function dmgNum(x,y,z,txt,crit,col){const cv=document.createElement('canvas');cv.width=128;cv.height=64;const c=cv.getContext('2d');c.font='900 46px "Zen Maru Gothic",sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.lineWidth=10;c.strokeStyle=col||(crit?'#ff7f6a':'#e0609a');c.strokeText(txt,64,34);c.fillStyle=crit&&!col?'#fff36e':'#ffffff';c.fillText(txt,64,34);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),depthTest:false,depthWrite:false,transparent:true}));s.renderOrder=20;s.position.set(x+R(-.3,.3),y,z);s.scale.set(crit?2.2:1.5,crit?1.1:0.75,1);scene.add(s);dmgs.push({s,t:0,vy:3});}
let hitStop=0;

// ---------- 玩家 ----------
let P=null,creatorOpen=false,creatorThen=null;
let look=Object.assign({},DEF_LOOK);
try{const l=localStorage.getItem('lobster-look');if(l)look=Object.assign({},DEF_LOOK,JSON.parse(l));}catch(e){}
let toolShow=null;
const skinOf=w=>{const k=ply.skins&&ply.skins[w];return k&&ITEMS[k]?k:null;};
const wpnModel=()=>{const k=skinOf(ply.weapon);return k?ITEMS[k].model:ply.weapon;};
const SKIN_PAL={skin_dragon:[0xff3030,0xd8b060,0x9a7a54,0xffe0a0],skin_shadow:[0x2a3cff,0x1a2490,0x8a9aff,0xffffff],skin_comet:[0xffd36e,0xfff3c0,0xffffff,0xffb830],skin_eye:[0x9ff4ff,0xdffcff,0xffffff,0x6ae0e8],skin_star:[0x6a9aff,0xbfe0ff,0xffffff,0x3a58b0],skin_guard:[0xbff2ff,0x7fd8ff,0xffffff,0xe6eef6],skin_flame:[0xff8a3a,0xffc04a,0xff5a2a,0xffe08a],skin_thunder:[0xd8c0ff,0xb48cff,0xffffff,0xeadcff],skin_wind:[0xa8f0c0,0x7fe0a0,0xffffff,0xd8ffe8],skin_ice:[0xbfe8ff,0x8fd0ff,0xffffff,0xe0f6ff]};
const skinPal=()=>SKIN_PAL[skinOf(ply.weapon)]||null;
function refreshHeld(){if(!P)return;const k=(creatorOpen||ply.sitting||ply.sleeping||ply.riding)?null:(toolShow||(ply.held&&P.T[ply.held]?ply.held:null)||wpnModel());for(const t in P.T)P.T[t].visible=(t===k);}
function rebuildPlayer(){if(P)scene.remove(P.g);P=makeCritter(look,true);scene.add(P.g);refreshHeld();P.g.position.set(ply.x,ply.y,ply.z);}
rebuildPlayer();

// ---------- NPC ----------
const NPCS=[
  {name:'龍蝦村長',voice:0.8,home:{x:V2.x+3,z:V2.z+2},house:0,look:{body:'#e9773e',accent:'#6e3428',eyeSize:1.0,glasses:true,scarf:'#fff3a8'},
   lines:['歡迎來到龍蝦村～我是村長。','我們龍蝦精靈最喜歡圓滾滾的東西、熱拉麵，還有午睡。','舞台上那四個孩子每天都在練舞，去看看吧！','東邊野外的粉紅果凍怪晚上會變兇，要小心喔。']},
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
   lines:['嗨嗨！我是薩薩子～你是新來的嗎？先徒手砍棵樹吧！','木材拿去做 🧰 工作台，放下後就能做武器跟工具喔！','打倒果凍怪會掉金幣跟經驗值，升級可以點天賦 ⭐','西南邊的龍蝦村有拉麵店跟舞台，順著小路走就到了～']},
  {name:'糰糰長老',voice:0.75,home:{x:V3.x+3,z:V3.z+3},door:V3HOUSES[0].door,look:{species:'hamster',body:'#fff3e2',accent:'#e8c49a',ears:'round',eyeSize:0.9,mouth:'smile',glasses:true,hat:'straw',hatColor:'#ff9ec4'},
   lines:['歡迎來到倉鼠精靈村，我是長老糰糰。','我們倉鼠精靈最喜歡葵花籽，還有在大滾輪上跑步！','龍蝦精靈是我們的老朋友，常常一起吃拉麵喔。']},
  {name:'米米',voice:1.25,home:{x:V3.x-6,z:V3.z-3},door:V3HOUSES[1].door,look:{species:'hamster',body:'#ffe6b8',accent:'#ffb38a',ears:'bear',eyeSize:1.3,mouth:'open',blush:true,hat:'bow',hatColor:'#ff8fb0'},
   lines:['嘿嘿～你看到廣場的大滾輪了嗎？超好玩的！','把種子塞在臉頰裡可以帶好多好多走喔！','東邊的果凍怪軟軟的，可是撞到很痛…']},
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
// 樂園商店店員、城堡餐廳店長
NPCS.push({name:'樂樂',voice:1.2,stall:'park',shop:'park',door:PARKV.gateOut,look:{body:'#ff9ec4',accent:'#8a2a4a',eyes:'star',mouth:'open',blushShape:'heart',scarf:'#ffd36e'},lines:['歡迎光臨樂園商店！吉拿棒可以讓你的劍變成甜甜的造型喔～']},
  {name:'城堡主廚',voice:0.85,job:'stay',noHome:true,home:{x:PARKV.KC.x+PARKV.KC.w-3,z:PARKV.KC.z-4.2},door:null,shop:'castle',look:{body:'#f0874f',accent:'#6e3428',hat:'chef',mouth:'smile',eyes:'round',blushShape:'oval'},
   lines:['歡迎來到龍蝦樂園餐廳！今天是樂園六週年慶典 🎉','大家都在吃週年特餐，你也來一份吧！']});
// 遊樂園的遊客
{const nm=['小丸','圓圓','滴滴','噗噗','咕咕','麻糬','布丁','可可','奶昔','果凍','湯圓','餅餅'];const bodies=['#ff8fa3','#8fc8ff','#ffd36e','#8fdcb4','#c4b2f0','#ffb38a','#f5f5f5','#ffe6b8','#9edbb0','#ff9ec4','#cfe4ff','#e9773e'];
 const acc=['#8a2a4a','#2a4a8a','#8a5a1a','#2a6a4a','#4a3268','#8a3a2a','#9a90b8','#e8a070','#3f6e55','#8a2a4a','#2a4a8a','#6e3428'];
 const eyes=['round','dot','big','oval','star','round'],mouths=['w','smile','open','v','o','smile'],LINES=[['摩天輪上可以看到整個島喔！','晚上的燈光超漂亮～'],['旋轉木馬轉啊轉～好開心！','你也去騎騎看嘛！'],['咖啡杯轉太快頭好暈…','爆米花好香喔！'],['氣球要哪個顏色好呢？','我最喜歡粉紅色的氣球！'],['聽說轉蛋可以抽到小恐龍！','一百個金幣抽一次喔～']];
 for(let i=0;i<12;i++){const ham=i%3===1;const p=PARKV.poi[(i*5)%PARKV.poi.length];NPCS.push({name:nm[i],voice:0.9+(i%5)*0.1,job:'park',home:{x:p.x,z:p.z},door:PARKV.gateOut,
   look:Object.assign({species:ham?'hamster':'lobster',body:bodies[i],accent:acc[i],eyes:eyes[i%6],mouth:mouths[(i+2)%6],blush:i%2===0},ham?{ears:['round','bear','cat','bunny'][i%4]}:{}),lines:LINES[i%5]});}}
const npcs=NPCS.map(d=>{const c=makeCritter(Object.assign({species:'lobster'},d.look),!!d.job);const tag=nameTag(d.name);tag.position.y=2.4;c.g.add(tag);
  let hx,hz,face=0;if(d.stall){const s=STALLS[d.stall];hx=s.keeper.x;hz=s.keeper.z;face=s.ry;}else{hx=d.home.x;hz=d.home.z;}
  c.g.position.set(hx,H(hx,hz)+(d.stall?0.84:0),hz);scene.add(c.g);
  let door=d.door||(d.house>=0?V2HOUSES[d.house].door:null);if(!door&&!d.noHome){let bd=1e9;for(const h of[...V2HOUSES,...V3HOUSES]){const dd=Math.hypot(h.door.x-hx,h.door.z-hz);if(dd<bd){bd=dd;door=h.door;}}}
  const k=NPCS.indexOf(d)%5;
  return Object.assign({},d,{c,tag,x:hx,z:hz,hx,hz,face,tx:hx,tz:hz,wait:R(1,3),walk:0,talking:false,away:false,pose:newPose(),door,onPost:true,sleepH:20+k*0.5,wakeH:5.5+k*0.5});});
function nearestRemote(){if(typeof remotes==='undefined')return null;let best=null,bd=2.6;for(const r of remotes.values()){if(!r.c.g.visible||!r.nid||(r.pr&&r.pr.dn))continue;const d=Math.hypot(r.x-ply.x,r.z-ply.z);if(d<bd){bd=d;best=r;}}return best;}
function nearestNpc(){if(ply.indoor||ply.cave)return null;let best=null,bd=1e9;for(const n of npcs){if(n.away)continue;const d=Math.hypot(n.x-ply.x,n.z-ply.z);if(d<(n.stall?3.4:2.6)&&d<bd){bd=d;best=n;}}return best;}
// 舞台上的四隻龍蝦精靈
const DANCE_COL=[['#ff8fa3','#8a2a4a'],['#8fc8ff','#2a4a8a'],['#ffd36e','#8a5a1a'],['#8fdcb4','#2a6a4a']];
const dancers=DANCE_COL.map(([b,a],i)=>{const c=makeCritter({species:'lobster',body:b,accent:a,eyeSize:1.1,mouth:i%2?'open':'smile',blush:true});c.setFace('happy');
  const lx=-2.7+i*1.8,x=STAGE.x-lx,z=STAGE.z-0.3;c.g.position.set(x,H(STAGE.x,STAGE.z)+0.68,z);c.g.rotation.y=Math.PI;scene.add(c.g);return{c,i,x,z,pose:newPose()};});

// ---------- 果凍怪 ----------
const monsters=[];
const hpBgM=basic(0x5a4070,{depthTest:false}),hpFgM=basic(0xff6f9f,{depthTest:false});
const CAVE_SLIMES=[{c:'#7ab8ff',hp:10,dmg:2,sp:1.0,coin:5,xp:5,w:4},{c:'#7fe08a',hp:12,dmg:2,sp:1.25,coin:5,xp:6,w:3},{c:'#b98aff',hp:16,dmg:3,sp:1.0,coin:7,xp:8,w:2},{c:'#ff6a6a',hp:14,dmg:3,sp:1.4,coin:7,xp:8,w:2},{c:'#ffd24a',hp:22,dmg:3,sp:1.1,coin:20,xp:12,w:0.6}];
function spawnCaveSlime(){const L=caveLv-1;let x=CAVE.x,z=CAVE.z;for(let k=0;k<30;k++){const a=R(0,6.28),d=R(4,CAVE.r-3);x=CAVE.x+Math.cos(a)*d;z=CAVE.z+Math.sin(a)*d;if(farFrom(x,z,1.2,caveObs)&&Math.hypot(x-ply.x,z-ply.z)>10)break;}
  let tot=CAVE_SLIMES.reduce((a,b)=>a+b.w,0),r=Math.random()*tot,d=CAVE_SLIMES[0];for(const c of CAVE_SLIMES){r-=c.w;if(r<=0){d=c;break;}}
  const size=R(0.95,1.3)*(d.w<1?1.3:1);const c=makeSlime(true,size,d.c,true);const g=c.g;
  const bar=new THREE.Group(),bg=mk(new THREE.PlaneGeometry(1,0.14),hpBgM),fg=mk(new THREE.PlaneGeometry(1,0.14),hpFgM,0,0,0.001);bg.renderOrder=fg.renderOrder=9;bar.add(bg,fg);bar.position.y=1.6;bar.visible=false;g.add(bar);
  g.position.set(x,0,z);g.scale.multiplyScalar(1+L*0.08);c.m.scale.setScalar(0.01);scene.add(g);const hp=Math.round((d.hp+Math.floor(ply.lv*1.2))*(1+L*0.55)*monScale());
  monsters.push({g,c,mat:c.mat,bar,fg,x,z,y:0,vy:0,hp,max:hp,size:size*(1+L*0.08),t:Math.random()*5,dir:Math.random()*6.28,wt:0,kx:0,kz:0,cool:0,dead:-1,flash:0,spawn:0,ifr:0,hop:R(0.3,1),shake:0,night:true,sq:0,sqv:0,cave:true,dmg:d.dmg+L,spd:d.sp*(1+L*0.08),coin:Math.round(d.coin*(1+L*0.6)),xpv:Math.round(d.xp*(1+L*0.6))});}
function spawnMonster(){
  let x=80,z=0;const n=isNight(),zmin=n?36:56;
  for(let k=0;k<40;k++){x=R(zmin,106);z=R(-104,104);if(farFrom(x,z,1.2)&&Math.hypot(x-ply.x,z-ply.z)>20)break;}
  const size=R(0.85,1.15)*(n?1.12:1);const c=makeSlime(n,size);const g=c.g;
  const bar=new THREE.Group(),bg=mk(new THREE.PlaneGeometry(1,0.14),hpBgM),fg=mk(new THREE.PlaneGeometry(1,0.14),hpFgM,0,0,0.001);bg.renderOrder=fg.renderOrder=9;bar.add(bg,fg);bar.position.y=1.6;bar.visible=false;g.add(bar);
  g.position.set(x,H(x,z),z);c.m.scale.setScalar(0.01);scene.add(g);
  const hp=Math.round(((n?6:4)+Math.floor(ply.lv*0.8))*monScale());
  monsters.push({g,c,mat:c.mat,bar,fg,x,z,y:0,vy:0,hp,max:hp,size,t:Math.random()*5,dir:Math.random()*6.28,wt:0,kx:0,kz:0,cool:0,dead:-1,flash:0,spawn:0,ifr:0,hop:R(0.3,1),shake:0,night:n,sq:0,sqv:0});
}
function churroStars(c){const n=c===3?10:5;for(let i=0;i<n;i++){const a=ply.face+R(-1.1,1.1),d=R(0.8,2.4);const x=ply.x+Math.sin(a)*d,z=ply.z+Math.cos(a)*d;
  const m=new THREE.Mesh(starG,pMat([0xfff07a,0xffb3d9,0xffffff,0xb3e8ff][i%4]));m.position.set(x,ply.y+R(0.6,1.6),z);m.v=new THREE.Vector3(Math.sin(a)*R(1,3),R(2.5,5),Math.cos(a)*R(1,3));m.life=m.max=R(0.5,0.85);m.s0=R(1.2,2.0);m.grav=9;scene.add(m);parts.push(m);}}
const starG=(()=>{const sh=new THREE.Shape();for(let i=0;i<10;i++){const r=i%2?0.045:0.11,a=i/10*Math.PI*2+Math.PI/2;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?sh.lineTo(x,y):sh.moveTo(x,y);}return new THREE.ExtrudeGeometry(sh,{depth:0.03,bevelEnabled:false});})();
function flameSparks(c){const n=c===3?16:9;for(let i=0;i<n;i++){const a=ply.face+R(-1.2,1.2),d=R(0.8,2.8);const x=ply.x+Math.sin(a)*d,z=ply.z+Math.cos(a)*d;
  const m=new THREE.Mesh(partG,pMat([0xffb347,0xff6a2a,0xffe08a,0xff8a3a][i%4]));m.position.set(x,ply.y+R(0.4,1.8),z);m.v=new THREE.Vector3(R(-1,1),R(1.5,4),R(-1,1));m.life=m.max=R(0.4,0.8);m.s0=R(0.6,1.3);m.grav=-2;scene.add(m);parts.push(m);}}
const bolts=[];const boltMat=new THREE.LineBasicMaterial({color:0xe6d6ff,transparent:true});
function boltFX(x,y,z,dir,L,c1=0xf4ecff,c2=0xb48cff,pal){for(let b=0;b<3;b++){const pts=[];const n=10;for(let i=0;i<=n;i++){const t=i/n;const off=i===0||i===n?0:R(-0.35,0.35)*(b?1.4:1);
    pts.push(new THREE.Vector3(x+Math.sin(dir)*L*t+Math.cos(dir)*off,y+R(-0.25,0.25)*(i&&i<n?1:0)+(b?R(-0.2,0.3):0),z+Math.cos(dir)*L*t-Math.sin(dir)*off));}
  const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),boltMat.clone());ln.material.color.setHex(b?c2:c1);scene.add(ln);bolts.push({ln,t:0});}
  burst(x+Math.sin(dir)*L*0.6,y,z+Math.cos(dir)*L*0.6,pal||SKIN_PAL.skin_thunder,8,3);}
function windBeam(){const g=new THREE.Group();const c=mk(new THREE.CylinderGeometry(0.05,0.05,1.5,6),basic(0xeafff2),0,0,0.8);c.rotation.x=Math.PI/2;g.add(c);
  const o=mk(new THREE.CylinderGeometry(0.13,0.02,1.9,8),basic(0x8fffc0,{transparent:true,opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending}),0,0,0.95);o.rotation.x=Math.PI/2;g.add(o);g.userData.wind=true;return g;}
// ===== 果凍王武器外觀的特效 =====
const crysMat=basic(0xbff2ff,{transparent:true,opacity:0.6,depthWrite:false}),shardG2=new THREE.OctahedronGeometry(0.14);
function crystalBurst(x,y,z,n=10,spd=5){for(let i=0;i<n;i++){const p=new THREE.Mesh(shardG2,crysMat);p.position.set(x,y,z);p.v=new THREE.Vector3(R(-1,1)*spd,R(0.4,1.3)*spd,R(-1,1)*spd);p.life=p.max=R(0.5,0.9);p.s0=R(0.8,1.6);p.grav=12;scene.add(p);parts.push(p);}}
function flameUp(x,y,z,cols,n=6,sp=0.45){for(let i=0;i<n;i++)burst(x+R(-sp,sp),y+R(0,0.4),z+R(-sp,sp),cols,1,0.5,partG,R(0.35,0.7),-R(4,8));}
const SHADOW_FIRE=[0x0e1460,0x1a2aa0,0x2a48ff,0x6a8aff];
const meteors=[];
function spawnMeteor(x,z){const gy=ply.cave?0:H(x,z);const m=new THREE.Group();m.add(mk(new THREE.SphereGeometry(0.11,10,8),basic(0xffffff)));m.add(mk(new THREE.SphereGeometry(0.26,10,8),basic(0xfff6d8,{transparent:true,opacity:0.35,depthWrite:false})));
  const sx=R(-1.5,1.5),sz=R(-1.5,1.5);m.position.set(x+sx,gy+5.5,z+sz);scene.add(m);meteors.push({m,x,z,gy,vx:-sx/0.55,vz:-sz/0.55,vy:-5.5/0.55,t:0});}
function cometRain(n){for(let i=0;i<n;i++){const a=R(0,Math.PI*2),d=R(2.2,4.5);setTimeout(()=>spawnMeteor(ply.x+Math.cos(a)*d,ply.z+Math.sin(a)*d),i*90);}}
function skinHitFX(kind,x,y,z){if(kind==='eye'){crystalBurst(x,y,z,9,4);burst(x,y,z,SKIN_PAL.skin_eye,12,4);ring(x,(ply.cave?0:H(x,z))+0.15,z,0x9ff4ff,0.3,1.8,0.35);}
  else if(kind==='star'){burst(x,y,z,SKIN_PAL.skin_star,18,5);ring(x,(ply.cave?0:H(x,z))+0.15,z,0x6a9aff,0.3,2.0,0.4);ring(x,y,z,0xbfe0ff,0.2,1.2,0.3);}}
function updateFX2(dt){for(let i=meteors.length-1;i>=0;i--){const f=meteors[i];f.t+=dt;f.m.position.x+=f.vx*dt;f.m.position.y+=f.vy*dt;f.m.position.z+=f.vz*dt;if(Math.random()<dt*50)burst(f.m.position.x,f.m.position.y,f.m.position.z,[0xffffff,0xfff3c0,0xffd36e],1,0.4,partG,0.35,0);
    if(f.m.position.y<=f.gy+0.1){scene.remove(f.m);meteors.splice(i,1);ring(f.x,f.gy+0.1,f.z,0xffffff,0.2,1.1,0.35);burst(f.x,f.gy+0.3,f.z,[0xffffff,0xffd36e,0xfff3c0],8,3);}}
  for(let i=bolts.length-1;i>=0;i--){const b=bolts[i];b.t+=dt;b.ln.material.opacity=1-b.t/0.28;if(b.t>0.28){scene.remove(b.ln);b.ln.geometry.dispose();b.ln.material.dispose();bolts.splice(i,1);}}}
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
function grantXP(n){ply.xp+=n;let up=false;while(ply.xp>=xpNeed(ply.lv)){ply.xp-=xpNeed(ply.lv);ply.lv++;ply.sp++;ply.max=maxHP();ply.hp=ply.max;up=true;}
  if(up)levelUpFX();updateHUD();}

// ---------- 投射物 ----------
const projs=[];
const arrowGeo=(()=>{const g=mergeGeos([[new THREE.CylinderGeometry(0.03,0.03,0.8,5),M4(0,0,0,Math.PI/2)],[new THREE.ConeGeometry(0.07,0.18,5),M4(0,0,0.48,Math.PI/2)],[new THREE.BoxGeometry(0.14,0.02,0.16),M4(0,0,-0.35)]]);return g;})();
const _wt=new THREE.Vector3();function weaponTip(){const M=P.T[wpnModel()]||P.T[ply.weapon];const t=M.userData.gem||(ply.weapon==='staff'?P.T.staff.userData.gem:M);t.getWorldPosition(_wt);return{x:_wt.x,y:_wt.y,z:_wt.z};}
function fireArrow(dir,dmg,crit){const o=weaponTip();const wind=skinOf('bow')==='skin_wind';const m=wind?windBeam():mk(arrowGeo,toon(0xfff0d8));m.position.set(o.x,o.y,o.z);m.rotation.y=dir;scene.add(m);
  projs.push({kind:'arrow',m,x:o.x+Math.sin(dir)*0.3,hy:o.y-H(o.x,o.z),z:o.z+Math.cos(dir)*0.3,vx:Math.sin(dir)*28,vz:Math.cos(dir)*28,life:0.9,dmg,crit,wpn:1,hit:new Set(),homing:TL('bow',3)});}
function fireOrb(dir,dmg,big){const ice=skinOf('staff')==='skin_ice';const m=new THREE.Group();if(ice){for(let i=0;i<5;i++){const c=mk(new THREE.OctahedronGeometry(0.2),basic(i%2?0xbfe6ff:0xf0faff),Math.cos(i*1.26)*0.12,Math.sin(i*2.1)*0.1,Math.sin(i*1.26)*0.12);c.scale.y=1.9;c.rotation.set(i,i*2,i*0.5);m.add(c);}m.add(mk(new THREE.SphereGeometry(0.45,12,8),basic(0xd8f2ff,{transparent:true,opacity:0.3,depthWrite:false})));m.userData.ice=true;}
  else{m.add(mk(new THREE.SphereGeometry(0.28,14,10),basic(0xff9ed6)));m.add(mk(new THREE.SphereGeometry(0.45,14,10),basic(0xffd6f0,{transparent:true,opacity:0.4,depthWrite:false})));}
  const o=weaponTip();m.position.set(o.x,o.y,o.z);scene.add(m);
  const t=nearestMonster(14);let vx=Math.sin(dir)*14,vz=Math.cos(dir)*14;
  if(big)m.scale.setScalar(1.6);projs.push({kind:'orb',m,x:m.position.x,hy:o.y-(ply.cave||ply.indoor?0:H(o.x,o.z)),z:m.position.z,vx,vz,life:1.2,dmg,wpn:1,hit:new Set(),target:t,big:!!big});}
function fireWave(dmg){const m=new THREE.Mesh(trailGeo.arc,basic(0xfff0d0,{transparent:true,opacity:0.8,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  m.position.set(ply.x,ply.y+0.75,ply.z);m.rotation.y=ply.face;scene.add(m);projs.push({kind:'wave',m,x:ply.x,y:ply.y+0.75,z:ply.z,vx:Math.sin(ply.face)*16,vz:Math.cos(ply.face)*16,life:0.55,dmg,wpn:1,hit:new Set()});}
function fireStar(x,z,target,dmg){const m=mk(new THREE.OctahedronGeometry(0.16),basic(0xfff07a),x,H(x,z)+1,z);scene.add(m);
  const a=R(0,6.28);projs.push({kind:'star',m,x,y:H(x,z)+1,z,vx:Math.cos(a)*7,vz:Math.sin(a)*7,life:1.4,dmg,hit:new Set(),target,homing:true});}
function explode(x,z,dmg,big){const rad=2.4*(TL('staff',2)?1.5:1)*(1+0.2*TV('m_blast'))*(big?1.35:1);const gy=ply.cave?0:H(x,z);const ice=skinOf('staff')==='skin_ice';ring(x,gy+0.15,z,ice?0x8fd0ff:0xff9ed6,0.3,rad,0.4);ring(x,gy+0.2,z,0xffffff,0.2,rad*0.7,0.3);
  burst(x,gy+0.6,z,ice?SKIN_PAL.skin_ice:[0xff9ed6,0xffd6f0,0xffffff,0xfff07a],ice?24:18,6);SFX.boom();hitStop=Math.max(hitStop,0.05);
  for(const m of monsters){if(m.dead>=0)continue;const d=Math.hypot(m.x-x,m.z-z);if(d<rad)damageMonster(m,dmg,(m.x-x)/(d||1),(m.z-z)/(d||1),true,TV('m_frost')?{src:'wpn',slow:1+TV('m_frost'),slowF:TV('m_frost')>1?0.4:0.6}:W);}
  if(TL('staff',3))for(let i=0;i<3;i++)fireStar(x,z,null,Math.max(1,Math.round(dmg*0.5)));}

// ---------- 家具擺放／布置 ----------
let decoMode=false,carry=null,ghost=null,ghostOK=false,fpMode=false,fpPitch=0.3,fpHit=null;
const ghostOkM=basic(0x8fdcb4,{transparent:true,opacity:.5,depthWrite:false}),ghostNoM=basic(0xff6f6f,{transparent:true,opacity:.45,depthWrite:false});
function startCarry(id,orig){if(ghost)scene.remove(ghost);carry={id,orig,ry:orig?orig.ry:Math.round(ply.face/(Math.PI/2))*(Math.PI/2)};
  ghost=buildFurn(id);ghost.traverse(o=>{if(o.isMesh)o.material=ghostOkM;});scene.add(ghost);document.body.classList.add('carrying');renderHotbar();}
function endCarry(){$('rotSl').classList.remove('on');if(ghost)scene.remove(ghost);ghost=null;carry=null;document.body.classList.remove('carrying');renderHotbar();}
function ghostSpot(){if(fpMode&&fpHit){let x=Math.round(fpHit.x*2)/2,z=Math.round(fpHit.z*2)/2;return[x,z];}
  const d=1.3+(carry?ITEMS[carry.id].r*fsOf(carry.id):0.8);let x=ply.x+Math.sin(ply.face)*d,z=ply.z+Math.cos(ply.face)*d;x=Math.round(x*2)/2;z=Math.round(z*2)/2;return[x,z];}
const rotDeg=()=>Math.round(((carry.ry*180/Math.PI)%360+360)%360)%360;
function carryRotate(step){if(!carry)return;if(typeof step==='number'){carry.ry+=step*Math.PI/180;syncRotSl();SFX.click();return;}const sl=$('rotSl');sl.classList.toggle('on');syncRotSl();SFX.click();}
function syncRotSl(){if(!carry)return;$('rotIn').value=rotDeg();$('rotVal').textContent=rotDeg()+'°';}
$('rotIn').addEventListener('input',e=>{if(!carry)return;carry.ry=(+e.target.value)*Math.PI/180;$('rotVal').textContent=e.target.value+'°';});
['pointerdown','touchstart'].forEach(ev=>$('rotSl').addEventListener(ev,e=>e.stopPropagation()));
function carryPlace(){if(!carry)return;const[x,z]=ghostSpot();if(!ghostOK){SFX.deny();toast('這裡放不下喔');return;}
  const y=supportY(x,z);const p=placeFurn(carry.id,x,z,carry.ry,true,y);if(!carry.orig){inv[carry.id]--;}SFX.place();burst(x,y+0.5,z,PAST.map(c=>parseInt(c.slice(1),16)),10,3);
  const id=carry.id,fromInv=!carry.orig;endCarry();if(fromInv&&inv[id]>0)startCarry(id,null);if(id==='bench')toast('工作台放好了！靠近它可以做進階道具 🔨');save();}
function carryStore(){if(!carry)return;addItem(carry.id,carry.orig?1:0);SFX.pickup(3);toast(`收進背包：${ITEMS[carry.id].n}`);endCarry();save();}
function carryCancel(){if(!carry)return;if(carry.orig){const o=carry.orig;placeFurn(carry.id,o.x,o.z,o.ry,false,o.y);}endCarry();}

// ---------- 輸入 ----------
const keys={};let holdAtk=false,holdAct=false;
// ---------- 快捷鍵設定 ----------
const KB_DEF={up:'KeyW',down:'KeyS',left:'KeyA',right:'KeyD',run:'ShiftLeft',jump:'Space',atk:'KeyJ',act:'KeyE',sk1:'KeyK',sk2:'KeyL',bag:'KeyB',craft:'KeyC',tal:'KeyT',chat:'KeyQ',fp:'KeyV',del:'KeyX',rot:'KeyR'};
const KB_NAME={up:'往前走',down:'往後走',left:'往左走',right:'往右走',run:'奔跑（按住）',jump:'跳躍',atk:'攻擊',act:'互動',sk1:'技能 1',sk2:'技能 2',bag:'背包',craft:'合成',tal:'天賦',chat:'表情／聊天',fp:'第一人稱',del:'拆方塊',rot:'旋轉家具'};
let KB=Object.assign({},KB_DEF);try{const k=JSON.parse(localStorage.getItem('lobster-keys')||'{}');for(const a in KB_DEF)if(typeof k[a]==='string')KB[a]=k[a];}catch(e){}
let kbWait=null;
const kIs=(e,a)=>e.code===KB[a]||(a==='act'&&e.code==='KeyF'&&!Object.values(KB).includes('KeyF'))||(a==='run'&&KB.run==='ShiftLeft'&&e.code==='ShiftRight');
const kDown=a=>!!keys[KB[a]]||(a==='run'&&KB.run==='ShiftLeft'&&!!keys.ShiftRight);
// 跑步模式：hold＝長按、toggle＝按一下開始跑，停下來才結束
let runMode='hold',runLatch=false,plyRun=false,runWasMv=false;try{runMode=localStorage.getItem('lobster-run')==='toggle'?'toggle':'hold';}catch(e){}
addEventListener('keydown',e=>{if(e.target.tagName!=='INPUT'&&!kbWait&&!e.repeat&&runMode==='toggle'&&kIs(e,'run')&&started&&!paused)runLatch=!runLatch;});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||kbWait)return;if(e.repeat&&(kIs(e,'atk')||kIs(e,'act')))return;keys[e.code]=true;
  const act=kIs(e,'act');
  if(e.code==='Enter'&&started&&!paused&&!dlg&&!ply.sleeping&&typeof openSocial==='function'){e.preventDefault();openSocial(true);return;}
  if(kIs(e,'bag')&&$('bag').classList.contains('show')){closePanel('bag');return;}
  if(e.code==='Escape'){if(typeof closeSocial==='function'&&$('social').classList.contains('show'))closeSocial();closeAllPanels();if(dlg)endTalk();if(carry)carryCancel();return;}
  if(dlg&&(act||kIs(e,'jump')||e.code==='Space')){$('dlg').click();e.preventDefault();return;}
  if(ply.sleeping&&(act||kIs(e,'jump'))){wakeUp();return;}
  if(paused)return;
  if(kIs(e,'jump')){jump();e.preventDefault();}
  if(kIs(e,'atk')){holdAtk=true;attack();}
  if(act){holdAct=true;doAction();}
  if(kIs(e,'rot'))carryRotate(e.shiftKey?-15:15);
  if(kIs(e,'craft'))openCraft();
  if(kIs(e,'tal'))openTalents();
  if(/^Digit[0-9]$/.test(e.code)){const d=+e.code.slice(5);useHb(d===0?9:d-1);}
  if(kIs(e,'bag'))openBag();});
addEventListener('keyup',e=>{keys[e.code]=false;if(kIs(e,'atk'))holdAtk=false;if(kIs(e,'act'))holdAct=false;});
let camYaw=0,camPitch=0.42,camDist=10,previewYaw=0;
const joy={id:null,ox:0,oy:0,x:0,y:0},look2={id:null,lx:0,ly:0,sx:0,sy:0,t:0,mouse:false};
const cv=$('c');
cv.addEventListener('pointerdown',e=>{initAudio();
  if(e.pointerType!=='mouse'&&e.clientX<innerWidth*0.5&&joy.id===null&&!ply.sleeping&&!creatorOpen){joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;joy.x=joy.y=0;joy.t0=performance.now();
    const b=$('joyBase');b.style.display='block';b.style.left=e.clientX+'px';b.style.top=e.clientY+'px';$('joyKnob').style.transform='';}
  else if(look2.id===null){look2.id=e.pointerId;look2.lx=look2.sx=e.clientX;look2.ly=look2.sy=e.clientY;look2.t=performance.now();look2.mouse=e.pointerType==='mouse';}
  try{cv.setPointerCapture(e.pointerId);}catch(_){}});
cv.addEventListener('pointermove',e=>{
  if(e.pointerId===joy.id){let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const d=Math.hypot(dx,dy),mx=52;if(d>mx){dx*=mx/d;dy*=mx/d;}joy.x=dx/mx;joy.y=dy/mx;$('joyKnob').style.transform=`translate(${dx}px,${dy}px)`;}
  else if(e.pointerId===look2.id&&creatorOpen){previewYaw+=(e.clientX-look2.lx)*0.012;look2.lx=e.clientX;}
  else if(e.pointerId===look2.id){camYaw-=(e.clientX-look2.lx)*0.006;if(fpMode)fpPitch=clamp(fpPitch+(e.clientY-look2.ly)*0.004,-1.2,1.35);else camPitch=clamp(camPitch+(e.clientY-look2.ly)*0.004,0.12,1.2);look2.lx=e.clientX;look2.ly=e.clientY;}});
function endPtr(e){if(e.pointerId===joy.id){const tap=performance.now()-joy.t0<260&&Math.hypot(joy.x,joy.y)<0.2;joy.id=null;joy.x=joy.y=0;$('joyBase').style.display='none';if(tap&&!paused&&!creatorOpen&&started)tapAct();}
  if(e.pointerId===look2.id&&!look2.mouse&&!paused&&!creatorOpen&&started&&Math.hypot(e.clientX-look2.sx,e.clientY-look2.sy)<10&&performance.now()-look2.t<260)tapAct();
  if(e.pointerId===look2.id){if(look2.mouse&&!paused&&!creatorOpen&&Math.hypot(e.clientX-look2.sx,e.clientY-look2.sy)<6&&performance.now()-look2.t<300){if(fpMode)doAction();else attack();}look2.id=null;}}
cv.addEventListener('pointerup',endPtr);cv.addEventListener('pointercancel',endPtr);
let wheelAcc=0,wheelT=0;
cv.addEventListener('wheel',e=>{e.preventDefault();const d=e.deltaY||e.deltaX;
  if(e.shiftKey){camDist=clamp(camDist+d*0.01,5,18);return;}
  if(!started||paused||creatorOpen)return;wheelAcc+=d;const now=performance.now();
  if(Math.abs(wheelAcc)>=40&&now-wheelT>90){cycleSlot(wheelAcc>0?1:-1);wheelAcc=0;wheelT=now;}},{passive:false});
function jump(){if(ply.downed||ply.reviving)return;if(ply.ground&&ply.atkT<0&&!ply.sleeping&&!ply.sitting){ply.vy=8.5;ply.ground=false;SFX.jump();P.sqv+=4.5;puff(ply.x,ply.y,ply.z);}}

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
  if(ply.sleeping||ply.downed||ply.reviving)return'none';
  {const dn=nearestDowned();if(dn)return'revive';}
  if(nearestChest())return'chest';
  if(ply.riding)return'getoff';
  if(ply.sitting)return'stand';
  if(carry)return'place';
  if(isBlk(ply.held)){const t=buildTarget();return t&&t.ok?'build':'none';}
  if(decoMode&&nearestFurn(null,1.3))return'move';
  const fr=nearestUse(1.3);
  if(!decoMode&&!ply.cave){const dr=nearestFurn('door',2.0);if(dr)return'door';}
  if(ply.fishing)return ply.fishing.phase==='bite'?'reel':'wait';
  if(ply.cave){if(nearestOre())return'ore';return'none';}
  if(Math.hypot(ply.x-BOARD.x,ply.z-BOARD.z)<3.3)return'board';
  {let b=null,bd=2.2;for(const g of GACHAS){const d=Math.hypot(ply.x-g.front.x,ply.z-g.front.z);if(d<bd){bd=d;b=g;}}if(b)return b.kind==='hat'?'fgacha':'gacha';}
  if(Math.hypot(ply.x-PARKV.ferris.board.x,ply.z-PARKV.ferris.board.z)<2.6)return'ferris';
  if(Math.hypot(ply.x-PARKV.coaster.board.x,ply.z-PARKV.coaster.board.z)<3)return'coaster';
  {const K=PARKV.carousel;const d=Math.hypot(ply.x-K.x,ply.z-K.z);if(d<K.r+1.9&&d>K.r-0.5)return'carousel';}
  {const T=PARKV.teacups;const d=Math.hypot(ply.x-T.x,ply.z-T.z);if(d<T.R+1.9&&d>T.R-0.5)return'teacup';}
  if(nearestNpc())return'talk';
  {const r=nearestRemote();if(r)return'player';}
  {const pt=nearestPet(1.8);if(pt&&!pt.follow){if(pt.aff>=100)return'petmenu';if(hasFoodFor(pt))return'feed';}}

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
const CTX={teacup:['☕','搭咖啡杯'],player:['🤝','玩家'],petmenu:['🐾','寵物'],door:['🚪','開／關門'],getoff:['🚶','下來'],revive:['💖','救助'],chest:['🎁','打開寶箱'],pinvite:['🤝','邀請組隊'],deeper:['🕳️','往下一層'],ore:['💎','採水晶'],build:['🧱','蓋方塊'],unblock:['🔨','拆方塊'],gacha:['🥚','轉蛋'],fgacha:['🎀','時裝轉蛋'],ferris:['🎡','搭摩天輪'],coaster:['🎢','搭雲霄飛車'],carousel:['🎠','騎木馬'],place:['✨','放置'],move:['🫳','搬動'],stand:['🧍','起來'],board:['📋','告示板'],talk:['💬','對話'],enter:['🚪','進屋'],exit:['🚪','出門'],sleep:['🛏️','躺下'],sit:['🪑','坐下'],bath:['🛁','泡澡'],
  catch:['🥅','捕捉'],harvest:['🧺','收成'],till:['🟫','翻土'],water:['💧','澆水'],plant:['🌱','播種'],bench:['🧰','合成'],cave:['⛰️','進入洞窟'],leave:['🌤️','離開洞窟'],fish:['🎣','釣魚'],wait:['🎣','收竿'],reel:['❗','拉竿！'],feed:['🍎','餵食'],invite:['💕','邀請'],pat:['🤲','摸摸'],untill:['🟩','剷平'],weed:['🌿','拔草'],tree:['🪓','砍樹'],rock:['⛏️','挖礦'],none:['🤚','互動']};
const ACT_DUR={pull:0.4,chop:0.42,mine:0.38,till:0.45,water:0.7,plant:0.45,catch:0.45,harvest:0.5};
const ACT_HIT={pull:0.5,chop:0.6,mine:0.6,till:0.62,water:0.5,plant:0.55,catch:0.55,harvest:0.5};
function faceTo(x,z){ply.face=Math.atan2(x-ply.x,z-ply.z);}
const EN_COST={pull:0.6,chop:1.2,mine:1.2,till:1,water:0.4,plant:0.3,catch:0.5,harvest:0.4};
function useEn(v){ply.en=Math.max(0,ply.en-v*(1-vitEn()));}
function tiredBlock(){if(ply.en>0)return false;SFX.deny();P.sqv-=3;const n=performance.now();if(!ply.tiredT||n-ply.tiredT>2500){ply.tiredT=n;toast('😵 精神用光了，沒力氣採集…去睡覺或吃點東西吧');}return true;}
function startAct(a,target,tool){if(tiredBlock())return;useEn(EN_COST[a]||0.3);ply.act=a;ply.actT=0;ply.hit=0;ply.target=target;toolShow=tool||null;refreshHeld();}
function doAction(){
  if(ply.act||ply.atkT>=0||ply.sleeping)return;
  const c=context();
  switch(c){
    case'place':carryPlace();break;
    case'door':{const p=nearestFurn('door',2.0);if(p){p.open=!p.open;p.o.r=p.open?0:p.o.r0;SFX.door();P.sqv+=2;}break;}
    case'move':{const p=nearestFurn(null,1.3);const orig={x:p.x,z:p.z,ry:p.ry,y:p.y};removeFurn(p);SFX.pickup(2);startCarry(p.id,orig);break;}
    case'stand':standUp();break;
    case'board':renderBoard();openPanel('board');break;
    case'talk':{const n=nearestNpc();faceTo(n.x,n.z);talkTo(n);break;}
    case'bench':openCraft();break;
    case'getoff':getOff();break;
    case'revive':startRevive(nearestDowned());break;
    case'chest':openChest(nearestChest());break;
    case'pinvite':sendInvite(nearestRemote().nid);break;
    case'player':openPlayerChoice(nearestRemote());break;
    case'build':placeBlock();break;
    case'unblock':removeBlock();break;
    case'gacha':openGacha('pet');break;
    case'fgacha':openGacha('hat');break;
    case'ferris':rideFerris();break;
    case'coaster':rideCoaster();break;
    case'carousel':rideCarousel();break;
    case'teacup':rideTeacup();break;
    case'sleep':{const b=nearestUse(1.3);lieDown(b);break;}
    case'sit':case'bath':sitOn(nearestUse(1.3),c);break;
    case'catch':{const b=nearestBug(2.8);faceTo(b.x,b.z);startAct('catch',b,'net');SFX.net();break;}
    case'harvest':{const t=ripeTile();faceTo(t.x,t.z);startAct('harvest',t);break;}
    case'till':{const[gx,gz]=frontGrid();startAct('till',{gx,gz},'hoe');break;}
    case'untill':{const[gx,gz]=frontGrid();startAct('till',{gx,gz,untill:true},'hoe');break;}
    case'cave':enterCave();break;
    case'leave':leaveCave();break;
    case'deeper':goDeeper();break;
    case'ore':{const o=nearestOre();faceTo(o.x,o.z);if(tiredBlock())break;startAct('mine',o,has('pick2')?'pick2':has('pick1')?'pick1':'stick');break;}
    case'fish':startFishing();break;
    case'wait':endFishing('收竿了');break;
    case'reel':catchFish();break;
    case'feed':case'invite':petAction(nearestPet(1.8),c);break;
    case'petmenu':openPetChoice(nearestPet(1.8));break;
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
    spawnDrops('xp',t.x,H(t.x,t.z)+0.5,t.z,1,2);if(!ply.hintWeed&&(inv.weed||0)>=10){ply.hintWeed=1;toast('雜草夠 10 株了！拿去告示板回收換獎勵 📋');}weedTimers.push(25);}
  else if(ply.act==='chop'){if(t.state!=='alive')return;t.hp-=chopPow();t.shake=1;SFX.chop();hitStop=0.035;
    const hx=t.x-Math.sin(ply.face)*0.45,hz=t.z-Math.cos(ply.face)*0.45;
    burst(hx,H(t.x,t.z)+1,hz,0xf3d3b8,5,3.5,cubeG);burst(t.x,H(t.x,t.z)+2.8*t.s,t.z,t.kind==='cherry'?[0xffb6cf,0xffe0ec]:t.kind.startsWith('pine')?[0x3e8c64,0x8fd0a8]:[0x79c45a,0xb8e89a],6,2.5);
    if(TL('wood',2)){burst(hx,H(t.x,t.z)+1.2,hz,[0xff9ed6,0xfff07a,0xffffff],8,4);ring(t.x,H(t.x,t.z)+0.1,t.z,0xff9ed6,0.3,1.6,0.3);}
    if(t.hp<=0){t.state='falling';t.t=0;t.yawG.rotation.y=ply.face;SFX.fall();}}
  else if(ply.act==='mine'&&t.ore){mineOre(t);}
  else if(ply.act==='mine'){if(t.state!=='alive')return;const pw=minePow();
    if(pw===0){SFX.thud();t.shake=0.5;if(!ply.hintRock||performance.now()-ply.hintRock>4000){ply.hintRock=performance.now();toast('好硬！需要 ⛏️ 鎬子才挖得動');}return;}
    t.hp-=pw;t.shake=1;SFX.mine();hitStop=0.035;burst(t.x,H(t.x,t.z)+0.6,t.z,[0xdcd3ec,0xffffff],6,3.5,cubeG);
    if(TL('mine',2))burst(t.x,H(t.x,t.z)+0.9,t.z,[0xff9ed6,0xfff07a],8,4);
    if(t.hp<=0){t.state='gone';t.t=0;t.m.visible=false;t.o.r=0;SFX.rock();burst(t.x,H(t.x,t.z)+0.5,t.z,[0xdcd3ec,0xc3b0ff,0xffffff],16,5,cubeG);
      spawnDrops('stone',t.x,H(t.x,t.z)+0.6,t.z,1+Math.round(t.s*1.5));if(TV('a_transmute')&&Math.random()<0.1*TV('a_transmute')){spawnDrops('coin',t.x,H(t.x,t.z)+0.8,t.z,5*TV('a_transmute'),1);toast('🪨✨ 點石成金！');}if(Math.random()<(TL('mine',3)?0.3:0.04))spawnDrops('gem',t.x,H(t.x,t.z)+0.8,t.z,1);
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
function enterCave(){SFX.door();if(carry)carryCancel();setCaveLv(1);quickFade(()=>{ply.cave=true;ply.x=CAVE_EXIT.x;ply.z=CAVE_EXIT.z-3.2;ply.y=0;ply.vy=0;ply.face=Math.PI;camYaw=0;snapCam=true;toast('⛰️ 果凍怪洞窟…小心兇猛的果凍怪！');});}
function leaveCave(){SFX.door();quickFade(()=>{ply.cave=false;ply.x=CAVE_FRONT.x+Math.sin(CAVE_FRONT.ry)*3.4;ply.z=CAVE_FRONT.z+Math.cos(CAVE_FRONT.ry)*3.4;ply.y=H(ply.x,ply.z);ply.vy=0;ply.face=CAVE_FRONT.ry;camYaw=CAVE_FRONT.ry+Math.PI;snapCam=true;});}
let zzT=0;
function lieDown(p){if(fpMode)setFP(false);ply.sleeping={p};setTimeout(refreshHeld,0);ply.act=null;ply.atkT=-1;holdAtk=holdAct=false;document.body.classList.add('sleeping');SFX.lie();P.setFace('sleep');
  if(joy.id!==null){joy.id=null;joy.x=joy.y=0;$('joyBase').style.display='none';}toast('躺下了…時間 ×5 流動 💤');}
function wakeUp(){if(!ply.sleeping)return;const p=ply.sleeping.p;ply.sleeping=null;setTimeout(refreshHeld,0);document.body.classList.remove('sleeping');
  ply.x=p.x+Math.sin(p.ry+Math.PI/2)*2.2;ply.z=p.z+Math.cos(p.ry+Math.PI/2)*2.2;if(inHouse(p.x,p.z)){ply.x=clamp(ply.x,HOME.x-HOME.w+0.7,HOME.x+HOME.w-0.7);ply.z=clamp(ply.z,HOME.z-HOME.d+0.7,HOME.z+HOME.d-0.7);}
  ply.y=furnBase(p);P.m.rotation.set(0,0,0);P.m.position.set(0,0,0);P.setFace('open');SFX.wake();P.sqv+=5;
  toast(ply.en>=95?'睡飽飽！精神滿滿 ☀️':`起床了！精神 ${Math.round(ply.en)}%`);save();}
function fade(text,mid,after){const f=$('fade');paused=true;f.textContent=text;f.style.opacity=1;f.style.pointerEvents='auto';
  setTimeout(()=>{mid();setTimeout(()=>{f.style.opacity=0;f.style.pointerEvents='none';paused=false;after&&after();},1400);},900);}
function faint(reason){if(ply.downed)clearDown();ply.reviving=null;const lost=Math.floor(ply.coins*0.3);SFX.hurt();if(ply.fishing)endFishing();if(ply.sleeping)wakeUp();ply.sitting=null;if(carry)carryCancel();
  fade(reason,()=>{if(hour()>=8)day++;tmin=8*60;ply.coins-=lost;ply.hp=Math.ceil(ply.max*0.6);ply.en=60;
    ply.riding=null;ply.indoor=false;ply.cave=false;ply.x=HOME.x;ply.z=HOME.z+1;ply.y=0.02;ply.vy=0;ply.kx=ply.kz=0;ply.face=0;camYaw=Math.PI/2;snapCam=true;
    for(const m of monsters)scene.remove(m.g);monsters.length=0;warnLv=0;updateHUD();save();},()=>toast(lost?`在家裡醒來…掉了 🪙${lost}`:'在家裡醒來…'));}

// ---------- 戰鬥 ----------
function attack(){if(ply.downed||ply.reviving||ply.cast||ply.chan||ply.leap)return;if(paused||ply.act||ply.sleeping||ply.sitting||ply.riding||carry||isBlk(ply.held))return;if(ply.cool>0)return;
  if(ply.atkT>=0){if(ply.atkT>ply.atkDur*0.35)ply.queued=true;return;}startAttack();}
function lockOn(range=9){const t=nearestMonster(range);if(t)faceTo(t.x,t.z);return t;}
const LOCKR={bow:16,staff:14,orb:14,book:14,lute:6,greatsword:6,shield:6,dagger:8};
function shortDash(t,keep,maxL,dur=0.12){if(!t)return;const d=Math.hypot(t.x-ply.x,t.z-ply.z);if(d>keep+0.4){const L=Math.min(d-keep,maxL);ply.dashT=dur;ply.dvx=(t.x-ply.x)/d*L/dur;ply.dvz=(t.z-ply.z)/d*L/dur;puff(ply.x,ply.y,ply.z);}}
function startAttack(){startAttack0();const f=1/(1+agiSpd());if(ply.atkT===0){ply.atkDur*=f;ply.hitAt*=f;}}
// 所有武器都是三段攻擊：第三段是終結技
function startAttack0(){ply.enPaid=false;
  const w=ply.weapon;const now=performance.now();ply.first=now-(ply.lastAtk||0)>4000;ply.lastAtk=now;ply.atkT=0;ply.hitDone=false;ply.queued=false;toolShow=null;if(ply.held){ply.held=null;renderHotbar();}refreshHeld();
  ply.combo=(ply.comboT>0&&ply.combo<3)?ply.combo+1:1;const c=ply.combo;const st=(ATK3[w]||ATK3.sword)[c-1];const asp=['bow','spear','sword','stick'].includes(w)?aspd(w):1;
  ply.atkDur=st.d*asp;ply.hitAt=st.d*st.h*asp;
  if(w==='bow'){lockOn(16);if(c===3)SFX.pull();return;}
  if(w==='staff'||w==='orb'||w==='book'){lockOn(14);ring(ply.x,ply.y+0.06,ply.z,w==='staff'?0xff9ed6:w==='orb'?0xc8b4ff:0xffe08a,1.0,c===3?2.2:1.6,0.45);if(c===3)SFX.cast();else SFX.magic();return;}
  if(w==='lute'){lockOn(6);SFX.strum();return;}
  if(w==='greatsword'){shortDash(lockOn(6),2.4,2.5,0.16);SFX.swing(c===3?3:2);return;}
  if(w==='shield'){shortDash(lockOn(6),1.7,c===3?4:3,0.14);SFX.thrust();return;}
  if(w==='dagger'){shortDash(lockOn(8),1.3,4.5,0.1);SFX.swing(c);return;}
  if(w==='spear'){const t=lockOn(10);if(t){const d=Math.hypot(t.x-ply.x,t.z-ply.z);const L=Math.min(Math.max(0,d-2.8),TL('spear',3)?11:(c===3?7:5.5));if(L>0.3){const dd=c===3?0.18:0.14;ply.dashT=dd;ply.dvx=(t.x-ply.x)/d*L/dd;ply.dvz=(t.z-ply.z)/d*L/dd;if(TL('spear',3))ply.ifr=0.4;}}SFX.thrust();return;}
  const t=lockOn(9);if(t){const d=Math.hypot(t.x-ply.x,t.z-ply.z);if(d>2.0){const L=Math.min(d-1.6,6.5);ply.dashT=0.13;ply.dvx=(t.x-ply.x)/d*L/0.13;ply.dvz=(t.z-ply.z)/d*L/0.13;puff(ply.x,ply.y,ply.z);}}
  SFX.swing(c);
}
const W={src:'wpn'};const _barQ=new THREE.Quaternion();
function damageMonster(m,dmg,nx,nz,crit,opt){if(m.dead>=0||m.ifr>0)return;
  const o2=opt&&typeof opt==='object'?opt:null;if(o2&&o2.src==='wpn'){if(!ply.enPaid){ply.enPaid=true;useEn(0.7*enMul());}const r=preHit(m,dmg);dmg=r[0];if(r[1])crit=true;}if(o2&&Math.random()<critRate()){dmg=rd(dmg*1.5);crit=true;}if(o2)postHit(m,dmg,o2);
  if(m.mirror){m.ifr=0.1;m.flash=1;m.shake=0.3;m.bar.visible=true;dmgNum(m.x,m.y+1.5*m.size,m.z,crit?dmg+'!':String(dmg),crit);{const pal=skinPal();burst(m.x,m.y+0.6,m.z,pal||[0xffffff,0xffd36e,0xff9ec7],crit?12:7,5);}SFX.squish();netPost({t:'hit',id:m.id,d:dmg,nx:+nx.toFixed(2),nz:+nz.toFixed(2),c:crit?1:0},true);return;}m.hp-=dmg;m.ifr=0.1;m.flash=1;m.shake=0.3;const kbm=o2&&o2.kb||1;m.kx=nx*(crit?13:8)*kbm;m.kz=nz*(crit?13:8)*kbm;m.vy=crit?7:3.5;m.sqv-=4;
  if(m.boss){m.kx*=0.08;m.kz*=0.08;m.vy=Math.min(m.vy,1);}
  m.bar.visible=true;const r=Math.max(0,m.hp/m.max);m.fg.scale.x=r||0.001;m.fg.position.x=-(1-r)/2;
  dmgNum(m.x,(m.cave?0:H(m.x,m.z))+m.y+1.5*m.size,m.z,crit?dmg+'!':String(dmg),crit);{const pal=skinPal();burst(m.x,(m.cave?0:H(m.x,m.z))+m.y+0.6,m.z,pal||[0xffffff,0xffd36e,0xff9ec7],pal?(crit?20:12):(crit?12:7),pal?6:5);}SFX.squish();
  if(m.hp<=0)killMonster(m);}
const rd=v=>Math.max(1,Math.round(v));
function frontHits(reach,cosMin,fn){const fx=Math.sin(ply.face),fz=Math.cos(ply.face);let n=0;for(const m of monsters){if(m.dead>=0)continue;const dx=m.x-ply.x,dz=m.z-ply.z,d=Math.hypot(dx,dz)||0.01;
  if(d<reach+m.size*0.3&&(dx*fx+dz*fz)/d>cosMin){n++;fn(m,dx/d,dz/d);}}return n;}
function doHit(){
  const w=ply.weapon,fx=Math.sin(ply.face),fz=Math.cos(ply.face);let hits=0;const atk=weaponAtk(),A=weaponAtk(true);const c=ply.combo||1,F=c===3?1.5:1;
  const gyF=d=>{const x=ply.x+fx*d,z=ply.z+fz*d;return[x,ply.cave?0:H(x,z),z];};
  if(w==='greatsword'){const ctr=ply.counterT>0&&TV('w_counter');const mult=(1+0.15*TV('w_heavy'))*(ctr?1.5+0.5*TV('w_counter'):1)*F;const lv=TV('w_launch');
    if(c===3){hits=frontHits(3.6,-0.35,(m,nx,nz)=>damageMonster(m,rd(A*mult),nx,nz,true,{src:'wpn',kb:1.6*(1+lv*0.5),stun:0.3+lv*0.6}));
      slash('c3',1.25);const[x3,gy,z3]=gyF(2.8);ring(x3,gy+0.1,z3,0xfff0e0,0.4,1.7,0.4);burst(x3,gy+0.3,z3,[0xffffff,0xd8e4f4,0xfff0d0],16,6);for(let i=0;i<4;i++)puff(x3+R(-0.8,0.8),gy,z3+R(-0.8,0.8),0xf6f0e6,1.3);SFX.land();P.sqv-=7;}
    else{hits=frontHits(3.5,c===2?-0.5:-0.2,(m,nx,nz)=>damageMonster(m,rd(A*mult),nx,nz,c===1,{src:'wpn',kb:1.2*(1+lv*0.5),stun:lv*0.3}));slash('arc',1.3,null,c===1?-0.5:0.2);}
    if(skinOf('greatsword')==='skin_dragon'){const sx=ply.x+fx*1.2,sz=ply.z+fz*1.2;boltFX(sx,ply.y+1.0,sz,ply.face+R(-0.25,0.25),c===3?3.4:2.6,0xffd0c0,0xff2020,[0xff3030,0xffe0a0]);if(c===3)boltFX(sx,ply.y+0.8,sz,ply.face+R(-0.5,0.5),3,0xffffff,0xd81c1c,[0xff3030]);
      const[x4,gy4,z4]=gyF(c===3?2.8:2.3);burst(x4,gy4+0.3,z4,[0x9a7a54,0x7a5a3a,0xc8a070,0x5a4030],c===3?20:12,c===3?7:5,cubeG,0.9,16);for(let i=0;i<(c===3?5:3);i++)puff(x4+R(-0.8,0.8),gy4,z4+R(-0.8,0.8),0xb89a70,1.3);}
    if(hits){SFX.hit(true);hitStop=c===3?0.13:0.08;}if(ctr){ply.counterT=0;dmgNumP('反擊！');}return;}
  if(w==='shield'){const b=TV('p_bash');const reach=c===3?3.4:3.0;hits=frontHits(reach,c===3?-0.1:0.25,(m,nx,nz)=>damageMonster(m,rd(A*(1+LK([0,0.3,0.6,1],b))*F),nx,nz,true,{src:'wpn',kb:c===2?0.8:1.5,stun:LK([0,0.5,0.8,1.2],b)+(c===2?0.4:0)}));
    for(let i=-2;i<=2;i++){const a=ply.face+i*0.38,x=ply.x+Math.sin(a)*1.9,z=ply.z+Math.cos(a)*1.9;puff(x,(ply.cave?0:H(x,z))+0.2,z,0xdcefff,1.1);}
    const[x3,gy,z3]=gyF(c===3?2.9:1.8);burst(x3,gy+0.8,z3,[0x8fc8f0,0xffffff,0xffd36e],c===3?18:10,4);if(skinOf('shield')==='skin_guard'){crystalBurst(x3,gy+0.8,z3,c===3?16:9,c===3?6:4);burst(x3,gy+0.9,z3,SKIN_PAL.skin_guard,c===3?20:12,5,partG,0.7,4);}if(c===3){ring(x3,gy+0.1,z3,0x8fc8f0,0.4,1.3,0.4);SFX.boom();}P.sqv-=4;if(hits){SFX.hit(true);hitStop=c===3?0.12:0.08;}else SFX.land();return;}
  if(w==='lute'){const r=3.2+TV('r_wave')+(c===3?1:0),mult=(1+0.2*TV('r_wave'))*F;const gy=ply.cave?0:H(ply.x,ply.z);const lull=0.15*TV('r_lull')*(c===3?2:1);
    for(const m of monsters){if(m.dead>=0)continue;const dx=m.x-ply.x,dz=m.z-ply.z,d=Math.hypot(dx,dz)||0.01;if(d<r+m.size*0.3){hits++;const sl=Math.random()<lull;damageMonster(m,rd(A*mult),dx/d,dz/d,c===3,sl?{src:'wpn',stun:1.5}:W);if(sl)spawnNotes(m.x,(m.cave?0:H(m.x,m.z))+1.6,m.z,1);}}
    const cmt=skinOf('lute')==='skin_comet';ring(ply.x,gy+0.06,ply.z,0xffd36e,1.0,r,0.45);ring(ply.x,gy+0.1,ply.z,cmt?0xfff3c0:0xff9ec7,1.0,r*0.8,0.4);if(c===3)ring(ply.x,gy+0.14,ply.z,0xffffff,1.0,r*1.1,0.55);notesRing(c===3?8:4,cmt);
    if(cmt){for(let i=0;i<(c===3?14:8);i++){const aa=R(0,Math.PI*2),d=R(1.6,r);burst(ply.x+Math.cos(aa)*d,gy+R(0.4,1.6),ply.z+Math.sin(aa)*d,[0xffd36e,0xfff3c0,0xffffff,0xffb830],2,1.2,partG,0.7,-1.5);}cometRain(c===3?6:3);}if(hits)SFX.hit(c===3);return;}
  if(w==='dagger'){const dbl=0.3+talCap(TV('r_twin'),[0,0.15,0.3,0.45],0.06);const vo=TV('r_venom');const o={src:'wpn',dot:vo?[2,rd(A*0.3*vo)]:null};
    if(c===3){for(const m of monsters){if(m.dead>=0)continue;const dx=m.x-ply.x,dz=m.z-ply.z,d=Math.hypot(dx,dz)||0.01;if(d<2.7+m.size*0.3){hits++;damageMonster(m,rd(A*F),dx/d,dz/d,true,o);}}slash('arc',0.95,null,0,-1.16);}
    else{hits=frontHits(2.4,0.1,(m,nx,nz)=>{damageMonster(m,atk,nx,nz,false,o);if(Math.random()<dbl)setTimeout(()=>{if(m.dead<0){m.ifr=0;damageMonster(m,atk,nx,nz,false,o);}},85);});slash('arc',0.85,null,c===1?-0.1:0.1);}
    if(skinOf('dagger')==='skin_shadow'){if(c===3){for(let i=0;i<10;i++){const aa=i/10*Math.PI*2,d=R(1.7,2.4),x=ply.x+Math.sin(aa)*d,z=ply.z+Math.cos(aa)*d;flameUp(x,(ply.cave?0:H(x,z))+0.3,z,SHADOW_FIRE,3,0.25);}}
      else for(let i=0;i<5;i++){const aa=ply.face+R(-0.9,0.9),d=R(1.4,2.3),x=ply.x+Math.sin(aa)*d,z=ply.z+Math.cos(aa)*d;flameUp(x,ply.y+R(0.4,0.9),z,SHADOW_FIRE,3,0.2);}
      {const[x4,gy4,z4]=gyF(1.8);burst(x4,gy4+0.9,z4,[0x8a9aff,0xffffff,0x2a3cff],8,3,partG,0.6,-2);}}
    if(hits){SFX.hit(c===3);hitStop=c===3?0.07:0.03;}return;}
  if(w==='spear'){const hp=new THREE.Vector3();P.hold.getWorldPosition(hp);
    if(c===2){hits=frontHits(3.9,-0.3,(m,nx,nz)=>damageMonster(m,atk+1,nx,nz,false,W));slash('arc',1.35,null,0.1);}
    else{const L=4.4+TV('w_pierce')+(c===3?1.5:0);const fs=c===1&&ply.first&&TV('w_charge');const cand=[];for(const m of monsters){if(m.dead>=0)continue;const dx=m.x-ply.x,dz=m.z-ply.z;const along=dx*fx+dz*fz,side=Math.abs(-dx*fz+dz*fx);
        if(along>-0.3&&along<L&&side<1.0+m.size*0.3)cand.push([along,m]);}
      cand.sort((a,b)=>a[0]-b[0]);const list=TL('spear',2)||c===3?cand:cand.slice(0,1);
      for(const[,m]of list){damageMonster(m,fs?rd((A+1)*(1+fs)):rd((A+1)*F),fx,fz,TL('spear',2)||!!fs||c===3,fs?{src:'wpn',stun:0.5+0.5*fs,kb:1.5}:c===3?{src:'wpn',stun:0.3,kb:1.4}:W);hits++;}
      const lx=(hp.x-ply.x)*Math.cos(ply.face)-(hp.z-ply.z)*Math.sin(ply.face);slash('line',c===3?1.3:1,{x:lx,y:hp.y-ply.y});
      if(fs&&hits){dmgNumP('先制！');const[x3,gy,z3]=gyF(2.4);ring(x3,gy+0.2,z3,0xffd36e,0.4,1.4,0.4);hitStop=0.12;}}
    if(skinOf('spear')==='skin_thunder')boltFX(hp.x,hp.y,hp.z,ply.face,c===3?6:4.6);if(hits){SFX.hit(c===3);hitStop=c===3?0.1:0.06;}return;}
  const c3=c===3,sw=w==='sword',reach=c3?(sw&&TL('sword',2)?4.6:3.5):2.9;
  for(const m of monsters){if(m.dead>=0)continue;const dx=m.x-ply.x,dz=m.z-ply.z,d=Math.hypot(dx,dz)||0.01;
    if(d<reach+m.size*0.3&&(dx*fx+dz*fz)/d>(c3?0.35:-0.1)){hits++;damageMonster(m,c3?rd(A*2*(1+(sw?LK([0,0.3,0.6,1],TV('w_finisher')):0))):atk,dx/d,dz/d,c3,c3&&sw&&TV('w_bleed')?{src:'wpn',dot:[3,rd(A*0.3*TV('w_bleed'))]}:W);}}
  slash(c3?'c3':'arc',c3&&sw&&TL('sword',2)?1.35:1,null,c===1?-0.2:c===2?0.25:0);
  if(sw&&skinOf('sword')==='churro')churroStars(c);if(sw&&skinOf('sword')==='skin_flame')flameSparks(c);
  if(hits&&c3&&sw&&TV('w_combo'))healMe(TV('w_combo'),0);
  if(hits){SFX.hit(c3);hitStop=c3?0.1:0.06;if(skinOf('sword')==='churro'&&sw)churroStars(3);}
  if(c3){const[x3,gy,z3]=gyF(2.6);ring(x3,gy+0.1,z3,0xfff0e0,0.3,1.5,0.3);burst(x3,gy+0.2,z3,[0xffffff,0xfff0d0],10,4);SFX.land();P.sqv-=5;if(sw&&TL('sword',3))fireWave(atk*2);}
}
function rangedFire(){rangedFire0();ply.cool*=1/(1+agiSpd());}
function rangedFire0(){const w=ply.weapon,atk=weaponAtk(),A=weaponAtk(true);const c=ply.combo||1;
  if(w==='bow'){const cr=0.1*TV('r_crit');const spread=TL('bow',2)?[-0.18,0,0.18]:[0];
    if(c===3){const cc=Math.random()<cr;fireArrow(ply.face,rd(A*2)*(cc?2:1),true);for(const s of[-0.32,0.32])setTimeout(()=>{if(ply.weapon==='bow')fireArrow(ply.face+s,rd(A*0.5),false);},120);SFX.bow();}
    else spread.forEach(s=>{const cc=Math.random()<cr;fireArrow(ply.face+s,cc?atk*2:atk,cc);});SFX.bow();ply.cool=0.12*aspd('bow');
    const st=Math.floor(TV('r_steady'));if(st&&!ply.moving)for(let i=0;i<st;i++)setTimeout(()=>{if(ply.weapon==='bow')fireArrow(ply.face+R(-0.09,0.09),rd(A*0.5),false);},70*(i+1));}
  else if(w==='orb'){const o=weaponTip();const d=rd(A*(1+0.25*TV('m_shard')));
    if(c===1)fireShard(o.x,o.y,o.z,ply.face,d,1);else if(c===2){fireShard(o.x,o.y,o.z,ply.face-0.15,rd(d*0.6),1);setTimeout(()=>{if(ply.weapon!=='orb')return;const q=weaponTip();fireShard(q.x,q.y,q.z,ply.face+0.15,rd(d*0.6),1);},120);}
    else for(let i=0;i<3;i++)setTimeout(()=>{if(ply.weapon!=='orb')return;const q=weaponTip();fireShard(q.x,q.y,q.z,ply.face+(i-1)*0.3,rd(d*0.65),1);},i*120);ply.cool=0.12;}
  else if(w==='book'){fireHoly(ply.face,rd(A*(1+0.25*TV('p_smite'))*(c===3?1.5:1)),c===3);ply.cool=c===3?0.3:0.2;}
  else{fireOrb(ply.face,rd((A+1)*(1+LK([0,0.15,0.3,0.5],TV('m_power')))*(c===3?1.5:1)),c===3);ply.cool=0.2;}}
function killMonster(m){m.dead=0;m.bar.visible=false;burst(m.x,H(m.x,m.z)+m.y+0.6,m.z,[0xff9ec7,0xffc4dc,0xffffff,0xffd36e],20,6);ring(m.x,H(m.x,m.z)+0.15,m.z,0xff9ec7,0.3,2.2,0.4);
  SFX.mdie();const hy=H(m.x,m.z)+m.y+0.8;const lk=1+0.2*TV('c_lucky');if(m.cave){spawnDrops('coin',m.x,hy,m.z,Math.round(m.coin*lk),1);spawnDrops('xp',m.x,hy,m.z,m.xpv,3);if(Math.random()<0.3)spawnDrops('gem',m.x,hy,m.z,1);}else{spawnDrops('coin',m.x,hy,m.z,Math.round((m.night?4:3)*lk),1);spawnDrops('xp',m.x,hy,m.z,m.night?5:4,3);}progress('hunt');partyOnKill(m);}

// ---------- 世界初始物件 ----------
for(let i=0;i<45;i++)spawnWeed();
for(let i=0;i<16;i++)spawnButterfly();

// ---------- 姿勢（柔軟動作） ----------
const MOUNTED={book:1,orb:1,lute:1,shield:1,cometLute:1,wisdomEye:1,starBook:1,guardCrystal:1};
function strumPose(p,T){p.arms[0]=[-0.75+Math.sin(T*18)*0.18,0,0.25];p.arms[1]=[-1.1,0,0.35];p.sq=Math.sin(T*9)*0.04;p.k=30;}
// ---------- 三段普攻：關鍵影格＋手臂 IK ----------
// 方向皆為角色身體座標：+z 前、+y 上、-x 角色右手邊（持武器的手）
// a：手臂指向、w：武器指向、o：手臂位置偏移、m/mr：浮空武器（書、法器、魯特琴、盾牌）位置／旋轉偏移
const _ikX=new THREE.Vector3(),_ikY=new THREE.Vector3(),_ikZ=new THREE.Vector3(),_ikM=new THREE.Matrix4(),_ikA=new THREE.Vector3(),_ikW=new THREE.Vector3();
function aimArm(a,w,q){_ikY.set(-a[0],-a[1],-a[2]).normalize();_ikW.set(w[0],w[1],w[2]).normalize();_ikX.crossVectors(_ikY,_ikW);if(_ikX.lengthSq()<1e-6)_ikX.set(1,0,0);_ikX.normalize();
  _ikZ.crossVectors(_ikX,_ikY);_ikM.makeBasis(_ikX,_ikY,_ikZ);q.setFromRotationMatrix(_ikM);return Math.atan2(_ikW.dot(_ikZ),_ikW.dot(_ikY));}
function vslerp(a,b,u){const A=new THREE.Vector3(...a).normalize(),B=new THREE.Vector3(...b).normalize();const d=clamp(A.dot(B),-1,1),th=Math.acos(d);if(th<1e-4)return[B.x,B.y,B.z];
  const s=Math.sin(th),ka=Math.sin((1-u)*th)/s,kb=Math.sin(u*th)/s;return[A.x*ka+B.x*kb,A.y*ka+B.y*kb,A.z*ka+B.z*kb];}
const vlerp=(a,b,u)=>[lerp(a[0],b[0],u),lerp(a[1],b[1],u),lerp(a[2],b[2],u)];
const sstep=u=>u*u*(3-2*u);
const _atkQ=new THREE.Quaternion();
const ATK3={};
const _idleQ=new THREE.Quaternion();
// 待機／走路時手持武器的方向（往前下方、遠離身體與角）
const IDLE_A={},IDLE_O={};
IDLE_A.bow=[-0.4,-0.3,0.86];IDLE_O.bow=[0.05,0,0.42];
const IDLE_W={sword:[-0.3,-0.3,0.9],stick:[-0.3,-0.3,0.9],spear:[-0.25,-0.12,0.96],greatsword:[-0.35,-0.2,0.91],dagger:[-0.3,-0.4,0.86],staff:[-0.25,-0.28,0.93],bow:[0.05,1,0.05]};
// 取得某段攻擊在進度 s（0~1）時的關鍵影格內插
function atkKey(st,s){const K=st.k;let i=0;while(i<K.length-2&&s>K[i+1].t)i++;const A=K[i],B=K[i+1]||A;const u=B===A?0:sstep(clamp((s-A.t)/((B.t-A.t)||1),0,1));
  const r={};for(const f of['a','w','a1'])if(A[f]||B[f])r[f]=f==='a1'?vlerp(A[f]||B[f],B[f]||A[f],u):vslerp(A[f]||B[f],B[f]||A[f],u);
  for(const f of['o','o1','m','mr','lg'])if(A[f]||B[f])r[f]=vlerp(A[f]||[0,0,0],B[f]||[0,0,0],u);
  for(const f of['tw','ln','sq','y','spin'])if(A[f]!==undefined||B[f]!==undefined)r[f]=lerp(A[f]??0,B[f]??0,u);return r;}
// 依武器、段數、進度套用攻擊姿勢（玩家與其他玩家共用）
function atkPoseFor(p,wp,combo,s,q){const A=ATK3[wp]||ATK3.sword;const st=A[Math.max(1,combo||1)-1]||A[0];const r=atkKey(st,clamp(s,0,1));
  if(r.a&&r.w){const hd=aimArm(r.a,r.w,q);p.aq=[q,null];p.hold=hd;}
  if(r.a1)p.arms[1]=r.a1;p.off=[r.o||[0,0,0],r.o1||[0,0,0]];
  if(r.tw!==undefined)p.twist=r.tw;if(r.spin!==undefined){const g=r.spin;p.twistHard=Math.atan2(Math.sin(g),Math.cos(g));}
  if(r.ln!==undefined)p.lean=r.ln;if(r.sq!==undefined)p.sq=r.sq;if(r.y!==undefined)p.y=r.y;if(r.lg)p.legs=[r.lg[0],r.lg[1]];
  p.mnt=r.m||null;p.mntR=r.mr||null;p.k=34;p.ka=55;return p;}
function atkPose(p){return atkPoseFor(p,ply.weapon,ply.combo,ply.atkT/ply.atkDur,_atkQ);}
// 待機／走路時手持武器的姿勢
function idleWeaponPose(p,wp,moving,run,w,q){const ww=IDLE_W[wp];if(!ww)return p;const sw=moving?Math.sin(w)*(run?0.35:0.22):0;const ia=IDLE_A[wp];
  const a=ia||[-0.35,-0.88,0.3];const hd=aimArm([a[0],a[1],a[2]+sw],[ww[0],ww[1],ww[2]+(ia?0:sw*0.4)],q);p.aq=[q,null];p.hold=hd;p.off=[IDLE_O[wp]||[-0.14,0,0.12],[0,0,0]];return p;}
const MODEL_W={churro:'sword',flame:'sword',thunder:'spear',windbow:'bow',icestaff:'staff'};
// 浮空武器（書、法器、魯特琴、盾牌）的位置動畫
function updateMountedC(C,p,dt,T,fast){const k1=1-Math.exp(-30*dt);for(const k in MOUNTED){const o=C.T[k];if(!o||!o.visible||!o.userData.bp)continue;const bp=o.userData.bp,br=o.userData.br,m=p&&p.mnt,mr=p&&p.mntR;
  const bob=o.userData.mount.bob?Math.sin(T*2.2+(k==='orb'?1:0))*0.08:0;
  o.position.x=lerp(o.position.x,bp.x+(m?m[0]:0),k1);o.position.y=lerp(o.position.y,bp.y+bob+(m?m[1]:0),k1);o.position.z=lerp(o.position.z,bp.z+(m?m[2]:0),k1);
  o.rotation.x=lerp(o.rotation.x,br.x+(mr?mr[0]:0),k1);o.rotation.y=lerp(o.rotation.y,br.y+(mr?mr[1]:0),k1);o.rotation.z=lerp(o.rotation.z,br.z+(mr?mr[2]:0),k1);}
  for(const k in MOUNTED){const O=C.T[k];if(!O||!O.visible)continue;if(O.userData.spin){const f=fast?4:1;O.userData.spin[0].rotation.z+=dt*1.5*f;O.userData.spin[1].rotation.x+=dt*1.2*f;}if(O.userData.star)O.userData.star.rotation.y=T*3;if(O.userData.core)O.userData.core.rotation.y=T*1.5;}}
function updateMounted(p,dt,T){updateMountedC(P,p,dt,T,ply.atkT>=0&&ply.combo===3);weaponSafety(P);}
// ---------- 防穿模保險：武器若碰到身體／角／耳朵／尾巴／帽子，就把手（或浮空武器）往外推開 ----------
const _sfV=new THREE.Vector3(),_sfL=new THREE.Vector3(),_sfC=new THREE.Vector3(),_sfD=new THREE.Vector3(),_sfM=new THREE.Matrix4();
function sfInside(mesh,pw){_sfL.copy(pw).applyMatrix4(mesh.userData.sfInv);const p=_sfL,g=mesh.geometry,Q=g.parameters||{},t=g.type,sh=1.1;
  if(t==='SphereGeometry'){if(Q.phiLength<6.2||Q.thetaLength<3.1)return false;return p.length()<Q.radius*sh;}
  if(t==='CylinderGeometry'){if(Math.abs(p.y)>Q.height/2*sh)return false;const k=(p.y+Q.height/2)/Q.height;return Math.hypot(p.x,p.z)<(Q.radiusBottom+(Q.radiusTop-Q.radiusBottom)*k)*sh;}
  if(t==='ConeGeometry'){if(Math.abs(p.y)>Q.height/2*sh)return false;const k=(p.y+Q.height/2)/Q.height;return Math.hypot(p.x,p.z)<Q.radius*(1-k)*sh;}
  if(t==='TorusGeometry'){let aa=Math.atan2(p.y,p.x);if(aa<0)aa+=Math.PI*2;if(aa>Q.arc)return false;return Math.hypot(Math.hypot(p.x,p.y)-Q.radius,p.z)<Q.tube*sh;}
  if(t==='BoxGeometry')return Math.abs(p.x)<Q.width/2*sh&&Math.abs(p.y)<Q.height/2*sh&&Math.abs(p.z)<Q.depth/2*sh;
  if(t==='LatheGeometry'){const pts=Q.points,r=Math.hypot(p.x,p.z);for(let i=0;i<pts.length-1;i++){const A=pts[i],B=pts[i+1];if(p.y>=Math.min(A.y,B.y)&&p.y<=Math.max(A.y,B.y)){const k=(p.y-A.y)/((B.y-A.y)||1e-6);return r<(A.x+(B.x-A.x)*k)*sh;}}return false;}
  if(!g.boundingBox)g.computeBoundingBox();const bb=g.boundingBox;return p.x>bb.min.x&&p.x<bb.max.x&&p.y>bb.min.y&&p.y<bb.max.y&&p.z>bb.min.z&&p.z<bb.max.z;}
function sfBuild(C){const tools=new Set(Object.values(C.T));const parts=[];
  C.m.traverse(o=>{if(!o.isMesh||o===C.face||o.material&&o.material.transparent&&o.material.opacity<0.6)return;let q=o;while(q&&q!==C.m){if(q===C.arms[0]||q===C.arms[1]||tools.has(q))return;q=q.parent;}parts.push(o);});
  const pts={};for(const k in C.T){const root=C.T[k];root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(root.matrixWorld).invert();const arr=[];
    root.traverse(o=>{if(!o.isMesh)return;const pos=o.geometry.attributes.position;const step=Math.max(1,Math.floor(pos.count/40));const rel=new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld);
      for(let i=0;i<pos.count;i+=step)arr.push(new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(rel));});pts[k]=arr;}
  C.sf={parts,pts,n:C.m.children.length};}
function weaponSafety(C){if(!C)return;let key=null;for(const k in C.T)if(C.T[k].visible){key=k;break;}if(!key)return;
  if(!C.sf||C.sf.n!==C.m.children.length)sfBuild(C);const root=C.T[key];const mounted=!!root.userData.mount;const mover=mounted?root:C.arms[0];
  const lp=C.sf.pts[key];if(!lp||!lp.length)return;C.g.updateMatrixWorld(true);
  const parts=C.sf.parts.filter(o=>{let q=o;while(q){if(!q.visible)return false;if(q===C.m)break;q=q.parent;}return true;});
  for(const o of parts){o.userData.sfInv=(o.userData.sfInv||new THREE.Matrix4()).copy(o.matrixWorld).invert();const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();const c=o.userData.sfC||(o.userData.sfC=new THREE.Vector3());c.copy(g.boundingSphere.center).applyMatrix4(o.matrixWorld);const sc=new THREE.Vector3().setFromMatrixScale(o.matrixWorld);const rr=g.boundingSphere.radius*Math.max(sc.x,sc.y,sc.z)*1.05;o.userData.sfR2=rr*rr;}
  _sfM.copy(C.m.matrixWorld).invert();
  for(let it=0;it<24;it++){root.updateMatrixWorld(true);_sfD.set(0,0,0);let hit=0;
    for(const v of lp){_sfV.copy(v).applyMatrix4(root.matrixWorld);for(const o of parts){if(_sfV.distanceToSquared(o.userData.sfC)>o.userData.sfR2)continue;if(sfInside(o,_sfV)){hit++;_sfD.add(_sfC.copy(_sfV).sub(o.userData.sfC).normalize());break;}}}
    if(!hit)break;
    // 推開方向轉成身體座標；往前、往外為主
    const d=_sfD.clone().add(C.m.getWorldPosition(new THREE.Vector3())).applyMatrix4(_sfM);d.y*=0.5;d.z=Math.max(d.z,0.15*d.length());if(d.lengthSq()<1e-6)d.set(0,0,1);d.normalize();
    if(mover.parent!==C.m){const q=new THREE.Quaternion();mover.parent.getWorldQuaternion(q);const mq=new THREE.Quaternion();C.m.getWorldQuaternion(mq);d.applyQuaternion(mq).applyQuaternion(q.invert());}
    mover.position.addScaledVector(d,0.04);mover.updateMatrixWorld(true);}}
// d：秒數、h：命中時間點（比例）、k：關鍵影格
const BOW_I={a:[-0.4,-0.3,0.86],w:[0.05,1,0.05],o:[0.05,0,0.42]},BOW_U=w=>({a:[-0.1,-0.05,1],w,o:[0.3,0,0.55]});
Object.assign(ATK3,{
 sword:[
  {d:0.30,h:0.42,k:[{t:0,a:[-0.55,-0.35,0.75],w:[-0.8,-0.2,0.56],o:[0.05,0,0.32],tw:0.3,ln:0.1,a1:[-0.6,0,0.6]},{t:0.28,a:[-0.7,-0.3,0.65],w:[-0.85,-0.15,0.5],o:[0.05,0,0.32],tw:0.35,ln:0.12},
    {t:0.6,a:[0.4,-0.3,0.87],w:[0.78,-0.22,0.58],o:[0.1,0,0.45],tw:-0.3,ln:0.2,lg:[-0.35,0.3]},{t:1,a:[0.3,-0.35,0.89],w:[0.62,-0.4,0.68],o:[0.1,0,0.45],tw:-0.25,ln:0.15,lg:[-0.3,0.25]}]},
  {d:0.30,h:0.42,k:[{t:0,a:[0.3,-0.35,0.89],w:[0.7,-0.25,0.67],o:[0.1,0,0.45],tw:-0.3,ln:0.12},{t:0.25,a:[0.35,-0.3,0.89],w:[0.75,-0.2,0.63],o:[0.1,0,0.45],tw:-0.35,ln:0.12},
    {t:0.6,a:[-0.7,-0.25,0.67],w:[-0.8,0.0,0.6],o:[0.05,0,0.32],tw:0.35,ln:0.2,lg:[0.3,-0.35]},{t:1,a:[-0.6,-0.3,0.74],w:[-0.7,-0.15,0.7],o:[0.05,0,0.3],tw:0.25,ln:0.15}]},
  {d:0.38,h:0.5,k:[{t:0,a:[-0.2,-0.2,0.96],w:[0,0.3,0.95],o:[0.2,0.05,0.48],ln:0},{t:0.15,a:[-0.1,0.2,0.97],w:[0,0.55,0.84],o:[0.25,0.08,0.55]},{t:0.32,a:[0.0,0.55,0.83],w:[0.0,0.88,0.47],o:[0.25,0.1,0.5],ln:-0.2,sq:0.14,lg:[0.2,-0.2],a1:[-2.6,0,0.3]},
    {t:0.58,a:[0.0,-0.4,0.92],w:[0,-0.6,0.8],o:[0.2,0,0.55],ln:0.45,sq:-0.18,lg:[-0.6,0.5],a1:[-0.6,0,0.3]},{t:1,a:[0.0,-0.4,0.92],w:[0,-0.55,0.83],o:[0.2,0,0.55],ln:0.35,lg:[-0.5,0.4]}]}],
 stick:null,
 spear:[
  {d:0.38,h:0.42,k:[{t:0,a:[-0.15,-0.2,0.97],w:[-0.05,-0.08,1],o:[0.15,0,0.42],a1:[-1.2,0,0.5]},{t:0.3,a:[-0.15,-0.25,0.96],w:[-0.05,-0.1,1],o:[0.15,0,0.45],ln:-0.1,sq:-0.1,lg:[0.3,-0.2]},
    {t:0.5,a:[-0.1,-0.1,0.99],w:[-0.03,-0.05,1],o:[0.15,0,0.85],ln:0.35,sq:0.1,lg:[-0.7,0.55]},{t:1,a:[-0.12,-0.15,0.98],w:[-0.05,-0.08,1],o:[0.15,0,0.55],ln:0.15}]},
  {d:0.42,h:0.5,k:[{t:0,a:[0.2,-0.3,0.93],w:[0.55,-0.35,0.76],o:[0.15,0,0.5],tw:-0.3},{t:0.25,a:[0.3,-0.3,0.9],w:[0.65,-0.35,0.67],o:[0.15,0,0.5],tw:-0.4},
    {t:0.65,a:[-0.6,-0.3,0.74],w:[-0.72,-0.38,0.58],o:[0.05,0,0.4],tw:0.4,ln:0.2},{t:1,a:[-0.5,-0.3,0.8],w:[-0.6,-0.35,0.72],o:[0.05,0,0.4],tw:0.3}]},
  {d:0.52,h:0.55,k:[{t:0,a:[-0.15,-0.2,0.97],w:[-0.05,-0.08,1],o:[0.15,0,0.42]},{t:0.4,a:[-0.15,-0.3,0.94],w:[-0.05,-0.12,1],o:[0.15,-0.05,0.48],ln:-0.2,sq:-0.2,lg:[0.4,-0.3]},
    {t:0.58,a:[-0.08,-0.05,1],w:[-0.02,0,1],o:[0.15,0,1.0],ln:0.45,sq:0.16,lg:[-0.8,0.6]},{t:1,a:[-0.1,-0.1,0.99],w:[-0.03,-0.05,1],o:[0.15,0,0.6],ln:0.2}]}],
 greatsword:[
  {d:0.56,h:0.55,k:[{t:0,a:[-0.3,-0.2,0.93],w:[-0.2,0.3,0.93],o:[0.15,0,0.45]},{t:0.35,a:[-0.4,0.35,0.85],w:[-0.4,0.62,0.68],o:[0.15,0.1,0.48],ln:-0.15,tw:0.25,sq:0.12,a1:[-2.2,0,0.3]},
    {t:0.62,a:[0.35,-0.45,0.82],w:[0.55,-0.5,0.67],o:[0.2,0,0.5],ln:0.4,tw:-0.25,sq:-0.15,lg:[-0.6,0.5],a1:[-0.8,0,0.3]},{t:1,a:[0.3,-0.45,0.84],w:[0.45,-0.55,0.7],o:[0.2,0,0.48],ln:0.3,tw:-0.2}]},
  {d:0.56,h:0.55,k:[{t:0,a:[0.3,-0.45,0.84],w:[0.5,-0.4,0.77],o:[0.2,0,0.48],tw:-0.2},{t:0.3,a:[0.4,-0.3,0.87],w:[0.7,-0.2,0.68],o:[0.2,0,0.5],tw:-0.45,ln:0.05},
    {t:0.65,a:[-0.65,-0.3,0.7],w:[-0.78,-0.22,0.58],o:[0.05,0,0.42],tw:0.45,ln:0.25,lg:[0.4,-0.5]},{t:1,a:[-0.55,-0.35,0.76],w:[-0.65,-0.3,0.7],o:[0.05,0,0.42],tw:0.3,ln:0.2}]},
  {d:0.82,h:0.56,k:[{t:0,a:[-0.2,-0.2,0.96],w:[-0.1,0.3,0.95],o:[0.2,0,0.45]},{t:0.45,a:[-0.05,0.6,0.8],w:[-0.03,0.78,0.62],o:[0.25,0.1,0.5],ln:-0.25,sq:0.16,lg:[0.3,-0.2],a1:[-2.6,0,0.3]},
    {t:0.62,a:[0,-0.45,0.89],w:[0,-0.5,0.87],o:[0.25,0,0.55],ln:0.5,sq:-0.22,lg:[-0.7,0.6],a1:[-0.9,0,0.3]},{t:1,a:[0,-0.45,0.89],w:[0,-0.5,0.87],o:[0.25,0,0.5],ln:0.4}]}],
 dagger:[
  {d:0.2,h:0.4,k:[{t:0,a:[-0.6,-0.3,0.74],w:[-0.75,-0.1,0.65],o:[0.05,0,0.3],tw:0.25},{t:0.2,a:[-0.65,-0.3,0.7],w:[-0.8,-0.1,0.6],o:[0.05,0,0.3],tw:0.3},
    {t:0.6,a:[0.25,-0.3,0.92],w:[0.7,-0.2,0.68],o:[0.1,0,0.5],tw:-0.3,ln:0.25,lg:[-0.4,0.35]},{t:1,a:[0.35,-0.3,0.89],w:[0.6,-0.25,0.76],o:[0.1,0,0.5],tw:-0.25,ln:0.2}]},
  {d:0.2,h:0.4,k:[{t:0,a:[0.35,-0.3,0.89],w:[0.6,-0.25,0.76],o:[0.1,0,0.5],tw:-0.25},{t:0.2,a:[0.4,-0.3,0.87],w:[0.68,-0.2,0.7],o:[0.1,0,0.5],tw:-0.3},
    {t:0.6,a:[-0.65,-0.3,0.7],w:[-0.78,-0.05,0.62],o:[0.05,0,0.3],tw:0.3,ln:0.25,lg:[0.35,-0.4]},{t:1,a:[-0.6,-0.3,0.74],w:[-0.7,-0.1,0.7],o:[0.05,0,0.3],tw:0.25,ln:0.2}]},
  {d:0.38,h:0.5,k:[{t:0,a:[-0.75,-0.25,0.6],w:[-0.85,-0.1,0.5],o:[0.0,0,0.25],spin:0,sq:-0.1},{t:0.15,a:[-0.85,-0.2,0.5],w:[-0.92,-0.05,0.4],o:[0,0,0.22],spin:0.3,sq:-0.15,lg:[0.3,-0.3]},
    {t:0.75,a:[-0.85,-0.2,0.5],w:[-0.92,-0.05,0.4],o:[0,0,0.22],spin:-Math.PI*2+0.3,sq:0.1,lg:[-0.5,0.5]},{t:1,a:[-0.6,-0.3,0.74],w:[-0.7,-0.1,0.7],o:[0.05,0,0.3],spin:-Math.PI*2}]}],
 bow:[
  {d:0.4,h:0.5,k:[{t:0,...BOW_I},{t:0.2,...BOW_U([0.05,1,0.05]),a1:[-1.5,0,0.9]},{t:0.45,...BOW_U([0.05,1,0.05]),a1:[-1.45,0,0.2],sq:-0.06},{t:0.55,...BOW_U([0.05,1,0.05]),a1:[-1.5,0,0.9],sq:0.05},{t:0.8,...BOW_U([0.05,1,0.05])},{t:1,...BOW_I}]},
  {d:0.4,h:0.5,k:[{t:0,...BOW_I},{t:0.2,...BOW_U([0.4,0.92,0.05]),a1:[-1.5,0,0.9]},{t:0.45,...BOW_U([0.4,0.92,0.05]),a1:[-1.45,0,0.2],sq:-0.06},{t:0.55,...BOW_U([0.4,0.92,0.05]),sq:0.05},{t:0.8,...BOW_U([0.2,0.98,0.05])},{t:1,...BOW_I}]},
  {d:0.7,h:0.7,k:[{t:0,...BOW_I},{t:0.15,...BOW_U([0.05,1,0.05])},{t:0.62,a:[-0.1,0.05,1],w:[0.05,1,0.05],o:[0.3,0,0.6],a1:[-1.6,0,-0.1],ln:-0.12,sq:-0.12,lg:[0.4,-0.3]},{t:0.72,a:[-0.1,0.05,1],w:[0.05,1,0.05],o:[0.3,0,0.62],a1:[-1.5,0,1.1],ln:0.1,sq:0.1},{t:0.84,...BOW_U([0.05,1,0.05])},{t:1,...BOW_I}]}],
 staff:[
  {d:0.45,h:0.5,k:[{t:0,a:[-0.2,-0.3,0.93],w:[-0.2,-0.2,0.96],o:[0.15,0,0.5]},{t:0.18,a:[-0.2,-0.3,0.93],w:[0,0.6,0.8],o:[0.15,0,0.48]},{t:0.35,a:[-0.2,-0.1,0.97],w:[0,0.85,0.53],o:[0.15,0.05,0.4],sq:0.08},
    {t:0.55,a:[-0.1,-0.2,0.97],w:[0,0.15,0.99],o:[0.15,0,0.6],ln:0.2,sq:-0.06},{t:1,a:[-0.15,-0.25,0.96],w:[0,0.4,0.92],o:[0.15,0,0.5]}]},
  {d:0.45,h:0.5,k:[{t:0,a:[-0.15,-0.25,0.96],w:[0,0.4,0.92],o:[0.15,0,0.5]},{t:0.3,a:[0.25,-0.2,0.95],w:[0.6,0.45,0.66],o:[0.2,0,0.5],tw:-0.3},
    {t:0.55,a:[-0.45,-0.2,0.87],w:[-0.55,0.35,0.76],o:[0.1,0,0.5],tw:0.3,ln:0.15},{t:1,a:[-0.3,-0.25,0.92],w:[-0.25,0.4,0.88],o:[0.15,0,0.5],tw:0.15}]},
  {d:0.7,h:0.62,k:[{t:0,a:[-0.15,-0.25,0.96],w:[0,0.4,0.92],o:[0.15,0,0.5]},{t:0.45,a:[0,0.65,0.76],w:[0,0.92,0.4],o:[0.25,0.15,0.5],ln:-0.2,sq:0.16,y:0.15,a1:[-2.6,0,0.3]},
    {t:0.62,a:[0,-0.35,0.94],w:[0,0.25,0.97],o:[0.2,0,0.6],ln:0.35,sq:-0.2,y:0,lg:[-0.6,0.5],a1:[-0.8,0,0.3]},{t:1,a:[-0.1,-0.3,0.95],w:[0,0.35,0.94],o:[0.15,0,0.5],ln:0.15}]}],
 orb:[
  {d:0.36,h:0.42,k:[{t:0,m:[0,0,0],a1:[-0.6,0,0.4]},{t:0.3,m:[0.05,0.05,-0.05],a1:[-1.6,0,-0.4]},{t:0.45,m:[0.1,0,0.45],a1:[-1.5,0,-0.3],ln:0.15},{t:1,m:[0,0,0]}]},
  {d:0.4,h:0.5,k:[{t:0,m:[0,0,0]},{t:0.25,m:[0.1,0.1,0.3]},{t:0.5,m:[0.95,0.05,0.45],a1:[-1.6,0,0.6],tw:-0.2},{t:0.75,m:[1.1,0,0.3]},{t:1,m:[0,0,0]}]},
  {d:0.6,h:0.62,k:[{t:0,m:[0,0,0]},{t:0.3,m:[0.2,0.4,0.3],a1:[-2.6,0,0.4],sq:0.1},{t:0.6,m:[0.65,0.8,0.35],a1:[-2.8,0,0.2],sq:0.15,y:0.12},{t:0.75,m:[0.65,0.75,0.45],sq:-0.1,y:0},{t:1,m:[0,0,0]}]}],
 book:[
  {d:0.6,h:0.5,k:[{t:0,m:[0,0,0],mr:[0,0,0]},{t:0.35,m:[0,0.1,0.1],mr:[-0.4,0,0],a1:[-1.4,0,0.4]},{t:0.55,m:[0.1,0.05,0.35],mr:[0.3,0,0],a1:[-1.5,0,0.3],ln:0.1},{t:1,m:[0,0,0],mr:[0,0,0]}]},
  {d:0.6,h:0.5,k:[{t:0,m:[0,0,0]},{t:0.3,m:[0.4,0.1,0.35],mr:[0,0.6,0]},{t:0.55,m:[0.75,0.15,0.45],mr:[0.2,0.9,0],a1:[-1.6,0,0.2]},{t:0.8,m:[0.6,0.1,0.35],mr:[0,0.6,0]},{t:1,m:[0,0,0],mr:[0,0,0]}]},
  {d:0.8,h:0.62,k:[{t:0,m:[0,0,0]},{t:0.45,m:[0.5,0.85,0.4],mr:[-0.5,0,0],a1:[-2.7,0,0.3],sq:0.12},{t:0.62,m:[0.5,0.95,0.5],mr:[-0.6,0,0],a1:[-2.8,0,0.2],sq:0.15,y:0.1},{t:0.8,m:[0.3,0.5,0.3],y:0},{t:1,m:[0,0,0],mr:[0,0,0]}]}],
 lute:[
  {d:0.5,h:0.45,k:[{t:0,m:[0,0,0],mr:[0,0,0],a1:[-1.1,0,0.35]},{t:0.3,m:[0,0.04,0.02],mr:[0,0,0.1],a1:[-1.1,0,0.35],sq:0.05},{t:0.45,m:[0,-0.02,0.04],mr:[0,0,-0.08],sq:-0.06},{t:1,m:[0,0,0],mr:[0,0,0]}]},
  {d:0.5,h:0.45,k:[{t:0,m:[0,0,0],a1:[-1.1,0,0.35]},{t:0.3,m:[0,-0.03,0.03],mr:[0.1,0,-0.12],sq:-0.05,tw:0.15},{t:0.45,m:[0,0.04,0.05],mr:[-0.1,0,0.12],sq:0.06,tw:-0.15},{t:1,m:[0,0,0],mr:[0,0,0],tw:0}]},
  {d:0.7,h:0.6,k:[{t:0,m:[0,0,0]},{t:0.4,m:[0,0.08,0.12],mr:[-0.3,0,0.2],sq:-0.15,lg:[0.3,-0.3]},{t:0.6,m:[0,0.12,0.18],mr:[-0.35,0,-0.25],sq:0.18,y:0.35,lg:[-0.6,0.6]},{t:0.8,m:[0,0.05,0.08],y:0,sq:-0.12},{t:1,m:[0,0,0],mr:[0,0,0]}]}],
 shield:[
  {d:0.72,h:0.47,k:[{t:0,tw:0},{t:0.38,tw:0.45,ln:-0.08,sq:-0.12,lg:[0.3,-0.2],a1:[-0.3,0,0.9]},{t:0.5,tw:-1.45,ln:0.3,sq:0.1,lg:[-0.6,0.5],a1:[-0.6,0,1.1]},{t:1,tw:-1.2,ln:0.2}]},
  {d:0.6,h:0.5,k:[{t:0,tw:-1.2},{t:0.3,tw:-1.35,m:[0.05,0,0],ln:-0.1,sq:-0.1},{t:0.5,tw:-1.5,m:[0.15,0.05,0.15],mr:[0,0,0],ln:0.15,sq:0.12,lg:[-0.6,0.5]},{t:1,tw:-0.6,m:[0,0,0]}]},
  {d:0.8,h:0.6,k:[{t:0,tw:-0.6},{t:0.35,tw:-1.5,y:0.6,sq:0.15,lg:[-0.4,0.3],m:[0.1,0.1,0]},{t:0.6,tw:-1.5,y:0,ln:0.25,sq:-0.18,lg:[-0.7,0.6],m:[0.1,-0.2,0]},{t:1,tw:-0.3,ln:0.1,m:[0,0,0]}]}]
});
ATK3.stick=ATK3.sword;
function playerPose(T,moving,run){
  const p=newPose();const w=ply.walk;
  if(ply.sitting){const bath=ply.sitting.kind==='bath';p.legs=bath?[-1.0,-1.2]:[-1.45,-1.45];p.sq=Math.sin(T*2.2)*0.04;p.arms=bath?[[0.3,0,-1.5],[0.3,0,1.5]]:[[-0.6,0,-0.3],[-0.6,0,0.3]];if(bath){p.lean=-1.15;p.k=8;}return p;}
  if(ply.fishing){const f=ply.fishing;p.arms[0]=f.phase==='bite'?[-2.4,0,-0.2]:f.phase==='cast'&&f.t<0.25?[-2.8,0,-0.2]:[-1.25,0,-0.15];p.hold=1.35;p.sq=Math.sin(T*2.4)*0.04;if(f.phase==='bite'){p.sq=Math.sin(T*30)*0.06;}return p;}
  if(moving){const amp=run?1:0.6;p.legs=[Math.sin(w)*0.9*amp,-Math.sin(w)*0.9*amp];p.arms[0][0]=-Math.sin(w)*1.1*amp;p.arms[1][0]=Math.sin(w)*1.1*amp;
    p.lean=run?0.3:0.1;p.y=Math.abs(Math.sin(w))*(run?0.16:0.1);p.sq=Math.abs(Math.cos(w))*0.07-0.035;p.k=18;}
  else{p.sq=Math.sin(T*2.4)*0.045;p.arms[0][2]=-0.35-Math.sin(T*2.4)*0.07;p.arms[1][2]=0.35+Math.sin(T*2.4)*0.07;}
  if(!ply.ground){p.sq=0.12;p.legs=[-0.6,0.35];p.arms[0][2]=-1.25;p.arms[1][2]=1.25;}
  if(ply.held)p.arms[0][0]-=0.25;
  else if(IDLE_W[ply.weapon]&&!carry&&!ply.act)idleWeaponPose(p,ply.weapon,moving,run,w,_idleQ);
  if(ply.weapon==='lute'&&!ply.held&&!moving){p.arms[0]=[-0.6,0,0.2];p.arms[1]=[-1.0,0,0.35];}
  if(ply.weapon==='shield'&&!ply.held)p.arms[1][2]=Math.max(p.arms[1][2],0.75);
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
  if(ply.chan&&ply.weapon==='lute')strumPose(p,T);
  else if(ply.cast||ply.chan){p.arms[0]=[-2.6,0,-0.4+Math.sin(T*6)*0.1];p.arms[1]=[-2.6,0,0.4-Math.sin(T*6)*0.1];p.hold=1.3;p.sq=0.08+Math.sin(T*8)*0.03;p.k=14;}
  if(ply.leap){p.sq=0.15;p.legs=[-0.8,0.4];p.arms[0]=[-2.9,0,-0.2];p.arms[1]=[-2.5,0,0.3];p.hold=2.2;p.lean=-0.2;}
  if((ply.cast||ply.chan||ply.leap)&&!ply.held&&IDLE_W[ply.weapon]&&!(ply.chan&&ply.weapon==='lute')){const hd=aimArm([0,0.5,0.87],[0,0.85,0.5],_idleQ);p.aq=[_idleQ,null];p.hold=hd;p.off=[[0.25,0.1,0.45],[0,0,0]];}
  if(ply.atkT>=0)atkPose(p);
  return p;
}
function walkPose(p,w,moving,T,ph=0){if(moving){p.legs=[Math.sin(w)*0.6,-Math.sin(w)*0.6];p.arms[0][0]=-Math.sin(w)*0.6;p.arms[1][0]=Math.sin(w)*0.6;p.y=Math.abs(Math.sin(w))*0.08;p.lean=0.08;p.sq=Math.abs(Math.cos(w))*0.05-0.025;}
  else{p.sq=Math.sin(T*2.2+ph)*0.04;p.arms[0][2]=-0.35-Math.sin(T*2.2+ph)*0.06;p.arms[1][2]=0.35+Math.sin(T*2.2+ph)*0.06;}return p;}

// ---------- 主迴圈 ----------
const clock=new THREE.Clock();let miniT=0,hudT=0,saveT=0,snapCam=true,warnLv=0,bfT=0;
const camPos=new THREE.Vector3(),camTgt=new THREE.Vector3();
function loop(){
  if(window.__kicked)return;requestAnimationFrame(loop);
  const rawDt=Math.min(clock.getDelta(),0.05);let dt=rawDt;const T=clock.elapsedTime;
  if(hitStop>0){hitStop-=dt;dt*=0.08;}
  if(!paused&&started)step(dt,T);else{npcUpdate(rawDt,T);danceUpdate(rawDt,T);}
  boardMark.visible=false;
  for(const w of weeds){w.g.rotation.z=Math.sin(T*2+w.g.ph)*0.08;if(w.g.grow<1){w.g.grow=Math.min(1,w.g.grow+rawDt*2);w.g.scale.setScalar(easeOutBack(w.g.grow)||0.01);}}
  if(typeof HAMWHEEL!=='undefined')HAMWHEEL.rotation.z+=rawDt*0.9;
  for(const c of clouds){c.position.x+=rawDt*1.5;if(c.position.x>300)c.position.x=-300;}
  if(creatorOpen||!started){
    P.g.position.set(ply.x,ply.y,ply.z);P.g.rotation.y=creatorOpen?previewYaw:Math.PI*0.15;
    // 捏臉時角色完全靜止（不呼吸、不晃尾巴、不彈跳），方便看清楚細節
    if(creatorOpen){const p=newPose();P.sq=0;P.sqv=0;applyPose(P,p,rawDt);P.m.scale.set(1,1,1);if(P.tail)P.tail.rotation.y=0;}
    else{const p=walkPose(newPose(),0,false,T);applyPose(P,p,rawDt);if(P.tail)P.tail.rotation.y=Math.sin(T*3)*0.3;}
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
    const rideC=ply.riding&&ply.riding.kind==='coaster';const dist=rideC?13:rideF?22:ins?Math.min(camDist,10):sl?6:camDist,pit=rideF?0.3:ins?clamp(camPitch+0.15,0.45,1.2):sl?0.75:camPitch;
    camTgt.set(ply.x,ply.y+(sl?0.6:1.3),ply.z);const cp=Math.cos(pit);
    camPos.set(camTgt.x+Math.sin(camYaw)*cp*dist,camTgt.y+Math.sin(pit)*dist,camTgt.z+Math.cos(camYaw)*cp*dist);
    if(!ply.cave)camPos.y=Math.max(camPos.y,H(camPos.x,camPos.z)+0.8);
    if(snapCam){camera.position.copy(camPos);snapCam=false;}else camera.position.lerp(camPos,1-Math.pow(0.0001,rawDt));camera.lookAt(camTgt);}
  }
  skyDome.position.copy(camera.position);if(started){homeFrame(camera.position,rawDt);cullFar(rawDt);perfTune(rawDt);}
  for(const m of monsters)if(m.bar.visible&&m.bar.parent){m.bar.parent.getWorldQuaternion(_barQ);m.bar.quaternion.copy(_barQ.invert()).multiply(camera.quaternion);}
  if(typeof netFrame==='function')netFrame(rawDt,T);tickBlinks(rawDt);
  renderer.setRenderTarget(rt);renderer.render(scene,camera);renderer.setRenderTarget(null);renderer.render(postScene,postCam);
  uiFrame(rawDt);
}
// 繞開障礙物移動（不穿模）
function steer(n,tx,tz,spd,dt,arrive=0.3){
  if(n.detour){n.detT-=dt;if(n.detT<=0||Math.hypot(n.detour.x-n.x,n.detour.z-n.z)<0.5)n.detour=null;}
  const fx=tx,fz=tz;if(Math.hypot(fx-n.x,fz-n.z)<=arrive){n.stuckN=0;return false;}
  if(n.detour){tx=n.detour.x;tz=n.detour.z;}
  // 房子（方形）：繞到轉角
  for(const o of obstacles){if(!o.box)continue;if(Math.abs(o.x-n.x)>o.r+9||Math.abs(o.z-n.z)>o.r+9)continue;if(o.navOnly){if(n.follow)continue;const[a1,a2]=toLocal(o,fx,fz);if(Math.abs(a1)<o.box.hw&&Math.abs(a2)<o.box.hd)continue;}
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
// 角色之間的碰撞（村民、寵物、玩家互相推開，不重疊）
function separateChars(){const B=[];
  for(const n of npcs){if(n.away)continue;if(Math.hypot(n.x-ply.x,n.z-ply.z)>60)continue;B.push({o:n,r:0.85,fix:!!(n.stall&&n.onPost)||n.job==='stay'||n.talking,npc:1});}
  for(const p of pets){if(!!p.cave!==!!ply.cave||p.rideY!==undefined)continue;if(Math.hypot(p.x-ply.x,p.z-ply.z)>60)continue;B.push({o:p,r:0.42,fix:false});}
  if(!ply.riding&&!ply.sitting&&!ply.sleeping&&!ply.cave)B.push({o:ply,r:0.8,fix:false,me:1});
  for(let i=0;i<B.length;i++)for(let j=i+1;j<B.length;j++){const a=B[i],b=B[j];const dx=b.o.x-a.o.x,dz=b.o.z-a.o.z;const R=a.r+b.r;if(Math.abs(dx)>R||Math.abs(dz)>R)continue;const d=Math.hypot(dx,dz);if(d>=R)continue;
    const nx=d>1e-4?dx/d:Math.cos(i),nz=d>1e-4?dz/d:Math.sin(i),pen=R-d;if(a.fix&&b.fix)continue;const wa=a.fix?0:b.fix?1:0.5,wb=1-wa;
    a.o.x-=nx*pen*wa;a.o.z-=nz*pen*wa;b.o.x+=nx*pen*wb;b.o.z+=nz*pen*wb;a.moved=a.moved||wa>0;b.moved=b.moved||wb>0;}
  for(const b of B)if(b.moved&&!b.me){collideObs(b.o,b.r*0.6);pushWalls(b.o,b.r*0.6);if(b.npc)b.o.c.g.position.set(b.o.x,b.o.c.g.position.y,b.o.z);}}
function bodyCollide(n,r=0.5){collideObs(n,r);pushWalls(n,r);}
function npcNight(n,h){return h>=n.sleepH||h<n.wakeH;}
function npcUpdate(dtAll,T){
  const h=hour();
  for(const n of npcs){const g=n.c.g;let moving=false;let dt=dtAll;const far=Math.hypot(n.x-ply.x,n.z-ply.z)>75&&!n.talking;
    if(far){n.acc=(n.acc||0)+dtAll;if(n.acc<0.3){g.visible=false;continue;}dt=Math.min(n.acc,0.5);n.acc=0;}const night=npcNight(n,h);if(!n.init){n.init=1;if(night&&n.door)n.away=true;}
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
    g.visible=!n.away&&!far;if(n.away||far)continue;
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
    else if(n.job==='stay'){n.target={x:n.hx,z:n.hz,face:-Math.PI/2+Math.PI};}
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
  if(ply.sleeping){ply.en=Math.min(100,ply.en+gh*44);ply.hp=Math.min(ply.max,ply.hp+gh*6);
    zzT-=dt;if(zzT<=0){zzT=0.9;const d=document.createElement('div');d.className='zz';d.textContent='Z';d.style.fontSize=R(18,30)+'px';d.style.left=(innerWidth/2+R(-20,30))+'px';d.style.top=(innerHeight*0.42)+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),2200);}}
  else if(ply.sitting&&ply.sitting.kind==='bath'){ply.en=Math.min(100,ply.en+gh*12);ply.hp=Math.min(ply.max,ply.hp+gh*4);if(Math.random()<dt*3)SFX.bubble();
    if(Math.random()<dt*6)puff(ply.x+R(-0.5,0.5),ply.y+0.6,ply.z+R(-0.4,0.4),0xffffff,0.6);}

  if(!ply.sleeping){
    if(ply.en<30&&warnLv<1){warnLv=1;toast('😪 好睏…找張床躺一下吧');}
    if(ply.en<12&&warnLv<2){warnLv=2;toast('💤 快撐不住了！精神用光就不能採集，攻擊力也會減半');}
    if(ply.en<=0&&warnLv<3){warnLv=3;toast('😵 精神用光了！不能採集，攻擊力減半…快去睡覺或吃東西');}}
  if(ply.en>40)warnLv=0;
  if(isNight()&&!ply.nightWarned&&!ply.indoor){ply.nightWarned=true;toast('🌙 天黑了，果凍怪變兇了！');}if(!isNight())ply.nightWarned=false;
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
  if(!ply.sleeping&&!ply.downed&&!ply.reviving){if(kDown('up')||keys.ArrowUp)iz-=1;if(kDown('down')||keys.ArrowDown)iz+=1;if(kDown('left')||keys.ArrowLeft)ix-=1;if(kDown('right')||keys.ArrowRight)ix+=1;
    if(joy.id!==null){ix+=joy.x;iz+=joy.y;}}
  let mag=Math.hypot(ix,iz);if(mag>1){ix/=mag;iz/=mag;mag=1;}
  if(ply.sitting&&mag>0.3)standUp();
  if(ply.fishing&&mag>0.3)endFishing('收竿了');
  if(runMode==='toggle'){if(joy.id!==null&&mag>0.95)runLatch=true;if(mag<0.1){if(runWasMv)runLatch=false;runWasMv=false;}else runWasMv=true;}
  const run=(runMode==='toggle'?runLatch:(kDown('run')||(joy.id!==null&&mag>0.95)))&&!fpMode;plyRun=run&&mag>0.1;
  const busy=ply.act||ply.atkT>=0;
  const spd=(run?11:5.5)*(1-sleepy*0.4)*(busy?0.25:1)*(fpMode?0.7:1)*moveMul();
  const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),rx=Math.cos(camYaw),rz=-Math.sin(camYaw);
  const mx=fx*-iz+rx*ix,mz=fz*-iz+rz*ix;
  let moving=false;
  if(P.tail)P.tail.visible=!ply.sitting&&!(ply.riding&&ply.riding.kind==='teacup');// 坐著時藏起尾巴，避免穿模
  if(ply.downed){const gy=ply.cave?0:standY(ply.x,ply.z,ply.y);ply.y=gy;P.g.position.set(ply.x,gy,ply.z);P.g.rotation.y=ply.face;P.m.rotation.set(-Math.PI/2,0,0);P.m.position.set(0,0.6,0.45);P.m.scale.set(1,1+Math.sin(T*1.2)*0.03,1);if(P.tail)P.tail.rotation.y=Math.sin(T)*0.1;}
  else if(ply.sleeping){const p=ply.sleeping.p,b=furnBase(p);const fs=fsOf(p.id);P.g.position.set(p.x,b+0.62*fs,p.z);P.g.rotation.y=p.ry;P.m.rotation.set(-Math.PI/2,0,0);P.m.position.set(0,0.72,0.45*fs);
    P.m.scale.set(1,1+Math.sin(T*1.5)*0.035,1);ply.x=p.x;ply.z=p.z;ply.y=b;if(P.tail)P.tail.rotation.y=Math.sin(T*1.2)*0.2;}
  else if(ply.riding){updateRide(dt,T);}
  else if(ply.sitting){const p=ply.sitting.p,b=furnBase(p),bath=ply.sitting.kind==='bath';ply.x=p.x;ply.z=p.z;ply.y=b;ply.face=p.ry;
    const fs=fsOf(p.id);if(bath){const ry=p.ry+Math.PI/2;P.g.position.set(p.x+Math.sin(ry)*0.55*fs,b+0.3*fs,p.z+Math.cos(ry)*0.55*fs);P.g.rotation.y=ry;}
    else{const fw=(p.id==='sofa'?0.17:0.12)*fs;P.g.position.set(p.x+Math.sin(p.ry)*fw,b+(p.id==='sofa'?0.675:0.56)*fs-0.12,p.z+Math.cos(p.ry)*fw);P.g.rotation.y=p.ry;}applyPose(P,playerPose(T,false,false),dt);}
  else{
  if(mag>0.05){ply.x+=mx*spd*dt;ply.z+=mz*spd*dt;moving=true;
    if(!busy&&!fpMode&&!(ply.held==='hoe'||carry||isBlk(ply.held)))ply.face+=angDiff(ply.face,Math.atan2(mx,mz))*Math.min(1,dt*12);ply.walk+=dt*spd*1.5;}
  ply.moving=moving;if(fpMode)ply.face=camYaw+Math.PI;
  if(ply.dashT>0){ply.dashT-=dt;ply.x+=ply.dvx*dt;ply.z+=ply.dvz*dt;if(Math.random()<0.6)puff(ply.x,ply.y,ply.z);}
  ply.x+=ply.kx*dt;ply.z+=ply.kz*dt;ply.kx*=Math.pow(0.02,dt);ply.kz*=Math.pow(0.02,dt);
  const obs=ply.cave?caveObs:obstacles;
  for(const o of obs){if(o.r<=0||o.navOnly||o.solid)continue;if(o.y!==undefined&&Math.abs(o.y-ply.y)>0.9)continue;if(o.box){pushBox(ply,o,0.6);continue;}const dx=ply.x-o.x,dz=ply.z-o.z,d=Math.hypot(dx,dz),r=o.r+0.6;if(d<r&&d>0.001){ply.x=o.x+dx/d*r;ply.z=o.z+dz/d*r;}}
  if(!ply.cave){pushWalls(ply,0.45);pushBlocks(ply,ply.y);pushSolids(ply,ply.y);}
  if(!ply.cave)for(const n of npcs){if(n.away)continue;const dx=ply.x-n.x,dz=ply.z-n.z,d=Math.hypot(dx,dz);if(d<1.4&&d>0.001){ply.x=n.x+dx/d*1.4;ply.z=n.z+dz/d*1.4;}}
  if(ply.cave){const dx=ply.x-CAVE.x,dz=ply.z-CAVE.z,d=Math.hypot(dx,dz);if(d>CAVE.r-0.8){ply.x=CAVE.x+dx/d*(CAVE.r-0.8);ply.z=CAVE.z+dz/d*(CAVE.r-0.8);}}
  else{ply.x=clamp(ply.x,-112,112);ply.z=clamp(ply.z,-112,112);}
  const gH=ply.cave?0:standY(ply.x,ply.z,ply.y);ply.vy-=24*dt;ply.y+=ply.vy*dt;if(ply.vy>0&&!ply.cave&&headBlocked(ply.x,ply.z,ply.y))ply.vy=0;if(ply.y>gH+0.3)ply.ground=false;
  if(ply.y<=gH){if(!ply.ground){const imp=clamp(-ply.vy/10,0.2,1);P.sqv-=7*imp;if(ply.vy<-6){SFX.land();for(let i=0;i<4;i++)puff(ply.x,gH,ply.z);}}ply.y=gH;ply.vy=0;ply.ground=true;}
  P.g.position.set(ply.x,ply.y,ply.z);P.g.rotation.y=ply.face;
  const walkMove=moving&&ply.ground&&!busy;
  if(walkMove){const st=Math.floor(ply.walk/Math.PI);if(st!==ply.lastStep){ply.lastStep=st;SFX.step();if(run)puff(ply.x-Math.sin(ply.face)*0.4,ply.y,ply.z-Math.cos(ply.face)*0.4);}}
  if(run&&walkMove){ply.runDust-=dt;if(ply.runDust<=0){ply.runDust=0.07;puff(ply.x-Math.sin(ply.face)*0.5,ply.y,ply.z-Math.cos(ply.face)*0.5);}}
  {const pp=playerPose(T,walkMove,run&&walkMove);applyPose(P,pp,dt);updateMounted(pp,dt,T);}
  if(P.tail)P.tail.rotation.y=Math.sin(T*(walkMove?(run?16:10):3))*0.35;
  if(P.T.staff&&P.T.staff.visible)P.T.staff.userData.gem.rotation.y=T*3;
if(P.T.icestaff&&P.T.icestaff.visible)P.T.icestaff.userData.gem.rotation.y=T*2;
  if(P.T.flame&&P.T.flame.visible&&Math.random()<dt*14){const v=new THREE.Vector3(0,R(0.6,1.5),0);P.T.flame.localToWorld(v);burst(v.x,v.y,v.z,[0xffb347,0xff6a2a,0xffe08a],1,0.6,partG,0.5,-3);}
  if(P.T.thunder&&P.T.thunder.visible&&Math.random()<dt*6){const v=new THREE.Vector3(0,R(1.2,2.1),0);P.T.thunder.localToWorld(v);burst(v.x,v.y,v.z,[0xd8c0ff,0xb48cff],2,1.2,partG,0.25,0);}
  // 攻擊時間軸
  if(ply.atkT>=0){ply.atkT+=dt;const w=ply.weapon;
    if(!ply.hitDone&&ply.atkT>=(ply.hitAt||0.09)){ply.hitDone=true;if(w==='bow'||w==='staff'||w==='orb'||w==='book')rangedFire();else doHit();}
    if(ply.atkT>=ply.atkDur){ply.atkT=-1;ply.comboT=0.55;if(ply.combo===3)ply.combo=0;if(ply.queued||holdAtk){ply.queued=false;startAttack();}}}
  else{if(ply.comboT>0){ply.comboT-=dt;if(ply.comboT<=0)ply.combo=0;}if(holdAtk&&!ply.act&&!paused&&ply.cool<=0)attack();}
  if(ply.cool>0)ply.cool-=dt;
  // 動作時間軸
  if(ply.act){ply.actT+=dt;const dur=ACT_DUR[ply.act],s=ply.actT/dur;
    if(!ply.hit&&s>=ACT_HIT[ply.act]){ply.hit=1;actImpact();}
    if(s>=1){const was=ply.act;ply.act=null;ply.hit=0;toolShow=null;refreshHeld();
      if(holdAct&&!paused){const c=context();if(['tree','rock','weed','till','water','plant','harvest','ore'].includes(c))doAction();}}}
  }
  // ---- 鎖定 ----
  const lt=(ply.riding||ply.sitting||ply.sleeping)?null:nearestMonster(LOCKR[ply.weapon]||9);if(lt!==lockT){lockT=lt;if(lt)SFX.lock();}
  if(lockT){reticle.visible=true;reticle.position.set(lockT.x,H(lockT.x,lockT.z)+0.08,lockT.z);reticle.rotation.z=T*2;reticle.scale.setScalar(lockT.size*(1+Math.sin(T*8)*0.08));}else reticle.visible=false;
  updateFX2(dt);skillTick(dt,T);updatePets(dt,T);separateChars();updateFishing(dt,T);updateHoePreview(T);updatePark(dt,T);updateBuildGhost(T);updateOres(dt);updatePortals(dt,T);updateFountainFX(dt,T);
  caveLight.intensity=ply.cave?1.1:0;if(ply.cave)caveLight.position.set(ply.x,ply.y+4,ply.z);
  // 回復
  if(!ply.downed&&!ply.indoor&&(Math.hypot(ply.x,ply.z)<22||Math.hypot(ply.x-V2.x,ply.z-V2.z)<30)&&ply.hp<ply.max)ply.hp=Math.min(ply.max,ply.hp+dt*0.5);
  if(!ply.downed&&inHouse(ply.x,ply.z)&&ply.hp<ply.max)ply.hp=Math.min(ply.max,ply.hp+dt*0.8);
  if(!ply.downed&&!ply.indoor&&nearestFurn("campfire",3.5)&&ply.hp<ply.max){ply.hp=Math.min(ply.max,ply.hp+dt*1.2);if(Math.random()<dt*3)burst(ply.x,ply.y+1.2,ply.z,0xff9ec7,1,1);}
  ply.ifr-=dt;
  for(let i=weedTimers.length-1;i>=0;i--){weedTimers[i]-=dt;if(weedTimers[i]<=0){weedTimers.splice(i,1);spawnWeed();}}
  // ---- 蝴蝶 ----
  const day_=hour()>=6&&hour()<19;bfT-=dt;if(bfT<=0){bfT=4;if(butterflies.length<16)spawnButterfly();}
  for(const b of butterflies){b.g.visible=day_&&!ply.indoor;if(!b.g.visible)continue;const dx=b.tx-b.x,dz=b.tz-b.z,d=Math.hypot(dx,dz);
    if(d<0.5){const a=R(0,6.28),r=R(2,6);b.tx=b.x+Math.cos(a)*r;b.tz=b.z+Math.sin(a)*r;}else{b.x+=dx/d*b.spd*dt;b.z+=dz/d*b.spd*dt;}
    const fl=Math.sin(T*18+b.ph)*1.1;b.wl.rotation.z=fl;b.wr.rotation.z=-fl;b.y=1.1+Math.sin(T*2+b.ph)*0.35;
    b.g.position.set(b.x,H(b.x,b.z)+b.y,b.z);b.g.rotation.y=Math.atan2(dx,dz);}
  // ---- 樹、石頭 ----
  for(const t of trees){if(t.inst)treeSolo(t,t.shake>0||t.state!=='alive');
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
    if(p.g.userData.panel){const pn=p.g.userData.panel,tg=p.open?-1.7:0;pn.rotation.y+=(tg-pn.rotation.y)*Math.min(1,dt*8);}
    if(p.g.userData.flame){const f=p.g.userData.flame;f.scale.set(1+Math.sin(T*13)*0.1,1+Math.sin(T*17)*0.15,1+Math.cos(T*11)*0.1);if(Math.random()<dt*6)burst(p.x,H(p.x,p.z)+1.3,p.z,[0xffd36e,0xffa36e],1,1.2,partG,0.6);}}
  if(ghost){const[x,z]=ghostSpot();const gy=supportY(x,z);ghost.position.set(x,gy+Math.sin(T*5)*0.05+0.05,z);ghost.rotation.y=carry.ry;
    const r=ITEMS[carry.id].r*fsOf(carry.id),rr=Math.max(r*0.8,0.3);ghostOK=(r===0||!obstacles.some(o=>o.r>0&&(o.y===undefined||Math.abs(o.y-gy)<0.9)&&Math.hypot(o.x-x,o.z-z)<o.r+r*0.9))&&!hitsWall(x-rr,x+rr,z-rr,z+rr)&&Math.hypot(x-BOARD.x,z-BOARD.z)>2&&Math.hypot(x-ply.x,z-ply.z)<9;
    const mat=ghostOK?ghostOkM:ghostNoM;ghost.traverse(o=>{if(o.isMesh)o.material=mat;});}
  // ---- 果凍怪 ----
  const night=isNight(),zmin=night?36:52,cap=night?14:8;
  partyTick(dt);
  if(ply.cave){if(!caveFollower()&&monsters.filter(m=>m.dead<0&&m.cave).length<10&&Math.random()<dt*1.2)spawnCaveSlime();}
  else if(monsters.filter(m=>m.dead<0&&!m.cave).length<cap&&Math.random()<dt*0.8)spawnMonster();
  for(let i=monsters.length-1;i>=0;i--){const m=monsters[i];m.t+=dt;const c=m.c;
    if(m.spawn<1){m.spawn=Math.min(1,m.spawn+dt*2);c.m.scale.setScalar(easeOutBack(m.spawn)+0.001);}
    if(m.dead>=0){m.dead+=dt;c.m.scale.set(1+m.dead*3,Math.max(0.01,1-m.dead*3.2),1+m.dead*3);if(m.dead>0.3){scene.remove(m.g);monsters.splice(i,1);}continue;}
    m.ifr-=dt;
    if(m.flash>0){m.flash=Math.max(0,m.flash-dt*6);m.mat.emissive.setRGB(m.flash,m.flash,m.flash);}
    if(m.dot&&m.dot.t>0){m.dot.t-=dt;m.dot.acc+=dt;if(m.dot.acc>=1){m.dot.acc-=1;m.ifr=0;damageMonster(m,m.dot.d,0,0,false);burst(m.x,(m.cave?0:H(m.x,m.z))+m.y+1,m.z,m.dot.c||[0xb04a6a,0xff6f8f],5,2);}if(m.dead>=0)continue;}
    if(m.mirror){mirrorTick(m,dt);continue;}
    const stun=m.stunT>0;if(stun){m.stunT-=dt;if(Math.random()<dt*5)burst(m.x,H(m.x,m.z)+m.y+1.4*m.size,m.z,[0xffe066,0xffffff],1,1.2,partG,0.4,0);}if(m.slowT>0)m.slowT-=dt;
    const pdx=ply.x-m.x,pdz=ply.z-m.z,pd=Math.hypot(pdx,pdz)||0.01;const tg=m.cave?monTarget(m):null;const lure=allyLure(m);let dx=tg?tg.x-m.x:pdx,dz=tg?tg.z-m.z:pdz;if(lure){dx=lure.x-m.x;dz=lure.z-m.z;}const d=Math.hypot(dx,dz)||0.01;
    const aggro=m.boss?40:m.cave?16:(night?18:12)+(ply.tauntT>0?6:0);let chase=m.cave?(!!(tg||lure)&&d<aggro&&m.flash<0.3):(!ply.indoor&&!ply.cave&&d<aggro&&ply.x>zmin-6&&m.flash<0.3&&(!(ply.stealthT>0)||!!lure));if(stun)chase=false;
    if(m.y===0&&m.vy===0&&!stun){m.hop-=dt;if(m.hop<=0){m.hop=chase?R(0.15,0.35):R(0.8,2.2);m.vy=chase?(night?6:5):4;m.sqv+=4;
      if(chase){m.dir=Math.atan2(dx,dz);}else if(Math.random()<0.6)m.dir=Math.random()*6.28;else m.dir=-1;if(m.slamming)m.vy=12;}}
    let vx=0,vz=0;if(m.y>0&&m.dir>=0&&!stun){const sp=(chase?(night?4.2:3.2):1.6)*(m.spd||1)*(m.slowT>0?(m.slowF||0.6):1);vx=Math.sin(m.dir)*sp;vz=Math.cos(m.dir)*sp;}
    m.x+=(vx+m.kx)*dt;m.z+=(vz+m.kz)*dt;m.kx*=Math.pow(0.008,dt);m.kz*=Math.pow(0.008,dt);
    if(m.cave){const dx2=m.x-CAVE.x,dz2=m.z-CAVE.z,dd=Math.hypot(dx2,dz2);if(dd>CAVE.r-1.5){m.x=CAVE.x+dx2/dd*(CAVE.r-1.5);m.z=CAVE.z+dz2/dd*(CAVE.r-1.5);m.dir=Math.atan2(-dx2,-dz2);}}
    else{if(m.x<zmin){m.x=zmin;m.dir=Math.PI/2;}
    m.x=clamp(m.x,-110,110);m.z=clamp(m.z,-110,110);}
    for(const o of(m.cave?caveObs:obstacles)){if(o.r<=0||o.navOnly)continue;if(o.box){pushBox(m,o,0.6*m.size);continue;}const ox=m.x-o.x,oz=m.z-o.z,od=Math.hypot(ox,oz),r=o.r+0.6*m.size;if(od<r&&od>0.001){m.x=o.x+ox/od*r;m.z=o.z+oz/od*r;}}
    const wasAir=m.y>0;m.vy-=20*dt;m.y=Math.max(0,m.y+m.vy*dt);if(m.y===0){if(wasAir){m.sqv-=6;}m.vy=0;}
    m.sqv+=((m.y>0?0.12:0)-m.sq)*150*dt-m.sqv*10*dt;m.sq+=m.sqv*dt;const s=clamp(m.sq,-0.45,0.4);
    if(m.spawn>=1)c.m.scale.set(1-s*0.6,1+s,1-s*0.6);
    let jx=0,jz=0;if(m.shake>0){m.shake-=dt;jx=Math.sin(m.shake*90)*0.1;jz=Math.cos(m.shake*70)*0.08;}
    m.g.position.set(m.x+jx,H(m.x,m.z)+m.y,m.z+jz);if(m.dir>=0)m.g.rotation.y+=angDiff(m.g.rotation.y,m.dir)*Math.min(1,dt*8);
    m.cool-=dt;
    if(!ply.riding&&!ply.downed&&!stun&&!(ply.stealthT>0)&&!!m.cave===!!ply.cave&&!ply.sitting&&pd<1.1+m.size*0.35&&m.cool<=0&&ply.ifr<=0&&m.flash<0.3&&ply.y<(ply.sleeping?ply.y+1:(ply.cave?0:H(ply.x,ply.z))+0.8)&&!tryDodge(m)){
      if(ply.sleeping){wakeUp();toast('被吵醒了！😾');}
      m.cool=1;ply.ifr=0.9;ply.hp-=takeDmg(m.dmg||(night?2:1),m);ply.kx=pdx/pd*10;ply.kz=pdz/pd*10;ply.vy=4;ply.ground=false;SFX.hurt();P.sqv-=5;
      burst(ply.x,ply.y+0.8,ply.z,[0xff9ec7,0xffffff],8,3);hurtFX();updateHUD();
      if(ply.hp<=0){ply.hp=0;playerKO('被果凍怪打倒了… 💫');if(!ply.downed)return;}}
    if(m.cave&&!ply.cave&&Math.random()<dt*0.02){scene.remove(m.g);monsters.splice(i,1);}
  }
  // ---- 投射物 ----
  for(let i=projs.length-1;i>=0;i--){const p=projs[i];p.life-=dt;
    if(p.homing||p.kind==='orb'){const tg=p.target&&p.target.dead<0?p.target:nearestMonster(12,p);p.target=tg;if(tg){const a=Math.atan2(tg.x-p.x,tg.z-p.z),sp=Math.hypot(p.vx,p.vz);const cur=Math.atan2(p.vx,p.vz);const na=cur+angDiff(cur,a)*Math.min(1,dt*(p.kind==='star'?8:4));p.vx=Math.sin(na)*sp;p.vz=Math.cos(na)*sp;}}
    if(p.kind==='star'){const sp=Math.hypot(p.vx,p.vz);if(sp<16){p.vx*=1+dt*2;p.vz*=1+dt*2;}}
    p.x+=p.vx*dt;p.z+=p.vz*dt;if(p.hy!==undefined)p.hy+=(1.0-p.hy)*Math.min(1,dt*4);const gy=(ply.cave||ply.indoor)?0:H(p.x,p.z);p.m.position.set(p.x,(p.kind==='wave'?p.y:gy+(p.hy!==undefined?p.hy:(p.kind==='arrow'?0.9:1))),p.z);if(p.spin)p.m.rotation.x+=dt*p.spin;
    if(p.kind!=='wave')p.m.rotation.y=Math.atan2(p.vx,p.vz);else p.m.material.opacity=0.8*p.life/0.55;
    if(p.kind==='star')p.m.rotation.x+=dt*10;
    if(p.m.userData.wind&&Math.random()<dt*40)burst(p.x,p.m.position.y,p.z,SKIN_PAL.skin_wind,1,0.6,partG,0.35,0);
    if(p.fx&&Math.random()<dt*35)burst(p.x,p.m.position.y,p.z,p.fx==='eye'?SKIN_PAL.skin_eye:SKIN_PAL.skin_star,1,0.6,partG,0.4,0);
    if(p.m.userData.ice){p.m.rotation.y+=dt*8;if(Math.random()<dt*25)burst(p.x,p.m.position.y,p.z,SKIN_PAL.skin_ice,1,0.8,partG,0.4,2);}
    let done=p.life<=0;
    for(const m of monsters){if(m.dead>=0||p.hit.has(m))continue;if(Math.hypot(m.x-p.x,m.z-p.z)<0.7+m.size*0.4){p.hit.add(m);
      if(p.kind==='orb'){explode(p.x,p.z,p.dmg,p.big);done=true;break;}
      damageMonster(m,p.dmg,p.vx/Math.hypot(p.vx,p.vz),p.vz/Math.hypot(p.vx,p.vz),!!p.crit,p.wpn?W:null);if(p.fx)skinHitFX(p.fx,p.x,p.m.position.y,p.z);if(p.kind==='arrow'){SFX.arrowHit();done=true;break;}if(p.kind==='star'){done=true;break;}
      if(p.kind==='holy'){healParty(p.heal,0,9);burst(p.x,p.m.position.y,p.z,[0xffe08a,0xffffff,0x9ff0c8],10,3);if(p.pierce>0){p.pierce--;continue;}done=true;break;}
      if(p.kind==='shard'||p.kind==='bubble'){burst(p.x,p.m.position.y,p.z,p.kind==='bubble'?[0xbfe6ff,0xffffff]:[0xc8b4ff,0xffffff],6,3);if(p.kind==='bubble')SFX.bubble();done=true;break;}}}
    if(done&&p.kind==='orb'&&p.life<=0)explode(p.x,p.z,p.dmg,p.big);
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
  for(let i=trails.length-1;i>=0;i--){const r=trails[i];r.t+=dt;const s=r.t/r.dur;if(r.off){const c=Math.cos(ply.face),sn=Math.sin(ply.face);r.m.position.set(ply.x+r.off.x*c,ply.y+r.off.y,ply.z-r.off.x*sn);}else r.m.position.set(ply.x,ply.y+0.75,ply.z);if(r.follow!==undefined)r.m.rotation.y=ply.face+P.m.rotation.y+r.follow;r.m.material.opacity=0.85*(1-s);r.m.scale.setScalar(r.s0*(1+s*0.25));if(s>=1){scene.remove(r.m);r.m.material.dispose();trails.splice(i,1);}}
  for(let i=dmgs.length-1;i>=0;i--){const d=dmgs[i];d.t+=dt;d.vy-=6*dt;d.s.position.y+=d.vy*dt;d.s.material.opacity=d.t>0.6?1-(d.t-0.6)/0.3:1;
    if(d.t<0.12)d.s.scale.multiplyScalar(1+dt*3);if(d.t>0.9){scene.remove(d.s);d.s.material.map.dispose();d.s.material.dispose();dmgs.splice(i,1);}}
  // ---- UI ----
  const c=context();updateMark(c,T);if(c!==lastCtx){lastCtx=c;$('actIcon').textContent=CTX[c][0];$('actTxt').textContent=CTX[c][1];$('btnAct').classList.toggle('dim',c==='none');if(c!=='none')bump($('btnAct'),'boing');}
  hudT-=dt;if(hudT<=0){hudT=0.25;updateHUD();}
  miniT-=dt;if(miniT<=0){miniT=0.1;drawMini();}
  saveT-=dt;if(saveT<=0){saveT=15;save();}
}
let lastCtx='';
// ---------- 效能：遠處的樹隱藏、依幀率自動調整解析度 ----------
let cullT=0;function cullFar(dt){cullT-=dt;if(cullT>0)return;cullT=0.4;const cx=ply.x,cz=ply.z;
  for(const t of trees){const d=Math.hypot(t.x-cx,t.z-cz);t.root.visible=ply.cave?false:d<135;}for(const im of TREE_INST)im.visible=!ply.cave;
  for(const r of rocks)r.m.visible=r.state!=='gone'&&!ply.cave&&Math.hypot(r.x-cx,r.z-cz)<110;}
const PERF={acc:0,n:0,dpr:Math.min(devicePixelRatio,1.25),t:0};
function perfTune(rawDt){PERF.acc+=rawDt;PERF.n++;PERF.t+=rawDt;if(PERF.t<2.5)return;const avg=PERF.acc/PERF.n;PERF.acc=0;PERF.n=0;PERF.t=0;
  let d=PERF.dpr;if(avg>0.019&&d>0.75)d=Math.max(0.75,d-0.25);else if(avg<0.0125&&d<Math.min(devicePixelRatio,1.25))d=Math.min(Math.min(devicePixelRatio,1.25),d+0.25);
  if(d!==PERF.dpr){PERF.dpr=d;renderer.setPixelRatio(d);resize();}}
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
function nearestPet(r){let best=null,bd=r;for(const p of pets){if(p.stored||!!p.cave!==!!ply.cave)continue;const d=Math.hypot(p.x-ply.x,p.z-ply.z);if(d<bd){bd=d;best=p;}}return best;}
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
  for(const p of pets){p.t+=dt;const g=p.a.g;let moving=false;if(p.stored){g.visible=false;continue;}
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
    g.visible=!!p.cave===!!ply.cave&&(p.follow||Math.hypot(p.x-ply.x,p.z-ply.z)<80);p.sp.visible=g.visible&&!p.follow&&Math.hypot(ply.x-p.x,ply.z-p.z)<6;}
}

// ---------- 釣魚 ----------
let fishLine=null,bobber=null;
function startFishing(){if(tiredBlock())return;useEn(0.5);faceTo(POND.x,POND.z);const d=Math.hypot(POND.x-ply.x,POND.z-ply.z);const into=Math.min(d-1.5,(d-POND.r)+3.0);
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
