// ===================== party.js：組隊、共享果凍怪、救援、果凍王與寶箱 =====================
let party=null;// {pid,leader,members:[nid],names:{nid:name}}
const inParty=()=>!!(party&&party.members.length>1);
const myName=()=>cleanTxt(look.name,10)||'旅人';
function remoteOf(nid){for(const r of remotes.values())if(r.nid===nid)return r;return null;}
function presOf(nid){const p=others().find(p=>(p.presence.id||p.peer)===nid);return p?p.presence:null;}
function nameOf(nid){if(nid===myNetId)return myName();const r=remoteOf(nid);if(r)return r.name;return(party&&party.names&&party.names[nid])||'旅人';}

// ---------- 通訊 ----------
let outbox=[],outSeq=0,partyCh=null,partyChId='',roomMon=null;
function netPost(o,toParty){o.f=myNetId;if(toParty&&party)o.pid=party.pid;
  if(sbClient){const ch=(toParty&&partyCh)?partyCh:sbCh;if(ch&&netConn)ch.send({type:'broadcast',event:'m',payload:o}).catch(()=>{});}
  else if(room){outbox.push([++outSeq,o,performance.now()]);if(outbox.length>24)outbox.shift();}}
function syncPartyChannel(){if(!sbClient)return;const want=inParty()?party.pid:'';if(want===partyChId)return;
  if(partyCh){try{sbClient.removeChannel(partyCh);}catch(e){}partyCh=null;}partyChId=want;
  if(want){const c=window.LOBSTER_CONFIG;partyCh=sbClient.channel((c.ROOM||'lobster-world')+'-pty-'+want,{config:{broadcast:{self:false}}});partyCh.on('broadcast',{event:'m'},({payload})=>onNetMsg(payload));partyCh.subscribe();}}
function onNetMsg(o){if(!o||o.f===myNetId)return;if(o.to&&o.to!==myNetId)return;if(o.pid&&(!party||party.pid!==o.pid))return;
  switch(o.t){case'inv':showInvite(o);break;case'acc':onAccept(o);break;case'dec':toast(`${cleanTxt(o.name,10)} 婉拒了組隊邀請`);break;case'full':toast('隊伍已經滿了（最多 4 人）');break;
    case'pty':onRoster(o);break;case'lv':onLeave(o.f);break;case'mon':onMonState(o.f,o);break;case'hit':onHit(o);break;case'kill':onKill(o);break;case'rev':onRevived(o);break;case'slam':onSlam(o);break;case'heal':onHealMsg(o);break;case'buff':onBuffMsg(o);break;case'gift':onGift(o);break;case'kick':onKickMsg(o);break;}}

// ---------- 組隊 ----------
let invite=null,invT=null;
function showInvite(o){invite=o;$('invTxt').textContent=`${cleanTxt(o.name,10)} 邀請你組隊！`;$('invBox').classList.add('on');SFX.open();clearTimeout(invT);invT=setTimeout(()=>answerInvite(false),15000);}
function answerInvite(ok){if(!invite)return;const o=invite;invite=null;clearTimeout(invT);$('invBox').classList.remove('on');
  if(ok){if(inParty()&&party.pid!==o.pp)leaveParty(true);netPost({t:'acc',to:o.f,name:myName()});toast('已接受，等待隊長確認…');}else netPost({t:'dec',to:o.f,name:myName()});}
$('invYes').addEventListener('click',()=>answerInvite(true));$('invNo').addEventListener('click',()=>answerInvite(false));
function sendInvite(nid){if(inParty()&&party.leader!==myNetId){toast('只有隊長 👑 可以邀請隊友');return;}if(inParty()&&party.members.length>=4){toast('隊伍已經滿了（最多 4 人）');return;}
  netPost({t:'inv',to:nid,name:myName(),pp:party?party.pid:null});toast(`已邀請 ${nameOf(nid)} 組隊 ✉️`);SFX.click();}
