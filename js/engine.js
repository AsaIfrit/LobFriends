// ===================== engine.js：工具、渲染、描邊、貼圖、地形 =====================
const $=id=>document.getElementById(id);
let seed=20261113;
function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const R=(a,b)=>a+Math.random()*(b-a),SR=(a,b)=>a+rnd()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const easeOut=t=>1-Math.pow(1-t,3);
const easeOutBack=t=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
const angDiff=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const PAST=['#ff9ec7','#ffd36e','#8fdcb4','#b9a6f2','#8fd0ff','#ffb38a'];
const V2={x:-64,z:52},V3={x:24,z:74},POND={x:34,z:30,r:7},CAVE={x:-400,z:0,r:26},CAVE_DOOR={x:96,z:-76};
const HOME={x:-18,z:0,w:7,d:6,h:4.2},PARK={x:-70,z:-68,r:40};
function H(x,z){if(x>200||x<-200)return 0;const dp=Math.hypot(x-POND.x,z-POND.z);let h=Math.sin(x*0.045)*1.6+Math.cos(z*0.05)*1.3+Math.sin((x+z)*0.1)*0.5+Math.cos(x*0.13-z*0.07)*0.35;
  h=h*smooth(10,26,Math.hypot(x,z))*smooth(46,56,Math.hypot(x-V2.x,z-V2.z))*smooth(32,42,Math.hypot(x-V3.x,z-V3.z));h*=smooth(9.6,15,Math.hypot(x-HOME.x,z-HOME.z))*smooth(PARK.r+2,PARK.r+12,Math.hypot(x-PARK.x,z-PARK.z));h=h*smooth(POND.r+1,POND.r+9,dp)-1.2*(1-smooth(POND.r-1.6,POND.r+0.2,dp));return h;}
