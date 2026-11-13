// ===================== net.js：多人連線（房間 presence） =====================
let room=null,netConn=false,netPeers=[],netTimer=0,netLookKey='',myEmote=null,myChat=null;
const remotes=new Map();
function netArea(){return ply.cave?'cave':'out';}
function netAnim(){if(ply.downed)return'down';if(ply.reviving)return'act';if(ply.sleeping)return'sleep';if(ply.sitting)return ply.sitting.kind==='bath'?'bath':'sit';if(ply.fishing)return'fish';if(ply.atkT>=0)return'atk';if(ply.act)return'act';if(!ply.ground)return'air';
  const k=keys,mv=(joy.id!==null&&Math.hypot(joy.x,joy.y)>0.05)||k.KeyW||k.KeyA||k.KeyS||k.KeyD||k.ArrowUp||k.ArrowDown||k.ArrowLeft||k.ArrowRight;
  if(!mv)return'idle';return(k.ShiftLeft||k.ShiftRight||(joy.id!==null&&Math.hypot(joy.x,joy.y)>0.95))?'run':'walk';}
const LOOK_KEYS=['hat','earSize','earGap','earY','tailSize','tailY','tailZ','species','body','accent','ears','tail','eyes','eyeSize','eyeGap','eyeY','eyeColor','brow','browSize','browGap','browY','lash','lashSize','lashGap','lashY','mouth','mouthSize','mouthW','mouthY','blushShape','blushColor','blushSize','blushGap','blushY'];
function compactLook(){const o={};for(const k of LOOK_KEYS)o[k]=look[k];return o;}
const cleanTxt=(s,n)=>String(s||'').replace(/[\u0000-\u001f\u007f​-‏‪-‮⁠-⁤﻿]/g,'').slice(0,n);

// ---------- 連線 ----------
async function netInit(tries=0){
  try{if(!window.claude||typeof window.claude.use!=='function'){if(tries<20)setTimeout(()=>netInit(tries+1),500);return;}
    room=await window.claude.use('room');if(!room){updNetBadge();return;}
    room.onConnection(c=>{netConn=c;updNetBadge();},()=>{netConn=false;room=null;updNetBadge();});
    room.onPeers(ch=>{netPeers=ch.peers;for(const p of ch.joined)if(!p.isMe&&p.kind==='viewer'&&p.presence&&p.presence.n&&started)toast(`👋 ${cleanTxt(p.presence.n,10)} 上線了`);
      for(const p of ch.left){const r=remotes.get(p.peer);if(r){scene.remove(r.c.g);remotes.delete(p.peer);if(r.name)toast(`${r.name} 離線了`);}}
      updNetBadge();},()=>{room=null;updNetBadge();});
  }catch(e){room=null;updNetBadge();}
}
// ---------- Supabase 模式（GitHub Pages 用） ----------
function sbConfigured(){const c=window.LOBSTER_CONFIG;return c&&c.SUPABASE_URL&&c.SUPABASE_ANON_KEY&&window.supabase&&window.supabase.createClient;}
const sbState=new Map();let sbCh=null,sbLastSend=0,sbLastKey='';
const myNetId=(()=>{try{let v=sessionStorage.getItem('lobster-netid');if(!v){v='p'+Math.random().toString(36).slice(2,10);sessionStorage.setItem('lobster-netid',v);}return v;}catch(e){return'p'+Math.random().toString(36).slice(2,10);}})();
function sbRebuild(){netPeers=[...sbState].map(([id,st])=>({peer:id,isMe:false,kind:'viewer',presence:st}));updNetBadge();}
let sbClient=null,sbShard=0,sbErr='';const SHARD_MAX=Math.max(2,+((window.LOBSTER_CONFIG||{}).CHANNEL_MAX)||30),SHARD_N=8;
function sbPref(){try{return+(localStorage.getItem('lobster-ch')||0);}catch(e){return 0;}}
function sbClearRemotes(){for(const[k,r]of remotes){scene.remove(r.c.g);}remotes.clear();sbState.clear();sbRebuild();}
function sbInit(){const c=window.LOBSTER_CONFIG;
  const url=String(c.SUPABASE_URL).trim().replace(/\/(rest|auth|realtime|storage)\/v1.*$/,'').replace(/\/+$/,'');
  try{sbClient=window.supabase.createClient(url,String(c.SUPABASE_ANON_KEY).trim());}catch(e){sbErr='設定錯誤';updNetBadge();return;}
  room={presence:async p=>{if(!sbCh||!netConn)return;const now=performance.now();const key=JSON.stringify([p.x,p.z,p.y,p.f,p.an,p.ar,p.w,p.em,p.ch,p.sx,p.pt,p.dn,p.lv,Math.round((p.hp||0)*10)]);
      if(p.lk||p.n!==sbState._n){sbCh.track({n:p.n,lk:compactLook()}).catch(()=>{});sbState._n=p.n;}
      const urgent=(p.em&&p.em!==sbState._em)||(p.ch&&p.ch!==sbState._ch);
      const np=sbState.size+1,iv=Math.min(6000,Math.max(330,np*np/80*1000));if(key===sbLastKey&&now-sbLastSend<Math.max(4000,iv))return;if(!urgent&&now-sbLastSend<iv)return;
      sbState._em=p.em;sbState._ch=p.ch;sbLastKey=key;sbLastSend=now;const q=Object.assign({},p);delete q.lk;delete q.mq;delete q.mon;sbCh.send({type:'broadcast',event:'s',payload:Object.assign(q,{id:myNetId})}).catch(()=>{});}};
  setInterval(()=>{const now=performance.now();let ch=false;for(const[id,st]of sbState)if(now-(st._t||0)>20000){const r=remotes.get(id);if(r){scene.remove(r.c.g);remotes.delete(id);}sbState.delete(id);ch=true;}if(ch)sbRebuild();},5000);
  const pref=sbPref();sbJoin(pref||1,!pref);}