function broadcastRoster(){if(!party)return;netPost({t:'pty',pp:party.pid,leader:party.leader,members:party.members,names:party.names});}
function onAccept(o){if(party&&party.leader!==myNetId)return;if(!party)party={pid:'t'+Math.random().toString(36).slice(2,9),leader:myNetId,members:[myNetId],names:{[myNetId]:myName()}};
  if(party.members.includes(o.f))return;if(party.members.length>=4){netPost({t:'full',to:o.f});return;}
  party.members.push(o.f);party.names[o.f]=cleanTxt(o.name,10);broadcastRoster();toast(`🤝 ${party.names[o.f]} 加入了隊伍！`);SFX.quest();partyChanged();}
function onRoster(o){if(!Array.isArray(o.members))return;const mine=o.members.includes(myNetId);
  if(mine){const isNew=!party||party.pid!==o.pp;if(party&&party.pid!==o.pp&&inParty())leaveParty(true);
    party={pid:String(o.pp),leader:o.leader,members:o.members.slice(0,4),names:Object.assign({},o.names||{})};if(isNew){toast(`🤝 加入了 ${nameOf(o.leader)} 的隊伍！`);SFX.quest();}partyChanged();}
  else if(party&&party.pid===o.pp){party=null;toast('你已離開隊伍');partyChanged();}}
function onLeave(f){if(!party||!party.members.includes(f))return;toast(`${nameOf(f)} 離開了隊伍`);party.members=party.members.filter(n=>n!==f);
  if(party.leader===f)party.leader=party.members[0];if(party.members.length<=1){party=null;toast('隊伍解散了');}partyChanged();}
function leaveParty(quiet){if(!party)return;netPost({t:'lv'},true);netPost({t:'lv',pid:party.pid});party=null;if(!quiet)toast('你離開了隊伍');partyChanged();}
$('ptLeave').addEventListener('click',()=>leaveParty());
function partyChanged(){syncPartyChannel();renderParty();for(const r of remotes.values()){const inP=party&&party.members.includes(r.nid);r.c.g.children.forEach(ch=>{if(ch.isSprite&&ch.material&&ch!==r.bubble)ch.material.color.setHex(inP?0xb8ffb8:0xd8f0ff);});}}
let ptT=0,lostT={};
function renderParty(){const b=$('partyBox');if(!inParty()){b.classList.remove('on');return;}b.classList.add('on');
  $('ptList').innerHTML=party.members.map(n=>{const me=n===myNetId,pr=me?null:presOf(n);const hp=me?ply.hp/ply.max:(pr&&typeof pr.hp==='number'?pr.hp:1);const dn=me?ply.downed:(pr&&pr.dn);
    return`<div class="pm ${dn?'dn':''}"><span>${n===party.leader?'👑':'🦞'} ${nameOf(n)}${me?'（你）':''}${dn?' 💫':''}</span><i><b style="width:${Math.max(0,Math.min(1,hp))*100}%"></b></i></div>`;}).join('');}

// ---------- 共享洞窟怪物（第一位在同一層的隊員當主機） ----------
let monSeq=1,wasFollower=false,monSendT=0,lastMonT=0;
function caveHost(){if(!inParty()||!ply.cave)return null;for(const n of party.members){if(n===myNetId)return n;const pr=presOf(n);if(pr&&pr.ar==='cave'&&pr.lv===caveLv&&pr.pt===party.pid&&!pr.dn)return n;}return myNetId;}
function caveFollower(){const h=caveHost();return!!h&&h!==myNetId;}
function otherInCave(){if(!inParty())return false;return party.members.some(n=>{if(n===myNetId)return false;const pr=presOf(n);return pr&&pr.ar==='cave'&&pr.lv===caveLv;});}
function monTargets(){const L=[];if(ply.cave&&!ply.downed&&!ply.riding&&!(ply.stealthT>0))L.push({x:ply.x,z:ply.z,me:1,tn:ply.tauntT>0});
  if(inParty())for(const n of party.members){if(n===myNetId)continue;const pr=presOf(n);if(pr&&pr.ar==='cave'&&pr.lv===caveLv&&!pr.dn&&!pr.st)L.push({x:pr.x,z:pr.z,tn:!!pr.tn});}return L;}
