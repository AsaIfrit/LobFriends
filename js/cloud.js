// ===================== cloud.js：Google 登入與雲端存檔（Firestore） =====================
const CLOUD={user:null,db:null,auth:null,ready:false,dirty:false,busy:false,checked:'',lastUp:0};
const CLOUD_KEYS=[SAVE_KEY,'lobster-look','lobster-dex'];
const FBV='10.12.2';
function cloudSnap(){const o={};for(const k of CLOUD_KEYS){try{const v=localStorage.getItem(k);if(v!=null)o[k]=v;}catch(e){}}return o;}
function cloudMeta(o){try{const d=JSON.parse(o[SAVE_KEY]||'null');if(!d)return null;return{day:d.day||1,lv:d.lv||1,coins:d.coins||0,name:(()=>{try{return JSON.parse(o['lobster-look']||'{}').name||''}catch(e){return''}})()};}catch(e){return null;}}
const metaTxt=m=>m?`${m.name?m.name+'・':''}第 ${m.day} 天・Lv.${m.lv}・🪙${m.coins}`:'沒有存檔';
function syncMark(uid,t){try{localStorage.setItem('lobster-cloud-sync',JSON.stringify({uid,t}));}catch(e){}}
function syncGet(){try{return JSON.parse(localStorage.getItem('lobster-cloud-sync')||'{}');}catch(e){return{};}}
function loadJs(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s);});}
function cloudUI(){const u=CLOUD.user;const t=$('cloudBtn'),s=$('cloudStat'),b=$('cloudIn'),o=$('cloudOut'),up=$('cloudUp');
  if(!CLOUD.ready){t.style.display='none';$('cloudWrap').style.display='none';return;}
  t.style.display='';$('cloudWrap').style.display='block';
  t.textContent=u?`☁️ ${(u.displayName||'Google 帳號').slice(0,10)}`:'🔑 Google 登入';
  s.textContent=u?`已登入：${u.displayName||''}（${u.email||''}）${CLOUD.lastUp?'・上次同步 '+new Date(CLOUD.lastUp).toLocaleTimeString().slice(0,5):''}`:'登入後，進度會存到你的 Google 帳號，換裝置也能接著玩。';
  b.style.display=u?'none':'';o.style.display=u?'':'none';up.style.display=u?'':'none';}
async function cloudInit(){const FB=window.LOBSTER_FIREBASE;if(!FB||!FB.apiKey||location.protocol==='file:')return;
  try{await loadJs(`https://www.gstatic.com/firebasejs/${FBV}/firebase-app-compat.js`);await loadJs(`https://www.gstatic.com/firebasejs/${FBV}/firebase-auth-compat.js`);await loadJs(`https://www.gstatic.com/firebasejs/${FBV}/firebase-firestore-compat.js`);}
  catch(e){console.warn('Firebase 載入失敗',e);return;}
  try{firebase.initializeApp(FB);CLOUD.auth=firebase.auth();CLOUD.db=firebase.firestore();}catch(e){console.warn(e);return;}
  if(FB.googleClientId)loadJs('https://accounts.google.com/gsi/client').catch(()=>{});
  CLOUD.ready=true;cloudUI();setTimeout(kickWatch,1500);CLOUD.auth.getRedirectResult().catch(e=>cloudErr(e));
  CLOUD.auth.onAuthStateChanged(u=>{CLOUD.user=u;cloudUI();if(u&&CLOUD.checked!==u.uid){CLOUD.checked=u.uid;cloudOnLogin(u);}});}
function cloudErr(e){if(!e)return;const c=e.code||'';if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return;
  toast(c==='auth/unauthorized-domain'?'⚠️ 這個網址還沒加進 Firebase 的授權網域':c==='permission-denied'?'⚠️ 雲端存檔被拒絕，請檢查 Firestore 規則':'⚠️ 雲端錯誤：'+(c||e.message||e));console.warn(e);}
