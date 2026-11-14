// ===================== skills.js：職業天賦效果、主動技能、召喚物、領域 =====================
// ---------- 音效 ----------
Object.assign(SFX,{
  strum(){const b=[392,494,587,784][(Math.random()*4)|0];[1,1.25,1.5].forEach((m,i)=>tone(b*m,.35,{type:'triangle',v:.06,t:i*.03}));},
  heal(){tone(880,.12,{v:.08});tone(1175,.16,{v:.07,t:.07});tone(1568,.2,{v:.05,t:.14});},
  cast(){tone(330,.5,{type:'triangle',v:.06,slide:660});noise(.4,{v:.04,f:2400,slide:5000});},
  skill(){tone(523,.08,{type:'square',v:.05});tone(784,.12,{type:'square',v:.05,t:.06});noise(.15,{v:.06,f:3000});},
  stealth(){tone(900,.3,{v:.06,slide:300});noise(.3,{v:.05,f:1500,slide:400});}
});

// ---------- 數值修正 ----------
const aspd=w=>w==='spear'?1-[0,0.12,0.25][TV('w_swift')]:w==='sword'?1-0.1*TV('w_rush'):w==='bow'?1-0.15*TV('r_rapid'):1;
const enMul=()=>1-[0,0.2,0.35,0.5][TV('m_mana')];
function atkMul(){let m=1;if(ply.coinMode)m*=1+[0,0.4,0.7,1][TV('c_rain')];if(ply.tempoT>0)m*=1+(ply.tempoV||0);return m;}
const moveMul=()=>(1+0.05*TV('r_swift'))*(ply.chan?0.55:1)*(ply.cast?0.4:1);
const maxHP=()=>10+(ply.lv-1)+[0,3,6,10][TV('w_iron')]+3*TV('p_faith');
function recalcMax(){ply.max=maxHP();ply.hp=Math.min(ply.hp,ply.max);}
const reviveDur=()=>10*(1-[0,0.4,0.7][TV('p_revive')]);
const healMul=()=>1+[0,0.15,0.3,0.5][TV('p_grace')];
const dmgNumP=t=>dmgNum(ply.x,ply.y+2.3,ply.z,t,true);
function takeDmg(raw,m){let k=1;if(ply.weapon==='shield')k*=1-(0.6+0.05*TV('p_wall'));k*=1-0.1*TV('w_guard');if(ply.coinMode)k*=1-0.2*TV('c_bribe');if(ply.tauntT>0)k*=0.9;
  const d=raw*k;if(ply.weapon==='shield')ring(ply.x,ply.y+0.9,ply.z,0x8fc8f0,0.4,1.3,0.25);
  if(ply.weapon==='greatsword'&&TV('w_counter')){ply.counterT=1.5;burst(ply.x,ply.y+1.4,ply.z,[0xffd36e,0xffffff],6,2);}
  if(m&&m.dead<0&&ply.weapon==='shield'&&TV('p_thorns')){const mm=m;setTimeout(()=>{if(mm.dead<0){mm.ifr=0;damageMonster(mm,rd(weaponAtk(true)*TV('p_thorns')),mm.x-ply.x,mm.z-ply.z,false);burst(mm.x,(mm.cave?0:H(mm.x,mm.z))+1,mm.z,[0x8fdc8f,0xffffff],8,3);}},30);}
  if(TV('r_escape')&&(ply.hp-d)/ply.max<0.3&&ply.hp-d>0&&performance.now()>(ply.escCD||0)){ply.escCD=performance.now()+30000;setTimeout(()=>{startStealth(2,false);toast('🫥 脫身術！');},10);}
  return d;}
function healMe(h,e,quiet){if(ply.downed)return;h*=healMul();e=(e||0)*healMul();const before=ply.hp;ply.hp=Math.min(ply.max,ply.hp+h);ply.en=Math.min(100,ply.en+e);
  if(!quiet)healFx(ply.hp>before,e>0);updateHUD();}
// 回復光粒子：綠色＝生命、藍色＝精神，在身邊繞一圈往上飄
function healFx(hp,en){const n=14;for(let i=0;i<n;i++){const useEn=hp&&en?i%2===1:!hp;if(!hp&&!en)return;const col=useEn?[0x7fc8ff,0xbfe6ff]:[0x7fe0a0,0xc8ffd8];const a=i/n*Math.PI*2+R(-0.2,0.2),r=R(0.75,1.05);
  setTimeout(()=>burst(ply.x+Math.cos(a)*r,ply.y+R(0.05,0.4),ply.z+Math.sin(a)*r,col,1,0.35,partG,R(0.9,1.3),-R(3.5,5.5)),i*25);}}
function healParty(h,e,r){healMe(h,e);if(inParty())netPost({t:'heal',x:+ply.x.toFixed(1),z:+ply.z.toFixed(1),r,h,e,ar:ply.cave?'cave':'out'},true);}
function onHealMsg(o){if((o.ar==='cave')!==!!ply.cave)return;if(Math.hypot(ply.x-o.x,ply.z-o.z)>(+o.r||8))return;healMe(+o.h||0,+o.e||0);}
function onBuffMsg(o){if((o.ar==='cave')!==!!ply.cave)return;if(Math.hypot(ply.x-o.x,ply.z-o.z)>(+o.r||8))return;ply.tempoT=+o.d||1.5;ply.tempoV=Math.min(0.4,+o.v||0);}

// ---------- 命中前後效果 ----------
const coinG=new THREE.CylinderGeometry(0.12,0.12,0.04,10);let coinPayT=0;
function coinFx(x,y,z,n=6){burst(x,y,z,[0xffd36e,0xffe9a0,0xffc23a],n,5,coinG,0.8,16);}
function preHit(m,dmg){let crit=false;const y=(m.cave?0:H(m.x,m.z))+m.y+1;
  if(ply.ambush){dmg*=3;crit=true;ply.ambush=false;endStealth();dmgNumP('偷襲！');}
  if(ply.coinMode){const now=performance.now();
    if(TV('c_jackpot')&&Math.random()<0.05*TV('c_jackpot')){dmg*=5;crit=true;coinFx(m.x,y,m.z,26);SFX.coin(10);dmgNum(m.x,y+1,m.z,'JACKPOT!',true,'#e0a020');}
    if(now>coinPayT){coinPayT=now+150;const cost=TV('c_rain')>=3?1:2;if(ply.coins>=cost){ply.coins-=cost;coinFx(m.x,y,m.z);if(Math.random()<0.5)SFX.coin(4);}else{setCoinMode(false);toast('💸 金幣不夠了，撒錢模式關閉');}}}
  return[Math.max(1,Math.round(dmg)),crit];}
