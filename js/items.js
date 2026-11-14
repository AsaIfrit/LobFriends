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
  greatsword:{n:'大劍',i:'⚔️',k:'weapon',d:'攻速很慢，但一刀造成大範圍高傷害、把怪物打飛',atk:2},
  dagger:{n:'匕首',i:'🔪',k:'weapon',d:'攻速超快、攻擊力低，有 30% 機率連砍兩下',atk:2},
  lute:{n:'魯特琴',i:'🪕',k:'weapon',d:'彈奏音浪攻擊周圍敵人，學會樂章後能替隊友回血',atk:2},
  orb:{n:'水晶法器',i:'🔮',k:'weapon',d:'發射追蹤水晶碎片，學會技能後可召喚水晶與小精靈',atk:2},
  book:{n:'祈禱書',i:'📖',k:'weapon',d:'慢速聖光彈，打中敵人會替自己和隊友回血',atk:2},
  shield:{n:'盾牌',i:'🛡️',k:'weapon',d:'拿著時受到傷害 -60%，緩慢的推擊能把怪物推開',atk:2},
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
  churro:{n:'吉拿棒',i:'🥖',k:'skin',for:'sword',model:'churro',d:'劍的外觀造型，攻擊時會彈出星星！點一下切換'},
  skin_flame:{n:'火焰之劍',i:'🔥',k:'skin',for:'sword',model:'flame',d:'劍的外觀・火花與火焰軌跡'},
  skin_thunder:{n:'雷電長槍',i:'⚡',k:'skin',for:'spear',model:'thunder',d:'長槍的外觀・紫色雷電'},
  skin_wind:{n:'旋風之弓',i:'🍃',k:'skin',for:'bow',model:'windbow',d:'弓的外觀・淺綠光束箭'},
  skin_ice:{n:'冰凍之杖',i:'❄️',k:'skin',for:'staff',model:'icestaff',d:'法杖的外觀・冰晶法球'},
  hat_bow:{n:'粉紅大蝴蝶結',i:'🎀',k:'hat',hat:'bigbow',d:'時裝・軟綿綿的粉紅大蝴蝶結'},
  hat_sprout:{n:'嫩芽小黃帽',i:'👒',k:'hat',hat:'sprout',d:'時裝・頭頂冒出小嫩芽、繡了紅蘋果的小黃帽'},
  hat_jelly:{n:'果凍怪貝雷帽',i:'🍮',k:'hat',hat:'jellyberet',d:'時裝・酒紅貝雷帽，上面趴著一隻小果凍怪'},
  hat_party:{n:'派對三角帽',i:'🥳',k:'hat',hat:'party',d:'時裝・圓點點派對帽，頂端有粉紅毛球'},
  hat_bucket:{n:'黑色漁夫帽',i:'🎩',k:'hat',hat:'bucket',d:'時裝・很酷的黑色漁夫帽'},
  plush:{n:'龍蝦精靈娃娃',i:'🦞',k:'furn',d:'軟綿綿的龍蝦精靈布偶擺設',r:0.45},
  crystal:{n:'水晶',i:'🔷',k:'mat',price:30,d:'洞窟深處的閃亮礦物，可以賣錢'},
  plank:{n:'木塊',i:'🟫',k:'block',d:'拿在手上可以蓋木方塊，會自動對齊'},
  door:{n:'門',i:'🚪',k:'furn',d:'靠近按「互動」可以開門、關門',r:0.45,door:true}
};
for(const[k,c]of Object.entries(CROPS)){ITEMS[k]={n:c.n,i:c.i,k:'food',d:`吃掉回精神 ${c.en}`,en:c.en,price:c.price};ITEMS['seed_'+k]={n:c.n+'種子',i:'🌱',k:'seed',crop:k,d:`種下去會長出${c.n}`};}
for(const[k,f]of Object.entries(FRUITS))ITEMS[k]={n:f.n,i:f.i,k:'food',d:'吃掉回精神 12',en:12,price:10};
for(const[k,f]of Object.entries(FISH))ITEMS[k]={n:f.n,i:f.i,k:'fish',d:'可以賣錢，也是貓咪的最愛',price:f.price};
for(const[k,b]of Object.entries(BUGS))ITEMS[k]={n:b.n,i:'🦋',k:'bug',d:'可以賣給小栗',price:b.price,col:b.col};
const BLK_COLORS=[['red','紅','🟥',0xff6b6b],['orange','橙','🟧',0xffa04a],['yellow','黃','🟨',0xffdf5a],['green','綠','🟩',0x74cf74],['blue','藍','🟦',0x5f9cff],['purple','紫','🟪',0xb085ff],['black','黑','⬛',0x45404c],['white','白','⬜',0xffffff]];
for(const[c,n,i]of BLK_COLORS)ITEMS['blk_'+c]={n:n+'色木塊',i,k:'block',d:`${n}色的方塊，用法跟木塊一樣`};
const RECIPES={
  tool:[['axe1',{wood:3},0],['pick1',{wood:3},1],['axe2',{wood:2,stone:3},1],['pick2',{wood:2,stone:3},1],['hoe',{wood:3,stone:1},1],['can',{wood:2,stone:2},1],['net',{wood:4},1],['rod',{wood:3,weed:3},1]],
  weapon:[['sword',{wood:4},1],['spear',{wood:5,stone:1},1],['bow',{wood:5},1],['staff',{wood:3,stone:3},1],
    ['greatsword',{wood:3,stone:8},1],['dagger',{wood:1,stone:4},1],['lute',{wood:6,weed:5},1],['orb',{stone:5,gem:1},1],['book',{wood:6,weed:4},1],['shield',{wood:6,stone:4},1]],
  block:[['plank',{wood:1},0,5],...BLK_COLORS.map(([c])=>['blk_'+c,{plank:1},0,1])],
  furn:[['bench',{wood:4},0],['door',{wood:5},1],['fence',{wood:2},1,3],['chair',{wood:3},1],['table',{wood:4},1],['pot',{wood:1,stone:2},1],['lantern',{wood:2,stone:2},1],['campfire',{wood:4,stone:3},1],['bed',{wood:8},1]]
};
const inv={};
const has=k=>(inv[k]||0)>0;
function addItem(k,n=1){inv[k]=(inv[k]||0)+n;if(typeof renderHotbar==='function')renderHotbar(k);if(typeof notify==='function')notify(k,n);}

