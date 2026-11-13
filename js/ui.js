// ===================== ui.js：HUD、面板、商店、天賦、升級、飛行獎勵、存檔、捏角色 =====================
// ---------- 小工具 ----------
function toast(msg){const d=document.createElement('div');d.className='tmsg';d.textContent=msg;$('toast').appendChild(d);while($('toast').children.length>3)$('toast').firstChild.remove();setTimeout(()=>d.remove(),2700);}
function sparkle(x,y,n=7){for(let i=0;i<n;i++){const s=document.createElement('div');s.className='spark';s.textContent=['✦','♥','✧','●'][i%4];s.style.color=PAST[i%PAST.length];s.style.left=(x-7)+'px';s.style.top=(y-9)+'px';document.body.appendChild(s);
  const a=Math.random()*6.28,d=28+Math.random()*34;s.offsetWidth;s.style.transform=`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(.3) rotate(${R(-120,120)}deg)`;s.style.opacity=0;setTimeout(()=>s.remove(),650);}}
function floatTxt(txt,x,y){const d=document.createElement('div');d.className='flt';d.textContent=txt;d.style.left=x+'px';d.style.top=y+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),1000);}
function bump(el,cls='bump'){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);}
document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b)return;initAudio();b.classList.add('press');if(!b.classList.contains('game'))SFX.click();sparkle(e.clientX,e.clientY,b.classList.contains('game')?4:7);});
document.addEventListener('pointerup',()=>{document.querySelectorAll('.press').forEach(b=>{b.classList.remove('press');bump(b,b.classList.contains('fan')?'fboing':'boing');});});
document.addEventListener('pointercancel',()=>document.querySelectorAll('.press').forEach(b=>b.classList.remove('press')));
document.addEventListener('contextmenu',e=>e.preventDefault());
function hurtFX(){const f=$('flash');f.style.opacity=1;setTimeout(()=>f.style.opacity=0,160);}

// ---------- LINE 風取得通知 ----------
const noteMap={};
function notify(k,n){if(!started||n<=0||!ITEMS[k])return;const it=ITEMS[k];let e=noteMap[k];
  if(e&&e.isConnected&&!e.classList.contains('out')){e._n+=n;e.querySelector('.nmsg').textContent=`${it.n} ×${e._n}`;bump(e.querySelector('.nav'));clearTimeout(e._t);e._t=setTimeout(()=>dismissNote(e),3200);return;}
  e=document.createElement('div');e.className='note';e._n=n;const title={food:'獲得食物',seed:'獲得種子',bug:'抓到蝴蝶',furn:'獲得家具',weapon:'獲得武器',tool:'獲得工具',held:'獲得工具'}[it.k]||'獲得道具';
  e.innerHTML=`<div class="nav">${it.i}</div><div class="nbody"><div class="ntop"><b>${title}</b><small>現在</small></div><div class="nmsg">${it.n} ×${n}</div></div>`;
  $('notes').appendChild(e);noteMap[k]=e;SFX.notify();
  const all=[...$('notes').children].filter(x=>!x.classList.contains('out'));if(all.length>4)dismissNote(all[0]);
  e._t=setTimeout(()=>dismissNote(e),3200);}
function dismissNote(e){if(e.classList.contains('out'))return;e.classList.add('out');setTimeout(()=>e.remove(),400);}

// ---------- 委託 ----------
const Q={
  weed:{icon:'🌿',name:'雜草回收',desc:'隨時都能拔草！帶 10 株 🌿 雜草來這裡交給告示板就能領獎。',need:10,turnin:'weed',reward:30,xp:20,state:'none',prog:0,times:0},
  hunt:{icon:'⚔️',name:'果凍怪討伐',desc:'到東邊野外打倒 3 隻粉紅果凍怪。晚上牠們會更兇！',need:3,reward:80,xp:40,state:'none',prog:0,times:0},
  farm:{icon:'🌾',name:'收成委託',desc:'收成 5 個任何作物。',need:5,reward:60,xp:30,state:'none',prog:0,times:0}
};
function renderBoard(){$('qlist').innerHTML=Object.entries(Q).map(([k,q],i)=>{let btn;
  if(q.turnin){const n=inv[q.turnin]||0;btn=n>=q.need?`<button class="qb claim" data-k="${k}" data-a="turnin">交付 🌿${q.need}（有 ${n}）</button>`:`<button class="qb" disabled>🌿 ${n}/${q.need}</button>`;}
  else if(q.state==='none')btn=`<button class="qb" data-k="${k}" data-a="take">接取</button>`;
  else if(q.state==='active')btn=`<button class="qb" disabled>進行中 ${q.prog}/${q.need}</button>`;
  else btn=`<button class="qb claim" data-k="${k}" data-a="claim">領取 🪙${q.reward}</button>`;
  return`<div class="qc stg" style="--i:${i}"><b>${q.icon} ${q.name}</b><p>${q.desc}</p><div class="row"><span>🪙${q.reward}＋✨${q.xp}・完成 ${q.times} 次</span>${btn}</div></div>`;}).join('');}
$('qlist').addEventListener('click',e=>{const b=e.target.closest('button[data-k]');if(!b)return;const q=Q[b.dataset.k];
  if(b.dataset.a==='turnin'){if((inv[q.turnin]||0)<q.need)return;inv[q.turnin]-=q.need;renderHotbar();}
  if(b.dataset.a==='take'){q.state='active';q.prog=0;toast(`接取了「${q.name}」✨`);SFX.open();}
  else{q.times++;q.state='none';toast(`委託完成！`);SFX.quest();const r=b.getBoundingClientRect();sparkle(r.left+r.width/2,r.top,14);
    for(let i=0;i<Math.min(12,q.reward/5);i++)setTimeout(()=>flyReward('coin',q.reward/Math.min(12,q.reward/5),r.left+r.width/2+R(-20,20),r.top),i*50);
    for(let i=0;i<5;i++)setTimeout(()=>flyReward('xp',q.xp/5,r.left+r.width/2+R(-20,20),r.top),200+i*60);}
  renderBoard();document.querySelectorAll('#qlist .stg').forEach(el=>el.style.animation='none'),document.querySelectorAll('#qlist .stg').forEach(el=>{el.style.opacity=1;el.style.transform='none';});updateHUD();save();});
function progress(k){const q=Q[k];if(q.state!=='active')return;q.prog++;if(q.prog>=q.need){q.state='ready';toast(`${q.icon} ${q.name} 完成！回告示板領獎`);SFX.quest();}updateHUD();bump($('qdrop'));}
$('qdrop').addEventListener('click',()=>{$('qdrop').classList.toggle('open');SFX.click();});

// ---------- 面板（Bottom Sheet / Drawer） ----------
function stagger(root){root.querySelectorAll('.stg').forEach((el,i)=>el.style.setProperty('--i',i));}
function openPanel(id){const el=$(id);stagger(el);el.style.display='flex';void el.offsetWidth;el.classList.add('show');paused=true;SFX.open();holdAtk=holdAct=false;closeFab();}
function closePanel(id){const el=$(id);if(!el.classList.contains('show'))return;el.classList.remove('show');SFX.close();setTimeout(()=>{if(!el.classList.contains('show'))el.style.display='none';},320);
  if(!creatorOpen)paused=!started;}
function closeAllPanels(){['board','craft','shop','talent','bag','settings','iosFs','gacha','dex'].forEach(id=>{if($(id).classList.contains('show'))closePanel(id);});}
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closePanel(b.dataset.close)));
document.querySelectorAll('.panel').forEach(p=>p.addEventListener('pointerdown',e=>{if(e.target===p&&p.id!=='start'&&p.id!=='creator')closePanel(p.id);}));
const noAnim=root=>root.querySelectorAll('.stg').forEach(el=>{el.style.animation='none';el.style.opacity=1;el.style.transform='none';});