function postHit(m,dmg,o){if(o.stun)m.stunT=Math.max(m.stunT||0,o.stun*(m.boss?0.3:1));if(o.slow){m.slowT=o.slow;m.slowF=o.slowF||0.6;}if(o.dot)m.dot={t:o.dot[0],d:o.dot[1],acc:0,c:o.dotC};}

// ---------- 投射物 ----------
const shardGeo=new THREE.OctahedronGeometry(0.13);
function projBase(kind,m,x,y,z,dir,spd,life,dmg,extra){const gy=(ply.cave||ply.indoor)?0:H(x,z);m.position.set(x,y,z);scene.add(m);
  projs.push(Object.assign({kind,m,x,hy:y-gy,z,vx:Math.sin(dir)*spd,vz:Math.cos(dir)*spd,life,dmg,hit:new Set(),homing:true},extra||{}));}
function fireShard(x,y,z,dir,dmg,wpn,col){const m=mk(shardGeo,basic(col||0xc8b4ff));m.scale.set(0.8,1.8,0.8);const t=nearestMonster(14,{x,z});if(t)dir=Math.atan2(t.x-x,t.z-z);projBase('shard',m,x,y,z,dir,18,1.3,dmg,{wpn,target:t,spin:12});}
function fireHoly(dir,dmg){const o=weaponTip();const m=new THREE.Group();m.add(mk(new THREE.SphereGeometry(0.2,12,10),basic(0xfff3b0)));m.add(mk(new THREE.SphereGeometry(0.38,12,10),basic(0xffe08a,{transparent:true,opacity:0.35,depthWrite:false})));
  const t=nearestMonster(14);if(t)dir=Math.atan2(t.x-ply.x,t.z-ply.z);projBase('holy',m,o.x,o.y,o.z,dir,9*(TV('p_smite')?1.3:1),2.2,dmg,{wpn:1,target:t,heal:1+0.5*TV('p_bless'),pierce:TV('p_holy')});}
function fireBubble(x,y,z,dmg){const m=mk(new THREE.SphereGeometry(0.22,12,10),basic(0xbfe6ff,{transparent:true,opacity:0.6,depthWrite:false}));const t=nearestMonster(14,{x,z});const dir=t?Math.atan2(t.x-x,t.z-z):0;projBase('bubble',m,x,y,z,dir,11,1.6,dmg,{target:t});}

// ---------- 音符特效 ----------
const NOTE_TEX=['♪','♫','♬'].map(ch=>canvasTex(64,64,g=>{g.clearRect(0,0,64,64);g.font='900 48px sans-serif';g.textAlign='center';g.textBaseline='middle';g.lineWidth=6;g.strokeStyle='#fff';g.strokeText(ch,32,34);g.fillStyle='#ff7fae';g.fillText(ch,32,34);}));
const notes=[];
function spawnNotes(x,y,z,n){for(let i=0;i<n;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:NOTE_TEX[i%3],transparent:true,depthWrite:false}));s.scale.setScalar(0.55);s.position.set(x+R(-0.8,0.8),y+R(-0.2,0.3),z+R(-0.8,0.8));scene.add(s);notes.push({s,t:0,vx:R(-0.6,0.6),vz:R(-0.6,0.6)});}}

// ---------- 掉落物（通用：雪、箭雨、隕石） ----------
const fallers=[];
function addFaller(m,x,y,z,vy,life,onEnd){m.position.set(x,y,z);scene.add(m);fallers.push({m,vy,life,onEnd});}

// ---------- 範圍領域 ----------
const zones=[];
function zoneRing(x,y,z,r,col){const g=new THREE.Group();const rg=mk(new THREE.RingGeometry(0.93,1,56),basic(col,{transparent:true,opacity:0.85,side:THREE.DoubleSide,depthWrite:false}));rg.rotation.x=-Math.PI/2;g.add(rg);
  const dk=mk(new THREE.CircleGeometry(1,40),basic(col,{transparent:true,opacity:0.18,side:THREE.DoubleSide,depthWrite:false}));dk.rotation.x=-Math.PI/2;g.add(dk);g.scale.setScalar(r);g.position.set(x,y+0.08,z);scene.add(g);return g;}
function addZone(o){o.t=0;o.acc=0;o.g=zoneRing(o.x,o.cave?0:H(o.x,o.z),o.z,o.r,o.col);o.cave=!!ply.cave;zones.push(o);return o;}
const gyAt=(x,z)=>ply.cave?0:H(x,z);
function aimPoint(dist,range){const t=nearestMonster(range||14);if(t){faceTo(t.x,t.z);return{x:t.x,z:t.z};}return{x:ply.x+Math.sin(ply.face)*dist,z:ply.z+Math.cos(ply.face)*dist};}
function hitArea(x,z,r,dmg,opt,crit){let n=0;for(const m of monsters){if(m.dead>=0||!!m.cave!==!!ply.cave)continue;const dx=m.x-x,dz=m.z-z,d=Math.hypot(dx,dz)||0.01;if(d<r+m.size*0.3){m.ifr=0;damageMonster(m,dmg,dx/d,dz/d,!!crit,opt);n++;}}return n;}

