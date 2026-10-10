'use strict';

const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const VIEW_W=1280,VIEW_H=720,WORLD_W=4400,GROUND_Y=610,GRAVITY=1900;
const levelShade=ctx.createLinearGradient(0,0,0,VIEW_H);
levelShade.addColorStop(0,'#f3efe477');levelShade.addColorStop(.66,'#eeeae011');levelShade.addColorStop(1,'#b2aa9a33');
let staticSceneBackground=null,staticSceneBackgroundKey='';
function drawStaticSceneBackground(key,painter){
  if(!staticSceneBackground||staticSceneBackgroundKey!==key){
    staticSceneBackground=document.createElement('canvas');staticSceneBackground.width=VIEW_W;staticSceneBackground.height=VIEW_H;
    painter(staticSceneBackground.getContext('2d'));staticSceneBackgroundKey=key;
  }
  ctx.drawImage(staticSceneBackground,0,0);
}
const $=id=>document.getElementById(id);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const playSound=name=>globalThis.gameSound?.play(name);
const setMusicScene=name=>globalThis.gameSound?.setScene(name);
function imageAsset(path,deferred=false){
  const image=new Image();image.dataset.assetSrc=path;
  if(!deferred)image.src=path;
  return image;
}
function ensureImage(image){
  if(!image)return Promise.resolve(null);
  if(!image.src&&image.dataset.assetSrc)image.src=image.dataset.assetSrc;
  if(image.complete&&image.naturalWidth)return Promise.resolve(image);
  return image.decode().then(()=>image).catch(()=>image);
}
function ensureImages(images,onReady){
  const promise=Promise.allSettled(images.filter(Boolean).map(ensureImage));
  if(onReady)promise.then(onReady);
  return promise;
}
const ATLAS_CUTS=[
  [10,125,382,205],[400,130,240,205],[660,35,265,315],[930,135,324,205],
  [45,440,250,240],[365,440,220,240],[640,370,275,320],[925,520,329,170],
  [45,730,250,240],[365,735,225,230],[650,720,280,270],[930,720,324,275],
  [20,980,300,274],[330,980,310,274],[660,980,260,274],[970,1030,284,190]
];
const GROUND_PROP_CUTS=[
  [27,130,442,529]
];
const HERO_CUTS=[
  [63,62,163,203],[312,60,155,205],[559,59,155,207],[803,57,164,209],[1046,60,214,207],[1297,64,213,203],
  [43,302,184,203],[288,302,190,204],[541,302,185,203],[785,303,189,204],[1052,304,178,204],[1298,302,183,207],
  [43,534,226,202],[293,535,232,200],[542,534,231,201],[788,536,230,202],[1033,535,235,203],[1291,535,225,203],
  [55,759,180,213],[280,756,182,214],[526,772,192,191],[776,784,186,184],[1014,770,210,206],[1250,861,249,118]
];
const HERO_ACTION_CUTS=[
  [67,64,210,262],[416,66,215,261],[787,66,210,261],[1147,69,214,258],[1512,68,213,259],[1876,71,212,256],
  [58,403,217,269],[413,422,217,249],[781,432,224,240],[1124,461,257,212],[1455,486,296,187],[1833,504,306,170]
];
const HERO_WALK_CUTS=[
  [66,70,214,260],[425,71,218,260],[793,71,218,259],[1150,71,217,259],[1510,70,217,261],[1879,71,218,259],
  [64,404,264,260],[425,405,266,260],[793,405,266,259],[1150,405,264,259],[1509,405,267,260],[1879,406,265,258]
];
const HERO_WALK_CYCLE_CUTS=[
  [68,51,285,356],[532,74,282,332],[974,58,271,348],[1398,28,301,378],
  [77,473,285,358],[535,494,284,337],[973,482,273,349],[1403,455,296,376]
];
const HERO_EXTRA_CUTS=[
  [100,112,279,299],[529,85,266,284],[972,117,284,284],[1419,144,284,276],
  [108,523,262,289],[544,511,260,302],[951,592,307,229],[1364,667,374,166]
];
const GOAT_MOVE_CUTS=[
  [47,16,285,342],[415,18,285,341],[783,16,288,343],[1138,18,290,341],[1490,19,291,340],[1857,18,280,341],
  [50,369,291,339],[425,370,284,339],[789,364,285,344],[1154,369,282,340],[1498,370,290,339],[1859,369,283,340]
];
const GOAT_ACTION_CUTS=[
  [111,116,244,290],[548,109,257,288],[993,125,254,290],[1445,133,252,293],
  [85,527,265,296],[536,522,280,301],[966,575,283,248],[1380,615,345,207]
];
const GOAT_DASH_CUTS=[
  [91,249,205,236],[440,266,190,216],[780,252,209,222],
  [1115,278,251,190],[1504,265,222,217],[1880,247,206,238]
];
const GOAT_WALK_CYCLE_CUTS=[
  [65,38,328,401],[515,62,327,377],[955,35,324,406],[1400,13,327,424],
  [66,475,331,401],[514,501,327,374],[955,474,324,402],[1401,456,326,421]
];
const KNIGHT_MOVE_CUTS=[
  [59,19,265,325],[418,24,261,320],[778,22,261,321],[1140,23,260,320],[1506,25,264,318],[1865,22,267,322],
  [71,370,262,332],[420,371,277,331],[788,370,263,336],[1150,371,263,333],[1516,370,256,335],[1875,371,260,332]
];
const KNIGHT_ACTION_CUTS=[
  [73,79,292,351],[537,53,266,337],[973,79,273,357],[1429,96,265,348],
  [68,489,321,354],[513,488,294,349],[930,603,332,233],[1336,655,399,192]
];
const KNIGHT_ATTACK_CUTS=[
  [111,293,192,192],[472,236,177,250],[827,283,181,203],[1162,286,281,201],[1542,279,188,208],[1883,266,160,220]
];
const MONK_MOVE_CUTS=[
  [89,103,279,301],[536,103,267,301],[969,107,261,298],[1415,107,276,298],
  [83,514,282,297],[536,510,260,306],[970,586,251,227],[1371,664,353,149]
];
const MONK_ATTACK_CUTS=[
  [50,219,261,303],[402,224,271,298],[762,218,267,304],[1110,218,302,304],[1462,220,296,302],[1859,218,261,304]
];
const SHOP_ITEM_CUTS=Array.from({length:5},(_,index)=>[index*420,0,420,620]);
const FIREBALL_CUTS=Array.from({length:6},(_,index)=>[index*362,215,362,241]);
const CLASS_WEAPON_CUTS=[[49,17,196,294],[326,9,192,301],[621,3,180,308],[893,5,180,302],[1170,3,215,306],[14,335,249,223],[295,326,246,234],[570,330,262,226],[847,345,277,211],[1120,325,279,234],[35,603,207,226],[294,557,251,284],[584,555,247,289],[863,572,249,271],[1148,552,238,292],[18,889,262,224],[284,848,246,265],[571,867,258,233],[858,859,252,254],[1124,866,266,244]];
const CLASS_PROJECTILE_CUTS=[[64,94,288,247],[426,84,367,284],[793,118,351,239],[1207,98,281,257],[1586,74,345,299],[65,523,293,136],[480,473,212,217],[876,475,314,207],[1190,488,396,198],[1586,475,346,229]];
const GOLD_COIN_CUTS=Array.from({length:8},(_,index)=>[index*150,0,150,150]);
const GROUND_END_CUTS=[[0,0,300,220],[300,0,300,220]];
const DEFEAT_BURST_CUTS=[
  [190,175,240,230],[647,98,566,383],[1250,40,600,499],[2041,120,257,340]
];
const ENEMY_CUTS=[
  [72,122,307,257],[446,29,336,352],[861,35,318,349],[1216,5,338,379],[1597,143,319,249],
  [47,511,345,183],[444,435,348,328],[854,406,325,316],[1242,495,296,227],[1595,422,358,312]
];
const NEW_ENEMY_CUTS=[
  [57,127,427,340],[569,190,421,279],[1103,92,371,378],
  [132,541,278,388],[518,667,465,263],[1065,569,438,373]
];
const LEVEL_TILE_CUTS=[
  [15,139,482,309],[528,142,477,283],[1035,145,487,305],
  [60,619,394,268],[541,621,439,240],[1044,607,450,216]
];
const DOWN_SIGN_CUT=[437,204,429,877];
const TRANSITION_CUTS=[[79,54,257,376],[389,16,306,394],[754,31,283,413],[1095,149,310,281],[1419,103,330,309]];
const BOSS_CUTS=[[48,161,413,472],[460,159,410,478],[881,181,407,455],[1293,153,432,480],[1749,225,404,407]];
const BOSS_ACTION_CUTS={
  bossOgre:[[83,155,354,409],[595,167,369,385],[1044,188,511,344],[1665,42,309,636],[2146,167,388,386],[2677,189,365,342]],
  bossGhost:[[65,42,299,342],[476,43,280,341],[866,57,284,326],[1267,52,279,332],[1615,53,355,330],[71,477,279,283],[477,406,277,337],[858,446,293,322],[1249,420,275,343],[1644,429,282,333]],
  bossSerpent:[[90,103,216,245],[478,100,214,246],[863,104,246,242],[1260,94,225,244],[1667,105,260,244],[72,453,258,270],[491,436,214,299],[845,426,282,300],[1266,463,215,265],[1675,476,215,242]],
  bossBeetle:[[39,88,289,305],[442,107,282,289],[813,128,366,268],[1240,51,254,345],[1586,131,392,265],[39,534,315,217],[452,408,251,346],[798,537,383,226],[1240,483,315,276],[1649,481,287,277]],
  bossChest:[[63,169,230,227],[428,177,227,222],[774,147,248,255],[1120,105,249,298],[1437,192,312,211],[58,586,263,211],[423,506,237,288],[734,531,315,269],[1138,525,232,275],[1471,574,231,223]],
  bossWarden:[[28,100,319,268],[407,96,327,294],[799,70,341,298],[1235,25,271,343],[1592,101,371,267],[86,491,305,248],[452,402,276,289],[799,489,343,253],[1220,469,327,278],[1625,466,308,277]],
  bossCrow:[[26,43,362,324],[445,43,325,324],[852,74,313,295],[1219,21,361,347],[1618,27,352,340],[76,467,291,257],[460,436,309,331],[837,403,347,367],[1253,458,301,298],[1604,413,361,338]],
  bossWeaver:[[30,142,341,234],[424,149,341,223],[812,144,336,233],[1202,91,330,286],[1592,151,361,233],[55,514,277,217],[470,440,252,215],[799,518,352,218],[1196,555,381,183],[1604,499,336,237]]
};
const BOSS_ACTION_ANCHORS={bossGhost:[.5,.5,.5,.47,.4,.5,.5,.5,.5,.5],bossSerpent:[.5,.5,.48,.48,.43,.5,.5,.5,.5,.5],bossBeetle:[.5,.5,.4,.5,.42,.5,.5,.5,.5,.5],bossChest:[.5,.5,.62,.58,.42,.5,.5,.5,.5,.5]};
const OGRE_TEN_CUTS=Array.from({length:10},(_,index)=>[(index%5)*440,Math.floor(index/5)*440,440,440]);
const OGRE_DRAW_SCALE=1.45;
const OGRE_HITBOX_WIDTH_RATIO=.52,OGRE_HITBOX_TOP_RATIO=.44,OGRE_HITBOX_BOTTOM_RATIO=.08;
const MAGIC_FOUNTAIN_CUTS=[[20,0,378,724],[400,0,387,724],[787,0,392,724],[1179,0,416,724],[1595,0,196,724]];
const OGRE_INK_BOUNDS={
  patrol:[[21,99,412,417],[43,51,413,418],[53,105,413,418],[39,104,414,418],[24,78,388,418],[52,37,418,384],[23,21,405,418],[35,21,400,384],[26,21,410,384],[22,21,392,404]],
  throw:[[20,37,420,403],[20,52,420,388],[20,78,420,362],[39,20,400,420],[20,23,420,416],[20,60,420,380],[20,61,420,378],[20,73,420,366],[20,39,420,401],[20,36,420,404]],
  jump:[[20,38,420,401],[20,59,420,381],[20,24,420,416],[74,20,366,420],[55,20,385,420],[30,20,409,420],[20,21,420,418],[20,30,420,410],[20,38,420,401],[20,60,420,379]],
  smash:[[20,51,420,388],[20,54,420,385],[46,20,393,420],[57,20,383,420],[20,42,420,397],[20,41,420,398],[20,46,420,393],[20,91,420,349],[20,47,420,393],[20,47,420,393]],
  recover:[[20,79,420,360],[20,71,420,369],[20,49,420,390],[20,36,420,404],[20,44,420,395],[20,37,420,403],[20,47,420,393],[20,26,420,413],[20,29,420,411],[20,29,420,411]]
};
const BOSS_EFFECT_CUTS=Array.from({length:16},(_,index)=>[(index%4)*350,Math.floor(index/4)*350,350,350]);
// The ten smash drawings have large transparent margins inside their atlas cells.
// Crop to the pencil ink so the visible ground line can sit on the arena floor.
const BOSS_WAVE_INK_BOUNDS=[
  [22,127,329,222],[22,91,328,260],[22,84,329,267],[20,76,330,275],[21,57,329,293],
  [21,76,328,273],[20,103,330,246],[20,118,329,234],[22,136,330,215],[21,136,329,214]
];
const BOSS_WAVE_CUTS=BOSS_WAVE_INK_BOUNDS.map(([left,top,right,bottom],index)=>{
  const [x,y]=BOSS_EFFECT_CUTS[index+6];return[x+left,y+top,right-left,bottom-top];
});
const SHOP_CUTS=[[30,43,320,400],[369,16,355,427],[775,133,236,256],[1072,85,334,359],[1419,28,284,416],[61,498,294,317],[377,452,289,414],[722,444,341,410],[1070,444,348,406],[1423,444,291,392]];
const NEW_ENEMY_TYPES=['snail','scarecrow','ram','mole','eye','slime','imp','turtle','thorn','crow','spider','guard','wisp','leech','golem'];
const ENEMY_ART_SCALE={
  snail:1.78,scarecrow:1.58,ram:1.6,mole:1.64,eye:1.66,
  slime:1.62,imp:1.62,turtle:1.62,thorn:1.66,crow:1.6,
  spider:1.62,guard:1.58,wisp:1.66,leech:1.64,golem:1.55
};
const BOSS_TYPES=['bossOgre','bossGhost','bossSerpent','bossBeetle','bossChest','bossWarden','bossCrow','bossWeaver'];
const BOSS_ATTACK_PATTERNS={
  bossOgre:['jumpWindup','throwWindup','chargeWindup','spreadWindup','rainWindup'],
  bossGhost:['rainWindup','spreadWindup','chargeWindup','throwWindup','jumpWindup'],
  bossSerpent:['chargeWindup','spreadWindup','throwWindup','rainWindup','jumpWindup'],
  bossBeetle:['chargeWindup','jumpWindup','rainWindup','spreadWindup','throwWindup'],
  bossChest:['spreadWindup','throwWindup','rainWindup','jumpWindup','chargeWindup'],
  bossWarden:['throwWindup','chargeWindup','jumpWindup','rainWindup','spreadWindup'],
  bossCrow:['rainWindup','chargeWindup','spreadWindup','jumpWindup','throwWindup'],
  bossWeaver:['spreadWindup','rainWindup','throwWindup','chargeWindup','jumpWindup']
};
const BOSS_ATTACK_CYCLE=BOSS_ATTACK_PATTERNS.bossOgre;
const BOSS_FAIRNESS={
  minimumWindup:.34,
  repeatedChargeWindup:.3,
  minimumRecovery:.58,
  ghostRecovery:.92,
  fallbackDamage:1,
  fallbackReach:104,
  fallbackCooldown:.5,
  fallbackDuration:.42
};
const BOSS_BEHAVIORS={
  bossOgre:{windups:{throwWindup:.58,jumpWindup:.36,spreadWindup:.48,chargeWindup:.42,rainWindup:.56},throwRelease:.24,spreadRelease:.32,rainTime:1.18,rainInterval:.19,chargeTime:.82,chargeSpeed:540,chargePasses:1,jumpTime:1.5,jumpVelocity:-760,jumpSpeed:185,jumpGravity:.78,slamTime:.78,slamRelease:.35,recover:.58,cooldown:.98,walkSpeed:44,preferredDistance:260},
  bossGhost:{windups:{throwWindup:.4,jumpWindup:.3,spreadWindup:.34,chargeWindup:.24,rainWindup:.44},throwRelease:.2,spreadRelease:.26,rainTime:1.42,rainInterval:.14,chargeTime:.56,chargeSpeed:690,chargePasses:2,jumpTime:1.2,jumpVelocity:-560,jumpSpeed:245,jumpGravity:.92,slamTime:.62,slamRelease:.28,recover:.48,cooldown:.72,walkSpeed:58,preferredDistance:300},
  bossSerpent:{windups:{throwWindup:.34,jumpWindup:.28,spreadWindup:.3,chargeWindup:.24,rainWindup:.4},throwRelease:.18,spreadRelease:.23,rainTime:1.02,rainInterval:.13,chargeTime:.62,chargeSpeed:620,chargePasses:2,jumpTime:1.28,jumpVelocity:-690,jumpSpeed:260,jumpGravity:.88,slamTime:.62,slamRelease:.27,recover:.44,cooldown:.67,walkSpeed:54,preferredDistance:235},
  bossBeetle:{windups:{throwWindup:.44,jumpWindup:.22,spreadWindup:.38,chargeWindup:.2,rainWindup:.42},throwRelease:.2,spreadRelease:.26,rainTime:.9,rainInterval:.18,chargeTime:.46,chargeSpeed:760,chargePasses:3,jumpTime:1.12,jumpVelocity:-620,jumpSpeed:310,jumpGravity:1.02,slamTime:.56,slamRelease:.24,recover:.38,cooldown:.6,walkSpeed:68,preferredDistance:205},
  bossChest:{windups:{throwWindup:.48,jumpWindup:.42,spreadWindup:.4,chargeWindup:.5,rainWindup:.5},throwRelease:.28,spreadRelease:.38,rainTime:1.5,rainInterval:.12,chargeTime:.9,chargeSpeed:500,chargePasses:1,jumpTime:1.6,jumpVelocity:-720,jumpSpeed:150,jumpGravity:.72,slamTime:.86,slamRelease:.4,recover:.66,cooldown:1.04,walkSpeed:38,preferredDistance:285},
  bossWarden:{windups:{throwWindup:.5,jumpWindup:.44,spreadWindup:.52,chargeWindup:.5,rainWindup:.58},throwRelease:.3,spreadRelease:.38,rainTime:1.32,rainInterval:.2,chargeTime:.84,chargeSpeed:570,chargePasses:1,jumpTime:1.45,jumpVelocity:-700,jumpSpeed:210,jumpGravity:.86,slamTime:.82,slamRelease:.36,recover:.7,cooldown:.9,walkSpeed:48,preferredDistance:250},
  bossCrow:{windups:{throwWindup:.46,jumpWindup:.38,spreadWindup:.48,chargeWindup:.42,rainWindup:.54},throwRelease:.28,spreadRelease:.32,rainTime:1.18,rainInterval:.18,chargeTime:.7,chargeSpeed:610,chargePasses:2,jumpTime:1.25,jumpVelocity:-610,jumpSpeed:260,jumpGravity:.92,slamTime:.7,slamRelease:.31,recover:.72,cooldown:.82,walkSpeed:58,preferredDistance:290},
  bossWeaver:{windups:{throwWindup:.48,jumpWindup:.4,spreadWindup:.46,chargeWindup:.46,rainWindup:.5},throwRelease:.3,spreadRelease:.34,rainTime:1.25,rainInterval:.16,chargeTime:.76,chargeSpeed:590,chargePasses:2,jumpTime:1.34,jumpVelocity:-680,jumpSpeed:235,jumpGravity:.9,slamTime:.76,slamRelease:.34,recover:.68,cooldown:.84,walkSpeed:54,preferredDistance:265}
};
const ENEMY_DEFS={
  ghost:{w:68,h:82,hp:2,score:175,ground:true,hitbox:[.62,.72]},bat:{w:78,h:52,hp:1,score:125,airborne:true,hitbox:[.68,.58]},
  snail:{w:92,h:58,hp:3,score:240,ground:true,sprite:1,hitbox:[.78,.52]},
  scarecrow:{w:66,h:92,hp:2,score:220,ground:true,sprite:2,hitbox:[.55,.78]},ram:{w:96,h:64,hp:3,score:260,ground:true,sprite:3,hitbox:[.76,.62]},
  mole:{w:76,h:50,hp:2,score:210,ground:true,sprite:4,hitbox:[.7,.5]},eye:{w:70,h:56,hp:2,score:225,airborne:true,sprite:5,hitbox:[.62,.62]},
  slime:{w:72,h:58,hp:2,score:190,ground:true,sprite:6,hitbox:[.68,.55]},imp:{w:62,h:70,hp:2,score:250,ground:true,sprite:7,hitbox:[.58,.7]},
  turtle:{w:88,h:58,hp:4,score:285,ground:true,sprite:8,hitbox:[.76,.58]},thorn:{w:72,h:72,hp:3,score:260,ground:true,sprite:9,hitbox:[.68,.68]},
  crow:{w:92,h:70,hp:3,score:310,airborne:true,sprite:0,spriteSheet:2,hitbox:[.68,.62]},spider:{w:96,h:60,hp:4,score:340,ground:true,sprite:1,spriteSheet:2,hitbox:[.76,.56]},
  guard:{w:82,h:94,hp:5,score:390,ground:true,sprite:2,spriteSheet:2,hitbox:[.7,.82]},wisp:{w:66,h:82,hp:3,score:350,airborne:true,sprite:3,spriteSheet:2,hitbox:[.62,.68]},
  leech:{w:105,h:58,hp:4,score:365,ground:true,sprite:4,spriteSheet:2,hitbox:[.8,.56]},golem:{w:112,h:112,hp:6,score:470,ground:true,sprite:5,spriteSheet:2,hitbox:[.78,.82]},
  bossOgre:{w:154,h:170,hp:14,score:1500,ground:true,bossSprite:0,hitbox:[1.46,1.38]},bossGhost:{w:150,h:160,hp:13,score:1500,airborne:true,bossSprite:1,hitbox:[.72,.78]},
  bossSerpent:{w:168,h:178,hp:15,score:1600,ground:true,bossSprite:2,hitbox:[.72,.78]},bossBeetle:{w:178,h:142,hp:17,score:1700,ground:true,bossSprite:3,hitbox:[.72,.74]},bossChest:{w:164,h:148,hp:16,score:1800,ground:true,bossSprite:4,hitbox:[.74,.72]},
  bossWarden:{w:185,h:175,hp:18,score:1950,ground:true,bossSprite:null,bossDrawScale:1.55,hitbox:[.76,.82]},bossCrow:{w:190,h:145,hp:17,score:2000,airborne:true,bossSprite:null,bossDrawScale:1.72,hitbox:[.72,.7]},bossWeaver:{w:205,h:135,hp:19,score:2100,ground:true,bossSprite:null,bossDrawScale:1.68,hitbox:[.8,.76]}
};

const assets={
  titleCast:Object.assign(new Image(),{src:'/play/sketchbound/assets/title-cast-chatgpt.webp'}),
  heroActions:Object.assign(new Image(),{src:'/play/sketchbound/assets/hero-actions-sketchy-chatgpt.webp'}),
  heroWalk:imageAsset('/play/sketchbound/assets/hero-walk-sketchy-chatgpt.webp',true),
  heroWalkCycle:imageAsset('/play/sketchbound/assets/kid-walk-inbetweens-chatgpt.webp',true),
  heroExtra:imageAsset('/play/sketchbound/assets/hero-air-damage-sketchy-chatgpt.webp',true),
  goatMove:Object.assign(new Image(),{src:'/play/sketchbound/assets/goat-girl-movement-chatgpt.webp'}),
  goatActions:imageAsset('/play/sketchbound/assets/goat-girl-actions-chatgpt.webp',true),
  goatDash:imageAsset('/play/sketchbound/assets/goat-girl-horn-dash-chatgpt.webp',true),
  goatWalkCycle:imageAsset('/play/sketchbound/assets/goat-girl-walk-inbetweens-chatgpt.webp',true),
  knightMove:Object.assign(new Image(),{src:'/play/sketchbound/assets/knight-movement-chatgpt.webp'}),
  knightActions:imageAsset('/play/sketchbound/assets/knight-actions-chatgpt.webp',true),
  knightAttack:imageAsset('/play/sketchbound/assets/knight-attack-chatgpt.webp',true),
  monkMove:Object.assign(new Image(),{src:'/play/sketchbound/assets/monk-movement-chatgpt.webp'}),
  monkAttack:imageAsset('/play/sketchbound/assets/monk-palm-strike-chatgpt.webp',true),
  wallImpact:Object.assign(new Image(),{src:'/play/sketchbound/assets/wall-impact-burst-chatgpt.png'}),
  defeatBurst:Object.assign(new Image(),{src:'/play/sketchbound/assets/enemy-burst-child-sketch-chatgpt-clean.webp'}),
  enemyTypes:Object.assign(new Image(),{src:'/play/sketchbound/assets/enemy-types-chatgpt-v2.webp'}),
  enemyTypes2:Object.assign(new Image(),{src:'/play/sketchbound/assets/enemy-types-2-chatgpt.webp'}),
  snailShield:Object.assign(new Image(),{src:'/play/sketchbound/assets/snail-shield-pencil-chatgpt.webp'}),
  levelTiles2:Object.assign(new Image(),{src:'/play/sketchbound/assets/level-tiles-2-chatgpt.webp'}),
  downSign:Object.assign(new Image(),{src:'/play/sketchbound/assets/down-checkpoint-chatgpt.webp'}),
  bossTransition:Object.assign(new Image(),{src:'/play/sketchbound/assets/boss-transition-chatgpt.webp'}),
  bossArt:imageAsset('/play/sketchbound/assets/bosses-clean-chatgpt.webp',true),
  bossOgreActions:imageAsset('/play/sketchbound/assets/boss-ogre-attacks-chatgpt-clean.webp',true),
  bossOgrePatrol:imageAsset('/play/sketchbound/assets/boss-ogre-patrol-10-chatgpt-clean.webp',true),
  bossOgreThrow:imageAsset('/play/sketchbound/assets/boss-ogre-throw-10-chatgpt-v2-clean.webp',true),
  bossOgreJump:imageAsset('/play/sketchbound/assets/boss-ogre-jump-10-chatgpt-v2-clean.webp',true),
  bossOgreSmash:imageAsset('/play/sketchbound/assets/boss-ogre-smash-10-chatgpt-v2-clean.webp',true),
  bossOgreRecover:imageAsset('/play/sketchbound/assets/boss-ogre-recover-10-chatgpt-v2-clean.webp',true),
  bossEffects:imageAsset('/play/sketchbound/assets/shop-hand-projectiles-shockwave-10-chatgpt-v2-clean.webp',true),
  bossGhostActions:imageAsset('/play/sketchbound/assets/boss-ghost-actions-10-chatgpt.webp',true),
  bossSerpentActions:imageAsset('/play/sketchbound/assets/boss-serpent-actions-10-chatgpt.webp',true),
  bossBeetleActions:imageAsset('/play/sketchbound/assets/boss-beetle-actions-10-chatgpt.webp',true),
  bossChestActions:imageAsset('/play/sketchbound/assets/boss-chest-actions-10-chatgpt.webp',true),
  bossWardenActions:imageAsset('/play/sketchbound/assets/boss-warden-actions-10-chatgpt.webp',true),
  bossCrowActions:imageAsset('/play/sketchbound/assets/boss-crow-actions-10-chatgpt.webp',true),
  bossWeaverActions:imageAsset('/play/sketchbound/assets/boss-weaver-actions-10-chatgpt.webp',true),
  bossArena:imageAsset('/play/sketchbound/assets/boss-arena-chatgpt.webp',true),
  shopCatalog:imageAsset('/play/sketchbound/assets/shop-catalog-chatgpt.webp',true),
  shopCutscene:imageAsset('/play/sketchbound/assets/shop-cutscene-chatgpt.webp',true),
  shopItems:imageAsset('/play/sketchbound/assets/shop-items-floating-chatgpt-clean.webp',true),
  classWeapons:imageAsset('/play/sketchbound/assets/class-weapons-chatgpt.webp',true),
  classProjectiles:imageAsset('/play/sketchbound/assets/class-projectiles-chatgpt.webp',true),
  shopSupplies:imageAsset('/play/sketchbound/assets/shop-ammo-repairs-chatgpt.webp',true),
  wizardMagicMeter:imageAsset('/play/sketchbound/assets/wizard-magic-meter-chatgpt.webp',true),
  wizardFireball:Object.assign(new Image(),{src:'/play/sketchbound/assets/wizard-fireball-red-6-chatgpt.webp'}),
  magicFountain:imageAsset('/play/sketchbound/assets/magic-fountain-rope-6-chatgpt.webp',true),
  magicFountainDry:imageAsset('/play/sketchbound/assets/magic-fountain-dry-chatgpt.webp',true),
  giantGoldCoin:Object.assign(new Image(),{src:'/play/sketchbound/assets/giant-gold-coin-8-chatgpt.webp'}),
  groundEnds:Object.assign(new Image(),{src:'/play/sketchbound/assets/ground-end-caps-chatgpt.png'}),
  gapSpikes:Object.assign(new Image(),{src:'/play/sketchbound/assets/spike-ground-tile-chatgpt.webp'}),
  background:Object.assign(new Image(),{src:'/play/sketchbound/assets/ruined-kingdom-chatgpt.webp'}),
  lifeHeart:Object.assign(new Image(),{src:'/play/sketchbound/assets/one-life-heart-chatgpt.webp'}),
  atlas:Object.assign(new Image(),{src:'/play/sketchbound/assets/world-atlas-chatgpt.webp'}),
  groundProps:Object.assign(new Image(),{src:'/play/sketchbound/assets/ground-props-wiggly-chatgpt.webp'}),
  mapMaker:imageAsset('/play/sketchbound/assets/map-maker-atlas-chatgpt.webp',true)
};

function characterGameplayImages(characterId){
  if(characterId==='goat')return[assets.goatMove,assets.goatActions,assets.goatDash,assets.goatWalkCycle];
  if(characterId==='knight')return[assets.knightMove,assets.knightActions,assets.knightAttack];
  if(characterId==='monk')return[assets.monkMove,assets.monkAttack];
  return[assets.heroActions,assets.heroWalk,assets.heroWalkCycle,assets.heroExtra];
}
function prepareCharacterArt(characterId){return ensureImages(characterGameplayImages(characterId),()=>{drawCharacterPreviews();if(['playing','dying'].includes(state))draw();});}

const keys=new Set();
const justPressed=new Set();
const touch={left:false,right:false,jump:false,shoot:false,dash:false,duck:false,item:false};
const remoteHeldInputs=new Map();
const REMOTE_ACTION_BY_NAME=Object.freeze({
  arrowleft:'left',left:'left',dpadleft:'left',vkleft:'left',
  arrowright:'right',right:'right',dpadright:'right',vkright:'right',
  arrowup:'up',up:'up',dpadup:'up',vkup:'up',
  arrowdown:'down',down:'down',dpaddown:'down',vkdown:'down',
  enter:'confirm',numpadenter:'confirm',select:'confirm',accept:'confirm',ok:'confirm',dpadcenter:'confirm',
  mediaplay:'confirm',play:'confirm',mediaplaypause:'confirm',playpause:'confirm',
  escape:'back',back:'back',browserback:'back',goback:'back',backspace:'back',vkback:'back',
  keyp:'pause',mediapause:'pause',pause:'pause',
  colorf0red:'item',red:'item',remotered:'item',
  colorf1green:'dash',green:'dash',remotegreen:'dash',
  colorf2yellow:'jump',yellow:'jump',remoteyellow:'jump',
  colorf3blue:'duck',blue:'duck',remoteblue:'duck',
  mediafastforward:'cycle',fastforward:'cycle',channelup:'cycle',
  mediarewind:'cycle',rewind:'cycle'
});
const REMOTE_ACTION_BY_KEY_CODE=Object.freeze({
  4:'back',13:'confirm',19:'up',20:'down',21:'left',22:'right',23:'confirm',
  37:'left',38:'up',39:'right',40:'down',166:'back',179:'confirm',
  403:'item',404:'dash',405:'jump',406:'duck',412:'cycle',415:'confirm',417:'cycle',
  461:'back',10009:'back',10252:'confirm'
});
let padPrevious=[[],[],[],[]];
let padStickLocked=[false,false,false,false];
let state='loading',lastTime=0,worldTime=0,cameraX=0;
let player,partner=null,partners=[],platforms,spikes,traps,enemies,bullets,enemyShots,coinDrops,wallImpacts,defeatBursts,bossWaves=[],props,defeatedActor=null;
let score=0,coins=0,currentLevel=0;
let runUpgrades={speed:0,power:0,jump:0,magnet:0},purchasedShopItems=new Set(),equippedShopItems={weapon:null,accessory:null},equippedClassWeapons={kid:null,goat:null,knight:null,monk:null},weaponConditions={},usableShopItems=[],usedShopItems=new Set(),stageBoss=null,bossClearTimer=0,exitSpikes=null,levelTransition=null,combatCheckpoint=null;
let bossArenaActive=false,shopSceneActive=false,arenaTransition=null,shopPurpose=null,shopWorldSnapshot=null,shopTransition=null;
let fountainRoomActive=false,fountainSnapshot=null,fountainEntrance=null,fountainClimb=null,fountainUseTime=0,bossFountain=null,activeFountainGapIndex=-1;
const lastFountainGapByLevel=[];
let shopSelectionIndex=0,shopCategoryIndex=0,shopFocusZone='items',shopLastItemIndex=0;
const SHOP_SURFACE=659,SHOP_ENTRY_SPEED=390;
let multiplayerPortraitSignature='',bossHudSignature='',overlayStateSignature='';
let gameMode='solo',onlineSession=null,onlineSyncTimer=0,onlineSyncBusy=false,remotePlayers=[];
let localPlayerCount=2;
const PARTY_CAMERA_MARGIN=142,PARTY_MAX_SPREAD=VIEW_W-PARTY_CAMERA_MARGIN*2;
let selectedCharacter='kid',pendingMode='solo',pendingPlayerCount=1;
let localCharacterSelections=['kid','goat','knight','monk'];
let localCharacterReady=[false,false,false,false],localSelectionActivePlayer=0;
let activeWorldWidth=WORLD_W,customMapActive=false;
const MAP_WORLD_W=VIEW_W*3;
const MAP_TOOLS=['ground','platform','ghost','bat','start','goal','erase'];
let mapTool='ground',mapCursor={x:640,y:360},mapMakerLastMove=0,mapMakerPage=0;
let customMap=createBlankCustomMap();

function createBlankCustomMap(){
  return{
    width:MAP_WORLD_W,
    items:[{kind:'ground',x:0,y:659,w:MAP_WORLD_W}],
    start:{x:110,y:659},
    goal:{x:MAP_WORLD_W-120,y:659}
  };
}

const SHARED_CHARACTER_MOVEMENT={moveMultiplier:1,jumpMultiplier:1.45,dashMultiplier:1,dashDuration:.24,dashSpeed:820};
const CHARACTERS={
  kid:{...SHARED_CHARACTER_MOVEMENT,name:'THE WIZARD',maxHp:1,fireCooldown:.3,attackDuration:.3,bulletSpeed:790,bulletDamage:2,projectile:'fire',projectileSize:46,projectileLife:1.65,maxProjectiles:3,resource:'magic',magicCost:50,maxDurability:60,dashDamage:0},
  goat:{...SHARED_CHARACTER_MOVEMENT,name:'GOAT GIRL',maxHp:1,fireCooldown:.15,attackDuration:.18,bulletSpeed:860,bulletDamage:1,resource:'ammo',maxAmmo:120,maxDurability:80,dashDamage:2},
  knight:{...SHARED_CHARACTER_MOVEMENT,name:'THE KNIGHT',maxHp:1,fireCooldown:.3,attackDuration:.3,meleeDamage:2,meleeReach:128,maxDurability:70,dashDamage:0},
  monk:{...SHARED_CHARACTER_MOVEMENT,name:'THE MONK',maxHp:1,fireCooldown:.3,attackDuration:.3,meleeDamage:2,meleeReach:104,meleeKnockback:42,dashDamage:0}
};
const WIZARD_MAGIC={max:1000,cost:50};

const CHARACTER_PROFILES={
  kid:{title:'THE WIZARD',description:'A young fire wizard who keeps danger away with carefully aimed flames.',className:'FIRE WIZARD',role:'RANGED / MAGIC',weapon:'FIRE WAND',outfit:'TRAVEL ROBES',quote:'“Three sparks are plenty.”',strength:'+RANGED FIREBALLS · THREE-SHOT LIMIT',weakness:'MAGIC RUNS OUT',stats:[['HEARTS',1],['POWER',4],['SPEED',3],['JUMP',4],['FOCUS',4]],abilities:[['FIREBALL','Launches a focused two-damage ball of flame.'],['MAGIC METER','Staffs spend magic. Hidden fountains refill it.'],['EVEN STEP','Uses the same run, jump, and dash timing as every hero.']],gear:['FIRE WAND','SPELL BOOK','TRAVEL ROBES']},
  goat:{title:'GOAT GIRL',description:'A smiling gunner who solves problems with a rapid minigun and a horns-first charge.',className:'HORN GUNNER',role:'RANGED / CHARGE',weapon:'RAPID MINIGUN',outfit:'HEAVY BOOTS',quote:'“Smile now. Everything else later.”',strength:'+RAPID MINIGUN · HORN DASH',weakness:'GUNS NEED AMMO',stats:[['HEARTS',1],['POWER',4],['SPEED',3],['JUMP',4],['FOCUS',4]],abilities:[['RAPID FIRE','Guns fire only while they have ammunition.'],['HORN DASH','A charge that hurts enemies.'],['EVEN STEP','Uses the same run, jump, and dash timing as every hero.']],gear:['MINIGUN','TOOL BELT','HEAVY BOOTS']},
  knight:{title:'THE KNIGHT',description:'A quiet sword fighter who survives by reading danger and striking before enemies get close.',className:'BLADE KNIGHT',role:'MELEE / POWER',weapon:'SHORT SWORD',outfit:'TRAVEL CLOTHES',quote:'“Stand firm. Strike once.”',strength:'+LONG REACH · POWER SLASH',weakness:'BLADES WEAR DOWN',stats:[['HEARTS',1],['POWER',4],['SPEED',3],['JUMP',4],['FOCUS',3]],abilities:[['POWER SLASH','A close sword arc with no projectile.'],['LONG REACH','The blade reaches farther than fists or palms.'],['EVEN STEP','Uses the same run, jump, and dash timing as every hero.']],gear:['SHORT SWORD','TRAVEL CAPE','PLATE BOOTS']},
  monk:{title:'THE MONK',description:'A disciplined wanderer who seeks balance in body and mind. Fights up close with precise palm strikes.',className:'MONK',role:'MELEE / FOCUS',weapon:'FISTS / PALMS',outfit:'LIGHT ROBES',quote:'“A calm mind strikes the hardest.”',strength:'+PALM STRIKE · STRONG KNOCKBACK',weakness:'HAND GEAR WEARS DOWN',stats:[['HEARTS',1],['POWER',4],['SPEED',3],['JUMP',4],['FOCUS',5]],abilities:[['PALM STRIKE','A fast hit that knocks enemies back.'],['FOCUS','Every fifth hit adds a stronger knockback.'],['EVEN STEP','Uses the same run, jump, and dash timing as every hero.']],gear:['PRAYER BEADS','MONK ROBE','TRAINING WRAPS']}
};

const CHARACTER_IDS=Object.keys(CHARACTERS);

function characterStats(actor=player){
  const base=CHARACTERS[actor?.characterId]||CHARACTERS.kid;
  const weapon=equippedShopItem('weapon',actor),accessory=equippedShopItem('accessory',actor);
  const bonuses=addItemBonuses(accessory?.bonuses),speedBuff=activeItemBuff(actor,'speed'),jumpBuff=activeItemBuff(actor,'jump'),powerBuff=activeItemBuff(actor,'power');
  const stats={...base,moveMultiplier:base.moveMultiplier*(1+runUpgrades.speed*.1+(bonuses.speed||0)+speedBuff),jumpMultiplier:base.jumpMultiplier*(1+runUpgrades.jump*.1+(bonuses.jump||0)+jumpBuff)};
  if(weapon?.weaponProfile){
    const profile=weapon.weaponProfile,damage=profile.damage+runUpgrades.power+(bonuses.power||0)+powerBuff;
    Object.assign(stats,{weaponProfile:profile,fireCooldown:profile.cooldown,attackDuration:profile.attackDuration||Math.max(.22,profile.cooldown*.8),bulletSpeed:profile.speed||0,bulletDamage:profile.kind==='ranged'?damage:0,meleeDamage:profile.kind==='melee'?damage:0,meleeReach:profile.reach||base.meleeReach||100,meleeKnockback:profile.knockback||base.meleeKnockback||18});
  }else{
    const isMelee=(base.meleeDamage||0)>0,damageBonus=runUpgrades.power+(bonuses.power||0)+powerBuff;
    stats.bulletDamage=isMelee?(base.bulletDamage||0):(base.bulletDamage||0)+damageBonus;
    stats.meleeDamage=isMelee?(base.meleeDamage||0)+damageBonus:0;
  }
  return stats;
}

const LEVELS=[
  {
    name:'THE FIRST LINE',challenge:'RISING STEPS',width:3000,threat:1.08,theme:{zoom:1.04,contrast:1.02,brightness:1.04,alpha:.88,y:0},
    grounds:[[0,650],[760,1260],[1380,1970],[2095,2580],[2710,3000]],
    platforms:[[390,455,180,1],[675,420,150,3],[990,390,190,1],[1310,450,145,3],[1690,410,210,1],[2020,445,155,3],[2390,385,190,1],[2635,435,150,3]],
    props:[[150,0,1],[2810,0,.82]],spikes:[],traps:[],
    enemies:[['slime',820],['snail',1040],['snail',1210],['bat',1510,335],['ghost',1880],['slime',2390]]
  },
  {
    name:'BROKEN MARGINS',challenge:'THE FALSE FLOOR',width:3200,exit:'down',goalX:2920,threat:1.13,theme:{zoom:1.08,contrast:1.08,brightness:1.01,alpha:.87,y:-10},
    grounds:[[0,500],[620,900],[1030,1320],[1455,1770],[1910,2240],[2385,2865],[2975,3200]],
    platforms:[[330,430,175,3],[535,365,150,1],[810,445,150,3],[960,385,145,1],[1260,430,175,3],[1375,350,145,1],[1690,440,165,3],[1840,375,150,1],[2160,425,180,3],[2295,350,145,1],[2700,420,175,3]],
    props:[[145,0,.9]],spikes:[],traps:[],
    enemies:[['snail',520],['bat',760,335],['ghost',1110],['slime',1270],['bat',1600,305],['snail',2070],['ghost',2470],['slime',2760]]
  },
  {
    name:'THE CROOKED BRIDGE',challenge:'INK CROSSFIRE',width:3400,threat:1.19,theme:{zoom:1.11,contrast:1.14,brightness:.97,alpha:.86,y:-18},
    grounds:[[0,520],[645,990],[1125,1510],[1650,2070],[2215,2650],[2800,3140],[3285,3400]],
    platforms:[[350,440,180,1],[555,345,145,3],[860,405,155,1],[1035,330,145,3],[1370,435,175,1],[1560,360,150,3],[1940,410,180,1],[2115,325,145,3],[2490,430,170,1],[2705,350,150,3],[3030,405,160,1],[3190,330,140,3]],
    props:[[150,0,.85],[3290,0,.72]],spikes:[],traps:[],
    enemies:[['scarecrow',560],['bat',760,310],['eye',920,270],['snail',1240],['ghost',1460],['scarecrow',1820],['bat',2280,290],['snail',2530],['eye',2890,255],['ghost',3060]]
  },
  {
    name:'TEETH IN THE PAPER',challenge:'CHARGING ISLANDS',width:3600,threat:1.25,theme:{zoom:1.06,contrast:1.2,brightness:.93,alpha:.9,y:6},
    grounds:[[0,500],[625,930],[1065,1390],[1530,1850],[1995,2320],[2465,2790],[2940,3260],[3405,3600]],
    platforms:[[315,420,185,3],[520,325,145,1],[815,445,150,3],[980,350,140,1],[1280,405,165,3],[1445,315,145,1],[1760,435,155,3],[1910,340,145,1],[2235,400,170,3],[2390,310,145,1],[2690,440,155,3],[2850,345,145,1],[3170,405,160,3],[3330,320,140,1]],
    props:[[145,0,.85]],spikes:[],traps:[],
    enemies:[['ram',540],['slime',790],['mole',900],['slime',1170],['ram',1360],['bat',1700,290],['mole',2110],['ghost',2270],['slime',2590],['ram',3100],['bat',3440,270],['scarecrow',3520]]
  },
  {
    name:'THE WATCHING RUINS',challenge:'EYES ABOVE · HOLES BELOW',width:3800,exit:'down',goalX:3580,threat:1.31,theme:{zoom:1.16,contrast:1.23,brightness:.9,alpha:.9,y:-24},
    grounds:[[0,500],[630,960],[1095,1420],[1560,1880],[2025,2350],[2495,2810],[2960,3260],[3410,3525],[3635,3800]],
    platforms:[[320,430,175,1],[525,320,145,3],[860,390,160,1],[1010,300,140,3],[1320,440,155,1],[1480,345,145,3],[1800,400,165,1],[1950,285,145,3],[2270,425,160,1],[2420,330,145,3],[2740,385,160,1],[2890,290,145,3],[3180,430,155,1],[3335,325,145,3]],
    props:[[145,0,.8]],spikes:[],traps:[],
    enemies:[['eye',540,280],['mole',720],['ghost',930],['imp',1190],['eye',1370,245],['mole',1690],['ram',1840],['bat',2150,270],['imp',2300],['eye',2630,230],['ghost',2780],['mole',3100],['bat',3440,250],['slime',3490]]
  },
  {
    name:'THE SHAKING PAGE',challenge:'ROLLING CROSSFIRE',width:4000,threat:1.37,theme:{zoom:1.1,contrast:1.3,brightness:.87,alpha:.92,y:2},
    grounds:[[0,500],[630,950],[1085,1400],[1540,1850],[1995,2290],[2440,2730],[2880,3170],[3320,3610],[3760,4000]],
    platforms:[[310,410,185,3],[530,300,145,1],[845,435,155,3],[1000,335,140,1],[1300,395,160,3],[1460,285,145,1],[1760,425,155,3],[1910,325,145,1],[2200,385,160,3],[2355,275,145,1],[2640,435,155,3],[2800,330,145,1],[3080,390,160,3],[3240,280,145,1],[3510,420,155,3],[3670,320,145,1]],
    props:[[145,0,.78]],spikes:[],traps:[],
    enemies:[['turtle',540],['thorn',760],['scarecrow',900],['eye',1180,250],['slime',1330],['turtle',1640],['ram',1810],['thorn',2100],['bat',2260,245],['scarecrow',2550],['mole',2700],['turtle',3010],['eye',3150,225],['thorn',3440],['imp',3570],['ghost',3850]]
  },
  {
    name:'THE BLACK PENCIL',challenge:'THE VANISHING SHAFT',width:4200,exit:'down',goalX:3970,threat:1.43,theme:{zoom:1.2,contrast:1.35,brightness:.82,alpha:.93,y:-32},
    grounds:[[0,480],[610,900],[1035,1320],[1460,1740],[1885,2170],[2315,2600],[2750,3030],[3180,3460],[3610,3915],[4025,4200]],
    platforms:[[300,425,175,1],[505,290,140,3],[805,380,155,1],[960,265,140,3],[1230,435,150,1],[1390,320,140,3],[1660,370,155,1],[1810,250,140,3],[2090,420,150,1],[2240,305,140,3],[2520,365,155,1],[2670,245,140,3],[2950,430,150,1],[3110,310,140,3],[3380,375,155,1],[3530,255,140,3],[3740,420,145,1]],
    props:[[145,0,.76]],spikes:[],traps:[],
    enemies:[['imp',520],['turtle',720],['eye',860,245],['slime',1110],['ram',1260],['mole',1540],['scarecrow',1690],['bat',1980,235],['thorn',2120],['imp',2400],['turtle',2550],['eye',2830,220],['ghost',2990],['ram',3260],['thorn',3410],['imp',3690],['bat',3840,230],['mole',3880]]
  },
  {
    name:'THE LAST SCRIBBLE',challenge:'EVERYTHING AT ONCE',width:4400,threat:1.5,theme:{zoom:1.14,contrast:1.42,brightness:.78,alpha:.94,y:-12},
    grounds:[[0,470],[600,880],[1015,1290],[1430,1710],[1855,2130],[2275,2550],[2700,2970],[3120,3390],[3540,3840],[3990,4400]],
    platforms:[[290,400,180,3],[495,270,140,1],[790,435,150,3],[945,310,140,1],[1210,370,155,3],[1370,245,140,1],[1630,420,150,3],[1785,295,140,1],[2050,360,155,3],[2200,235,140,1],[2470,430,150,3],[2630,300,140,1],[2900,365,155,3],[3050,230,140,1],[3310,420,150,3],[3470,290,140,1],[3760,365,155,3],[3910,240,140,1],[4200,410,160,3]],
    props:[[145,0,.74]],spikes:[],traps:[],
    enemies:[['snail',520],['snail',680],['scarecrow',820],['ram',1110],['mole',1250],['eye',1510,235],['slime',1660],['imp',1940],['turtle',2080],['thorn',2360],['ghost',2510],['bat',2790,220],['ram',2930],['imp',3210],['eye',3360,210],['turtle',3630],['thorn',3780],['scarecrow',4070],['mole',4210],['bat',4290,215]]
  },
  {
    name:'SLATE FEATHER PASS',challenge:'SWOOPS AND SHIELDS',width:4600,threat:1.57,tileTheme:{ground:0,platforms:[3,5]},theme:{zoom:1.18,contrast:1.46,brightness:.76,alpha:.95,y:-20},
    grounds:[[0,500],[625,935],[1060,1370],[1495,1800],[1925,2235],[2360,2670],[2795,3105],[3230,3540],[3665,3975],[4100,4415],[4540,4600]],
    platforms:[[315,420,180,3],[530,305,145,1],[825,440,150,3],[975,325,140,1],[1260,390,165,3],[1415,270,140,1],[1710,430,150,3],[1860,315,140,1],[2150,380,160,3],[2310,255,140,1],[2590,425,150,3],[2750,305,140,1],[3040,370,160,3],[3195,245,140,1],[3480,420,150,3],[3640,295,140,1],[3910,365,160,3],[4065,235,140,1],[4350,405,155,3]],
    props:[[145,0,.72]],spikes:[],traps:[],
    enemies:[['crow',520,255],['guard',720],['spider',900],['wisp',1120,235],['leech',1320],['crow',1530,220],['golem',1740],['guard',1960],['spider',2150],['wisp',2380,205],['leech',2570],['crow',2810,195],['golem',3010],['guard',3260],['spider',3460],['wisp',3690,185],['leech',3870],['crow',4110,180],['golem',4290],['guard',4460],['bat',4510,210],['thorn',4560]]
  },
  {
    name:'THE ROOT CELLAR',challenge:'THE QUIET DROP',width:4800,exit:'down',goalX:4510,threat:1.64,tileTheme:{ground:2,platforms:[5,4]},theme:{zoom:1.22,contrast:1.5,brightness:.72,alpha:.96,y:-28},
    grounds:[[0,480],[605,900],[1025,1315],[1440,1730],[1855,2145],[2270,2560],[2685,2975],[3100,3390],[3515,3805],[3930,4220],[4345,4455],[4565,4800]],
    platforms:[[300,430,175,3],[500,300,140,1],[790,385,155,3],[940,260,140,1],[1210,440,150,3],[1370,315,140,1],[1640,370,155,3],[1795,245,140,1],[2070,425,150,3],[2225,300,140,1],[2500,360,155,3],[2655,230,140,1],[2930,420,150,3],[3085,290,140,1],[3360,350,155,3],[3515,220,140,1],[3790,415,150,3],[3945,280,140,1],[4220,345,155,3],[4280,215,140,1]],
    props:[[145,0,.7]],spikes:[],traps:[],
    enemies:[['spider',520],['leech',690],['wisp',850,230],['guard',1080],['crow',1260,215],['golem',1510],['spider',1690],['leech',1930],['wisp',2110,195],['guard',2360],['crow',2540,190],['golem',2790],['spider',2970],['leech',3210],['wisp',3390,180],['guard',3640],['crow',3820,175],['golem',4050],['spider',4210],['leech',4370],['eye',4480,210],['imp',4630],['guard',4720],['crow',4760,195]]
  },
  {
    name:'THE GLASS QUARRY',challenge:'CRYSTAL CROSSHAIRS',width:5000,threat:1.72,tileTheme:{ground:1,platforms:[3,4]},theme:{zoom:1.25,contrast:1.54,brightness:.69,alpha:.97,y:-34},
    grounds:[[0,480],[605,895],[1020,1310],[1435,1725],[1850,2140],[2265,2555],[2680,2970],[3095,3385],[3510,3800],[3925,4215],[4340,4630],[4755,5000]],
    platforms:[[295,410,180,3],[495,275,140,1],[785,435,150,3],[935,305,140,1],[1205,365,155,3],[1360,235,140,1],[1630,420,150,3],[1785,285,140,1],[2055,350,155,3],[2210,220,140,1],[2480,410,150,3],[2635,275,140,1],[2905,340,155,3],[3060,210,140,1],[3330,405,150,3],[3485,265,140,1],[3755,330,155,3],[3910,205,140,1],[4180,395,150,3],[4335,255,140,1],[4610,325,155,3],[4765,200,140,1]],
    props:[[145,0,.68]],spikes:[],traps:[],
    enemies:[['wisp',520,220],['crow',700,205],['guard',870],['spider',1100],['golem',1270],['leech',1510],['wisp',1690,185],['crow',1930,180],['guard',2110],['spider',2350],['golem',2530],['leech',2770],['wisp',2950,170],['crow',3190,165],['guard',3370],['spider',3610],['golem',3790],['leech',4030],['wisp',4210,160],['crow',4450,155],['guard',4610],['spider',4760],['golem',4890],['eye',4950,195],['thorn',4820],['ram',4700]]
  },
  {
    name:'THE TORN CITADEL',challenge:'ALL INK BREAKS LOOSE',width:5200,threat:1.81,tileTheme:{ground:2,platforms:[4,5,3]},theme:{zoom:1.28,contrast:1.6,brightness:.65,alpha:.98,y:-38},
    grounds:[[0,470],[595,880],[1005,1290],[1415,1700],[1825,2110],[2235,2520],[2645,2930],[3055,3340],[3465,3750],[3875,4160],[4285,4570],[4695,4980],[5105,5200]],
    platforms:[[285,400,180,3],[485,260,140,1],[770,430,150,3],[920,295,140,1],[1185,350,155,3],[1340,215,140,1],[1605,415,150,3],[1760,275,140,1],[2025,335,155,3],[2180,195,140,1],[2445,400,150,3],[2600,255,140,1],[2865,325,155,3],[3020,185,140,1],[3285,390,150,3],[3440,245,140,1],[3705,315,155,3],[3860,175,140,1],[4125,380,150,3],[4280,235,140,1],[4545,305,155,3],[4700,170,140,1],[4960,370,155,3]],
    props:[[145,0,.66]],spikes:[],traps:[],
    enemies:[['golem',520],['crow',690,195],['wisp',840,210],['guard',1080],['spider',1240],['leech',1500],['golem',1660],['crow',1900,175],['wisp',2070,190],['guard',2310],['spider',2470],['leech',2730],['golem',2890],['crow',3130,160],['wisp',3300,180],['guard',3540],['spider',3700],['leech',3960],['golem',4120],['crow',4360,150],['wisp',4530,170],['guard',4770],['spider',4920],['leech',5050],['turtle',5140],['thorn',5180],['imp',4860],['eye',4670,180]]
  }
];

const LEVEL_ENCORE_SIZES=[1400,1400,1400,1400,1600,1600,1600,1600,1800,1800,1800,1800];
const LEVEL_ENCORE_ENEMIES=[
  ['snail','slime','bat','ghost'],
  ['snail','slime','bat','ghost'],
  ['scarecrow','mole','eye','slime','ram','bat'],
  ['ram','mole','slime','scarecrow','eye','ghost'],
  ['imp','mole','eye','ram','slime','bat'],
  ['turtle','thorn','scarecrow','eye','ram','imp'],
  ['turtle','thorn','imp','eye','mole','ghost'],
  ['turtle','thorn','imp','eye','ram','scarecrow'],
  ['crow','spider','guard','wisp','leech','golem'],
  ['spider','leech','wisp','guard','crow','golem'],
  ['wisp','crow','guard','spider','golem','leech'],
  ['golem','crow','wisp','guard','spider','leech']
];
const AIRBORNE_ENEMIES=new Set(['bat','eye','crow','wisp']);

function addLevelEncore(level,index){
  const oldWidth=level.width,extension=LEVEL_ENCORE_SIZES[index],newWidth=oldWidth+extension;
  const islandCount=index<4?3:4,pool=LEVEL_ENCORE_ENEMIES[index],encoreGrounds=[];
  let cursor=oldWidth;
  for(let section=0;section<islandCount;section++){
    const gap=110+((index+section)%3)*10;
    const start=cursor+gap,width=190+((index*2+section)%3)*25,end=start+width;
    const ground=[start,end];
    level.grounds.push(ground);encoreGrounds.push(ground);cursor=end;
  }
  if(level.exit==='down'){
    level.goalX=newWidth-180;
    encoreGrounds.at(-1)[1]=level.goalX-50;
    level.grounds.push([level.goalX+50,newWidth]);
    encoreGrounds.push(level.grounds.at(-1));
  }else{
    const finalStart=cursor+115+((index+1)%2)*10;
    level.grounds.push([finalStart,newWidth]);encoreGrounds.push(level.grounds.at(-1));
  }
  level.width=newWidth;
  level.encoreStart=oldWidth;
  level.encoreGrounds=encoreGrounds.length;
  level.props=level.props||[];
  level.props.push([oldWidth+extension*.38,0,.66],[newWidth-205,0,.58]);

  encoreGrounds.forEach(([start,end],section)=>{
    const width=end-start,center=start+width/2;
    if(width>=150){
      // Keep each added island in jumping range of the surface before it.
      const highSurface=390-((index+section)%3)*20;
      const motion=section%2===0
        ?{kind:'lift',amplitude:38+index*1.2,speed:1.05+section*.08,phase:(index+section)*.6}
        :{kind:'glide',amplitude:44+index*1.1,speed:.9+section*.07,phase:(index+section)*.55};
      level.platforms.push([center-72,Math.max(205,highSurface),144,section%2?1:3,motion]);
      if(section<encoreGrounds.length-1&&width>=205){
        level.platforms.push([start+18,430-((section+index)%2)*38,132,section%2?3:1]);
      }
    }
    if(width<125)return;
    const enemyCount=index>=8&&width>260?2:1;
    for(let enemyIndex=0;enemyIndex<enemyCount;enemyIndex++){
      const type=pool[(section*2+enemyIndex+index)%pool.length];
      const x=start+Math.min(width-55,70+enemyIndex*Math.min(145,width*.45));
      level.enemies.push(AIRBORNE_ENEMIES.has(type)?[type,x,190+((index+section+enemyIndex)%4)*28]:[type,x]);
    }
  });
}

LEVELS.forEach(addLevelEncore);

let groundSegments=[],floatingPlatforms=[],enemyTemplates=[];

function levelData(index=currentLevel){return LEVELS[clamp(Math.round(index)||0,0,LEVELS.length-1)];}

function baseLevelGroundGaps(level=levelData()){
  return level.grounds.slice(0,-1).map((segment,index)=>{
    const x=segment[1],end=level.grounds[index+1][0];
    return{x,end,w:end-x,drop:level.exit==='down'&&level.goalX>=x&&level.goalX<=end};
  });
}

function chooseFountainGap(level,gaps){
  const candidates=gaps.map((gap,index)=>({gap,index})).filter(({gap})=>!gap.drop&&gap.w>=86).map(({index})=>index),levelIndex=LEVELS.indexOf(level);
  if(!candidates.length)return-1;
  const previous=levelIndex>=0?lastFountainGapByLevel[levelIndex]:-1,choices=candidates.length>1?candidates.filter(index=>index!==previous):candidates;
  const choice=choices[Math.floor(Math.random()*choices.length)];
  if(levelIndex>=0)lastFountainGapByLevel[levelIndex]=choice;
  return choice;
}

function levelGroundGaps(level=levelData()){
  const gaps=baseLevelGroundGaps(level),fountainIndex=level===levelData()&&activeFountainGapIndex>=0?activeFountainGapIndex:gaps.findIndex(gap=>!gap.drop);
  return gaps.map((gap,index)=>({...gap,fountain:index===fountainIndex}));
}

function characterJumpRange(characterId){
  const stats=CHARACTERS[characterId]||CHARACTERS.kid;
  const jumpSpeed=Math.max(750,790*stats.jumpMultiplier),runSpeed=310*stats.moveMultiplier;
  return Math.floor(runSpeed*(jumpSpeed*2/GRAVITY)*.8);
}

function levelBalanceReport(){
  return LEVELS.map((level,index)=>{
    const gapLayout=levelGroundGaps(level),gaps=gapLayout.map(gap=>gap.w);
    const maxGap=Math.max(0,...gaps),ranges=Object.fromEntries(CHARACTER_IDS.map(id=>[id,characterJumpRange(id)]));
    const firstDanger=Math.min(...level.enemies.map(([,x])=>x));
    return{index,name:level.name,challenge:level.challenge,threat:level.threat,maxGap,ranges,firstDanger,safeOpening:firstDanger>=420,allCharactersCanCross:CHARACTER_IDS.every(id=>maxGap<=ranges[id]),difficulty:index+1,hazards:gapLayout.filter(gap=>!gap.drop).length,enemies:level.enemies.length,exit:level.exit||'right'};
  });
}

function combatPartySize(){
  if(gameMode==='local')return clamp(localPlayerCount,1,4);
  if(gameMode==='online')return clamp(Math.max(onlineSession?.count||1,1+(remotePlayers?.length||0)),1,4);
  return 1;
}

function rescaleEnemiesForParty(partyScale=combatPartySize()){
  for(const enemy of enemies||[]){
    if(enemy.dead)continue;
    const oldMax=Math.max(1,enemy.maxHp||1),healthRatio=clamp((enemy.hp||oldMax)/oldMax,0,1),soloMaxHp=enemy.soloMaxHp||Math.max(1,Math.round(oldMax/(enemy.partyScale||1)));
    enemy.partyScale=partyScale;enemy.soloMaxHp=soloMaxHp;enemy.maxHp=soloMaxHp*partyScale;enemy.hp=Math.max(1,Math.ceil(enemy.maxHp*healthRatio));
    enemy.speedScale=(enemy.baseSpeedScale||enemy.speedScale||1)*(1+(partyScale-1)*.06);
  }
  updateBossHud();
}

function createEnemy(type,x,y,index=0){
  const def=ENEMY_DEFS[type]||ENEMY_DEFS.ghost,spawn=findClearEnemySpawn(def,x,y),spawnX=spawn.x,centerY=spawn.y;
  const boss=type.startsWith('boss'),threat=levelData().threat||1,partyScale=combatPartySize(),soloMaxHp=boss?(def.hp+currentLevel*2)*10:def.hp+Math.floor(currentLevel/3),baseHp=soloMaxHp*partyScale,patrol=boss?310:155+currentLevel*12;
  const baseSpeedScale=boss?1+currentLevel*.035:threat,speedScale=baseSpeedScale*(1+(partyScale-1)*.06);
  return{id:index,type,x:spawnX,y:centerY,baseY:centerY,left:clamp(spawnX-patrol,0,activeWorldWidth-100),right:clamp(spawnX+patrol,0,activeWorldWidth-100),w:def.w,h:def.h,hp:baseHp,maxHp:baseHp,soloMaxHp,partyScale,baseSpeedScale,speedScale,dir:index%2?1:-1,phase:index*.81,hit:0,dead:false,boss,attack:0,cooldown:Math.max(.28,(.55+(index%4)*.27)/(boss?1:threat)/(1+(partyScale-1)*.08)),state:'patrol',stateTime:0,visible:true,invulnerable:false,attackCount:0,bossAttackIndex:0,vx:0,vy:0,turnCooldown:0,blockedDirection:0,blockedTime:0,slowTime:0};
}

function createWorld(){
  const level=levelData();
  bossArenaActive=false;shopSceneActive=false;arenaTransition=null;shopPurpose=null;shopWorldSnapshot=null;shopTransition=null;
  bossFountain=null;
  fountainRoomActive=false;fountainSnapshot=null;fountainEntrance=null;fountainClimb=null;fountainUseTime=0;
  activeWorldWidth=level.width;
  groundSegments=level.grounds.map(segment=>[...segment]);
  // The floating-island drawing reaches about 94px below its walkable edge.
  // Keep low islands high enough that the crouching drawing has a clear gap.
  floatingPlatforms=level.platforms.map(([x,surfaceY,w,type,motion])=>[x,Math.min(surfaceY,460),w,type,motion?{...motion}:null]);
  enemyTemplates=level.enemies.map(enemy=>[...enemy]);
  traps=[];
  platforms=groundSegments.map(([x,end],index)=>{
    const type=index%3===1?3:0;
    const surfaceY=type===3?654:659;
    const exitRunway=level.exit!=='down'&&index===groundSegments.length-1?250:0;
    return{x,y:GROUND_Y,w:end-x,h:190,type,ground:true,surfaceY,undersideY:VIEW_H+190,collisionLeft:x+14,collisionRight:end-14+exitRunway,sideLeft:x+14,sideRight:end-14+exitRunway,sideTopInset:0,landingTolerance:3,terrain:Number.isInteger(level.tileTheme?.ground)?level.tileTheme.ground:null};
  });
  platforms.push(...floatingPlatforms.map(([x,surfaceY,w,type,motion],index)=>({x,y:surfaceY-21,w,h:104,type,ground:false,surfaceY,undersideY:surfaceY+94,collisionLeft:x+5,collisionRight:x+w-5,sideLeft:x+8,sideRight:x+w-8,sideTopInset:3,landingTolerance:5,terrain:level.tileTheme?.platforms?.[index%level.tileTheme.platforms.length]??null,motion,baseX:x,baseSurfaceY:surfaceY,motionTime:motion?-(motion.phase||0)/(motion.speed||1):0})));
  const baseGaps=baseLevelGroundGaps(level);activeFountainGapIndex=chooseFountainGap(level,baseGaps);
  const gapLayout=baseGaps.map((gap,index)=>({...gap,fountain:index===activeFountainGapIndex})),fountainGap=gapLayout.find(gap=>gap.fountain);
  if(fountainGap){
    const openingW=Math.min(74,Math.max(58,fountainGap.w-28));
    fountainEntrance={x:(fountainGap.x+fountainGap.end)/2,w:openingW,gapX:fountainGap.x,gapEnd:fountainGap.end,level:currentLevel};
  }
  spikes=gapLayout.filter(gap=>!gap.drop).flatMap(gap=>{
    if(!gap.fountain||!fountainEntrance)return[{x:gap.x,y:VIEW_H-78,w:gap.w,h:78,gap:true}];
    // Every spike drawn across the secret fountain gap is a disguised entrance.
    // Keep the normal spike art, but make the whole group harmless so grazing an
    // edge cannot kill the player instead of opening the fountain room.
    return[{x:gap.x,y:VIEW_H-78,w:gap.w,h:78,gap:true,fountainPassage:true,harmless:true,damage:0,harmlessX:gap.x,harmlessW:gap.w}];
  });
  traps=[];
  props=(level.props||[[150,0,1],[level.width-190,0,1]]).map(([x,kind=0,scale=1])=>({x,kind,w:118*scale,h:150*scale}));
  enemies=enemyTemplates.map(([type,x,y],index)=>createEnemy(type,x,y,index));
  bullets=[];
  enemyShots=[];
  coinDrops=[];
  wallImpacts=[];
  defeatBursts=[];
  bossWaves=[];
  const bossIndex=LEVELS.slice(0,currentLevel+1).filter(entry=>entry.exit!=='down').length-1;
  stageBoss={enabled:level.exit!=='down',status:'waiting',enemy:null,type:level.exit==='down'?null:BOSS_TYPES[clamp(bossIndex,0,BOSS_TYPES.length-1)]};
  bossClearTimer=0;
  exitSpikes={time:-1,x:level.exit==='down'?level.goalX+57:0};
}

function createCustomWorld(){
  bossArenaActive=false;shopSceneActive=false;arenaTransition=null;shopPurpose=null;shopWorldSnapshot=null;shopTransition=null;bossWaves=[];
  bossFountain=null;
  fountainRoomActive=false;fountainSnapshot=null;fountainEntrance=null;fountainClimb=null;fountainUseTime=0;
  platforms=[];spikes=[];traps=[];enemies=[];props=[];
  for(const [index,item] of customMap.items.entries()){
    if(item.kind==='ground'){
      platforms.push({x:item.x,y:item.y-49,w:item.w,h:190,type:0,ground:true,surfaceY:item.y,undersideY:VIEW_H+190,collisionLeft:item.x+5,collisionRight:item.x+item.w-5,sideLeft:item.x+5,sideRight:item.x+item.w-5,sideTopInset:0,landingTolerance:4,custom:true});
    }else if(item.kind==='platform'){
      platforms.push({x:item.x-item.w/2,y:item.y-21,w:item.w,h:104,type:1,ground:false,surfaceY:item.y,undersideY:item.y+94,collisionLeft:item.x-item.w/2+5,collisionRight:item.x+item.w/2-5,sideLeft:item.x-item.w/2+8,sideRight:item.x+item.w/2-8,sideTopInset:3,landingTolerance:5,custom:true});
    }else if(item.kind==='ghost'||item.kind==='bat'){
      enemies.push(createEnemy(item.kind,item.x,item.kind==='bat'?item.y:undefined,enemies.length));
    }
  }
  bullets=[];enemyShots=[];coinDrops=[];wallImpacts=[];defeatBursts=[];stageBoss={enabled:false,status:'cleared',enemy:null,type:null};bossClearTimer=0;exitSpikes=null;
}

function groundSurfaceAt(x){
  if(customMapActive){
    const ground=(platforms||[]).find(platform=>platform.ground&&x>=platform.x&&x<=platform.x+platform.w);
    return ground?ground.surfaceY:GROUND_Y;
  }
  const ground=(platforms||[]).find(platform=>platform.ground&&x>=platform.collisionLeft&&x<=platform.collisionRight);
  return ground?ground.surfaceY:GROUND_Y;
}

function findClearEnemySpawn(def,desiredX,desiredY){
  const baseX=clamp(desiredX,80,activeWorldWidth-100),offsets=[0,80,-80,160,-160,240,-240,320,-320];
  if(def.airborne){
    for(const offset of offsets){
      const x=clamp(baseX+offset,80,activeWorldWidth-100);
      for(const yOffset of[0,-80,80,-150,150]){
        const y=clamp((desiredY||300)+yOffset,95,VIEW_H-160),box={x:x-def.w/2,y:y-def.h/2,w:def.w,h:def.h};
        if(!platforms?.some(platform=>overlap(box,{x:platform.collisionLeft,y:platform.surfaceY,w:platform.collisionRight-platform.collisionLeft,h:platform.undersideY-platform.surfaceY})))return{x,y};
      }
    }
    return{x:baseX,y:clamp(desiredY||220,90,360)};
  }
  for(const offset of offsets){
    const x=safeGroundX(baseX+offset),surface=groundSurfaceAt(x),box={x:x-def.w/2-6,y:surface-def.h,w:def.w+12,h:def.h};
    const blocked=platforms?.some(platform=>!platform.ground&&overlap(box,{x:platform.collisionLeft,y:platform.surfaceY,w:platform.collisionRight-platform.collisionLeft,h:platform.undersideY-platform.surfaceY}));
    if(!blocked)return{x,y:surface-def.h/2};
  }
  const x=safeGroundX(baseX);return{x,y:groundSurfaceAt(x)-def.h/2};
}

function resetPlayer(full=true){
  const startX=customMapActive?customMap.start.x:140;
  const startSurface=customMapActive?customMap.start.y:groundSurfaceAt(startX);
  const maxHp=1,maxMagic=selectedCharacter==='kid'?WIZARD_MAGIC.max:0,previousMagic=player?.characterId===selectedCharacter?player.magic:maxMagic;
  player={playerIndex:0,characterId:selectedCharacter,x:startX,y:startSurface-88,w:52,h:88,vx:0,vy:0,facing:1,onGround:true,coyote:.11,jumpBuffer:0,dashTime:0,dashCooldown:0,dashToken:0,shootCooldown:0,shootPoseTime:0,shotCount:0,hurtTime:0,hp:full?maxHp:Math.min(maxHp,Math.max(1,player?.hp||maxHp)),maxHp,maxMagic,magic:full?maxMagic:clamp(Number.isFinite(previousMagic)?previousMagic:maxMagic,0,maxMagic),magicRegenDelay:0,animationTime:0,idleTime:0,walkTime:0,moveIntent:0,stance:'stand',stanceVisual:0,rStance:'stand',itemBuffs:{},itemUseTime:0};
  cameraX=clamp(player.x-260,0,Math.max(0,activeWorldWidth-VIEW_W));
}

function createPartner(playerIndex=1,characterId=localCharacterSelections[playerIndex]||selectedCharacter){
  const x=clamp(player.x+68*playerIndex,0,activeWorldWidth-52);
  const maxHp=1,resolvedCharacter=CHARACTERS[characterId]?characterId:'kid',maxMagic=resolvedCharacter==='kid'?WIZARD_MAGIC.max:0;
  return{...player,playerIndex,characterId:resolvedCharacter,x,y:groundSurfaceAt(x)-88,w:52,h:88,vx:0,vy:0,facing:playerIndex%2?-1:1,onGround:true,coyote:.11,jumpBuffer:0,dashTime:0,dashCooldown:0,dashToken:0,shootCooldown:0,shootPoseTime:0,shotCount:0,hurtTime:0,hp:maxHp,maxHp,maxMagic,magic:maxMagic,magicRegenDelay:0,animationTime:0,idleTime:0,walkTime:0,moveIntent:0,stance:'stand',stanceVisual:0,rStance:'stand'};
}

function stopOnline(){
  if(onlineSyncTimer)clearInterval(onlineSyncTimer);
  onlineSyncTimer=0;onlineSyncBusy=false;onlineSession=null;remotePlayers=[];
}

function openOnlineMenu(){
  stopOnline();
  state='onlineLobby';hidePanels();$('onlinePanel').classList.add('visible');
  $('roomCodeDisplay').hidden=true;$('roomCodeDisplay').textContent='';
  $('onlineStatus').textContent='CREATE A ROOM OR ENTER A CODE';
  focusControllerButton($('createRoomButton'));
}

function drawCharacterPreviews(){
  for(const characterId of Object.keys(CHARACTERS))drawCharacterPreview($(`${characterId}CharacterPreview`),characterId);
  renderCharacterProfile();
}

function characterPreviewArt(characterId){
  if(characterId==='goat')return{image:assets.goatMove,cut:GOAT_MOVE_CUTS[0],columns:6,filter:'contrast(1.42)'};
  if(characterId==='knight')return{image:assets.knightMove,cut:KNIGHT_MOVE_CUTS[0],columns:6,filter:'contrast(1.45)'};
  if(characterId==='monk')return{image:assets.monkMove,cut:MONK_MOVE_CUTS[0],columns:4,filter:'contrast(1.44)'};
  return{image:assets.heroActions,cut:HERO_ACTION_CUTS[0],columns:6,filter:'contrast(1.48)'};
}

function drawCharacterPreview(preview,characterId,large=false){
  if(!preview)return;
  const {image,cut,columns,filter}=characterPreviewArt(characterId);if(!image.complete)return;
  const previewContext=preview.getContext('2d'),[sx,sy,sw,sh]=cut;
  previewContext.clearRect(0,0,preview.width,preview.height);previewContext.save();previewContext.filter=filter;
  const widthFit=preview.width*(large ? .88 : .9),heightFit=preview.height*(large ? .91 : .94);
  const scale=Math.min(widthFit/sw,heightFit/sh),cellCenter=image.naturalWidth/columns/2,anchorX=cellCenter-sx;
  previewContext.drawImage(image,sx,sy,sw,sh,preview.width/2-anchorX*scale,preview.height-sh*scale-(large?7:1),sw*scale,sh*scale);previewContext.restore();
}

function renderCharacterProfile(){
  const profile=CHARACTER_PROFILES[selectedCharacter]||CHARACTER_PROFILES.kid;
  $('characterName').textContent=profile.title;$('characterDescription').textContent=profile.description;$('characterQuote').textContent=profile.quote;
  $('characterStrength').textContent=profile.strength;$('characterWeakness').textContent=profile.weakness;
  $('characterFacts').innerHTML=[['CLASS',profile.className],['ROLE',profile.role],['WEAPON',profile.weapon],['OUTFIT',profile.outfit]].map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('');
  $('characterStats').innerHTML=profile.stats.map(([name,value])=>`<div class="detail-stat"><b>${name}</b><i style="width:${value*20}%" aria-label="${value} out of 5"></i></div>`).join('');
  $('characterAbilities').innerHTML=profile.abilities.map(([name,copy])=>`<div class="ability-row"><b>${name}</b><small>${copy}</small></div>`).join('');
  $('characterGear').innerHTML=profile.gear.map(item=>`<li>${item}</li>`).join('');
  drawCharacterPreview($('selectedCharacterPreview'),selectedCharacter,true);
}

function renderLocalCharacterStatus(){
  const container=$('localCharacterStatus');
  const isLocal=pendingMode==='local'&&state==='characterSelect';
  container.hidden=!isLocal;
  $('characterPanel').classList.toggle('local-multiplayer-select',isLocal);
  if(!isLocal){container.innerHTML='';$('characterHelp').textContent='MOVE TO CHOOSE · × / A SELECT · OPTIONS START';return;}
  const connectedCount=connectedGamepads().length;
  container.dataset.count=String(pendingPlayerCount);
  container.innerHTML=localCharacterSelections.slice(0,pendingPlayerCount).map((characterId,index)=>{
    const playerNumber=index+1,artNumber=index===0?'one':index===1?'two':'';
    const controller=artNumber?`<img class="local-controller-doodle" src="/play/sketchbound/assets/local-controller-${artNumber}-chatgpt.png" alt="">`:'';
    const label=artNumber?`<img class="local-player-label" src="/play/sketchbound/assets/local-player-${artNumber}-chatgpt.png" alt="Player ${playerNumber}">`:`<b class="local-text-label">PLAYER ${playerNumber}</b>`;
    const ready=localCharacterReady[index]&&artNumber?`<img class="local-ready-stamp" src="/play/sketchbound/assets/local-ready-${artNumber}-chatgpt.png" alt="Ready">`:localCharacterReady[index]?'<em>READY</em>':'';
    const missing=index>=connectedCount,caption=missing?`CONNECT PS5 CONTROLLER ${playerNumber}`:CHARACTERS[characterId].name;
    return `<button class="local-player-choice${localSelectionActivePlayer===index?' active':''}${localCharacterReady[index]?' ready':''}${missing?' waiting':''}" data-local-player="${index}" aria-label="Player ${playerNumber}: ${caption}${localCharacterReady[index]?', ready':''}">${controller}${label}<canvas class="local-character-preview" width="360" height="300" aria-hidden="true"></canvas><span>${caption}</span>${ready}</button>`;
  }).join('');
  container.querySelectorAll('[data-local-player]').forEach((button,index)=>{
    button.onclick=()=>setLocalSelectionPlayer(Number(button.dataset.localPlayer));
    drawCharacterPreview(button.querySelector('canvas'),localCharacterSelections[index],true);
  });
  const readyCount=localCharacterReady.slice(0,pendingPlayerCount).filter(Boolean).length;
  $('characterHelp').textContent=readyCount===pendingPlayerCount?'EVERYONE READY · OPTIONS TO START':'EACH CONTROLLER: MOVE · × / A READY · ○ / B CHANGE';
}

function refreshCharacterSelection(){
  for(const card of document.querySelectorAll('.character-card[data-character]')){
    const players=pendingMode==='local'&&state==='characterSelect'?localCharacterSelections.slice(0,pendingPlayerCount).map((id,index)=>id===card.dataset.character?`P${index+1}`:'').filter(Boolean):[];
    card.dataset.players=players.join(' · ');
    card.classList.toggle('selected',card.dataset.character===selectedCharacter);
    card.classList.toggle('local-picked',players.length>0);
  }
  renderCharacterProfile();
  renderLocalCharacterStatus();
}

function openCharacterMenu(mode='solo',playerCount=1){
  stopOnline();pendingMode=mode;pendingPlayerCount=playerCount;
  if(mode==='local'){
    const startIndex=Math.max(0,CHARACTER_IDS.indexOf(selectedCharacter));
    localCharacterSelections=Array.from({length:4},(_,index)=>CHARACTER_IDS[(startIndex+index)%CHARACTER_IDS.length]);
    localCharacterReady=[false,false,false,false];localSelectionActivePlayer=0;selectedCharacter=localCharacterSelections[0];
  }
  (mode==='local'?localCharacterSelections.slice(0,pendingPlayerCount):[selectedCharacter]).forEach(prepareCharacterArt);
  state='characterSelect';hidePanels();$('characterPanel').classList.add('visible');
  drawCharacterPreviews();refreshCharacterSelection();focusControllerButton($(`${selectedCharacter}CharacterButton`));
}

function setLocalSelectionPlayer(playerIndex){
  if(pendingMode!=='local')return;
  localSelectionActivePlayer=clamp(Math.round(playerIndex)||0,0,pendingPlayerCount-1);
  selectedCharacter=localCharacterSelections[localSelectionActivePlayer];
  refreshCharacterSelection();
}

function characterOwner(characterId,exceptPlayer=-1){
  return localCharacterSelections.slice(0,pendingPlayerCount).findIndex((id,index)=>index!==exceptPlayer&&id===characterId);
}

function nextAvailableCharacter(characterId,playerIndex,direction=1){
  const current=Math.max(0,CHARACTER_IDS.indexOf(characterId));
  for(let step=1;step<=CHARACTER_IDS.length;step++){
    const candidate=CHARACTER_IDS[(current+step*direction+CHARACTER_IDS.length*2)%CHARACTER_IDS.length];
    if(characterOwner(candidate,playerIndex)<0)return candidate;
  }
  return characterId;
}

function chooseCharacter(characterId,playerIndex=localSelectionActivePlayer){
  const choice=CHARACTERS[characterId]?characterId:'kid';
  prepareCharacterArt(choice);
  if(pendingMode==='local'&&state==='characterSelect'){
    localSelectionActivePlayer=clamp(Math.round(playerIndex)||0,0,pendingPlayerCount-1);
    const owner=characterOwner(choice,localSelectionActivePlayer);
    if(owner>=0){selectedCharacter=localCharacterSelections[localSelectionActivePlayer];refreshCharacterSelection();return false;}
    selectedCharacter=choice;
    localCharacterSelections[localSelectionActivePlayer]=choice;
    localCharacterReady[localSelectionActivePlayer]=false;
  }else selectedCharacter=choice;
  refreshCharacterSelection();focusControllerButton($('characterStartButton'));
  return true;
}

function readyLocalCharacter(playerIndex){
  if(pendingMode!=='local'||playerIndex<0||playerIndex>=pendingPlayerCount)return;
  if(characterOwner(localCharacterSelections[playerIndex],playerIndex)>=0)return;
  localCharacterReady[playerIndex]=true;localSelectionActivePlayer=playerIndex;selectedCharacter=localCharacterSelections[playerIndex];
  refreshCharacterSelection();
}

function confirmCharacter(force=false){
  if(pendingMode==='online')openOnlineMenu();
  else if(pendingMode==='local'&&!force&&!localCharacterReady.slice(0,pendingPlayerCount).every(Boolean))return;
  else startGame(pendingMode,pendingPlayerCount);
}

function openLocalMenu(){
  stopOnline();state='localLobby';hidePanels();$('localPanel').classList.add('visible');renderLocalControllerSlots();focusControllerButton($('twoPlayerButton'));
}

function backToMenu(){
  stopOnline();state='menu';setMusicScene('menu');hidePanels();$('menu').classList.add('visible');focusControllerButton($('startButton'));
}

function customMapSurfaceAt(x,y=GROUND_Y){
  const surfaces=customMap.items.filter(item=>(item.kind==='ground'&&x>=item.x&&x<=item.x+item.w)||(item.kind==='platform'&&Math.abs(x-item.x)<=item.w/2)).map(item=>item.y);
  return surfaces.length?surfaces.reduce((nearest,surface)=>Math.abs(surface-y)<Math.abs(nearest-y)?surface:nearest,surfaces[0]):659;
}

function selectMapTool(tool){
  mapTool=MAP_TOOLS.includes(tool)?tool:'ground';
  document.querySelectorAll('[data-map-tool]').forEach(button=>button.classList.toggle('selected-tool',button.dataset.mapTool===mapTool));
  const names={ground:'GROUND BLOCK',platform:'FLOATING PLATFORM',ghost:'GROUND GHOST',bat:'FLYING BAT',start:'PLAYER START',goal:'FINISH GATE',erase:'ERASER'};
  $('mapMakerHint').textContent=`${names[mapTool]} · CLICK OR PRESS × / A TO PLACE`;
  drawMapMaker();
}

function updateMapMakerCount(){
  const floorCount=customMap.items.filter(item=>item.kind==='ground'||item.kind==='platform').length;
  const enemyCount=customMap.items.filter(item=>item.kind==='ghost'||item.kind==='bat').length;
  $('mapMakerCount').textContent=`${floorCount} FLOOR${floorCount===1?'':'S'} · ${enemyCount} ENEM${enemyCount===1?'Y':'IES'}`;
}

function mapMakerViewX(){return mapMakerPage*VIEW_W;}

function setMapMakerPage(page){
  const oldView=mapMakerViewX(),localX=clamp(mapCursor.x-oldView,25,1255);
  mapMakerPage=clamp(Math.round(page),0,Math.ceil(MAP_WORLD_W/VIEW_W)-1);
  mapCursor.x=mapMakerViewX()+localX;
  $('mapMakerPage').textContent=`PAGE ${mapMakerPage+1} / ${MAP_WORLD_W/VIEW_W}`;
  $('mapMakerPrevButton').disabled=mapMakerPage===0;
  $('mapMakerNextButton').disabled=mapMakerPage===MAP_WORLD_W/VIEW_W-1;
  drawMapMaker();
}

function mapItemCenter(item){
  if(item.kind==='ground')return{x:item.x+item.w/2,y:item.y};
  return{x:item.x,y:item.y};
}

function placeMapObject(x=mapCursor.x,y=mapCursor.y,tool=mapTool){
  x=clamp(Math.round(x/40)*40,40,MAP_WORLD_W-40);y=clamp(Math.round(y/40)*40,80,680);
  mapCursor={x,y};
  if(tool==='erase'){
    let nearest=null,distance=Infinity;
    for(const item of customMap.items){
      const center=mapItemCenter(item),value=Math.hypot(center.x-x,(center.y-y)*1.3);
      if(value<distance){nearest=item;distance=value;}
    }
    if(nearest&&distance<115)customMap.items.splice(customMap.items.indexOf(nearest),1);
  }else if(tool==='start'||tool==='goal'){
    customMap[tool]={x,y:customMapSurfaceAt(x,y)};
  }else{
    const item=tool==='ground'?{kind:'ground',x:clamp(x-100,0,MAP_WORLD_W-200),y,w:200}:tool==='platform'?{kind:'platform',x,y,w:190}:tool==='ghost'?{kind:'ghost',x,y:customMapSurfaceAt(x,y)}:{kind:'bat',x,y};
    const center=mapItemCenter(item);
    customMap.items=customMap.items.filter(existing=>existing.kind!==item.kind||Math.hypot(mapItemCenter(existing).x-center.x,mapItemCenter(existing).y-center.y)>42);
    customMap.items.push(item);
  }
  updateMapMakerCount();drawMapMaker();
}

function drawMapMakerIcon(context,index,x,y,w,h,anchor='center',alpha=1){
  if(!assets.mapMaker.complete)return;
  const columns=4,rows=3,cellW=assets.mapMaker.naturalWidth/columns,cellH=assets.mapMaker.naturalHeight/rows;
  const sx=(index%columns)*cellW,sy=Math.floor(index/columns)*cellH;
  const top=anchor==='bottom'?y-h:anchor==='surface'?y-h*.32:y-h/2;
  context.save();context.globalAlpha=alpha;context.filter='contrast(1.22)';
  context.drawImage(assets.mapMaker,sx,sy,cellW,cellH,x-w/2,top,w,h);context.restore();
}

function drawMapMaker(){
  const editor=$('mapMakerCanvas');if(!editor)return;
  const viewX=mapMakerViewX();
  const c=editor.getContext('2d');c.clearRect(0,0,VIEW_W,VIEW_H);c.fillStyle='#eee9df';c.fillRect(0,0,VIEW_W,VIEW_H);
  if(assets.background.complete){c.save();c.globalAlpha=.16;c.drawImage(assets.background,-viewX*.08,0,VIEW_W*1.18,VIEW_H);c.restore();}
  c.save();c.strokeStyle='#77716822';c.lineWidth=1;
  for(let x=0;x<=VIEW_W;x+=40){c.beginPath();c.moveTo(x,0);c.lineTo(x,VIEW_H);c.stroke();}
  for(let y=0;y<=VIEW_H;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(VIEW_W,y);c.stroke();}
  c.restore();
  for(const item of customMap.items){
    const screenX=(item.kind==='ground'?item.x:item.x)-viewX;
    const itemWidth=item.kind==='ground'?item.w:item.kind==='platform'?item.w:180;
    if(screenX>VIEW_W+itemWidth||screenX+itemWidth< -itemWidth)continue;
    if(item.kind==='ground'){
      c.save();c.beginPath();c.rect(screenX,item.y-48,item.w,138);c.clip();
      const first=Math.max(item.x,viewX-220);
      for(let x=first;x<Math.min(item.x+item.w,viewX+VIEW_W+220);x+=188)drawMapMakerIcon(c,0,x-viewX+100,item.y,216,126,'surface');
      c.restore();
    }else if(item.kind==='platform'){
      drawMapMakerIcon(c,1,screenX,item.y,item.w+20,112,'surface');
    }else if(item.kind==='ghost'){
      drawMapMakerIcon(c,3,screenX,item.y,82,92,'bottom');
    }else if(item.kind==='bat'){
      drawMapMakerIcon(c,4,screenX,item.y,104,84);
    }
  }
  drawMapMakerIcon(c,5,customMap.start.x-viewX,customMap.start.y,92,112,'bottom');
  drawMapMakerIcon(c,6,customMap.goal.x-viewX,customMap.goal.y,112,142,'bottom');
  c.save();c.fillStyle='#383530';c.font='900 14px "Sketchbound Hand", sans-serif';c.textAlign='center';
  c.fillText('START',customMap.start.x-viewX,customMap.start.y+18);c.fillText('FINISH',customMap.goal.x-viewX,customMap.goal.y+18);c.restore();
  drawMapMakerIcon(c,mapTool==='erase'?7:8,mapCursor.x-viewX,mapCursor.y,mapTool==='erase'?72:82,mapTool==='erase'?62:82,'center',.92);
}

function openMapMaker(){
  stopOnline();customMapActive=false;activeWorldWidth=WORLD_W;state='mapMaker';hidePanels();$('mapMakerPanel').classList.add('visible');
  document.documentElement.style.setProperty('--map-maker-tool-art','url("/play/sketchbound/assets/map-maker-atlas-chatgpt.webp")');
  ensureImage(assets.mapMaker).then(drawMapMaker);
  mapMakerPage=clamp(Math.floor(mapCursor.x/VIEW_W),0,2);selectMapTool(mapTool);setMapMakerPage(mapMakerPage);updateMapMakerCount();$('mapMakerCanvas').focus({preventScroll:true});
}

function clearCustomMap(){customMap=createBlankCustomMap();mapCursor={x:640,y:360};mapMakerPage=0;setMapMakerPage(0);updateMapMakerCount();}

function playCustomMap(){
  if(!customMap.items.some(item=>item.kind==='ground'||item.kind==='platform')){$('mapMakerHint').textContent='DRAW SOME GROUND FIRST';return;}
  openCharacterMenu('mapMaker',1);
}

async function postOnline(path,data={}){
  const response=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});
  const result=await response.json().catch(()=>({ok:false,error:'CONNECTION FAILED'}));
  if(!response.ok||!result.ok)throw new Error(result.error||'CONNECTION FAILED');
  return result;
}

function beginOnlineSync(){
  if(onlineSyncTimer)clearInterval(onlineSyncTimer);
  onlineSyncTimer=setInterval(syncOnline,50);syncOnline();
}

function onlinePlayerState(){
  if(state!=='playing'||!player)return null;
  const fields=['characterId','x','y','w','h','vx','vy','facing','onGround','hp','maxHp','magic','maxMagic','animationTime','idleTime','walkTime','moveIntent','stance','stanceVisual','hurtTime','dashTime','shootPoseTime','shotCount'];
  const snapshot={};for(const field of fields)snapshot[field]=player[field];
  snapshot.levelIndex=currentLevel;
  snapshot.deadEnemies=enemies.filter(enemy=>enemy.dead).map(enemy=>enemy.id);
  return snapshot;
}

function normalizeRemote(value){
  if(!value||typeof value!=='object')return null;
  const characterId=CHARACTERS[value.characterId]?value.characterId:'kid';
  const maxHp=1,maxMagic=characterId==='kid'?WIZARD_MAGIC.max:0;
  const base={...player,characterId,x:0,y:0,vx:0,vy:0,facing:1,onGround:false,hp:maxHp,maxHp,magic:maxMagic,maxMagic,animationTime:0,idleTime:0,walkTime:0,moveIntent:0,stance:'stand',stanceVisual:0,hurtTime:0,dashTime:0,shootPoseTime:0,shotCount:0};
  for(const field of ['x','y','w','h','vx','vy','magic','animationTime','idleTime','walkTime','stanceVisual','hurtTime','dashTime','shootPoseTime','shotCount'])if(Number.isFinite(Number(value[field])))base[field]=Number(value[field]);
  base.x=clamp(base.x,0,activeWorldWidth-34);base.y=clamp(base.y,-300,VIEW_H+300);
  base.w=clamp(base.w,34,100);base.h=clamp(base.h,28,100);base.facing=value.facing<0?-1:1;
  base.onGround=!!value.onGround;base.hp=clamp(Number(value.hp)||1,0,maxHp);base.magic=clamp(base.magic,0,maxMagic);
  base.moveIntent=clamp(Number(value.moveIntent)||0,-1,1);base.stance=['stand','duck'].includes(value.stance)?value.stance:'stand';
  [base.w,base.h]=STANCE_SIZES[base.stance];
  return base;
}

async function syncOnline(){
  if(!onlineSession||onlineSyncBusy)return;
  onlineSyncBusy=true;
  try{
    const result=await postOnline('/api/online/state',{code:onlineSession.code,playerId:onlineSession.playerId,state:onlinePlayerState()});
    onlineSession.count=result.count;
    const peerStates=result.peers.map(peer=>peer.state).filter(Boolean);
    const sharedLevel=Math.max(currentLevel,...peerStates.map(peer=>clamp(Math.round(peer.levelIndex)||0,0,LEVELS.length-1)));
    if(state==='playing'&&!customMapActive&&sharedLevel>currentLevel)loadLevel(sharedLevel,true);
    remotePlayers=peerStates.map(normalizeRemote).filter(Boolean);rescaleEnemiesForParty();
    for(const peer of peerStates)for(const id of Array.isArray(peer.deadEnemies)?peer.deadEnemies:[]){const enemy=enemies.find(entry=>entry.id===id);if(enemy)enemy.dead=true;}
    if(state==='onlineLobby'){
      $('onlineStatus').textContent=result.count>=2?'FRIEND JOINED · STARTING…':'WAITING FOR A FRIEND…';
      if(result.count>=2)startGame('online');
    }
  }catch(error){
    if(state==='onlineLobby')$('onlineStatus').textContent=error.message;
  }finally{onlineSyncBusy=false;}
}

async function createOnlineRoom(){
  $('onlineStatus').textContent='MAKING A ROOM…';
  try{
    stopOnline();const result=await postOnline('/api/online/create');
    onlineSession={code:result.code,playerId:result.playerId,count:1};
    $('roomCodeDisplay').textContent=`ROOM ${result.code}`;$('roomCodeDisplay').hidden=false;
    $('onlineStatus').textContent='WAITING FOR A FRIEND…';beginOnlineSync();
  }catch(error){$('onlineStatus').textContent=error.message;}
}

async function joinOnlineRoom(){
  const code=$('roomCodeInput').value.replace(/[^A-Z0-9]/g,'').toUpperCase();
  if(code.length!==5){$('onlineStatus').textContent='ENTER THE FIVE-LETTER CODE';return;}
  $('onlineStatus').textContent='JOINING ROOM…';
  try{
    stopOnline();const result=await postOnline('/api/online/join',{code});
    onlineSession={code:result.code,playerId:result.playerId,count:result.count};
    startGame('online');beginOnlineSync();
  }catch(error){$('onlineStatus').textContent=error.message;}
}

function captureCombatCheckpoint(kind=bossArenaActive?'boss':'stage'){
  combatCheckpoint={
    kind,level:currentLevel,
    equippedShopItems:{...equippedShopItems},
    equippedClassWeapons:{...equippedClassWeapons},
    weaponConditions:JSON.parse(JSON.stringify(weaponConditions)),
    actors:[player,...partners].filter(Boolean).map(actor=>({playerIndex:actor.playerIndex,characterId:actor.characterId,maxMagic:actor.maxMagic,magic:actor.magic}))
  };
  return combatCheckpoint;
}

function restoreCombatCheckpoint(kind=bossArenaActive?'boss':'stage'){
  const saved=combatCheckpoint;
  if(!saved||saved.kind!==kind||saved.level!==currentLevel)return false;
  equippedShopItems={weapon:null,accessory:null,...saved.equippedShopItems};
  equippedClassWeapons={kid:null,goat:null,knight:null,monk:null,...saved.equippedClassWeapons};
  weaponConditions=JSON.parse(JSON.stringify(saved.weaponConditions));
  for(const actor of[player,...partners].filter(Boolean)){
    const entry=saved.actors.find(candidate=>candidate.playerIndex===actor.playerIndex&&candidate.characterId===actor.characterId);
    if(!entry)continue;
    actor.maxMagic=entry.maxMagic;
    actor.magic=clamp(Number.isFinite(entry.magic)?entry.magic:entry.maxMagic,0,entry.maxMagic||0);
  }
  return true;
}

function startGame(mode=gameMode,playerCount=localPlayerCount){
  if(mode!=='online')stopOnline();
  gameMode=mode;
  customMapActive=mode==='mapMaker';
  currentLevel=0;
  activeWorldWidth=customMapActive?(customMap.width||MAP_WORLD_W):levelData().width;
  localPlayerCount=mode==='local'?clamp(Math.round(playerCount)||2,2,4):1;
  if(mode==='local')selectedCharacter=localCharacterSelections[0]||'kid';
  (mode==='local'?localCharacterSelections.slice(0,localPlayerCount):[selectedCharacter]).forEach(prepareCharacterArt);
  score=0;coins=0;runUpgrades={speed:0,power:0,jump:0,magnet:0};purchasedShopItems=new Set();equippedShopItems={weapon:null,accessory:null};equippedClassWeapons={kid:null,goat:null,knight:null,monk:null};weaponConditions={};usableShopItems=[];usedShopItems=new Set();levelTransition=null;arenaTransition=null;bossArenaActive=false;shopSceneActive=false;shopPurpose=null;shopWorldSnapshot=null;shopTransition=null;bossWaves=[];defeatedActor=null;combatCheckpoint=null;multiplayerPortraitSignature='';
  if(customMapActive)createCustomWorld();else createWorld();
  resetPlayer(true);
  partners=mode==='local'?Array.from({length:localPlayerCount-1},(_,index)=>createPartner(index+1,localCharacterSelections[index+1])):[];
  partner=partners[0]||null;
  remotePlayers=[];
  captureCombatCheckpoint('stage');
  state='playing';setMusicScene('level');globalThis.gameSound?.setPaused(false);playSound('transition');
  hidePanels();
  updateHud();
}

function restartCheckpoint(){
  const restartBoss=!!(bossArenaActive&&stageBoss?.type),bossType=restartBoss?stageBoss.type:null;
  if(restartBoss)setupBossArena();
  else if(customMapActive)createCustomWorld();
  else createWorld();
  resetPlayer(true);
  if(gameMode==='local'){
    partners=Array.from({length:localPlayerCount-1},(_,index)=>createPartner(index+1,localCharacterSelections[index+1]));
    partner=partners[0]||null;
  }
  const actors=[player,...partners];
  actors.forEach(readyActorForCombat);
  restoreCombatCheckpoint(restartBoss?'boss':'stage');
  if(restartBoss){
    actors.forEach((actor,index)=>{actor.x=185+index*76;actor.y=groundSurfaceAt(actor.x)-actor.h;actor.vx=0;actor.vy=0;actor.facing=1;actor.onGround=true;actor.moveIntent=0;});
    const def=ENEMY_DEFS[bossType],boss=createEnemy(bossType,1005,def.airborne?285:undefined,0);
    boss.baseY=def.airborne?285:boss.y;boss.left=80;boss.right=activeWorldWidth-90;boss.state='patrol';boss.stateTime=0;boss.cooldown=.55;boss.slowTime=4;boss.invulnerable=false;boss.visible=true;boss.dir=-1;
    enemies=[boss];stageBoss={enabled:true,status:'active',enemy:boss,type:bossType};bossClearTimer=0;
  }
  defeatedActor=null;levelTransition=null;arenaTransition=null;cameraX=0;state='playing';
  hidePanels();setMusicScene(restartBoss?'boss':'level');globalThis.gameSound?.setPaused(false);playSound('transition');updateHud();updateBossHud();
}

function loadLevel(index,preserveHealth=true){
  if(customMapActive)return false;
  currentLevel=clamp(Math.round(index)||0,0,LEVELS.length-1);
  createWorld();
  resetPlayer(!preserveHealth);
  if(gameMode==='local'){
    partners=Array.from({length:localPlayerCount-1},(_,partnerIndex)=>createPartner(partnerIndex+1,localCharacterSelections[partnerIndex+1]));
    partner=partners[0]||null;
  }
  [player,...partners].forEach(readyActorForCombat);
  captureCombatCheckpoint('stage');
  remotePlayers=[];defeatedActor=null;cameraX=0;state='playing';setMusicScene('level');updateHud();
  return true;
}

function advanceLevel(target=currentLevel+1){
  if(customMapActive||target>=LEVELS.length){finish(true);return false;}
  score+=500*(currentLevel+1);
  return loadLevel(target,true);
}

const SHOP_UPGRADE_EFFECTS={power:'POWER · +1',speed:'MOVE · +10%',jump:'JUMP · +10%',magnet:'COINS · +1 EACH',repair:'REPAIR / REFILL'};
const shopTierPrices=(minimum,maximum)=>Array.from({length:20},(_,index)=>Math.max(minimum,Math.round(minimum*Math.pow(maximum/minimum,index/19)/5)*5));
const shopItemQuality=column=>column===19?'MYTHIC':column>=15?'LEGENDARY':column>=10?'HEROIC':column>=5?'STURDY':'ROUGH';
const SHOP_CLASS_IDS=['kid','goat','knight','monk'];
const SHOP_CATEGORIES=[
  {id:'weapons',label:'CLASS WEAPONS',catalogRow:0,upgrade:['power'],prices:[20,60,140,300,700,20,65,150,340,800,20,55,130,290,720,15,50,120,280,680],names:['ASH STAFF','MOON STAFF','THORN STAFF','FIRE STAFF','DRAGON STAFF','PATCHED HAND CANNON','TWIN BLASTER','SCATTER GUN','RAPID MINIGUN','DRAGON CANNON','SHORT SWORD','PENCIL SPEAR','LONG SWORD','BATTLE AXE','ROYAL BLADE','TRAINING WRAPS','PRAYER BEADS','IRON KNUCKLES','WIND GAUNTLETS','DRAGON FISTS']},
  {id:'supplies',label:'AMMO / REPAIRS',catalogRow:null,upgrade:['repair'],prices:[10,15,10,10],names:['STAFF REPAIR KIT','GUN AMMO & PARTS','BLADE REPAIR KIT','HAND-GEAR REPAIR KIT']},
  {id:'accessories',label:'ACCESSORIES',catalogRow:2,upgrade:['magnet','speed','jump','power'],prices:shopTierPrices(12,600),names:['IRON RING','MOON PENDANT','POINT PENDANT','PLAIN RING','THICK RING','FEATHER CHARM','LEAF CHARM','WRIST BAND','SKULL CHARM','SUN EMBLEM','HEART RING','HEART PENDANT','TWIN RING','STONE BAND','COIN RING','TASSEL CHARM','HOURGLASS','MOON BROOCH','HOOK RING','SUN RING']},
  {id:'consumables',label:'CONSUMABLES',catalogRow:3,upgrade:['speed','jump','power','magnet'],prices:shopTierPrices(6,300),names:['SMALL POTION','ROUND POTION','QUICK TONIC','TALL POTION','CHARM FLASK','CLEAR POTION','PLUM','HERB','BREAD','STEAK','PIE','CHEESE','APPLE',null,'CORN','LOAF','DUMPLING','JAM JAR','GARLIC','LEAF TEA']},
  {id:'scrolls',label:'BUFFS / SCROLLS',catalogRow:4,upgrade:['power','speed','jump','magnet'],prices:shopTierPrices(10,500),names:['POWER SCROLL','WIND SCROLL','DASH SCROLL','FOCUS SCROLL','SUN SCROLL','FROST SCROLL','FIRE SCROLL','LIGHTNING SCROLL','HASTE SCROLL','SKULL SCROLL','CLOVER SCROLL','TIME SCROLL','MOON SCROLL','JUMP SCROLL','STAR SCROLL','SPEED SCROLL','MIGHT SCROLL','ARROW SCROLL','SIGHT SCROLL','LIGHT SCROLL']},
  {id:'materials',label:'MATERIALS / MISC',catalogRow:5,upgrade:['magnet','power','speed','jump'],prices:shopTierPrices(8,550),names:['ORE','METAL BAR','LOG','CLOTH ROLL','CRYSTAL SHARD','HERB BUNDLE','ROPE','GEAR','BONE','HIDE','FEATHER','PEARL','BOTTLE','CHEST','KEY','MAP','COIN SACK','BOOK','STAR STONE','DARK CRYSTAL']}
];
const SHOP_CATALOG_CUT={
  columns:[204,279,351,421,495,569,643,714,780,850,926,994,1065,1137,1208,1279,1350,1430,1504,1578,1654],
  rows:[410,496,582,668,755,844,926],
  label:{x:14,w:188},
  bleed:2
};
const SHOP_WEAPON_PROFILES=[
  {classId:'kid',kind:'ranged',resource:'magic',style:'ASH BOLT',motion:'cast',projectile:'fire',projectileArtIndex:0,damage:3,magicCost:45,cooldown:.26,speed:800,size:42,maxProjectiles:3,maxDurability:60,artSize:70},
  {classId:'kid',kind:'ranged',resource:'magic',style:'MOON BOLT',motion:'cast',projectile:'swirl',projectileArtIndex:1,damage:4,magicCost:55,cooldown:.34,speed:850,size:46,maxProjectiles:3,maxDurability:75,artSize:74},
  {classId:'kid',kind:'ranged',resource:'magic',style:'THORN BURST',motion:'cast',projectile:'thorn',projectileArtIndex:2,damage:4,magicCost:65,cooldown:.42,speed:770,size:42,count:2,spread:.13,maxProjectiles:4,maxDurability:90,artSize:76},
  {classId:'kid',kind:'ranged',resource:'magic',style:'FIRE VOLLEY',motion:'cast',projectile:'fire',projectileArtIndex:3,damage:7,magicCost:80,cooldown:.38,speed:920,size:50,pierce:1,maxProjectiles:4,maxDurability:115,artSize:80},
  {classId:'kid',kind:'ranged',resource:'magic',style:'DRAGON FLAME',motion:'cast',projectile:'fire',projectileArtIndex:4,damage:5,magicCost:100,cooldown:.48,speed:980,size:58,count:2,spread:.09,pierce:2,maxProjectiles:5,maxDurability:150,artSize:86},
  {classId:'goat',kind:'ranged',resource:'ammo',style:'HAND CANNON',motion:'shoot',projectile:'ink',projectileArtIndex:5,damage:1,cooldown:.24,speed:880,size:34,maxAmmo:45,maxDurability:65,artSize:68},
  {classId:'goat',kind:'ranged',resource:'ammo',style:'TWIN SHOT',motion:'shoot',projectile:'ink',projectileArtIndex:6,damage:1,cooldown:.3,speed:920,size:32,count:2,spread:.09,maxAmmo:60,maxDurability:75,artSize:72},
  {classId:'goat',kind:'ranged',resource:'ammo',style:'SCATTER BLAST',motion:'shoot',projectile:'ink',projectileArtIndex:7,damage:1,cooldown:.48,speed:780,size:30,count:5,spread:.12,maxAmmo:40,maxDurability:90,artSize:78},
  {classId:'goat',kind:'ranged',resource:'ammo',style:'RAPID STREAM',motion:'shoot',projectile:'ink',projectileArtIndex:8,damage:2,cooldown:.1,speed:980,size:30,maxAmmo:140,maxDurability:120,artSize:84},
  {classId:'goat',kind:'ranged',resource:'ammo',style:'DRAGON SHELL',motion:'shoot',projectile:'fire',projectileArtIndex:9,damage:7,cooldown:.7,speed:760,size:58,pierce:2,maxAmmo:28,maxDurability:150,artSize:88},
  {classId:'knight',kind:'melee',style:'QUICK SLASH',motion:'slash',damage:2,cooldown:.34,reach:118,knockback:28,maxDurability:70,artSize:68},
  {classId:'knight',kind:'melee',style:'LONG THRUST',motion:'thrust',damage:3,cooldown:.42,reach:172,knockback:34,maxDurability:80,artSize:76},
  {classId:'knight',kind:'melee',style:'WIDE SLASH',motion:'sweep',damage:4,cooldown:.52,reach:148,knockback:44,maxDurability:100,artSize:82},
  {classId:'knight',kind:'melee',style:'HEAVY CHOP',motion:'chop',damage:6,cooldown:.7,reach:136,knockback:76,maxDurability:125,artSize:88},
  {classId:'knight',kind:'melee',style:'ROYAL SLASH',motion:'double',damage:9,cooldown:.55,reach:164,knockback:64,maxDurability:160,artSize:92},
  {classId:'monk',kind:'melee',style:'WRAPPED PALM',motion:'slash',damage:2,cooldown:.34,reach:108,knockback:46,maxDurability:65,artSize:62},
  {classId:'monk',kind:'melee',style:'BEAD SWEEP',motion:'flail',damage:3,cooldown:.42,reach:142,knockback:58,maxDurability:75,artSize:68},
  {classId:'monk',kind:'melee',style:'IRON PUNCH',motion:'stab',damage:4,cooldown:.4,reach:116,knockback:82,maxDurability:95,artSize:70},
  {classId:'monk',kind:'melee',style:'WIND COMBO',motion:'double',damage:6,cooldown:.3,reach:132,knockback:66,maxDurability:120,artSize:76},
  {classId:'monk',kind:'melee',style:'DRAGON FIST',motion:'smash',damage:9,cooldown:.58,reach:144,knockback:108,maxDurability:155,artSize:82}
];

function itemBonusDescription(bonuses={}){
  return Object.entries(bonuses).map(([key,value])=>`${key.toUpperCase()} +${Math.round(value*100)}%`).join(' · ');
}

function shopItemMechanic(category,row,col,upgrade){
  if(category.id==='weapons'){
    const weaponProfile={...SHOP_WEAPON_PROFILES[col]};
    return{action:'equip',slot:'weapon',classId:weaponProfile.classId,weaponProfile,effect:`${CHARACTERS[weaponProfile.classId].name} · ${weaponProfile.style} · ${weaponProfile.damage} POWER`};
  }
  if(category.id==='supplies')return{action:'supply',classId:SHOP_CLASS_IDS[col],effect:`${CHARACTERS[SHOP_CLASS_IDS[col]].name} · REPAIR${SHOP_CLASS_IDS[col]==='goat'?' + FULL AMMO':''}`};
  if(category.id==='accessories'){
    const key=['magnet','speed','jump','power'][col%4],bonuses={[key]:key==='magnet'?1+Math.round(col*.58):.04+col*.02};
    const text=key==='magnet'?`COIN PULL +${bonuses[key]}`:itemBonusDescription(bonuses);
    return{action:'equip',slot:'accessory',bonuses,effect:`PASSIVE BONUS · ${text}`};
  }
  if(category.id==='consumables'){
    const amount=1+Math.floor(col/3),duration=18+Math.floor(col/4)*5;
    return{action:'use',amount,duration,effect:`QUICK ITEM · ${SHOP_UPGRADE_EFFECTS[upgrade].split(' · ')[0]} BOOST · ${duration} SEC`};
  }
  if(category.id==='scrolls'){
    const amount=2+Math.floor(col*.45),duration=25+Math.floor(col/4)*8;
    return{action:'use',amount,duration,effect:`BATTLE SCROLL · ${SHOP_UPGRADE_EFFECTS[upgrade].split(' · ')[0]} BOOST · ${duration} SEC`};
  }
  const amount=col+1;
  return{action:'craft',amount,effect:`PERMANENT RUN UPGRADE · ${SHOP_UPGRADE_EFFECTS[upgrade].split(' · ')[0]} +${amount}`};
}

const SHOP_ITEMS=Object.fromEntries(SHOP_CATEGORIES.flatMap((category,row)=>category.names.flatMap((name,col)=>{
  if(!name)return[];
  const upgrade=category.upgrade[col%category.upgrade.length],id=`${category.id}_${col}`;
  const quality=category.id==='weapons'?['ROUGH','STURDY','HEROIC','LEGENDARY','MYTHIC'][col%5]:category.id==='supplies'?'SUPPLY':shopItemQuality(col);
  return[[id,{id,name,quality,category:category.label,categoryId:category.id,price:category.prices[col],upgrade,type:SHOP_UPGRADE_EFFECTS[upgrade].split(' · ')[0],row,col,...shopItemMechanic(category,row,col,upgrade)}]];
})));
const SHOP_ITEM_LIST=Object.values(SHOP_ITEMS);
function shopItemAssetPath(item){return ['weapons','supplies'].includes(item.categoryId)?null:`/play/sketchbound/assets/shop-items/${item.categoryId}/${String(item.col).padStart(2,'0')}.png`;}
const shopItemImages=Object.fromEntries(SHOP_ITEM_LIST.filter(item=>shopItemAssetPath(item)).map(item=>[item.id,imageAsset(shopItemAssetPath(item),true)]));
function shopCategoryImages(categoryId){
  if(categoryId==='weapons')return[assets.classWeapons,assets.classProjectiles];
  if(categoryId==='supplies')return[assets.shopSupplies];
  return SHOP_ITEM_LIST.filter(item=>item.categoryId===categoryId).map(item=>shopItemImages[item.id]).filter(Boolean);
}
function prepareShopArt(categoryId=SHOP_CATEGORIES[shopCategoryIndex]?.id||'weapons'){
  return ensureImages([assets.shopCatalog,...shopCategoryImages(categoryId)],()=>{
    drawShopCatalogSprites();
    if(shopSceneActive)draw();
  });
}
function prepareBossArt(type=stageBoss?.type){
  const images=[assets.bossArena,assets.bossEffects,assets.bossArt,assets.magicFountain,assets.magicFountainDry,assets[`${type}Actions`]];
  if(type==='bossOgre')images.push(assets.bossOgrePatrol,assets.bossOgreThrow,assets.bossOgreJump,assets.bossOgreSmash,assets.bossOgreRecover);
  return ensureImages(images,()=>{if(bossArenaActive)draw();});
}
const BOSS_NAMES={bossOgre:'THE PENCIL OGRE',bossGhost:'THE CROWNED SCRIBBLE',bossSerpent:'THE PAPER SERPENT',bossBeetle:'THE INK BEETLE',bossChest:'THE ANGRY TREASURE',bossWarden:'THE BROKEN WARDEN',bossCrow:'THE QUILL CROW',bossWeaver:'THE INK WEAVER'};

function equippedShopItem(slot,actor=player){
  if(slot==='weapon')return SHOP_ITEMS[equippedClassWeapons[actor?.characterId]]||null;
  return SHOP_ITEMS[equippedShopItems[slot]]||null;
}
function currentWeaponId(actor=player){return equippedClassWeapons[actor?.characterId]||`base_${actor?.characterId||'kid'}`;}
function weaponDefinition(actor=player){return equippedShopItem('weapon',actor)?.weaponProfile||CHARACTERS[actor?.characterId]||CHARACTERS.kid;}
function weaponConditionFor(actor=player){
  const profile=weaponDefinition(actor);if(!profile.maxDurability)return null;
  const id=currentWeaponId(actor),existing=weaponConditions[id];
  if(existing)return existing;
  return weaponConditions[id]={durability:profile.maxDurability,maxDurability:profile.maxDurability,ammo:profile.maxAmmo??null,maxAmmo:profile.maxAmmo??null};
}
function classWeaponNeedsSupply(classId){
  const actor=shopPartyActors().find(entry=>entry.characterId===classId)||{characterId:classId};
  const condition=weaponConditionFor(actor);if(!condition)return false;
  return condition.durability<condition.maxDurability||(condition.maxAmmo!==null&&condition.ammo<condition.maxAmmo);
}
function repairClassWeapon(classId){
  const actor=shopPartyActors().find(entry=>entry.characterId===classId)||{characterId:classId};
  const condition=weaponConditionFor(actor);if(!condition)return false;
  condition.durability=condition.maxDurability;if(condition.maxAmmo!==null)condition.ammo=condition.maxAmmo;
  updateLoadoutHud();return true;
}
function addItemBonuses(...groups){
  return groups.filter(Boolean).reduce((total,group)=>{for(const [key,value] of Object.entries(group))total[key]=(total[key]||0)+value;return total;},{});
}
function activeItemBuff(actor,key){return actor?.itemBuffs?.[key]?.time>0?actor.itemBuffs[key].amount:0;}
function updateItemBuffs(actor,dt){
  if(!actor?.itemBuffs)return;
  for(const buff of Object.values(actor.itemBuffs))buff.time=Math.max(0,buff.time-dt);
}
function equipShopItem(id){
  const item=SHOP_ITEMS[id];if(!item||item.action!=='equip'||!purchasedShopItems.has(id))return false;
  if(item.slot==='weapon'){equippedClassWeapons[item.classId]=id;if(player?.characterId===item.classId)equippedShopItems.weapon=id;weaponConditionFor({characterId:item.classId});}
  else equippedShopItems[item.slot]=id;
  for(const actor of[player,...partners].filter(Boolean))actor.shootCooldown=0;
  renderShopParty();updateLoadoutHud();return true;
}
function cycleOwnedWeapon(direction=1,actor=player){
  const owned=SHOP_ITEM_LIST.filter(item=>item.slot==='weapon'&&item.classId===actor?.characterId&&purchasedShopItems.has(item.id));
  if(!owned.length)return false;
  const current=owned.findIndex(item=>item.id===equippedClassWeapons[actor.characterId]),next=owned[(current+direction+owned.length)%owned.length];
  equipShopItem(next.id);return next.id;
}
function useShopItem(id,actor=player){
  const item=SHOP_ITEMS[id],queueIndex=usableShopItems.indexOf(id);
  if(!item||item.action!=='use'||queueIndex<0||!actor)return false;
  usableShopItems.splice(queueIndex,1);usedShopItems.add(id);
  actor.itemBuffs??={};
  const amount=item.upgrade==='power'?item.amount:item.upgrade==='magnet'?item.amount*3:item.amount*.15;
  const current=actor.itemBuffs[item.upgrade]||{time:0,amount:0};
  actor.itemBuffs[item.upgrade]={time:Math.max(current.time,item.duration),amount:Math.max(current.amount,amount)};
  actor.itemUseName=item.name;actor.itemUseId=item.id;actor.itemUseTime=1.2;playSound('magic');updateLoadoutHud();updateHud();return true;
}
function useNextShopItem(actor=player){return usableShopItems.length?useShopItem(usableShopItems[0],actor):false;}
function applyShopPurchase(item){
  if(item.action==='equip')return equipShopItem(item.id);
  if(item.action==='supply')return repairClassWeapon(item.classId);
  if(item.action==='use'){usableShopItems.push(item.id);updateLoadoutHud();return true;}
  if(item.action==='craft'){runUpgrades[item.upgrade]+=item.amount;updateLoadoutHud();return true;}
  return false;
}

function bossTriggerX(){
  const level=levelData();return level.exit==='down'?level.goalX-470:level.width-560;
}

function drawBossPreview(type=stageBoss?.type){
  const preview=$('bossPreview'),context=preview?.getContext('2d'),def=ENEMY_DEFS[type];
  if(!context||!def)return;
  const actionPreview=!Number.isInteger(def.bossSprite),image=actionPreview?bossActionAsset(type):assets.bossArt;
  if(!image.complete||!image.naturalWidth){ensureImage(image).then(()=>drawBossPreview(type));return;}
  const [sx,sy,sw,sh]=actionPreview?BOSS_ACTION_CUTS[type][0]:BOSS_CUTS[def.bossSprite];
  context.clearRect(0,0,preview.width,preview.height);context.save();context.filter='contrast(1.28)';
  const scale=Math.min(290/sw,205/sh),w=sw*scale,h=sh*scale;
  context.drawImage(image,sx,sy,sw,sh,(preview.width-w)/2,preview.height-h,w,h);context.restore();
}

function beginBossEncounter(){
  if(customMapActive||stageBoss?.status!=='entering'||!stageBoss.enemy)return false;
  stageBoss.status='intro';state='cutscene';hidePanels();
  $('bossCutsceneTitle').textContent=BOSS_NAMES[stageBoss.type]||'A GIANT DOODLE';
  $('bossCutsceneCopy').textContent=`The empty arena goes quiet. Then ${BOSS_NAMES[stageBoss.type]} lands in front of you. How will you start the fight?`;
  $('bossCutscenePanel').classList.add('visible');drawBossPreview();focusControllerButton($('bossPlanButton'));return true;
}

function startBossFight(choice='plan'){
  if(stageBoss?.status!=='intro'||!stageBoss.enemy)return false;
  hidePanels();state='playing';
  const boss=stageBoss.enemy;
  boss.invulnerable=false;boss.state='patrol';boss.stateTime=0;boss.cooldown=.55;boss.slowTime=choice==='plan'?4:0;
  boss.left=80;boss.right=activeWorldWidth-90;
  stageBoss.status='active';
  if(choice==='charge')coins+=2;
  for(const actor of[player,...partners])readyActorForCombat(actor);
  captureCombatCheckpoint('boss');
  updateHud();return true;
}

function readyActorForCombat(actor){
  if(!actor)return;
  actor.shootCooldown=0;actor.shootPoseTime=0;actor.shotCount=0;actor.dashTime=0;actor.dashCooldown=0;
  actor.maxMagic=actor.characterId==='kid'?WIZARD_MAGIC.max:0;actor.magic=clamp(Number.isFinite(actor.magic)?actor.magic:actor.maxMagic,0,actor.maxMagic);actor.magicRegenDelay=0;
  actor.hurtTime=0;actor.stance='stand';actor.rStance='stand';actor.stanceVisual=0;actor.itemBuffs={};actor.itemUseTime=0;
}

function shopPrice(id){
  const item=SHOP_ITEMS[id];if(!item)return 0;
  if(item.action!=='supply')return item.price;
  const weapon=SHOP_ITEMS[equippedClassWeapons[item.classId]],basePrice=weapon?.price||20;
  return Math.max(item.price,Math.round(basePrice*.18/5)*5);
}

function currentShopOffers(categoryId=SHOP_CATEGORIES[shopCategoryIndex]?.id){
  const partyClasses=new Set(shopPartyActors().map(actor=>actor.characterId));
  const categoryItems=SHOP_ITEM_LIST.filter(item=>item.categoryId===categoryId&&(item.categoryId!=='weapons'||partyClasses.has(item.classId)));
  if(categoryId==='supplies')return categoryItems.filter(item=>partyClasses.has(item.classId)&&classWeaponNeedsSupply(item.classId)&&shopPrice(item.id)<=coins).map(item=>item.id);
  const equippedIds=new Set([...Object.values(equippedClassWeapons),...Object.values(equippedShopItems)].filter(Boolean));
  const equipped=categoryItems.filter(item=>equippedIds.has(item.id));
  const affordable=categoryItems.filter(item=>!purchasedShopItems.has(item.id)&&item.price<=coins).sort((a,b)=>b.price-a.price||b.col-a.col);
  const owned=categoryItems.filter(item=>purchasedShopItems.has(item.id)&&!equippedIds.has(item.id)).sort((a,b)=>b.col-a.col);
  const starter=affordable.at(-1),best=affordable.filter(item=>item!==starter);
  return[...equipped,...(starter?[starter]:[]),...best,...owned].filter((item,index,list)=>list.indexOf(item)===index).slice(0,5).map(item=>item.id);
}

function shopItemComparison(item){
  if(item.action==='supply'){
    const actor=shopPartyActors().find(entry=>entry.characterId===item.classId)||{characterId:item.classId},condition=weaponConditionFor(actor);
    if(!condition)return'BARE HANDS NEVER BREAK';
    const ammo=condition.maxAmmo!==null?` · AMMO ${condition.ammo} → ${condition.maxAmmo}`:'';
    return`DURABILITY ${condition.durability} → ${condition.maxDurability}${ammo}`;
  }
  if(item.action==='equip'){
    const equipped=item.slot==='weapon'?SHOP_ITEMS[equippedClassWeapons[item.classId]]:equippedShopItem(item.slot);
    if(equipped?.id===item.id)return'EQUIPPED NOW';
    if(item.slot==='weapon'){
      const next=item.weaponProfile,current=equipped?.weaponProfile;
      return current?`${current.damage} → ${next.damage} DAMAGE · ${next.kind.toUpperCase()}`:`FILLS EMPTY WEAPON SLOT · ${next.kind.toUpperCase()}`;
    }
    return equipped?`REPLACES ${equipped.name}`:`FILLS EMPTY ${item.slot.toUpperCase()} SLOT`;
  }
  if(item.action==='use')return'PACKED FOR BATTLE · PRESS △ / E TO USE';
  const current=runUpgrades[item.upgrade]||0;
  return`PERMANENT · ${item.type} LEVEL ${current} → ${current+item.amount}`;
}

function shopItemMessage(item){
  const owned=item.action!=='supply'&&purchasedShopItems.has(item.id),price=shopPrice(item.id),costLine=owned?(item.action==='equip'?'OWNED · PRESS × / A TO EQUIP':'OWNED'):`BUY ${price} COINS · ${coins} → ${Math.max(0,coins-price)} LEFT`;
  return`${item.quality} ${item.name} · ${item.effect}\n${shopItemComparison(item)} · ${costLine}`;
}

function buildShopCatalog(){
  const root=$('shopItems'),tabs=$('shopCategories');if(!root||!tabs)return;
  root.replaceChildren();tabs.replaceChildren();
  for(const [row,category] of SHOP_CATEGORIES.entries()){
    const tab=document.createElement('button');tab.type='button';tab.className='shop-category-tab';tab.dataset.shopCategoryIndex=String(row);tab.setAttribute('role','tab');tab.setAttribute('aria-controls',`shop-category-${category.id}`);tab.setAttribute('aria-label',category.label);
    const categorySprite=document.createElement('canvas');categorySprite.className='shop-category-sprite';categorySprite.width=188;categorySprite.height=90;categorySprite.dataset.row=category.catalogRow===null?'supplies':String(category.catalogRow);categorySprite.setAttribute('aria-hidden','true');tab.append(categorySprite);tabs.append(tab);
    const section=document.createElement('section');section.className='shop-category';section.dataset.shopCategory=category.id;
    section.id=`shop-category-${category.id}`;section.setAttribute('role','tabpanel');section.setAttribute('aria-label',category.label);
    const grid=document.createElement('div');grid.className='shop-category-grid';
    for(const item of SHOP_ITEM_LIST.filter(entry=>entry.category===category.label)){
      const button=document.createElement('button');button.type='button';button.dataset.shopItem=item.id;button.setAttribute('role','option');button.setAttribute('aria-selected','false');
      const sprite=document.createElement('canvas');sprite.className='shop-catalog-sprite';sprite.width=256;sprite.height=256;sprite.dataset.shopCanvasItem=item.id;
      sprite.dataset.itemId=item.id;sprite.setAttribute('aria-hidden','true');
      const info=document.createElement('span');info.className='shop-item-info';
      const name=document.createElement('b');name.textContent=item.name;
      const effect=document.createElement('small');effect.textContent=item.effect;
      const price=document.createElement('em');price.textContent=String(item.price);
      const lock=document.createElement('span');lock.className='shop-lock-sign';lock.setAttribute('aria-hidden','true');
      const lockDrawing=document.createElement('i'),lockLabel=document.createElement('strong');lockLabel.textContent='LOCKED';lock.append(lockDrawing,lockLabel);
      info.append(name,effect);button.append(sprite,info,price,lock);grid.append(button);
    }
    section.append(grid);root.append(section);
  }
}

function drawShopCatalogSprites(){
  if(!assets.shopCatalog.complete||!assets.shopCatalog.naturalWidth)return false;
  const {rows,label,bleed}=SHOP_CATALOG_CUT;
  document.querySelectorAll('.shop-category-sprite').forEach(sprite=>{
    const context=sprite.getContext('2d'),row=sprite.dataset.row;
    context.clearRect(0,0,sprite.width,sprite.height);
    if(row==='supplies'){
      context.save();context.fillStyle='#eee9dd';context.strokeStyle='#3b3833';context.lineWidth=3;context.strokeRect(4,5,180,79);context.fillRect(5,6,178,77);
      context.fillStyle='#34312d';context.font='900 18px "Sketchbound Hand", sans-serif';context.textAlign='center';context.fillText('AMMO / REPAIRS',94,54);context.restore();
    }else{
      const sourceY=rows[Number(row)]-bleed,sourceH=rows[Number(row)+1]-rows[Number(row)]+bleed*2;
      context.drawImage(assets.shopCatalog,label.x,sourceY,label.w,sourceH,0,0,sprite.width,sprite.height);
    }
  });
  document.querySelectorAll('[data-shop-canvas-item]').forEach(canvas=>drawShopGearSprite(canvas,SHOP_ITEMS[canvas.dataset.shopCanvasItem]));
  return true;
}

function shopItemArt(item){
  if(!item)return null;
  if(item.categoryId==='weapons')return{image:assets.classWeapons,cut:CLASS_WEAPON_CUTS[item.col]};
  if(item.categoryId==='supplies'){
    const image=assets.shopSupplies,w=(image.naturalWidth||2172)/4,h=image.naturalHeight||724;
    return{image,cut:[item.col*w,0,w,h]};
  }
  const image=shopItemImages[item.id];
  return image?{image,cut:[0,0,image.naturalWidth||256,image.naturalHeight||256]}:null;
}

function drawShopGearSprite(canvas,item){
  const art=shopItemArt(item);if(!canvas||!art?.image.complete||!art.image.naturalWidth)return false;
  const context=canvas.getContext('2d');
  context.clearRect(0,0,canvas.width,canvas.height);
  const [, ,sourceW,sourceH]=art.cut,inset=Math.min(canvas.width,canvas.height)*(canvas.width>=200?.1:.06);
  const scale=Math.min((canvas.width-inset*2)/sourceW,(canvas.height-inset*2)/sourceH),width=sourceW*scale,height=sourceH*scale;
  context.drawImage(art.image,...art.cut,(canvas.width-width)/2,(canvas.height-height)/2,width,height);
  return true;
}

function shopPartyActors(){
  const actors=[player,...partners].filter(Boolean);
  if(gameMode==='online')actors.push(...remotePlayers.filter(Boolean));
  return actors.slice(0,4);
}

function renderShopParty(){
  const root=$('shopParty');if(!root)return;
  const actors=shopPartyActors();
  root.dataset.count=String(actors.length);
  root.innerHTML=actors.map((actor,index)=>{
    const characterId=actor.characterId||localCharacterSelections[index]||selectedCharacter,name=CHARACTERS[characterId]?.name||'HERO';
    const gear=[equippedClassWeapons[characterId],equippedShopItems.accessory];
    const slots=Array.from({length:2},(_,slot)=>{const gearId=gear[slot];return`<span class="shop-gear-slot" data-shop-gear-slot="${slot}" aria-label="${gearId?SHOP_ITEMS[gearId].name:'Empty gear slot'}">${gearId?`<canvas width="64" height="58" data-shop-gear-item="${gearId}" aria-hidden="true"></canvas>`:''}</span>`;}).join('');
    const moneyId=index===0?' id="shopCoinValue"':'';
    return `<article class="shop-player-card" data-shop-player="${index+1}"><header><b>P${index+1} · ${name}</b><strong class="shop-player-money" aria-label="${coins} coins available"><i class="shop-sprite coin-icon" aria-hidden="true"></i><span>COINS</span> <em${moneyId}>${coins}</em></strong></header><canvas class="shop-player-preview" width="150" height="110" data-character="${characterId}" aria-hidden="true"></canvas><div class="shop-gear-slots" aria-label="Gear slots">${slots}</div></article>`;
  }).join('');
  root.querySelectorAll('.shop-player-preview').forEach(preview=>drawCharacterPreview(preview,preview.dataset.character));
  root.querySelectorAll('[data-shop-gear-item]').forEach(canvas=>drawShopGearSprite(canvas,SHOP_ITEMS[canvas.dataset.shopGearItem]));
}

function refreshShop(){
  const preferredItemId=document.querySelector('.shop-items button.nearby')?.dataset.shopItem||null;
  if($('shopCoinValue'))$('shopCoinValue').textContent=String(coins);$('coinValue').textContent=String(coins);
  const offersByCategory=new Map(SHOP_CATEGORIES.map(category=>[category.id,new Set(currentShopOffers(category.id))]));
  document.querySelectorAll('[data-shop-item]').forEach(button=>{
    const id=button.dataset.shopItem,item=SHOP_ITEMS[id],price=shopPrice(id);button.querySelector('em').textContent=String(price);
    const owned=item.action!=='supply'&&purchasedShopItems.has(id);
    const categoryOffers=currentShopOffers(item.categoryId),visible=offersByCategory.get(item.categoryId)?.has(id)===true;
    button.hidden=!visible;button.classList.remove('cannot-afford','best-buy');button.classList.toggle('bought',owned);
    button.style.order=String(Math.max(0,categoryOffers.indexOf(id)));
    button.tabIndex=visible?0:-1;
    button.setAttribute('aria-disabled','false');
    button.setAttribute('aria-label',`${item.quality} ${item.name}, ${item.effect}, ${shopItemComparison(item)}, ${price} coins${owned?', owned':''}`);
  });
  for(const category of SHOP_CATEGORIES){
    const bestId=currentShopOffers(category.id).map(id=>SHOP_ITEMS[id]).filter(item=>item&&(item.action==='supply'||!purchasedShopItems.has(item.id))).sort((a,b)=>shopPrice(b.id)-shopPrice(a.id))[0]?.id;
    if(bestId)document.querySelector(`[data-shop-item="${bestId}"]`)?.classList.add('best-buy');
  }
  document.querySelectorAll('.shop-category').forEach((section,index)=>{section.hidden=index!==shopCategoryIndex;});
  document.querySelectorAll('[data-shop-category-index]').forEach((tab,index)=>tab.setAttribute('aria-selected',String(index===shopCategoryIndex)));
  renderShopParty();
  if(state==='shop'){
    const buttons=shopSelectableButtons(),preferredIndex=preferredItemId?buttons.findIndex(button=>button.dataset.shopItem===preferredItemId):-1;
    setShopSelection(preferredIndex>=0?preferredIndex:Math.min(shopSelectionIndex,buttons.length-1),false);
  }
}

function shopSelectableButtons(){
  const section=document.querySelector('.shop-category:not([hidden])');
  const itemButtons=currentShopOffers(section?.dataset.shopCategory).map(id=>section?.querySelector(`[data-shop-item="${id}"]:not([hidden])`)).filter(Boolean);
  return[...itemButtons,$('shopContinueButton')].filter(Boolean);
}

function clearShopControllerFocus(){
  document.querySelectorAll('.shop-items button,#shopContinueButton,[data-shop-category-index]').forEach(button=>button.classList.remove('controller-focus','nearby'));
}

function focusShopCategory(index=shopCategoryIndex,announce=true){
  shopCategoryIndex=(index+SHOP_CATEGORIES.length)%SHOP_CATEGORIES.length;
  document.querySelectorAll('.shop-category').forEach((section,sectionIndex)=>{section.hidden=sectionIndex!==shopCategoryIndex;});
  document.querySelectorAll('[data-shop-category-index]').forEach((tab,tabIndex)=>tab.setAttribute('aria-selected',String(tabIndex===shopCategoryIndex)));
  clearShopControllerFocus();shopFocusZone='categories';
  const tab=document.querySelector(`[data-shop-category-index="${shopCategoryIndex}"]`),category=SHOP_CATEGORIES[shopCategoryIndex];
  tab?.classList.add('controller-focus');
  if(announce)$('shopMessage').textContent=`${category.label}\nL1 / R1 CHANGES CATEGORY · STICK CHOOSES AN ITEM`;
  return tab;
}

function setShopCategory(index=0,announce=true,focusCategory=false){
  shopCategoryIndex=(index+SHOP_CATEGORIES.length)%SHOP_CATEGORIES.length;
  prepareShopArt(SHOP_CATEGORIES[shopCategoryIndex].id);
  document.querySelectorAll('.shop-category').forEach((section,sectionIndex)=>{section.hidden=sectionIndex!==shopCategoryIndex;});
  document.querySelectorAll('[data-shop-category-index]').forEach((tab,tabIndex)=>tab.setAttribute('aria-selected',String(tabIndex===shopCategoryIndex)));
  shopSelectionIndex=0;
  if(focusCategory){focusShopCategory(shopCategoryIndex,announce);return SHOP_CATEGORIES[shopCategoryIndex].id;}
  const selected=setShopSelection(0,false),category=SHOP_CATEGORIES[shopCategoryIndex];
  if(announce)$('shopMessage').textContent=selected?.dataset.shopItem?shopItemMessage(SHOP_ITEMS[selected.dataset.shopItem]):`${category.label} · NOTHING AFFORDABLE YET\nL1 / R1 OR Q / E CHANGES CATEGORY`;
  return category.id;
}

function setShopSelection(index=0,announce=true){
  const buttons=shopSelectableButtons();if(!buttons.length)return null;
  shopSelectionIndex=(index+buttons.length)%buttons.length;
  clearShopControllerFocus();
  const selected=buttons[shopSelectionIndex];selected.classList.add(selected.id==='shopContinueButton'?'controller-focus':'nearby');
  shopFocusZone=selected.id==='shopContinueButton'?'continue':'items';
  if(shopFocusZone==='items')shopLastItemIndex=shopSelectionIndex;
  document.querySelectorAll('[data-shop-item]').forEach(button=>button.setAttribute('aria-selected',String(button===selected)));
  selected.scrollIntoView?.({block:'nearest',inline:'nearest'});
  if(announce){
    const item=SHOP_ITEMS[selected.dataset.shopItem];
    if(item)$('shopMessage').textContent=shopItemMessage(item);
    else $('shopMessage').textContent='KEEP GOING\nPRESS □ / X TO CONTINUE THE RUN';
  }
  return selected;
}

function buyShopItem(id){
  if(!SHOP_ITEMS[id]||state!=='shop')return false;
  const item=SHOP_ITEMS[id];
  if(item.action!=='supply'&&purchasedShopItems.has(id)){
    if(item.action==='equip'){equipShopItem(id);playSound('buy');$('shopMessage').textContent=`${item.name} EQUIPPED AND READY\n${item.effect} · ${coins} COINS LEFT`;return true;}
    $('shopMessage').textContent=`${item.name} WAS ALREADY USED OR PACKED.`;return false;
  }
  const price=shopPrice(id);
  if(coins<price){$('shopMessage').textContent=`LOCKED · YOU NEED ${price-coins} MORE COIN${price-coins===1?'':'S'}.`;refreshShop();return false;}
  coins-=price;if(item.action!=='supply')purchasedShopItems.add(id);applyShopPurchase(item);playSound('buy');refreshShop();
  $('shopMessage').textContent=item.action==='equip'?`${item.name} EQUIPPED AND READY\n${item.effect} · ${coins} COINS LEFT`:item.action==='use'?`${item.name} PACKED FOR BATTLE\nPRESS △ / E TO USE · ${coins} COINS LEFT`:item.action==='supply'?`${item.name} USED\nWEAPON READY · ${coins} COINS LEFT`:`${item.name} CRAFTED PERMANENTLY\n${item.effect} · ${coins} COINS LEFT`;return true;
}

function openShop(alreadyWalkedOff=false){
  if(customMapActive||stageBoss?.status!=='waiting'||state!=='playing')return false;
  prepareShopArt('weapons');
  if(stageBoss?.enabled)prepareBossArt(stageBoss.type);
  shopPurpose=stageBoss.enabled?'boss':'down';stageBoss.status='shopping';state='shopEntry';enemyShots=[];bullets=[];hidePanels();
  shopWorldSnapshot={activeWorldWidth,cameraX,groundSegments,floatingPlatforms,platforms,spikes,traps,props,enemies,bullets,enemyShots,coinDrops,wallImpacts,defeatBursts,exitSpikes};
  if(alreadyWalkedOff){setupShopRoom();return true;}
  shopSceneActive=false;shopTransition={phase:'walkOff',time:0};
  for(const actor of[player,...partners]){actor.stance='stand';actor.rStance='stand';actor.stanceVisual=0;actor.vx=SHOP_ENTRY_SPEED;actor.vy=0;actor.facing=1;actor.onGround=true;actor.moveIntent=1;actor.walkTime=0;actor.shootPoseTime=0;actor.dashTime=0;actor.hurtTime=0;}
  return true;
}

function setupShopRoom(){
  shopSceneActive=true;bossArenaActive=false;bossFountain=null;activeWorldWidth=VIEW_W;cameraX=0;setMusicScene('shop');playSound('transition');
  groundSegments=[[0,VIEW_W]];floatingPlatforms=[];
  platforms=[{x:0,y:SHOP_SURFACE-49,w:VIEW_W,h:190,type:0,ground:true,surfaceY:SHOP_SURFACE,undersideY:VIEW_H+190,collisionLeft:0,collisionRight:VIEW_W,sideLeft:0,sideRight:VIEW_W,sideTopInset:0,landingTolerance:3,hidden:true}];
  spikes=[];traps=[];props=[];enemies=[];bullets=[];enemyShots=[];coinDrops=[];wallImpacts=[];defeatBursts=[];bossWaves=[];exitSpikes=null;
  [player,...partners].forEach((actor,index)=>{actor.x=-150-index*72;actor.y=SHOP_SURFACE-actor.h;actor.vx=SHOP_ENTRY_SPEED;actor.vy=0;actor.facing=1;actor.onGround=true;actor.moveIntent=1;actor.walkTime=0;});
  shopTransition=null;state='shop';shopSelectionIndex=0;shopCategoryIndex=0;shopFocusZone='items';shopLastItemIndex=0;
  updateLoadoutHud();
  $('shopPanel').classList.add('visible');
  $('shopMessage').textContent='BEST THINGS YOU CAN AFFORD\n× / A BUYS · □ / X CONTINUES · L1 / R1 CHANGES CATEGORY';
  refreshShop();setShopCategory(0,false);setShopSelection(shopSelectableButtons().length-1);
}

function updateShopScene(dt,controllers=[]){
  const actors=[player,...partners];
  if(state==='shopEntry'){
    if(shopTransition?.phase==='walkOff'){
      const edge=cameraX+VIEW_W+145;
      for(const actor of actors){actor.animationTime+=dt;actor.walkTime+=dt;actor.facing=1;actor.moveIntent=1;actor.vx=SHOP_ENTRY_SPEED;actor.x+=SHOP_ENTRY_SPEED*dt;actor.y=groundSurfaceAt(actor.x)-actor.h;}
      if(actors.every(actor=>actor.x>=edge))setupShopRoom();
      return;
    }
    return;
  }
  if(state==='shopExit'){
    for(const actor of actors){actor.animationTime+=dt;actor.walkTime+=dt;actor.facing=1;actor.moveIntent=1;actor.x+=SHOP_ENTRY_SPEED*dt;actor.y=SHOP_SURFACE-actor.h;}
    if(actors.every(actor=>actor.x>VIEW_W+135))finishShopExit();
    return;
  }
  if(state!=='shop')return;
  const categoryNav=controllers.some(controller=>controller?.pagePrev)||justPressed.has('KeyQ')?-1:controllers.some(controller=>controller?.pageNext)||justPressed.has('KeyE')?1:0;
  if(categoryNav)setShopCategory(shopCategoryIndex+categoryNav,true,false);
  const controller=controllers.find(entry=>entry?.navX||entry?.navY||entry?.nav);
  const navX=Math.sign(controller?.navX||controller?.nav||0)||(justPressed.has('ArrowLeft')||justPressed.has('KeyA')?-1:justPressed.has('ArrowRight')||justPressed.has('KeyD')?1:0);
  const navY=Math.sign(controller?.navY||0)||(justPressed.has('ArrowUp')||justPressed.has('KeyW')?-1:justPressed.has('ArrowDown')||justPressed.has('KeyS')?1:0);
  const itemCount=Math.max(0,shopSelectableButtons().length-1);
  if(shopFocusZone==='items'){
    if(navY>0)setShopSelection(itemCount);
    else if(navX&&itemCount)setShopSelection((shopSelectionIndex+navX+itemCount)%itemCount);
  }else if(shopFocusZone==='continue'&&navY<0){
    itemCount?setShopSelection(Math.min(shopLastItemIndex,itemCount-1)):setShopSelection(0);
  }
  const continuePressed=controllers.some(controller=>controller?.cycle)||justPressed.has('Enter')||justPressed.has('Space');
  if(continuePressed){leaveShop();return;}
  const buyPressed=controllers.some(controller=>controller?.confirm)||justPressed.has('KeyJ')||justPressed.has('KeyG')||justPressed.has('KeyX');
  if(buyPressed){
    const selected=setShopSelection(shopSelectionIndex);
    if(selected?.dataset.shopItem)buyShopItem(selected.dataset.shopItem);
  }
}

function leaveShop(){
  if(state!=='shop')return false;
  hidePanels();state='shopExit';shopTransition={phase:'leave',time:0};
  for(const actor of[player,...partners]){actor.facing=1;actor.moveIntent=1;actor.vx=SHOP_ENTRY_SPEED;actor.vy=0;actor.onGround=true;actor.x=VIEW_W+180;}
  return finishShopExit();
}

function finishShopExit(){
  const level=levelData();
  if(shopPurpose==='down'||level.exit==='down'){
    const saved=shopWorldSnapshot;if(saved)({activeWorldWidth,cameraX,groundSegments,floatingPlatforms,platforms,spikes,traps,props,enemies,bullets,enemyShots,coinDrops,wallImpacts,defeatBursts,exitSpikes}=saved);
    stageBoss.status='cleared';shopPurpose=null;shopSceneActive=false;shopWorldSnapshot=null;shopTransition=null;
    state='playing';setMusicScene('level');const x=safeGroundX(level.goalX-205);player.x=x;player.y=groundSurfaceAt(x)-player.h;player.vx=0;player.vy=0;player.onGround=true;
    partners.forEach((actor,index)=>{const partnerX=safeGroundX(x-58*(index+1));actor.x=partnerX;actor.y=groundSurfaceAt(partnerX)-actor.h;actor.vx=0;actor.vy=0;actor.onGround=true;});
    cameraX=clamp(level.goalX-VIEW_W*.72,0,activeWorldWidth-VIEW_W);return true;
  }
  shopPurpose=null;shopWorldSnapshot=null;shopTransition=null;
  setupBossArena();state='arenaTransition';stageBoss.status='walking';arenaTransition={phase:'enter',time:0};return true;
}

function beginArenaTransition(){
  if(!stageBoss?.enabled||stageBoss.status!=='shopping')return false;
  prepareBossArt(stageBoss.type);
  const actors=[player,...partners],distance=Math.max(...actors.map(actor=>VIEW_W+150-actor.x));
  state='arenaTransition';stageBoss.status='walking';arenaTransition={phase:'walkOff',time:0,duration:clamp(distance/960,.3,1.45)};enemyShots=[];bullets=[];
  for(const actor of[player,...partners]){actor.facing=1;actor.moveIntent=1;actor.vx=960;actor.vy=0;actor.onGround=true;actor.stance='stand';actor.dashTime=0;actor.shootPoseTime=0;actor.hurtTime=0;}
  return true;
}

function setupBossArena(){
  shopSceneActive=false;bossArenaActive=true;fountainRoomActive=false;fountainSnapshot=null;fountainEntrance=null;fountainClimb=null;fountainUseTime=0;activeWorldWidth=VIEW_W;cameraX=0;
  const surfaceY=524;
  bossFountain={x:118,surfaceY,range:128,restoreRate:75,capacity:1500,water:1500,guardCooldown:.8,warningTime:0,disabledTime:0,hitFlash:0};
  groundSegments=[[0,VIEW_W]];floatingPlatforms=[];
  platforms=[{x:0,y:surfaceY-36,w:VIEW_W,h:160,type:0,ground:true,surfaceY,undersideY:VIEW_H+180,collisionLeft:0,collisionRight:VIEW_W,sideLeft:0,sideRight:VIEW_W,sideTopInset:0,landingTolerance:4,hidden:true}];
  spikes=[];traps=[];props=[];enemies=[];bullets=[];enemyShots=[];coinDrops=[];wallImpacts=[];defeatBursts=[];bossWaves=[];exitSpikes=null;
  [player,...partners].forEach((actor,index)=>{actor.x=-150-index*72;actor.y=surfaceY-actor.h;actor.vx=0;actor.vy=0;actor.facing=1;actor.onGround=true;actor.moveIntent=1;actor.walkTime=0;actor.shootPoseTime=0;actor.dashTime=0;});
}

function spawnBossInArena(){
  const def=ENEMY_DEFS[stageBoss.type],boss=createEnemy(stageBoss.type,1005,def.airborne?270:undefined,0);
  boss.entranceStartY=-boss.h;boss.entranceTargetY=def.airborne?285:groundSurfaceAt(boss.x)-boss.h/2;
  boss.y=boss.entranceStartY;boss.baseY=boss.entranceTargetY;boss.left=610;boss.right=activeWorldWidth-90;
  boss.state='entrance';boss.invulnerable=true;boss.visible=true;boss.dir=-1;
  enemies=[boss];stageBoss.enemy=boss;stageBoss.status='entering';arenaTransition.phase='bossEnter';arenaTransition.time=0;setMusicScene('boss');playSound('boss');
  return boss;
}

function updateArenaTransition(dt){
  if(!arenaTransition)return;
  arenaTransition.time+=dt;
  const actors=[player,...partners];
  for(const actor of actors){actor.animationTime+=dt;actor.walkTime+=dt;actor.facing=1;actor.moveIntent=1;}
  if(arenaTransition.phase==='walkOff'){
    for(const actor of actors)actor.x+=960*dt;
    if(arenaTransition.time>=arenaTransition.duration){setupBossArena();arenaTransition={phase:'enter',time:0};}
  }else if(arenaTransition.phase==='enter'){
    actors.forEach((actor,index)=>{const target=185+index*76;actor.x=Math.min(target,actor.x+390*dt);actor.y=groundSurfaceAt(actor.x)-actor.h;});
    if(arenaTransition.time>=1.15){for(const actor of actors){actor.moveIntent=0;actor.vx=0;}arenaTransition.phase='reveal';arenaTransition.time=0;}
  }else if(arenaTransition.phase==='reveal'){
    if(arenaTransition.time>=.8)spawnBossInArena();
  }else if(arenaTransition.phase==='bossEnter'){
    const boss=stageBoss.enemy,progress=clamp(arenaTransition.time/.82,0,1),eased=1-(1-progress)*(1-progress);
    boss.y=boss.entranceStartY+(boss.entranceTargetY-boss.entranceStartY)*eased;
    if(progress>=1){boss.y=boss.entranceTargetY;arenaTransition=null;stageBoss.status='intro';startBossFight('plan');}
  }
}

function beginDownTransition(target=currentLevel+1,sourceActor=player){
  if(state!=='playing'||target>=LEVELS.length)return false;
  if(sourceActor!==player){player.x=sourceActor.x;player.y=sourceActor.y;}
  state='transition';levelTransition={target,phase:'fall',time:0,screenX:sourceActor.x+sourceActor.w/2-cameraX};player.vx=0;player.vy=420;player.onGround=false;return true;
}

function updateLevelTransition(dt){
  if(!levelTransition)return;
  levelTransition.time+=dt;
  if(levelTransition.phase==='fall'){
    player.vy=Math.min(980,player.vy+GRAVITY*.45*dt);player.y+=player.vy*dt;
    if(levelTransition.time>=.52){
      const target=levelTransition.target;loadLevel(target,true);state='transition';levelTransition={target,phase:'arrive',time:0,screenX:220};
      player.y=-player.h-28;player.vy=480;player.onGround=false;cameraX=0;
    }
  }else if(levelTransition.phase==='arrive'){
    player.vy=Math.min(900,player.vy+GRAVITY*.65*dt);player.y+=player.vy*dt;
    const surface=groundSurfaceAt(player.x);
    if(player.y+player.h>=surface){player.y=surface-player.h;player.vy=0;player.onGround=true;levelTransition.phase='land';levelTransition.time=0;}
  }else if(levelTransition.phase==='land'&&levelTransition.time>=.48){state='playing';levelTransition=null;updateHud();}
}

function hidePanels(){
  $('menu').classList.remove('visible');
  $('mapMakerPanel').classList.remove('visible');
  $('localPanel').classList.remove('visible');
  $('characterPanel').classList.remove('visible');
  $('onlinePanel').classList.remove('visible');
  $('pausePanel').classList.remove('visible');
  $('bossCutscenePanel').classList.remove('visible');
  $('shopPanel').classList.remove('visible');
  $('endPanel').classList.remove('visible');
}

function finish(won){
  state=won?'won':'dead';setMusicScene('end');globalThis.gameSound?.setPaused(false);playSound(won?'win':'hurt');
  $('endKicker').textContent=won?(customMapActive?'MAP COMPLETE':'THE LAST PAGE'):'INK SPILLED';
  $('endTitle').textContent=won?(customMapActive?'DRAWING CROSSED!':'ALL LEVELS CROSSED!'):'TRY THE PAGE AGAIN';
  const firstPage=LEVELS[0]?.name||'the first page',lastPage=LEVELS.at(-1)?.name||'the last page';
  $('endCopy').textContent=won?(customMapActive?'Your hand-drawn finish gate opens. The map works!':`You crossed all ${LEVELS.length} pages, from ${firstPage} to ${lastPage}.`):'Your one heart is gone. Start a fresh run and try another line.';
  $('endScore').textContent=`SCORE ${String(score).padStart(6,'0')}`;
  $('endPanel').classList.add('visible');
}

function pauseGame(){
  justPressed.clear();
  if(state==='playing'){state='paused';globalThis.gameSound?.setPaused(true);$('pausePanel').classList.add('visible');focusControllerButton($('resumeButton'));}
  else if(state==='paused'){state='playing';globalThis.gameSound?.setPaused(false);$('pausePanel').classList.remove('visible');}
}

function connectedGamepads(){
  return Array.from(navigator.getGamepads?.()||[]).filter(pad=>pad&&pad.connected!==false);
}

function gamepadButtonPressed(button){
  return !!button&&(button.pressed||Number(button.value)>.45);
}

function isPlayStationPad(pad){
  return /dualsense|dualshock|wireless controller|playstation|054c/i.test(pad?.id||'');
}

function updateControllerStatus(pads=connectedGamepads()){
  const status=$('controllerStatus');if(!status)return;
  const playStation=pads.some(isPlayStationPad);
  const text=pads.length?`${playStation?'PS5':'GAMEPAD'} CONTROLLER READY · ${pads.length} CONNECTED`:'GAMEPAD / TV REMOTE: PRESS A BUTTON';
  if(status.textContent!==text)status.textContent=text;
  status.classList.toggle('connected',pads.length>0);
  if(state==='localLobby')renderLocalControllerSlots(pads);
}

function renderLocalControllerSlots(pads=connectedGamepads()){
  const root=$('localControllerSlots');if(!root)return;
  const signature=Array.from({length:4},(_,index)=>`${index}:${pads[index]?.id||''}`).join('|');
  if(root.dataset.signature===signature)return;
  root.dataset.signature=signature;
  root.innerHTML=Array.from({length:4},(_,index)=>{
    const connected=!!pads[index],playerNumber=index+1,artNumber=index%2?'two':'one';
    const fallback=index===0?'KEYBOARD OR PAD':index===1?'SECOND KEYS OR PAD':'CONNECT CONTROLLER';
    const status=connected?'CONTROLLER READY':fallback;
    return `<figure class="local-controller-slot${connected?' connected':''}" data-local-controller="${index}" aria-label="Player ${playerNumber}: ${status}"><b>P${playerNumber}</b><img src="/play/sketchbound/assets/local-controller-${artNumber}-chatgpt.png" alt=""><small>${status}</small></figure>`;
  }).join('');
}

function readGamepad(index=0,pads=connectedGamepads()){
  const pad=pads[index],previous=padPrevious[index]||[];
  if(!pad){padPrevious[index]=[];padStickLocked[index]=false;return{connected:false,left:false,right:false,up:false,down:false,crouchTap:false,jump:false,jumpHeld:false,shoot:false,cycle:false,dash:false,useItem:false,cycleWeapon:false,start:false,confirm:false,pagePrev:false,pageNext:false,nav:0,navX:0,navY:0};}
  const now=pad.buttons.map(gamepadButtonPressed),axisX=Number(pad.axes[0])||0,axisY=Number(pad.axes[1])||0;
  const rawPlayStation=isPlayStationPad(pad)&&pad.mapping!=='standard';
  const jumpButton=rawPlayStation?1:0,squareButton=rawPlayStation?0:2,dashButton=rawPlayStation?2:1;
  const dpadLeft=!!now[14],dpadRight=!!now[15],dpadUp=!!now[12],dpadDown=!!now[13];
  const rawNavX=dpadLeft||axisX<-.55?-1:dpadRight||axisX>.55?1:0;
  const rawNavY=dpadUp||axisY<-.55?-1:dpadDown||axisY>.55?1:0;
  const navDirection=rawNavX||rawNavY;
  const dpadEdge=(dpadLeft&&!previous[14])||(dpadRight&&!previous[15])||(dpadUp&&!previous[12])||(dpadDown&&!previous[13]);
  const navTriggered=navDirection&&(dpadEdge||!padStickLocked[index]);
  const nav=navTriggered?navDirection:0,navX=navTriggered?rawNavX:0,navY=navTriggered?rawNavY:0;
  padStickLocked[index]=!!navDirection;
  const rightTriggerTap=!!now[7]&&!previous[7],shootHeld=!!now[5];
  const result={connected:true,id:pad.id,left:axisX<-.18||dpadLeft,right:axisX>.18||dpadRight,up:axisY<-.42||dpadUp,down:axisY>.42||dpadDown,crouchTap:rightTriggerTap,jump:!!now[jumpButton]&&!previous[jumpButton],jumpHeld:!!now[jumpButton],shoot:shootHeld,cycle:!!now[squareButton]&&!previous[squareButton],dash:!!now[dashButton]&&!previous[dashButton],useItem:!!now[3]&&!previous[3],cycleWeapon:!!now[4]&&!previous[4],start:!!now[9]&&!previous[9],confirm:!!now[jumpButton]&&!previous[jumpButton],pagePrev:!!now[4]&&!previous[4],pageNext:!!now[5]&&!previous[5],nav,navX,navY};
  padPrevious[index]=now;
  return result;
}

function visibleMenuButtons(){
  return [...document.querySelectorAll('.paper-panel.visible button')].filter(button=>!button.disabled&&button.getClientRects().length);
}

function focusControllerButton(button){
  document.querySelectorAll('.controller-focus').forEach(element=>element.classList.remove('controller-focus'));
  if(!button)return;
  button.classList.add('controller-focus');
  button.focus({preventScroll:true});
}

function moveMenuFocus(direction){
  const buttons=visibleMenuButtons();if(!buttons.length)return null;
  let current=buttons.includes(document.activeElement)?document.activeElement:buttons.find(button=>button.classList.contains('controller-focus'));
  if(!current){current=buttons[0];focusControllerButton(current);}
  const currentBox=current.getBoundingClientRect(),origin={x:currentBox.left+currentBox.width/2,y:currentBox.top+currentBox.height/2};
  const vector={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[direction];if(!vector)return current;
  const ranked=buttons.filter(button=>button!==current).map(button=>{
    const box=button.getBoundingClientRect(),dx=box.left+box.width/2-origin.x,dy=box.top+box.height/2-origin.y;
    const primary=dx*vector[0]+dy*vector[1],perpendicular=Math.abs(dx*vector[1]-dy*vector[0]);
    return{button,primary,perpendicular,score:primary+perpendicular*2.35};
  }).filter(candidate=>candidate.primary>3).sort((a,b)=>a.score-b.score);
  if(ranked.length){focusControllerButton(ranked[0].button);return ranked[0].button;}
  const wrap=buttons.filter(button=>button!==current).map(button=>{
    const box=button.getBoundingClientRect(),x=box.left+box.width/2,y=box.top+box.height/2;
    const edge=direction==='left'?x:direction==='right'?-x:direction==='up'?y:-y;
    const cross=direction==='left'||direction==='right'?Math.abs(y-origin.y):Math.abs(x-origin.x);
    return{button,score:edge+cross*2.35};
  }).sort((a,b)=>a.score-b.score)[0];
  if(wrap)focusControllerButton(wrap.button);
  return wrap?.button||current;
}

function activateFocusedMenuButton(){
  const buttons=visibleMenuButtons();if(!buttons.length)return false;
  const button=buttons.includes(document.activeElement)?document.activeElement:buttons.find(entry=>entry.classList.contains('controller-focus'))||buttons[0];
  focusControllerButton(button);button.click();return true;
}

function remoteActionForEvent(event){
  for(const value of[event.code,event.key]){
    const token=String(value||'').toLowerCase().replace(/[\s_-]+/g,'');
    if(REMOTE_ACTION_BY_NAME[token])return REMOTE_ACTION_BY_NAME[token];
  }
  const rawCode=Number(event.keyCode||event.which||0),unidentified=!event.code||event.code==='Unidentified'||!event.key||event.key==='Unidentified';
  return unidentified?REMOTE_ACTION_BY_KEY_CODE[rawCode]||null:null;
}

function remoteEventIdentity(event){
  return`${event.code||'Unidentified'}|${event.key||'Unidentified'}|${Number(event.keyCode||event.which||0)}`;
}

function remoteInputCode(action){
  if(action==='left')return'ArrowLeft';
  if(action==='right')return'ArrowRight';
  if(action==='up')return'ArrowUp';
  if(action==='down'||action==='duck')return'ArrowDown';
  if(action==='jump')return'Space';
  if(action==='dash')return'KeyK';
  if(action==='item')return'KeyE';
  if(action==='cycle')return'KeyQ';
  if(action==='confirm')return state==='mapMaker'?'Enter':'KeyJ';
  return null;
}

function holdRemoteInput(event,code){
  const identity=remoteEventIdentity(event),previous=remoteHeldInputs.get(identity);
  if(previous?.timer)clearTimeout(previous.timer);
  if(!keys.has(code))justPressed.add(code);
  keys.add(code);
  // Some TV browsers only send a raw key code and never send keyup. Release
  // those signals defensively, but let normal keyboards and well-behaved
  // remotes remain held until their real keyup event arrives.
  const rawSignal=!event.code||event.code==='Unidentified';
  const timer=rawSignal?setTimeout(()=>releaseRemoteInput(identity),900):0;
  remoteHeldInputs.set(identity,{code,timer});
}

function releaseRemoteInput(identity){
  const held=remoteHeldInputs.get(identity);if(!held)return false;
  if(held.timer)clearTimeout(held.timer);
  remoteHeldInputs.delete(identity);
  if(![...remoteHeldInputs.values()].some(entry=>entry.code===held.code))keys.delete(held.code);
  return true;
}

function remoteUsesMenuNavigation(){
  return !['playing','dying','transition','arenaTransition','shopEntry','shop','shopExit','mapMaker'].includes(state);
}

function handleRemoteBack(){
  if(state==='playing'||state==='paused'){pauseGame();return true;}
  if(state==='mapMaker'){backToMenu();return true;}
  if(state==='characterSelect'){$('characterBackButton').click();return true;}
  if(state==='localLobby'){$('localBackButton').click();return true;}
  if(state==='onlineLobby'){$('onlineBackButton').click();return true;}
  if(state==='shop'){leaveShop();return true;}
  if(state==='won'||state==='dead'){backToMenu();return true;}
  return state==='menu'||state==='cutscene'||state==='shopEntry'||state==='shopExit';
}

function handleControllerMenu(controller){
  if(!controller.connected)return;
  if(controller.start){
    if(state==='paused')pauseGame();
    else if(state==='menu')openCharacterMenu('solo',1);
    else if(state==='characterSelect')confirmCharacter();
    else if(state==='cutscene')startBossFight('plan');
    else if(state==='won'||state==='dead')startGame(gameMode);
    return;
  }
  const buttons=visibleMenuButtons();
  if(!buttons.length)return;
  if(controller.navX)moveMenuFocus(controller.navX<0?'left':'right');
  else if(controller.navY)moveMenuFocus(controller.navY<0?'up':'down');
  else if(controller.nav)moveMenuFocus(controller.nav<0?'left':'right');
  else if(!document.querySelector('.controller-focus'))focusControllerButton(buttons[0]);
  if(controller.confirm)activateFocusedMenuButton();
}

function handleLocalCharacterControllers(controllers){
  let changed=false;
  for(let index=0;index<pendingPlayerCount;index++){
    const controller=controllers[index];if(!controller?.connected)continue;
    if(controller.dash&&localCharacterReady[index]){localCharacterReady[index]=false;localSelectionActivePlayer=index;selectedCharacter=localCharacterSelections[index];changed=true;continue;}
    if(controller.nav&&!localCharacterReady[index]){
      localCharacterSelections[index]=nextAvailableCharacter(localCharacterSelections[index],index,controller.nav);
      localSelectionActivePlayer=index;selectedCharacter=localCharacterSelections[index];changed=true;
    }
    if(controller.confirm&&!localCharacterReady[index]&&characterOwner(localCharacterSelections[index],index)<0){localCharacterReady[index]=true;localSelectionActivePlayer=index;selectedCharacter=localCharacterSelections[index];changed=true;}
  }
  if(changed)refreshCharacterSelection();
  if(controllers.some(controller=>controller.start)){
    if(localCharacterReady.slice(0,pendingPlayerCount).every(Boolean))confirmCharacter(true);
  }
}

function updateMapMakerController(controller,dt){
  const left=keys.has('ArrowLeft')||keys.has('KeyA')||controller.left;
  const right=keys.has('ArrowRight')||keys.has('KeyD')||controller.right;
  const up=keys.has('ArrowUp')||keys.has('KeyW')||controller.up;
  const down=keys.has('ArrowDown')||keys.has('KeyS')||controller.down;
  const directionX=(right?1:0)-(left?1:0),directionY=(down?1:0)-(up?1:0);
  if(directionX||directionY){
    const viewX=mapMakerViewX();
    mapCursor.x=clamp(mapCursor.x+directionX*330*dt,viewX+25,viewX+1255);
    mapCursor.y=clamp(mapCursor.y+directionY*330*dt,40,690);
    mapMakerLastMove+=dt;
    if(mapMakerLastMove>=.025){mapMakerLastMove=0;drawMapMaker();}
  }else mapMakerLastMove=0;
  if(controller.cycle||justPressed.has('KeyQ'))selectMapTool(MAP_TOOLS[(MAP_TOOLS.indexOf(mapTool)+1)%MAP_TOOLS.length]);
  if(controller.dash||justPressed.has('KeyE')||justPressed.has('Delete')||justPressed.has('Backspace'))selectMapTool('erase');
  if(controller.pagePrev||justPressed.has('BracketLeft')||justPressed.has('PageUp'))setMapMakerPage(mapMakerPage-1);
  if(controller.pageNext||justPressed.has('BracketRight')||justPressed.has('PageDown'))setMapMakerPage(mapMakerPage+1);
  if(controller.confirm||justPressed.has('Space')||justPressed.has('Enter'))placeMapObject();
  if(controller.start)playCustomMap();
}

function inputState(controller){
  let left=keys.has('ArrowLeft')||keys.has('KeyA')||touch.left||controller.left;
  let right=keys.has('ArrowRight')||keys.has('KeyD')||touch.right||controller.right;
  const down=keys.has('ArrowDown')||keys.has('KeyS')||touch.duck||controller.down;
  let jump=justPressed.has('Space')||justPressed.has('ArrowUp')||justPressed.has('KeyW')||controller.jump;
  const jumpHeld=keys.has('Space')||keys.has('ArrowUp')||keys.has('KeyW')||controller.jumpHeld;
  let shoot=keys.has('KeyJ')||keys.has('KeyX')||touch.shoot||controller.shoot;
  let dash=justPressed.has('ShiftLeft')||justPressed.has('ShiftRight')||justPressed.has('KeyK')||touch.dash||controller.dash;
  const crouchTap=justPressed.has('KeyR')||controller.crouchTap;
  const useItem=justPressed.has('KeyE')||touch.item||controller.useItem;
  const cycleWeapon=justPressed.has('KeyQ')||controller.cycleWeapon;
  if(touch.jump){jump=true;touch.jump=false;}
  if(touch.dash){dash=true;touch.dash=false;}
  if(touch.item)touch.item=false;
  return{left,right,down,crouchTap,jump,jumpHeld,shoot,dash,useItem,cycleWeapon};
}

function actorRightMovementLimit(actor){
  const walkingOff=!customMapActive&&state==='playing'&&stageBoss?.enabled&&stageBoss.status==='waiting';
  return walkingOff?activeWorldWidth+210:activeWorldWidth-actor.w;
}

function actorHorizontalMovementBounds(actor){
  let left=0,right=actorRightMovementLimit(actor);
  const walkingOff=!customMapActive&&stageBoss?.enabled&&stageBoss.status==='waiting';
  if(gameMode!=='local'||localPlayerCount<2||state!=='playing'||walkingOff)return{left,right};
  const others=[player,...partners].filter(entry=>entry&&entry!==actor&&entry.hp>0);
  if(!others.length)return{left,right};
  const centers=others.map(entry=>entry.x+entry.w/2),leftmost=Math.min(...centers),rightmost=Math.max(...centers);
  left=Math.max(left,rightmost-PARTY_MAX_SPREAD-actor.w/2);
  right=Math.min(right,leftmost+PARTY_MAX_SPREAD-actor.w/2);
  if(left>right){const midpoint=(left+right)/2;left=midpoint;right=midpoint;}
  return{left,right};
}

function partyCameraTarget(actors=[player,...partners].filter(Boolean)){
  if(actors.length<=1)return clamp((actors[0]?.x||0)+(actors[0]?.w||0)/2-VIEW_W*.42,0,Math.max(0,activeWorldWidth-VIEW_W));
  const centers=actors.filter(actor=>actor.hp>0).map(actor=>actor.x+actor.w/2);
  if(!centers.length)return cameraX;
  const leftmost=Math.min(...centers),rightmost=Math.max(...centers),middle=(leftmost+rightmost)/2;
  const minimum=rightmost+PARTY_CAMERA_MARGIN-VIEW_W,maximum=leftmost-PARTY_CAMERA_MARGIN;
  const target=minimum<=maximum?clamp(middle-VIEW_W/2,minimum,maximum):middle-VIEW_W/2;
  return clamp(target,0,Math.max(0,activeWorldWidth-VIEW_W));
}

function partnerInputState(controller,playerIndex=1){
  const keyboard=playerIndex===1;
  return{
    left:(keyboard&&keys.has('KeyF'))||controller.left,
    right:(keyboard&&keys.has('KeyH'))||controller.right,
    down:controller.down,
    crouchTap:(keyboard&&justPressed.has('KeyU'))||controller.crouchTap,
    jump:(keyboard&&justPressed.has('KeyT'))||controller.jump,
    jumpHeld:(keyboard&&keys.has('KeyT'))||controller.jumpHeld,
    shoot:(keyboard&&keys.has('KeyG'))||controller.shoot,
    dash:(keyboard&&justPressed.has('KeyY'))||controller.dash,
    useItem:(keyboard&&justPressed.has('KeyO'))||controller.useItem,
    cycleWeapon:(keyboard&&justPressed.has('KeyI'))||controller.cycleWeapon
  };
}

const STANCE_SIZES={stand:[52,88],duck:[58,58]};

function setActorStance(actor,stance){
  if(!STANCE_SIZES[stance])stance='stand';
  if(actor.stance===stance)return true;
  const [w,h]=STANCE_SIZES[stance],centerX=actor.x+actor.w/2,feetY=actor.y+actor.h;
  const candidate={x:centerX-w/2,y:feetY-h,w,h};
  const blocked=platforms.some(platform=>!platform.ground&&overlap(candidate,{x:platform.collisionLeft,y:platform.surfaceY,w:platform.collisionRight-platform.collisionLeft,h:platform.undersideY-platform.surfaceY}));
  if(blocked)return false;
  actor.x=clamp(candidate.x,0,activeWorldWidth-w);actor.y=candidate.y;actor.w=w;actor.h=h;actor.stance=stance;
  return true;
}

function setPlayerStance(stance){return setActorStance(player,stance);}

function resolvePlatformSides(actor,previousX){
  const movement=actor.x-previousX;
  if(Math.abs(movement)<.001)return null;
  const previousLeft=previousX,previousRight=previousX+actor.w,currentLeft=actor.x,currentRight=actor.x+actor.w;
  let collision=null;
  for(const platform of platforms){
    const left=platform.sideLeft??platform.collisionLeft,right=platform.sideRight??platform.collisionRight;
    const sideTop=platform.surfaceY+(platform.sideTopInset??0),sideBottom=platform.undersideY-3;
    if(actor.y+actor.h<=sideTop||actor.y>=sideBottom)continue;
    if(movement>0&&previousRight<=left+1&&currentRight>=left&&(!collision||left<collision.edge))collision={platform,edge:left};
    if(movement<0&&previousLeft>=right-1&&currentLeft<=right&&(!collision||right>collision.edge))collision={platform,edge:right};
  }
  if(!collision)return null;
  actor.x=movement>0?collision.edge-actor.w:collision.edge;
  actor.vx=0;
  actor.dashTime=0;
  return collision.platform;
}

function updateActorStance(actor,input,dt){
  if(input.crouchTap)actor.rStance=actor.rStance==='duck'?'stand':'duck';
  const requested=input.down?'duck':actor.rStance;
  setActorStance(actor,actor.onGround?requested:'stand');
  const target=actor.stance==='duck'?.45:0;
  actor.stanceVisual+=clamp(target-actor.stanceVisual,-dt*3.8,dt*3.8);
}

function updatePlayerStance(input,dt){updateActorStance(player,input,dt);}

function updateMovingPlatforms(dt){
  const actors=[player,...partners].filter(actor=>actor&&actor.hp>0);
  for(const platform of platforms||[]){
    if(!platform.motion)continue;
    const oldX=platform.x,oldSurface=platform.surfaceY;
    const riders=actors.filter(actor=>actor.onGround&&Math.abs(actor.y+actor.h-oldSurface)<=7&&actor.x+actor.w>platform.collisionLeft&&actor.x<platform.collisionRight);
    const speed=platform.motion.speed||1,phase=platform.motion.phase||0,amplitude=platform.motion.amplitude||40;
    platform.motionTime+=dt;
    const wave=Math.sin(platform.motionTime*speed+phase);
    const nextX=platform.baseX+(platform.motion.kind==='glide'?wave*amplitude:0);
    const nextSurface=platform.baseSurfaceY+(platform.motion.kind==='lift'?wave*amplitude:0);
    const dx=nextX-oldX,dy=nextSurface-oldSurface;
    platform.x=nextX;platform.y=nextSurface-21;platform.surfaceY=nextSurface;platform.undersideY=nextSurface+94;
    platform.collisionLeft=nextX+5;platform.collisionRight=nextX+platform.w-5;platform.sideLeft=nextX+8;platform.sideRight=nextX+platform.w-8;
    for(const actor of riders){
      const bounds=actorHorizontalMovementBounds(actor);
      actor.x=clamp(actor.x+dx,bounds.left,bounds.right);
      actor.y+=dy;
    }
  }
}

function update(dt){
  worldTime+=dt;
  const pads=connectedGamepads();updateControllerStatus(pads);
  const controllers=Array.from({length:4},(_,index)=>readGamepad(index,pads)),controller=controllers[0],startedPlaying=state==='playing';
  if(state==='mapMaker'){updateMapMakerController(controller,dt);justPressed.clear();return;}
  if(state==='characterSelect'&&pendingMode==='local'){handleLocalCharacterControllers(controllers);justPressed.clear();return;}
  if(state==='transition'){updateLevelTransition(dt);justPressed.clear();return;}
  if(state==='arenaTransition'){updateArenaTransition(dt);justPressed.clear();return;}
  if(state==='shopEntry'||state==='shop'||state==='shopExit'){updateShopScene(dt,controllers);justPressed.clear();return;}
  if(!startedPlaying&&state!=='dying'){handleControllerMenu(controller);justPressed.clear();return;}
  if(controllers.some(entry=>entry.start)){pauseGame();return;}
  if(state==='dying'){
    const actor=defeatedActor||player;
    actor.hurtTime-=dt;
    actor.vy+=GRAVITY*dt;
    actor.y+=actor.vy*dt;
    updateDefeatBursts(dt);
    if(actor.hurtTime<=0)restartCheckpoint();
    return;
  }
  if(state!=='playing')return;
  updateMovingPlatforms(dt);
  const input=inputState(controller);
  if(updateFountainRoom(dt,input,controllers)){justPressed.clear();return;}
  updatePlayerStance(input,dt);
  const wasTop=player.y,wasBottom=player.y+player.h;
  player.animationTime+=dt;
  player.coyote=Math.max(0,player.coyote-dt);
  player.jumpBuffer=Math.max(0,player.jumpBuffer-dt);
  player.dashCooldown=Math.max(0,player.dashCooldown-dt);
  player.shootCooldown=Math.max(0,player.shootCooldown-dt);
  player.shootPoseTime=Math.max(0,player.shootPoseTime-dt);
  player.hurtTime=Math.max(0,player.hurtTime-dt);
  player.itemUseTime=Math.max(0,(player.itemUseTime||0)-dt);updateItemBuffs(player,dt);updateActorMagic(player,dt);
  if(input.jump)player.jumpBuffer=.13;

  if(input.cycleWeapon)cycleOwnedWeapon(1,player);
  if(input.useItem)useNextShopItem(player);

  const inputDirection=(input.right?1:0)-(input.left?1:0);
  const direction=player.stance==='stand'?inputDirection:0;
  const stats=characterStats(player);
  if(inputDirection)player.facing=inputDirection;
  const previousMoveIntent=player.moveIntent;
  player.moveIntent=direction;
  if(direction&&direction!==previousMoveIntent)player.walkTime=0;
  if(input.dash&&player.dashCooldown<=0&&player.stance==='stand'){
    player.dashTime=stats.dashDuration||.16;player.dashCooldown=.85;player.dashToken++;player.vx=player.facing*(stats.dashSpeed||820)*stats.dashMultiplier;player.vy=0;
    playSound('dash');
  }
  if(player.dashTime>0){
    player.dashTime-=dt;
    player.vx=player.facing*(stats.dashSpeed||820)*stats.dashMultiplier;
  }else{
    const target=direction*310*stats.moveMultiplier;
    player.vx+=(target-player.vx)*Math.min(1,dt*(direction?13:9));
    if(player.stance!=='stand')player.vx=0;
    player.vy=Math.min(980,player.vy+GRAVITY*dt);
  }
  if(player.jumpBuffer>0&&player.stance==='stand'&&(player.onGround||player.coyote>0)){
    player.vy=-Math.max(750,790*stats.jumpMultiplier);player.onGround=false;player.coyote=0;player.jumpBuffer=0;
    playSound('jump');
  }
  if(!input.jumpHeld&&player.vy< -240)player.vy+=GRAVITY*1.45*dt;
  if(player.stance==='stand'&&player.onGround&&(direction||Math.abs(player.vx)>25))player.walkTime+=dt*(.8+Math.min(1,Math.abs(player.vx)/310)*.35);
  else if(!direction)player.walkTime=0;

  if(input.shoot)shoot();
  if(player.stance!=='stand')player.vx=0;

  const previousX=player.x;
  const playerBounds=actorHorizontalMovementBounds(player);
  player.x=clamp(player.x+player.vx*dt,playerBounds.left,playerBounds.right);
  resolvePlatformSides(player,previousX);
  player.y+=player.vy*dt;
  player.onGround=false;
  if(player.vy>=0){
    const newBottom=player.y+player.h;
    const footLeft=player.x+11,footRight=player.x+player.w-11;
    let landing=null;
    for(const platform of platforms){
      if(footRight<=platform.collisionLeft||footLeft>=platform.collisionRight)continue;
      if(wasBottom<=platform.surfaceY+platform.landingTolerance&&newBottom>=platform.surfaceY){
        if(!landing||platform.surfaceY<landing.surfaceY)landing=platform;
      }
    }
    if(landing){player.y=landing.surfaceY-player.h;player.vy=0;player.onGround=true;player.coyote=.11;}
  }else{
    const headLeft=player.x+12,headRight=player.x+player.w-12;
    let ceiling=null;
    for(const platform of platforms){
      if(platform.ground||headRight<=platform.collisionLeft||headLeft>=platform.collisionRight)continue;
      if(wasTop>=platform.undersideY-platform.landingTolerance&&player.y<=platform.undersideY){
        if(!ceiling||platform.undersideY>ceiling.undersideY)ceiling=platform;
      }
    }
    if(ceiling){player.y=ceiling.undersideY;player.vy=0;}
  }

  if(player.y+player.h>=VIEW_H-2){fallFromWorld(player);justPressed.clear();return;}
  if(updateCheckpoints()){justPressed.clear();return;}
  updateBullets(dt);
  updateWallImpacts(dt);
  partners.forEach((actor,index)=>updatePartner(actor,dt,partnerInputState(controllers[index+1],index+1)));
  updateBossArenaFountain(dt);
  updateExitSpikes(dt);
  updateMeleeAttacks();
  updateEnemies(dt);
  updateEnemyShots(dt);
  updateBossWaves(dt);
  updateCoinDrops(dt);
  updateBossFlow(dt);
  updateDefeatBursts(dt);
  if(player.onGround&&player.stance==='stand'&&!player.moveIntent&&Math.abs(player.vx)<=25)player.idleTime+=dt;
  else player.idleTime=0;

  const localActors=[player,...partners],targetCamera=partyCameraTarget(localActors);
  cameraX+=(targetCamera-cameraX)*Math.min(1,dt*7);
  updateHud();
  justPressed.clear();
}

function updatePartner(actor,dt,input){
  updateActorStance(actor,input,dt);
  const wasTop=actor.y,wasBottom=actor.y+actor.h;
  actor.animationTime+=dt;
  actor.coyote=Math.max(0,actor.coyote-dt);actor.jumpBuffer=Math.max(0,actor.jumpBuffer-dt);
  actor.dashCooldown=Math.max(0,actor.dashCooldown-dt);actor.shootCooldown=Math.max(0,actor.shootCooldown-dt);actor.shootPoseTime=Math.max(0,actor.shootPoseTime-dt);
  actor.hurtTime=Math.max(0,actor.hurtTime-dt);
  actor.itemUseTime=Math.max(0,(actor.itemUseTime||0)-dt);updateItemBuffs(actor,dt);updateActorMagic(actor,dt);
  if(input.jump)actor.jumpBuffer=.13;
  if(input.cycleWeapon)cycleOwnedWeapon(1,actor);
  if(input.useItem)useNextShopItem(actor);
  const inputDirection=(input.right?1:0)-(input.left?1:0);
  const direction=actor.stance==='stand'?inputDirection:0;
  const stats=characterStats(actor);
  if(inputDirection)actor.facing=inputDirection;
  const previousMoveIntent=actor.moveIntent;actor.moveIntent=direction;
  if(direction&&direction!==previousMoveIntent)actor.walkTime=0;
  if(input.dash&&actor.dashCooldown<=0&&actor.stance==='stand'){
    actor.dashTime=stats.dashDuration||.16;actor.dashCooldown=.85;actor.dashToken++;actor.vx=actor.facing*(stats.dashSpeed||820)*stats.dashMultiplier;actor.vy=0;
    playSound('dash');
  }
  if(actor.dashTime>0){actor.dashTime-=dt;actor.vx=actor.facing*(stats.dashSpeed||820)*stats.dashMultiplier;}
  else{
    const target=direction*310*stats.moveMultiplier;
    actor.vx+=(target-actor.vx)*Math.min(1,dt*(direction?13:9));
    if(actor.stance!=='stand')actor.vx=0;
    actor.vy=Math.min(980,actor.vy+GRAVITY*dt);
  }
  if(actor.jumpBuffer>0&&actor.stance==='stand'&&(actor.onGround||actor.coyote>0)){
    actor.vy=-Math.max(750,790*stats.jumpMultiplier);actor.onGround=false;actor.coyote=0;actor.jumpBuffer=0;
    playSound('jump');
  }
  if(!input.jumpHeld&&actor.vy< -240)actor.vy+=GRAVITY*1.45*dt;
  if(actor.stance==='stand'&&actor.onGround&&(direction||Math.abs(actor.vx)>25))actor.walkTime+=dt*(.8+Math.min(1,Math.abs(actor.vx)/310)*.35);
  else if(!direction)actor.walkTime=0;
  if(input.shoot)shootActor(actor);
  if(actor.stance!=='stand')actor.vx=0;
  const previousX=actor.x;
  const actorBounds=actorHorizontalMovementBounds(actor);
  actor.x=clamp(actor.x+actor.vx*dt,actorBounds.left,actorBounds.right);resolvePlatformSides(actor,previousX);actor.y+=actor.vy*dt;actor.onGround=false;
  if(actor.vy>=0){
    const newBottom=actor.y+actor.h,footLeft=actor.x+11,footRight=actor.x+actor.w-11;
    let landing=null;
    for(const platform of platforms){
      if(footRight<=platform.collisionLeft||footLeft>=platform.collisionRight)continue;
      if(wasBottom<=platform.surfaceY+platform.landingTolerance&&newBottom>=platform.surfaceY&&(!landing||platform.surfaceY<landing.surfaceY))landing=platform;
    }
    if(landing){actor.y=landing.surfaceY-actor.h;actor.vy=0;actor.onGround=true;actor.coyote=.11;}
  }else{
    const headLeft=actor.x+12,headRight=actor.x+actor.w-12;let ceiling=null;
    for(const platform of platforms){
      if(platform.ground||headRight<=platform.collisionLeft||headLeft>=platform.collisionRight)continue;
      if(wasTop>=platform.undersideY-platform.landingTolerance&&actor.y<=platform.undersideY&&(!ceiling||platform.undersideY>ceiling.undersideY))ceiling=platform;
    }
    if(ceiling){actor.y=ceiling.undersideY;actor.vy=0;}
  }
  if(actor.y+actor.h>=VIEW_H-2)fallFromWorld(actor);
  if(actor.onGround&&actor.stance==='stand'&&!actor.moveIntent&&Math.abs(actor.vx)<=25)actor.idleTime+=dt;else actor.idleTime=0;
}

function projectileOwner(actor){return `p${Math.max(1,(actor?.playerIndex||0)+1)}`;}

function activeWizardFireballs(actor=player){
  const owner=projectileOwner(actor);
  return(bullets||[]).filter(bullet=>bullet.wizardFireball&&bullet.owner===owner&&bullet.life>0).length;
}

function updateActorMagic(actor,dt){
  if(!actor||actor.characterId!=='kid')return 0;
  actor.maxMagic=WIZARD_MAGIC.max;actor.magic=clamp(Number.isFinite(actor.magic)?actor.magic:actor.maxMagic,0,actor.maxMagic);
  actor.magicRegenDelay=0;actor.magicPickupTime=Math.max(0,(actor.magicPickupTime||0)-dt);
  return actor.magic;
}

function updateBossArenaFountain(dt){
  if(!bossArenaActive||!bossFountain)return false;
  bossFountain.guardCooldown=Math.max(0,(bossFountain.guardCooldown||0)-dt);
  bossFountain.warningTime=Math.max(0,(bossFountain.warningTime||0)-dt);
  bossFountain.hitFlash=Math.max(0,(bossFountain.hitFlash||0)-dt);
  const blockedBefore=bossFountain.disabledTime||0;
  bossFountain.disabledTime=Math.max(0,blockedBefore-dt);
  const refillTime=Math.max(0,dt-blockedBefore);
  if(refillTime<=0||bossFountain.water<=0)return false;
  let restored=false;
  for(const actor of[player,...partners].filter(Boolean)){
    const center=actor.x+actor.w/2,near=Math.abs(center-bossFountain.x)<=bossFountain.range&&actor.y+actor.h>=bossFountain.surfaceY-24;
    if(actor.characterId!=='kid'||!near||actor.magic>=actor.maxMagic)continue;
    const before=actor.magic,amount=Math.min(actor.maxMagic-before,bossFountain.water,bossFountain.restoreRate*refillTime);
    actor.magic+=amount;bossFountain.water=Math.max(0,bossFountain.water-amount);actor.magicPickupTime=.3;restored=restored||amount>0;
    if(before<=0&&actor.magic>0)playSound('magic');
    if(bossFountain.water<=0)break;
  }
  return restored;
}

function shootActor(actor){
  if(actor.shootCooldown>0||actor.dashTime>0)return false;
  const stats=characterStats(actor),profile=stats.weaponProfile,definition=profile||stats,condition=weaponConditionFor(actor);
  const magicWeapon=definition.resource==='magic',ammoWeapon=definition.resource==='ammo',magicCost=definition.magicCost||WIZARD_MAGIC.cost;
  const wizardFireball=actor.characterId==='kid'&&magicWeapon,maxProjectiles=definition.maxProjectiles||stats.maxProjectiles||3;
  const depleted=(condition&&condition.durability<=0)||(magicWeapon&&(actor.magic??WIZARD_MAGIC.max)<magicCost)||(ammoWeapon&&(!condition||condition.ammo<=0));
  if(depleted)return startBossFallbackAttack(actor);
  if(condition&&condition.durability<=0)return false;
  if(wizardFireball&&activeWizardFireballs(actor)>=maxProjectiles)return false;
  if(magicWeapon&&(actor.magic??WIZARD_MAGIC.max)<magicCost)return false;
  if(ammoWeapon&&(!condition||condition.ammo<=0))return false;
  actor.shootCooldown=stats.fireCooldown;actor.shootPoseTime=stats.attackDuration;actor.shotCount++;
  if(condition){condition.durability=Math.max(0,condition.durability-1);if(ammoWeapon)condition.ammo=Math.max(0,condition.ammo-1);}
  if(magicWeapon){actor.maxMagic=WIZARD_MAGIC.max;actor.magic=Math.max(0,(actor.magic??actor.maxMagic)-magicCost);}
  if(stats.meleeDamage){actor.vx+=actor.facing*42;playSound('melee');updateLoadoutHud();return true;}
  const muzzle=muzzlePosition(actor);
  const owner=projectileOwner(actor);
  const count=profile?.count||1,spread=profile?.spread||0,size=profile?.size||stats.projectileSize||34,weaponId=currentWeaponId(actor);
  const projectileCut=Number.isInteger(profile?.projectileArtIndex)?CLASS_PROJECTILE_CUTS[profile.projectileArtIndex]:null;
  const projectileWidth=projectileCut?size*1.4:size,projectileHeight=projectileCut?projectileWidth*projectileCut[3]/projectileCut[2]:(profile||wizardFireball)?size*.7:24;
  for(let shot=0;shot<count;shot++){
    const offset=count===1?0:(shot-(count-1)/2)*spread;
    const projectile=profile?.projectile||stats.projectile||'ink';
    bullets.push({x:muzzle.x,y:muzzle.y,vx:actor.facing*stats.bulletSpeed*Math.cos(offset),vy:stats.bulletSpeed*Math.sin(offset),gravity:profile?.gravity||0,w:projectileWidth,h:projectileHeight,life:profile?.life||stats.projectileLife||1.65,damage:stats.bulletDamage,characterId:actor.characterId,owner,weaponId,projectile,projectileArtIndex:profile?.projectileArtIndex,wizardFireball,pierce:profile?.pierce||0,spin:(shot%2?1:-1)*(projectile==='star'?5:0),rotation:offset,hitEnemies:new Set()});
  }
  playSound(wizardFireball||profile?.projectile==='fire'?'fire':'shoot');
  updateLoadoutHud();updateMagicHud();
  return true;
}

function startBossFallbackAttack(actor){
  const stats=characterStats(actor),profile=stats.weaponProfile,definition=profile||stats,magicWeapon=definition.resource==='magic';
  const ranged=stats.bulletSpeed>0&&!stats.meleeDamage&&!magicWeapon;
  actor.shootCooldown=BOSS_FAIRNESS.fallbackCooldown;
  actor.shootPoseTime=BOSS_FAIRNESS.fallbackDuration;
  actor.shotCount++;
  actor.bossFallbackShot=actor.shotCount;
  if(ranged){
    const muzzle=muzzlePosition(actor),owner=projectileOwner(actor),projectile=profile?.projectile||(actor.characterId==='kid'?'fire':'ink'),projectileArtIndex=profile?.projectileArtIndex;
    const size=28,cut=Number.isInteger(projectileArtIndex)?CLASS_PROJECTILE_CUTS[projectileArtIndex]:null,width=cut?size*1.4:size,height=cut?width*cut[3]/cut[2]:size*.7;
    bullets.push({x:muzzle.x,y:muzzle.y,vx:actor.facing*Math.max(560,(stats.bulletSpeed||700)*.72),vy:0,gravity:0,w:width,h:height,life:1.15,damage:BOSS_FAIRNESS.fallbackDamage,characterId:actor.characterId,owner,weaponId:currentWeaponId(actor),projectile,projectileArtIndex,wizardFireball:false,pierce:0,spin:0,rotation:0,fallback:true,hitEnemies:new Set()});
    playSound(projectile==='fire'?'fire':'shoot');
  }else{
    actor.vx+=actor.facing*30;
    playSound('melee');
  }
  updateLoadoutHud();updateMagicHud();
  return true;
}

function shoot(){shootActor(player);}

function muzzlePosition(actor=player){
  if(actor.characterId==='goat'){
    const [forward,down]=actor.stance==='duck'?[54,36]:!actor.onGround?[55,48]:[50,54];
    return{x:actor.x+actor.w/2+actor.facing*forward,y:actor.y+down};
  }
  const [forward,down]=actor.stance==='duck'?[61,25]:!actor.onGround&&actor.vy<0?[62,20]:!actor.onGround?[55,47]:Math.abs(actor.vx)>25?[58,31]:[42,32];
  return{x:actor.x+actor.w/2+actor.facing*forward,y:actor.y+down};
}

function enterFountainChamber(sourceActor=player){
  if(fountainRoomActive||!fountainEntrance||customMapActive||bossArenaActive||shopSceneActive)return false;
  ensureImage(assets.magicFountain).then(()=>{if(fountainRoomActive)draw();});
  fountainSnapshot={
    activeWorldWidth,cameraX,groundSegments,floatingPlatforms,platforms,spikes,traps,props,enemies,bullets,enemyShots,coinDrops,wallImpacts,defeatBursts,exitSpikes,
    entrance:{...fountainEntrance}
  };
  fountainRoomActive=true;fountainClimb=null;fountainUseTime=0;activeWorldWidth=VIEW_W;cameraX=0;
  groundSegments=[[145,1135]];floatingPlatforms=[];
  platforms=[
    {x:145,y:610,w:990,h:170,type:0,ground:true,surfaceY:630,undersideY:VIEW_H+170,collisionLeft:158,collisionRight:1122,sideLeft:158,sideRight:1122,sideTopInset:0,landingTolerance:4,fountainFloor:true},
    {x:115,y:0,w:43,h:720,type:0,ground:false,surfaceY:0,undersideY:720,collisionLeft:115,collisionRight:158,sideLeft:115,sideRight:158,sideTopInset:0,landingTolerance:0,hidden:true,fountainWall:true},
    {x:1122,y:0,w:43,h:720,type:0,ground:false,surfaceY:0,undersideY:720,collisionLeft:1122,collisionRight:1165,sideLeft:1122,sideRight:1165,sideTopInset:0,landingTolerance:0,hidden:true,fountainWall:true}
  ];
  spikes=[];traps=[];props=[];enemies=[];bullets=[];enemyShots=[];coinDrops=[];wallImpacts=[];defeatBursts=[];exitSpikes=null;
  const actors=[player,...partners];
  const sourceIndex=Math.max(0,actors.indexOf(sourceActor));
  actors.forEach((actor,index)=>{
    actor.w=52;actor.h=88;actor.stance='stand';actor.rStance='stand';actor.stanceVisual=0;actor.x=clamp(430+(index-sourceIndex)*72,190,1040);actor.y=-actor.h-index*22;actor.vx=0;actor.vy=330+index*35;actor.onGround=false;actor.coyote=0;actor.jumpBuffer=0;actor.dashTime=0;actor.shootPoseTime=0;actor.moveIntent=0;
  });
  playSound('transition');
  return true;
}

function leaveFountainChamber(){
  if(!fountainRoomActive||!fountainSnapshot)return false;
  const saved=fountainSnapshot,entrance=saved.entrance;
  ({activeWorldWidth,cameraX,groundSegments,floatingPlatforms,platforms,spikes,traps,props,enemies,bullets,enemyShots,coinDrops,wallImpacts,defeatBursts,exitSpikes}=saved);
  fountainRoomActive=false;fountainSnapshot=null;fountainClimb=null;fountainEntrance=entrance;fountainUseTime=0;
  const returnBase=safeGroundX(entrance.gapX-74);
  [player,...partners].forEach((actor,index)=>{
    actor.w=52;actor.h=88;actor.stance='stand';actor.rStance='stand';actor.stanceVisual=0;const x=safeGroundX(returnBase-index*62);actor.x=x-actor.w/2;actor.y=groundSurfaceAt(x)-actor.h;actor.vx=0;actor.vy=0;actor.onGround=true;actor.coyote=.15;actor.jumpBuffer=0;actor.moveIntent=0;actor.spawnProtection=Math.max(actor.spawnProtection||0,.45);
  });
  cameraX=clamp(returnBase-VIEW_W*.38,0,Math.max(0,activeWorldWidth-VIEW_W));
  playSound('transition');updateHud();
  return true;
}

function updateFountainRoom(dt,primaryInput,controllers=[]){
  if(!fountainRoomActive)return false;
  fountainUseTime+=dt;
  const actors=[player,...partners];
  for(const actor of actors){
    const nearFountain=Math.abs(actor.x+actor.w/2-VIEW_W/2)<174&&actor.y+actor.h>500;
    if(actor.characterId==='kid'&&nearFountain&&actor.magic<actor.maxMagic){
      const before=actor.magic;actor.magic=Math.min(actor.maxMagic,actor.magic+720*dt);actor.magicPickupTime=.3;
      if(before<=0&&actor.magic>0)playSound('magic');
    }
  }
  if(fountainClimb){
    fountainClimb.time+=dt;
    const progress=clamp(fountainClimb.time/1.05,0,1),climber=fountainClimb.actor;
    climber.x=VIEW_W/2-climber.w/2;climber.y=(630-climber.h)-(710*progress);climber.vx=0;climber.vy=0;climber.onGround=false;climber.moveIntent=0;climber.animationTime+=dt;climber.walkTime+=dt*1.4;
    if(progress>=1)leaveFountainChamber();
    return true;
  }
  const inputs=[primaryInput,...partners.map((actor,index)=>partnerInputState(controllers[index+1]||{},index+1))];
  const climber=actors.find((actor,index)=>Math.abs(actor.x+actor.w/2-VIEW_W/2)<66&&actor.y+actor.h>500&&(inputs[index]?.jump||inputs[index]?.up));
  if(climber){
    setActorStance(climber,'stand');fountainClimb={actor:climber,time:0};playSound('magic');return true;
  }
  updateMagicHud();
  return false;
}

function updateCheckpoints(){
  if(fountainRoomActive)return false;
  const actors=[player,...partners],leadX=Math.max(...actors.map(actor=>actor.x+actor.w/2));
  if(customMapActive){
    if(leadX>=customMap.goal.x-45){finish(true);return true;}
    return false;
  }
  const level=levelData(),goalX=level.goalX??level.width-145;
  if(stageBoss?.status==='waiting'){
    if(stageBoss.enabled){
      const everyoneWalkedOff=actors.every(actor=>actor.x>=activeWorldWidth+55);
      if(everyoneWalkedOff)return openShop(true);
    }else if(leadX>=goalX-190)return openShop(true);
  }
  if(level.exit==='down')return false;
  if(stageBoss?.status==='cleared'&&leadX>=goalX-45)return currentLevel===LEVELS.length-1?(finish(true),true):advanceLevel();
  return false;
}

function fallFromWorld(actor=player){
  if(state!=='playing')return;
  if(fountainRoomActive){
    actor.x=VIEW_W/2-actor.w/2;actor.y=80;actor.vx=0;actor.vy=280;actor.onGround=false;return;
  }
  const level=customMapActive?null:levelData(),centerX=actor.x+actor.w/2;
  const gap=level&&levelGroundGaps(level).find(entry=>centerX>=entry.x&&centerX<=entry.end);
  if(gap?.fountain&&fountainEntrance){enterFountainChamber(actor);return;}
  if(gap?.drop&&stageBoss?.status==='cleared'&&currentLevel<LEVELS.length-1){beginDownTransition(currentLevel+1,actor);return;}
  actor.hp=0;
  beginDefeat(actor);
}

function updateExitSpikes(dt){
  const level=customMapActive?null:levelData();
  if(!level||level.exit!=='down'||!exitSpikes)return;
  const actors=[player,...partners].filter(actor=>actor.hp>0),triggerX=level.goalX+54;
  if(exitSpikes.time<0&&actors.some(actor=>actor.x+actor.w/2>=triggerX))exitSpikes.time=0;
  if(exitSpikes.time<0)return;
  exitSpikes.time+=dt;
  if(exitSpikes.time<.18)return;
  const victim=actors.find(actor=>actor.x+actor.w/2>=triggerX-8&&actor.y+actor.h>=groundSurfaceAt(actor.x+actor.w/2)-18);
  if(victim&&state==='playing'){victim.hp=0;beginDefeat(victim);updateHud();}
}

function updateBossFlow(dt){
  if(stageBoss?.status!=='defeated')return;
  bossClearTimer-=dt;
  if(!coinDrops.length)bossClearTimer=Math.min(bossClearTimer,.45);
  if(bossClearTimer<=0){stageBoss.status='cleared';bossArenaActive=false;shopSceneActive=false;arenaTransition=null;currentLevel===LEVELS.length-1?finish(true):advanceLevel();}
}

function hurtPlayer(direction=1){
  hurtActor(player,direction);
}

function hurtActor(actor,direction=1){
  if(state!=='playing'||actor.hp<=0)return;
  actor.rStance='stand';actor.stanceVisual=0;setActorStance(actor,'stand');
  actor.hp=0;actor.hurtTime=.34;actor.vx=direction*380;actor.vy=-360;playSound('hurt');
  beginDefeat(actor);
}

function respawnPartner(actor){
  if(!partners.includes(actor)||state!=='playing')return;
  actor.hp=0;beginDefeat(actor);
}

function beginDefeat(actor=player){
  defeatedActor=actor;state='dying';actor.hurtTime=1.1;actor.vx=0;actor.vy=-180;
}

function sweptHorizontalDistance(bullet,startX,endX,box){
  const halfW=bullet.w/2,halfH=bullet.h/2;
  if(bullet.y+halfH<box.y||bullet.y-halfH>box.y+box.h)return Infinity;
  if(bullet.vx>=0){
    const start=startX+halfW,end=endX+halfW;
    if(start>box.x+box.w||end<box.x)return Infinity;
    return Math.max(0,box.x-start);
  }
  const start=startX-halfW,end=endX-halfW;
  if(start<box.x||end>box.x+box.w)return Infinity;
  return Math.max(0,start-(box.x+box.w));
}

function enemyShapeIntersectsRect(shape,rect){
  if(!shape||!rect)return false;
  if(shape.shape!=='ellipse')return overlap(shape,rect);
  const closestX=clamp(shape.cx,rect.x,rect.x+rect.w),closestY=clamp(shape.cy,rect.y,rect.y+rect.h);
  const dx=(closestX-shape.cx)/Math.max(1,shape.rx),dy=(closestY-shape.cy)/Math.max(1,shape.ry);
  return dx*dx+dy*dy<=1;
}

function sweptHorizontalEnemyDistance(bullet,startX,endX,shape){
  if(shape.shape!=='ellipse')return sweptHorizontalDistance(bullet,startX,endX,shape);
  const rx=shape.rx+bullet.w/2,ry=shape.ry+bullet.h/2,dy=bullet.y-shape.cy;
  if(Math.abs(dy)>ry)return Infinity;
  const halfChord=rx*Math.sqrt(Math.max(0,1-dy*dy/(ry*ry))),left=shape.cx-halfChord,right=shape.cx+halfChord;
  if(bullet.vx>=0){
    if(startX>right||endX<left)return Infinity;
    return Math.max(0,left-startX);
  }
  if(startX<left||endX>right)return Infinity;
  return Math.max(0,startX-right);
}

function enemyHitbox(enemy){
  if(enemy.type==='bossOgre')return ogreHitbox(enemy);
  const def=ENEMY_DEFS[enemy.type]||ENEMY_DEFS.ghost,[scaleX,scaleY]=def.hitbox||[.78,.78];
  const w=enemy.w*scaleX,h=enemy.h*scaleY;
  const x=enemy.x-w/2,y=def.airborne?enemy.y-h/2:enemy.y+enemy.h/2-h;
  return{x,y,w,h,shape:'ellipse',cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2};
}

function ogreHitbox(enemy){
  const visual=ogreActionVisual(enemy),[left,top,right,bottom]=OGRE_INK_BOUNDS[visual.sheet][visual.frame],size=enemy.h*OGRE_DRAW_SCALE,scale=size/440;
  const drawLeft=enemy.x-size/2,drawTop=enemy.y+enemy.h/2+size*(21/440)-size,inkLeft=enemy.dir<0?440-right:left;
  const inkW=(right-left)*scale,inkH=(bottom-top)*scale,w=inkW*OGRE_HITBOX_WIDTH_RATIO;
  const x=drawLeft+(inkLeft+(right-left)/2)*scale-w/2,y=drawTop+(top+(bottom-top)*OGRE_HITBOX_TOP_RATIO)*scale,h=inkH*(1-OGRE_HITBOX_TOP_RATIO-OGRE_HITBOX_BOTTOM_RATIO);
  return{x,y,w,h,shape:'ellipse',cx:x+w/2,cy:y+h/2,rx:w/2,ry:h/2};
}

function actorStompsEnemy(actor,box,dt){
  if(!actor||actor.vy<=40)return false;
  const feet=actor.y+actor.h,previousFeet=feet-actor.vy*dt,headDepth=Math.min(46,Math.max(15,box.h*.32));
  const feetOverlap=actor.x+actor.w-5>box.x&&actor.x+5<box.x+box.w;
  return feetOverlap&&previousFeet<=box.y+headDepth&&feet>=box.y-2&&feet<=box.y+headDepth;
}

function bounceFromEnemy(actor,box){
  actor.y=box.y-actor.h-1;actor.vy=-560;actor.onGround=false;actor.coyote=0;actor.jumpBuffer=0;
}

function spawnEnemyCoins(enemy,pickupDelay=0){
  const total=enemyCoinReward(enemy),size=enemy.boss?84:68;
  coinDrops.push({
    x:enemy.x,y:enemy.y-enemy.h*.08,vx:enemy.dir?enemy.dir*48:0,vy:enemy.boss?-390:-315,
    w:size,h:size,value:total,life:Infinity,phase:0,onGround:false,giant:true,pickupDelay
  });
}

function enemyCoinReward(enemy){
  const def=ENEMY_DEFS[enemy?.type]||ENEMY_DEFS.ghost,partyScale=clamp(enemy?.partyScale||1,1,4),soloMaxHp=Math.max(1,enemy?.soloMaxHp||Math.round((enemy?.maxHp||1)/partyScale)),level=Math.max(0,currentLevel);
  if(enemy?.boss)return Math.round((220+soloMaxHp*2+level*45)/5)*5*partyScale;
  const toughness=10+soloMaxHp*7+level*6+def.score/50;
  return (Math.max(10,Math.round(toughness/5)*5)+runUpgrades.magnet*2)*partyScale;
}

function updateCoinDrops(dt){
  const actors=[player,...partners].filter(actor=>actor&&actor.hp>0);
  for(const coin of coinDrops){
    coin.phase+=dt;coin.pickupDelay=Math.max(0,(coin.pickupDelay||0)-dt);
    const nearest=actors.reduce((best,actor)=>{
      const dx=actor.x+actor.w/2-coin.x,dy=actor.y+actor.h/2-coin.y,distance=Math.hypot(dx,dy);
      return !best||distance<best.distance?{actor,dx,dy,distance}:best;
    },null);
    const accessoryMagnet=equippedShopItem('accessory')?.bonuses?.magnet||0;
    const actorMagnet=Math.max(0,...actors.map(actor=>activeItemBuff(actor,'magnet')));
    const magnetRange=66+(runUpgrades.magnet+accessoryMagnet+actorMagnet)*36;
    if(nearest&&nearest.distance<magnetRange*2.2){
      const pull=nearest.distance<magnetRange?15:5.5;
      coin.vx+=nearest.dx*pull*dt;coin.vy+=nearest.dy*pull*dt;
    }
    const previousBottom=coin.y+coin.h/2;
    coin.vy=Math.min(760,coin.vy+GRAVITY*.72*dt);coin.x+=coin.vx*dt;coin.y+=coin.vy*dt;
    const newBottom=coin.y+coin.h/2,coinLeft=coin.x-coin.w*.34,coinRight=coin.x+coin.w*.34;
    let landing=null;
    if(coin.vy>=0){
      for(const platform of platforms){
        if(coinRight<=platform.collisionLeft||coinLeft>=platform.collisionRight)continue;
        if(previousBottom<=platform.surfaceY+(platform.landingTolerance||4)&&newBottom>=platform.surfaceY&&(!landing||platform.surfaceY<landing.surfaceY))landing=platform;
      }
    }
    coin.onGround=false;
    if(landing){coin.y=landing.surfaceY-coin.h/2;if(Math.abs(coin.vy)>75)coin.vy=-Math.abs(coin.vy)*.34;else{coin.vy=0;coin.onGround=true;}coin.vx*=.76;}
    if(coin.pickupDelay<=0&&nearest&&overlap({x:coin.x-coin.w/2,y:coin.y-coin.h/2,w:coin.w,h:coin.h},nearest.actor)){
      coin.collected=true;coins+=coin.value;score+=25*coin.value;playSound('coin');updateHud();
    }
  }
  coinDrops=coinDrops.filter(coin=>!coin.collected&&coin.y<VIEW_H+100);
}

function damageEnemy(enemy,damage=1,source='attack'){
  if(enemy.dead||enemy.invulnerable)return false;
  enemy.hp-=damage;enemy.hit=.18;
  if(enemy.hp<=0){
    const def=ENEMY_DEFS[enemy.type]||ENEMY_DEFS.ghost;
    enemy.dead=true;score+=def.score;
    spawnEnemyCoins(enemy,source==='stomp'?.45:0);
    defeatBursts.push({x:enemy.x,y:enemy.y,time:0});
    playSound(enemy.boss?'bossDefeat':'enemy');
    if(enemy.boss&&stageBoss?.enemy===enemy){stageBoss.status='defeated';bossClearTimer=4.5;enemyShots=[];}
    updateHud();
  }
  updateBossHud();
  return true;
}

function updateMeleeAttacks(){
  for(const actor of [player,...partners]){
    const baseStats=characterStats(actor),fallback=actor.bossFallbackShot===actor.shotCount&&actor.shootPoseTime>0;
    const stats=fallback?{...baseStats,attackDuration:BOSS_FAIRNESS.fallbackDuration,meleeDamage:BOSS_FAIRNESS.fallbackDamage,meleeReach:BOSS_FAIRNESS.fallbackReach,meleeKnockback:0}:baseStats;
    if(!stats.meleeDamage||actor.shootPoseTime<=0||actor.hurtTime>0)continue;
    const progress=1-actor.shootPoseTime/stats.attackDuration;
    if(progress<.28||progress>.78)continue;
    const hitbox=weaponMeleeHitbox(actor,stats);
    for(const enemy of enemies){
      if(enemy.dead||enemy.visible===false||enemy.invulnerable)continue;
      const enemyBox=enemyHitbox(enemy);
      if(!enemyShapeIntersectsRect(enemyBox,hitbox))continue;
      enemy.meleeHits??={};
      if(enemy.meleeHits[actor.playerIndex]===actor.shotCount)continue;
      enemy.meleeHits[actor.playerIndex]=actor.shotCount;
      damageEnemy(enemy,stats.meleeDamage);
      enemy.x+=actor.facing*(stats.meleeKnockback??18);
      if(actor.characterId==='monk'&&actor.shotCount%5===0&&actor.focusHealShot!==actor.shotCount){
        actor.focusHealShot=actor.shotCount;actor.hp=Math.min(actor.maxHp,actor.hp+1);
      }
    }
  }
}

function weaponMeleeHitbox(actor,stats=characterStats(actor)){
  const reach=stats.meleeReach||110,motion=stats.weaponProfile?.motion||'slash';
  let y=actor.y+4,height=actor.h-8,width=reach;
  if(motion==='stab'||motion==='thrust'){y=actor.y+actor.h*.2;height=actor.h*.46;}
  else if(motion==='chop'||motion==='smash'||motion==='bonk'){y=actor.y-12;height=actor.h+22;width=reach*.82;}
  else if(motion==='flail'){y=actor.y-18;height=actor.h+36;}
  else if(motion==='double'){y=actor.y-4;height=actor.h+8;}
  return{x:actor.facing>0?actor.x+actor.w-8:actor.x-width+8,y,w:width,h:height};
}

function updateBullets(dt){
  for(const bullet of bullets){
    const startX=bullet.x,endX=startX+bullet.vx*dt;
    bullet.life-=dt;bullet.vy=(bullet.vy||0)+(bullet.gravity||0)*dt;bullet.y+=(bullet.vy||0)*dt;bullet.rotation=(bullet.rotation||0)+(bullet.spin||0)*dt;
    let nearest={distance:Infinity,type:null,target:null};
    for(const platform of platforms){
      const box={x:platform.collisionLeft,y:platform.surfaceY,w:platform.collisionRight-platform.collisionLeft,h:platform.undersideY-platform.surfaceY};
      const distance=sweptHorizontalDistance(bullet,startX,endX,box);
      if(distance<nearest.distance)nearest={distance,type:'platform',target:platform};
    }
    for(const enemy of enemies){
      if(enemy.dead||enemy.visible===false||enemy.invulnerable||bullet.hitEnemies?.has(enemy))continue;
      const box=enemyHitbox(enemy);
      const distance=sweptHorizontalEnemyDistance(bullet,startX,endX,box);
      if(distance<nearest.distance)nearest={distance,type:'enemy',target:enemy};
    }
    const travel=Math.abs(endX-startX);
    if(nearest.distance<=travel){
      bullet.x=startX+Math.sign(bullet.vx||1)*nearest.distance;
      if(nearest.type==='enemy'){
        const target=nearest.target,frontBlocked=['snail','guard'].includes(target.type),blocked=frontBlocked&&Math.sign(bullet.vx||1)===-target.dir;
        if(blocked){bullet.life=0;wallImpacts.push({x:bullet.x,y:bullet.y,time:0,direction:-Math.sign(bullet.vx||1)});}
        else{
          damageEnemy(target,bullet.damage||1);bullet.hitEnemies?.add(target);
          if(bullet.pierce>0){bullet.pierce--;bullet.x=endX;}else bullet.life=0;
        }
      }else if(nearest.type==='platform'){
        bullet.life=0;
        const direction=Math.sign(bullet.vx||1);
        wallImpacts.push({x:bullet.x+direction*bullet.w/2,y:bullet.y,time:0,direction});
      }
    }else{
      bullet.x=endX;
    }
  }
  bullets=bullets.filter(b=>b.life>0&&b.x>=cameraX-100&&b.x<=cameraX+VIEW_W+200);
}

function updateWallImpacts(dt){
  for(const impact of wallImpacts)impact.time+=dt;
  wallImpacts=wallImpacts.filter(impact=>impact.time<.36);
}

function groundPlatformAt(x){return platforms.find(platform=>platform.ground&&x>=platform.collisionLeft&&x<=platform.collisionRight);}

function safeGroundX(desired){
  const x=clamp(desired,80,activeWorldWidth-80);
  if(groundPlatformAt(x))return x;
  const grounds=platforms.filter(platform=>platform.ground);
  if(!grounds.length)return x;
  let bestX=x,bestDistance=Infinity;
  for(const ground of grounds){
    const candidate=clamp(x,ground.collisionLeft+38,ground.collisionRight-38),distance=Math.abs(candidate-x);
    if(distance<bestDistance){bestX=candidate;bestDistance=distance;}
  }
  return bestX;
}

function resetEnemyPatrol(enemy){
  const patrol=155+currentLevel*12;
  enemy.left=clamp(enemy.x-patrol,0,activeWorldWidth-100);
  enemy.right=clamp(enemy.x+patrol,0,activeWorldWidth-100);
}

function setEnemyDirection(enemy,direction,force=false){
  const next=Math.sign(direction);if(!next||next===enemy.dir)return false;
  if(!force&&(enemy.turnCooldown>0||(enemy.blockedTime>0&&next===enemy.blockedDirection)))return false;
  enemy.dir=next;enemy.turnCooldown=force?.12:.22;return true;
}

function moveGroundEnemy(enemy,distance){
  const attemptedDirection=Math.sign(distance)||enemy.dir,rawX=enemy.x+distance;
  if(rawX<enemy.left||rawX>enemy.right){enemy.blockedDirection=attemptedDirection;enemy.blockedTime=.55;setEnemyDirection(enemy,-attemptedDirection,true);return false;}
  const nextX=clamp(rawX,enemy.left,enemy.right),ground=groundPlatformAt(nextX);
  if(!ground){
    const currentGround=groundPlatformAt(enemy.x);
    if(currentGround)enemy.y=currentGround.surfaceY-enemy.h/2;
    enemy.blockedDirection=attemptedDirection;enemy.blockedTime=.75;setEnemyDirection(enemy,-attemptedDirection,true);return false;
  }
  const nextSurface=ground.surfaceY,nextTop=nextSurface-enemy.h;
  const blocked=platforms.some(platform=>!platform.ground&&nextX+enemy.w/2>platform.collisionLeft&&nextX-enemy.w/2<platform.collisionRight&&nextSurface>platform.surfaceY&&nextTop<platform.undersideY);
  if(blocked){
    const currentGround=groundPlatformAt(enemy.x);
    if(currentGround)enemy.y=currentGround.surfaceY-enemy.h/2;
    enemy.blockedDirection=attemptedDirection;enemy.blockedTime=.75;setEnemyDirection(enemy,-attemptedDirection,true);return false;
  }
  enemy.x=nextX;enemy.y=nextSurface-enemy.h/2;return true;
}

function bossGroundY(enemy,x=enemy.x){
  const ground=groundPlatformAt(x);
  return (ground?.surfaceY??groundSurfaceAt(x))-enemy.h/2;
}

function snapBossToGround(enemy){
  if(!enemy?.boss||ENEMY_DEFS[enemy.type]?.airborne)return false;
  const halfWidth=enemy.w/2,left=Math.max(halfWidth,enemy.left??halfWidth),right=Math.min(activeWorldWidth-halfWidth,enemy.right??activeWorldWidth-halfWidth);
  enemy.x=clamp(enemy.x,left,Math.max(left,right));
  enemy.y=bossGroundY(enemy);
  enemy.vy=0;
  return true;
}

function enemyCanAttack(enemy,target,range=760){
  return target&&target.hp>0&&enemy.x>=cameraX-80&&enemy.x<=cameraX+VIEW_W+80&&target.x+target.w>=cameraX&&target.x<=cameraX+VIEW_W&&Math.abs(target.x-enemy.x)<=range;
}

function fireEnemyShot(enemy,target,{kind='ink',speed=290,spread=0,gravity=0,size=18,vx=null,vy=null}={}){
  if(!target)return;
  const targetX=target.x+target.w/2,targetY=target.y+target.h*.45,angle=Math.atan2(targetY-enemy.y,targetX-enemy.x)+spread;
  const projectileSize=size*1.4;
  enemyShots.push({x:enemy.x+enemy.dir*(enemy.w*.35),y:enemy.y-enemy.h*.1,vx:vx??Math.cos(angle)*speed,vy:vy??Math.sin(angle)*speed,gravity,w:projectileSize,h:projectileSize*.78,life:3,kind,phase:enemy.phase});
  enemy.attackCount++;
}

function bossActionFrame(enemy){
  const state=enemy.state,time=enemy.stateTime||0;
  if(state==='throwWindup'||state==='spreadWindup'||state==='rainWindup'){
    const duration=BOSS_BEHAVIORS[enemy.type]?.windups[state]??(state==='throwWindup'?.58:state==='spreadWindup'?.48:.56);
    return clamp(2+Math.floor((1-time/duration)*2),2,3);
  }
  if(state==='throwRelease'||state==='spreadRelease'||state==='rain')return 4;
  if(state==='jumpWindup'||state==='chargeWindup')return 5;
  if(state==='jump')return 6;
  if(state==='slam'||state==='charge')return 7;
  if(state==='recover')return clamp(8+Math.floor((1-time/.58)*2),8,9);
  return Math.floor(enemy.phase*5)%2;
}

function ogreActionVisual(enemy){
  if(enemy.state==='throwWindup')return{image:assets.bossOgreThrow,sheet:'throw',frame:clamp(Math.floor((1-enemy.stateTime/.58)*7),0,6)};
  if(enemy.state==='throwRelease')return{image:assets.bossOgreThrow,sheet:'throw',frame:clamp(7+Math.floor((1-enemy.stateTime/.24)*3),7,9)};
  if(enemy.state==='spreadWindup')return{image:assets.bossOgreThrow,sheet:'throw',frame:clamp(Math.floor((1-enemy.stateTime/.48)*7),0,6)};
  if(enemy.state==='spreadRelease')return{image:assets.bossOgreThrow,sheet:'throw',frame:clamp(7+Math.floor((1-enemy.stateTime/.32)*3),7,9)};
  if(enemy.state==='rainWindup')return{image:assets.bossOgreThrow,sheet:'throw',frame:clamp(Math.floor((1-enemy.stateTime/.56)*7),0,6)};
  if(enemy.state==='rain')return{image:assets.bossOgreThrow,sheet:'throw',frame:8+Math.floor(enemy.phase*8)%2};
  if(enemy.state==='jumpWindup')return{image:assets.bossOgreJump,sheet:'jump',frame:clamp(Math.floor((1-enemy.stateTime/.36)*3),0,2)};
  if(enemy.state==='jump')return{image:assets.bossOgreJump,sheet:'jump',frame:clamp(3+Math.floor((1-enemy.stateTime/1.5)*7),3,9)};
  if(enemy.state==='chargeWindup')return{image:assets.bossOgreJump,sheet:'jump',frame:clamp(Math.floor((1-enemy.stateTime/.42)*3),0,2)};
  if(enemy.state==='charge')return{image:assets.bossOgreSmash,sheet:'smash',frame:clamp(3+Math.floor((1-enemy.stateTime/.82)*7),3,9)};
  if(enemy.state==='slam')return{image:assets.bossOgreSmash,sheet:'smash',frame:clamp(Math.floor((1-enemy.stateTime/.78)*10),0,9)};
  if(enemy.state==='recover')return{image:assets.bossOgreRecover,sheet:'recover',frame:clamp(Math.floor((1-enemy.stateTime/.58)*10),0,9)};
  return{image:assets.bossOgrePatrol,sheet:'patrol',frame:Math.floor(enemy.phase*5)%10};
}

function bossActionAsset(type){
  return assets[`${type}Actions`]||assets.bossArt;
}

function releaseBossThrow(enemy,target){
  const settings={
    bossOgre:{kind:'bossRock',speed:330,gravity:470,size:38,vy:-230,vx:enemy.dir*330},
    bossGhost:{kind:'royalInk',speed:320,gravity:0,size:38},
    bossSerpent:{kind:'bossInk',speed:350,gravity:90,size:40},
    bossBeetle:{kind:'thornBall',speed:330,gravity:380,size:40,vy:-205,vx:enemy.dir*330},
    bossChest:{kind:'bossCoin',speed:345,gravity:410,size:42,vy:-220,vx:enemy.dir*345},
    bossWarden:{kind:'bossRock',speed:375,gravity:520,size:43,vy:-255,vx:enemy.dir*375},
    bossCrow:{kind:'royalInk',speed:390,gravity:45,size:34},
    bossWeaver:{kind:'bossInk',speed:365,gravity:130,size:38}
  }[enemy.type];
  playSound('bossAttack');
  fireEnemyShot(enemy,target,settings);
}

function releaseBossSpread(enemy,target){
  const settings={
    bossOgre:{kind:'bossRock',speed:285,gravity:150,size:36,count:3,arc:.28},
    bossGhost:{kind:'royalInk',speed:325,gravity:0,size:27,count:9,arc:.14},
    bossSerpent:{kind:'bossInk',speed:385,gravity:32,size:28,count:5,arc:.1},
    bossBeetle:{kind:'thornBall',speed:345,gravity:110,size:32,count:4,arc:.24},
    bossChest:{kind:'bossCoin',speed:330,gravity:70,size:30,count:8,arc:.14},
    bossWarden:{kind:'bossRock',speed:320,gravity:210,size:35,count:5,arc:.2},
    bossCrow:{kind:'royalInk',speed:385,gravity:10,size:27,count:7,arc:.13},
    bossWeaver:{kind:'bossInk',speed:360,gravity:55,size:29,count:6,arc:.16}
  }[enemy.type];
  playSound('bossAttack');
  for(let index=0;index<settings.count;index++){
    const spread=(index-(settings.count-1)/2)*settings.arc;
    fireEnemyShot(enemy,target,{kind:settings.kind,speed:settings.speed,spread,gravity:settings.gravity,size:settings.size});
  }
}

function releaseBossRain(enemy,target){
  const settings={
    bossOgre:{kind:'bossRock',gravity:610,size:35,drift:0,lanes:[-210,130,-45,225,-150]},
    bossGhost:{kind:'royalInk',gravity:430,size:27,drift:70,lanes:[-300,270,-190,160,-70,60,225]},
    bossSerpent:{kind:'bossInk',gravity:560,size:29,drift:-55,lanes:[-150,150,-75,75,0]},
    bossBeetle:{kind:'thornBall',gravity:700,size:33,drift:25,lanes:[-240,240,-120,120,0]},
    bossChest:{kind:'bossCoin',gravity:570,size:30,drift:-20,lanes:[-280,220,-180,120,-80,20,280]},
    bossWarden:{kind:'bossRock',gravity:680,size:36,drift:12,lanes:[-250,190,-120,60,255]},
    bossCrow:{kind:'royalInk',gravity:490,size:27,drift:85,lanes:[-300,280,-200,180,-100,80,0]},
    bossWeaver:{kind:'bossInk',gravity:610,size:30,drift:-35,lanes:[-270,230,-150,110,-40,40]}
  }[enemy.type];
  const lanes=settings.lanes,index=enemy.rainIndex++%lanes.length;
  const x=clamp(target.x+target.w/2+lanes[index],55,activeWorldWidth-55),projectileSize=settings.size*1.4;
  enemyShots.push({x,y:32-(index%2)*32,vx:settings.drift,vy:80,gravity:settings.gravity,w:projectileSize,h:projectileSize*.78,life:3,kind:settings.kind,phase:enemy.phase+index*.4});
  enemy.attackCount++;
}

function releaseBossSlam(enemy){
  const surfaceY=groundSurfaceAt(enemy.x);
  playSound('bossAttack');
  bossWaves.push({x:enemy.x,y:surfaceY,surfaceY,time:0,duration:.72,hitPlayers:new Set()});
}

function bossWaveGeometry(wave){
  const progress=clamp(wave.time/wave.duration,0,1),frame=Math.min(9,Math.floor(progress*10));
  const [sx,sy,sw,sh]=BOSS_WAVE_CUTS[frame],surfaceY=wave.surfaceY??wave.y;
  const drawW=520,drawH=drawW*sh/sw,halfWidth=40+progress*245;
  return{progress,frame,sx,sy,sw,sh,drawW,drawH,surfaceY,
    drawX:wave.x-drawW/2,drawY:surfaceY-drawH,
    hitbox:{x:wave.x-halfWidth,y:surfaceY-50,w:halfWidth*2,h:54}};
}

function updateBossWaves(dt){
  for(const wave of bossWaves){
    wave.time+=dt;const box=bossWaveGeometry(wave).hitbox;
    [player,...partners].forEach((actor,index)=>{
      if(actor.hp<=0||wave.hitPlayers.has(index)||!overlap(actor,box))return;
      wave.hitPlayers.add(index);hurtActor(actor,actor.x+actor.w/2<wave.x?-1:1);
    });
  }
  bossWaves=bossWaves.filter(wave=>wave.time<wave.duration);
}

function finishBossAttack(enemy){
  const behavior=BOSS_BEHAVIORS[enemy.type]||BOSS_BEHAVIORS.bossOgre;
  enemy.state='patrol';enemy.stateTime=0;enemy.cooldown=behavior.cooldown+(enemy.bossAttackIndex%3)*.12;
  enemy.vx=0;enemy.vy=0;enemy.rainTick=0;enemy.rainIndex=0;enemy.guardFountain=false;
  if(ENEMY_DEFS[enemy.type]?.airborne)enemy.baseY=enemy.type==='bossCrow'?250:285;
  else snapBossToGround(enemy);
}

function beginBossRecovery(enemy){
  const behavior=BOSS_BEHAVIORS[enemy.type]||BOSS_BEHAVIORS.bossOgre;
  enemy.state='recover';
  enemy.stateTime=Math.max(behavior.recover,ENEMY_DEFS[enemy.type]?.airborne?BOSS_FAIRNESS.ghostRecovery:BOSS_FAIRNESS.minimumRecovery);
  enemy.vx=0;
}

function startBossAttack(enemy,target){
  const behavior=BOSS_BEHAVIORS[enemy.type]||BOSS_BEHAVIORS.bossOgre,pattern=BOSS_ATTACK_PATTERNS[enemy.type]||BOSS_ATTACK_CYCLE;
  setEnemyDirection(enemy,target.x-enemy.x,true);
  const attack=pattern[enemy.bossAttackIndex++%pattern.length];
  enemy.state=attack;enemy.stateTime=Math.max(behavior.windups[attack],BOSS_FAIRNESS.minimumWindup);
  enemy.attackRepeat=attack==='chargeWindup'?Math.max(0,(behavior.chargePasses||1)-1):0;
  return attack;
}

function bossFountainTarget(){
  if(!bossFountain)return null;
  return{x:bossFountain.x-28,y:bossFountain.surfaceY-126,w:56,h:112,hp:1};
}

function wizardAtBossFountain(){
  if(!bossArenaActive||!bossFountain||bossFountain.disabledTime>0||bossFountain.water<=0)return null;
  return[player,...partners].find(actor=>{
    if(!actor||actor.hp<=0||actor.characterId!=='kid')return false;
    const center=actor.x+actor.w/2,maximum=actor.maxMagic||WIZARD_MAGIC.max,magic=Number.isFinite(actor.magic)?actor.magic:maximum;
    return magic<maximum&&Math.abs(center-bossFountain.x)<=bossFountain.range&&actor.y+actor.h>=bossFountain.surfaceY-24;
  })||null;
}

function startBossFountainGuard(enemy){
  if(!bossFountain||bossFountain.guardCooldown>0||enemy.state!=='patrol'||enemy.cooldown>0||!wizardAtBossFountain())return false;
  const behavior=BOSS_BEHAVIORS[enemy.type]||BOSS_BEHAVIORS.bossOgre,target=bossFountainTarget();
  setEnemyDirection(enemy,target.x-enemy.x,true);
  enemy.guardFountain=true;enemy.state='throwWindup';enemy.stateTime=Math.max(behavior.windups.throwWindup,BOSS_FAIRNESS.minimumWindup+.16);enemy.attackRepeat=0;
  bossFountain.guardCooldown=3.8;bossFountain.warningTime=enemy.stateTime;
  return true;
}

function releaseBossFountainGuard(enemy){
  const target=bossFountainTarget();if(!target)return;
  const kind={bossOgre:'bossRock',bossGhost:'royalInk',bossSerpent:'bossInk',bossBeetle:'thornBall',bossChest:'bossCoin',bossWarden:'bossRock',bossCrow:'royalInk',bossWeaver:'bossInk'}[enemy.type]||'bossRock';
  playSound('bossAttack');fireEnemyShot(enemy,target,{kind,speed:460,gravity:0,size:42});
  bossFountain.warningTime=0;bossFountain.disabledTime=Math.max(bossFountain.disabledTime||0,1.6);bossFountain.hitFlash=.34;
}

function updateBossEnemy(enemy,target,dt,speedScale){
  const behavior=BOSS_BEHAVIORS[enemy.type]||BOSS_BEHAVIORS.bossOgre,distance=target.x-enemy.x,absoluteDistance=Math.abs(distance),groundY=bossGroundY(enemy);
  if(!ENEMY_DEFS[enemy.type].airborne&&enemy.state!=='jump'&&enemy.state!=='entrance')snapBossToGround(enemy);
  startBossFountainGuard(enemy);
  if(enemy.state==='spreadWindup'){
    enemy.stateTime-=dt;
    if(enemy.stateTime<=0){releaseBossSpread(enemy,target);enemy.state='spreadRelease';enemy.stateTime=behavior.spreadRelease;}
    return;
  }
  if(enemy.state==='spreadRelease'){
    enemy.stateTime-=dt;
    if(enemy.stateTime<=0)beginBossRecovery(enemy);
    return;
  }
  if(enemy.state==='chargeWindup'){
    enemy.stateTime-=dt;setEnemyDirection(enemy,target.x-enemy.x,true);
    if(enemy.stateTime<=0){enemy.state='charge';enemy.stateTime=behavior.chargeTime;playSound('dash');}
    return;
  }
  if(enemy.state==='charge'){
    enemy.stateTime-=dt;
    const speed=behavior.chargeSpeed*speedScale;
    let moved=true;
    if(ENEMY_DEFS[enemy.type]?.airborne){
      enemy.x=clamp(enemy.x+enemy.dir*speed*dt,enemy.left,enemy.right);
      enemy.y+=(target.y+target.h*.45-enemy.y)*Math.min(1,dt*5.5);
      moved=enemy.x>enemy.left&&enemy.x<enemy.right;
    }else{moved=moveGroundEnemy(enemy,enemy.dir*speed*dt);snapBossToGround(enemy);}
    if(enemy.stateTime<=0||!moved){
      if(enemy.attackRepeat>0){enemy.attackRepeat--;enemy.state='chargeWindup';enemy.stateTime=Math.max(BOSS_FAIRNESS.repeatedChargeWindup,behavior.windups.chargeWindup*.65);setEnemyDirection(enemy,target.x-enemy.x,true);}
      else beginBossRecovery(enemy);
    }
    return;
  }
  if(enemy.state==='rainWindup'){
    enemy.stateTime-=dt;
    if(enemy.stateTime<=0){enemy.state='rain';enemy.stateTime=behavior.rainTime;enemy.rainTick=0;enemy.rainIndex=0;playSound('bossAttack');}
    return;
  }
  if(enemy.state==='rain'){
    enemy.stateTime-=dt;enemy.rainTick-=dt;
    while(enemy.rainTick<=0&&enemy.stateTime>0){releaseBossRain(enemy,target);enemy.rainTick+=behavior.rainInterval;}
    if(enemy.stateTime<=0)beginBossRecovery(enemy);
    return;
  }
  if(enemy.state==='throwWindup'){
    enemy.stateTime-=dt;
    if(enemy.stateTime<=0){if(enemy.guardFountain)releaseBossFountainGuard(enemy);else releaseBossThrow(enemy,target);enemy.state='throwRelease';enemy.stateTime=behavior.throwRelease;}
    return;
  }
  if(enemy.state==='throwRelease'){
    enemy.stateTime-=dt;
    if(enemy.stateTime<=0)beginBossRecovery(enemy);
    return;
  }
  if(enemy.state==='jumpWindup'){
    enemy.stateTime-=dt;
    if(enemy.stateTime<=0){enemy.state='jump';enemy.stateTime=behavior.jumpTime;enemy.vy=behavior.jumpVelocity;enemy.vx=enemy.dir*(behavior.jumpSpeed+currentLevel*4);playSound('jump');}
    return;
  }
  if(enemy.state==='jump'){
    enemy.stateTime-=dt;enemy.vy=Math.min(980,enemy.vy+GRAVITY*behavior.jumpGravity*dt);enemy.x=clamp(enemy.x+enemy.vx*dt,enemy.left,enemy.right);enemy.y+=enemy.vy*dt;
    const landingY=bossGroundY(enemy);
    if((enemy.vy>=0&&enemy.y>=landingY)||enemy.stateTime<=0){enemy.y=landingY;enemy.vx=0;enemy.vy=0;enemy.state='slam';enemy.stateTime=behavior.slamTime;enemy.slamReleased=false;}
    return;
  }
  if(enemy.state==='slam'){
    enemy.stateTime-=dt;
    if(!enemy.slamReleased&&enemy.stateTime<=behavior.slamRelease){enemy.slamReleased=true;releaseBossSlam(enemy);}
    if(enemy.stateTime<=0)beginBossRecovery(enemy);
    return;
  }
  if(enemy.state==='recover'){
    enemy.stateTime-=dt;
    if(ENEMY_DEFS[enemy.type]?.airborne)enemy.y+=(bossGroundY(enemy)-enemy.y)*Math.min(1,dt*14);
    if(enemy.stateTime<=0)finishBossAttack(enemy);
    return;
  }

  setEnemyDirection(enemy,distance);
  if(ENEMY_DEFS[enemy.type]?.airborne){
    enemy.x=clamp(enemy.x+enemy.dir*(absoluteDistance>340?54:absoluteDistance<220?-42:0)*speedScale*dt,enemy.left,enemy.right);
    const hoverY=enemy.baseY+Math.sin(enemy.phase*2.5)*38;
    enemy.y+=(hoverY-enemy.y)*Math.min(1,dt*3.8);
  }else{
    if(absoluteDistance>behavior.preferredDistance)moveGroundEnemy(enemy,enemy.dir*behavior.walkSpeed*speedScale*dt);
    else enemy.y=groundY;
    snapBossToGround(enemy);
  }
  if(enemyCanAttack(enemy,target,900)&&enemy.cooldown<=0){
    startBossAttack(enemy,target);
  }
}

function updateEnemies(dt){
  const targets=[player,...partners].filter(actor=>actor.hp>0);
  if(!targets.length)return;
  for(const enemy of enemies){
    if(enemy.dead)continue;
    const target=targets.reduce((closest,actor)=>Math.abs(actor.x-enemy.x)<Math.abs(closest.x-enemy.x)?actor:closest,targets[0]);
    const distance=target.x-enemy.x,absoluteDistance=Math.abs(distance);
    enemy.hit=Math.max(0,enemy.hit-dt);enemy.phase+=dt;enemy.cooldown=Math.max(0,enemy.cooldown-dt);enemy.turnCooldown=Math.max(0,(enemy.turnCooldown||0)-dt);enemy.blockedTime=Math.max(0,(enemy.blockedTime||0)-dt);enemy.slowTime=Math.max(0,(enemy.slowTime||0)-dt);
    const speedScale=(enemy.speedScale||1)*(enemy.slowTime>0?.55:1);

    if(enemy.boss){
      updateBossEnemy(enemy,target,dt,speedScale);
      if(!ENEMY_DEFS[enemy.type].airborne&&enemy.state!=='jump'&&enemy.state!=='entrance')snapBossToGround(enemy);
    }else if(enemy.type==='ghost'){
      const near=absoluteDistance<360,speed=(near?118:55)*speedScale;if(near)setEnemyDirection(enemy,distance);
      moveGroundEnemy(enemy,enemy.dir*speed*dt);
    }else if(enemy.type==='bat'){
      enemy.x+=enemy.dir*88*speedScale*dt;
      if(enemy.x<enemy.left){enemy.x=enemy.left;setEnemyDirection(enemy,1,true);}if(enemy.x>enemy.right){enemy.x=enemy.right;setEnemyDirection(enemy,-1,true);}
      enemy.y=enemy.baseY+Math.sin(enemy.phase*4.4)*28;
    }else if(enemy.type==='snail'){
      if(enemyCanAttack(enemy,target,520))setEnemyDirection(enemy,distance);
      moveGroundEnemy(enemy,enemy.dir*28*speedScale*dt);
    }else if(enemy.type==='scarecrow'){
      setEnemyDirection(enemy,distance);
      if(absoluteDistance<230)moveGroundEnemy(enemy,-enemy.dir*46*dt);else if(absoluteDistance>480)moveGroundEnemy(enemy,enemy.dir*34*dt);
      if(enemyCanAttack(enemy,target,720)&&enemy.cooldown<=0){fireEnemyShot(enemy,target,{kind:'ink',speed:285,size:19});enemy.cooldown=1.65;}
    }else if(enemy.type==='ram'){
      if(enemy.state==='windup'){
        enemy.stateTime-=dt;if(enemy.stateTime<=0){enemy.state='charge';enemy.stateTime=.72;}
      }else if(enemy.state==='charge'){
        enemy.stateTime-=dt;moveGroundEnemy(enemy,enemy.dir*410*speedScale*dt);
        if(enemy.stateTime<=0){enemy.state='patrol';enemy.cooldown=1.8;}
      }else{
        moveGroundEnemy(enemy,enemy.dir*42*dt);
        if(enemyCanAttack(enemy,target,520)&&enemy.cooldown<=0){setEnemyDirection(enemy,distance);enemy.state='windup';enemy.stateTime=.48;}
      }
    }else if(enemy.type==='mole'){
      if(enemy.state==='burrow'){
        enemy.stateTime-=dt;enemy.visible=false;enemy.invulnerable=true;enemy.x+=(enemy.attackX-enemy.x)*Math.min(1,dt*8);
        if(enemy.stateTime<=0){enemy.x=enemy.attackX;resetEnemyPatrol(enemy);enemy.y=groundSurfaceAt(enemy.x)-enemy.h/2;enemy.visible=true;enemy.invulnerable=false;enemy.state='emerge';enemy.stateTime=.42;}
      }else if(enemy.state==='emerge'){
        enemy.stateTime-=dt;if(enemy.stateTime<=0){enemy.state='patrol';enemy.cooldown=2.25;}
      }else{
        moveGroundEnemy(enemy,enemy.dir*32*dt);
        if(enemyCanAttack(enemy,target,620)&&enemy.cooldown<=0){enemy.attackX=safeGroundX(target.x+(distance>0?-72:target.w+72));enemy.state='burrow';enemy.stateTime=.72;}
      }
    }else if(enemy.type==='eye'){
      setEnemyDirection(enemy,distance);
      enemy.x+=enemy.dir*(absoluteDistance<230?-68:absoluteDistance>410?58:0)*speedScale*dt;enemy.x=clamp(enemy.x,enemy.left,enemy.right);
      enemy.y=enemy.baseY+Math.sin(enemy.phase*3.8)*34;
      if(enemyCanAttack(enemy,target,760)&&enemy.cooldown<=0){for(const spread of[-.18,0,.18])fireEnemyShot(enemy,target,{kind:'eye',speed:255,spread,size:16});enemy.cooldown=2.05;}
    }else if(enemy.type==='slime'){
      if(enemy.state==='pounce'){
        enemy.stateTime-=dt;const progress=1-clamp(enemy.stateTime/.88,0,1);moveGroundEnemy(enemy,enemy.dir*205*speedScale*dt);enemy.y=groundSurfaceAt(enemy.x)-enemy.h/2-Math.sin(progress*Math.PI)*126;
        if(enemy.stateTime<=0){enemy.state='patrol';enemy.cooldown=1.2;}
      }else{
        moveGroundEnemy(enemy,enemy.dir*34*dt);
        if(enemyCanAttack(enemy,target,500)&&enemy.cooldown<=0){setEnemyDirection(enemy,distance);enemy.state='pounce';enemy.stateTime=.88;}
      }
    }else if(enemy.type==='imp'){
      if(enemy.state==='vanish'){
        enemy.stateTime-=dt;enemy.visible=false;enemy.invulnerable=true;
        if(enemy.stateTime<=0){enemy.x=enemy.attackX;resetEnemyPatrol(enemy);enemy.y=groundSurfaceAt(enemy.x)-enemy.h/2;setEnemyDirection(enemy,target.x-enemy.x,true);enemy.visible=true;enemy.invulnerable=false;enemy.state='appear';enemy.stateTime=.32;fireEnemyShot(enemy,target,{kind:'swirl',speed:330,size:20});}
      }else if(enemy.state==='appear'){
        enemy.stateTime-=dt;if(enemy.stateTime<=0){enemy.state='patrol';enemy.cooldown=2.35;}
      }else{
        moveGroundEnemy(enemy,enemy.dir*38*dt);
        if(enemyCanAttack(enemy,target,720)&&enemy.cooldown<=0){enemy.attackX=safeGroundX(target.x+(distance>0?-150:target.w+150));enemy.state='vanish';enemy.stateTime=.24;}
      }
    }else if(enemy.type==='turtle'){
      setEnemyDirection(enemy,distance);
      if(absoluteDistance>430)moveGroundEnemy(enemy,enemy.dir*22*dt);
      if(enemyCanAttack(enemy,target,800)&&enemy.cooldown<=0){fireEnemyShot(enemy,target,{kind:'cannon',gravity:520,size:30,vx:enemy.dir*250,vy:-310});enemy.cooldown=2.45;}
    }else if(enemy.type==='thorn'){
      const rolling=enemyCanAttack(enemy,target,560);if(rolling)setEnemyDirection(enemy,distance);
      moveGroundEnemy(enemy,enemy.dir*(rolling?255:86)*speedScale*dt);enemy.state=rolling?'roll':'patrol';
    }else if(enemy.type==='crow'){
      setEnemyDirection(enemy,distance);
      if(enemy.state==='swoop'){
        enemy.stateTime-=dt;const progress=1-clamp(enemy.stateTime/.9,0,1);
        enemy.x=clamp(enemy.x+enemy.dir*285*speedScale*dt,enemy.left,enemy.right);enemy.y=enemy.baseY+Math.sin(progress*Math.PI)*185;
        if(enemy.stateTime<=0){enemy.state='patrol';enemy.cooldown=1.55;enemy.y=enemy.baseY;}
      }else{
        enemy.x=clamp(enemy.x+enemy.dir*92*speedScale*dt,enemy.left,enemy.right);enemy.y=enemy.baseY+Math.sin(enemy.phase*4.1)*24;
        if(enemyCanAttack(enemy,target,620)&&enemy.cooldown<=0){enemy.state='swoop';enemy.stateTime=.9;}
      }
    }else if(enemy.type==='spider'){
      setEnemyDirection(enemy,distance);
      if(enemy.state==='webWindup'){
        enemy.stateTime-=dt;
        if(enemy.stateTime<=0){for(const spread of[-.15,0,.15])fireEnemyShot(enemy,target,{kind:'web',speed:245,spread,gravity:80,size:18});enemy.state='patrol';enemy.cooldown=2.1;}
      }else{
        if(absoluteDistance>330)moveGroundEnemy(enemy,enemy.dir*56*speedScale*dt);
        if(enemyCanAttack(enemy,target,650)&&enemy.cooldown<=0){enemy.state='webWindup';enemy.stateTime=.48;}
      }
    }else if(enemy.type==='guard'){
      setEnemyDirection(enemy,distance);
      if(enemy.state==='brace'){
        enemy.stateTime-=dt;if(enemy.stateTime<=0){enemy.state='thrust';enemy.stateTime=.42;}
      }else if(enemy.state==='thrust'){
        enemy.stateTime-=dt;moveGroundEnemy(enemy,enemy.dir*310*speedScale*dt);
        if(enemy.stateTime<=0){enemy.state='patrol';enemy.cooldown=1.8;}
      }else{
        if(absoluteDistance>240)moveGroundEnemy(enemy,enemy.dir*34*dt);
        if(enemyCanAttack(enemy,target,410)&&enemy.cooldown<=0){enemy.state='brace';enemy.stateTime=.58;}
      }
    }else if(enemy.type==='wisp'){
      setEnemyDirection(enemy,distance);
      enemy.x=clamp(enemy.x+enemy.dir*(absoluteDistance>380?62:absoluteDistance<230?-54:0)*speedScale*dt,enemy.left,enemy.right);
      enemy.y=enemy.baseY+Math.sin(enemy.phase*3.3)*42;
      if(enemyCanAttack(enemy,target,760)&&enemy.cooldown<=0){for(const spread of[-.1,.1])fireEnemyShot(enemy,target,{kind:'wisp',speed:315,spread,size:20});enemy.cooldown=1.75;}
    }else if(enemy.type==='leech'){
      setEnemyDirection(enemy,distance);
      if(enemy.state==='lunge'){
        enemy.stateTime-=dt;moveGroundEnemy(enemy,enemy.dir*360*speedScale*dt);
        if(enemy.stateTime<=0){enemy.state='patrol';enemy.cooldown=1.5;}
      }else{
        moveGroundEnemy(enemy,enemy.dir*48*dt);
        if(enemyCanAttack(enemy,target,430)&&enemy.cooldown<=0){enemy.state='lunge';enemy.stateTime=.36;}
      }
    }else if(enemy.type==='golem'){
      setEnemyDirection(enemy,distance);
      if(enemy.state==='quakeWindup'){
        enemy.stateTime-=dt;
        if(enemy.stateTime<=0){for(const [vx,vy] of[[220,-210],[285,-285],[350,-355]])fireEnemyShot(enemy,target,{kind:'golemRock',gravity:430,size:31,vx:enemy.dir*vx,vy});enemy.state='patrol';enemy.cooldown=2.5;}
      }else{
        if(absoluteDistance>300)moveGroundEnemy(enemy,enemy.dir*28*dt);
        if(enemyCanAttack(enemy,target,690)&&enemy.cooldown<=0){enemy.state='quakeWindup';enemy.stateTime=.68;}
      }
    }

    if(enemy.visible===false)continue;
    const box=enemyHitbox(enemy);
    for(const actor of targets){
      if(!enemyShapeIntersectsRect(box,actor))continue;
      const stats=characterStats(actor);
      if(!enemy.invulnerable&&actorStompsEnemy(actor,box,dt)){
        damageEnemy(enemy,enemy.boss?1:Math.max(1,enemy.hp),'stomp');bounceFromEnemy(actor,box);if(enemy.dead)break;
      }else if(stats.dashDamage>0&&actor.dashTime>0){
        enemy.dashHits??={};
        if(enemy.dashHits[actor.playerIndex]!==actor.dashToken){enemy.dashHits[actor.playerIndex]=actor.dashToken;damageEnemy(enemy,stats.dashDamage);if(enemy.dead)break;}
      }else hurtActor(actor,enemy.x<actor.x?1:-1);
    }
  }
}

function updateEnemyShots(dt){
  for(const shot of enemyShots){
    shot.life-=dt;shot.vy+=shot.gravity*dt;shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.phase+=dt;
    const box={x:shot.x-shot.w/2,y:shot.y-shot.h/2,w:shot.w,h:shot.h};
    const platform=platforms.find(entry=>overlap(box,{x:entry.collisionLeft,y:entry.surfaceY,w:entry.collisionRight-entry.collisionLeft,h:entry.undersideY-entry.surfaceY}));
    if(platform){shot.life=0;wallImpacts.push({x:shot.x,y:shot.y,time:0,direction:-Math.sign(shot.vx||1)});continue;}
    for(const actor of[player,...partners]){
      if(actor.hp<=0||!overlap(actor,box))continue;
      shot.life=0;hurtActor(actor,shot.vx<0?-1:1);break;
    }
  }
  enemyShots=enemyShots.filter(shot=>shot.life>0&&shot.x>=cameraX-180&&shot.x<=cameraX+VIEW_W+180&&shot.y<VIEW_H+120);
}

function updateDefeatBursts(dt){
  for(const burst of defeatBursts)burst.time+=dt;
  defeatBursts=defeatBursts.filter(burst=>burst.time<.4);
}

function syncOverlayState(){
  const gameplay=['playing','paused','dying'].includes(state),shop=['shopEntry','shop','shopExit'].includes(state);
  const signature=`${gameplay?1:0}|${shop?1:0}`;
  if(signature===overlayStateSignature)return;
  overlayStateSignature=signature;
  $('hud').hidden=!gameplay;
  $('touchControls').setAttribute('aria-hidden',String(!gameplay));
  const shell=$('gameShell');
  shell.classList.toggle('gameplay-ui',gameplay);
  shell.classList.toggle('shop-ui',shop);
}

function updateLoadoutHud(){
  syncOverlayState();
  const hud=$('loadoutHud');if(!hud)return;
  const visible=['playing','paused','dying'].includes(state);hud.hidden=!visible;if(!visible)return;
  const weapon=equippedShopItem('weapon',player),quick=SHOP_ITEMS[usableShopItems[0]],definition=weapon?.weaponProfile||CHARACTERS[player?.characterId]||CHARACTERS.kid,condition=weaponConditionFor(player);
  const wizard=player?.characterId==='kid',wizardCount=wizard?activeWizardFireballs(player):0,wizardLimit=definition.maxProjectiles||CHARACTERS.kid.maxProjectiles;
  const signature=`${weapon?.id||currentWeaponId(player)}|${condition?.durability??'none'}|${condition?.ammo??'none'}|${quick?.id||'empty'}|${usableShopItems.length}|${wizardCount}|${bossArenaActive?'boss':'stage'}|${Math.ceil(player?.magic||0)}`;
  if(hud.dataset.signature===signature)return;hud.dataset.signature=signature;
  const baseNames={kid:'STARTER WAND',goat:'STARTER MINIGUN',knight:'STARTER SWORD',monk:'BARE HANDS'};
  $('weaponHudName').textContent=weapon?.name||baseNames[player?.characterId]||'BUILT-IN ATTACK';
  $('weaponHudStatus').textContent=condition?.durability<=0?(wizard?'BROKEN · STAFF BASH READY':'BROKEN · WEAK ATTACK READY'):condition&&condition.maxAmmo!==null&&condition.ammo<=0?'EMPTY · WEAK SHOT READY':wizard&&(player.magic||0)<(definition.magicCost||WIZARD_MAGIC.cost)?'NO MAGIC · STAFF BASH READY':condition&&condition.maxAmmo!==null?`AMMO ${condition.ammo} / ${condition.maxAmmo} · DUR ${condition.durability}`:wizard?`MAGIC ATTACK · DUR ${condition?.durability??'∞'} · ${wizardCount}/${wizardLimit}`:condition?`DURABILITY ${condition.durability} / ${condition.maxDurability}`:'NEVER BREAKS';
  $('quickItemHudName').textContent=quick?`${quick.name} · ${usableShopItems.length}`:'EMPTY';
  const weaponCanvas=$('weaponHudIcon'),quickCanvas=$('quickItemHudIcon');
  weaponCanvas.getContext('2d').clearRect(0,0,weaponCanvas.width,weaponCanvas.height);quickCanvas.getContext('2d').clearRect(0,0,quickCanvas.width,quickCanvas.height);
  if(weapon)drawShopGearSprite(weaponCanvas,weapon);else if(wizard)drawFireballGlyph(weaponCanvas.getContext('2d'),29,27,31,0,0);
  if(quick)drawShopGearSprite(quickCanvas,quick);
}

function updateMagicHud(){
  const hud=$('wizardMagicHud');if(!hud||!player)return;
  const visible=['playing','paused','dying'].includes(state)&&player.characterId==='kid';
  hud.hidden=!visible;if(!visible)return;
  const maxMagic=Math.max(1,player.maxMagic||WIZARD_MAGIC.max),magic=clamp(player.magic??maxMagic,0,maxMagic),ratio=magic/maxMagic;
  $('magicFill').style.width=`${ratio*100}%`;$('magicValue').textContent=`${Math.ceil(magic)} / ${maxMagic}`;
  hud.setAttribute('aria-valuenow',String(Math.ceil(magic)));hud.setAttribute('aria-valuemax',String(maxMagic));
  hud.setAttribute('aria-label',`Wizard magic ${Math.ceil(magic)} of ${maxMagic}`);
}

function updateBossHud(){
  const hud=$('bossHealthHud'),shell=$('gameShell'),boss=stageBoss?.enemy;
  if(!hud||!shell)return;
  const visible=!!(bossArenaActive&&stageBoss?.status==='active'&&boss&&!boss.dead&&['playing','paused'].includes(state));
  const hp=visible?Math.max(0,boss.hp):0,maxHp=visible?Math.max(1,boss.maxHp):1;
  const signature=`${visible?1:0}|${stageBoss?.type||''}|${hp}|${maxHp}|${state}`;
  if(signature===bossHudSignature)return;bossHudSignature=signature;
  hud.hidden=!visible;shell.classList.toggle('boss-fight',visible);
  if(!visible)return;
  const ratio=clamp(hp/maxHp,0,1);
  $('bossHealthName').textContent=BOSS_NAMES[stageBoss.type]||'BOSS';
  $('bossHealthValue').textContent=`${Math.ceil(hp)} / ${maxHp}`;
  $('bossHealthFill').style.width=`${ratio*100}%`;
  hud.setAttribute('aria-valuenow',String(hp));hud.setAttribute('aria-valuemax',String(maxHp));
  hud.setAttribute('aria-label',`${BOSS_NAMES[stageBoss.type]||'Boss'} health`);
}

function updateHud(){
  const healthHud=$('healthHud');
  const localActors=[player,...partners];
  $('healthValue').textContent=partners.length?localActors.map((actor,index)=>`P${index+1} ${actor.hp?'♥':'—'}`).join('  '):(player.hp?'1 HEART':'HEART LOST');
  healthHud.classList.toggle('lost',player.hp<=0);
  healthHud.setAttribute('aria-valuenow',String(player.hp));
  healthHud.setAttribute('aria-valuemax','1');
  $('coinValue').textContent=String(coins);
  const portraitActors=gameMode==='online'?[player,...remotePlayers].slice(0,4):localActors;
  $('gameShell').classList.toggle('multiplayer',portraitActors.length>1);
  renderMultiplayerPortraits(portraitActors);
  updateLoadoutHud();
  updateMagicHud();
  updateBossHud();
}

function renderMultiplayerPortraits(actors){
  const portraits=$('multiplayerPortraits');
  const visible=['playing','paused','dying'].includes(state)&&actors.length>1;
  portraits.classList.toggle('visible',visible);
  if(!visible){portraits.replaceChildren();multiplayerPortraitSignature='';return;}
  const signature=actors.map(actor=>{const condition=weaponConditionFor(actor);return`${actor.characterId}:${actor.hp}:${Math.ceil(actor.magic||0)}:${condition?.durability??'n'}:${condition?.ammo??'n'}`;}).join('|');
  if(signature===multiplayerPortraitSignature)return;
  multiplayerPortraitSignature=signature;
  portraits.innerHTML=actors.map((actor,index)=>{
    const maxMagic=Math.max(1,actor.maxMagic||WIZARD_MAGIC.max),magic=clamp(actor.magic??maxMagic,0,maxMagic),condition=weaponConditionFor(actor),magicMeter=actor.characterId==='kid'?`<span class="portrait-magic" role="progressbar" aria-label="Player ${index+1} magic" aria-valuemin="0" aria-valuemax="${maxMagic}" aria-valuenow="${Math.ceil(magic)}"><i style="width:${magic/maxMagic*100}%"></i></span>`:'';
    const weaponStatus=condition?condition.durability<=0?'BROKEN':condition.maxAmmo!==null?`AMMO ${condition.ammo} · DUR ${condition.durability}`:`DUR ${condition.durability}`:'BARE HANDS';
    return `<figure class="multiplayer-portrait${actor.hp<=0?' heart-lost':''}" data-player="${index+1}" data-character="${actor.characterId}"><canvas width="108" height="112" aria-hidden="true"></canvas><b>P${index+1}</b>${magicMeter}<small class="portrait-weapon">${weaponStatus}</small></figure>`;
  }).join('');
  portraits.querySelectorAll('.multiplayer-portrait').forEach((portrait,index)=>drawCharacterPreview(portrait.querySelector('canvas'),actors[index].characterId));
}

function atlasCell(index){const [x,y,w,h]=ATLAS_CUTS[index];return{x,y,w,h};}

function drawAtlas(index,x,y,w,h,flip=false,alpha=1){
  const source=atlasCell(index);
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);if(flip)ctx.scale(-1,1);
  ctx.drawImage(assets.atlas,source.x,source.y,source.w,source.h,-w/2,-h/2,w,h);
  ctx.restore();
}

function drawAtlasContained(index,x,y,maxW,maxH,flip=false,alpha=1){
  const source=atlasCell(index),scale=Math.min(maxW/source.w,maxH/source.h),w=source.w*scale,h=source.h*scale;
  drawAtlas(index,x,y,w,h,flip,alpha);
}

function drawGroundProp(index,x,surfaceY,w,h){
  const [sx,sy,sw,sh]=GROUND_PROP_CUTS[index];
  const scale=Math.min(w/sw,h/sh),drawW=sw*scale,drawH=sh*scale,bottomNudge=[4,4,4,3][index];
  ctx.drawImage(assets.groundProps,sx,sy,sw,sh,x-drawW/2,surfaceY-drawH+bottomNudge,drawW,drawH);
}

function drawEnemySprite(enemy){
  if(enemy.visible===false)return;
  if(enemy.type==='ghost'||enemy.type==='bat'){
    const frame=enemy.type==='bat'?(Math.floor(enemy.phase*7)%2?12:13):(Math.abs(player.x-enemy.x)<280?11:10);
    const drawY=enemy.type==='ghost'?enemy.y+Math.sin(enemy.phase*3)*5:enemy.y;
    drawAtlasContained(frame,enemy.x-cameraX,drawY,enemy.type==='bat'?94:92,enemy.type==='bat'?80:98,enemy.dir<0,enemy.hit>0?.5:1);return;
  }
  if(enemy.boss){
    if(enemy.type==='bossOgre'){
      const visual=ogreActionVisual(enemy),[sx,sy,sw,sh]=OGRE_TEN_CUTS[visual.frame],size=enemy.h*OGRE_DRAW_SCALE;
      if(!visual.image.complete||!visual.image.naturalWidth)return;
      ctx.save();ctx.globalAlpha=enemy.hit>0?.48:1;ctx.translate(enemy.x-cameraX,enemy.y+enemy.h/2+size*(21/440));if(enemy.dir<0)ctx.scale(-1,1);
      ctx.drawImage(visual.image,sx,sy,sw,sh,-size/2,-size,size,size);ctx.restore();return;
    }
    const frame=bossActionFrame(enemy),[sx,sy,sw,sh]=BOSS_ACTION_CUTS[enemy.type][frame],image=bossActionAsset(enemy.type);
    if(!image.complete||!image.naturalWidth)return;
    const scale=enemy.h*(ENEMY_DEFS[enemy.type]?.bossDrawScale||1.45)/390,drawW=sw*scale,drawH=sh*scale,anchorX=BOSS_ACTION_ANCHORS[enemy.type]?.[frame]??.5;
    ctx.save();ctx.globalAlpha=enemy.hit>0?.48:1;ctx.translate(enemy.x-cameraX,enemy.y+enemy.h/2+8);if(enemy.dir<0)ctx.scale(-1,1);
    ctx.drawImage(image,sx,sy,sw,sh,-drawW*anchorX,-drawH,drawW,drawH);ctx.restore();return;
  }
  const def=ENEMY_DEFS[enemy.type],cuts=def.spriteSheet===2?NEW_ENEMY_CUTS:ENEMY_CUTS,[sx,sy,sw,sh]=cuts[def.sprite],image=def.spriteSheet===2?assets.enemyTypes2:assets.enemyTypes;
  const artScale=ENEMY_ART_SCALE[enemy.type]||1.5,spriteScale=Math.min(enemy.w*artScale/sw,enemy.h*artScale/sh);
  let drawW=sw*spriteScale,drawH=sh*spriteScale,rotation=0,scaleX=1,scaleY=1;
  if(enemy.type==='ram'&&enemy.state==='windup'){scaleX=.9;scaleY=1.08;}
  if(enemy.type==='slime'&&enemy.state==='pounce'){scaleX=1.08;scaleY=.94;}
  if(enemy.type==='thorn'&&enemy.state==='roll')rotation=enemy.phase*8*enemy.dir;
  if(enemy.type==='mole'&&enemy.state==='emerge')scaleY=.72+clamp((.42-enemy.stateTime)/.42,0,1)*.28;
  if(enemy.type==='crow'&&enemy.state==='swoop'){rotation=enemy.dir*.16;scaleX=1.08;}
  if(enemy.type==='spider'&&enemy.state==='webWindup'){scaleX=1.08;scaleY=.9;}
  if(enemy.type==='guard'&&enemy.state==='brace'){scaleX=.92;scaleY=1.06;}
  if(enemy.type==='leech'&&enemy.state==='lunge'){scaleX=1.16;scaleY=.86;}
  if(enemy.type==='golem'&&enemy.state==='quakeWindup'){scaleX=1.08;scaleY=.92;}
  ctx.save();ctx.globalAlpha=enemy.hit>0?.5:1;ctx.translate(enemy.x-cameraX,enemy.y+2);ctx.rotate(rotation);if(enemy.dir<0)ctx.scale(-1,1);ctx.scale(scaleX,scaleY);
  ctx.drawImage(image,sx,sy,sw,sh,-drawW/2,-drawH/2,drawW,drawH);ctx.restore();
  if(enemy.type==='snail')drawSnailShield(enemy);
}

function drawSnailShield(enemy){
  const direction=enemy.dir<0?-1:1,x=enemy.x-cameraX+direction*enemy.w*.34,y=enemy.y+enemy.h*.01,w=enemy.w*.78,h=enemy.h*1.78,flash=enemy.hit>0;
  ctx.save();ctx.globalAlpha=flash?.55:1;ctx.translate(x,y);ctx.scale(direction,1);ctx.rotate(-.035);
  ctx.drawImage(assets.snailShield,-w/2,-h/2,w,h);ctx.restore();
}

function drawEnemyShot(shot){
  const bossProjectile={bossRock:1,royalInk:2,bossInk:3,thornBall:4,bossCoin:5}[shot.kind];
  if(bossProjectile!==undefined){
    const [sx,sy,sw,sh]=BOSS_EFFECT_CUTS[bossProjectile],size=Math.max(88,shot.w*2.7);
    ctx.save();ctx.translate(shot.x-cameraX,shot.y);ctx.rotate(shot.phase*(shot.kind==='bossCoin'?2.5:1.2));
    ctx.drawImage(assets.bossEffects,sx,sy,sw,sh,-size/2,-size/2,size,size);ctx.restore();return;
  }
  const source=atlasCell(15),size=shot.kind==='cannon'?shot.w*1.9:shot.w*2.15;
  ctx.save();ctx.filter='grayscale(1) contrast(3.2) brightness(.22)';ctx.translate(shot.x-cameraX,shot.y);ctx.rotate(shot.phase*(shot.kind==='cannon'?4:8));
  const height=size*source.h/source.w;ctx.drawImage(assets.atlas,source.x,source.y,source.w,source.h,-size/2,-height/2,size,height);ctx.restore();
}

function drawBossWave(wave){
  const {progress,sx,sy,sw,sh,drawW,drawH,drawX,drawY}=bossWaveGeometry(wave);
  ctx.save();ctx.globalAlpha=clamp(1-(progress-.78)/.22,0,1);
  ctx.drawImage(assets.bossEffects,sx,sy,sw,sh,drawX-cameraX,drawY,drawW,drawH);ctx.restore();
}

function drawCoinDrop(coin){
  const frame=Math.floor(coin.phase*10)%GOLD_COIN_CUTS.length,[sx,sy,sw,sh]=GOLD_COIN_CUTS[frame],bob=coin.onGround?Math.sin(coin.phase*4.5)*4:0,size=coin.w*1.18;
  ctx.save();ctx.translate(coin.x-cameraX,coin.y+bob);ctx.rotate(coin.onGround?Math.sin(coin.phase*1.7)*.045:coin.vx*.0007);
  ctx.drawImage(assets.giantGoldCoin,sx,sy,sw,sh,-size/2,-size/2,size,size);ctx.restore();
}

function drawFireballGlyph(context,x,y,size,angle=0,frame=Math.floor(worldTime*12)%FIREBALL_CUTS.length){
  const [sx,sy,sw,sh]=FIREBALL_CUTS[frame%FIREBALL_CUTS.length],width=size*1.7,height=size;
  context.save();context.translate(x,y);context.rotate(angle);
  context.drawImage(assets.wizardFireball,sx,sy,sw,sh,-width/2,-height/2,width,height);context.restore();
}

function drawPlayerProjectile(bullet){
  if(Number.isInteger(bullet.projectileArtIndex)&&assets.classProjectiles.complete&&assets.classProjectiles.naturalWidth){
    const [sx,sy,sw,sh]=CLASS_PROJECTILE_CUTS[bullet.projectileArtIndex],angle=Math.atan2(bullet.vy||0,bullet.vx||1);
    ctx.save();ctx.translate(bullet.x-cameraX,bullet.y);ctx.rotate(angle);
    ctx.drawImage(assets.classProjectiles,sx,sy,sw,sh,-bullet.w/2,-bullet.h/2,bullet.w,bullet.h);
    ctx.restore();return;
  }
  const kind=bullet.projectile||SHOP_ITEMS[bullet.weaponId]?.weaponProfile?.projectile;
  if(kind&&kind!=='ink'){
    const size=Math.max(24,bullet.w*1.2),angle=Math.atan2(bullet.vy||0,bullet.vx||1)+(kind==='star'?(bullet.rotation||0):0);
    ctx.save();ctx.translate(bullet.x-cameraX,bullet.y);ctx.rotate(angle);ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#272522';ctx.fillStyle='#ded8ca';ctx.lineWidth=Math.max(2.5,size*.075);
    if(kind==='bolt'||kind==='arrow'){
      ctx.beginPath();ctx.moveTo(-size*.48,0);ctx.lineTo(size*.4,0);ctx.stroke();
      ctx.beginPath();ctx.moveTo(size*.46,0);ctx.lineTo(size*.18,-size*.19);ctx.lineTo(size*.25,0);ctx.lineTo(size*.18,size*.19);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-size*.4,0);ctx.lineTo(-size*.22,-size*.16);ctx.moveTo(-size*.4,0);ctx.lineTo(-size*.22,size*.16);ctx.stroke();
    }else if(kind==='star'){
      ctx.beginPath();for(let point=0;point<8;point++){const radius=point%2?size*.19:size*.48,theta=point*Math.PI/4;ctx.lineTo(Math.cos(theta)*radius,Math.sin(theta)*radius);}ctx.closePath();ctx.fill();ctx.stroke();
    }else if(kind==='thorn'){
      ctx.beginPath();ctx.moveTo(size*.5,0);ctx.lineTo(0,-size*.31);ctx.lineTo(-size*.5,0);ctx.lineTo(0,size*.31);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(-size*.12,-size*.22);ctx.lineTo(-size*.02,-size*.5);ctx.lineTo(size*.1,-size*.22);ctx.moveTo(-size*.12,size*.22);ctx.lineTo(-size*.02,size*.5);ctx.lineTo(size*.1,size*.22);ctx.stroke();
    }else if(kind==='fire'){ctx.restore();drawFireballGlyph(ctx,bullet.x-cameraX,bullet.y,size,angle);return;}
    ctx.restore();return;
  }
  const source=atlasCell(15),width=bullet.characterId==='goat'?78:72,height=width*source.h/source.w;
  ctx.save();ctx.filter='grayscale(1) contrast(3.2) brightness(.2)';ctx.translate(bullet.x-cameraX,bullet.y);if(bullet.vx<0)ctx.scale(-1,1);
  ctx.drawImage(assets.atlas,source.x,source.y,source.w,source.h,-width/2,-height/2,width,height);ctx.restore();
}

function drawWallImpact(impact){
  const progress=clamp(impact.time/.36,0,1);
  const scale=progress<.32?.42+progress/.32*.68:1.1-(progress-.32)*.3;
  const alpha=progress<.5?1:1-(progress-.5)/.5;
  const size=150*scale;
  ctx.save();ctx.globalAlpha=alpha;
  ctx.translate(impact.x-cameraX,impact.y);if(impact.direction<0)ctx.scale(-1,1);
  ctx.rotate((progress-.35)*.08);ctx.drawImage(assets.wallImpact,-size/2,-size/2,size,size);ctx.restore();
}

function drawDefeatBurst(burst){
  const frame=Math.min(3,Math.floor(burst.time/.1)),[sx,sy,sw,sh]=DEFEAT_BURST_CUTS[frame];
  const maxSizes=[[52,48],[90,66],[116,106],[64,52]],[maxW,maxH]=maxSizes[frame],scale=Math.min(maxW/sw,maxH/sh),w=sw*scale,h=sh*scale;
  ctx.save();ctx.globalAlpha=clamp(1-(burst.time-.32)/.08,0,1);
  ctx.drawImage(assets.defeatBurst,sx,sy,sw,sh,burst.x-cameraX-w/2,burst.y-h/2,w,h);
  ctx.restore();
}

function heroFrame(){
  if(state==='dying'||state==='dead')return 23;
  if(player.hurtTime>0)return 22;
  if(!player.onGround)return player.vy<0?18+Math.floor(player.animationTime*8)%2:20+Math.floor(player.animationTime*7)%2;
  const moving=Math.abs(player.vx)>45;
  const walkStep=Math.floor(player.animationTime*(6+Math.min(3,Math.abs(player.vx)/100)))%6;
  if(moving)return 6+walkStep;
  return Math.floor(player.animationTime*5)%4;
}

function heroActionFrame(){
  if(state==='dying'||state==='dead'||player.hurtTime>0||player.dashTime>0)return -1;
  if(player.stanceVisual>.025)return 6+Math.min(5,Math.floor(player.stanceVisual*6));
  if(player.onGround&&!player.moveIntent&&Math.abs(player.vx)<=25)return Math.floor(player.idleTime*2.4)%6;
  return -1;
}

function heroWalkFrame(){
  if(state==='dying'||state==='dead'||player.hurtTime>0||player.stance!=='stand'||!player.onGround)return -1;
  if(!player.moveIntent&&Math.abs(player.vx)<=25)return -1;
  return Math.floor(player.walkTime*10)%8;
}

function heroExtraFrame(){
  if(state==='dying'||state==='dead')return player.hurtTime>.72?6:7;
  if(player.hurtTime>0)return player.hurtTime>.17?4:5;
  if(!player.onGround)return player.vy<0?(player.vy< -300?0:1):(player.vy<350?2:3);
  return -1;
}

function goatMoveFrame(){
  if(!player.onGround||player.hurtTime>0||player.stance!=='stand'||state==='dying'||state==='dead')return -1;
  if(player.moveIntent||Math.abs(player.vx)>25)return 8+Math.floor(player.walkTime*10)%8;
  return Math.floor(player.idleTime*2.4)%6;
}

function goatActionFrame(){
  if(state==='dying'||state==='dead')return 7;
  if(player.hurtTime>0)return player.hurtTime>.17?4:5;
  if(player.stance==='duck')return 6;
  if(!player.onGround)return player.vy<0?(player.vy< -300?0:1):(player.vy<350?2:3);
  return -1;
}

function goatDashFrame(actor=player){
  if(actor.characterId!=='goat'||actor.dashTime<=0)return -1;
  const duration=characterStats(actor).dashDuration||.16;
  return Math.min(5,Math.floor(clamp(1-actor.dashTime/duration,0,.999)*6));
}

function actorInkFilter(normalFilter='contrast(1.45)'){
  return 'none';
}

function drawGoatGirl(){
  const dashFrame=goatDashFrame();
  if(dashFrame>=0){
    const [sx,sy,sw,sh]=GOAT_DASH_CUTS[dashFrame],scale=.60,cellWidth=assets.goatDash.naturalWidth/6;
    const sourceAnchorX=dashFrame*cellWidth+cellWidth/2-sx;
    const drawW=sw*scale,drawH=sh*scale,x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
    ctx.save();ctx.filter=actorInkFilter('brightness(1.08) contrast(1.42)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
    ctx.drawImage(assets.goatDash,sx,sy,sw,sh,-sourceAnchorX*scale,-drawH,drawW,drawH);ctx.restore();
    return;
  }
  if(player.shootPoseTime>0&&player.onGround&&player.stance==='stand'&&player.hurtTime<=0&&equippedShopItem('weapon',player)?.weaponProfile.kind!=='melee'){
    const progress=1-player.shootPoseTime/characterStats(player).attackDuration;
    const frame=Math.max(0,(player.shotCount-1)%6),[sx,sy,sw,sh]=GOAT_MOVE_CUTS[frame],scale=.36;
    const cellWidth=assets.goatMove.naturalWidth/6,sourceAnchorX=frame*cellWidth+cellWidth/2-sx;
    const recoil=2+Math.sin(progress*Math.PI)*4,drawW=sw*scale,drawH=sh*scale,x=player.x+player.w/2-cameraX-player.facing*recoil,y=player.y+player.h+6+Math.sin(progress*Math.PI*2)*1.5;
    ctx.save();ctx.filter=actorInkFilter('contrast(1.42)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
    ctx.rotate(-player.facing*Math.sin(progress*Math.PI)*.025);
    ctx.drawImage(assets.goatMove,sx,sy,sw,sh,-sourceAnchorX*scale,-drawH,drawW,drawH);ctx.restore();
    const muzzle=muzzlePosition(player);drawAtlas(14,muzzle.x-cameraX,muzzle.y,42,42,player.facing<0);
    return;
  }
  const actionFrame=goatActionFrame(),isAction=actionFrame>=0,moveFrame=isAction?-1:Math.max(0,goatMoveFrame()),isWalking=moveFrame>=8;
  const frame=isAction?actionFrame:isWalking?moveFrame-8:moveFrame;
  const cuts=isAction?GOAT_ACTION_CUTS:isWalking?GOAT_WALK_CYCLE_CUTS:GOAT_MOVE_CUTS,[sx,sy,sw,sh]=cuts[frame];
  const image=isAction?assets.goatActions:isWalking?assets.goatWalkCycle:assets.goatMove,columns=isAction||isWalking?4:6,cellWidth=image.naturalWidth/columns,scale=isAction?.42:isWalking?.31:.36;
  const pencilFilter=isAction?'brightness(1.18) contrast(1.42)':isWalking?'brightness(1.07) contrast(1.42)':'contrast(1.42)';
  const sourceAnchorX=(frame%columns)*cellWidth+cellWidth/2-sx;
  const drawW=sw*scale,drawH=sh*scale,x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
  ctx.save();ctx.filter=actorInkFilter(pencilFilter);ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
  if(player.dashTime>0)ctx.globalAlpha=.78;
  ctx.drawImage(image,sx,sy,sw,sh,-sourceAnchorX*scale,-drawH,drawW,drawH);
  ctx.restore();
}

function knightMoveFrame(){
  if(!player.onGround||player.hurtTime>0||player.stance!=='stand'||state==='dying'||state==='dead')return -1;
  if(player.moveIntent||Math.abs(player.vx)>25)return 6+Math.floor(player.walkTime*8)%6;
  return Math.floor(player.idleTime*2.4)%6;
}

function knightActionFrame(){
  if(state==='dying'||state==='dead')return 7;
  if(player.hurtTime>0)return player.hurtTime>.17?4:5;
  if(player.stance==='duck')return 6;
  if(!player.onGround)return player.vy<0?(player.vy< -300?0:1):(player.vy<350?2:3);
  return -1;
}

function drawKnight(){
  if(player.shootPoseTime>0&&player.stance==='stand'&&player.hurtTime<=0&&!equippedShopItem('weapon',player)){
    const progress=1-player.shootPoseTime/characterStats(player).attackDuration,frame=Math.min(5,Math.floor(progress*6));
    const [sx,sy,sw,sh]=KNIGHT_ATTACK_CUTS[frame],scale=.62,cellWidth=assets.knightAttack.naturalWidth/6,sourceAnchorX=frame*cellWidth+cellWidth/2-sx;
    const drawW=sw*scale,drawH=sh*scale,x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
    ctx.save();ctx.filter=actorInkFilter('contrast(1.45)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
    ctx.drawImage(assets.knightAttack,sx,sy,sw,sh,-sourceAnchorX*scale,-drawH,drawW,drawH);ctx.restore();
    return;
  }
  const actionFrame=knightActionFrame(),isAction=actionFrame>=0,frame=isAction?actionFrame:Math.max(0,knightMoveFrame());
  const cuts=isAction?KNIGHT_ACTION_CUTS:KNIGHT_MOVE_CUTS,[sx,sy,sw,sh]=cuts[frame];
  const image=isAction?assets.knightActions:assets.knightMove,columns=isAction?4:6,cellWidth=image.naturalWidth/columns,scale=isAction?.36:.38;
  const sourceAnchorX=(frame%columns)*cellWidth+cellWidth/2-sx,drawW=sw*scale,drawH=sh*scale,x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
  ctx.save();ctx.filter=actorInkFilter('contrast(1.45)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
  if(player.dashTime>0)ctx.globalAlpha=.78;
  ctx.drawImage(image,sx,sy,sw,sh,-sourceAnchorX*scale,-drawH,drawW,drawH);ctx.restore();
}

function monkMoveFrame(){
  if(state==='dying'||state==='dead')return 7;
  if(player.hurtTime>0||player.stance==='duck')return 6;
  if(!player.onGround)return player.vy<0?4:5;
  if(player.moveIntent||Math.abs(player.vx)>25){const cycle=[1,2,3,2];return cycle[Math.floor(player.walkTime*9)%cycle.length];}
  return 0;
}

function monkAttackFrame(actor=player){
  if(actor.characterId!=='monk'||actor.shootPoseTime<=0||equippedShopItem('weapon',actor))return -1;
  const progress=1-actor.shootPoseTime/characterStats(actor).attackDuration;
  return Math.min(5,Math.floor(progress*6));
}

function drawMonk(){
  const attackFrame=monkAttackFrame();
  if(attackFrame>=0&&player.stance==='stand'&&player.hurtTime<=0){
    const [sx,sy,sw,sh]=MONK_ATTACK_CUTS[attackFrame],scale=.44,cellWidth=assets.monkAttack.naturalWidth/6,sourceAnchorX=attackFrame*cellWidth+cellWidth/2-sx;
    const x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
    ctx.save();ctx.filter=actorInkFilter('contrast(1.46)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
    ctx.drawImage(assets.monkAttack,sx,sy,sw,sh,-sourceAnchorX*scale,-sh*scale,sw*scale,sh*scale);ctx.restore();return;
  }
  const frame=monkMoveFrame(),[sx,sy,sw,sh]=MONK_MOVE_CUTS[frame],scale=.44,cellWidth=assets.monkMove.naturalWidth/4,sourceAnchorX=(frame%4)*cellWidth+cellWidth/2-sx;
  const x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
  ctx.save();ctx.filter=actorInkFilter('contrast(1.46)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
  ctx.drawImage(assets.monkMove,sx,sy,sw,sh,-sourceAnchorX*scale,-sh*scale,sw*scale,sh*scale);ctx.restore();
}

function drawHero(){
  if(player.characterId==='goat'){drawGoatGirl();return;}
  if(player.characterId==='knight'){drawKnight();return;}
  if(player.characterId==='monk'){drawMonk();return;}
  const physicalFallback=player.shootPoseTime>0&&player.bossFallbackShot===player.shotCount&&weaponDefinition(player).resource==='magic';
  const extraFrame=heroExtraFrame();
  if(extraFrame>=0){
    const [sx,sy,sw,sh]=HERO_EXTRA_CUTS[extraFrame],scale=.43,cellWidth=assets.heroExtra.naturalWidth/4;
    const sourceAnchorX=(extraFrame%4)*cellWidth+cellWidth/2-sx;
    const drawW=sw*scale,drawH=sh*scale,x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
    ctx.save();ctx.filter=actorInkFilter('brightness(.96) contrast(1.48)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
    ctx.drawImage(assets.heroExtra,sx,sy,sw,sh,-sourceAnchorX*scale,-drawH,drawW,drawH);
    ctx.restore();
    return;
  }
  if(player.shootPoseTime>0&&!physicalFallback&&player.onGround&&player.stance==='stand'&&equippedShopItem('weapon',player)?.weaponProfile.kind!=='melee'){
    const progress=1-player.shootPoseTime/characterStats(player).attackDuration;
    const frame=6+Math.min(5,Math.floor(progress*6)),[sx,sy,sw,sh]=HERO_WALK_CUTS[frame],scale=.48,cellWidth=assets.heroWalk.naturalWidth/6;
    const sourceAnchorX=(frame%6)*cellWidth+cellWidth/2-sx,drawW=sw*scale,drawH=sh*scale,x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
    ctx.save();ctx.filter=actorInkFilter('brightness(1.04) contrast(1.48)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
    ctx.drawImage(assets.heroWalk,sx,sy,sw,sh,-sourceAnchorX*scale,-drawH,drawW,drawH);ctx.restore();
    return;
  }
  const actionFrame=heroActionFrame();
  if(actionFrame>=0){
    const [sx,sy,sw,sh]=HERO_ACTION_CUTS[actionFrame],scale=.48,cellWidth=assets.heroActions.naturalWidth/6;
    const sourceAnchorX=(actionFrame%6)*cellWidth+cellWidth/2-sx;
    const drawW=sw*scale,drawH=sh*scale,x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
    ctx.save();ctx.filter=actorInkFilter('contrast(1.48)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
    ctx.drawImage(assets.heroActions,sx,sy,sw,sh,-sourceAnchorX*scale,-drawH,drawW,drawH);
    ctx.restore();
    return;
  }
  const walkFrame=heroWalkFrame();
  if(walkFrame>=0){
    const [sx,sy,sw,sh]=HERO_WALK_CYCLE_CUTS[walkFrame],scale=.36,cellWidth=assets.heroWalkCycle.naturalWidth/4;
    const sourceAnchorX=(walkFrame%4)*cellWidth+cellWidth/2-sx;
    const drawW=sw*scale,drawH=sh*scale,x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
    ctx.save();ctx.filter=actorInkFilter('brightness(1.04) contrast(1.48)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
    ctx.drawImage(assets.heroWalkCycle,sx,sy,sw,sh,-sourceAnchorX*scale,-drawH,drawW,drawH);
    ctx.restore();
    return;
  }
  const frame=0,[sx,sy,sw,sh]=HERO_ACTION_CUTS[frame],scale=.48,cellWidth=assets.heroActions.naturalWidth/6;
  const sourceAnchorX=cellWidth/2-sx;
  const drawW=sw*scale,drawH=sh*scale,x=player.x+player.w/2-cameraX,y=player.y+player.h+6;
  ctx.save();ctx.filter=actorInkFilter('contrast(1.48)');ctx.translate(x,y);if(player.facing<0)ctx.scale(-1,1);
  if(player.dashTime>0)ctx.globalAlpha=.78;
  ctx.drawImage(assets.heroActions,sx,sy,sw,sh,-sourceAnchorX*scale,-drawH,drawW,drawH);
  ctx.restore();
}

function drawActor(actor,label=''){
  const primary=player,originalState=state;
  player=actor;
  if(actor!==defeatedActor&&(state==='dying'||state==='dead'))state='playing';
  drawHero();
  drawEquippedWeapon(actor);drawUsedItemIndicator(actor);state=originalState;player=primary;
  if(!label)return;
  const x=actor.x+actor.w/2-cameraX,y=actor.y-14;
  ctx.save();ctx.fillStyle='#eee9ddde';ctx.strokeStyle='#34312d';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(x,y,21,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#34312d';ctx.font='900 11px "Sketchbound Hand", sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x,y);ctx.restore();
}

function drawShopItemInWorld(item,x,y,size,rotation=0,flip=false,alpha=1){
  const art=shopItemArt(item);if(!art?.image.complete||!art.image.naturalWidth)return;
  ctx.save();ctx.globalAlpha=alpha;ctx.globalCompositeOperation='multiply';ctx.translate(x,y);ctx.rotate(rotation);if(flip)ctx.scale(-1,1);
  ctx.drawImage(art.image,...art.cut,-size/2,-size/2,size,size);ctx.restore();
}

function drawEquippedWeapon(actor){
  const item=equippedShopItem('weapon',actor);if(!item?.weaponProfile)return;
  const pose=equippedWeaponPose(actor,item);
  drawShopItemInWorld(item,pose.x-cameraX,pose.y,pose.size,pose.rotation,actor.facing<0,pose.alpha);
}

function equippedWeaponPose(actor,item=equippedShopItem('weapon',actor)){
  const profile=item?.weaponProfile||{},stats=characterStats(actor),attacking=actor.shootPoseTime>0;
  const physicalFallback=attacking&&actor.bossFallbackShot===actor.shotCount&&profile.resource==='magic';
  const progress=attacking?clamp(1-actor.shootPoseTime/(stats.attackDuration||.4),0,1):0,eased=(1-Math.cos(progress*Math.PI))/2;
  const facing=actor.facing||1,centerX=actor.x+actor.w/2;
  const ranged=profile.kind==='ranged'&&!physicalFallback;
  let forward=ranged?35:29,y=actor.y+actor.h*.48,rotation=ranged?.48:.7;
  if(attacking&&ranged){
    forward-=Math.sin(progress*Math.PI)*8;
    rotation+=(profile.motion==='cast'?Math.sin(progress*Math.PI)*-.34:Math.sin(progress*Math.PI*2)*.05);
    y-=profile.motion==='cast'?Math.sin(progress*Math.PI)*9:0;
  }else if(attacking){
    const motion=physicalFallback?'bonk':profile.motion||'slash';
    if(motion==='stab'||motion==='thrust'){forward=25+Math.sin(progress*Math.PI)*Math.min(72,(profile.reach||100)*.48);rotation=.42-Math.sin(progress*Math.PI)*.2;}
    else if(motion==='chop'){forward=31+Math.sin(progress*Math.PI)*22;y-=Math.sin(progress*Math.PI)*24;rotation=-1.35+eased*2.18;}
    else if(motion==='smash'||motion==='bonk'){forward=27+Math.sin(progress*Math.PI)*18;y-=Math.sin(progress*Math.PI)*30;rotation=-1.55+eased*2.42;}
    else if(motion==='flail'){forward=38+Math.sin(progress*Math.PI)*46;y-=Math.sin(progress*Math.PI*2)*26;rotation=-.9+progress*Math.PI*2;}
    else if(motion==='double'){forward=35+Math.sin(progress*Math.PI)*31;rotation=-1.05+Math.sin(progress*Math.PI*2)*1.3;}
    else{forward=33+Math.sin(progress*Math.PI)*34;rotation=-1.08+eased*2.14;}
  }
  return{x:centerX+facing*forward,y,size:profile.artSize||72,rotation:facing*rotation,alpha:.98,progress};
}

function drawUsedItemIndicator(actor){
  if(actor.itemUseTime<=0)return;
  const item=SHOP_ITEMS[actor.itemUseId],progress=1-actor.itemUseTime/1.2;
  drawShopItemInWorld(item,actor.x+actor.w/2-cameraX,actor.y-25-progress*22,54,Math.sin(progress*Math.PI*2)*.08,false,clamp(actor.itemUseTime/.35,0,1));
}

function backgroundParallaxOffset(cameraPosition=cameraX){
  const image=assets.background,scale=Math.max(VIEW_W/image.naturalWidth,VIEW_H/image.naturalHeight)*1.04;
  const travel=Math.max(0,image.naturalWidth*scale-VIEW_W);
  return-Math.min(travel,Math.max(0,cameraPosition)*.18);
}

function drawBackground(){
  ctx.fillStyle='#eeeae0';ctx.fillRect(0,0,VIEW_W,VIEW_H);
  if(fountainRoomActive){
    drawStaticSceneBackground('fountain',backgroundContext=>{
      const shade=backgroundContext.createLinearGradient(0,0,0,VIEW_H);shade.addColorStop(0,'#b9b3a8');shade.addColorStop(.25,'#ded8cd');shade.addColorStop(1,'#eee9df');backgroundContext.fillStyle=shade;backgroundContext.fillRect(0,0,VIEW_W,VIEW_H);
      backgroundContext.fillStyle='#d8d1c5';backgroundContext.fillRect(124,44,1032,620);backgroundContext.strokeStyle='#34312d';backgroundContext.lineWidth=8;backgroundContext.strokeRect(124,44,1032,620);
      backgroundContext.lineWidth=2;backgroundContext.globalAlpha=.22;
      for(let line=0;line<24;line++){
        const y=68+line*24,offset=(line%2)*29;backgroundContext.beginPath();backgroundContext.moveTo(132,y);backgroundContext.lineTo(1148,y-9);backgroundContext.stroke();
        for(let x=150+offset;x<1140;x+=76){backgroundContext.beginPath();backgroundContext.moveTo(x,y-17);backgroundContext.lineTo(x-18,y+9);backgroundContext.stroke();}
      }
      backgroundContext.globalAlpha=1;backgroundContext.fillStyle='#eeeae0';backgroundContext.fillRect(582,36,116,24);backgroundContext.strokeStyle='#34312d';backgroundContext.lineWidth=5;backgroundContext.beginPath();backgroundContext.moveTo(124,44);backgroundContext.lineTo(582,44);backgroundContext.moveTo(698,44);backgroundContext.lineTo(1156,44);backgroundContext.stroke();
    });return;
  }
  if(shopSceneActive){
    const image=assets.shopCatalog;if(!image.complete||!image.naturalWidth)return;
    const scale=Math.min(VIEW_W/image.naturalWidth,VIEW_H/image.naturalHeight),dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;
    drawStaticSceneBackground('shop',backgroundContext=>backgroundContext.drawImage(image,(VIEW_W-dw)/2,(VIEW_H-dh)/2,dw,dh));return;
  }
  if(bossArenaActive){
    const image=assets.bossArena;if(!image.complete||!image.naturalWidth)return;
    const scale=Math.max(VIEW_W/image.naturalWidth,VIEW_H/image.naturalHeight),dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;
    drawStaticSceneBackground('boss',backgroundContext=>backgroundContext.drawImage(image,(VIEW_W-dw)/2,(VIEW_H-dh)/2,dw,dh));return;
  }
  staticSceneBackground=null;staticSceneBackgroundKey='';
  const theme=levelData()?.theme||{},image=assets.background,scale=Math.max(VIEW_W/image.naturalWidth,VIEW_H/image.naturalHeight)*(theme.zoom||1.04),dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;
  ctx.save();ctx.globalAlpha=theme.alpha??.88;
  ctx.drawImage(image,backgroundParallaxOffset(),(VIEW_H-dh)/2+(theme.y||0),dw,dh);ctx.restore();
  ctx.fillStyle=levelShade;ctx.fillRect(0,0,VIEW_W,VIEW_H);
}

function drawPlatform(platform){
  if(platform.hidden)return;
  const screenX=platform.x-cameraX;if(screenX>VIEW_W+360||screenX+platform.w< -360)return;
  if(Number.isInteger(platform.terrain)&&assets.levelTiles2.complete){
    const [sx,sy,sw,sh]=LEVEL_TILE_CUTS[platform.terrain],drawW=platform.w+(platform.ground?22:34);
    const naturalH=drawW*sh/sw,drawH=platform.ground?clamp(naturalH,138,205):clamp(naturalH,102,154),drawX=screenX-(drawW-platform.w)/2,drawY=platform.surfaceY-7;
    ctx.save();ctx.beginPath();ctx.rect(screenX-22,drawY-3,platform.w+44,Math.max(drawH+12,VIEW_H-drawY));ctx.clip();
    ctx.drawImage(assets.levelTiles2,sx,sy,sw,sh,drawX,drawY,drawW,drawH);ctx.restore();return;
  }
  if(platform.ground){
    const tileW=315,tileH=190;
    ctx.save();ctx.beginPath();ctx.rect(screenX,platform.y-24,platform.w,VIEW_H-platform.y+24);ctx.clip();
    for(let x=platform.x;x<platform.x+platform.w;x+=tileW-34){
      const width=Math.min(tileW,platform.x+platform.w-x+34);
      drawAtlas(platform.type,x-cameraX+width/2,platform.y+tileH/2-17,width,tileH);
    }
    ctx.restore();
  }else drawAtlas(platform.type,screenX+platform.w/2,platform.y+48,platform.w+54,146);
}

function drawGapSpikes(){
  for(const spike of spikes||[]){
    if(!spike.gap)continue;
    const screenX=spike.x-cameraX;if(screenX>VIEW_W||screenX+spike.w<0)continue;
    const drawWidth=Math.max(150,spike.w+48),drawHeight=drawWidth*749/2100,taper=Math.min(44,spike.w*.22),top=VIEW_H-spike.h;
    ctx.save();ctx.beginPath();ctx.moveTo(screenX,VIEW_H);ctx.lineTo(screenX+taper,top+4);ctx.lineTo(screenX+spike.w-taper,top+4);ctx.lineTo(screenX+spike.w,VIEW_H);ctx.closePath();ctx.clip();
    ctx.drawImage(assets.gapSpikes,screenX-(drawWidth-spike.w)/2,VIEW_H-drawHeight,drawWidth,drawHeight);ctx.restore();
  }
}

function drawFountainRoomArt(){
  if(!fountainRoomActive||!assets.magicFountain.complete)return;
  const rope=MAGIC_FOUNTAIN_CUTS[4],ropeScale=.72,ropeW=rope[2]*ropeScale,ropeH=rope[3]*ropeScale;
  ctx.save();ctx.drawImage(assets.magicFountain,...rope,VIEW_W/2-ropeW/2,38,ropeW,ropeH);ctx.restore();
  const frame=Math.floor(worldTime*5)%4,[sx,sy,sw,sh]=MAGIC_FOUNTAIN_CUTS[frame],scale=.66,drawW=sw*scale,drawH=sh*scale;
  ctx.save();ctx.drawImage(assets.magicFountain,sx,sy,sw,sh,VIEW_W/2-drawW/2,630-560*scale,drawW,drawH);ctx.restore();
  ctx.save();ctx.fillStyle='#eee9dfe8';ctx.strokeStyle='#34312d';ctx.lineWidth=3;ctx.textAlign='center';ctx.font='900 16px "Sketchbound Hand", sans-serif';
  ctx.fillRect(VIEW_W/2-186,74,372,38);ctx.strokeRect(VIEW_W/2-186,74,372,38);ctx.fillStyle='#34312d';ctx.fillText('MAGIC FOUNTAIN · JUMP AT THE ROPE TO RETURN',VIEW_W/2,99);ctx.restore();
}

function drawBossArenaFountain(){
  if(!bossArenaActive||!bossFountain||!assets.magicFountain.complete||!assets.magicFountain.naturalWidth)return;
  const ratio=clamp(bossFountain.water/bossFountain.capacity,0,1),dry=ratio<=0;
  if(dry&&assets.magicFountainDry.complete&&assets.magicFountainDry.naturalWidth){
    const sx=65,sy=21,sw=1275,sh=1003,drawW=184,drawH=drawW*sh/sw;
    ctx.save();ctx.filter='contrast(1.12)';ctx.drawImage(assets.magicFountainDry,sx,sy,sw,sh,bossFountain.x-drawW/2,bossFountain.surfaceY-drawH+2,drawW,drawH);ctx.restore();return;
  }
  const frame=ratio>.72?2:ratio>.42?1:ratio>.12?0:3,[sx,sy,sw,sh]=MAGIC_FOUNTAIN_CUTS[frame],scale=.45,drawW=sw*scale,drawH=sh*scale;
  const disabled=bossFountain.disabledTime>0,warning=bossFountain.warningTime>0;
  ctx.save();
  if(disabled){ctx.globalAlpha=.42+(Math.sin(worldTime*18)+1)*.08;ctx.filter='grayscale(1) contrast(1.7) brightness(.72)';}
  else if(warning){ctx.filter='grayscale(1) contrast(2.05) brightness(.74)';}
  else if(bossFountain.hitFlash>0){ctx.filter='contrast(2.1) brightness(1.4)';}
  ctx.drawImage(assets.magicFountain,sx,sy,sw,sh,bossFountain.x-drawW/2,bossFountain.surfaceY-560*scale,drawW,drawH);ctx.restore();
  if(warning){
    ctx.save();ctx.translate(bossFountain.x,bossFountain.surfaceY-116);ctx.rotate(worldTime*.55);ctx.strokeStyle='#2d2a27';ctx.globalAlpha=.62;ctx.lineWidth=4;ctx.setLineDash([13,9]);ctx.beginPath();ctx.ellipse(0,0,88,124,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
}

function drawGroundEndCap(platform,side){
  const edge=(side==='right'?platform.x+platform.w:platform.x)-cameraX;
  if(edge< -70||edge>VIEW_W+70)return;
  const [sx,sy,sw,sh]=GROUND_END_CUTS[side==='right'?0:1],width=132,height=97;
  const drawX=side==='right'?edge-width*.79:edge-width*.21,drawY=platform.surfaceY-27;
  ctx.save();ctx.drawImage(assets.groundEnds,sx,sy,sw,sh,drawX,drawY,width,height);ctx.restore();
}

function drawGroundEndCaps(){
  for(const platform of platforms||[]){
    if(!platform.ground||platform.hidden||Number.isInteger(platform.terrain))continue;
    if(platform.x>1)drawGroundEndCap(platform,'left');
    if(platform.x+platform.w<activeWorldWidth-1)drawGroundEndCap(platform,'right');
  }
}

function drawMoonGate(){
  if(bossArenaActive||shopSceneActive)return;
  const level=customMapActive?null:levelData();
  if(level?.exit==='down'){
    const signX=level.goalX-88-cameraX,surfaceY=groundSurfaceAt(level.goalX-88),[sx,sy,sw,sh]=DOWN_SIGN_CUT;
    if(signX> -150&&signX<VIEW_W+150){
      ctx.save();ctx.filter='contrast(1.32)';ctx.drawImage(assets.downSign,sx,sy,sw,sh,signX-52,surfaceY-184,104,192);ctx.restore();
    }
    return;
  }
  const gateWorldX=customMapActive?customMap.goal.x:level.width-145,gateX=gateWorldX-cameraX;
  if(gateX< -220||gateX>VIEW_W+220)return;
  const yOffset=(customMapActive?customMap.goal.y:groundSurfaceAt(gateWorldX))-659;
  ctx.save();
  ctx.globalAlpha=.24+.08*Math.sin(worldTime*2.5);
  ctx.fillStyle='#f8f1dd';ctx.beginPath();ctx.arc(gateX,326+yOffset,96,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
  drawAtlas(2,gateX-92,490+yOffset,138,310);
  drawAtlas(2,gateX+92,490+yOffset,138,310,true);
  drawAtlas(3,gateX,318+yOffset,290,128);
  ctx.strokeStyle='#4a4741';ctx.lineWidth=4;ctx.setLineDash([11,8]);ctx.beginPath();ctx.arc(gateX,416+yOffset,82,Math.PI,0);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();
}

function drawExitSpikes(){
  const level=customMapActive?null:levelData();
  if(!level||level.exit!=='down'||!exitSpikes||exitSpikes.time<0)return;
  const frame=exitSpikes.time<.18?2:exitSpikes.time<.72?3:4,[sx,sy,sw,sh]=TRANSITION_CUTS[frame],surface=groundSurfaceAt(level.goalX+72);
  const width=176,height=frame===3?126:86;
  ctx.save();ctx.filter='contrast(1.42)';ctx.drawImage(assets.bossTransition,sx,sy,sw,sh,level.goalX+77-cameraX-width/2,surface-height,width,height);ctx.restore();
}

function drawLevelTransition(){
  if(!levelTransition)return;
  const actorX=player.x+player.w/2-cameraX;
  if(levelTransition.phase==='fall'||levelTransition.phase==='arrive'){
    const [sx,sy,sw,sh]=TRANSITION_CUTS[0];ctx.save();ctx.globalAlpha=.8;ctx.filter='contrast(1.25)';
    ctx.drawImage(assets.bossTransition,sx,sy,sw,sh,actorX-82,player.y+player.h/2-110,164,220);ctx.restore();
  }else if(levelTransition.phase==='land'){
    const [sx,sy,sw,sh]=TRANSITION_CUTS[1],progress=clamp(levelTransition.time/.48,0,1),width=170+progress*90;
    ctx.save();ctx.globalAlpha=1-progress*.8;ctx.filter='contrast(1.25)';ctx.drawImage(assets.bossTransition,sx,sy,sw,sh,actorX-width/2,player.y+player.h-70,width,92);ctx.restore();
  }
}

function draw(){
  ctx.clearRect(0,0,VIEW_W,VIEW_H);drawBackground();
  ctx.save();
  for(const platform of platforms||[])drawPlatform(platform);
  drawGapSpikes();
  drawGroundEndCaps();
  drawFountainRoomArt();
  drawBossArenaFountain();
  if(!fountainRoomActive){drawMoonGate();drawExitSpikes();}
  for(const prop of props||[]){
    if(prop.x-cameraX< -100||prop.x-cameraX>VIEW_W+100)continue;
    drawGroundProp(prop.kind||0,prop.x-cameraX,groundSurfaceAt(prop.x),prop.w||118,prop.h||150);
  }
  for(const wave of bossWaves||[])drawBossWave(wave);
  for(const enemy of enemies||[]){
    if(enemy.dead||enemy.x-cameraX< -100||enemy.x-cameraX>VIEW_W+100)continue;
    drawEnemySprite(enemy);
  }
  for(const coin of coinDrops||[])drawCoinDrop(coin);
  for(const burst of defeatBursts||[])drawDefeatBurst(burst);
  for(const bullet of bullets||[])drawPlayerProjectile(bullet);
  for(const shot of enemyShots||[])drawEnemyShot(shot);
  for(const impact of wallImpacts||[])drawWallImpact(impact);
  if(!shopSceneActive){
    for(const remote of remotePlayers||[])drawActor(remote,'P2');
    partners.forEach((actor,index)=>drawActor(actor,`P${index+2}`));
    if(player)drawActor(player,partners.length||remotePlayers.length?'P1':'');
  }
  drawLevelTransition();
  ctx.restore();
}

function loop(now){
  const dt=Math.min(.033,(now-lastTime)/1000||0);lastTime=now;
  update(dt);updateLoadoutHud();updateBossHud();
  if(['playing','dying','transition','arenaTransition','shopEntry','shop','shopExit'].includes(state))draw();
  requestAnimationFrame(loop);
}

function bindControls(){
  addEventListener('gamepadconnected',()=>{
    padPrevious=[[],[],[],[]];padStickLocked=[false,false,false,false];updateControllerStatus();
    renderLocalControllerSlots();
    if(state==='characterSelect'&&pendingMode==='local')renderLocalCharacterStatus();
    if(state==='menu')focusControllerButton($('startButton'));
  });
  addEventListener('gamepaddisconnected',()=>{
    padPrevious=[[],[],[],[]];padStickLocked=[false,false,false,false];updateControllerStatus();
    renderLocalControllerSlots();
    if(state==='characterSelect'&&pendingMode==='local')renderLocalCharacterStatus();
  });
  addEventListener('keydown',event=>{
    const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName||'');
    const remoteAction=typing?null:remoteActionForEvent(event);
    if(remoteAction){
      event.preventDefault();
      if(remoteAction==='back'){if(!event.repeat)handleRemoteBack();return;}
      if(remoteAction==='pause'){if(!event.repeat)pauseGame();return;}
      if(remoteUsesMenuNavigation()){
        if(['left','right','up','down'].includes(remoteAction)){if(!event.repeat)moveMenuFocus(remoteAction);return;}
        if(remoteAction==='confirm'){if(!event.repeat)activateFocusedMenuButton();return;}
      }
      const remoteCode=remoteInputCode(remoteAction);
      if(remoteCode){holdRemoteInput(event,remoteCode);return;}
    }
    if(typing)return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(event.code))event.preventDefault();
    if(!keys.has(event.code))justPressed.add(event.code);
    keys.add(event.code);
  });
  addEventListener('keyup',event=>{
    if(releaseRemoteInput(remoteEventIdentity(event))){event.preventDefault();return;}
    keys.delete(event.code);
  });
  addEventListener('blur',()=>{
    for(const {timer} of remoteHeldInputs.values())if(timer)clearTimeout(timer);
    remoteHeldInputs.clear();keys.clear();
    if(state==='playing')pauseGame();
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pauseGame();});
  for(const button of document.querySelectorAll('[data-touch]')){
    const action=button.dataset.touch;
    const down=event=>{event.preventDefault();if(action==='pause'){pauseGame();return;}touch[action]=true;};
    const up=event=>{event.preventDefault();if(action!=='pause'&&action!=='jump'&&action!=='dash'&&action!=='item')touch[action]=false;};
    button.addEventListener('pointerdown',down);button.addEventListener('pointerup',up);button.addEventListener('pointercancel',up);button.addEventListener('pointerleave',up);
  }
  canvas.addEventListener('pointerdown',event=>{if(state==='playing'&&event.pointerType==='mouse'){touch.shoot=true;}});
  canvas.addEventListener('pointerup',()=>touch.shoot=false);
  const makerCanvas=$('mapMakerCanvas');
  const pointOnMaker=event=>{const rect=makerCanvas.getBoundingClientRect();return{x:mapMakerViewX()+(event.clientX-rect.left)*VIEW_W/rect.width,y:(event.clientY-rect.top)*VIEW_H/rect.height};};
  makerCanvas.addEventListener('pointermove',event=>{if(state!=='mapMaker')return;mapCursor=pointOnMaker(event);drawMapMaker();});
  makerCanvas.addEventListener('pointerdown',event=>{if(state!=='mapMaker')return;event.preventDefault();const point=pointOnMaker(event);placeMapObject(point.x,point.y);makerCanvas.focus({preventScroll:true});});
  $('startButton').onclick=()=>openCharacterMenu('solo',1);
  $('localButton').onclick=openLocalMenu;
  $('mapMakerButton').onclick=openMapMaker;
  document.querySelectorAll('[data-map-tool]').forEach(button=>button.onclick=()=>selectMapTool(button.dataset.mapTool));
  $('mapMakerBackButton').onclick=backToMenu;
  $('mapMakerClearButton').onclick=clearCustomMap;
  $('mapMakerPrevButton').onclick=()=>setMapMakerPage(mapMakerPage-1);
  $('mapMakerNextButton').onclick=()=>setMapMakerPage(mapMakerPage+1);
  $('mapMakerPlayButton').onclick=playCustomMap;
  $('twoPlayerButton').onclick=()=>openCharacterMenu('local',2);
  $('threePlayerButton').onclick=()=>openCharacterMenu('local',3);
  $('fourPlayerButton').onclick=()=>openCharacterMenu('local',4);
  $('localBackButton').onclick=backToMenu;
  $('onlineButton').onclick=()=>openCharacterMenu('online',1);
  $('kidCharacterButton').onclick=()=>chooseCharacter('kid');
  $('goatCharacterButton').onclick=()=>chooseCharacter('goat');
  $('knightCharacterButton').onclick=()=>chooseCharacter('knight');
  $('monkCharacterButton').onclick=()=>chooseCharacter('monk');
  $('characterStartButton').onclick=()=>confirmCharacter(true);
  $('characterBackButton').onclick=()=>pendingMode==='local'?openLocalMenu():pendingMode==='mapMaker'?openMapMaker():backToMenu();
  $('createRoomButton').onclick=createOnlineRoom;
  $('joinRoomButton').onclick=joinOnlineRoom;
  $('onlineBackButton').onclick=backToMenu;
  $('roomCodeInput').addEventListener('input',event=>{event.target.value=event.target.value.replace(/[^a-z0-9]/gi,'').toUpperCase();});
  $('roomCodeInput').addEventListener('keydown',event=>{if(event.code==='Enter')joinOnlineRoom();});
  $('resumeButton').onclick=pauseGame;
  $('restartButton').onclick=()=>startGame(gameMode);
  $('bossPlanButton').onclick=()=>startBossFight('plan');
  $('bossChargeButton').onclick=()=>startBossFight('charge');
  document.querySelectorAll('[data-shop-item]').forEach(button=>{
    const focusItem=()=>{const index=shopSelectableButtons().indexOf(button);if(index>=0)setShopSelection(index);return index;};
    button.onclick=()=>{focusItem();buyShopItem(button.dataset.shopItem);};
    button.onpointermove=event=>state==='shop'&&event.pointerType==='mouse'&&focusItem();
    button.onfocus=()=>state==='shop'&&focusItem();
  });
  document.querySelectorAll('[data-shop-category-index]').forEach(button=>{
    button.onclick=()=>setShopCategory(Number(button.dataset.shopCategoryIndex));
    button.onfocus=()=>state==='shop'&&setShopCategory(Number(button.dataset.shopCategoryIndex));
  });
  $('shopContinueButton').onclick=leaveShop;
  $('againButton').onclick=()=>startGame(gameMode);
}

buildShopCatalog();bindControls();
createWorld();currentLevel=0;resetPlayer(true);updateHud();
const fontReady=document.fonts?document.fonts.load('16px "Sketchbound Hand"'):Promise.resolve();
Promise.allSettled([...Object.values(assets).filter(image=>image.src).map(image=>image.decode()),fontReady]).then(()=>{
  state='menu';$('loading').classList.remove('visible');$('menu').classList.add('visible');drawCharacterPreviews();draw();
}).catch(error=>{$('loading').textContent='THE PENCILS BROKE · REFRESH';console.error(error);});
requestAnimationFrame(loop);

globalThis.__SKETCHBOUND__={
  VIEW_W,VIEW_H,WORLD_W,MAP_WORLD_W,MAP_TOOLS,REMOTE_ACTION_BY_NAME,REMOTE_ACTION_BY_KEY_CODE,ENEMY_CUTS,NEW_ENEMY_CUTS,LEVEL_TILE_CUTS,NEW_ENEMY_TYPES,ENEMY_ART_SCALE,BOSS_TYPES,BOSS_ATTACK_CYCLE,BOSS_ATTACK_PATTERNS,BOSS_BEHAVIORS,BOSS_FAIRNESS,ENEMY_DEFS,DOWN_SIGN_CUT,TRANSITION_CUTS,BOSS_CUTS,BOSS_ACTION_CUTS,BOSS_ACTION_ANCHORS,OGRE_TEN_CUTS,OGRE_INK_BOUNDS,OGRE_DRAW_SCALE,OGRE_HITBOX_WIDTH_RATIO,OGRE_HITBOX_TOP_RATIO,OGRE_HITBOX_BOTTOM_RATIO,MAGIC_FOUNTAIN_CUTS,BOSS_EFFECT_CUTS,BOSS_WAVE_CUTS,SHOP_CUTS,SHOP_ITEM_CUTS,FIREBALL_CUTS,CLASS_WEAPON_CUTS,CLASS_PROJECTILE_CUTS,GOLD_COIN_CUTS,GROUND_END_CUTS,SHOP_CATEGORIES,SHOP_ITEMS,SHOP_ITEM_LIST,SHOP_CATALOG_CUT,SHOP_WEAPON_PROFILES,WIZARD_MAGIC,HERO_CUTS,HERO_ACTION_CUTS,HERO_WALK_CUTS,HERO_WALK_CYCLE_CUTS,HERO_EXTRA_CUTS,GOAT_MOVE_CUTS,GOAT_ACTION_CUTS,GOAT_DASH_CUTS,GOAT_WALK_CYCLE_CUTS,KNIGHT_MOVE_CUTS,KNIGHT_ACTION_CUTS,KNIGHT_ATTACK_CUTS,MONK_MOVE_CUTS,MONK_ATTACK_CUTS,DEFEAT_BURST_CUTS,GROUND_PROP_CUTS,CHARACTERS,CHARACTER_PROFILES,LEVELS,assets,shopItemImages,ensureImage,ensureImages,prepareShopArt,prepareBossArt,startGame,restartCheckpoint,loadLevel,advanceLevel,levelBalanceReport,characterJumpRange,createEnemy,findClearEnemySpawn,updateEnemies,updateEnemyShots,fireEnemyShot,spawnEnemyCoins,enemyCoinReward,updateCoinDrops,bossActionFrame,ogreActionVisual,enemyHitbox,ogreHitbox,enemyShapeIntersectsRect,sweptHorizontalEnemyDistance,actorStompsEnemy,bounceFromEnemy,bossWaveGeometry,bossGroundY,snapBossToGround,startBossAttack,updateBossEnemy,updateBossWaves,updateBossHud,pauseGame,shoot,shootActor,startBossFallbackAttack,activeWizardFireballs,updateActorMagic,updateBossArenaFountain,updateMagicHud,hurtPlayer,hurtActor,fallFromWorld,enterFountainChamber,leaveFountainChamber,updateFountainRoom,finish,setPlayerStance,resolvePlatformSides,backgroundParallaxOffset,actorInkFilter,heroActionFrame,heroWalkFrame,heroExtraFrame,goatMoveFrame,goatActionFrame,goatDashFrame,knightMoveFrame,knightActionFrame,monkMoveFrame,monkAttackFrame,updateMeleeAttacks,weaponMeleeHitbox,equippedWeaponPose,currentWeaponId,weaponDefinition,weaponConditionFor,classWeaponNeedsSupply,repairClassWeapon,openCharacterMenu,chooseCharacter,confirmCharacter,openMapMaker,selectMapTool,placeMapObject,clearCustomMap,playCustomMap,drawMapMaker,setMapMakerPage,beginBossEncounter,startBossFight,readyActorForCombat,currentShopOffers,shopSelectableButtons,setShopSelection,setShopCategory,focusShopCategory,buildShopCatalog,drawShopCatalogSprites,openShop,buyShopItem,equipShopItem,cycleOwnedWeapon,useShopItem,useNextShopItem,applyShopPurchase,updateShopScene,leaveShop,finishShopExit,beginArenaTransition,setupBossArena,spawnBossInArena,updateArenaTransition,updateBossFlow,updateExitSpikes,beginDownTransition,updateLevelTransition,remoteActionForEvent,moveMenuFocus,activateFocusedMenuButton,handleRemoteBack,
  PARTY_CAMERA_MARGIN,PARTY_MAX_SPREAD,actorHorizontalMovementBounds,partyCameraTarget,renderLocalControllerSlots,
  get state(){return state;},get worldTime(){return worldTime;},get selectedCharacter(){return selectedCharacter;},get localCharacterSelections(){return [...localCharacterSelections];},get localCharacterReady(){return [...localCharacterReady];},get gameMode(){return gameMode;},get localPlayerCount(){return localPlayerCount;},get currentLevel(){return currentLevel;},get currentLevelData(){return levelData();},get player(){return player;},get partner(){return partner;},get partners(){return partners;},get remotePlayers(){return remotePlayers;},get onlineSession(){return onlineSession;},get shopSelectionIndex(){return shopSelectionIndex;},get shopCategoryIndex(){return shopCategoryIndex;},get shopFocusZone(){return shopFocusZone;},get purchasedShopItems(){return[...purchasedShopItems];},get equippedShopItems(){return{...equippedShopItems};},get equippedClassWeapons(){return{...equippedClassWeapons};},get weaponConditions(){return JSON.parse(JSON.stringify(weaponConditions));},get usableShopItems(){return[...usableShopItems];},get usedShopItems(){return[...usedShopItems];},get platforms(){return platforms;},get spikes(){return spikes;},get traps(){return traps;},get enemies(){return enemies;},get bullets(){return bullets;},get enemyShots(){return enemyShots;},get bossWaves(){return bossWaves;},get coinDrops(){return coinDrops;},get wallImpacts(){return wallImpacts;},get defeatBursts(){return defeatBursts;},get coins(){return coins;},get runUpgrades(){return{...runUpgrades};},get stageBoss(){return stageBoss;},get exitSpikes(){return exitSpikes;},get levelTransition(){return levelTransition;},get arenaTransition(){return arenaTransition?{...arenaTransition}:null;},get bossArenaActive(){return bossArenaActive;},get bossFountain(){return bossFountain?{...bossFountain}:null;},get shopSceneActive(){return shopSceneActive;},get fountainRoomActive(){return fountainRoomActive;},get fountainEntrance(){return fountainEntrance?{...fountainEntrance}:null;},get fountainClimb(){return fountainClimb?{time:fountainClimb.time,playerIndex:fountainClimb.actor?.playerIndex}:null;},get customMap(){return customMap;},get mapTool(){return mapTool;},get mapMakerPage(){return mapMakerPage;},get activeWorldWidth(){return activeWorldWidth;},
  snapshot:()=>({state,gameMode,localPlayerCount,localCharacterSelections:[...localCharacterSelections],localCharacterReady:[...localCharacterReady],score,coins,runUpgrades:{...runUpgrades},currentLevel,levelName:customMapActive?'CUSTOM MAP':levelData().name,totalLevels:LEVELS.length,activeWorldWidth,customMapActive,bossArenaActive,fountainRoomActive,fountainEntrance:fountainEntrance?{...fountainEntrance}:null,arenaTransition:arenaTransition?{...arenaTransition}:null,boss:stageBoss?{enabled:stageBoss.enabled,status:stageBoss.status,type:stageBoss.type}:null,transition:levelTransition?{...levelTransition}:null,player:{...player},partner:partner?{...partner}:null,partners:partners.map(actor=>({...actor})),remotePlayers:remotePlayers.length,platforms:platforms.length,spikes:spikes.length,traps:traps.length,enemies:enemies.length,enemyShots:enemyShots.length,collectibles:coinDrops.length})
};
