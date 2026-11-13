// ===================== items.js：物品、配方、作物、天賦、等級 =====================
const CROPS={
  carrot:{n:'紅蘿蔔',i:'🥕',hrs:4,col:0xff9a3c,en:8,price:15,seed:5},
  tomato:{n:'番茄',i:'🍅',hrs:5,col:0xff5a4a,en:10,price:20,seed:8},
  strawberry:{n:'草莓',i:'🍓',hrs:6,col:0xff4d6d,en:15,price:30,seed:12},
  pumpkin:{n:'南瓜',i:'🎃',hrs:8,col:0xffa02e,en:25,price:50,seed:18}
};
const BUGS={
  bug_white:{n:'紋白蝶',col:'#ffffff',dot:'#7a8a9a',price:10,w:4},
  bug_yellow:{n:'黃蝶',col:'#ffe066',dot:'#c08a20',price:12,w:3},
  bug_pink:{n:'粉紅蝶',col:'#ff9ec7',dot:'#c0507a',price:20,w:2},
  bug_blue:{n:'藍閃蝶',col:'#5aa8ff',dot:'#2a4a9a',price:45,w:1,wild:true}
};
const FRUITS={apple:{n:'蘋果',i:'🍎',col:0xff5a4a},peach:{n:'桃子',i:'🍑',col:0xffa8b8},orange:{n:'橘子',i:'🍊',col:0xffa02e},pear:{n:'西洋梨',i:'🍐',col:0xc8dc5a}};
const FISH={fish1:{n:'小鯽魚',i:'🐟',price:10,w:10},fish2:{n:'熱帶魚',i:'🐠',price:25,w:5},fish3:{n:'河豚',i:'🐡',price:40,w:2.5},fish4:{n:'小章魚',i:'🐙',price:70,w:1}};
const ITEMS={
  wood:{n:'木材',i:'🪵',k:'mat',price:2},stone:{n:'石頭',i:'🪨',k:'mat',price:4},gem:{n:'寶石',i:'💎',k:'mat',price:50},weed:{n:'雜草',i:'🌿',k:'mat',price:1,d:'可以做釣竿的線'},
  rod:{n:'釣竿',i:'🎣',k:'held',d:'拿著它到池塘邊釣魚'},
  cake:{n:'蜂蜜蛋糕',i:'🍰',k:'food',d:'回滿血＋精神 30',en:30,hp:99},
  axe1:{n:'木斧',i:'🪓',k:'tool',d:'砍樹 ×2'},axe2:{n:'石斧',i:'🪓',k:'tool',d:'砍樹 ×4'},
  pick1:{n:'木鎬',i:'⛏️',k:'tool',d:'可以挖石頭'},pick2:{n:'石鎬',i:'⛏️',k:'tool',d:'挖石頭 ×2'},
  hoe:{n:'鋤頭',i:'⚒️',k:'held',d:'拿著它在草地上翻土'},can:{n:'澆水壺',i:'🚿',k:'held',d:'拿著它幫田澆水'},net:{n:'捕蟲網',i:'🥅',k:'held',d:'拿著它靠近蝴蝶'},
  sword:{n:'木劍',i:'🗡️',k:'weapon',d:'三段連擊',atk:2},spear:{n:'長槍',i:'🔱',k:'weapon',d:'長距離突刺',atk:2},
  bow:{n:'弓箭',i:'🏹',k:'weapon',d:'遠距離射擊',atk:2},staff:{n:'法杖',i:'🪄',k:'weapon',d:'魔法範圍爆炸',atk:2},
  bench:{n:'工作台',i:'🧰',k:'furn',d:'放下後可做進階道具',r:0.8},
  fence:{n:'柵欄',i:'🚧',k:'furn',d:'一次做 3 個',r:0.5},
  chair:{n:'小椅子',i:'🪑',k:'furn',d:'可以坐下',r:0.5,sit:true},
  sofa:{n:'軟軟沙發',i:'🛋️',k:'furn',d:'可以坐下',r:0.9,sit:true},
  table:{n:'小桌子',i:'🍮',k:'furn',d:'附贈一塊布丁',r:0.8},
  pot:{n:'花盆',i:'🌷',k:'furn',d:'粉粉的花',r:0.4},
  lantern:{n:'提燈',i:'🏮',k:'furn',d:'晚上會發光',r:0.35},
  campfire:{n:'營火',i:'🔥',k:'furn',d:'靠近會慢慢回血',r:0.7},
  bed:{n:'小床',i:'🛏️',k:'furn',d:'可以躺下睡覺',r:1.0,bed:true},
  bathtub:{n:'浴缸',i:'🛁',k:'furn',d:'可以泡澡回精神',r:1.45,bath:true},
  rug:{n:'圓地毯',i:'🟣',k:'furn',d:'可以踩上去',r:0},
  shelf:{n:'書櫃',i:'📚',k:'furn',d:'放滿了繪本',r:0.8},
  plank:{n:'木塊',i:'🟫',k:'block',d:'拿在手上可以蓋木方塊，會自動對齊'}
};
for(const[k,c]of Object.entries(CROPS)){ITEMS[k]={n:c.n,i:c.i,k:'food',d:`吃掉回精神 ${c.en}`,en:c.en,price:c.price};ITEMS['seed_'+k]={n:c.n+'種子',i:'🌱',k:'seed',crop:k,d:`種下去會長出${c.n}`};}
for(const[k,f]of Object.entries(FRUITS))ITEMS[k]={n:f.n,i:f.i,k:'food',d:'吃掉回精神 12',en:12,price:10};
for(const[k,f]of Object.entries(FISH))ITEMS[k]={n:f.n,i:f.i,k:'fish',d:'可以賣錢，也是貓咪的最愛',price:f.price};
for(const[k,b]of Object.entries(BUGS))ITEMS[k]={n:b.n,i:'🦋',k:'bug',d:'可以賣給小栗',price:b.price,col:b.col};
const RECIPES={
  tool:[['axe1',{wood:3},0],['pick1',{wood:3},1],['axe2',{wood:2,stone:3},1],['pick2',{wood:2,stone:3},1],['hoe',{wood:3,stone:1},1],['can',{wood:2,stone:2},1],['net',{wood:4},1],['rod',{wood:3,weed:3},1]],
  weapon:[['sword',{wood:4},1],['spear',{wood:5,stone:1},1],['bow',{wood:5},1],['staff',{wood:3,stone:3},1]],
  furn:[['plank',{wood:1},0,5],['bench',{wood:4},0],['fence',{wood:2},1,3],['chair',{wood:3},1],['table',{wood:4},1],['pot',{wood:1,stone:2},1],['lantern',{wood:2,stone:2},1],['campfire',{wood:4,stone:3},1],['bed',{wood:8},1]]
};
const inv={};
const has=k=>(inv[k]||0)>0;
function addItem(k,n=1){inv[k]=(inv[k]||0)+n;if(typeof renderHotbar==='function')renderHotbar(k);if(typeof notify==='function')notify(k,n);}