// ---------- 合成 ----------
let craftTab='tool';
function nearBench(){return!ply.indoor&&placed.some(p=>p.id==='bench'&&!p.indoor&&Math.hypot(p.x-ply.x,p.z-ply.z)<3.4);}
function costHtml(c){return Object.entries(c).map(([k,n])=>`<span class="${(inv[k]||0)>=n?'':'no'}">${ITEMS[k].i}${inv[k]||0}/${n}</span>`).join(' ');}
function renderCraft(anim=true){
  const nb=nearBench();$('craftSub').textContent=nb?'在工作台旁邊，所有配方都能做！':'徒手只能做基本道具，靠近 🧰工作台 解鎖全部配方';
  document.querySelectorAll('#craft .tab').forEach(t=>t.classList.toggle('on',t.dataset.tab===craftTab));
  $('craftGrid').innerHTML=RECIPES[craftTab].map(([id,cost,needB,out=1],i)=>{const it=ITEMS[id];const owned=['tool','weapon','held'].includes(it.k)&&has(id);
    const enough=Object.entries(cost).every(([k,n])=>(inv[k]||0)>=n);let btn;
    if(owned)btn=`<button class="qb" disabled>已擁有</button>`;else if(needB&&!nb)btn=`<button class="qb" disabled>需要工作台</button>`;
    else btn=`<button class="qb ${enough?'pink':''}" data-c="${id}" ${enough?'':'disabled'}>製作${out>1?' ×'+out:''}</button>`;
    return`<div class="rc stg" style="--i:${i}"><div class="ic">${it.i}</div><div class="nm">${it.n}</div><div class="ds">${it.d||''}</div><div class="cost">${costHtml(cost)}</div>${btn}</div>`;}).join('');
  if(!anim)noAnim($('craftGrid'));else{const p=$('craft');if(p.classList.contains('show')){p.classList.remove('show');void p.offsetWidth;p.classList.add('show');}}
}
document.querySelectorAll('#craft .tab').forEach(t=>t.addEventListener('click',()=>{craftTab=t.dataset.tab;renderCraft();}));
$('craftGrid').addEventListener('click',e=>{const b=e.target.closest('button[data-c]');if(!b)return;const id=b.dataset.c;const r=RECIPES[craftTab].find(x=>x[0]===id);
  for(const[k,n]of Object.entries(r[1]))inv[k]-=n;const rc=b.closest('.rc').getBoundingClientRect();addItem(id,r[3]||1);SFX.craft();sparkle(rc.left+rc.width/2,rc.top+30,16);
  toast(`做好了 ${ITEMS[id].i} ${ITEMS[id].n}！`);if(ITEMS[id].k==='weapon'){ply.weapon=id;refreshHeld();updateAtkIcon();}renderCraft(false);save();});
function openCraft(){if(!started||ply.sleeping)return;renderCraft();openPanel('craft');}

// ---------- 商店 ----------
const SHOPS={
  store:{title:'🧺 小栗雜貨店',sub:'種子、工具、點心都在這裡。也收購各種東西喔！',tabs:[['buy','買東西'],['sell','賣東西']],
    buy:()=>[...Object.keys(CROPS).map(k=>['seed_'+k,CROPS[k].seed,3]),['cake',15,1],...(has('net')?[]:[['net',25,1]]),...(has('can')?[]:[['can',30,1]]),...(has('hoe')?[]:[['hoe',30,1]]),...(has('rod')?[]:[['rod',40,1]])]},
  furn:{title:'🛋️ 木木家具店',sub:'把家裡變得更可愛吧～買的家具會放進背包。',tabs:[['buy','家具']],
    buy:()=>[['chair',30,1],['table',40,1],['sofa',80,1],['bathtub',120,1],['rug',35,1],['shelf',60,1],['lantern',30,1],['pot',20,1],['bed',60,1],['fence',10,3]]},
  park:{title:'🎁 龍蝦樂園商店',sub:'樂園限定商品！',tabs:[['buy','商品']],buy:()=>[...(has('churro')?[]:[['churro',80,1]]),['plush',45,1]]},
  castle:{title:'🏰 龍蝦樂園餐廳',sub:'🎉 六週年慶典特餐！',tabs:[['menu','菜單']],menu:[{n:'彩虹果凍汽水',i:'🥤',p:15,en:25,hp:2,d:'精神 +25'},{n:'六週年紀念蛋糕',i:'🎂',p:30,en:55,hp:5,d:'精神 +55、體力 +5'},{n:'龍蝦城堡豪華套餐',i:'🍱',p:50,en:100,hp:99,d:'全部回滿！'}]},
  ramen:{title:'🍜 麵麵拉麵店',sub:'熱騰騰的拉麵，吃了馬上恢復精神！',tabs:[['menu','菜單']]}
};
const RAMEN=[{n:'醬油拉麵',i:'🍜',p:15,en:35,hp:3,d:'精神 +35'},{n:'味噌拉麵',i:'🍲',p:25,en:60,hp:6,d:'精神 +60、體力 +6'},{n:'龍蝦特製拉麵',i:'🦞',p:40,en:100,hp:99,d:'全部回滿！'}];
let shopKind='store',shopTab='buy';
function openShop(kind){shopKind=kind;shopTab=SHOPS[kind].tabs[0][0];renderShop();openPanel('shop');}
function renderShop(anim=true){const S=SHOPS[shopKind];$('shopTitle').textContent=S.title;$('shopSub').textContent=S.sub+`（你有 🪙${ply.coins}）`;
  $('shopTabs').innerHTML=S.tabs.length>1?S.tabs.map(([k,t])=>`<button class="tab ${k===shopTab?'on':''}" data-st="${k}">${t}</button>`).join(''):'';
  let html='';
  if(shopTab==='buy'){html=S.buy().map(([k,p,n],i)=>{const it=ITEMS[k];const ok=ply.coins>=p;return`<div class="rc stg" style="--i:${i}"><div class="ic">${it.i}</div><div class="nm">${it.n}${n>1?' ×'+n:''}</div><div class="ds">${it.d||''}</div><div class="cost">🪙 ${p}</div><button class="qb ${ok?'pink':''}" data-buy="${k}" data-p="${p}" data-n="${n}" ${ok?'':'disabled'}>購買</button></div>`;}).join('');}
  else if(shopTab==='sell'){const list=Object.keys(inv).filter(k=>inv[k]>0&&ITEMS[k].price);html=list.length?list.map((k,i)=>{const it=ITEMS[k];return`<div class="rc stg" style="--i:${i}"><div class="ic">${it.i}</div><div class="nm">${it.n} ×${inv[k]}</div><div class="cost">每個 🪙${it.price}</div><div style="display:flex;gap:4px"><button class="qb" data-sell="${k}" data-n="1">賣 1</button><button class="qb claim" data-sell="${k}" data-n="all">全部</button></div></div>`;}).join(''):'<div class="sub">沒有可以賣的東西～</div>';}
  else html=(S.menu||RAMEN).map((r,i)=>{const ok=ply.coins>=r.p;return`<div class="rc stg" style="--i:${i}"><div class="ic">${r.i}</div><div class="nm">${r.n}</div><div class="ds">${r.d}</div><div class="cost">🪙 ${r.p}</div><button class="qb ${ok?'pink':''}" data-eat="${i}" ${ok?'':'disabled'}>點餐</button></div>`;}).join('');
  $('shopGrid').innerHTML=html;if(!anim)noAnim($('shopGrid'));}
$('shopTabs').addEventListener('click',e=>{const b=e.target.closest('[data-st]');if(!b)return;shopTab=b.dataset.st;renderShop();const p=$('shop');p.classList.remove('show');void p.offsetWidth;p.classList.add('show');});
$('shopGrid').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const r=b.getBoundingClientRect();
  if(b.dataset.buy){const p=+b.dataset.p;if(ply.coins<p)return;ply.coins-=p;addItem(b.dataset.buy,+b.dataset.n);SFX.coin();sparkle(r.left+r.width/2,r.top,10);toast(`買了 ${ITEMS[b.dataset.buy].n}！`);renderShop(false);}
  else if(b.dataset.sell){const k=b.dataset.sell,n=b.dataset.n==='all'?inv[k]:1;inv[k]-=n;const gain=n*ITEMS[k].price;renderHotbar();SFX.coin();
    for(let i=0;i<Math.min(10,gain);i++)setTimeout(()=>flyReward('coin',gain/Math.min(10,gain),r.left+r.width/2+R(-15,15),r.top),i*40);renderShop(false);}
  else if(b.dataset.eat){const m=(SHOPS[shopKind].menu||RAMEN)[+b.dataset.eat];if(ply.coins<m.p)return;ply.coins-=m.p;closePanel('shop');SFX.slurp();P.setFace('happy');
    fade(`呼嚕嚕～ ${m.i}`,()=>{ply.en=Math.min(100,ply.en+m.en);ply.hp=Math.min(ply.max,ply.hp+m.hp);updateHUD();},()=>{toast(`好好吃！${m.d} ✨`);P.setFace('open');sparkle(innerWidth/2,innerHeight*0.45,16);save();});}
  updateHUD();save();});

// ---------- 天賦（側邊抽屜） ----------
function renderTalents(anim=true){$('spInfo').textContent=ply.sp;
  $('tList').innerHTML=Object.entries(TALENTS).map(([k,t],i)=>`<div class="tbranch stg" style="--i:${i}"><div class="th">${t.i} ${t.n}</div><div class="tnodes">${t.nodes.map(([n,d],j)=>{
    const got=tal[k]>j,can=!got&&tal[k]===j&&ply.sp>0;return`<div class="tnode ${got?'got':can?'can':tal[k]<j?'lock':''}" data-t="${k}" data-j="${j}"><b>${got?'✅':can?'✨':'🔒'} ${n}</b>${d}</div>`;}).join('')}</div></div>`).join('');
  if(!anim)noAnim($('tList'));}
