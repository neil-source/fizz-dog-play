'use strict';
(()=>{
const legacyWeapons={
 pistol:{name:'Pit Pistol',damage:12,rate:.62,range:410,speed:670,price:25,width:60,ability:'Reliable single pit shot.',art:'/play/bravocado/assets/weapon-pistol.png',projectile:'kinetic'},
 smg:{name:'Sprout SMG',damage:6,rate:.17,range:340,speed:760,price:42,width:70,ability:'Rapid stream of tiny seed rounds.',art:'/play/bravocado/assets/weapon-smg.png',projectile:'kinetic'},
 shotgun:{name:'Guac Shotgun',damage:9,rate:.95,range:280,speed:610,price:38,width:75,pellets:5,spread:.13,ability:'Fans five pit fragments at close range.',art:'/play/bravocado/assets/weapon-shotgun.png',projectile:'kinetic'},
 blade:{name:'Avocado Blade',damage:23,rate:.7,range:190,speed:0,price:28,width:72,melee:true,ability:'Long thrust that cuts pests the blade touches.',art:'/play/bravocado/assets/weapon-blade.png',projectile:'kinetic'},
 laser:{name:'Nectar Laser',damage:30,rate:1.05,range:570,speed:1000,price:55,width:68,pierce:2,ability:'A bright nectar ray pierces two pests.',art:'/play/bravocado/assets/weapon-laser.png',projectile:'laser'}
};
const frames=[
 {name:'Seed Repeater',shape:'clockwork seed repeater with twin leaf magazines',damage:8,rate:.25,range:390,speed:760,burst:2,signature:'fires paired seeds'},
 {name:'Guac Mortar',shape:'stubby guacamole mortar with bowl-shaped barrel',damage:36,rate:1.45,range:500,speed:390,blast:82,signature:'splashes a wide guacamole burst'},
 {name:'Rind Chakram',shape:'round serrated avocado-rind launcher',damage:18,rate:.78,range:430,speed:610,returning:true,pierce:1,signature:'throws a returning rind disc'},
 {name:'Vine Whip',shape:'living coiled vine handle with thorny lash',damage:24,rate:.64,range:220,speed:0,melee:true,signature:'lashes far forward through pests it touches'},
 {name:'Sap Siphon',shape:'glass sap tank blaster with curled drinking tube',damage:11,rate:.42,range:330,speed:560,lifesteal:.035,signature:'siphons a little health from hits'},
 {name:'Pit Rail',shape:'long seed railgun with a glowing avocado core',damage:58,rate:1.8,range:720,speed:1250,pierce:4,signature:'drives through four pests'},
 {name:'Bloom Blaster',shape:'flower trumpet blaster with five petal barrels',damage:8,rate:.9,range:340,speed:590,pellets:7,spread:.16,signature:'blooms into seven petal shots'},
 {name:'Root Drill',shape:'gnarled root drill tipped with a spinning seed',damage:30,rate:.58,range:250,speed:0,melee:true,pierce:2,signature:'drives far forward through pests it touches'},
 {name:'Nectar Beam',shape:'honeycomb nectar projector with crystal nozzle',damage:20,rate:.34,range:620,speed:1050,pierce:1,signature:'streams a fast piercing ray'},
 {name:'Thorn Harp',shape:'tiny harp crossbow strung between two thorn branches',damage:15,rate:.55,range:510,speed:820,pellets:3,spread:.09,signature:'plays a three-thorn chord'},
 {name:'Moss Mine',shape:'mossy seed pod mine launcher with short handle',damage:44,rate:1.7,range:310,speed:260,blast:105,mine:true,signature:'plants a slow explosive moss pod'},
 {name:'Pollen Bell',shape:'hand bell cannon with a flower clapper',damage:13,rate:.72,range:360,speed:520,pellets:8,spread:.3,signature:'rings a circular pollen fan'},
 {name:'Wormhole Pod',shape:'split avocado pod containing a tiny purple portal',damage:25,rate:1.15,range:590,speed:690,homing:.12,ricochet:2,signature:'bends and jumps between targets'},
 {name:'Dew Cannon',shape:'leafy water cannon with a giant dew drop reservoir',damage:19,rate:.48,range:450,speed:650,knockback:24,signature:'pushes pests with heavy dew'},
 {name:'Bark Bow',shape:'compact bark bow with seed arrow loaded',damage:32,rate:.92,range:650,speed:980,pierce:2,signature:'pins a line of pests'},
 {name:'Orchard Fork',shape:'two-pronged tuning fork gun grown from green wood',damage:16,rate:.68,range:470,speed:730,pellets:2,spread:.08,chain:1,signature:'forks into paired chaining notes'},
 {name:'Compost Comet',shape:'scrappy compost cannon with a blazing seed chamber',damage:50,rate:1.55,range:610,speed:500,blast:68,homing:.055,signature:'steers a heavy exploding compost comet'},
 {name:'Leaf Fan',shape:'folding fan made from broad avocado leaves',damage:10,rate:.4,range:360,speed:680,pellets:5,spread:.22,knockback:10,signature:'sweeps five cutting leaves'},
 {name:'Core Satellite',shape:'handheld orbit controller with a floating avocado pit',damage:17,rate:.5,range:520,speed:540,orbit:true,homing:.07,signature:'curves orbiting pits into targets'}
];
const spirits=[
 {name:'Ember',look:'orange ember vents and tiny flame pixels',color:'#ff965c',projectile:'ember',burn:3,desc:'scorches targets for lingering damage'},
 {name:'Glacier',look:'icy cyan crystals and frosted leaves',color:'#8be8e8',projectile:'glacier',slow:.38,desc:'chills targets until they crawl'},
 {name:'Thunder',look:'yellow lightning coil and electric leaf sparks',color:'#ffe66b',projectile:'thunder',chain:2,desc:'jumps lightning to nearby pests'},
 {name:'Moon',look:'violet moonstone chamber and dark silver rind',color:'#c7a8ff',projectile:'moon',pull:28,ricochet:1,desc:'pulls pests together and rebounds'},
 {name:'Bloom',look:'pink blossoms and a luminous green seed heart',color:'#ffb0ca',projectile:'bloom',split:2,lifesteal:.025,desc:'splits on impact and returns a little health'}
];
const generatedWeapons={};
frames.forEach((frame,frameIndex)=>spirits.forEach((spirit,spiritIndex)=>{
 const number=5+frameIndex*5+spiritIndex,id=`w${String(number).padStart(3,'0')}`;
 generatedWeapons[id]={...frame,...spirit,name:`${spirit.name} ${frame.name}`,damage:Math.round(frame.damage*(1+spiritIndex*.045)),rate:Number((frame.rate*(1-spiritIndex*.018)).toFixed(3)),range:frame.range+spiritIndex*8,speed:frame.speed?frame.speed+spiritIndex*18:0,price:30+(number%9)*4,width:70+(frameIndex%4)*3,ability:`${frame.signature}; ${spirit.desc}.`,art:`/play/bravocado/assets/catalog/weapons/${id}.png`,shape:`${frame.shape}, ${spirit.look}`};
}));
const weaponTypes={...legacyWeapons,...generatedWeapons};
const WEAPON_BALANCE_TARGET=28;
function weaponEffectFactor(def){
 const shots=(def.pellets||1)*(def.burst||1);
 const extra=1+(def.pierce||0)*.28+(def.ricochet||0)*.32+(def.chain||0)*.35+(def.split||0)*.32+(def.blast||0)*.48/260+(def.returning?.22:0)+(def.burn||0)*.035+(def.slow?.12:0)+(def.mine?.08:0)+(def.homing||0)*.35+(def.lifesteal||0)*.8+(def.knockback||def.pull?.05:0)+(def.melee?.15:0);
 return shots*extra;
}
function weaponBalanceScore(def){return def.damage*weaponEffectFactor(def)/def.rate;}
function weaponUtilityPrice(def){
 const utility=(def.pierce||0)*2.5+(def.ricochet||0)*4+(def.chain||0)*4+(def.split||0)*4+(def.blast||0)/20+(def.returning?5:0)+(def.homing||0)*35+(def.lifesteal||0)*100+(def.burn||0)*.7+(def.slow||0)*6+(def.mine?3:0)+(def.knockback||def.pull?2:0);
 return Math.min(78,Math.round(22+(def.range||0)/35+utility));
}
Object.entries(weaponTypes).forEach(([id,def],index)=>{
 const flavor=.96+(index%5)*.02,target=WEAPON_BALANCE_TARGET*flavor;
 def.damage=Math.max(.8,Number((target*def.rate/weaponEffectFactor(def)).toFixed(1)));
 def.price=Math.max(def.price,weaponUtilityPrice(def));
});
const weaponDrawbacks=[
 {kind:'damage',multiplier:.92,text:'−8% weapon damage'},
 {kind:'rate',multiplier:1.1,text:'+10% attack time'},
 {kind:'range',multiplier:.9,text:'−10% lock-on range'},
 {kind:'speed',multiplier:.85,text:'−15% projectile speed'}
];
Object.values(weaponTypes).forEach((def,index)=>{
 const choice=weaponDrawbacks[index%weaponDrawbacks.length];
 def.good=def.ability;
 def.drawback={...(def.melee&&choice.kind==='speed'?weaponDrawbacks[1]:choice)};
});
const weaponWidths=Object.fromEntries(Object.entries(weaponTypes).map(([id,def])=>[id,def.width||70]));

const itemPowerMultiplier=.6,display=value=>Number(value.toFixed(1)),meters=value=>`${display(value/50)} meters`;
const legacyItems={
 scope:{name:'Big Scope',desc:'+10% weapon range',price:30,art:'/play/bravocado/assets/item-scope.png',mods:{range:1.1}},
 armor:{name:'Skin Plate',desc:'+1 armor',price:32,art:'/play/bravocado/assets/item-armor.png',mods:{armor:1}},
 gloves:{name:'Quick Gloves',desc:'+6% attack speed',price:34,art:'/play/bravocado/assets/item-gloves.png',mods:{attack:.06}},
 boots:{name:'Grove Boots',desc:'+6% movement speed',price:28,art:'/play/bravocado/assets/item-boots.png',mods:{speed:1.06}},
 magnet:{name:'Chunky Magnet',desc:'+25 pickup range',price:26,art:'/play/bravocado/assets/item-magnet.png',mods:{magnet:25}},
 sprout:{name:'Lucky Sprout',desc:'+4 maximum health',price:30,art:'/play/bravocado/assets/item-sprout.png',mods:{maxHp:4}}
};
const triggers=[
 {id:'dash',name:'Dashseed',when:'After every dash'},
 {id:'pickup',name:'Pit Collector',when:'Whenever a material is collected'},
 {id:'kill',name:'Pest Bell',when:'Whenever a pest is squashed'},
 {id:'block',name:'Red-X Charm',when:'Whenever a spawn is blocked'},
 {id:'hurt',name:'Bruise Bark',when:'After taking damage'},
 {id:'roundStart',name:'Dawn Calendar',when:'At the start of each round'},
 {id:'shot',name:'Eighth Chamber',when:'Every eighth weapon attack'},
 {id:'interval',name:'Orchard Clock',when:'Every eight seconds'},
 {id:'lowHealth',name:'Last Slice',when:'Every ten seconds below half health'},
 {id:'purchase',name:'Merchant Pit',when:'After buying another shop offer'}
];
const effects=[
 {id:'heal',name:'Juice Thimble',what:p=>`heal ${display(2+p)} HP`,look:'tiny juice cup with a heart-shaped shine'},
 {id:'materials',name:'Seed Purse',what:p=>`gain ${Math.max(1,Math.floor(1+p))} pit tokens`,look:'small purse spilling avocado pits'},
 {id:'nova',name:'Rind Gong',what:p=>`blast nearby pests for ${display(8+p*4)} damage`,look:'round rind gong with a bright center'},
 {id:'slow',name:'Frost Jar',what:p=>`freeze nearby pests for ${display(1+p*.25)} seconds`,look:'icy jar containing a blue avocado leaf'},
 {id:'burn',name:'Ember Peel',what:p=>`ignite nearby pests for ${display(2+p)} damage`,look:'curl of avocado peel burning orange'},
 {id:'poison',name:'Sour Flask',what:p=>`poison nearby pests for ${display(3+p)} damage`,look:'purple sour flask with a leaf stopper'},
 {id:'shield',name:'Pit Buckler',what:p=>`gain a ${display((2+p*2)*.5)} HP pit shield`,look:'small round shield shaped like an avocado pit'},
 {id:'damageBuff',name:'Hot Sticker',what:p=>`gain ${display(8+p*3)}% damage for 5 seconds`,look:'fiery star sticker on an avocado slice'},
 {id:'attackBuff',name:'Fast Metronome',what:p=>`gain ${display(7+p*3)}% attack speed for 5 seconds`,look:'leafy clockwork metronome'},
 {id:'speedBuff',name:'Leaf Skates',what:p=>`gain ${display(10+p*4)}% movement speed for 5 seconds`,look:'tiny roller skates made from avocado leaves'},
 {id:'rangeBuff',name:'Long Straw',what:p=>`gain ${display(12+p*4)}% range for 6 seconds`,look:'spiral drinking straw with a seed sight'},
 {id:'magnetBurst',name:'Pit Magnet',what:p=>`pull materials from ${meters(180+p*35)} away`,look:'horseshoe magnet holding three avocado pits'},
 {id:'homingShot',name:'Seeking Seed',what:p=>`launch a ${display(10+p*4)} damage homing seed`,look:'winged avocado seed with one bright eye'},
 {id:'orbitingBlade',name:'Peel Halo',what:p=>`cut nearby pests for ${display(7+p*3)} damage`,look:'ring of sharp peel segments'},
 {id:'knockback',name:'Grove Drum',what:p=>`knock nearby pests back ${meters(20+p*8)}`,look:'little stump drum with leaf drumsticks'},
 {id:'chain',name:'Static Stem',what:p=>`zap up to ${Math.max(1,Math.floor(2+p))} pests for ${display(5+p*2)} damage`,look:'forked glowing stem full of yellow sparks'},
 {id:'regen',name:'Rain Bottle',what:p=>`restore ${display(1+p)} HP and cool all weapons`,look:'rain bottle with a sprout growing inside'},
 {id:'crit',name:'Golden Freckle',what:p=>`bank ${Math.max(1,Math.floor(1+p))} guaranteed critical hits`,look:'shiny golden avocado freckle in a tiny case'},
 {id:'cloneDrop',name:'Twin Pit',what:p=>`scatter ${Math.max(1,Math.floor(1+p))} bonus materials`,look:'two matching avocado pits joined by a spark'},
 {id:'cooldown',name:'Cool Towel',what:p=>`cut active weapon cooldowns by ${display(20+p*8)}%`,look:'folded cooling towel embroidered with a leaf'}
];
const generatedItems={};
let itemNumber=0;
triggers.forEach((trigger,triggerIndex)=>effects.forEach((effect,effectIndex)=>{
 const matrixIndex=triggerIndex*effects.length+effectIndex;
 if(matrixIndex<6)return;
 const id=`i${String(matrixIndex).padStart(3,'0')}`,power=1+(matrixIndex%5);
 generatedItems[id]={name:`${trigger.name} ${effect.name}`,desc:`${trigger.when}, ${effect.what(power*itemPowerMultiplier)}.`,price:24+(matrixIndex%11)*3,trigger:trigger.id,effect:effect.id,power,mods:{},art:`/play/bravocado/assets/catalog/items/${id}.png`,look:`${trigger.name.toLowerCase()} token fused with a ${effect.look}`};
 itemNumber++;
}));
const activeProjectiles=['acorn','crystal','sun','shadow','heart','shell','feather','bubble','cog','comet'];
const activeItemGroups=[
 {id:'orbitDamage',names:['Saw Disc','Thorn Crescent','Tiny Sword','Crystal Claw','Iron Beetle','Spiked Seed','Flame Fang','Bone Star','Lightning Hook','Shadow Eye'],describe:p=>`Circles the player and deals ${display(5+p*2)} contact damage.`},
 {id:'orbitHeal',names:['Healing Potion','Heart Flower','Rain Vial','Honey Bee','Bandage Sprite','Green Lantern','Nurse Cloud','Fruit Basket','Pink Fairy','Life Crystal'],describe:p=>`Circles the player and heals ${1+Math.ceil(p/2)} HP every few seconds.`},
 {id:'radialPhysical',names:['Acorn Drum','Thorn Pod','Dart Blossom','Cactus Bomb','Pinecone Cannon','Razor Leaf','Snail Shell','Mushroom Cap','Bee Nest','Pebble Star'],describe:p=>`Bursts ${Math.floor(4+p)} physical shots outward from the player.`},
 {id:'radialElement',names:['Fire Wheel','Ice Prism','Thunder Bell','Shadow Orb','Sun Coin','Moon Vial','Bubble Wand','Comet Stone','Wind Feather','Magma Die'],describe:p=>`Bursts ${Math.floor(5+p)} elemental shots outward from the player.`},
 {id:'damagePulse',names:['War Gong','Red Reactor','Quake Boot','Skull Clock','Thorn Crown','Sonic Horn','Meteor Egg','Storm Coil','Toxic Flask','Rune Bomb'],describe:p=>`Releases an expanding pulse for ${display(8+p*4)} damage.`},
 {id:'healPulse',names:['Spring Totem','Warm Soup','Angel Feather','Blue Fountain','Herbal Book','Sleepy Moon','Rescue Bell','Golden Apple','Friendly Ghost','Rainbow Crystal'],describe:p=>`Releases an expanding pulse that heals ${display(2+p)} HP.`},
 {id:'guardianShot',names:['Clockwork Bird','Mini Turret','Wizard Eye','Toy Dragon','Rocket Snail','Cannon Crab','Laser Cat','Crystal Bat','Storm Drone','Tiny Knight'],describe:p=>`Orbits the player and fires ${display(7+p*3)} damage guardian shots.`},
 {id:'boomerangBurst',names:['Steel Boomerang','Crescent Blade','Returning Axe','Flying Pan','Ring Saw','Winged Dagger','Magic Card','Fish Blade','Bone Hook','Star Wheel'],describe:p=>`Launches ${1+Math.ceil(p/2)} returning attacks from the player.`},
 {id:'chainNova',names:['Tesla Coil','Chain Crown','Electric Eel Jar','Storm Fork','Spark Spider','Copper Cloud','Plasma Flower','Thunder Mask','Neon Battery','Lightning Harp'],describe:p=>`Zaps up to ${Math.max(1,Math.floor(2+p))} nearby pests for ${display(6+p*3)} damage.`},
 {id:'shieldWave',names:['Bubble Shield','Iron Turtle','Guardian Angel','Crystal Wall','Force Ring','Mirror Beetle','Moon Shield','Safety Helmet','Cloud Armor','Star Bunker'],describe:p=>`Sends a guard wave that grants ${display((1+p)*.5)} shield and pushes pests away.`}
];
activeItemGroups.forEach((group,groupIndex)=>group.names.forEach((name,variantIndex)=>{
 const number=100+groupIndex*10+variantIndex,id=`i${number}`,power=1+variantIndex%5,projectile=activeProjectiles[variantIndex];
 generatedItems[id]={name,desc:`Always active: ${group.describe(power*itemPowerMultiplier)} Variant ${variantIndex+1}.`,price:34+groupIndex*2+variantIndex,power,active:group.id,projectile,trigger:'active',effect:null,mods:{},art:`/play/bravocado/assets/catalog/items/${id}.png`,look:`${name.toLowerCase()} active relic`};
}));
const itemTypes={...legacyItems,...generatedItems};
const synergyTraits={
 edge:{label:'Edge',desc:'Makes matching blades and melee weapons attack 8% faster per link.',rate:.08},
 rapid:{label:'Rapid',desc:'Makes matching rapid weapons attack 6% faster per link.',rate:.06},
 power:{label:'Power',desc:'Adds 7% damage per matching link.',damage:.07},
 precision:{label:'Precision',desc:'Adds 7% lock-on range and 4% shot speed per link.',range:.07,speed:.04},
 impact:{label:'Impact',desc:'Adds 5% damage and a larger blast per matching link.',damage:.05,blast:8},
 element:{label:'Element',desc:'Adds 5% damage and strengthens burn and slow effects per link.',damage:.05,status:.1},
 voltage:{label:'Voltage',desc:'Adds 3% attack speed and builds extra chain jumps.',rate:.03,chainStep:3},
 trick:{label:'Trick',desc:'Adds 4% range, 8% shot speed, and builds ricochets.',range:.04,speed:.08,ricochetStep:3},
 growth:{label:'Growth',desc:'Adds 3% damage and 0.6% life steal per link.',damage:.03,lifesteal:.006},
 guard:{label:'Guard',desc:'Adds 3% damage and builds extra piercing hits.',damage:.03,pierceStep:4},
 harvest:{label:'Harvest',desc:'Adds 3% range and improves water drops from matching weapon kills.',range:.03,harvest:true}
};
const fallbackSynergies=Object.keys(synergyTraits),uniqueSynergies=(tags,index=0)=>{const result=[];for(const tag of tags)if(synergyTraits[tag]&&!result.includes(tag))result.push(tag);for(let offset=0;result.length<2;offset++){const tag=fallbackSynergies[(index+offset)%fallbackSynergies.length];if(!result.includes(tag))result.push(tag);}return result.slice(0,2);};
const legacyWeaponSynergies={pistol:['precision','power'],smg:['rapid','trick'],shotgun:['impact','power'],blade:['edge','power'],laser:['precision','element']};
const spiritSynergy={kinetic:'power',laser:'precision',ember:'element',glacier:'element',thunder:'voltage',moon:'trick',bloom:'growth'};
Object.entries(weaponTypes).forEach(([id,def],index)=>{if(legacyWeaponSynergies[id])def.synergies=legacyWeaponSynergies[id];else{const primary=def.melee?'edge':def.mine?'harvest':def.knockback?'guard':def.lifesteal?'growth':def.blast?'impact':def.rate<.4||def.burst||def.pellets>=5?'rapid':def.pierce||def.range>=600?'precision':def.returning||def.homing||def.orbit?'trick':'power';def.synergies=uniqueSynergies([primary,spiritSynergy[def.projectile]],index);}});
const legacyItemSynergies={scope:['precision','trick'],armor:['guard','power'],gloves:['rapid','edge'],boots:['rapid','trick'],magnet:['harvest','precision'],sprout:['growth','guard']};
const effectSynergy={heal:'growth',materials:'harvest',nova:'power',slow:'element',burn:'element',poison:'element',shield:'guard',damageBuff:'power',attackBuff:'rapid',speedBuff:'trick',rangeBuff:'precision',magnetBurst:'harvest',homingShot:'precision',orbitingBlade:'edge',knockback:'impact',chain:'voltage',regen:'growth',crit:'precision',cloneDrop:'harvest',cooldown:'rapid'};
const triggerSynergy={dash:'trick',pickup:'harvest',kill:'power',block:'guard',hurt:'guard',roundStart:'growth',shot:'rapid',interval:'element',lowHealth:'growth',purchase:'harvest'};
const activeSynergy={orbitDamage:'edge',orbitHeal:'growth',radialPhysical:'impact',radialElement:'element',damagePulse:'power',healPulse:'growth',guardianShot:'precision',boomerangBurst:'trick',chainNova:'voltage',shieldWave:'guard'};
const projectileSynergy={acorn:'harvest',crystal:'precision',sun:'power',shadow:'trick',heart:'growth',shell:'guard',feather:'rapid',bubble:'impact',cog:'voltage',comet:'element'};
Object.entries(itemTypes).forEach(([id,def],index)=>{def.synergies=legacyItemSynergies[id]||uniqueSynergies(def.active?[activeSynergy[def.active],projectileSynergy[def.projectile]]:[effectSynergy[def.effect],triggerSynergy[def.trigger]],index);});
const itemDrawbacks=[
 {stat:'speed',multiplier:.98,text:'−2% movement speed'},
 {stat:'damage',amount:-.02,text:'−2% weapon damage'},
 {stat:'maxHp',amount:-1,text:'−1 maximum HP'},
 {stat:'range',multiplier:.97,text:'−3% weapon range'},
 {stat:'magnet',amount:-5,text:'−5 pickup range'},
 {stat:'attack',amount:-.02,text:'−2% attack speed'}
];
const effectBenefitStat={damageBuff:'damage',attackBuff:'attack',speedBuff:'speed',rangeBuff:'range',magnetBurst:'magnet'};
Object.values(itemTypes).forEach((def,index)=>{
 def.good=def.desc;
 def.benefitStats=[...new Set([...Object.keys(def.mods||{}),effectBenefitStat[def.effect]].filter(Boolean))];
 const drawback=itemDrawbacks.find((choice,offset)=>offset>=index%itemDrawbacks.length&&!def.benefitStats.includes(choice.stat))||itemDrawbacks.find(choice=>!def.benefitStats.includes(choice.stat));
 def.drawback={...drawback};
});
globalThis.AVOCADO_CATALOG={weaponTypes,weaponWidths,itemTypes,frames,spirits,triggers,effects,activeItemGroups,activeProjectiles,itemPowerMultiplier,synergyTraits,weaponDrawbacks,itemDrawbacks,WEAPON_BALANCE_TARGET,weaponEffectFactor,weaponBalanceScore};
})();
