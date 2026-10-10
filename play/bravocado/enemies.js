'use strict';
(()=>{
const ranks=['Dew','Bud','Leaf','Grove','Thorn','Rind','Blight','Moon','Royal','Apex'];
const families=[
 {id:'gnat',name:'Gnat',art:'grunt',behavior:'sway',radius:15,speed:3},
 {id:'skitter',name:'Skitter',art:'runner',behavior:'zigzag',radius:14,speed:15,pursuer:true},
 {id:'scarab',name:'Scarab',art:'brute',behavior:'charge',radius:22,speed:-7},
 {id:'ring-mite',name:'Ring Mite',art:'ring-mite',behavior:'surround',radius:17,speed:5},
 {id:'pincer-beetle',name:'Pincer Beetle',art:'pincer-beetle',behavior:'flank',radius:21,speed:1},
 {id:'vine-crawler',name:'Vine Crawler',art:'vine-crawler',behavior:'spiral',radius:18,speed:7},
 {id:'glider-moth',name:'Glider Moth',art:'glider-moth',behavior:'swoop',radius:18,speed:12},
 {id:'lantern-wasp',name:'Lantern Wasp',art:'lantern-wasp',behavior:'shooter',radius:16,speed:10},
 {id:'seed-snail',name:'Seed Snail',art:'seed-snail',behavior:'wall',radius:24,speed:-13},
 {id:'tyrant',name:'Tyrant',art:'boss',behavior:'commander',radius:27,speed:-3}
];
const enemyTypes=[];
for(let rank=0;rank<ranks.length;rank++)for(let familyIndex=0;familyIndex<families.length;familyIndex++){
 const family=families[familyIndex],number=rank*families.length+familyIndex+1,boss=number===100,elite=family.id==='tyrant';
 const hp=Math.round(20+number*2.1+Math.pow(number,1.35)*.3)*(boss?1.75:1);
 enemyTypes.push({
  id:`e${String(number).padStart(3,'0')}`,number,name:`${ranks[rank]} ${family.name}`,rank:rank+1,
  family:family.id,art:family.art,behavior:family.behavior,radius:boss?50:family.radius+Math.floor(rank/3),
  hp:Math.round(hp),damage:Number((3+number*.1).toFixed(1)),speed:Math.round(62+number*.32+family.speed),
  hue:rank*23+(familyIndex%3)*7,saturation:1+rank*.045,size:boss?3.8:3.55+(familyIndex%3)*.16,
  shoots:family.behavior==='shooter'||family.behavior==='commander',pursuer:!!family.pursuer,elite,boss
 });
}
globalThis.BRAVOCADO_ENEMIES={enemyTypes,enemyFamilies:families,enemyRanks:ranks};
})();
