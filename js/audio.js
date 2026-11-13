// ===================== audio.js：合成音效與音樂盒 BGM =====================
let AC=null,master,musicG,sfxG,noiseBuf,muted=false;
try{muted=localStorage.getItem('lobster-muted')==='1';}catch(e){}
function initAudio(){
  if(AC){AC.resume&&AC.resume();return;}
  try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return;}
  master=AC.createGain();master.gain.value=1;master.connect(AC.destination);
  const comp=AC.createDynamicsCompressor();comp.connect(master);
  musicG=AC.createGain();musicG.gain.value=0.28;musicG.connect(comp);
  sfxG=AC.createGain();sfxG.gain.value=0.75;sfxG.connect(comp);
  noiseBuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  nextT=AC.currentTime+0.1;setInterval(musicTick,40);if(typeof applyVol==='function')applyVol();
}
function tone(f,d,o={}){if(!AC)return;const{type='sine',v=0.2,t=0,slide=0,a=0.005}=o;const T=AC.currentTime+t;
  const osc=AC.createOscillator(),g=AC.createGain();osc.type=type;osc.frequency.setValueAtTime(f,T);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(20,slide),T+d);
  g.gain.setValueAtTime(0.0001,T);g.gain.linearRampToValueAtTime(v,T+a);g.gain.exponentialRampToValueAtTime(0.0001,T+a+d);
  osc.connect(g);g.connect(sfxG);osc.start(T);osc.stop(T+a+d+0.05);}
function noise(d,o={}){if(!AC)return;const{v=0.2,t=0,f=1000,q=1,type='bandpass',slide=0}=o;const T=AC.currentTime+t;
  const s=AC.createBufferSource();s.buffer=noiseBuf;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f,T);if(slide)fl.frequency.exponentialRampToValueAtTime(slide,T+d);fl.Q.value=q;
  const g=AC.createGain();g.gain.setValueAtTime(0.0001,T);g.gain.linearRampToValueAtTime(v,T+0.005);g.gain.exponentialRampToValueAtTime(0.0001,T+d);
  s.connect(fl);fl.connect(g);g.connect(sfxG);s.start(T,Math.random()*0.5);s.stop(T+d+0.05);}