$('tList').addEventListener('click',e=>{const n=e.target.closest('.tnode.can');if(!n)return;const k=n.dataset.t;tal[k]++;ply.sp--;SFX.craft();const r=n.getBoundingClientRect();sparkle(r.left+r.width/2,r.top+r.height/2,16);
  toast(`學會了「${TALENTS[k].nodes[tal[k]-1][0]}」！`);renderTalents(false);bump(document.querySelector(`.tnode[data-t="${k}"][data-j="${tal[k]-1}"]`));updateHUD();save();});
function openTalents(){if(!started||ply.sleeping)return;renderTalents();openPanel('talent');}

// ---------- 對話 ----------
let dlg=null,typeTimer=null;
function talkTo(n){dlg={n,i:0};n.talking=true;paused=true;holdAtk=holdAct=false;$('dlg').style.display='block';$('dlgName').textContent=n.name;SFX.open();showLine();}
function showLine(text){const n=dlg.n;const night=(hour()>=21||hour()<6)&&!n.stall;
  const full=text||(night?'（打了個呵欠）…好睏喔，我們明天再聊吧～':n.lines[dlg.i]);
  $('dlgOpts').innerHTML='';$('dlgTxt').textContent='';let k=0;clearInterval(typeTimer);dlg.typing=true;dlg.full=full;
  typeTimer=setInterval(()=>{k++;$('dlgTxt').textContent=full.slice(0,k);if(k%2===0)SFX.blip(n.voice);if(k>=full.length){clearInterval(typeTimer);dlg.typing=false;afterLine();}},30);}
function afterLine(){const n=dlg.n;if(n.shop){const lbl=n.shop==='ramen'?'🍜 看菜單':n.shop==='castle'?'🍽️ 看菜單':'🛍️ 看看商品';
  $('dlgOpts').innerHTML=`<button class="qb pink" data-o="shop" style="--i:0">${lbl}</button><button class="qb lav" data-o="bye" style="--i:1">再見</button>`;}}
$('dlgOpts').addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('[data-o]');if(!b)return;const kind=dlg.n.shop;endTalk();if(b.dataset.o==='shop')setTimeout(()=>openShop(kind),120);});
$('dlg').addEventListener('click',()=>{if(!dlg)return;
  if(dlg.typing){clearInterval(typeTimer);dlg.typing=false;$('dlgTxt').textContent=dlg.full;afterLine();return;}
  if(dlg.n.shop)return;const night=hour()>=21||hour()<6;
  if(night||dlg.i>=dlg.n.lines.length-1){endTalk();return;}dlg.i++;showLine();});
function endTalk(){clearInterval(typeTimer);if(dlg)dlg.n.talking=false;dlg=null;$('dlg').style.display='none';paused=false;SFX.close();}

// ---------- 物品欄 ----------
const HB_ORDER=['skin_flame','skin_thunder','skin_wind','skin_ice','churro','sword','spear','bow','staff','hoe','can','net','rod',...Object.keys(CROPS).map(k=>'seed_'+k),'cake',...Object.keys(CROPS),...Object.keys(FRUITS),...Object.keys(FISH),'plank','plush','bench','bed','sofa','bathtub','chair','table','shelf','rug','campfire','lantern','pot','fence','wood','stone','weed','gem',...Object.keys(BUGS),'axe2','axe1','pick2','pick1'];
// 10 格快捷欄（1~0）＋背包
let hb=new Array(10).fill(null),hbKeys=hb;
const AUTO_HB=k=>['weapon','held','seed','furn','food','block','skin'].includes(ITEMS[k].k);
function hbAuto(k){if(!AUTO_HB(k)||hb.includes(k))return;const i=hb.indexOf(null);if(i>=0)hb[i]=k;}
function hbIndexOfCur(){const c=curSlot();return c?hb.indexOf(c):-1;}
function renderHotbar(changed){
  if(changed&&(inv[changed]||0)>0)hbAuto(changed);
  for(let i=0;i<10;i++)if(hb[i]&&!(inv[hb[i]]>0))hb[i]=null;
  if(ply.held&&!(inv[ply.held]>0)){ply.held=null;refreshHeld();}
  if(ply.weapon!=='stick'&&!(inv[ply.weapon]>0)){ply.weapon='stick';refreshHeld();}
  const cur=curSlot();
  $('hotbar').innerHTML=hb.map((k,i)=>{const num=`<u>${(i+1)%10}</u>`;if(!k)return`<button class="slot empty" data-i="${i}">${num}</button>`;
    const it=ITEMS[k];const sel=k===cur;const eq=ply.weapon===k||ply.hat===k||(it.k==='skin'&&ply.skins&&ply.skins[it.for]===k);const cnt=(it.k==='tool'||it.k==='weapon'||it.k==='held'||it.k==='skin'||it.k==='hat')?'':`<i>${inv[k]}</i>`;
    const dot=it.k==='bug'?`<span class="bugdot" style="background:${it.col}"></span>`:'';
    return`<button class="slot ${sel?'sel':''} ${eq?'eq':''}" data-i="${i}" data-k="${k}" title="${it.n}">${num}${dot}${itIcon(k)}${cnt}</button>`;}).join('')+`<button class="slot bagBtn" id="bagBtn" title="背包 (B)">🎒</button>`;
  if(changed){const el=$('hotbar').querySelector(`[data-k="${changed}"]`);el?bump(el):bump($('bagBtn'));}
  if($('bag').classList.contains('show'))renderBag(false);
}
function updateAtkIcon(){$('atkIcon').textContent={flame:'🔥',thunder:'⚡',windbow:'🍃',icestaff:'❄️',churro:'🥖',stick:'⚔️',sword:'🗡️',spear:'🔱',bow:'🏹',staff:'🪄'}[wpnModel()];}
function useSlot(k){const it=ITEMS[k];if(!it)return;
  if(it.k==='weapon'){ply.weapon=ply.weapon===k?'stick':k;ply.held=null;if(carry)carryCancel();refreshHeld();updateAtkIcon();showHbLabel(ply.weapon==='stick'?'收起武器':`${it.i} ${it.n}`);SFX.click();}
  else if(it.k==='held'||it.k==='seed'||it.k==='block'){if(carry)carryCancel();ply.held=ply.held===k?null:k;if(ply.held==='plank')showHbLabel('🟫 木塊：對準位置按「蓋方塊」，可按 👁️ 切第一人稱');refreshHeld();showHbLabel(ply.held?`${it.i} ${it.n}`:'空手');SFX.click();}
  else if(it.k==='furn'){if(carry&&carry.id===k&&!carry.orig)carryCancel();else{if(carry)carryCancel();ply.held=null;startCarry(k,null);showHbLabel(`${it.i} ${it.n}：按「放置」放下`);}}
  else if(it.k==='hat'){ply.hat=ply.hat===k?null:k;applyHat();showHbLabel(ply.hat?`${it.i} 戴上「${it.n}」！`:'脫下帽子');SFX.click();if(ply.hat&&P){P.sqv-=4;const p=P.g.position;burst(p.x,p.y+P.topY+0.4,p.z,[0xff9ec4,0xffd36e,0x8fd0ff],10,2.5);}save();}
  else if(it.k==='skin'){const w=it.for;ply.skins=ply.skins||{};ply.skins[w]=ply.skins[w]===k?null:k;refreshHeld();const WN={sword:'🗡️ 木劍',spear:'🔱 長槍',bow:'🏹 弓箭',staff:'🪄 法杖'}[w];showHbLabel(ply.skins[w]?`${it.i} ${WN}換成「${it.n}」外觀！`:`換回${WN}原本的外觀`);updateAtkIcon();SFX.click();if(ply.skins[w]&&!has(w))toast(`先做一把${WN}，裝備時就會變成${it.n}喔`);save();}
  else if(it.k==='food'){inv[k]--;ply.hp=Math.min(ply.max,ply.hp+(it.hp||2));ply.en=Math.min(100,ply.en+(it.en||5));SFX.eat();P.setFace('happy');setTimeout(()=>P.setFace('open'),800);floatTxt(`💗＋⚡${it.en||5}`,innerWidth/2,innerHeight*0.45);updateHUD();save();}
  else toast(`${it.i} ${it.n}${it.d?'：'+it.d:''}${inv[k]>1?' ×'+inv[k]:''}`);
  renderHotbar();}
function useHb(i){const k=hb[i];if(!k){showHbLabel(`第 ${(i+1)%10} 格是空的`);return;}const el=$('hotbar').querySelector(`[data-i="${i}"]`);useSlot(k);const el2=$('hotbar').querySelector(`[data-i="${i}"]`);if(el2)bump(el2);}
const SELECTABLE=k=>k&&['weapon','held','seed','furn','block'].includes(ITEMS[k].k);
function curSlot(){if(carry&&!carry.orig)return carry.id;if(ply.held)return ply.held;if(ply.weapon!=='stick')return ply.weapon;return null;}
function selectSlot(k){const it=ITEMS[k];if(carry&&(carry.id!==k||carry.orig))carryCancel();
  if(it.k==='weapon'){ply.weapon=k;ply.held=null;}else if(it.k==='held'||it.k==='seed'||it.k==='block'){ply.held=k;}else if(it.k==='furn'){ply.held=null;if(!carry)startCarry(k,null);}
  refreshHeld();updateAtkIcon();renderHotbar();const el=$('hotbar').querySelector(`[data-k="${k}"]`);if(el)bump(el);showHbLabel(`${it.i} ${it.n}`);SFX.click();}