// ---------- 天賦（初學者 + 五大職業） ----------
const CLASSES={
  novice:{n:'初學者',i:'🌱',d:'基礎的武器、生活技能。全部學滿才能開啟五大職業！'},
  warrior:{n:'戰士',i:'⚔️',d:'擅長劍、長槍、大劍的近戰職業'},
  ranger:{n:'遊俠',i:'🏹',d:'擅長弓、匕首、樂器的靈巧職業'},
  mage:{n:'法師',i:'🪄',d:'擅長法杖、法器的魔法職業'},
  merchant:{n:'商人',i:'🪙',d:'擅長運用金幣與煉金術的職業'},
  priest:{n:'牧師',i:'📖',d:'擅長書與盾牌的守護職業'}};
const TALENTS={
  sword:{c:'novice',n:'劍術',i:'🗡️',nodes:[['劍刃強化','劍的傷害 +1'],['旋風斬','第三段旋轉斬範圍擴大'],['劍氣','第三段會射出劍氣波']]},
  spear:{c:'novice',n:'槍術',i:'🔱',nodes:[['突刺強化','長槍傷害 +1'],['貫穿','突刺能刺穿一整排敵人'],['疾風突進','突進距離加倍，衝刺中無敵']]},
  bow:{c:'novice',n:'弓術',i:'🏹',nodes:[['強弓','箭的傷害 +1'],['多重箭','一次射出 3 支箭'],['追蹤箭','箭會自動追蹤敵人']]},
  staff:{c:'novice',n:'法術',i:'🪄',nodes:[['魔力強化','法術傷害 +1'],['爆裂擴大','魔法爆炸範圍 +50%'],['連鎖星光','爆炸後灑出追擊星星']]},
  wood:{c:'novice',n:'伐木',i:'🪓',nodes:[['伐木強化','砍樹力量 +1'],['魔法砍樹','魔法斧加持，砍樹力量 ×2'],['木材豐收','每棵樹多掉 2 塊木材']]},
  mine:{c:'novice',n:'採礦',i:'⛏️',nodes:[['採礦強化','挖礦力量 +1'],['魔法採礦','不用鎬子也能挖，力量 ×2'],['寶石運','挖礦有機會挖到寶石 💎']]},
  farm:{c:'novice',n:'農耕',i:'🌾',nodes:[['綠手指','作物生長速度 +50%'],['魔法灑水','一次澆 3×3 的田'],['大豐收','收成數量 +1']]}
};
// 職業技能：[key, 職業, 名稱, 圖示, 武器(null=通用), 主動?, 前置[key,階], [每階說明...]]
[
 // ===== 戰士 =====
 ['w_combo','warrior','連段鬥志','💗','sword',0,null,['劍第三段命中時回復 1 HP','回復 2 HP','回復 3 HP']],
 ['w_finisher','warrior','終結斬','💥','sword',0,null,['劍第三段傷害 +30%','第三段傷害 +60%','第三段傷害 +100%']],
 ['w_rush','warrior','疾風連劍','🌪️','sword',0,['w_combo',1],['劍的攻擊速度 +10%','攻擊速度 +20%']],
 ['w_bleed','warrior','裂傷','🩸','sword',0,['w_finisher',1],['劍第三段讓敵人流血 3 秒，每秒 1 傷害','每秒 2 傷害']],
 ['w_charge','warrior','先制突擊','⚡','spear',0,null,['長槍「開戰第一擊」（4 秒沒攻擊後）傷害 ×2 並暈眩 1 秒','傷害 ×3、暈眩 1.5 秒','傷害 ×4、暈眩 2 秒']],
 ['w_pierce','warrior','長槍專精','📏','spear',0,null,['長槍攻擊距離 +1m、傷害 +1','距離 +2m、傷害 +2']],
 ['w_swift','warrior','疾槍','🌬️','spear',0,['w_pierce',1],['長槍攻擊速度 +12%','攻擊速度 +25%']],
 ['w_leap','warrior','天降槍擊','🦅','spear',1,['w_charge',1],['【主動】跳進 9m 內的戰場，落地造成 3× 攻擊力範圍傷害','落地傷害 4×、範圍更大並擊退']],
 ['w_heavy','warrior','重劍專精','🗿','greatsword',0,null,['大劍傷害 +15%','大劍傷害 +30%']],
 ['w_counter','warrior','反擊','🔁','greatsword',0,null,['拿大劍被打後 1.5 秒內，下一擊傷害 ×2','反擊傷害 ×2.5','反擊傷害 ×3']],
 ['w_launch','warrior','擊飛','🚀','greatsword',0,['w_heavy',1],['大劍把怪物打得更遠，並暈眩 0.6 秒','打飛距離 ×2，暈眩 1.2 秒']],
 ['w_quake','warrior','大地粉碎','🌋','greatsword',1,['w_heavy',1],['【主動】蓄力砸地，半徑 4m 造成 3× 攻擊力傷害','半徑 4.5m、4× 傷害','半徑 5m、5× 傷害']],
 ['w_iron','warrior','鋼鐵之軀','🧱',null,0,null,['最大血量 +3','最大血量 +6','最大血量 +10']],
 ['w_guard','warrior','堅毅','🪨',null,0,['w_iron',1],['受到的傷害 -10%','受到的傷害 -20%']],
 // ===== 遊俠 =====
 ['r_steady','ranger','定點射擊','🎯','bow',0,null,['站著不動用弓攻擊時，追加 1 支箭（50% 傷害）','追加 2 支箭','追加 3 支箭']],
 ['r_rapid','ranger','連射','🏹','bow',0,null,['弓的攻擊速度 +15%','攻擊速度 +30%']],
 ['r_crit','ranger','鷹眼','🦅','bow',0,['r_steady',1],['箭有 10% 機率暴擊（×2 傷害）','暴擊率 20%','暴擊率 30%']],
 ['r_rain','ranger','箭雨','🌧️','bow',1,['r_rapid',1],['【主動】在前方降下 3 秒箭雨，每 0.25 秒 0.6× 傷害','每 0.25 秒 0.9× 傷害、範圍更大']],
 ['r_twin','ranger','雙刃','🗡️','dagger',0,null,['匕首連砍兩下的機率 +15%（共 45%）','共 60%','共 75%']],
 ['r_venom','ranger','淬毒','🧪','dagger',0,null,['匕首命中讓敵人中毒 2 秒，每秒 1 傷害','每秒 2 傷害']],
 ['r_stealth','ranger','隱身','👻','dagger',1,['r_twin',1],['【主動】隱身 3 秒，怪物會忽略你；隱身中第一擊 ×3 傷害','隱身 4 秒','隱身 5 秒']],
 ['r_blink','ranger','瞬步','💨','dagger',1,null,['【主動】往前瞬間衝刺 6m，衝刺中無敵（冷卻 6 秒）','衝刺 9m、冷卻 4 秒']],
 ['r_escape','ranger','脫身術','🫥',null,0,['r_stealth',1],['血量低於 30% 時自動隱身 2 秒（冷卻 30 秒）']],
 ['r_swift','ranger','輕盈','🪶',null,0,null,['移動速度 +5%','移動速度 +10%','移動速度 +15%']],
 ['r_song','ranger','治癒樂章','🎶','lute',1,null,['【主動】演奏 6 秒（不能攻擊、移動變慢），每秒替自己與附近隊友回 1 HP、2 精神','每秒 1.5 HP、3 精神','每秒 2 HP、4 精神']],
 ['r_wave','ranger','音浪強化','🔊','lute',0,null,['樂器音浪範圍 +1m、傷害 +20%','範圍 +2m、傷害 +40%','範圍 +3m、傷害 +60%']],
 ['r_lull','ranger','安眠曲','😴','lute',0,null,['音浪有 15% 機率讓敵人睡著（暈眩 1.5 秒）','機率 30%']],
 ['r_tempo','ranger','激昂節拍','🥁','lute',0,['r_song',1],['演奏時，附近隊友與自己攻擊力 +20%','攻擊力 +40%']],
 // ===== 法師 =====
 ['m_power','mage','魔力湧動','✨','staff',0,null,['法杖能量彈傷害 +15%','傷害 +30%','傷害 +50%']],
 ['m_blast','mage','大爆炸','💫','staff',0,null,['能量彈爆炸範圍 +20%','爆炸範圍 +40%']],
 ['m_frost','mage','冰霜之觸','🧊','staff',0,['m_blast',1],['能量彈爆炸讓敵人緩速 2 秒','緩速效果加強、持續 3 秒']],
 ['m_blizzard','mage','暴風雪','🌨️','staff',1,['m_power',1],['【主動】詠唱 1.5 秒，前方颳起 5 秒暴風雪，每 0.5 秒 0.8× 傷害並緩速','每 0.5 秒 1.1× 傷害','每 0.5 秒 1.4× 傷害']],
 ['m_meteor','mage','隕石術','☄️','staff',1,['m_blizzard',1],['【主動】詠唱 2.5 秒，召喚巨大隕石，半徑 4.5m 造成 6× 傷害','詠唱 2.2 秒、8× 傷害','詠唱 1.8 秒、10× 傷害']],
 ['m_focus','mage','冥想','🧘',null,0,['m_blizzard',1],['所有詠唱時間 -20%','詠唱時間 -40%']],
 ['m_shard','mage','水晶專精','💎','orb',0,null,['法器水晶碎片傷害 +25%','傷害 +50%']],
 ['m_crystal','mage','水晶護衛','💠','orb',1,null,['【主動】召喚 1 顆水晶環繞 20 秒，自動射擊附近敵人','召喚 2 顆','召喚 3 顆']],
 ['m_resonance','mage','共鳴','🎐','orb',0,['m_crystal',1],['水晶護衛持續 +10 秒、射速 +25%','持續 +20 秒、射速 +50%']],
 ['m_sprite','mage','龍蝦小精靈','🧚','orb',1,['m_shard',1],['【主動】召喚有小翅膀的迷你龍蝦精靈 30 秒，每 2 秒替你和隊友回 1 HP、2 精神','每 2 秒回 1.5 HP、3 精神','每 2 秒回 2 HP、4 精神']],
 ['m_mana','mage','魔力泉源','🌊',null,0,null,['攻擊與技能消耗的精神 -20%','消耗 -35%','消耗 -50%']],
 ['m_wisdom','mage','智慧','📚',null,0,['m_mana',1],['所有主動技能冷卻 -10%','冷卻 -20%']],
 // ===== 商人 =====
 ['c_rain','merchant','撒錢模式','💸',null,1,null,['【主動・開關】攻擊力 +40%，命中會灑出金幣，每次命中花 🪙2','攻擊力 +70%','攻擊力 +100%，每次命中只花 🪙1']],
 ['c_bribe','merchant','金錢護盾','💰',null,0,['c_rain',1],['撒錢模式中受到的傷害 -20%','受到的傷害 -40%']],
 ['c_jackpot','merchant','中大獎','🎰',null,0,['c_rain',2],['撒錢模式命中有 5% 機率造成 5× 傷害','機率 10%']],
 ['c_lucky','merchant','招財','🐱',null,0,null,['打倒怪物掉的金幣 +20%','金幣 +40%','金幣 +60%']],
 ['c_haggle','merchant','殺價高手','🤝',null,0,null,['商店買東西 -10%，賣東西 +10%','買 -20%，賣 +20%']],
 ['c_invest','merchant','理財','🏦',null,0,['c_lucky',1],['每天早上 6 點拿到利息：持有金幣的 1%（最多 200）','利息 2%','利息 3%']],
 ['a_golem','merchant','煉成石巨人','🗿',null,1,null,['【主動】用 3 顆石頭煉成比你還大的石巨人 20 秒，拳擊範圍傷害並吸引怪物','持續 25 秒、傷害更高','持續 30 秒、傷害更高']],
 ['a_jelly','merchant','煉成泡泡水母','🪼',null,1,null,['【主動】用 3 根雜草煉成水母 25 秒，從遠處發射泡泡攻擊','泡泡傷害提高','泡泡傷害再提高、射速加快']],
 ['a_master','merchant','煉金大師','⚗️',null,0,['a_golem',1],['召喚物持續時間 +30%、傷害 +20%','持續 +60%、傷害 +40%']],
 ['a_twin','merchant','雙重煉成','👯',null,0,['a_master',2],['同一種召喚物可以同時存在 2 隻']],
 ['a_potion','merchant','調和料理','🍲',null,0,null,['吃東西的回復效果 +30%','回復 +60%','回復 +100%']],
 ['a_transmute','merchant','點石成金','🪨',null,0,['a_potion',1],['挖石頭、水晶有 10% 機率多拿 🪙5','機率 20%、多拿 🪙10']],
 // ===== 牧師 =====
 ['p_bless','priest','祝福之光','🌟','book',0,null,['書的聖光彈回復量 +0.5','回復量 +1','回復量 +1.5']],
 ['p_smite','priest','聖光彈強化','☀️','book',0,null,['聖光彈傷害 +25%、飛得更快','傷害 +50%']],
 ['p_holy','priest','聖光穿透','🔆','book',0,['p_smite',1],['聖光彈可以穿透 1 個敵人','穿透 2 個敵人']],
 ['p_sanct','priest','治癒領域','⛲','book',1,['p_bless',1],['【主動】詠唱 1 秒，製造回血領域 8 秒，每秒回 1 HP','持續 10 秒、每秒 1.5 HP','持續 12 秒、每秒 2 HP']],
 ['p_wall','priest','鐵壁','🏰','shield',0,null,['拿盾牌減傷再 +5%（共 65%）','共 70%','共 75%']],
 ['p_bash','priest','盾擊','👊','shield',0,null,['盾牌推擊傷害 +30%，並暈眩 0.5 秒','傷害 +60%、暈眩 0.8 秒','傷害 +100%、暈眩 1.2 秒']],
 ['p_taunt','priest','挑釁','😤','shield',1,['p_wall',1],['【主動】讓附近敵人優先攻擊你 6 秒，期間減傷再 +10%','持續 9 秒']],
 ['p_guardf','priest','守護領域','🛡️','shield',1,['p_wall',1],['【主動】詠唱 1.2 秒，製造回血與精神的領域 10 秒，每秒 1 HP、2 精神','每秒 1.5 HP、3 精神','每秒 2 HP、4 精神']],
 ['p_thorns','priest','荊棘之盾','🌵','shield',0,['p_bash',1],['拿盾牌被攻擊時，反彈 1× 攻擊力的傷害','反彈 2× 攻擊力']],
 ['p_grace','priest','恩典','🙏',null,0,null,['所有回復效果 +15%','回復 +30%','回復 +50%']],
 ['p_faith','priest','信仰','🕊️',null,0,['p_grace',1],['最大血量 +3，每秒自然回 0.1 HP','最大血量 +6，每秒回 0.2 HP']],
 ['p_revive','priest','神聖救助','💖',null,0,null,['救起倒地隊友的時間 -40%','時間 -70%']],
].forEach(([k,c,n,i,w,act,req,r])=>TALENTS[k]={c,n,i,w,act:!!act,req,nodes:r.map((d,j)=>['Lv'+(j+1),d])});
const tal={};for(const k in TALENTS)tal[k]=0;
const TL=(k,n)=>tal[k]>=n;
const TV=k=>tal[k]||0;
const classKeys=c=>Object.keys(TALENTS).filter(k=>TALENTS[k].c===c);
const classPts=c=>classKeys(c).reduce((a,k)=>a+tal[k],0);
const classMax=c=>classKeys(c).reduce((a,k)=>a+TALENTS[k].nodes.length,0);
const noviceDone=()=>classPts('novice')>=classMax('novice');
// 武器倍率：攻速慢的武器每下比較痛，快的比較輕
const WNAME={sword:'劍',spear:'長槍',greatsword:'大劍',bow:'弓',dagger:'匕首',lute:'樂器',staff:'法杖',orb:'法器',book:'書',shield:'盾牌'};
const WMUL={stick:1,sword:1,spear:1,bow:1,staff:1,greatsword:2.4,dagger:0.55,lute:0.6,orb:0.9,book:1.2,shield:1.3};
const xpNeed=lv=>30+(lv-1)*25;
function weaponAtk(raw){const w=ply.weapon;let a=w==='stick'?1:ITEMS[w].atk;a+=Math.floor((ply.lv-1)/3);
  if(w==='sword'&&TL('sword',1))a++;if(w==='spear'&&TL('spear',1))a++;if(w==='bow'&&TL('bow',1))a++;if(w==='staff'&&TL('staff',1))a++;
  if(w==='spear')a+=TV('w_pierce');
  a*=WMUL[w]||1;if(typeof atkMul==='function')a*=atkMul(w);
  if(ply.en<=0)a*=0.5;return raw?a:Math.max(1,Math.round(a));}
function chopPow(){let p=has('axe2')?4:has('axe1')?2:1;if(TL('wood',1))p++;if(TL('wood',2))p*=2;return p;}
function minePow(){let p=has('pick2')?2:has('pick1')?1:(TL('mine',2)?1:0);if(p===0)return 0;if(TL('mine',1))p++;if(TL('mine',2))p*=2;return p;}

const isBlk=k=>!!k&&!!ITEMS[k]&&ITEMS[k].k==='block';