// 優先用 Google Identity Services 取得權杖，再交給 Firebase（不經過 firebaseapp.com 的彈出視窗，不受瀏覽器儲存分割影響）
let gisClient=null;
async function gisLogin(cid){if(!window.google||!google.accounts||!google.accounts.oauth2){try{await loadJs('https://accounts.google.com/gsi/client');}catch(e){return false;}}
  return new Promise(res=>{try{gisClient=google.accounts.oauth2.initTokenClient({client_id:cid,scope:'openid email profile',prompt:'select_account',
      callback:async t=>{if(t.error){if(t.error!=='popup_closed')toast('⚠️ Google 登入失敗：'+t.error);res(true);return;}
        try{await CLOUD.auth.signInWithCredential(firebase.auth.GoogleAuthProvider.credential(null,t.access_token));}catch(e){cloudErr(e);}res(true);},
      error_callback:e=>{if(e&&e.type!=='popup_closed')toast('⚠️ 登入視窗被擋住了，請允許彈出視窗');res(true);}});
    gisClient.requestAccessToken();}catch(e){console.warn(e);res(false);}});}
async function cloudLogin(){if(!CLOUD.ready){toast('雲端存檔只能在 GitHub Pages 上使用喔');return;}
  const cid=(window.LOBSTER_FIREBASE||{}).googleClientId;if(cid&&await gisLogin(cid))return;const pr=new firebase.auth.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  try{if(standalone)await CLOUD.auth.signInWithRedirect(pr);else await CLOUD.auth.signInWithPopup(pr);}
  catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-environment','auth/web-storage-unsupported'].includes(e.code)){try{await CLOUD.auth.signInWithRedirect(pr);}catch(e2){cloudErr(e2);}}else cloudErr(e);}}
async function cloudLogout(){if(!CLOUD.auth)return;if(CLOUD.user&&started)await cloudUpload(true);await CLOUD.auth.signOut();CLOUD.checked='';toast('已登出 Google（進度仍保留在這台裝置）');}
const docRef=()=>CLOUD.db.collection('saves').doc(CLOUD.user.uid);
async function cloudUpload(quiet){if(!CLOUD.user||CLOUD.busy)return false;if(started)save();const snap=cloudSnap();if(!snap[SAVE_KEY])return false;CLOUD.busy=true;
  try{const t=Date.now();await docRef().set({data:snap,meta:cloudMeta(snap),t,updated:firebase.firestore.FieldValue.serverTimestamp()});syncMark(CLOUD.user.uid,t);CLOUD.dirty=false;CLOUD.lastUp=t;cloudUI();if(!quiet)toast('☁️ 已存到 Google 帳號');return true;}
  catch(e){cloudErr(e);return false;}finally{CLOUD.busy=false;}}
function cloudApply(data,t){for(const k of CLOUD_KEYS){try{if(data[k]!=null)localStorage.setItem(k,data[k]);else localStorage.removeItem(k);}catch(e){}}syncMark(CLOUD.user.uid,t);
  toast('☁️ 正在載入雲端存檔…');setTimeout(()=>location.reload(),600);}
let cloudChoice=null;
function cloudAsk(title,msg,a,b){return new Promise(res=>{$('cdTitle').textContent=title;$('cdMsg').innerHTML=msg;$('cdA').textContent=a;$('cdB').textContent=b;$('cdB').style.display=b?'':'none';
  cloudChoice=res;$('cloudDlg').classList.add('on');SFX.open();});}
function cloudPick(v){$('cloudDlg').classList.remove('on');const f=cloudChoice;cloudChoice=null;if(f)f(v);}
$('cdA').addEventListener('click',()=>cloudPick('a'));$('cdB').addEventListener('click',()=>cloudPick('b'));
async function cloudOnLogin(u){let doc;try{doc=await docRef().get();}catch(e){cloudErr(e);return;}
  const local=cloudSnap(),lm=cloudMeta(local),cloud=doc.exists?doc.data():null,cm=cloud?cloud.meta||cloudMeta(cloud.data||{}):null;const mark=syncGet();
  toast(`👋 歡迎，${u.displayName||'玩家'}！`);
  if(!cloud){if(!lm){CLOUD.dirty=true;return;}
    const r=await cloudAsk('把進度移到 Google 帳號？',`這台裝置的進度：<b>${metaTxt(lm)}</b><br>上傳後，換電腦或手機登入同一個 Google 帳號就能接著玩。`,'☁️ 上傳到 Google','先不要');
    if(r==='a')await cloudUpload();return;}
  if(!lm){cloudApply(cloud.data||{},cloud.t);return;}
  if(mark.uid===u.uid&&mark.t===cloud.t){if(started)CLOUD.dirty=true;toast('☁️ 雲端存檔已同步');return;}
  if(!lm||JSON.stringify(local[SAVE_KEY])===JSON.stringify((cloud.data||{})[SAVE_KEY])){if(!lm){cloudApply(cloud.data||{},cloud.t);return;}syncMark(u.uid,cloud.t);return;}
  const r=await cloudAsk('要用哪一份存檔？',`☁️ Google 帳號：<b>${metaTxt(cm)}</b><br>📱 這台裝置：<b>${metaTxt(lm)}</b><br><small>沒選的那一份會被覆蓋</small>`,'☁️ 用雲端存檔','📱 用這台裝置的');
  if(r==='a')cloudApply(cloud.data||{},cloud.t);else await cloudUpload();}
// 自動同步：存檔後標記，最快每 60 秒上傳；離開頁面時也上傳
{const _save=save;save=function(f){_save(f);if(CLOUD.user&&started)CLOUD.dirty=true;};}
setInterval(()=>{if(CLOUD.user&&CLOUD.dirty&&started&&Date.now()-CLOUD.lastUp>60000)cloudUpload(true);},10000);
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&CLOUD.user&&started){save();cloudUpload(true);}});
$('cloudBtn').addEventListener('click',()=>{if(CLOUD.user)openSettings();else cloudLogin();});
$('cloudIn').addEventListener('click',cloudLogin);$('cloudOut').addEventListener('click',cloudLogout);$('cloudUp').addEventListener('click',()=>cloudUpload());
cloudInit();