function cycleSlot(dir){const idx=[];for(let i=0;i<10;i++)if(SELECTABLE(hb[i]))idx.push(i);if(!idx.length)return;const ci=hbIndexOfCur();let p=idx.indexOf(ci);p=p<0?(dir>0?0:idx.length-1):(p+dir+idx.length)%idx.length;selectSlot(hb[idx[p]]);}
let hbLabelT=null;
function showHbLabel(txt){let el=$('hbLabel');if(!el){el=document.createElement('div');el.id='hbLabel';document.body.appendChild(el);}el.textContent=txt;el.classList.remove('hide');bump(el,'lblIn');clearTimeout(hbLabelT);hbLabelT=setTimeout(()=>el.classList.add('hide'),1200);}
$('hotbar').addEventListener('click',e=>{const b=e.target.closest('.slot');if(!b)return;if(b.id==='bagBtn'){openBag();return;}const i=+b.dataset.i;if(hb[i])useHb(i);else openBag();});
// ---------- 時裝帽子 ----------
const hatStyle=()=>ply.hat&&ITEMS[ply.hat]&&inv[ply.hat]>0?ITEMS[ply.hat].hat:'none';
function applyHat(){look.hat=hatStyle();if(P&&P.setHat)P.setHat(look.hat);renderHotbar();}
const HAT_THUMB={};
function hatThumb(k){if(HAT_THUMB[k]!==undefined)return HAT_THUMB[k];let url=null;
  try{const S=128,sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,0.1,20);sc.add(new THREE.HemisphereLight(0xffffff,0xd8c8e0,0.55));const dl=new THREE.DirectionalLight(0xffffff,0.55);dl.position.set(1,2,3);sc.add(dl);
    const r=fashionHat(ITEMS[k].hat,{cy:0.84,R:0.848,V:0.72,topY:1.56});const g=r.g;sc.add(g);g.updateMatrixWorld(true);
    const bx=new THREE.Box3().setFromObject(g),c=bx.getCenter(new THREE.Vector3()),sz=bx.getSize(new THREE.Vector3());const d=Math.max(sz.x,sz.y,sz.z)*2.05;
    cam.position.set(c.x,c.y+d*0.32,c.z+d);cam.lookAt(c);
    const rt=new THREE.WebGLRenderTarget(S,S);const pc=renderer.getClearColor(new THREE.Color()),pa=renderer.getClearAlpha();renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(sc,cam);
    const px=new Uint8Array(S*S*4);renderer.readRenderTargetPixels(rt,0,0,S,S,px);renderer.setRenderTarget(null);renderer.setClearColor(pc,pa);rt.dispose();
    const cv=document.createElement('canvas');cv.width=cv.height=S;const cx=cv.getContext('2d'),im=cx.createImageData(S,S);
    for(let y=0;y<S;y++)im.data.set(px.subarray((S-1-y)*S*4,(S-y)*S*4),y*S*4);cx.putImageData(im,0,0);url=cv.toDataURL();}catch(e){url=null;}
  return HAT_THUMB[k]=url;}
const itIcon=k=>{const it=ITEMS[k];if(it.k==='hat'){const u=hatThumb(k);if(u)return`<img class="hic" src="${u}" alt="${it.i}">`;}return it.i;};

// ---------- 背包 ----------
const HAT_IDS=['hat_bow','hat_sprout','hat_jelly','hat_party','hat_bucket'];
const BAG_ORDER=[...HAT_IDS,'skin_flame','skin_thunder','skin_wind','skin_ice','churro','sword','spear','bow','staff','hoe','can','net','rod','axe2','axe1','pick2','pick1',...Object.keys(CROPS).map(k=>'seed_'+k),'cake',...Object.keys(CROPS),...Object.keys(FRUITS),...Object.keys(FISH),
  'plank','plush','bench','bed','sofa','bathtub','chair','table','shelf','rug','campfire','lantern','pot','fence','wood','stone','weed','gem','crystal',...Object.keys(BUGS)];
const BAG_TABS=[['all','全部'],['gear','裝備'],['hat','時裝'],['use','食物種子'],['furn','家具'],['mat','素材']];
const tabOf=k=>{const t=ITEMS[k].k;return t==='hat'?'hat':t==='weapon'||t==='tool'||t==='held'||t==='skin'?'gear':t==='food'||t==='seed'?'use':t==='furn'||t==='block'?'furn':'mat';};
let bagTab='all',bagPick=null,drag=null;
function renderBag(anim=true){const keys=BAG_ORDER.filter(k=>(inv[k]||0)>0&&(bagTab==='all'||tabOf(k)===bagTab));
  $('bagTabs').innerHTML=BAG_TABS.map(([k,t])=>`<button class="tab ${k===bagTab?'on':''}" data-bt="${k}">${t}</button>`).join('');
  $('bagGrid').innerHTML=keys.length?keys.map((k,i)=>{const it=ITEMS[k];const inHb=hb.includes(k);const eq=ply.hat===k||ply.weapon===k||(it.k==='skin'&&ply.skins&&ply.skins[it.for]===k);return`<div class="bi stg ${bagPick===k?'pick':''} ${eq?'eq':''}" style="--i:${Math.min(i,20)}" data-k="${k}">${it.k==='bug'?`<span class="bugdot" style="background:${it.col}"></span>`:''}<span class="ic">${itIcon(k)}</span>${it.k==='tool'||it.k==='weapon'||it.k==='held'||it.k==='skin'||it.k==='hat'?'':`<i>${inv[k]}</i>`}${inHb?'<em>'+((hb.indexOf(k)+1)%10)+'</em>':''}</div>`;}).join(''):'<div class="sub">這裡空空的～</div>';
  $('bagBar').innerHTML=hb.map((k,i)=>`<div class="bs ${k?'':'empty'}" data-i="${i}"><u>${(i+1)%10}</u>${k?itIcon(k):''}</div>`).join('');
  const it=bagPick&&ITEMS[bagPick];$('bagInfo').innerHTML=it?`<b>${it.i} ${it.n}</b>　${it.d||''}${inv[bagPick]>1?`（×${inv[bagPick]}）`:''}<br><small>${it.k==='hat'?(ply.hat===bagPick?'👑 戴著中・再點一次脫下':'點一下戴上'):'點下方快捷欄的格子放進去，或直接拖曳 ↓'}</small>`:'點道具查看說明，拖曳或點選後放到快捷欄。點快捷欄上的道具可以拿掉。';
  if(!anim)noAnim($('bagGrid'));}
function openBag(){if(!started||ply.sleeping)return;bagPick=null;renderBag();openPanel('bag');}
function assignHb(i,k){const j=hb.indexOf(k);if(j>=0)hb[j]=hb[i];hb[i]=k;SFX.place();bagPick=null;renderBag(false);renderHotbar();const el=document.querySelector(`#bagBar [data-i="${i}"]`);if(el)bump(el);save();}
$('bagTabs').addEventListener('click',e=>{const b=e.target.closest('[data-bt]');if(!b)return;bagTab=b.dataset.bt;renderBag();});
$('bagBar').addEventListener('click',e=>{const s=e.target.closest('.bs');if(!s)return;const i=+s.dataset.i;if(bagPick)assignHb(i,bagPick);else if(hb[i]){hb[i]=null;SFX.close();renderBag(false);renderHotbar();save();}});
$('bagGrid').addEventListener('pointerdown',e=>{const c=e.target.closest('.bi');if(!c)return;drag={k:c.dataset.k,x0:e.clientX,y0:e.clientY,el:null,moved:false,id:e.pointerId};});
addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>8){drag.moved=true;drag.el=document.createElement('div');drag.el.className='dragGhost';drag.el.textContent=ITEMS[drag.k].i;document.body.appendChild(drag.el);}
  if(drag.el){drag.el.style.transform=`translate(${e.clientX-26}px,${e.clientY-26}px)`;document.querySelectorAll('#bagBar .bs').forEach(b=>b.classList.remove('hov'));const t=document.elementFromPoint(e.clientX,e.clientY);const bs=t&&t.closest&&t.closest('#bagBar .bs');if(bs)bs.classList.add('hov');}});
addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;
  if(d.el){d.el.remove();document.querySelectorAll('#bagBar .bs').forEach(b=>b.classList.remove('hov'));const t=document.elementFromPoint(e.clientX,e.clientY);const bs=t&&t.closest&&t.closest('#bagBar .bs');if(bs)assignHb(+bs.dataset.i,d.k);}
  else if(ITEMS[d.k].k==='hat'){bagPick=d.k;useSlot(d.k);renderBag(false);}
  else{bagPick=bagPick===d.k?null:d.k;SFX.click();renderBag(false);}});