function sbJoin(n,auto){const c=window.LOBSTER_CONFIG;
  if(sbCh){try{sbClient.removeChannel(sbCh);}catch(e){}sbCh=null;}
  sbClearRemotes();sbShard=n;netConn=false;sbErr='';sbLastKey='';updNetBadge();
  const ch=sbClient.channel((c.ROOM||'lobster-world')+'-'+n,{config:{broadcast:{self:false},presence:{key:myNetId}}});sbCh=ch;
  ch.on('broadcast',{event:'s'},({payload})=>{if(ch!==sbCh||!payload||payload.id===myNetId)return;const id=String(payload.id).slice(0,20);const old=sbState.get(id);
    const st=Object.assign({},old||{},payload);st._t=performance.now();const isNew=!old||typeof old.x!=='number';sbState.set(id,st);if(isNew&&st.n&&started)toast(`👋 ${cleanTxt(st.n,10)} 上線了`);sbRebuild();});
  ch.on('broadcast',{event:'m'},({payload})=>{if(ch===sbCh&&typeof onNetMsg==='function')onNetMsg(payload);});
  ch.on('presence',{event:'sync'},()=>{if(ch!==sbCh)return;const ps=ch.presenceState();for(const id in ps){if(id===myNetId)continue;const meta=ps[id][0]||{};const old=sbState.get(id)||{};
      sbState.set(id,Object.assign(old,{n:meta.n,lk:meta.lk,_t:old._t||performance.now()}));}
    for(const id of[...sbState.keys()])if(!ps[id]){const r=remotes.get(id);if(r){scene.remove(r.c.g);remotes.delete(id);if(r.name)toast(`${r.name} 離線了`);}sbState.delete(id);}sbRebuild();});
  ch.subscribe(status=>{if(ch!==sbCh)return;netConn=status==='SUBSCRIBED';
    if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')sbErr='連線失敗，重試中…';if(status==='CLOSED'&&!netConn)sbErr='';
    updNetBadge();
    if(netConn){sbErr='';ch.track({n:cleanTxt(look.name,10),lk:compactLook()}).catch(()=>{});
      if(auto)setTimeout(()=>{if(ch!==sbCh)return;const cnt=Object.keys(ch.presenceState()).length;if(cnt>SHARD_MAX&&sbShard<SHARD_N){toast(`頻道 ${sbShard} 人滿了，前往頻道 ${sbShard+1}`);sbJoin(sbShard+1,true);}},1800);}});}