// ---------- 主動技能 ----------
const SKILLS={
  w_leap:{w:'spear',cd:8,en:6,go:sLeap},
  w_quake:{w:'greatsword',cd:10,en:8,cast:0.6,go:sQuake},
  r_rain:{w:'bow',cd:12,en:8,go:sRain},
  r_stealth:{w:'dagger',cd:15,en:6,go:()=>startStealth([0,3,4,5][TV('r_stealth')],true)},
  r_blink:{w:'dagger',cd:()=>TV('r_blink')>1?4:6,en:4,go:sBlink},
  r_song:{w:'lute',cd:14,en:5,go:sSong},
  m_blizzard:{w:'staff',cd:16,en:12,cast:1.5,go:sBlizzard},
  m_meteor:{w:'staff',cd:20,en:16,cast:()=>[0,2.5,2.2,1.8][TV('m_meteor')],go:sMeteor},
  m_crystal:{w:'orb',cd:25,en:10,go:sCrystal},
  m_sprite:{w:'orb',cd:35,en:10,go:sSprite},
  c_rain:{toggle:1,cd:0.8,en:0,go:()=>setCoinMode(!ply.coinMode)},
  a_golem:{cd:40,en:5,cost:{stone:3},go:sGolem},
  a_jelly:{cd:30,en:5,cost:{weed:3},go:sJelly},
  p_sanct:{w:'book',cd:18,en:10,cast:1,go:sSanct},
  p_taunt:{w:'shield',cd:15,en:6,go:sTaunt},
  p_guardf:{w:'shield',cd:20,en:10,cast:1.2,go:sGuardF}};
const SK_KEYS=['K','L','U','I','O'];
const cdLeft={};
const val=v=>typeof v==='function'?v():v;
const SK_MAX=2;
function skillList(){ply.skEq=(ply.skEq||[]).filter(k=>SKILLS[k]&&TV(k)>0).slice(0,SK_MAX);return ply.skEq;}
const skWrong=k=>false;// 不用拿對應武器，有攜帶就能用
function toggleEquip(k){skillList();const i=ply.skEq.indexOf(k);if(i>=0){ply.skEq.splice(i,1);toast(`卸下了「${TALENTS[k].n}」`);}else{if(ply.skEq.length>=SK_MAX){SFX.deny();toast(`最多只能裝備 ${SK_MAX} 招技能，先卸下一招吧`);return false;}ply.skEq.push(k);toast(`裝備了「${TALENTS[k].n}」！技能按鈕在攻擊鍵旁邊`);}SFX.click();renderSkillBar(true);save();return true;}
function useSkill(k){const S=SKILLS[k];if(!S||!TV(k))return;
  if(!started||paused||ply.downed||ply.sleeping||ply.sitting||ply.riding||carry||ply.reviving||ply.leap){SFX.deny();return;}
  if(k==='r_song'&&ply.chan){endChan();return;}
  if(ply.cast||ply.chan){SFX.deny();return;}
  if(skWrong(k)){SFX.deny();showHbLabel(`${TALENTS[k].i} 要拿著${ITEMS[SKILLS[k].w].i}${WNAME[SKILLS[k].w]}才能用「${TALENTS[k].n}」`);return;}
  if((cdLeft[k]||0)>0){SFX.deny();showHbLabel(`${TALENTS[k].i} ${TALENTS[k].n} 冷卻中… ${Math.ceil(cdLeft[k])} 秒`);return;}
  if(S.cost){for(const[it,n]of Object.entries(S.cost))if((inv[it]||0)<n){SFX.deny();toast(`${TALENTS[k].i} 需要 ${ITEMS[it].i}${ITEMS[it].n} ×${n} 才能煉成`);return;}for(const[it,n]of Object.entries(S.cost))inv[it]-=n;renderHotbar();}
  if(ply.atkT>=0)ply.atkT=-1;
  useEn(S.en*enMul());cdLeft[k]=val(S.cd)*(1-0.1*TV('m_wisdom'));
  if(S.cast){ply.cast={k,t:0,dur:val(S.cast)*(1-0.2*TV('m_focus')),go:S.go};SFX.cast();renderSkillBar(true);return;}
  SFX.skill();S.go();renderSkillBar(true);}
function endChan(){ply.chan=null;}

function sLeap(){const t=nearestMonster(9);let tx,tz;if(t){tx=t.x;tz=t.z;faceTo(tx,tz);}else{tx=ply.x+Math.sin(ply.face)*6;tz=ply.z+Math.cos(ply.face)*6;}
  ply.leap={t:0,dur:0.68,sx:ply.x,sz:ply.z,tx,tz};ply.vy=8.4;ply.ground=false;ply.ifr=0.8;P.sqv+=6;puff(ply.x,ply.y,ply.z,0xf6f0e6,1.4);}
function leapLand(){const rk=TV('w_leap'),r=3+0.6*(rk-1),A=weaponAtk(true);const gy=gyAt(ply.x,ply.z);
  hitArea(ply.x,ply.z,r,rd(A*[0,3,4][rk]),{src:'wpn',kb:rk>1?1.8:1.2,stun:0.4},true);ring(ply.x,gy+0.1,ply.z,0xffd36e,0.4,r,0.45);ring(ply.x,gy+0.15,ply.z,0xffffff,0.3,r*0.7,0.35);
  burst(ply.x,gy+0.4,ply.z,[0xffffff,0xffd36e,0xd6cdee],22,7);for(let i=0;i<6;i++)puff(ply.x+R(-1.5,1.5),gy,ply.z+R(-1.5,1.5),0xf6f0e6,1.5);SFX.boom();hitStop=0.12;P.sqv-=8;}
function sQuake(){const rk=TV('w_quake'),r=[0,4,4.5,5][rk],A=weaponAtk(true);const gy=gyAt(ply.x,ply.z);
  hitArea(ply.x,ply.z,r,rd(A*[0,3,4,5][rk]*(1+0.15*TV('w_heavy'))),{src:'wpn',kb:1.7,stun:0.6+0.6*TV('w_launch')},true);
  ring(ply.x,gy+0.1,ply.z,0xffb36e,0.5,r,0.5);ring(ply.x,gy+0.15,ply.z,0xffffff,0.3,r*0.75,0.4);burst(ply.x,gy+0.4,ply.z,[0xb9b0c4,0x8a8296,0xffd36e],30,9,cubeG);
  for(let i=0;i<10;i++){const a=i/10*6.28;puff(ply.x+Math.cos(a)*r*0.7,gy,ply.z+Math.sin(a)*r*0.7,0xe6dccf,1.6);}SFX.boom();setTimeout(()=>SFX.boom(),90);hitStop=0.18;P.sqv-=10;}