$('pRot').addEventListener('click',carryRotate);$('pStore').addEventListener('click',carryStore);$('pCancel').addEventListener('click',carryCancel);

// ---------- 遊戲按鈕 ----------
function bindHold(id,down,setHold){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();if(paused)return;setHold(true);down();});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>setHold(false)));}
bindHold('btnAtk',()=>attack(),v=>holdAtk=v);bindHold('btnAct',()=>doAction(),v=>holdAct=v);
$('btnJump').addEventListener('pointerdown',e=>{e.preventDefault();if(!paused)jump();});
$('wakeBtn').addEventListener('click',()=>wakeUp());

// ---------- FAB 扇形選單（漢堡變形） ----------
// 選單泡泡：從 ☰ 往左排成一行；左邊放不下時改排在小地圖下方（靠右對齊）
function layoutFan(){const fans=[...document.querySelectorAll('.fan')];const n=fans.length,fab=$('fab');if(!n||!fab.offsetWidth)return;
  const fr=fab.getBoundingClientRect(),b=fans[0].offsetWidth,gap=innerWidth<=560?5:10;let step=b+gap;const cx=fr.left+fr.width/2,cy=fr.top+fr.height/2;
  let pos;if(cx-n*step-b/2>=6)pos=fans.map((_,i)=>[-(i+1)*step,0]);
  else{const mr=$('mini').getBoundingClientRect(),rc=innerWidth-6-b/2;step=Math.min(step,(rc-6-b/2)/(n-1));const y=Math.max(mr.bottom,$('statBox').getBoundingClientRect().bottom)+8+b/2;pos=fans.map((_,i)=>[rc-i*step-cx,y-cy]);}
  fans.forEach((f,i)=>{const k=+f.style.getPropertyValue('--i');f.style.setProperty('--tx',pos[k][0]+'px');f.style.setProperty('--ty',pos[k][1]+'px');});}
layoutFan();
function closeFab(){$('topR').classList.remove('open');$('fab').classList.remove('open');}
$('fab').addEventListener('click',()=>{const o=!$('fab').classList.contains('open');if(o)layoutFan();$('fab').classList.toggle('open',o);$('topR').classList.toggle('open',o);SFX[o?'open':'close']();});
document.querySelectorAll('.fan').forEach(b=>b.addEventListener('click',()=>{const f=b.dataset.f;
  if(f==='craft'){closeFab();openCraft();}
  else if(f==='tal'){closeFab();openTalents();}
  else if(f==='deco'){decoMode=!decoMode;document.body.classList.toggle('deco',decoMode);$('decoLbl').textContent=decoMode?'結束布置':'布置';if(!decoMode&&carry)carryCancel();toast(decoMode?'布置模式開啟 🛋️':'布置模式關閉');}
  else if(f==='bag'){closeFab();openBag();}
  else if(f==='full'){toggleFull();}
  else if(f==='set'){closeFab();openSettings();}
  else if(f==='social'){openSocial();}
  else if(f==='dex'){closeFab();openDex();}}));
addEventListener('resize',layoutFan);
// ---------- 設置（音量） ----------
const VOL={m:1,b:1,s:1};try{Object.assign(VOL,JSON.parse(localStorage.getItem('lobster-vol')||'{}'));}catch(e){}
function applyVol(){if(master)master.gain.value=VOL.m;if(sfxG)sfxG.gain.value=0.75*VOL.s;for(const k of['M','B','S']){const v=VOL[k.toLowerCase()];$('v'+k).value=v;$('v'+k+'v').textContent=Math.round(v*100)+'%';}}
window.musicVol=()=>VOL.b;
['M','B','S'].forEach(k=>$('v'+k).addEventListener('input',e=>{VOL[k.toLowerCase()]=+e.target.value;applyVol();try{localStorage.setItem('lobster-vol',JSON.stringify(VOL));}catch(_){}if(k==='S')SFX.coin();}));
function openSettings(){applyVol();openPanel('settings');}
$('setBtn').addEventListener('click',()=>{initAudio();openSettings();});
$('setSave').addEventListener('click',()=>{if(started){save(true);toast('存檔完成 💾');}else toast('開始遊戲後才能存檔喔');});
$('setFs').addEventListener('click',toggleFull);$('fsBtn').addEventListener('click',toggleFull);
// ---------- 全螢幕 ----------
const isIOS=/iP(hone|od)/.test(navigator.userAgent)||(/Mac/.test(navigator.userAgent)&&navigator.maxTouchPoints>1&&!document.documentElement.requestFullscreen);
function toggleFull(){const d=document,el=d.documentElement;const fs=d.fullscreenElement||d.webkitFullscreenElement;
  try{if(fs){(d.exitFullscreen||d.webkitExitFullscreen).call(d);return;}const req=el.requestFullscreen||el.webkitRequestFullscreen;
    if(req&&!isIOS){const r=req.call(el,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>openPanel('iosFs'));try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('any').catch(()=>{});}catch(_){}}
    else openPanel('iosFs');}catch(e){openPanel('iosFs');}}


// ---------- 飛行獎勵（金幣／經驗值飛進 HUD） ----------
const flies=[];let coinShown=0,flyCombo=0,flyComboT=0;
function flyReward(kind,val,x,y){const el=document.createElement('div');el.className='fly '+kind;if(kind==='coin')el.textContent='🪙';document.body.appendChild(el);
  const tgt=(kind==='coin'?$('coinPill'):$('xpBar')).getBoundingClientRect();
  flies.push({el,kind,val,x0:x,y0:y,cx:x+R(-90,90),cy:y-R(60,160),x1:tgt.left+(kind==='coin'?18:tgt.width*0.6),y1:tgt.top+tgt.height/2,t:-R(0,0.12),dur:R(0.5,0.75)});}
function arrive(f){if(f.kind==='coin'){ply.coins+=Math.round(f.val);SFX.coin(flyCombo);bump($('coinPill'));}else{grantXP(f.val);SFX.xp(flyCombo);const b=$('xpBar');b.classList.add('glow');clearTimeout(b._t);b._t=setTimeout(()=>b.classList.remove('glow'),250);bump($('lvBadge'));}
  flyCombo++;flyComboT=0.5;}
function uiFrame(dt){
  for(let i=flies.length-1;i>=0;i--){const f=flies[i];f.t+=dt;if(f.t<0){f.el.style.opacity=0;continue;}f.el.style.opacity=1;const s=Math.min(f.t/f.dur,1),e=s*s*(3-2*s);
    const x=(1-e)*(1-e)*f.x0+2*(1-e)*e*f.cx+e*e*f.x1,y=(1-e)*(1-e)*f.y0+2*(1-e)*e*f.cy+e*e*f.y1;const sc=s<0.2?0.4+s*4:1.2-s*0.5;
    f.el.style.transform=`translate(${x-10}px,${y-10}px) scale(${sc}) rotate(${s*360}deg)`;if(s>=1){f.el.remove();flies.splice(i,1);arrive(f);}}
  if(flyComboT>0){flyComboT-=dt;if(flyComboT<=0)flyCombo=0;}
  if(coinShown!==ply.coins){const d=ply.coins-coinShown;coinShown+=Math.sign(d)*Math.max(1,Math.ceil(Math.abs(d)*Math.min(1,dt*10)));if(Math.abs(ply.coins-coinShown)<1)coinShown=ply.coins;$('coins').textContent=coinShown;}
}

// ---------- 升級（Circle Reveal） ----------
function levelUpFX(){const L=$('lvPop');$('lvPopN').textContent='Lv.'+ply.lv;L.classList.remove('on','out');void L.offsetWidth;L.classList.add('on');SFX.levelup();P.setFace('happy');P.sqv+=8;
  ring(ply.x,ply.y+0.1,ply.z,0xffd36e,0.4,5,0.7);ring(ply.x,ply.y+0.2,ply.z,0xff9ec7,0.3,3.5,0.6);burst(ply.x,ply.y+1,ply.z,PAST.map(c=>parseInt(c.slice(1),16)),30,7);
  const t0=performance.now();let k=0;const follow=()=>{const t=performance.now()-t0;const sp=worldToScreen(ply.x,ply.y+2.5,ply.z);L.style.left=sp.x+'px';L.style.top=(sp.y-Math.min(t/400,1)*14)+'px';
    if(t<300&&k++%3===0)sparkle(sp.x,sp.y-20,4);if(t>2100)L.classList.add('out');if(t<2500)requestAnimationFrame(follow);else{L.classList.remove('on','out');P.setFace('open');}};follow();
  bump($('lvBadge'));$('fab').classList.add('dot');}