function monTarget(m){let best=null,bd=1e9;for(const t of MT_CACHE){if(!t.tn)continue;const d=Math.hypot(t.x-m.x,t.z-m.z);if(d<14&&d<bd){bd=d;best=t;}}if(best)return best;
  for(const t of MT_CACHE){const d=Math.hypot(t.x-m.x,t.z-m.z);if(d<bd){bd=d;best=t;}}return best;}
let MT_CACHE=[];
function monEntry(m){if(!m.id)m.id=monSeq++;return[m.id,Math.round(m.x*10),Math.round(m.z*10),Math.round(m.y*10),Math.max(0,Math.ceil(m.hp)),m.max,m.tyI||0,Math.round(m.size*100),m.boss?1:0,Math.round((m.dir>=0?m.dir:m.g.rotation.y)*100),m.dmg||2];}
function partyTick(dt){
  MT_CACHE=monTargets();
  const fol=caveFollower();if(fol!==wasFollower){for(let i=monsters.length-1;i>=0;i--)if(monsters[i].cave){scene.remove(monsters[i].g);monsters.splice(i,1);}wasFollower=fol;lastMonT=performance.now();}
  if(fol&&performance.now()-lastMonT>3000){for(let i=monsters.length-1;i>=0;i--)if(monsters[i].mirror&&monsters[i].dead<0){scene.remove(monsters[i].g);monsters.splice(i,1);}}
  // 主機：送出怪物狀態
  roomMon=null;if(ply.cave&&inParty()&&!fol&&otherInCave()){monSendT-=dt;const list=monsters.filter(m=>m.cave&&m.dead<0&&!m.mirror).map(monEntry);const st={t:'mon',lv:caveLv,l:list,s:Math.floor(performance.now()/100)};
    if(sbClient){if(monSendT<=0){monSendT=0.25;netPost(st,true);}}else roomMon=st;}
  // 隊伍名單維護
  ptT-=dt;if(ptT<=0){ptT=0.5;renderParty();
    if(inParty()){const now=performance.now();for(const n of party.members.slice()){if(n===myNetId)continue;if(presOf(n)){lostT[n]=now;continue;}if(!lostT[n])lostT[n]=now;if(now-lostT[n]>15000){onLeave(n);}}
      if(party&&party.leader===myNetId&&Math.random()<0.1)broadcastRoster();}}
  updateRevive(dt);updateBossBar();updateChests(dt);
  if(!fol&&ply.cave&&caveLv===5)bossTick(dt);}
function onMonState(f,o){if(!ply.cave||o.lv!==caveLv||caveHost()!==f)return;lastMonT=performance.now();const seen=new Set();
  for(const e of o.l){const[id,x10,z10,y10,hp,max,ty,s100,boss,d100,dmg]=e;seen.add(id);let m=monsters.find(m=>m.mirror&&m.id===id);
    if(!m){m=makeMirror(id,ty,s100/100,!!boss,max);m.x=x10/10;m.z=z10/10;}
    m.tx=x10/10;m.tz=z10/10;m.ty_=y10/10;m.dirT=d100/100;m.dmg=dmg;const old=m.hp;m.hp=hp;m.max=max;if(hp<old){m.bar.visible=true;}const r=Math.max(0,m.hp/m.max);m.fg.scale.x=r||0.001;m.fg.position.x=-(1-r)/2;}
  for(const m of monsters)if(m.mirror&&m.dead<0&&!seen.has(m.id)){m.dead=0;m.bar.visible=false;burst(m.x,m.y+0.6,m.z,[0xff9ec7,0xffc4dc,0xffffff,0xffd36e],16,5);}}
function makeMirror(id,ty,size,boss,max){const d=CAVE_SLIMES[ty]||CAVE_SLIMES[0];const c=boss?makeBossVis():makeSlime(true,size,d.c,true);const g=c.g;if(boss)g.scale.setScalar(size);
  const bar=new THREE.Group(),bg=mk(new THREE.PlaneGeometry(1,0.14),hpBgM),fg=mk(new THREE.PlaneGeometry(1,0.14),hpFgM,0,0,0.001);bg.renderOrder=fg.renderOrder=9;bar.add(bg,fg);bar.position.y=1.6;bar.visible=false;g.add(bar);
  g.position.set(0,0,0);scene.add(g);const m={g,c,mat:c.mat,bar,fg,x:0,z:0,y:0,vy:0,hp:max,max,size,t:0,dir:0,kx:0,kz:0,cool:0.5,dead:-1,flash:0,spawn:1,ifr:0,hop:1,shake:0,night:true,sq:0,sqv:0,cave:true,mirror:true,id,boss,tyI:ty,dmg:2};
  monsters.push(m);return m;}