function sRain(){const rk=TV('r_rain'),p=aimPoint(6,16),A=weaponAtk(true);addZone({kind:'rain',x:p.x,z:p.z,r:3+0.8*(rk-1),dur:3,tick:0.25,dmg:rd(A*[0,0.6,0.9][rk]),col:0xa8f0c0});SFX.bow();}
function sBlink(){const L=[0,6,9][TV('r_blink')],d=0.14;ply.dashT=d;ply.dvx=Math.sin(ply.face)*L/d;ply.dvz=Math.cos(ply.face)*L/d;ply.ifr=Math.max(ply.ifr,0.45);
  for(let i=0;i<5;i++)setTimeout(()=>puff(ply.x,ply.y+0.4,ply.z,0xd8e8ff,1.1),i*25);burst(ply.x,ply.y+0.8,ply.z,[0xd8e8ff,0xffffff],10,4);SFX.stealth();}
const ghostMat=basic(0xcfe0ff,{transparent:true,opacity:0.28,depthWrite:false});
function startStealth(sec,ambush){ply.stealthT=sec;ply.ambush=!!ambush;if(!P.g.userData.ghost){P.g.userData.ghost=1;P.g.traverse(o=>{if(o.isMesh){o.userData.m0=o.material;o.material=ghostMat;}});}
  puff(ply.x,ply.y+0.6,ply.z,0xd8e8ff,1.6);SFX.stealth();showHbLabel(`👻 隱身 ${sec} 秒${ambush?'・下一擊 ×3':''}`);}
function endStealth(){ply.stealthT=0;ply.ambush=false;if(P&&P.g.userData.ghost){P.g.userData.ghost=0;P.g.traverse(o=>{if(o.isMesh&&o.userData.m0){o.material=o.userData.m0;o.userData.m0=null;}});puff(ply.x,ply.y+0.6,ply.z,0xd8e8ff,1.2);}}
function sSong(){ply.chan={k:'r_song',t:0,dur:6,acc:0.99};showHbLabel('🎶 演奏中…再按一次技能可以停止');}
function sBlizzard(){const rk=TV('m_blizzard'),p=aimPoint(6,14),A=weaponAtk(true);addZone({kind:'bliz',x:p.x,z:p.z,r:5,dur:5,tick:0.5,dmg:rd(A*[0,0.8,1.1,1.4][rk]),col:0xbfe6ff});SFX.magic();}
function sMeteor(){const rk=TV('m_meteor'),p=aimPoint(7,16),A=weaponAtk(true);const gy=gyAt(p.x,p.z);
  const m=new THREE.Group();m.add(mk(new THREE.DodecahedronGeometry(1.1,1),toon(0x8a4a3a,{emissive:0x7a2a10})));m.add(mk(new THREE.SphereGeometry(1.6,14,10),basic(0xff8a3a,{transparent:true,opacity:0.35,depthWrite:false})));
  const tgt=zoneRing(p.x,gy,p.z,4.5,0xff6a3a);
  addFaller(m,p.x-4,gy+20,p.z-4,-34,0.6,()=>{scene.remove(tgt);const n=hitArea(p.x,p.z,4.5,rd(A*[0,6,8,10][rk]),{src:'wpn',kb:1.8,stun:0.5},true);
    ring(p.x,gy+0.1,p.z,0xff8a3a,0.5,5.5,0.6);ring(p.x,gy+0.15,p.z,0xffe08a,0.3,4,0.5);burst(p.x,gy+0.6,p.z,[0xff6a2a,0xffb347,0xffe08a,0x8a4a3a],40,11);
    for(let i=0;i<10;i++)puff(p.x+R(-3,3),gy,p.z+R(-3,3),0xd8c8c0,2);SFX.boom();setTimeout(()=>SFX.boom(),120);hitStop=0.22;});
  m.userData.meteor=1;m.userData.dx=4/0.6;m.userData.dz=4/0.6;}
function sSanct(){const rk=TV('p_sanct');addZone({kind:'heal',x:ply.x,z:ply.z,r:4,dur:[0,8,10,12][rk],tick:1,h:[0,1,1.5,2][rk],e:0,col:0xffe08a});SFX.heal();}
function sGuardF(){const rk=TV('p_guardf');addZone({kind:'heal',x:ply.x,z:ply.z,r:4.5,dur:10,tick:1,h:[0,1,1.5,2][rk],e:[0,2,3,4][rk],col:0x8fdcb4});SFX.heal();}
function sTaunt(){ply.tauntT=[0,6,9][TV('p_taunt')];const gy=ply.y;ring(ply.x,gy+0.15,ply.z,0xff5a5a,0.5,10,0.7);ring(ply.x,gy+0.2,ply.z,0xffb36e,0.4,7,0.55);ring(ply.x,gy+0.25,ply.z,0xffffff,0.3,4.5,0.45);
  setTimeout(()=>ring(ply.x,ply.y+0.15,ply.z,0xff5a5a,0.6,12,0.8),180);ring(ply.x,gy+1.2,ply.z,0xff6a6a,0.2,2.4,0.5);burst(ply.x,gy+1.4,ply.z,[0xff5a5a,0xffb36e,0xffffff],30,8);
  for(let i=0;i<16;i++){const a=i/16*6.28;burst(ply.x+Math.cos(a)*1.1,gy+0.2,ply.z+Math.sin(a)*1.1,[0xff5a5a,0xff9e6e],1,0.5,partG,1.0,-9);}SFX.thud();SFX.boom();P.sqv+=8;hitStop=Math.max(hitStop,0.08);
  for(const m of monsters){if(m.dead<0&&!!m.cave===!!ply.cave&&Math.hypot(m.x-ply.x,m.z-ply.z)<10){m.dir=Math.atan2(ply.x-m.x,ply.z-m.z);m.hop=0;}}}