// ---------- HUD ----------
let lastHp=10;
function updateHUD(){
  const h=Math.floor(hour()),mm=Math.floor(tmin%60);
  $('timeIco').textContent=isNight()?'🌙':(h<17?'☀️':'🌇');$('timeTxt').textContent=`第 ${day} 天 ${String(h).padStart(2,'0')}:${String(mm-mm%10).padStart(2,'0')}`;
  $('hpFill').style.width=(ply.hp/ply.max*100)+'%';$('enFill').style.width=ply.en+'%';$('enTxt').textContent=ply.en<25?'好睏…':'';
  $('lvBadge').textContent=ply.lv;const need=xpNeed(ply.lv);$('xpFill').style.width=(ply.xp/need*100)+'%';$('xpTxt').textContent=`${Math.floor(ply.xp)} / ${need}`;
  if(Math.ceil(ply.hp)<lastHp)bump($('statBox'),'shake');lastHp=Math.ceil(ply.hp);
  $('spDot').textContent=ply.sp;document.querySelector('.fan[data-f="tal"]').classList.toggle('has',ply.sp>0);$('fab').classList.toggle('dot',ply.sp>0);
  const ql=Object.values(Q).filter(q=>q.state!=='none');const qd=$('qdrop');qd.style.display=ql.length?'block':'none';$('qCount').textContent=`(${ql.length})`;
  const html=ql.map((q,i)=>`<div style="transition-delay:${i*60}ms">${q.state==='ready'?`✅ ${q.name}：回告示板`:`${q.icon} ${q.name} ${q.prog}/${q.need}`}</div>`).join('');
  if($('qlistMini').innerHTML!==html)$('qlistMini').innerHTML=html;
}
const mini=$('mini').getContext('2d');
function drawMini(){
  const S=208,sc=S/240,X=x=>(x+120)*sc,Z=z=>(z+120)*sc;const mc=$('mini'),want=Math.round(mc.clientWidth*Math.min(devicePixelRatio||1,2))||208;if(mc.width!==want){mc.width=mc.height=want;}const kk=mc.width/208;
  mini.setTransform(kk,0,0,kk,0,0);mini.save();mini.clearRect(0,0,S,S);mini.beginPath();mini.arc(S/2,S/2,S/2,0,7);mini.clip();
  if(ply.cave){mini.fillStyle='#3a2f4a';mini.fillRect(0,0,S,S);const cs=S/(CAVE.r*2.4);mini.fillStyle='#5a4a6c';mini.beginPath();mini.arc(S/2,S/2,CAVE.r*cs,0,7);mini.fill();
    mini.fillStyle='#fff3c0';mini.fillRect(S/2+(CAVE_EXIT.x-CAVE.x)*cs-5,S/2+(CAVE_EXIT.z-CAVE.z)*cs-3,10,6);for(const m of monsters)if(m.cave&&m.dead<0){mini.fillStyle=m.c.mat.color.getStyle();mini.beginPath();mini.arc(S/2+(m.x-CAVE.x)*cs,S/2+(m.z-CAVE.z)*cs,3,0,7);mini.fill();}
    mini.fillStyle='#fff';mini.beginPath();mini.arc(S/2+(ply.x-CAVE.x)*cs,S/2+(ply.z-CAVE.z)*cs,4,0,7);mini.fill();mini.restore();return;}
  mini.fillStyle='#a8dc94';mini.fillRect(0,0,S,S);mini.fillStyle='#bce6a0';mini.fillRect(X(-72),Z(-78),114*sc,64*sc);
  mini.fillStyle=isNight()?'#9a8ad8':'#8ec4b0';mini.fillRect(X(isNight()?36:50),0,S,S);
  mini.strokeStyle='#f0d9a6';mini.lineWidth=4;mini.lineCap='round';for(const p of PATHS){mini.beginPath();mini.moveTo(X(p[0]),Z(p[1]));mini.lineTo(X(p[2]),Z(p[3]));mini.stroke();}
  mini.fillStyle='#f2dcae';mini.beginPath();mini.arc(X(V2.x),Z(V2.z),12*sc*1.4,0,7);mini.fill();
  mini.fillStyle='#f2dcae';mini.beginPath();mini.arc(X(V3.x),Z(V3.z),11*sc*1.4,0,7);mini.fill();
  mini.fillStyle='#ffe0ea';mini.beginPath();mini.arc(X(PARK.x),Z(PARK.z),PARK.r*sc,0,7);mini.fill();mini.fillStyle='#ff9ec4';mini.font='900 18px sans-serif';mini.textAlign='center';mini.textBaseline='middle';mini.fillText('🎡',X(PARK.x),Z(PARK.z));mini.fillStyle='#ff8f7a';mini.fillRect(X(HOUSE.x)-HOME.w*sc,Z(HOUSE.z)-HOME.d*sc,HOME.w*2*sc,HOME.d*2*sc);for(const h of V2HOUSES)mini.fillRect(X(h.x)-3,Z(h.z)-3,7,7);mini.fillStyle='#ffc94a';for(const h of V3HOUSES)mini.fillRect(X(h.x)-3,Z(h.z)-3,7,7);
  mini.fillStyle='#b9a6f2';mini.fillRect(X(STAGE.x)-6,Z(STAGE.z)-3,12,6);for(const k in STALLS){const s=STALLS[k];mini.fillStyle='#ffd36e';mini.fillRect(X(s.x)-3,Z(s.z)-3,6,6);}
  mini.fillStyle='#ffc83d';mini.beginPath();mini.arc(X(BOARD.x),Z(BOARD.z),4,0,7);mini.fill();
  mini.fillStyle='#a0703a';for(const t of farm.values())mini.fillRect(X(t.x)-1.5,Z(t.z)-1.5,3,3);
  {mini.fillStyle='#3f8a3a';for(const w of weeds)mini.fillRect(X(w.x)-1,Z(w.z)-1,3,3);}
  mini.fillStyle='#f0874f';for(const n of npcs)if(!n.away){mini.beginPath();mini.arc(X(n.x),Z(n.z),2.6,0,7);mini.fill();}
  mini.fillStyle='#7cc8f0';mini.beginPath();mini.arc(X(POND.x),Z(POND.z),POND.r*sc,0,7);mini.fill();mini.fillStyle='#847696';mini.beginPath();mini.arc(X(CAVE_DOOR.x),Z(CAVE_DOOR.z),4,0,7);mini.fill();
  for(const p of pets)if(!p.cave&&!p.indoor){mini.fillStyle='#ff9ec7';mini.fillRect(X(p.x)-2,Z(p.z)-2,4,4);}
  mini.fillStyle='#ff6fa8';for(const m of monsters)if(m.dead<0&&!m.cave){mini.beginPath();mini.arc(X(m.x),Z(m.z),2.6,0,7);mini.fill();}
  mini.translate(X(ply.x),Z(ply.z));mini.rotate(-ply.face+Math.PI);mini.fillStyle='#fff';mini.strokeStyle='#f0874f';mini.lineWidth=2.5;
  mini.beginPath();mini.moveTo(0,-8);mini.lineTo(6,6);mini.lineTo(-6,6);mini.closePath();mini.fill();mini.stroke();mini.restore();
}

// ---------- 天空（柔和） ----------
const SKY={dT:new THREE.Color(0x3d92d8),dB:new THREE.Color(0xbfe6fb),sT:new THREE.Color(0xb9a2f0),sB:new THREE.Color(0xffc8b4),nT:new THREE.Color(0x232a5a),nB:new THREE.Color(0x5d5a9a),
  iT:new THREE.Color(0x6a4a52),iB:new THREE.Color(0xa07a78),winOff:new THREE.Color(0xa8c8d8),winOn:new THREE.Color(0xffe2a8),hemiN:new THREE.Color(0xa8a0f0),sunC:new THREE.Color(0xfff4e6),dusk:new THREE.Color(0xffb8a0)};