function mirrorTick(m,dt){const k=1-Math.exp(-10*dt);m.x+=(m.tx-m.x)*k;m.z+=(m.tz-m.z)*k;const py=m.y;m.y+=(m.ty_-m.y)*Math.min(1,dt*14);
  if(py>0.05&&m.y<=0.05)m.sqv-=6;m.sqv+=((m.y>0.05?0.12:0)-m.sq)*150*dt-m.sqv*10*dt;m.sq+=m.sqv*dt;const s=clamp(m.sq,-0.45,0.4);m.c.m.scale.set(1-s*0.6,1+s,1-s*0.6);
  let jx=0,jz=0;if(m.shake>0){m.shake-=dt;jx=Math.sin(m.shake*90)*0.1;jz=Math.cos(m.shake*70)*0.08;}m.g.position.set(m.x+jx,m.y,m.z+jz);m.g.rotation.y+=angDiff(m.g.rotation.y,m.dirT||0)*Math.min(1,dt*8);
  m.ifr-=dt;m.cool-=dt;const dx=ply.x-m.x,dz=ply.z-m.z,d=Math.hypot(dx,dz)||0.01;
  if(!ply.downed&&!ply.riding&&ply.cave&&!(ply.stealthT>0)&&d<1.1+m.size*0.35&&m.cool<=0&&ply.ifr<=0&&m.flash<0.3&&m.y<1){m.cool=1;hurtMe(m.dmg||2,dx/d,dz/d,m);}}
function hurtMe(dmg,nx,nz,m){if(tryDodge(m))return;ply.ifr=0.9;ply.hp-=takeDmg(dmg,m||null);ply.kx=nx*10;ply.kz=nz*10;ply.vy=4;ply.ground=false;SFX.hurt();P.sqv-=5;burst(ply.x,ply.y+0.8,ply.z,[0xff9ec7,0xffffff],8,3);hurtFX();updateHUD();
  if(ply.hp<=0){ply.hp=0;playerKO('被果凍怪打倒了… 💫');}}
function onHit(o){if(caveFollower())return;const m=monsters.find(m=>m.id===o.id&&!m.mirror&&m.dead<0);if(!m)return;m.ifr=0;damageMonster(m,+o.d||1,+o.nx||0,+o.nz||0,!!o.c,true);}
function partyOnKill(m){const out={t:'kill',id:m.id||0,x:+m.x.toFixed(1),z:+m.z.toFixed(1),ar:m.cave?'cave':'out',lv:caveLv,
    c:m.cave?m.coin:(m.night?4:3),xp:m.cave?m.xpv:(m.night?5:4),b:m.boss?1:0};if(m.boss)spawnChest(m.x,m.z);if(inParty())netPost(out,true);}
function onKill(o){const area=ply.cave?'cave':'out';if(o.ar!==area)return;if(area==='cave'&&o.lv!==caveLv)return;if(Math.hypot(o.x-ply.x,o.z-ply.z)>45)return;
  const mm=monsters.find(m=>m.mirror&&m.id===o.id&&m.dead<0);if(mm){mm.dead=0;mm.bar.visible=false;}
  const y=(ply.cave?0:H(o.x,o.z))+0.8;burst(o.x,y,o.z,[0xff9ec7,0xffc4dc,0xffffff,0xffd36e],14,5);spawnDrops('coin',o.x,y,o.z,Math.min(40,o.c|0),1);spawnDrops('xp',o.x,y,o.z,Math.min(40,o.xp|0),3);progress('hunt');
  if(o.b)spawnChest(o.x,o.z);}