function sbSwitch(n){try{localStorage.setItem('lobster-ch',String(n));}catch(e){}if(sbClient)sbJoin(n||1,!n);renderChChips();}
function renderChChips(){const el=$('chChips');if(!el)return;const pref=sbPref();el.innerHTML=[0,1,2,3,4,5,6,7,8].map(n=>`<button data-ch="${n}" class="${pref===n?'on':''}">${n?'頻道 '+n:'自動'}</button>`).join('');}
if(sbConfigured())sbInit();else netInit();
renderChChips();if($('chWrap'))$('chWrap').style.display=sbConfigured()?'block':'none';
if($('chChips'))$('chChips').addEventListener('click',e=>{const b=e.target.closest('[data-ch]');if(!b)return;sbSwitch(+b.dataset.ch);SFX.click();});
function others(){return netPeers.filter(p=>!p.isMe&&p.kind==='viewer'&&p.presence&&typeof p.presence.n==='string'&&typeof p.presence.x==='number');}
function updNetBadge(){const b=$('netBadge');if(!b)return;if(!room&&!sbClient){b.style.display='none';return;}b.style.display='flex';
  const n=others().length;b.classList.toggle('off',!netConn);const pre=sbClient?`頻道${sbShard}・`:'';$('netTxt').textContent=netConn?pre+(n?`線上 ${n+1} 人`:'只有你'):(sbErr||pre+'連線中…');}
$('netBadge').addEventListener('click',()=>{const o=others();toast(o.length?'線上：'+o.map(p=>cleanTxt(p.presence.n,10)).join('、'):'目前只有你在線上，邀請朋友一起玩吧！');});

function netSend(){if(!room||!started)return;
  const p={v:1,n:cleanTxt(look.name,10),x:+ply.x.toFixed(2),z:+ply.z.toFixed(2),y:+ply.y.toFixed(2),f:+ply.face.toFixed(2),ar:netArea(),an:netAnim(),
    w:(toolShow||ply.held&&P.T[ply.held]&&ply.held||wpnModel())||'stick',cb:ply.combo||0,id:myNetId,pt:(typeof party!=='undefined'&&party)?party.pid:0,hp:+(Math.max(0,ply.hp)/ply.max).toFixed(2),dn:ply.downed?1:0,lv:ply.cave?caveLv:0};
  if(!sbClient&&typeof outbox!=='undefined'){const now=performance.now();const mq=outbox.filter(x=>now-x[2]<3000).map(x=>[x[0],x[1]]);if(mq.length)p.mq=mq;if(roomMon)p.mon=roomMon;}
  if(ply.sleeping||ply.sitting){const s=(ply.sleeping||ply.sitting).p;p.sx=+s.x.toFixed(2);p.sz=+s.z.toFixed(2);p.sr=+s.ry.toFixed(2);p.sid=s.id;}
  const lk=JSON.stringify(compactLook());if(lk!==netLookKey){netLookKey=lk;p.lk=compactLook();}
  if(myEmote)p.em=myEmote;if(myChat)p.ch=myChat;
  room.presence(p).catch(()=>{});}