function segDist(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,t=clamp(((px-ax)*dx+(pz-az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(px-ax-dx*t,pz-az-dz*t);}
const PATHS=[[0,0,58,0],[0,0,0,-20],[-9,4,-46,38],[4,6,17,58],[0,-8,-30,-68],[-10,0,0,0]];
function onPath(x,z){for(const p of PATHS)if(segDist(x,z,...p)<1.7)return true;return false;}

// ---------- 遊戲狀態（共用） ----------
let day=1,tmin=7*60,paused=true,started=false;
const MIN_PER_SEC=2;
const hour=()=>tmin/60;
function isNight(){const h=hour();return h>=19||h<5;}
const ply={x:2,z:5,y:0,vy:0,ground:true,face:Math.PI,hp:10,max:10,en:100,coins:0,lv:1,xp:0,sp:0,ifr:0,walk:0,kx:0,kz:0,lastStep:0,
  indoor:false,sleeping:null,sitting:null,act:null,actT:0,dashT:0,dvx:0,dvz:0,combo:0,comboT:0,atkT:-1,atkDur:0.3,hitDone:false,queued:false,
  weapon:'stick',held:null,cool:0,runDust:0,lean:0};

// ---------- 渲染器 ----------
const renderer=new THREE.WebGLRenderer({canvas:$('c'),antialias:false,powerPreference:'high-performance'});
const DPR=Math.min(devicePixelRatio,1.25);renderer.setPixelRatio(DPR);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(52,1,0.3,600);

// ---------- 超粗咖啡色描邊（深度後處理） ----------
let rt=null;
const postMat=new THREE.ShaderMaterial({uniforms:{tC:{value:null},tD:{value:null},res:{value:new THREE.Vector2(1,1)},cn:{value:0.3},cf:{value:600},th:{value:3},lineCol:{value:new THREE.Color(0x6b4430)}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D tC;uniform vec2 res;varying vec2 vUv;
  void main(){vec3 c=texture2D(tC,vUv).rgb;float l=dot(c,vec3(0.299,0.587,0.114));
    c=mix(vec3(l),c,1.05);
    vec3 sh=vec3(0.84,0.87,1.04),hi=vec3(0.97,0.95,0.92);c*=mix(sh,hi,smoothstep(0.15,0.85,l));
    c=c/(1.0+max(c-0.82,0.0)*1.6);
    c=mix(c,vec3(0.93,0.97,1.0),0.05);
    c=pow(c,vec3(0.96));
    vec2 q=vUv-0.5;c*=1.0-dot(q,q)*0.28;
    gl_FragColor=vec4(c,1.);}`,depthTest:false,depthWrite:false});
const postScene=new THREE.Scene(),postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
{const q=new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat);q.frustumCulled=false;postScene.add(q);}
function makeRT(w,h){if(rt){rt.depthTexture.dispose();rt.dispose();}
  const dt=new THREE.DepthTexture(w,h);dt.type=THREE.UnsignedIntType;
  rt=new THREE.WebGLRenderTarget(w,h,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:true,depthTexture:dt});
  postMat.uniforms.tC.value=rt.texture;postMat.uniforms.tD.value=rt.depthTexture;postMat.uniforms.res.value.set(w,h);}
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  const v=new THREE.Vector2();renderer.getDrawingBufferSize(v);makeRT(v.x,v.y);}
addEventListener('resize',resize);resize();

// ---------- 程式貼圖（動森風：花紋都用貼圖） ----------
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep[0],rep[1]);t.anisotropy=4;return t;}
const TEX={};
TEX.grass=canvasTex(256,256,(g,W,Hh)=>{g.fillStyle='#ebebeb';g.fillRect(0,0,W,Hh);
  // 小三角形草紋＋V 字草叢
  for(let i=0;i<70;i++){const x=Math.random()*W,y=Math.random()*Hh,s=6+Math.random()*6;g.fillStyle=Math.random()<0.6?'#dfdfdf':'#f6f6f6';
    g.beginPath();g.moveTo(x,y-s);g.lineTo(x+s*0.7,y+s*0.5);g.lineTo(x-s*0.7,y+s*0.5);g.closePath();g.fill();}
  g.strokeStyle='#dadada';g.lineWidth=2.5;g.lineCap='round';
  for(let i=0;i<45;i++){const x=Math.random()*W,y=Math.random()*Hh;g.beginPath();g.moveTo(x-5,y-7);g.lineTo(x,y);g.lineTo(x+5,y-7);g.moveTo(x,y);g.lineTo(x,y-9);g.stroke();}
},[130,130]);
TEX.leaf=canvasTex(128,128,(g,W,Hh)=>{g.fillStyle='#d2d2d2';g.fillRect(0,0,W,Hh);
  const sx=64,sy=44;
  for(let row=-1;row<Hh/sy+2;row++)for(let col=-1;col<W/sx+2;col++){const x=col*sx+(row%2?sx/2:0),y=row*sy;
    g.fillStyle='#e6e6e6';g.strokeStyle='#bcbcbc';g.lineWidth=3;g.beginPath();g.moveTo(x-sx*0.5,y);g.quadraticCurveTo(x-sx*0.45,y+sy*0.95,x,y+sy*1.1);g.quadraticCurveTo(x+sx*0.45,y+sy*0.95,x+sx*0.5,y);g.closePath();g.fill();g.stroke();}
},[2,1]);
TEX.bark=canvasTex(128,128,(g,W,Hh)=>{g.fillStyle='#e0e0e0';g.fillRect(0,0,W,Hh);g.strokeStyle='#b8b8b8';g.lineWidth=4;g.lineCap='round';
  for(let i=0;i<9;i++){const x=i*15+5;g.beginPath();g.moveTo(x,0);for(let y=0;y<=Hh;y+=16)g.lineTo(x+Math.sin(y*0.08+i)*4,y);g.stroke();}},[2,1]);
TEX.pine=canvasTex(128,64,(g,W,Hh)=>{g.fillStyle='#d8d8d8';g.fillRect(0,0,W,Hh);g.strokeStyle='#c0c0c0';g.lineWidth=3;g.lineCap='round';
  for(let i=0;i<8;i++){const x=i*16+4;g.beginPath();g.moveTo(x,10);g.lineTo(x+4,50);g.stroke();}},[3,1]);
TEX.soil=canvasTex(128,128,(g,W,Hh)=>{g.fillStyle='#d8d8d8';g.fillRect(0,0,W,Hh);g.fillStyle='#b0b0b0';
  for(let i=0;i<60;i++){g.beginPath();g.ellipse(Math.random()*W,Math.random()*Hh,2+Math.random()*3,1.5+Math.random()*2,Math.random()*3,0,7);g.fill();}
  g.strokeStyle='#c0c0c0';g.lineWidth=5;for(let y=16;y<Hh;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}});
TEX.wood=canvasTex(128,128,(g,W,Hh)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#f2f2f2':'#e4e4e4';g.fillRect(0,i*16,W,16);g.fillStyle='#bdbdbd';g.fillRect(0,i*16+15,W,1);
  g.fillRect((i*37)%W,i*16,1,16);}},[2,2]);
TEX.felt=canvasTex(256,256,(g,W,Hh)=>{g.fillStyle='#f4f4f4';g.fillRect(0,0,W,Hh);
  for(let i=0;i<4200;i++){const x=Math.random()*W,y=Math.random()*Hh,a=Math.random()*6.28,l=3+Math.random()*8;const v=Math.random()<0.55?255:(215+Math.random()*25)|0;
    g.strokeStyle=`rgba(${v},${v},${v},0.3)`;g.lineWidth=0.6+Math.random()*0.8;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+Math.cos(a+1)*l*0.5,y+Math.sin(a+1)*l*0.5,x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}},[3,2]);

// ---------- 材質 ----------
const gradMap=new THREE.DataTexture(new Uint8Array([182,182,182,255,240,240,240,255]),2,1,THREE.RGBAFormat);
gradMap.minFilter=gradMap.magFilter=THREE.NearestFilter;gradMap.generateMipmaps=false;gradMap.needsUpdate=true;
const RIM={value:1};
function animeMat(m){m.onBeforeCompile=sh=>{sh.uniforms.rimAmt=RIM;sh.fragmentShader='uniform float rimAmt;\n'+sh.fragmentShader.replace('#include <dithering_fragment>',
  'float rimF=1.0-clamp(dot(normalize(vViewPosition),normal),0.0,1.0);gl_FragColor.rgb+=vec3(1.0,0.96,0.88)*smoothstep(0.6,0.86,rimF)*0.1*rimAmt;\n#include <dithering_fragment>');};
  m.customProgramCacheKey=()=>'anime';return m;}
const toon=(c,o={})=>animeMat(new THREE.MeshToonMaterial(Object.assign({color:c,gradientMap:gradMap},o)));
const basic=(c,o={})=>new THREE.MeshBasicMaterial(Object.assign({color:c},o));
function mk(geo,mat,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);return m;}
function shadowAll(o){o.traverse(m=>{if(m.isMesh&&!m.material.transparent){m.castShadow=true;m.receiveShadow=true;}});}
const feltCache={};const felt=c=>feltCache[c]||(feltCache[c]=toon(new THREE.Color(c)));
function mergeGeos(parts){let n=0;const gs=parts.map(([g0,m])=>{const g=g0.index?g0.toNonIndexed():g0.clone();g.applyMatrix4(m);n+=g.attributes.position.count;return g;});
  const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
  for(const g of gs){const c=g.attributes.position.count;pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=c;g.dispose();}
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nor,3));out.setAttribute('uv',new THREE.BufferAttribute(uv,2));return out;}
// 靜態物件合併：同材質的 mesh 合成一個，大幅減少繪製次數
function matKey(m){return[m.type,m.color?m.color.getHex():'',m.map?m.map.uuid:'',m.vertexColors?1:0,m.transparent?1:0,m.opacity,m.side,m.emissive?m.emissive.getHex():'',m.depthWrite?1:0,m.fog?1:0].join('|');}
function batchStatic(root){root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(root.matrixWorld).invert();const buckets=new Map();const kill=[];
  (function walk(o){if(o!==root&&o.userData&&o.userData.dyn)return;if(!o.visible)return;
    if(o.isMesh&&!o.isInstancedMesh&&!Array.isArray(o.material)&&o.geometry&&o.geometry.attributes.position){const k=matKey(o.material);let b=buckets.get(k);if(!b){b={mat:o.material,list:[],cast:false,recv:false,order:o.renderOrder};buckets.set(k,b);}
      b.list.push(o);b.cast=b.cast||o.castShadow;b.recv=b.recv||o.receiveShadow;}
    for(const c of o.children.slice())walk(c);})(root);
  const m4=new THREE.Matrix4();
  for(const b of buckets.values()){if(b.list.length<2)continue;let n=0;const gs=[];const hasCol=!!b.list[0].geometry.attributes.color;
    for(const o of b.list){let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();m4.multiplyMatrices(inv,o.matrixWorld);g.applyMatrix4(m4);if(!g.attributes.normal)g.computeVertexNormals();if(hasCol&&!g.attributes.color)continue;gs.push(g);n+=g.attributes.position.count;kill.push(o);}
    const pos=new Float32Array(n*3),nor=new Float32Array(n*3),uv=new Float32Array(n*2),col=hasCol?new Float32Array(n*3):null;let off=0;
    for(const g of gs){const c=g.attributes.position.count;pos.set(g.attributes.position.array,off*3);nor.set(g.attributes.normal.array,off*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,off*2);if(col)col.set(g.attributes.color.array,off*3);off+=c;g.dispose();}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));if(col)geo.setAttribute('color',new THREE.BufferAttribute(col,3));
    const me=new THREE.Mesh(geo,b.mat);me.castShadow=b.cast;me.receiveShadow=b.recv;me.renderOrder=b.order;root.add(me);}
  for(const o of kill)if(o.parent)o.parent.remove(o);return root;}
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz));

// ---------- 天空、光源（柔和） ----------
scene.fog=new THREE.Fog(0xc4e6fa,40,230);
const skyU={top:{value:new THREE.Color(0x7ec8f8)},bot:{value:new THREE.Color(0xcfeaff)}};
const skyDome=new THREE.Mesh(new THREE.SphereGeometry(400,24,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 top;uniform vec3 bot;varying vec3 vP;void main(){float h=clamp(vP.y*1.25+0.02,0.,1.);gl_FragColor=vec4(mix(bot,top,pow(h,0.6)),1.);}'}));
skyDome.renderOrder=-10;scene.add(skyDome);
const hemi=new THREE.HemisphereLight(0xfff6e8,0x8a90c8,0.55);scene.add(hemi);
const amb=new THREE.AmbientLight(0xffffff,0.12);scene.add(amb);
const sun=new THREE.DirectionalLight(0xfff4e6,0.32);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:180});sun.shadow.bias=-0.0008;sun.shadow.radius=3;scene.add(sun,sun.target);
const moonL=new THREE.DirectionalLight(0xc8c0ff,0);scene.add(moonL,moonL.target);

// ---------- 地形（草地花紋貼圖） ----------
const ZONE={meadow:(x,z)=>x>-72&&x<42&&z>-78&&z<-14};
{const gGeo=new THREE.PlaneGeometry(240,240,120,120);gGeo.rotateX(-Math.PI/2);
 const pos=gGeo.attributes.position,cols=[];
 const g1=new THREE.Color(0x84c252),g2=new THREE.Color(0x95cc5c),g3=new THREE.Color(0x70b048),cM=new THREE.Color(0x9ad064),cW=new THREE.Color(0x63a65c),cP=new THREE.Color(0xdccf8e),cV=new THREE.Color(0xe2d6a2),cD=new THREE.Color(0xcdbb7e),c=new THREE.Color(),c2=new THREE.Color();
 const nz=(x,z)=>Math.sin(x*0.11+Math.cos(z*0.07)*2)*0.5+Math.sin(z*0.13-x*0.05)*0.35+Math.sin((x+z)*0.31)*0.15;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,H(x,z));const n=nz(x,z);c.copy(g1);if(n>0)c.lerp(g2,smooth(0,0.8,n));else c.lerp(g3,smooth(0,0.7,-n));
  {const n2=Math.sin(x*0.21+z*0.07)*Math.cos(z*0.19-x*0.05)+Math.sin(x*0.5+z*0.43)*0.25;if(n2>0.55)c.lerp(cD,smooth(0.55,0.85,n2)*0.75);}
  if(ZONE.meadow(x,z))c.lerp(cM,0.6);
  c.lerp(cW,smooth(38,60,x)*0.8);
  {let pd=1e9;for(const p of PATHS)pd=Math.min(pd,segDist(x,z,...p));if(pd<2.6)c.lerp(cP,1-smooth(1.3,2.6,pd));}
  if(Math.hypot(x-PARK.x,z-PARK.z)<PARK.r+0.5||Math.hypot(x,z)<7.5||Math.hypot(x-V2.x,z-V2.z)<14||Math.hypot(x-V3.x,z-V3.z)<12)c.copy(cV);
  cols.push(c.r,c.g,c.b);}
 gGeo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));gGeo.computeVertexNormals();
 var ground=new THREE.Mesh(gGeo,animeMat(new THREE.MeshToonMaterial({vertexColors:true,gradientMap:gradMap})));ground.receiveShadow=true;scene.add(ground);}