// ---------- 倒地與救援 ----------
function playerKO(msg){if(inParty()&&!ply.downed){goDown();return;}if(!ply.downed)faint(msg);}
function goDown(){ply.downed=true;ply.hp=0;ply.act=null;ply.atkT=-1;ply.reviving=null;if(ply.fishing)endFishing();if(carry)carryCancel();holdAtk=holdAct=false;
  document.body.classList.add('downed');$('downBox').classList.add('on');P.setFace('sleep');SFX.hurt();toast('倒下了… 等隊友來救你吧 💫');updateHUD();}
function clearDown(){ply.downed=false;document.body.classList.remove('downed');$('downBox').classList.remove('on');P.m.rotation.set(0,0,0);P.m.position.set(0,0,0);P.setFace('open');}
function reviveMe(by){if(!ply.downed)return;clearDown();ply.hp=Math.ceil(ply.max*0.4);ply.ifr=2.5;P.sqv+=6;SFX.levelup();ring(ply.x,ply.y+0.1,ply.z,0x9ff0c8,0.4,3,0.6);burst(ply.x,ply.y+1,ply.z,[0x9ff0c8,0xffffff,0xff9ec7],20,4);
  toast(by?`💖 ${by} 把你救起來了！`:'💖 復活了！');updateHUD();}
$('downHome').addEventListener('click',()=>{if(!ply.downed)return;clearDown();faint('回到重生點休息…');});
function onRevived(o){if(o.to===myNetId)reviveMe(nameOf(o.f));}
function nearestDowned(){if(!inParty()||ply.downed)return null;let best=null,bd=2.4;for(const n of party.members){if(n===myNetId)continue;const pr=presOf(n);if(!pr||!pr.dn)continue;
  if((pr.ar==='cave')!==!!ply.cave)continue;const d=Math.hypot(pr.x-ply.x,pr.z-ply.z);if(d<bd){bd=d;best={nid:n,x:pr.x,z:pr.z};}}return best;}
function startRevive(t){ply.reviving={nid:t.nid,t:0,x:ply.x,z:ply.z,tx:t.x,tz:t.z};faceTo(t.x,t.z);toast(`正在救助 ${nameOf(t.nid)}… 請待在原地 ${Math.ceil(reviveDur())} 秒`);SFX.open();}
function updateRevive(dt){const rv=ply.reviving,bar=$('revBar');if(!rv){bar.classList.remove('on');return;}const pr=presOf(rv.nid);
  if(!pr||!pr.dn||Math.hypot(ply.x-rv.x,ply.z-rv.z)>0.9||ply.downed){ply.reviving=null;bar.classList.remove('on');if(pr&&pr.dn)toast('救助中斷了…要待在原地喔');return;}
  rv.t+=dt;bar.classList.add('on');const RD=reviveDur();$('revFill').style.width=Math.min(100,rv.t/RD*100)+'%';$('revTxt').textContent=`救助 ${nameOf(rv.nid)} 中… ${Math.max(0,Math.ceil(RD-rv.t))} 秒`;
  if(Math.random()<dt*4)burst(pr.x,(ply.cave?0:H(pr.x,pr.z))+1,pr.z,[0xff9ec7,0x9ff0c8],2,1.5);
  if(rv.t>=RD){netPost({t:'rev',to:rv.nid},true);netPost({t:'rev',to:rv.nid});toast(`💖 救起了 ${nameOf(rv.nid)}！`);SFX.quest();ply.reviving=null;bar.classList.remove('on');}}

// ---------- 果凍王（B5） ----------
let bossSpawned=false,bossDone=false,bossWait=0;
{const _s=setCaveLv;setCaveLv=function(n){_s(n);bossSpawned=false;bossDone=false;bossWait=2;for(const c of chests)scene.remove(c.g);chests.length=0;};}
function makeBossVis(){const c=makeSlime(true,1,'#ff5aa8',true);const cr=new THREE.Group();const gold=toon(0xffd36e);
  cr.add(mk(new THREE.CylinderGeometry(0.42,0.46,0.18,16,1,true),toon(0xffd36e,{side:THREE.DoubleSide}),0,0,0));for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const p=mk(new THREE.ConeGeometry(0.08,0.24,5),gold,Math.cos(a)*0.42,0.18,Math.sin(a)*0.42);cr.add(p);
    cr.add(mk(new THREE.SphereGeometry(0.045,8,6),basic([0xff6f9f,0x8fd0ff,0x9ff0c8][i%3]),Math.cos(a)*0.42,0.31,Math.sin(a)*0.42));}
  cr.position.y=1.12;c.g.add(cr);return c;}