const SFX={
  click(){tone(880,.06,{v:.13,slide:1400});tone(1320,.06,{v:.08,t:.04});},
  open(){tone(523,.08,{v:.14,type:'triangle'});tone(784,.12,{v:.14,type:'triangle',t:.06});tone(1047,.14,{v:.1,t:.12});},
  close(){tone(784,.07,{v:.12,type:'triangle'});tone(523,.1,{v:.12,type:'triangle',t:.06});},
  swing(c){noise(c===3?.32:.18,{f:600,slide:c===3?2500:3200,q:1.2,v:c===3?.35:.25});if(c===3)tone(200,.3,{type:'triangle',v:.12,slide:500});},
  thrust(){noise(.14,{f:1200,slide:4000,q:2,v:.3});tone(300,.1,{type:'triangle',v:.12,slide:600});},
  bow(){tone(180,.12,{type:'triangle',v:.2,slide:90});noise(.1,{f:3000,v:.12});},
  arrowHit(){tone(900,.05,{type:'square',v:.05});noise(.05,{f:2000,v:.15});},
  magic(){[880,1175,1568].forEach((f,i)=>tone(f,.18,{type:'triangle',v:.08,t:i*.04}));noise(.3,{f:5000,v:.06,slide:1500});},
  boom(){tone(160,.35,{v:.35,slide:50});noise(.35,{f:700,type:'lowpass',v:.35});[1568,2093].forEach((f,i)=>tone(f,.15,{v:.05,t:.05+i*.05}));},
  hit(crit){tone(240,.12,{type:'triangle',v:.35,slide:70});noise(.07,{f:2400,q:.8,v:.3});tone(crit?1760:1200,.07,{v:.1,t:.01});if(crit){tone(2349,.12,{v:.08,t:.06,type:'triangle'});noise(.25,{f:300,type:'lowpass',v:.3});}},
  squish(){tone(420,.12,{v:.18,slide:180});noise(.08,{f:900,v:.12});},
  chop(){const p=R(.9,1.1);tone(330*p,.08,{type:'triangle',v:.35,slide:150});noise(.06,{f:1600*p,q:3,v:.32});},
  fall(){tone(150,.6,{type:'sawtooth',v:.04,slide:85});tone(95,.35,{v:.5,slide:38,t:.62});noise(.4,{f:500,type:'lowpass',v:.4,t:.62});},
  mine(){tone(1900,.09,{type:'triangle',v:.18});tone(2600,.07,{v:.08,t:.01});noise(.05,{f:4200,v:.16});},
  thud(){tone(260,.08,{type:'square',v:.06,slide:180});noise(.05,{f:800,v:.15});},
  rock(){noise(.3,{f:900,type:'lowpass',v:.45,slide:200});tone(170,.22,{v:.3,slide:60});},
  pickup(n=0){const f=784*Math.pow(2,Math.min(n,14)/12);tone(f,.07,{v:.13});tone(f*1.5,.09,{v:.09,t:.05});},
  coin(n=0){const p=Math.pow(2,Math.min(n,12)/24);tone(1319*p,.05,{type:'square',v:.045});tone(1760*p,.12,{type:'square',v:.045,t:.05});},
  xp(n=0){tone(1046*Math.pow(2,Math.min(n,16)/16),.06,{type:'triangle',v:.07});},
  pull(){tone(380,.12,{v:.25,slide:950});noise(.06,{f:3000,v:.12,t:.03});},
  jump(){tone(330,.16,{v:.18,slide:700});},
  land(){noise(.06,{f:500,type:'lowpass',v:.18});},
  step(){noise(.035,{f:700,type:'lowpass',v:.06});},
  hurt(){tone(720,.22,{type:'square',v:.07,slide:300});tone(480,.24,{type:'triangle',v:.16,slide:200});},
  mdie(){tone(620,.28,{v:.2,slide:140});noise(.22,{f:1500,v:.12});[1047,1319,1568].forEach((f,i)=>tone(f,.1,{v:.07,t:.12+i*.05}));},
  craft(){[523,659,784,1047,1319].forEach((f,i)=>tone(f,.14,{type:'triangle',v:.13,t:i*.07}));noise(.3,{f:6000,v:.05,t:.3});},
  place(){tone(210,.12,{type:'triangle',v:.32,slide:110});noise(.06,{f:900,v:.2});tone(880,.08,{v:.06,t:.08});},
  quest(){[[523,0],[659,.1],[784,.2],[1047,.32],[784,.46],[1047,.56]].forEach(([f,t])=>tone(f,.18,{type:'square',v:.06,t}));},
  levelup(){[[523,0],[659,.08],[784,.16],[1047,.24],[1319,.36],[1568,.48],[2093,.62]].forEach(([f,t])=>{tone(f,.25,{type:'square',v:.055,t});tone(f*0.5,.25,{type:'triangle',v:.08,t});});noise(.8,{f:7000,v:.06,t:.5});},
  lie(){[784,659,523,392].forEach((f,i)=>tone(f,.5,{v:.12,t:i*.28}));},
  wake(){[523,659,784,1047].forEach((f,i)=>tone(f,.18,{v:.12,type:'triangle',t:i*.08}));},
  door(){tone(660,.12,{v:.15,type:'triangle'});tone(523,.25,{v:.15,type:'triangle',t:.13});noise(.08,{f:600,type:'lowpass',v:.15});},
  deny(){tone(300,.1,{type:'square',v:.05});tone(220,.16,{type:'square',v:.05,t:.1});},
  lock(){tone(1568,.05,{v:.05});},
  blip(p){tone(520*p*R(.92,1.1),.045,{type:'square',v:.035});},
  eat(){[0,.12,.24].forEach(t=>noise(.07,{f:1200,v:.18,t}));tone(880,.2,{v:.1,t:.35,slide:1320});},
  slurp(){noise(.5,{f:600,slide:2500,q:3,v:.25});noise(.4,{f:800,slide:2200,q:3,v:.2,t:.55});tone(660,.25,{v:.1,t:1.0,slide:990});},
  till(){noise(.12,{f:400,type:'lowpass',v:.4});tone(140,.1,{v:.2,slide:80});},
  water(){noise(.5,{f:2500,q:.6,v:.14});[0,.1,.2].forEach(t=>tone(R(1200,1800),.05,{v:.04,t}));},
  plant(){tone(520,.08,{v:.12});tone(780,.1,{v:.1,t:.07});noise(.06,{f:500,type:'lowpass',v:.15});},
  harvest(){tone(400,.1,{v:.2,slide:900});[1047,1319,1568].forEach((f,i)=>tone(f,.1,{v:.08,t:.08+i*.05}));},
  net(){noise(.22,{f:1500,slide:500,q:1,v:.2});},
  catchBug(){[1319,1568,2093,2637].forEach((f,i)=>tone(f,.1,{type:'triangle',v:.09,t:i*.06}));},
  sit(){tone(300,.1,{type:'triangle',v:.15,slide:200});},
  bubble(){tone(R(600,1200),.06,{v:.06,slide:R(1400,2000)});},
  notify(){tone(1175,.08,{v:.08});tone(1568,.14,{v:.07,t:.07});},
  splash(){noise(.4,{f:1500,q:.5,v:.3});tone(300,.2,{v:.1,slide:900});}
};
// ---------- BGM ----------
let nextT=0,mStep=0,mode='day';
const midiF=n=>440*Math.pow(2,(n-69)/12);
const SONG={
  day:{bpm:104,bars:8,bass:[48,45,41,43,48,45,41,43],
    chords:[[60,64,67],[57,60,64],[60,65,69],[59,62,67],[60,64,67],[57,60,64],[60,65,69],[59,62,67]],
    mel:[[4,7,12,7,4,-1,2,4],[0,4,9,7,4,-1,0,2],[5,9,12,9,7,5,4,2],[2,7,11,14,12,-1,7,-1],[12,11,12,7,4,7,12,14],[16,14,12,9,12,-1,9,7],[9,12,9,5,9,7,5,4],[2,4,7,11,12,-1,-1,-1]],shaker:true},
  night:{bpm:74,bars:4,bass:[45,41,48,43],chords:[[57,60,64],[57,60,65],[55,60,64],[55,59,62]],
    mel:[[9,-1,12,-1,16,-1,12,-1],[9,-1,12,-1,17,-1,16,-1],[12,-1,16,-1,19,-1,16,-1],[14,-1,11,-1,7,-1,-1,-1]],shaker:false}
};
function mbox(f,t,v,dec=.7){const o1=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),g2=AC.createGain();o1.frequency.value=f;o2.frequency.value=f*2.01;g2.gain.value=.25;
  g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(0.0001,t+dec);
  o1.connect(g);o2.connect(g2);g2.connect(g);g.connect(musicG);o1.start(t);o2.start(t);o1.stop(t+dec+.05);o2.stop(t+dec+.05);}