let dayF=1;
const _sd=new THREE.Vector3(),_sr=new THREE.Vector3(),_su=new THREE.Vector3(),_sp=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);
function updateSky(){if(typeof MOUNTAINS!=='undefined'){const out=!ply.cave;MOUNTAINS.visible=out;OUTERG.visible=out;for(const c of clouds)c.visible=out;}
  const a=(tmin/1440)*Math.PI*2-Math.PI/2,sh=Math.sin(a),sc=Math.cos(a);
  dayF=clamp(sh*2.5+0.35,0,1);const dusk=clamp(1-Math.abs(sh)/0.3,0,1)*0.65;
  if(ply.indoor){skyU.top.value.copy(SKY.iT);skyU.bot.value.copy(SKY.iB);scene.fog.far=1000;scene.fog.near=900;}
  else if(ply.cave){const cf=typeof caveFog==='function'?caveFog():[0x120c1e,0x2a1f3a];skyU.top.value.setHex(cf[0]);skyU.bot.value.setHex(cf[1]);scene.fog.color.setHex(cf[1]);scene.fog.near=18;scene.fog.far=55;}
  else{skyU.top.value.copy(SKY.nT).lerp(SKY.dT,dayF).lerp(SKY.sT,dusk);skyU.bot.value.copy(SKY.nB).lerp(SKY.dB,dayF).lerp(SKY.sB,dusk);
    scene.fog.color.copy(skyU.bot.value);scene.fog.far=lerp(110,240,dayF);scene.fog.near=lerp(20,45,dayF);}
  {// 影子不閃爍：太陽方向每 4 分鐘才更新一次，並把影子相機對齊像素格
   const aq=(Math.floor(tmin/4)*4/1440)*Math.PI*2-Math.PI/2,sq=Math.sin(aq),cq=Math.cos(aq);_sd.set(cq*60,Math.max(sq,0.05)*80,30).normalize();
   _sr.crossVectors(_up,_sd).normalize();_su.crossVectors(_sd,_sr);const tx=56/1024;_sp.set(ply.x,0,ply.z);
   const u=Math.round(_sp.dot(_sr)/tx)*tx,v=Math.round(_sp.dot(_su)/tx)*tx,w=_sp.dot(_sd);_sp.copy(_sr).multiplyScalar(u).addScaledVector(_su,v).addScaledVector(_sd,w);
   sun.target.position.copy(_sp);sun.position.copy(_sp).addScaledVector(_sd,100);}sun.castShadow=dayF>0.05;
  sun.intensity=0.3*dayF;sun.color.copy(SKY.sunC).lerp(SKY.dusk,clamp(1-sh/0.35,0,1)*0.45);
  hemi.intensity=ply.cave?0.42:0.5+0.1*dayF;hemi.color.setHex(0xffffff).lerp(SKY.hemiN,1-dayF);amb.intensity=0.12+0.03*dayF;
  moonL.position.set(ply.x-sc*60,Math.max(-sh,0.1)*80,ply.z-20);moonL.target.position.set(ply.x,0,ply.z);moonL.intensity=0.2*(1-dayF);
  if(ply.cave){sun.intensity=0;moonL.intensity=0;}
  moon.position.set(ply.x-sc*240,-sh*220+10,ply.z-80);moon.visible=sh<0.1&&!ply.indoor&&!ply.cave;
  starMat.opacity=(ply.indoor||ply.cave)?0:clamp(1-dayF*1.6,0,1);stars.position.set(ply.x,0,ply.z);
  const night=dayF<0.45;for(const w of windowMats)w.color.copy(night?SKY.winOn:SKY.winOff);
  for(const w of indoorWin)w.color.copy(SKY.nT).lerp(SKY.dT,dayF).lerp(SKY.sT,dusk);
  HOMEV.light.intensity=inHouse(ply.x,ply.z,-3)?(night?0.55:0.15):(night?0.3:0);
  for(const l of lamps){if(l.L)l.L.intensity=night?0.5:0;l.bm.color.setHex(night?0xffeec8:0xe8e2d8);}
  for(const p of placed){if(p.g.userData.glow)p.g.userData.glow.color.setHex(night?0xffe6b0:0xfff3e0);if(p.light)p.light.intensity=p.id==='campfire'?(0.55+Math.sin(performance.now()*0.02)*0.1)*(night?1.0:0.3):(night?0.5:0);}
}

// ---------- 存檔 ----------
const SAVE_KEY='lobster-save-v4';
function save(force){if(!started)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify({day,tmin,coins:ply.coins,hp:ply.hp,max:ply.max,en:ply.en,lv:ply.lv,xp:ply.xp,sp:ply.sp,inv,tal,weapon:ply.weapon,hb,ver:5,skins:ply.skins||{},hat:ply.hat||null,cave:!!ply.cave,pets:pets.filter(p=>!p.d.gacha).map(p=>[p.aff,p.follow?1:0]),gp:pets.filter(p=>p.d.gacha).map(p=>[p.d.type,p.d.name,p.follow?1:0,p.aff]),blocks:[...blocks.values()].map(b=>[b.i,b.j,b.k]),x:ply.x,z:ply.z,
  Q:Object.fromEntries(Object.entries(Q).map(([k,q])=>[k,[q.state,q.prog,q.times]])),placed:placed.map(p=>[p.id,p.x,p.z,p.ry,+p.y.toFixed(3)]),
  farm:[...farm.values()].map(t=>[t.gx,t.gz,t.wet?1:0,t.crop?t.crop.type:'',t.crop?t.crop.stage:0,t.crop?t.crop.g:0])}));localStorage.setItem('lobster-look',JSON.stringify(look));}catch(e){}}
function loadSave(){try{const s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):null;}catch(e){return null;}}
function applySave(d){day=d.day;tmin=d.tmin;Object.assign(ply,{coins:d.coins,hp:d.hp,max:d.max||10,en:d.en,lv:d.lv||1,xp:d.xp||0,sp:d.sp||0,weapon:d.weapon||'stick',skins:d.skins||(d.skin?{sword:d.skin}:{}),indoor:false,cave:!!d.cave,x:d.x,z:d.z});if(d.indoor){ply.x=HOME.x;ply.z=HOME.z+1;}
  (d.pets||[]).forEach(([a,f],i)=>{if(pets[i]){setAff(pets[i],a);pets[i].follow=!!f;}});
  Object.assign(inv,d.inv);Object.assign(tal,d.tal||{});coinShown=ply.coins;$('coins').textContent=ply.coins;if(Array.isArray(d.hb))for(let i=0;i<10;i++)hb[i]=d.hb[i]||null;else for(const k of BAG_ORDER)if(inv[k]>0)hbAuto(k);
  for(const k in d.Q)if(Q[k])[Q[k].state,Q[k].prog,Q[k].times]=d.Q[k];for(const b of d.blocks||[])blocks.set(bKey(b[0],b[1],b[2]),{i:b[0],j:b[1],k:b[2]});rebuildBlocks();
  for(const[id,x,z,ry,yv]of d.placed){if(d.ver>=5)placeFurn(id,x,z,ry,false,yv);else if(yv){const nx=clamp(HOME.x+(x-400)*(HOME.w-0.6)/8,HOME.x-HOME.w+0.9,HOME.x+HOME.w-0.9),nz=clamp(HOME.z+(z-0)*(HOME.d-0.6)/6.5,HOME.z-HOME.d+0.9,HOME.z+HOME.d-0.9);placeFurn(id,nx,nz,ry,false);}else placeFurn(id,x,z,ry,false);}
  for(const[type,name,f,a]of d.gp||[]){if(!PET_TYPES[type])continue;const p=hatchPet(type,name,true);setAff(p,a);p.follow=!!f;if(!f)sendHome(p);p.x=p.tx;p.z=p.tz;}
  for(const[gx,gz,wet,type,stage,g]of d.farm||[]){const t=till(gx,gz,false);setWet(t,!!wet);if(type){t.crop={type,stage,g};setCropStage(t,stage);t.crop.pop=1;t.crop.mesh.scale.setScalar(1);}}
  ply.hat=d.hat&&ITEMS[d.hat]&&inv[d.hat]>0?d.hat:null;look.hat=hatStyle();
  ply.y=ply.cave?0:standY(ply.x,ply.z,99);}

// ---------- 捏角色 ----------
const BODY_SW=['#f0874f','#e9773e','#ffb3a0','#ffd6e6','#ffe08a','#fff3e2','#c9f0d6','#9edbb0','#cfe4ff','#c4b2f0','#c98a5a','#f5f5f5'];
const ACC_SW=['#6e3428','#5a3022','#8a3a3a','#4a3268','#3f6e55','#f2c49a','#ff9ec4','#b9a6f2','#8fc8f0','#ffd36e','#ffffff','#2a1c18'];
const EYE_SW=['#2a1c18','#000000','#6a3a2a','#5a3a8a','#2a5aa8','#2a7a5a','#a83a3a','#c86a20','#e05a9a'];
const BLUSH_SW=['#ff8ca0','#ff6f8f','#ffa070','#ff9ad8','#c8a0ff','#ff5a5a','#ffb84a'];
const OPTS={species:[['lobster','龍蝦精靈'],['hamster','倉鼠精靈']],ears:[['round','圓耳'],['cat','貓耳'],['bunny','兔耳'],['bear','熊耳'],['sprout','嫩芽'],['none','沒有']],
  eyes:[['round','圓圓'],['big','閃亮大眼'],['star','星星眼'],['dot','豆豆眼'],['oval','長橢圓'],['heart','愛心眼'],['smile','笑瞇瞇'],['line','瞇瞇眼']],
  tail:[['seg','一節節'],['pom','毛球'],['none','無']],
  brow:[['none','無'],['thin','細眉'],['thick','粗眉'],['round','麻呂眉'],['angry','生氣眉'],['worried','八字眉']],
  lash:[['none','無'],['one','一根'],['two','兩根'],['three','三根']],
  mouth:[['zigzag','〰'],['smile','‿'],['w','ω'],['open','▽'],['v','▼'],['o','o'],['line','ー']],
  blushShape:[['none','無'],['oval','橢圓'],['round','圓形'],['heart','愛心'],['lines','斜線'],['star','星星']]};