function bossTick(dt){if(bossDone)return;
  if(!bossSpawned){bossWait-=dt;if(bossWait<=0){bossSpawned=true;spawnBoss();}return;}
  const b=monsters.find(m=>m.boss&&!m.mirror);if(!b)return;if(b.dead>=0)return;
  b.slamT-=dt;b.sumT-=dt;
  if(b.slamT<=0&&b.y===0){b.slamT=R(4.5,6.5);b.vy=12;b.slamming=true;b.hop=99;SFX.jump();}
  if(b.sumT<=0){b.sumT=R(8,11);for(let i=0;i<2;i++){spawnCaveSlime();const m=monsters[monsters.length-1];if(m){m.x=b.x+R(-3,3);m.z=b.z+R(-3,3);}}ring(b.x,0.1,b.z,0xff9ec7,0.5,4,0.5);}
  if(b.slamming&&b.y===0&&b.vy===0){b.slamming=false;b.hop=R(0.6,1.2);doSlam(b.x,b.z,5.5,b.dmg+1);netPost({t:'slam',x:+b.x.toFixed(1),z:+b.z.toFixed(1),r:5.5,d:b.dmg+1},true);}}
function doSlam(x,z,r,d){ring(x,0.12,z,0xff6f9f,0.5,r,0.5);ring(x,0.15,z,0xffffff,0.3,r*0.7,0.4);burst(x,0.4,z,[0xff9ec7,0xffd36e,0xffffff],26,7);SFX.boom();hitStop=Math.max(hitStop,0.05);
  const dd=Math.hypot(ply.x-x,ply.z-z);if(ply.cave&&!ply.downed&&dd<r&&ply.ifr<=0&&ply.y<1.2)hurtMe(d,(ply.x-x)/(dd||1),(ply.z-z)/(dd||1));}
function onSlam(o){if(!ply.cave||caveLv!==5)return;doSlam(+o.x,+o.z,+o.r||5,+o.d||4);}
function spawnBoss(){const c=makeBossVis();const g=c.g;const size=3.0;g.scale.setScalar(size);
  const bar=new THREE.Group(),bg=mk(new THREE.PlaneGeometry(1,0.14),hpBgM),fg=mk(new THREE.PlaneGeometry(1,0.14),hpFgM,0,0,0.001);bg.renderOrder=fg.renderOrder=9;bar.add(bg,fg);bar.position.y=1.75;bar.visible=false;g.add(bar);
  const n=inParty()?party.members.length:1;const hp=Math.round((260+ply.lv*14)*(1+0.6*(n-1))*monScale());const x=CAVE.x,z=CAVE.z-2;g.position.set(x,0,z);c.m.scale.setScalar(0.01);scene.add(g);
  monsters.push({g,c,mat:c.mat,bar,fg,x,z,y:0,vy:0,hp,max:hp,size,t:0,dir:0,wt:0,kx:0,kz:0,cool:1,dead:-1,flash:0,spawn:0,ifr:0,hop:1.5,shake:0,night:true,sq:0,sqv:0,cave:true,boss:true,dmg:4,spd:0.75,coin:120,xpv:120,slamT:4,sumT:7,tyI:0});
  toast('👑 果凍王出現了！小心牠的跳躍重壓！');SFX.lock();ring(x,0.1,z,0xffd36e,0.5,8,0.8);}
function updateBossBar(){const b=ply.cave&&caveLv===5?monsters.find(m=>m.boss&&m.dead<0):null;const el=$('bossBar');if(!b){el.classList.remove('on');return;}el.classList.add('on');$('bossFill').style.width=Math.max(0,b.hp/b.max*100)+'%';$('bossHp').textContent=`${Math.max(0,Math.ceil(b.hp))} / ${b.max}`;}