// ---------- GM 特權（依 Firebase UID） ----------
const GM_UIDS=['vB3gw0XvrrUtjuw5soOc01CgEH22'];
function isGM(){return!!(CLOUD.user&&GM_UIDS.includes(CLOUD.user.uid));}
async function gmKick(nid,name){if(!isGM())return;const r=await cloudAsk(`請 ${name} 下線？`,'對方會自動存檔並離開遊戲，<br>要重新整理網頁才能再進來。','🚪 請下線','取消');
  if(r!=='a')return;
  // 寫進 Firestore 的 kicks/{對方的連線ID}；Firestore 規則會在 Google 伺服器上檢查「寫入的人是不是 GM」，假冒的寫入會被拒絕
  netPost({t:'kick',to:nid,uid:CLOUD.user.uid});// 給還沒更新的舊版玩家（舊版只認這種訊息）
  try{await CLOUD.db.collection('kicks').doc(String(nid)).set({by:CLOUD.user.uid,t:firebase.firestore.FieldValue.serverTimestamp()});toast(`🚪 已請 ${name} 下線`);SFX.thud();}
  catch(e){console.warn(e);toast(e&&e.code==='permission-denied'?'⚠️ 被 Firestore 規則拒絕了：請確認規則裡有加上 kicks 的設定':'⚠️ 請下線失敗：'+((e&&e.code)||e));}}
// 舊的廣播踢人訊息不再採信（任何人都能假冒）
function onKickMsg(o){}
// 每位玩家只監看「自己這次連線」的那一筆 kicks 文件：開始時讀 1 次，被請下線時再讀 1 次
let kickUnsub=null;
function kickWatch(){if(!CLOUD.db||kickUnsub||typeof myNetId==='undefined'||!myNetId)return;
  try{kickUnsub=CLOUD.db.collection('kicks').doc(String(myNetId)).onSnapshot(d=>{if(!d.exists)return;const v=d.data()||{};if(GM_UIDS.includes(v.by)&&!isGM())beKicked();},e=>console.warn('kick watch',e));}catch(e){console.warn(e);}}
async function beKicked(){if(window.__kicked)return;try{save();}catch(e){}
  try{if(CLOUD.user){CLOUD.busy=false;await cloudUpload(true);}}catch(e){}
  window.__kicked=true;paused=true;CLOUD.dirty=false;try{if(kickUnsub){kickUnsub();kickUnsub=null;}}catch(e){}try{sessionStorage.removeItem('lobster-netid');}catch(e){}
  try{if(sbClient){if(sbCh)sbClient.removeChannel(sbCh);if(typeof partyCh!=='undefined'&&partyCh)sbClient.removeChannel(partyCh);if(sbClient.removeAllChannels)sbClient.removeAllChannels();}}catch(e){}
  try{sbCh=null;netConn=false;room=null;}catch(e){}
  try{if(CLOUD.db&&CLOUD.db.terminate)CLOUD.db.terminate();}catch(e){}CLOUD.user=null;
  $('kickOv').classList.add('on');}