let coinAura=null;
function setCoinMode(on){ply.coinMode=on;if(on&&!coinAura){coinAura=new THREE.Group();for(let i=0;i<6;i++){const c=mk(coinG,toon(0xffd36e,{emissive:0x553300}),Math.cos(i/6*6.28)*1.05,0,Math.sin(i/6*6.28)*1.05);c.rotation.z=Math.PI/2;coinAura.add(c);}scene.add(coinAura);}
  if(coinAura)coinAura.visible=on;if(on){SFX.coin(8);coinFx(ply.x,ply.y+1.2,ply.z,14);showHbLabel(`💸 撒錢模式開啟！攻擊力 +${[0,40,70,100][TV('c_rain')]}%`);}else showHbLabel('💸 撒錢模式關閉');renderSkillBar(true);}

// ---------- 召喚物 ----------
const allies=[];
function addAlly(a){a.t=0;a.cool=R(0.2,0.6);a.cave=!!ply.cave;scene.add(a.g);allies.push(a);ring(a.x,gyAt(a.x,a.z)+0.1,a.z,0xffd36e,0.4,2,0.5);burst(a.x,gyAt(a.x,a.z)+1,a.z,[0xffd36e,0xffffff,0xc8b4ff],18,5);return a;}
function removeAlly(a){const i=allies.indexOf(a);if(i<0)return;allies.splice(i,1);scene.remove(a.g);puff(a.x,gyAt(a.x,a.z)+0.6,a.z,0xf6f0e6,1.6);burst(a.x,gyAt(a.x,a.z)+1,a.z,[0xffffff,0xd6cdee],10,3);}
function limitAllies(kind,max){const L=allies.filter(a=>a.kind===kind);while(L.length>=max){removeAlly(L.shift());}}
const sumMul=()=>1+0.3*TV('a_master'),sumDmg=()=>1+0.2*TV('a_master');
function makeGolemVis(){const g=new THREE.Group(),st=toon(0xb0a8bc),dk=toon(0x8a8296),moss=toon(0x8fcf7a);const body=new THREE.Group();g.add(body);
  const t=mk(new THREE.DodecahedronGeometry(1,1),st,0,1.6,0);t.scale.set(1.15,1,0.9);body.add(t);const h=mk(new THREE.DodecahedronGeometry(0.5,1),st,0,2.75,0.15);body.add(h);
  for(const s of[-1,1]){body.add(mk(new THREE.SphereGeometry(0.08,8,6),basic(0x8ff0ff),s*0.18,2.8,0.58));const arm=new THREE.Group();arm.position.set(s*1.25,2.0,0);
    arm.add(mk(new THREE.DodecahedronGeometry(0.38,0),dk,0,-0.35,0));arm.add(mk(new THREE.DodecahedronGeometry(0.48,0),st,0,-0.95,0.1));body.add(arm);g.userData['arm'+(s<0?'L':'R')]=arm;
    body.add(mk(new THREE.BoxGeometry(0.55,0.75,0.6),dk,s*0.5,0.4,0));}
  const ms=mk(new THREE.SphereGeometry(0.35,8,6),moss,-0.45,2.45,0.3);ms.scale.set(1,0.4,1);body.add(ms);g.userData.body=body;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
function sGolem(){const rk=TV('a_golem');limitAllies('golem',TV('a_twin')?2:1);const x=ply.x+Math.sin(ply.face)*2.2,z=ply.z+Math.cos(ply.face)*2.2;
  addAlly({kind:'golem',g:makeGolemVis(),x,z,face:ply.face,life:[0,20,25,30][rk]*sumMul(),dmgK:[0,1.5,2,2.5][rk]*sumDmg(),punch:0});toast('🗿 石巨人煉成！');SFX.thud();}
function makeJellyVis(){const g=new THREE.Group();const b=new THREE.Group();g.add(b);const bell=mk(new THREE.SphereGeometry(0.6,20,12,0,Math.PI*2,0,Math.PI/2),basic(0xff9ed6,{transparent:true,opacity:0.7,depthWrite:false}),0,0,0);bell.scale.y=0.85;b.add(bell);
  b.add(mk(new THREE.SphereGeometry(0.3,12,8),basic(0xffd6f0),0,0.12,0));for(const s of[-1,1])b.add(mk(new THREE.SphereGeometry(0.05,8,6),basic(0x5a3a5a),s*0.18,0.25,0.5));
  const tl=[];for(let i=0;i<6;i++){const a=i/6*6.28;const t=mk(new THREE.CylinderGeometry(0.03,0.015,0.9,5),basic(0xffc4e8,{transparent:true,opacity:0.8}),Math.cos(a)*0.32,-0.45,Math.sin(a)*0.32);b.add(t);tl.push(t);}g.userData.tl=tl;g.userData.b=b;return g;}
function sJelly(){const rk=TV('a_jelly');limitAllies('jelly',TV('a_twin')?2:1);addAlly({kind:'jelly',g:makeJellyVis(),x:ply.x-Math.sin(ply.face)*1.5,z:ply.z-Math.cos(ply.face)*1.5,life:25*sumMul(),dmgK:[0,0.8,1.1,1.4][rk]*sumDmg(),rate:rk>=3?0.9:1.2,ph:R(0,6)});toast('🪼 泡泡水母煉成！');SFX.bubble();}
function sCrystal(){for(const a of allies.filter(a=>a.kind==='crystal'))removeAlly(a);const rk=TV('m_crystal'),res=TV('m_resonance');
  for(let i=0;i<rk;i++){const g=new THREE.Group();const c=mk(new THREE.OctahedronGeometry(0.28),basic(0xc8b4ff,{transparent:true,opacity:0.9}));c.scale.y=1.6;g.add(c);g.add(mk(new THREE.OctahedronGeometry(0.12),basic(0xffffff)));
    addAlly({kind:'crystal',g,x:ply.x,z:ply.z,life:20+10*res,ph:i/rk*Math.PI*2,rate:0.8/(1+0.25*res)});}toast(`🔷 召喚了 ${rk} 顆水晶護衛`);}
function makeSpriteVis(){const c=makeCritter({species:'lobster'},false);const g=new THREE.Group();c.g.scale.setScalar(0.34);g.add(c.g);
  const wm=basic(0xffffff,{transparent:true,opacity:0.75,side:THREE.DoubleSide,depthWrite:false});const wings=[];for(const s of[-1,1]){const w=mk(new THREE.SphereGeometry(0.09,10,6),wm,s*0.11,0.42,-0.24);w.scale.set(1,1.4,0.15);w.rotation.z=s*0.6;g.add(w);wings.push(w);}
  g.userData.wings=wings;g.userData.c=c;return g;}
function sSprite(){for(const a of allies.filter(a=>a.kind==='sprite'))removeAlly(a);const rk=TV('m_sprite');addAlly({kind:'sprite',g:makeSpriteVis(),x:ply.x,z:ply.z,life:30,h:[0,1,1.5,2][rk],e:[0,2,3,4][rk],ph:R(0,6),rate:2});toast('🧚 龍蝦小精靈來幫忙了！');SFX.heal();}
function allyLure(m){for(const a of allies){if(a.kind!=='golem'||a.cave!==!!m.cave)continue;if(Math.hypot(a.x-m.x,a.z-m.z)<10)return a;}return null;}
function nearMon(x,z,r){let b=null,bd=r;for(const m of monsters){if(m.dead>=0||m.spawn<1||!!m.cave!==!!ply.cave)continue;const d=Math.hypot(m.x-x,m.z-z);if(d<bd){bd=d;b=m;}}return b;}
function updateAllies(dt,T){for(let i=allies.length-1;i>=0;i--){const a=allies[i];a.t+=dt;a.cool-=dt;
    if(a.t>a.life||a.cave!==!!ply.cave&&a.kind!=='golem'&&a.kind!=='jelly'){removeAlly(a);continue;}
    if(a.cave!==!!ply.cave){a.cave=!!ply.cave;a.x=ply.x+R(-2,2);a.z=ply.z+R(-2,2);}
    if(Math.hypot(a.x-ply.x,a.z-ply.z)>26){a.x=ply.x+R(-2,2);a.z=ply.z+R(-2,2);}
    const fade=a.life-a.t<2?(Math.sin(a.t*20)>0?1:0.6):1;
    if(a.kind==='golem'){const t=nearMon(a.x,a.z,9)||nearMon(ply.x,ply.z,9);let tx,tz,arrive;if(t){tx=t.x;tz=t.z;arrive=1.9+t.size*0.3;}else{tx=ply.x-Math.sin(ply.face)*2.6;tz=ply.z-Math.cos(ply.face)*2.6;arrive=0.8;}
      const dx=tx-a.x,dz=tz-a.z,d=Math.hypot(dx,dz)||0.01;let mv=false;if(d>arrive){const sp=Math.min(d,t?5:6)*dt;a.x+=dx/d*sp;a.z+=dz/d*sp;mv=true;}a.face+=angDiff(a.face,Math.atan2(dx,dz))*Math.min(1,dt*6);
      if(t&&d<=arrive+0.4&&a.cool<=0){a.cool=1.1;a.punch=0.35;const A=weaponAtk(true);const px=a.x+Math.sin(a.face)*1.6,pz=a.z+Math.cos(a.face)*1.6;
        hitArea(px,pz,2.4,rd(A*a.dmgK),{kb:1.4,stun:0.3},false);ring(px,gyAt(px,pz)+0.1,pz,0xd6cdee,0.3,2.4,0.35);burst(px,gyAt(px,pz)+0.4,pz,[0xb0a8bc,0xffffff],12,5,cubeG);SFX.thud();}
      const b=a.g.userData.body;a.punch=Math.max(0,a.punch-dt);const pk=a.punch>0?Math.sin(a.punch/0.35*Math.PI):0;a.g.userData.armR.rotation.x=-pk*1.8;a.g.userData.armL.rotation.x=mv?Math.sin(T*6)*0.4:0;
      b.position.y=mv?Math.abs(Math.sin(T*6))*0.12:Math.sin(T*2)*0.04;b.rotation.z=mv?Math.sin(T*6)*0.05:0;a.g.position.set(a.x,gyAt(a.x,a.z),a.z);a.g.rotation.y=a.face;a.g.visible=fade>0.7;}
    else if(a.kind==='jelly'){const ox=ply.x+Math.sin(a.t*0.6+a.ph)*2.4,oz=ply.z+Math.cos(a.t*0.6+a.ph)*2.4;a.x+=(ox-a.x)*Math.min(1,dt*2);a.z+=(oz-a.z)*Math.min(1,dt*2);
      const y=gyAt(a.x,a.z)+2.3+Math.sin(T*2+a.ph)*0.25;a.g.position.set(a.x,y,a.z);const b=a.g.userData.b;b.scale.set(1+Math.sin(T*4)*0.08,1-Math.sin(T*4)*0.1,1+Math.sin(T*4)*0.08);a.g.userData.tl.forEach((t,j)=>t.rotation.x=Math.sin(T*4+j)*0.35);
      const t=nearMon(a.x,a.z,13);if(t&&a.cool<=0){a.cool=a.rate;fireBubble(a.x,y-0.2,a.z,rd(weaponAtk(true)*a.dmgK));}a.g.visible=fade>0.7;}
    else if(a.kind==='crystal'){const ang=T*1.6+a.ph,r=1.7;a.x=ply.x+Math.cos(ang)*r;a.z=ply.z+Math.sin(ang)*r;const y=ply.y+1.7+Math.sin(T*3+a.ph)*0.15;a.g.position.set(a.x,y,a.z);a.g.rotation.y=T*3;
      const t=nearMon(a.x,a.z,12);if(t&&a.cool<=0){a.cool=a.rate;fireShard(a.x,y,a.z,0,rd(weaponAtk(true)*0.6*(1+0.25*TV('m_shard'))),0,0xd8c8ff);}a.g.visible=fade>0.7;}
    else if(a.kind==='sprite'){const ang=T*0.9+a.ph;const ox=ply.x+Math.cos(ang)*1.1,oz=ply.z+Math.sin(ang)*1.1;a.x+=(ox-a.x)*Math.min(1,dt*4);a.z+=(oz-a.z)*Math.min(1,dt*4);
      a.g.position.set(a.x,ply.y+2.1+Math.sin(T*3)*0.15,a.z);a.g.rotation.y=Math.atan2(ply.x-a.x,ply.z-a.z)+0.6;const fl=Math.sin(T*28)*0.6;a.g.userData.wings[0].rotation.y=fl;a.g.userData.wings[1].rotation.y=-fl;
      if(a.cool<=0){a.cool=a.rate;healParty(a.h,a.e,8);burst(a.x,a.g.position.y,a.z,[0xff9ec7,0x9ff0c8,0xffffff],8,2);SFX.heal();}a.g.visible=fade>0.7;}}}

// ---------- 每幀更新 ----------
let skUiT=0,investT=0;
function skillTick(dt,T){
  for(const k in cdLeft)if(cdLeft[k]>0)cdLeft[k]-=dt;
  if(ply.counterT>0)ply.counterT-=dt;if(ply.tempoT>0)ply.tempoT-=dt;
  if(ply.tauntT>0){ply.tauntT-=dt;if(Math.random()<dt*3)ring(ply.x,ply.y+0.1,ply.z,0xff6a6a,0.4,3,0.6);if(Math.random()<dt*14){const a=R(0,6.28);burst(ply.x+Math.cos(a)*0.9,ply.y+0.3,ply.z+Math.sin(a)*0.9,[0xff5a5a,0xffb36e],1,0.4,partG,0.8,-6);}}
  if(ply.stealthT>0){ply.stealthT-=dt;if(ply.stealthT<=0)endStealth();}
  if(TV('p_faith')&&!ply.downed&&ply.hp<ply.max)ply.hp=Math.min(ply.max,ply.hp+dt*0.1*TV('p_faith'));
  if(coinAura){coinAura.visible=!!ply.coinMode;if(ply.coinMode){coinAura.position.set(ply.x,ply.y+1.1+Math.sin(T*3)*0.1,ply.z);coinAura.rotation.y=T*2.4;if(Math.random()<dt*8)burst(ply.x+R(-0.8,0.8),ply.y+R(0.6,1.8),ply.z+R(-0.8,0.8),[0xffd36e,0xfff3b0],1,0.8,partG,0.5,-2);}}
  // 詠唱
  if(ply.cast){const c=ply.cast;c.t+=dt;if(ply.downed||ply.riding||ply.sleeping){ply.cast=null;}else{if(Math.random()<dt*20)burst(ply.x+R(-0.7,0.7),ply.y+R(0.2,1.8),ply.z+R(-0.7,0.7),[0xc8b4ff,0xffd36e,0xffffff],1,1,partG,0.5,-3);
      if(c.t>=c.dur){ply.cast=null;SFX.skill();c.go();}}}
  // 演奏
  if(ply.chan){const c=ply.chan;c.t+=dt;c.acc+=dt;if(ply.downed||ply.riding||ply.sleeping||c.t>=c.dur){ply.chan=null;}else{
      if(Math.random()<dt*4)spawnNotes(ply.x,ply.y+1.6,ply.z,1);
      if(c.acc>=1){c.acc-=1;const rk=TV('r_song');healParty([0,1,1.5,2][rk],[0,2,3,4][rk],8);SFX.strum();ring(ply.x,ply.y+0.15,ply.z,0xff9ec7,0.4,8,0.7);
        const tp=TV('r_tempo');if(tp){ply.tempoT=1.6;ply.tempoV=0.2*tp;if(inParty())netPost({t:'buff',x:+ply.x.toFixed(1),z:+ply.z.toFixed(1),r:8,d:1.6,v:0.2*tp,ar:ply.cave?'cave':'out'},true);}}}}
  // 跳躍突擊
  if(ply.leap){const l=ply.leap;l.t+=dt;const k=Math.min(1,l.t/l.dur);ply.x=lerp(l.sx,l.tx,k);ply.z=lerp(l.sz,l.tz,k);if(k>=1&&(ply.ground||l.t>l.dur+0.3)){ply.leap=null;leapLand();}}
  // 領域
  for(let i=zones.length-1;i>=0;i--){const z=zones[i];z.t+=dt;z.acc+=dt;const gy=z.cave?0:H(z.x,z.z);
    if(z.cave!==!!ply.cave||z.t>=z.dur){scene.remove(z.g);zones.splice(i,1);continue;}
    z.g.children[0].material.opacity=0.6+Math.sin(T*6)*0.25;if(z.dur-z.t<0.5)z.g.scale.setScalar(z.r*(z.dur-z.t)/0.5+0.01);
    if(z.kind==='bliz'){for(let n=0;n<3;n++)if(Math.random()<dt*30){const a=R(0,6.28),r=Math.sqrt(Math.random())*z.r;addFaller(mk(partG,basic(Math.random()<0.5?0xffffff:0xbfe6ff)),z.x+Math.cos(a)*r,gy+R(4,6),z.z+Math.sin(a)*r,-R(5,8),1.2);}}
    if(z.kind==='heal'&&Math.random()<dt*10){const a=R(0,6.28),r=Math.sqrt(Math.random())*z.r;burst(z.x+Math.cos(a)*r,gy+0.2,z.z+Math.sin(a)*r,[z.col,0xffffff],1,0.6,partG,1.0,-3);}
    if(z.acc>=z.tick){z.acc-=z.tick;
      if(z.kind==='rain'){for(let n=0;n<5;n++){const a=R(0,6.28),r=Math.sqrt(Math.random())*z.r;const ar=mk(arrowGeo,toon(0xeafff2));ar.rotation.x=Math.PI/2;addFaller(ar,z.x+Math.cos(a)*r,gy+7,z.z+Math.sin(a)*r,-30,0.25);}
        setTimeout(()=>{hitArea(z.x,z.z,z.r,z.dmg,W,false);},180);}
      else if(z.kind==='bliz'){hitArea(z.x,z.z,z.r,z.dmg,{src:'wpn',slow:1.2,slowF:0.45},false);}
      else if(z.kind==='heal'){if(Math.hypot(ply.x-z.x,ply.z-z.z)<z.r)healMe(z.h,z.e);if(inParty())netPost({t:'heal',x:+z.x.toFixed(1),z:+z.z.toFixed(1),r:z.r,h:z.h,e:z.e,ar:z.cave?'cave':'out'},true);SFX.heal();}}}
  // 掉落物
  for(let i=fallers.length-1;i>=0;i--){const f=fallers[i];f.life-=dt;f.m.position.y+=f.vy*dt;if(f.m.userData.meteor){f.m.position.x+=f.m.userData.dx*dt;f.m.position.z+=f.m.userData.dz*dt;f.m.rotation.x+=dt*3;if(Math.random()<0.8)burst(f.m.position.x,f.m.position.y+1,f.m.position.z,[0xff6a2a,0xffb347,0xffe08a],2,2,partG,0.5,-4);}
    if(f.life<=0){scene.remove(f.m);fallers.splice(i,1);if(f.onEnd)f.onEnd();}}
  for(let i=notes.length-1;i>=0;i--){const n=notes[i];n.t+=dt;n.s.position.x+=n.vx*dt;n.s.position.z+=n.vz*dt;n.s.position.y+=1.4*dt;n.s.material.opacity=1-n.t/1.3;if(n.t>1.3){scene.remove(n.s);n.s.material.dispose();notes.splice(i,1);}}
  updateAllies(dt,T);
  // 理財：每天早上 6 點
  investT-=dt;if(investT<=0){investT=1;if(TV('c_invest')&&hour()>=6&&ply.iday!==day){const first=ply.iday===undefined;ply.iday=day;if(!first){const pay=Math.min(200,Math.floor(ply.coins*0.01*TV('c_invest')));if(pay>0){ply.coins+=pay;toast(`🏦 收到今天的利息 🪙${pay}！`);SFX.coin(6);updateHUD();}}}}
  skUiT-=dt;if(skUiT<=0){skUiT=0.1;renderSkillBar(false);}
  const cb=$('castBar');const c=ply.cast||ply.chan;if(c){cb.classList.add('on');const k=c.k;$('castFill').style.width=Math.min(100,c.t/c.dur*100)+'%';$('castTxt').textContent=`${TALENTS[k].i} ${TALENTS[k].n}${ply.chan?' 演奏中':' 詠唱中'}…`;}else cb.classList.remove('on');
}

// ---------- 技能列 UI ----------
let skKey='';
function renderSkillBar(force){const L=skillList();const key=L.join(',')+'|'+innerWidth+'|'+ply.weapon;const bar=$('skillBar');
  if(key!==skKey||force){skKey=key;bar.innerHTML=L.map((k,i)=>`<button class="sk ${SKILLS[k].toggle&&ply.coinMode?'on':''}" data-k="${k}" title="${TALENTS[k].n}"><span>${TALENTS[k].i}</span><i></i><b></b></button>`).join('');layoutSkills();}
  bar.querySelectorAll('.sk').forEach(b=>{const k=b.dataset.k,S=SKILLS[k],left=Math.max(0,cdLeft[k]||0),tot=val(S.cd)*(1-0.1*TV('m_wisdom'));const f=left>0?left/tot:0;
    b.querySelector('i').style.background=f>0?`conic-gradient(rgba(70,40,60,.55) ${f*360}deg,transparent 0)`:'none';b.querySelector('b').textContent=left>0.05&&!S.toggle?Math.ceil(left):'';
    b.classList.toggle('on',!!(S.toggle&&ply.coinMode)||(k==='r_song'&&!!ply.chan));b.classList.toggle('dim',left>0||!!skWrong(k));});}
function layoutSkills(){const btns=[...document.querySelectorAll('#skillBar .sk')];if(!btns.length)return;const a=$('btnAtk').getBoundingClientRect();if(!a.width)return;
  const cx=a.left+a.width/2,cy=a.top+a.height/2,mob=innerWidth<=560||innerHeight<=500;const w=btns[0].offsetWidth||50,pad=5;
  // 避開其他按鈕、快捷欄和螢幕邊緣，自動找空位
  const block=['btnAct','btnJump','btnEmote','hotbar','topR'].map(id=>$(id)).filter(e=>e&&e.offsetWidth).map(e=>e.getBoundingClientRect());block.push(a);
  const taken=[];const fits=(x,y)=>{if(x-w/2<4||y-w/2<4||x+w/2>innerWidth-4||y+w/2>innerHeight-4)return false;
    for(const r of block)if(x+w/2+pad>r.left&&x-w/2-pad<r.right&&y+w/2+pad>r.top&&y-w/2-pad<r.bottom)return false;
    for(const t of taken)if(Math.hypot(t[0]-x,t[1]-y)<w+pad*2)return false;return true;};
  const angs=[150,125,170,105,185,140,115,160,95,200];const R1=a.width/2+(mob?58:70);
  btns.forEach(b=>{let p=null;for(const R0 of[R1,R1+w*0.9,R1+w*1.8]){for(const g of angs){const t=g*Math.PI/180,x=cx+Math.cos(t)*R0,y=cy-Math.sin(t)*R0;if(fits(x,y)){p=[x,y];break;}}if(p)break;}
    if(!p)p=[cx-R1,cy-R1];taken.push(p);b.style.left=(p[0]-w/2)+'px';b.style.top=(p[1]-w/2)+'px';});}
addEventListener('resize',()=>{skKey='';setTimeout(()=>renderSkillBar(true),120);});
$('skillBar').addEventListener('pointerdown',e=>{const b=e.target.closest('.sk');if(!b)return;e.preventDefault();e.stopPropagation();useSkill(b.dataset.k);bump(b);});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.repeat||!started||paused||kbWait)return;const i=e.code===KB.sk1?0:e.code===KB.sk2?1:-1;if(i<0)return;const L=skillList();if(L[i])useSkill(L[i]);});