// ---------- 寶箱 ----------
const chests=[];
function spawnChest(x,z){if(chests.some(c=>Math.hypot(c.x-x,c.z-z)<1))return;const g=new THREE.Group();const wd=toon(0xb8743a),gd=toon(0xffd36e);
  g.add(mk(new THREE.BoxGeometry(1.4,0.8,0.95),wd,0,0.4,0));for(const s of[-1,1])g.add(mk(new THREE.BoxGeometry(0.12,0.82,0.98),gd,s*0.5,0.41,0));
  const lid=new THREE.Group();lid.position.set(0,0.8,-0.47);const lm=mk(new THREE.CylinderGeometry(0.48,0.48,1.4,14,1,false,0,Math.PI),wd,0,0,0.47);lm.rotation.z=Math.PI/2;lm.rotation.y=Math.PI/2;lid.add(lm);
  for(const s of[-1,1]){const t=mk(new THREE.CylinderGeometry(0.5,0.5,0.12,14,1,false,0,Math.PI),gd,s*0.5,0,0.47);t.rotation.z=Math.PI/2;t.rotation.y=Math.PI/2;lid.add(t);}g.add(lid);
  g.add(mk(new THREE.BoxGeometry(0.22,0.28,0.06),gd,0,0.68,0.49));const glow=mk(new THREE.CylinderGeometry(1.2,1.2,0.05,24),basic(0xffe680,{transparent:true,opacity:0.35,depthWrite:false}),0,0.03,0);g.add(glow);
  g.position.set(x,0,z);g.scale.setScalar(0.01);scene.add(g);chests.push({g,lid,glow,x,z,open:false,t:0,pop:0});toast('🎁 果凍王掉下了寶箱！快去打開');SFX.levelup();}
function nearestChest(){let b=null,bd=2.4;for(const c of chests){if(c.open)continue;const d=Math.hypot(c.x-ply.x,c.z-ply.z);if(d<bd){bd=d;b=c;}}return b;}
function updateChests(dt){for(let i=chests.length-1;i>=0;i--){const c=chests[i];c.t+=dt;if(c.pop<1){c.pop=Math.min(1,c.pop+dt*2);c.g.scale.setScalar(easeOutBack(c.pop));}
  c.glow.material.opacity=0.25+Math.sin(c.t*4)*0.12;if(!c.open&&Math.random()<dt*3)burst(c.x+R(-0.6,0.6),1.1,c.z,[0xffe680,0xffffff],1,1.2,partG,0.6,-1);
  if(c.open){c.lid.rotation.x=Math.max(-1.9,c.lid.rotation.x-dt*6);c.ot+=dt;if(c.ot>8){scene.remove(c.g);chests.splice(i,1);}}}}
const CHEST_SKINS=['skin_flame','skin_thunder','skin_wind','skin_ice','skin_dragon','skin_shadow','skin_comet','skin_eye','skin_star','skin_guard'];
function openChest(c){c.open=true;c.ot=0;SFX.craft();burst(c.x,1.2,c.z,PAST.map(h=>parseInt(h.slice(1),16)),30,6);ring(c.x,0.1,c.z,0xffd36e,0.4,3,0.6);
  const coins=100+((Math.random()*60)|0),cry=2+((Math.random()*3)|0);ply.coins+=coins;addItem('crystal',cry);addItem('gem',1);updateHUD();
  let skin=null;if(Math.random()<0.45){const pool=CHEST_SKINS.filter(k=>!has(k));if(pool.length){skin=pool[(Math.random()*pool.length)|0];addItem(skin,1);}else{ply.coins+=200;}}
  setTimeout(()=>{const it=skin&&ITEMS[skin];$('prE').textContent=it?it.i:'🎁';$('prN').textContent=it?`獲得武器外觀「${it.n}」！`:'寶箱打開了！';
    $('prM').innerHTML=(it?`${it.d}<br><small>在背包或快捷欄點一下就能換上</small><br>`:'這次沒有武器外觀…再挑戰一次吧！<br>')+`🪙${coins}・🔷水晶 ×${cry}・💎寶石 ×1`;
    $('petReveal').classList.add('on');SFX.levelup();paused=true;clearTimeout(prT);prT=setTimeout(hidePetReveal,6000);},500);save();}

loop();
