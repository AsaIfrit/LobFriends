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
  CLOUD.ready=true;cloudUI();CLOUD.auth.getRedirectResult().catch(e=>cloudErr(e));
  CLOUD.auth.onAuthStateChanged(u=>{CLOUD.user=u;cloudUI();if(u&&CLOUD.checked!==u.uid){CLOUD.checked=u.uid;cloudOnLogin(u);}});}
function cloudErr(e){if(!e)return;const c=e.code||'';if(c==='auth/popup-closed-by-user'||c==='auth/cancelled-popup-request')return;
  toast(c==='auth/unauthorized-domain'?'⚠️ 這個網址還沒加進 Firebase 的授權網域':c==='permission-denied'?'⚠️ 雲端存檔被拒絕，請檢查 Firestore 規則':'⚠️ 雲端錯誤：'+(c||e.message||e));console.warn(e);}
async function cloudLogin(){if(!CLOUD.ready){toast('雲端存檔只能在 GitHub Pages 上使用喔');return;}const pr=new firebase.auth.GoogleAuthProvider();pr.setCustomParameters({prompt:'select_account'});
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