// ---------- 遠端玩家 ----------
function buildRemote(peer,pr){const lk=Object.assign({},DEF_LOOK,pr.lk||{});const c=makeCritter(lk,true);const name=cleanTxt(pr.n,10)||'旅人';
  const tag=nameTag(name);tag.position.y=2.4;tag.material.color.setHex(0xd8f0ff);c.g.add(tag);scene.add(c.g);
  return{c,name,lkKey:JSON.stringify(pr.lk||{}),x:pr.x,z:pr.z,y:pr.y,f:pr.f,walk:0,pose:newPose(),emTs:0,chTs:0,bubble:null,bubT:0,atkT:0,lastAn:''};}
function remoteBubble(r,txt,isEmoji){if(r.bubble){if(r.bubble.parent)r.bubble.parent.remove(r.bubble);r.bubble.material.map.dispose();}
  const cv=document.createElement('canvas');const g0=cv.getContext('2d');const FONT=isEmoji?'64px sans-serif':'900 40px "Zen Maru Gothic",sans-serif';g0.font=FONT;
  let lines=[txt];if(!isEmoji){const maxW=620;lines=[];let cur='';for(const ch of[...txt]){if(g0.measureText(cur+ch).width>maxW&&cur){lines.push(cur);cur=ch;}else cur+=ch;}if(cur)lines.push(cur);}
  const tw=isEmoji?64:Math.max(...lines.map(l=>g0.measureText(l).width));const W=Math.max(128,Math.ceil(tw+70)),LH=50,Hh=Math.max(128,lines.length*LH+70);cv.width=W;cv.height=Hh;const g=cv.getContext('2d');
  g.fillStyle='rgba(255,255,255,.96)';g.strokeStyle='#f0b8a0';g.lineWidth=6;const rr=Math.min(40,(Hh-26)/2-4);g.beginPath();g.moveTo(rr+6,6);g.arcTo(W-6,6,W-6,Hh-26,rr);g.arcTo(W-6,Hh-26,6,Hh-26,rr);g.arcTo(6,Hh-26,6,6,rr);g.arcTo(6,6,W-6,6,rr);g.fill();g.stroke();
  g.beginPath();g.moveTo(W/2-12,Hh-28);g.lineTo(W/2,Hh-6);g.lineTo(W/2+12,Hh-28);g.fill();
  g.fillStyle='#6b4a3e';g.font=FONT;g.textAlign='center';g.textBaseline='middle';const top=(Hh-22)/2-(lines.length-1)*LH/2+2;lines.forEach((l,k)=>g.fillText(l,W/2,top+k*LH));
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),depthWrite:false,transparent:true}));const k=0.9/128;s.scale.set(W*k,Hh*k,1);s.center.set(0.5,0);s.position.y=2.7;s.renderOrder=15;r.c.g.add(s);r.bubble=s;r.bubT=3;r.bubPop=0;r.bubEnd=performance.now()+3000;r.bubH=Hh*k;}
const myBub={c:{g:null}};
function netFrame(dt,T){
  if(!started)return;
  netTimer-=dt;if(netTimer<=0){netTimer=0.1;netSend();}
  myBub.c.g=P.g;if(myBub.bubble&&myBub.bubT>0&&myBub.bubble.parent!==P.g){P.g.add(myBub.bubble);}
  if(myBub.bubT>0){myBub.bubT-=dt;myBub.bubPop=Math.min(1,(myBub.bubPop||0)+dt*5);myBub.bubble.scale.y=myBub.bubH*easeOutBack(myBub.bubPop);if(myBub.bubT<=0||performance.now()>myBub.bubEnd){myBub.bubT=0;P.g.remove(myBub.bubble);myBub.bubble=null;}}
  const area=netArea();const seen=new Set();
  for(const p of others()){const pr=p.presence;seen.add(p.peer);let r=remotes.get(p.peer);
    if(!r){r=buildRemote(p.peer,pr);remotes.set(p.peer,r);if(typeof partyChanged==='function')setTimeout(partyChanged,0);}
    r.nid=pr.id||p.peer;r.pr=pr;
    if(Array.isArray(pr.mq)&&typeof onNetMsg==='function'){for(const[sq,o]of pr.mq){if(sq>(r.mqSeen||0)){r.mqSeen=sq;if(o&&typeof o==='object'){o.f=r.nid;onNetMsg(o);}}}}
    if(pr.mon&&pr.mon.s!==r.monSeen&&typeof onMonState==='function'){r.monSeen=pr.mon.s;onMonState(r.nid,pr.mon);}
    else if(pr.lk&&JSON.stringify(pr.lk)!==r.lkKey){const old=r;scene.remove(old.c.g);r=buildRemote(p.peer,pr);r.x=old.x;r.z=old.z;r.y=old.y;r.f=old.f;remotes.set(p.peer,r);}
    const vis=pr.ar===area&&area!=='home'&&Math.hypot(pr.x-ply.x,pr.z-ply.z)<90;r.c.g.visible=vis;if(!vis)continue;
    if(Math.hypot(pr.x-r.x,pr.z-r.z)>12){r.x=pr.x;r.z=pr.z;}
    const k=1-Math.exp(-12*dt);const dx=pr.x-r.x,dz=pr.z-r.z;r.x+=dx*k;r.z+=dz*k;r.y+=(pr.y-r.y)*k;r.f+=angDiff(r.f,pr.f)*k;
    const an=pr.an;const moving=an==='walk'||an==='run';if(moving)r.walk+=dt*(an==='run'?16:8);
    const c=r.c;const show=(pr.w&&c.T[pr.w])?pr.w:'stick';for(const t in c.T)c.T[t].visible=(t===show)&&an!=='sit'&&an!=='bath'&&an!=='sleep';
    if(an==='down'){c.g.position.set(r.x,r.y,r.z);c.g.rotation.y=r.f;c.m.rotation.set(-Math.PI/2,0,0);c.m.position.set(0,0.6,0.45);c.setFace('sleep');for(const t in c.T)c.T[t].visible=false;}
    else if(an==='sleep'||an==='bath'||an==='sit'){const ry=(pr.sr||0)+(an==='bath'?Math.PI/2:0);c.g.position.set(pr.sx??r.x,r.y+(an==='sleep'?0.62*fsOf(pr.sid||'bed'):an==='bath'?0.32:0.38*fsOf(pr.sid||'chair')),pr.sz??r.z);c.g.rotation.y=ry;
      if(an==='sleep'){c.m.rotation.set(-Math.PI/2,0,0);c.m.position.set(0,0.72,0.45*fsOf(pr.sid||'bed'));c.setFace('sleep');}
      else{const ps=newPose();ps.legs=an==='bath'?[-1,-1.2]:[-1.45,-1.45];if(an==='bath'){ps.lean=-1.15;ps.arms=[[0.3,0,-1.5],[0.3,0,1.5]];}applyPose(c,ps,dt);c.setFace(an==='bath'?'happy':'open');}
    }else{c.g.position.set(r.x,r.y,r.z);c.g.rotation.y=r.f;if(r.lastAn==='sleep'||r.lastAn==='down'){c.m.rotation.set(0,0,0);c.m.position.set(0,0,0);}c.setFace('open');
      let ps=walkPose(newPose(),r.walk,moving,T,r.x);if(an==='run'){ps.lean=0.3;ps.legs=[Math.sin(r.walk)*0.9,-Math.sin(r.walk)*0.9];ps.arms[0][0]=-Math.sin(r.walk)*1.1;ps.arms[1][0]=Math.sin(r.walk)*1.1;}
      if(an==='air'){ps.sq=0.12;ps.legs=[-0.6,0.35];ps.arms[0][2]=-1.25;ps.arms[1][2]=1.25;}
      if(an==='atk'||an==='act'){if(r.lastAn!==an)r.atkT=0;r.atkT+=dt;const s=(r.atkT%0.35)/0.35;ps.arms[0]=[-1.5,0,lerp(1.4,-1.3,easeOut(s))];ps.hold=Math.PI*0.95;ps.k=40;if(an==='act'){ps.arms[0]=[s<0.45?-2.8:-0.6,0,-0.2];ps.hold=2.3;ps.k=30;}}
      if(an==='fish'){ps.arms[0]=[-1.25,0,-0.15];ps.hold=1.35;}
      applyPose(c,ps,dt);}
    if(c.tail)c.tail.rotation.y=Math.sin(T*(moving?10:3)+r.x)*0.35;
    r.lastAn=an;
    if(Array.isArray(pr.em)&&pr.em[1]!==r.emTs){const first=r.emTs===0;r.emTs=pr.em[1];if(!first||Date.now()-pr.em[1]<3000){remoteBubble(r,cleanTxt(pr.em[0],4),true);c.sqv+=6;}}
    if(Array.isArray(pr.ch)&&pr.ch[1]!==r.chTs){const first=r.chTs===0;r.chTs=pr.ch[1];if(!first||Date.now()-pr.ch[1]<6000){const t=cleanTxt(pr.ch[0],24);if(t){remoteBubble(r,t,false);r.bubT=6;r.bubEnd=performance.now()+6000;addChatLog(r.name,t);}}}
    if(r.bubT>0){r.bubT-=dt;r.bubPop=Math.min(1,(r.bubPop||0)+dt*5);if(r.bubble)r.bubble.scale.y=r.bubH*easeOutBack(r.bubPop);if((r.bubT<=0||performance.now()>r.bubEnd)&&r.bubble){r.bubT=0;r.c.g.remove(r.bubble);r.bubble=null;}}
    r.c.g.children.forEach(ch=>{if(ch.isSprite&&ch!==r.bubble)ch.visible=Math.hypot(r.x-ply.x,r.z-ply.z)<20;});
  }
  for(const[k,r]of remotes)if(!seen.has(k)){scene.remove(r.c.g);remotes.delete(k);}
}