$('kickReload').addEventListener('click',()=>location.reload());
// GM：在線上玩家列表點名字傳送
$('plList').addEventListener('click',async e=>{if(!isGM())return;const row=e.target.closest('.plr[data-nid]');if(!row)return;const nid=row.dataset.nid;const pr=presOf(nid);if(!pr)return;
  const name=cleanTxt(pr.n,10)||'旅人';const r=await cloudAsk(`傳送到 ${name} 身邊？`,pr.ar==='cave'?`對方在 ⛰️ 洞窟 B${pr.lv||1}`:'對方在 🌳 野外','✨ 傳送','取消');if(r!=='a')return;
  const p2=presOf(nid)||pr;closePanel('players');gmTeleport(p2);});
function gmTeleport(pr){if(carry)carryCancel();if(ply.sitting)standUp();if(ply.sleeping)wakeUp();if(ply.riding&&typeof getOff==='function')getOff();SFX.cast();
  quickFade(()=>{const toCave=pr.ar==='cave';if(toCave){if(!ply.cave||caveLv!==(pr.lv||1))setCaveLv(pr.lv||1);ply.cave=true;}else ply.cave=false;
    ply.indoor=false;ply.x=pr.x+1.2;ply.z=pr.z;ply.y=ply.cave?0:standY(ply.x,ply.z,99);ply.vy=0;ply.kx=ply.kz=0;snapCam=true;if(typeof portalLock!=='undefined')portalLock=1;});
  toast('✨ 傳送中…');}

// ---------- 閒置自動離線：太久沒操作就先斷開連線，省 Supabase 用量 ----------
const IDLE_MS=10*60*1000,HIDDEN_MS=2*60*1000;let lastInput=Date.now(),hiddenAt=0,idleOff=false;
['pointerdown','keydown','touchstart','wheel'].forEach(ev=>addEventListener(ev,()=>{lastInput=Date.now();if(idleOff)idleResume();},{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>{hiddenAt=document.visibilityState==='hidden'?Date.now():0;});
function idleDisconnect(){if(idleOff||window.__kicked||!sbClient)return;idleOff=true;try{save();}catch(e){}
  try{if(sbCh)sbClient.removeChannel(sbCh);}catch(e){}sbCh=null;netConn=false;
  try{if(typeof partyCh!=='undefined'&&partyCh){sbClient.removeChannel(partyCh);partyCh=null;partyChId='';}}catch(e){}
  try{sbClearRemotes();}catch(e){}updNetBadge();$('idleOv').classList.add('on');}
function idleResume(){if(!idleOff||window.__kicked)return;idleOff=false;$('idleOv').classList.remove('on');try{sbJoin(sbShard||1,!sbPref());}catch(e){}try{if(typeof syncPartyChannel==='function')syncPartyChannel();}catch(e){}toast('👋 歡迎回來！已重新連線');}
setInterval(()=>{if(!started||idleOff)return;const now=Date.now();if(now-lastInput>IDLE_MS||(hiddenAt&&now-hiddenAt>HIDDEN_MS))idleDisconnect();},15000);
// ---------- 新版本自動更新：每 5 分鐘看一下網站上的版本號 ----------
const MY_VER=((document.querySelector('script[src*="js/engine.js"]')||{}).src||'').split('v=')[1]||'';
let updT=null;
async function checkUpdate(){if(!MY_VER||location.protocol==='file:'||updT||window.__kicked)return;
  try{const r=await fetch('index.html?_='+Date.now(),{cache:'no-store'});const t=await r.text();const m=t.match(/js\/engine\.js\?v=([0-9a-z]+)/);
    if(m&&m[1]!==MY_VER){let n=60;$('updBar').classList.add('on');const tick=()=>{$('updTxt').textContent=`🆕 遊戲更新了！${n} 秒後自動重新整理（進度會自動存檔）`;if(n--<=0)doUpdate();};tick();updT=setInterval(tick,1000);}}catch(e){}}
async function doUpdate(){clearInterval(updT);try{save();}catch(e){}try{if(CLOUD.user){CLOUD.busy=false;await cloudUpload(true);}}catch(e){}location.reload();}
$('updNow').addEventListener('click',doUpdate);
setInterval(checkUpdate,5*60*1000);setTimeout(checkUpdate,60*1000);