// ---------- 天賦 ----------
const TALENTS={
  sword:{n:'劍術',i:'🗡️',nodes:[['劍刃強化','劍的傷害 +1'],['旋風斬','第三段旋轉斬範圍擴大'],['劍氣','第三段會射出劍氣波']]},
  spear:{n:'槍術',i:'🔱',nodes:[['突刺強化','長槍傷害 +1'],['貫穿','突刺能刺穿一整排敵人'],['疾風突進','突進距離加倍，衝刺中無敵']]},
  bow:{n:'弓術',i:'🏹',nodes:[['強弓','箭的傷害 +1'],['多重箭','一次射出 3 支箭'],['追蹤箭','箭會自動追蹤敵人']]},
  staff:{n:'法術',i:'🪄',nodes:[['魔力強化','法術傷害 +1'],['爆裂擴大','魔法爆炸範圍 +50%'],['連鎖星光','爆炸後灑出追擊星星']]},
  wood:{n:'伐木',i:'🪓',nodes:[['伐木強化','砍樹力量 +1'],['魔法砍樹','魔法斧加持，砍樹力量 ×2'],['木材豐收','每棵樹多掉 2 塊木材']]},
  mine:{n:'採礦',i:'⛏️',nodes:[['採礦強化','挖礦力量 +1'],['魔法採礦','不用鎬子也能挖，力量 ×2'],['寶石運','挖礦有機會挖到寶石 💎']]},
  farm:{n:'農耕',i:'🌾',nodes:[['綠手指','作物生長速度 +50%'],['魔法灑水','一次澆 3×3 的田'],['大豐收','收成數量 +1']]}
};
const tal={};for(const k in TALENTS)tal[k]=0;
const TL=(k,n)=>tal[k]>=n;
const xpNeed=lv=>30+(lv-1)*25;
function weaponAtk(){const w=ply.weapon;let a=w==='stick'?1:ITEMS[w].atk;a+=Math.floor((ply.lv-1)/3);
  if(w==='sword'&&TL('sword',1))a++;if(w==='spear'&&TL('spear',1))a++;if(w==='bow'&&TL('bow',1))a++;if(w==='staff'&&TL('staff',1))a++;return a;}
function chopPow(){let p=has('axe2')?4:has('axe1')?2:1;if(TL('wood',1))p++;if(TL('wood',2))p*=2;return p;}
function minePow(){let p=has('pick2')?2:has('pick1')?1:(TL('mine',2)?1:0);if(p===0)return 0;if(TL('mine',1))p++;if(TL('mine',2))p*=2;return p;}