// ---------- 表情與聊天 ----------
const EMOTES=['❤️','😆','👋','🎉','😢','😡','💤','👍','❓','🦞'];
function sendEmote(e){myEmote=[e,Date.now()];remoteBubble(myBub,e,true);P.g.add(myBub.bubble);P.sqv+=6;if(e==='😆'||e==='🎉'||e==='❤️'){P.setFace('happy');setTimeout(()=>P.setFace('open'),1200);}netSend();}
function sendChat(t){t=cleanTxt(t,24).trim();if(!t)return;myChat=[t,Date.now()];remoteBubble(myBub,t,false);myBub.bubT=6;myBub.bubEnd=performance.now()+6000;P.g.add(myBub.bubble);addChatLog(look.name+'（你）',t);netSend();}
function addChatLog(name,t){const log=$('chatLog');const d=document.createElement('div');d.innerHTML='<b></b><span></span>';d.querySelector('b').textContent=name+'：';d.querySelector('span').textContent=t;log.appendChild(d);
  while(log.children.length>5)log.firstChild.remove();setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),400);},9000);}
$('emoBar').innerHTML=EMOTES.map(e=>`<button data-e="${e}">${e}</button>`).join('');
$('emoBar').addEventListener('click',e=>{const b=e.target.closest('[data-e]');if(!b)return;sendEmote(b.dataset.e);closeSocial();});
$('chatForm').addEventListener('submit',e=>{e.preventDefault();sendChat($('chatIn').value);$('chatIn').value='';closeSocial();});
function openSocial(focus){const s=$('social');s.style.display='flex';void s.offsetWidth;s.classList.add('show');paused=true;holdAtk=holdAct=false;closeFab();if(focus)setTimeout(()=>$('chatIn').focus(),60);}
function closeSocial(){const s=$('social');s.classList.remove('show');setTimeout(()=>s.style.display='none',250);paused=!started;$('chatIn').blur();}
$('social').addEventListener('pointerdown',e=>{if(e.target.id==='social')closeSocial();});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(e.code==='KeyQ'&&started&&!paused)openSocial();});