function pluck(f,t,v,d,type='triangle'){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(g);g.connect(musicG);o.start(t);o.stop(t+d+.05);}
function musicTick(){
  if(!AC)return;const want=(isNight()||ply.sleeping)?'night':'day';
  musicG.gain.setTargetAtTime((ply.sleeping?0.14:0.28)*(window.musicVol?window.musicVol():1),AC.currentTime,0.5);
  while(nextT<AC.currentTime+0.25){
    let S=SONG[mode];const pos=mStep%8,bar=Math.floor(mStep/8)%S.bars;
    if(pos===0&&want!==mode&&(bar===0||bar===4%S.bars)){mode=want;mStep=0;continue;}
    const t=nextT;
    const n=S.mel[bar][pos];if(n>=0)mbox(midiF(72+n+(mode==='night'?-12:0)),t,mode==='night'?.16:.2,mode==='night'?1.2:.6);
    const ch=S.chords[bar];
    if(mode==='day'||pos%2===0)pluck(midiF(ch[pos%3]),t,.05,.3,'sine');
    if(pos===0||pos===4)pluck(midiF(S.bass[bar]),t,.16,mode==='night'?.9:.45);
    if(S.shaker&&pos%2===1){const s=AC.createBufferSource();s.buffer=noiseBuf;const fl=AC.createBiquadFilter();fl.type='highpass';fl.frequency.value=7000;const g=AC.createGain();g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(0.0001,t+.05);s.connect(fl);fl.connect(g);g.connect(musicG);s.start(t,Math.random()*.5);s.stop(t+.06);}
    nextT+=60/S.bpm/2;mStep++;
  }
}