const SLD={eye:[['eyeSize','大小',0.6,1.9,0.05],['eyeGap','距離',0.13,0.4,0.01],['eyeY','位置',0.86,1.16,0.01]],
  brow:[['browSize','大小',0.5,1.8,0.05],['browGap','距離',0.12,0.4,0.01],['browY','位置',0.08,0.32,0.01]],
  lash:[['lashSize','大小',0.5,2,0.05],['lashGap','距離',0.2,1.3,0.05],['lashY','位置',0,1,0.05]],
  mouth:[['mouthSize','大小',0.6,1.7,0.05],['mouthW','寬度',0.6,1.8,0.05],['mouthY','位置',0.08,0.28,0.01]],
  ear:[['earSize','大小',0.6,1.6,0.05],['earGap','距離',0.6,1.4,0.02],['earY','高低',-0.25,0.2,0.01]],
  tail:[['tailSize','大小',0.6,1.8,0.05],['tailY','高低',-0.3,0.4,0.01],['tailZ','前後',-0.15,0.25,0.01]],
  blush:[['blushSize','大小',0.5,1.8,0.05],['blushGap','距離',0.25,0.6,0.01],['blushY','位置',0,0.3,0.01]]};
function normLook(){look=Object.assign({},DEF_LOOK,look);look.hat=hatStyle();if(look.blush===true&&(!look.blushShape||look.blushShape==='none'))look.blushShape='oval';look.blush=false;
  if(!['seg','pom','none'].includes(look.tail))look.tail=look.species==='lobster'?'seg':'pom';if(look.species!=='lobster'&&look.tail==='seg')look.tail='pom';}
function swatches(el,list,key){el.innerHTML=list.map(c=>`<button data-v="${c}" style="background:${c}" class="${look[key]===c?'on':''}"></button>`).join('');}
function chips(el,list,key){el.innerHTML=list.map(([v,t])=>`<button data-v="${v}" class="${look[key]===v?'on':''}">${t}</button>`).join('');}
document.querySelectorAll('#creator .sl').forEach(el=>{el.innerHTML=SLD[el.dataset.g].map(([k,t,a,b,st])=>`<div class="clab">${t}</div><input type="range" data-k="${k}" min="${a}" max="${b}" step="${st}">`).join('');});
function renderCreator(){normLook();swatches($('swBody'),BODY_SW,'body');swatches($('swAcc'),ACC_SW,'accent');swatches($('swEye'),EYE_SW,'eyeColor');swatches($('swMouth'),EYE_SW,'mouthColor');swatches($('swBlush'),BLUSH_SW,'blushColor');
  chips($('chSpecies'),OPTS.species,'species');chips($('chEars'),OPTS.ears,'ears');chips($('chEyes'),OPTS.eyes,'eyes');chips($('chTail'),look.species==='lobster'?OPTS.tail:OPTS.tail.filter(t=>t[0]!=='seg'),'tail');
  chips($('chBrow'),OPTS.brow,'brow');chips($('chLash'),OPTS.lash,'lash');chips($('chMouth'),OPTS.mouth,'mouth');chips($('chBlush'),OPTS.blushShape,'blushShape');
  $('earWrap').style.display=look.species==='lobster'?'none':'block';$('labAcc').textContent=look.species==='lobster'?'角的顏色':'耳朵／腳的顏色';$('labEarSl').textContent=look.species==='lobster'?'角的大小／位置':'耳朵大小／位置';
  document.querySelectorAll('#creator input[data-k]').forEach(i=>i.value=look[i.dataset.k]);$('cName').value=look.name;}
[['swBody','body'],['swAcc','accent'],['swEye','eyeColor'],['swMouth','mouthColor'],['swBlush','blushColor'],['chEyes','eyes'],['chTail','tail'],['chSpecies','species'],['chEars','ears'],['chBrow','brow'],['chLash','lash'],['chMouth','mouth'],['chBlush','blushShape']].forEach(([id,key])=>
  $(id).addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;look[key]=b.dataset.v;if(key==='species')look.tail=look.species==='lobster'?'seg':'pom';
    if(key==='blushColor'&&look.blushShape==='none')look.blushShape='oval';renderCreator();rebuildPlayer();P.sqv+=6;}));
document.querySelector('#creator .sheet').addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.k;if(!k)return;look[k]=+e.target.value;rebuildPlayer();});
$('cName').addEventListener('input',e=>{look.name=e.target.value||'小蝦';});
$('cRand').addEventListener('click',()=>{const pick=a=>a[Math.floor(Math.random()*a.length)];look.body=pick(BODY_SW);look.accent=pick(ACC_SW);look.species=pick(OPTS.species)[0];look.ears=pick(OPTS.ears)[0];
  look.mouth=pick(OPTS.mouth)[0];look.eyes=pick(OPTS.eyes)[0];look.tail=pick(look.species==='lobster'?OPTS.tail:OPTS.tail.filter(t=>t[0]!=='seg'))[0];look.eyeColor=pick(EYE_SW);look.mouthColor=pick(EYE_SW);look.brow=pick(OPTS.brow)[0];look.lash=pick(OPTS.lash)[0];
  look.blushShape=pick(OPTS.blushShape)[0];look.blushColor=pick(BLUSH_SW);
  for(const g of Object.values(SLD))for(const[k,,a,b]of g)look[k]=+(a+(b-a)*R(0.25,0.75)).toFixed(2);renderCreator();rebuildPlayer();P.sqv+=8;SFX.craft();});
function reveal(x,y,mid){const r=$('reveal');r.style.setProperty('--cx',x+'px');r.style.setProperty('--cy',y+'px');r.classList.add('on');SFX.open();setTimeout(()=>{mid();setTimeout(()=>r.classList.remove('on'),80);},560);}
$('cDone').addEventListener('click',e=>{reveal(e.clientX,e.clientY,()=>{creatorOpen=false;const c=$('creator');c.classList.remove('show');c.style.display='none';try{localStorage.setItem('lobster-look',JSON.stringify(look));}catch(_){}refreshHeld();creatorThen&&creatorThen();});SFX.craft();});
function openCreator(then,ev){reveal(ev?ev.clientX:innerWidth/2,ev?ev.clientY:innerHeight/2,()=>{creatorOpen=true;creatorThen=then;renderCreator();$('start').style.display='none';previewYaw=0;rebuildPlayer();
  const c=$('creator');stagger(c);c.style.display='flex';void c.offsetWidth;c.classList.add('show');});}

// ---------- 開始 ----------
const existing=loadSave();
const SPLASH=['Q彈Q彈！','今天也要拔草！','果凍怪軟軟的！','和朋友一起玩！','拉麵最棒了！','角角是水滴型的！','記得早點睡！','蝴蝶好難抓！','倉鼠最會種田！','一起去釣魚吧！'];
$('splash').textContent=SPLASH[(Math.random()*SPLASH.length)|0];$('tName').textContent=look.name;
if(existing){$('startBtn').textContent=`開始遊戲（第 ${existing.day} 天）`;}
$('resetBtn').addEventListener('click',async()=>{const cu=typeof CLOUD!=='undefined'&&CLOUD.user;closePanel('settings');if(await cloudAsk('確定要重新開始嗎？',cu?'這台裝置<b>和 Google 帳號</b>裡的存檔都會被清除，無法復原！':'存檔會被清除，無法復原！','🗑️ 清除重來','取消')!=='a')return;
  if(typeof CLOUD!=='undefined'&&CLOUD.user){try{await CLOUD.db.collection('saves').doc(CLOUD.user.uid).delete();}catch(e){}}
  try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem('lobster-look');localStorage.removeItem('lobster-dex');localStorage.removeItem('lobster-cloud-sync');}catch(e){}location.reload();});
function beginGame(){normLook();document.body.classList.add('ingame');if(existing)applySave(existing);else defaultInterior();$('start').style.display='none';started=true;paused=false;rebuildPlayer();renderHotbar();updateAtkIcon();updateHUD();snapCam=true;
  toast(existing?`歡迎回來，${look.name}！🌸`:`${look.name}，歡迎來到龍蝦好友會！`);if(!existing)setTimeout(()=>toast('旁邊的薩薩子有話想跟你說 💬'),2800);}
$('startBtn').addEventListener('click',e=>{initAudio();if(existing)reveal(e.clientX,e.clientY,beginGame);else openCreator(beginGame,e);});
$('lookBtn').addEventListener('click',e=>{initAudio();openCreator(()=>{$('start').style.display='flex';$('tName').textContent=look.name;},e);});
applyVol();

updateSky();updateHUD();drawMini();renderHotbar();updateAtkIcon();
camera.position.set(ply.x,6,ply.z+10);
window.__game={ply,inv,Q,trees,monsters,npcs,farm,tal,setTime:v=>tmin=v,addItem,grantXP,get look(){return look;},HOME,STALLS,butterflies,useSlot};
