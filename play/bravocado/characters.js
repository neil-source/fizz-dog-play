'use strict';
(()=>{
const {weaponTypes,triggers,effects,itemPowerMultiplier}=globalThis.AVOCADO_CATALOG;
const legacy={
 ranger:{name:'Ranger',desc:'Cool pit. Hot firepower.',powerId:'ranger-deadeye',powerName:'Deadeye',ability:'Deadeye: Precision and Power gear starts linked.',good:'+30% weapon damage and +45% weapon range.',bad:'−3 armor.',ruleSpec:{id:'ranger-quiet-sight',kind:'isolatedRange',amount:.33,radius:300,text:'+33% range while no pest is within 6 m.'},synergies:['precision','power'],hp:10,speed:220,damage:1.3,range:1.45,armor:-3,weapon:'pistol',weaponSlots:6,art:'/play/bravocado/assets/hero-ranger.png'},
 brawler:{name:'Brawler',desc:'Tough skin. Sharp leaf.',powerId:'brawler-leaf-rush',powerName:'Leaf Rush',ability:'Leaf Rush: Edge and Guard gear starts linked.',good:'+35% weapon damage, +8 maximum HP, and +5 armor.',bad:'−27% movement speed.',ruleSpec:{id:'brawler-crowd-rind',kind:'crowdArmor',amount:2,cap:9,radius:125,text:'+2 armor per pest within 2.5 m (max +9).'},synergies:['edge','guard'],hp:18,speed:160,damage:1.35,armor:5,weapon:'blade',weaponSlots:6,art:'/play/bravocado/assets/hero-brawler.png'},
 scout:{name:'Scout',desc:'Fresh kicks. Fast trigger.',powerId:'scout-pit-runner',powerName:'Pit Runner',ability:'Pit Runner: Rapid and Trick gear starts linked. Carries 8 guns.',good:'+50% attack speed, +50% movement speed, and 8 gun slots.',bad:'−50% maximum HP and −35% weapon damage.',ruleSpec:{id:'scout-lucky-feet',kind:'movingLuckSpeed',amount:.06,cap:.7,text:'While moving, +6% speed per Luck (max +70%).'},synergies:['rapid','trick'],hp:5,speed:330,damage:.65,attack:1.5,weapon:'smg',weaponSlots:8,art:'/play/bravocado/assets/hero-scout.png'}
};
const triggerThemes=[
 {word:'Blink',flavor:'dash-powered'},
 {word:'Scoop',flavor:'water-collecting'},
 {word:'Bounty',flavor:'pest-defeating'},
 {word:'Crossguard',flavor:'spawn-blocking'},
 {word:'Bruise',flavor:'hit-reacting'},
 {word:'Dawn',flavor:'round-starting'},
 {word:'Volley',flavor:'weapon-firing'},
 {word:'Clock',flavor:'timed'},
 {word:'Lastleaf',flavor:'low-health'},
 {word:'Market',flavor:'shop-powered'}
];
const effectRoles=['Mender','Collector','Gonger','Frostling','Firestarter','Toxleaf','Aegis','Powerpit','Quickseed','Runner','Longview','Lodestone','Seeker','Rindblade','Drummer','Stormcall','Rainroot','Goldspark','Twinstem','Coolkeeper'];
const effectFlavors=['restorative juice','extra water','rind shockwaves','freezing air','ember heat','sour poison','pit shielding','raw power','rapid timing','leaf speed','far sight','magnetic pull','seeking seeds','orbiting blades','drum force','chain lightning','rain renewal','golden focus','twin drops','cooling tricks'];
const effectSynergy={heal:'growth',materials:'harvest',nova:'power',slow:'element',burn:'element',poison:'element',shield:'guard',damageBuff:'power',attackBuff:'rapid',speedBuff:'trick',rangeBuff:'precision',magnetBurst:'harvest',homingShot:'precision',orbitingBlade:'edge',knockback:'impact',chain:'voltage',regen:'growth',crit:'precision',cloneDrop:'harvest',cooldown:'rapid'};
const triggerSynergy={dash:'trick',pickup:'harvest',kill:'power',block:'guard',hurt:'guard',roundStart:'growth',shot:'rapid',interval:'element',lowHealth:'growth',purchase:'harvest'};
// Each effect role has a balanced starting build. Trigger themes add a smaller
// secondary specialty so the same role still plays differently across pages.
const statProfiles=[
 {hp:14,speed:205,damage:.9,armor:1},
 {hp:10,speed:225,damage:.92,magnet:135,harvesting:2},
 {hp:9,speed:215,damage:1.14},
 {hp:11,speed:205,damage:.98,range:1.15},
 {hp:8,speed:225,damage:1.1,attack:1.08},
 {hp:10,speed:220,damage:1.05,attack:1.05},
 {hp:18,speed:185,damage:.82,armor:3},
 {hp:8,speed:205,damage:1.22,attack:.94},
 {hp:9,speed:235,damage:.88,attack:1.18},
 {hp:8,speed:285,damage:.84},
 {hp:9,speed:205,damage:1.02,range:1.3},
 {hp:12,speed:195,damage:.92,magnet:170},
 {hp:10,speed:225,damage:1,range:1.08,luck:2},
 {hp:12,speed:235,damage:1.06,range:1.08},
 {hp:16,speed:190,damage:.88,armor:2},
 {hp:9,speed:215,damage:1.12,engineering:2},
 {hp:17,speed:188,damage:.84,armor:1,farmCapacity:1},
 {hp:9,speed:220,damage:1.02,luck:4},
 {hp:11,speed:210,damage:.94,harvesting:4,farmCapacity:1},
 {hp:13,speed:200,damage:.92,attack:1.08,engineering:1}
];
const triggerStatBonuses=[
 {speed:12},
 {magnet:30},
 {damage:.05},
 {armor:1},
 {hp:2},
 {harvesting:1},
 {attack:.05},
 {engineering:1},
 {hp:1},
 {luck:1}
];
const signaturePerks=[
 {text:'Orchard Heart: 6 extra avocado trees spawn every round.',treeBonus:6},
 {text:'Deep Pockets: +250% pickup range.',magnet:315},
 {text:'Glass Cannon: +150% weapon damage.',damage:2.5},
 {text:'Long Winter: +150% weapon range.',range:2.5},
 {text:'Wildfire: +100% attack speed.',attack:2},
 {text:'Venom Core: +100% weapon damage.',damage:2},
 {text:'Pit Fortress: +16 maximum HP and +8 armor.',hp:26,armor:8},
 {text:'Powerhouse: +150% weapon damage.',damage:2.5},
 {text:'Triple Time: +200% attack speed.',attack:3},
 {text:'Leaf Rocket: +100% movement speed.',speed:440},
 {text:'Far Sight: +200% weapon range.',range:3},
 {text:'Super Magnet: +400% pickup range.',magnet:450},
 {text:'Lucky Aim: +20 Luck and +50% weapon range.',luck:20,range:1.5},
 {text:'Blade Dance: +100% weapon damage and +40% movement speed.',damage:2,speed:308},
 {text:'Iron Rind: +14 maximum HP and +10 armor.',hp:24,armor:10},
 {text:'Master Builder: +16 engineering.',engineering:16},
 {text:'Ancient Orchard: 5 extra trees and 3 farms spawn every round.',treeBonus:5,farmCapacity:3},
 {text:'Golden Pit: +25 Luck.',luck:25},
 {text:'Harvest King: +25 harvesting and 4 farms.',harvesting:25,farmCapacity:4},
 {text:'Overclocked: +100% attack speed and +8 engineering.',attack:2,engineering:8}
];
const characterDrawbacks=[
 {text:'−70% weapon damage.',damage:.3},
 {text:'−70% weapon damage.',damage:.3},
 {text:'−80% maximum HP.',hp:2},
 {text:'−60% movement speed.',speed:88},
 {text:'−80% maximum HP.',hp:2},
 {text:'−70% weapon range.',range:.3},
 {text:'−60% movement speed.',speed:88},
 {text:'−70% attack speed.',attack:.3},
 {text:'−80% weapon damage.',damage:.2},
 {text:'−90% maximum HP.',hp:1},
 {text:'−75% attack speed.',attack:.25},
 {text:'−55% movement speed and −60% weapon damage.',speed:99,damage:.4},
 {text:'−70% attack speed.',attack:.3},
 {text:'−75% harvesting and −60% attack speed.',harvestingMultiplier:.25,attack:.4},
 {text:'−55% movement speed and −60% weapon damage.',speed:99,damage:.4},
 {text:'−75% harvesting and −50% movement speed.',harvestingMultiplier:.25,speed:110},
 {text:'−55% movement speed and −60% weapon damage.',speed:99,damage:.4},
 {text:'−80% maximum HP.',hp:2},
 {text:'−75% weapon damage.',damage:.25},
 {text:'−55% movement speed and −60% weapon damage.',speed:99,damage:.4}
];
const powerTwists=[
 {id:'sapKiss',name:'Sap Kiss',text:p=>`heal ${p} extra HP`},
 {id:'shellEcho',name:'Shell Echo',text:p=>`gain ${p*.5} extra shield`},
 {id:'quickReset',name:'Quick Reset',text:p=>`cool every gun by ${(p*.04).toFixed(2)} seconds`},
 {id:'goldWink',name:'Gold Wink',text:p=>`bank ${Math.ceil(p/2)} critical hit${p>2?'s':''}`},
 {id:'furyFleck',name:'Fury Fleck',text:p=>`gain ${p*2}% damage briefly`},
 {id:'swiftRhythm',name:'Swift Rhythm',text:p=>`gain ${p*2}% attack speed briefly`},
 {id:'leafstep',name:'Leafstep',text:p=>`gain ${p*3}% movement speed briefly`},
 {id:'farLens',name:'Far Lens',text:p=>`gain ${p*3}% weapon range briefly`},
 {id:'rainPull',name:'Rain Pull',text:p=>`pull water from ${2+p} meters`},
 {id:'rootShove',name:'Root Shove',text:p=>`push the nearest pest ${p*.2} meters`},
 {id:'frostPin',name:'Frost Pin',text:p=>`chill the nearest pest for ${p*.2} seconds`},
 {id:'emberPin',name:'Ember Pin',text:p=>`ignite the nearest pest for ${p} damage`},
 {id:'sourPin',name:'Sour Pin',text:p=>`poison the nearest pest for ${p+1} damage`},
 {id:'seekerTwin',name:'Seeker Twin',text:p=>`launch an extra seeking seed for ${p+2} damage`},
 {id:'pitEcho',name:'Pit Echo',text:p=>`echo ${p} damage around you`},
 {id:'greenMercy',name:'Green Mercy',text:p=>`heal ${p} HP while below half health`},
 {id:'clockNudge',name:'Clock Nudge',text:p=>`trim ${p*3}% from current gun cooldowns`},
 {id:'rindRing',name:'Rind Ring',text:p=>`cut up to ${p} pests for ${p+1} extra damage`},
 {id:'guardBeat',name:'Guard Beat',text:p=>`gain ${p*.5} shield and cool guns slightly`},
 {id:'secondBloom',name:'Second Bloom',text:p=>`heal ${Math.ceil(p/2)} HP and gain ${Math.ceil(p/2)*.5} shield`}
];
const originalRules=[
 (tier,number)=>{const reduction=10+tier*2;return{id:`compact-grove-${number}`,kind:'compactMap',mapScale:(100-reduction)/100,text:`The grove is ${reduction}% smaller.`};},
 (tier,number)=>{const amount=4+tier,cap=80+tier*5;return{id:`still-harvest-${number}`,kind:'stillHarvestDamage',amount:amount/100,cap:cap/100,text:`After 1s standing still, +${amount}% damage per Harvesting (max +${cap}%).`};},
 (tier,number)=>{const amount=5+tier,cap=85+tier*5;return{id:`still-engineer-${number}`,kind:'stillEngineeringAttack',amount:amount/100,cap:cap/100,text:`After 1s standing still, +${amount}% attack speed per Engineering (max +${cap}%).`};},
 (tier,number)=>{const amount=3+tier,cap=60+tier*5;return{id:`lucky-run-${number}`,kind:'movingLuckSpeed',amount:amount/100,cap:cap/100,text:`While moving, +${amount}% speed per Luck (max +${cap}%).`};},
 (tier,number)=>{const amount=5+tier,cap=50+tier*5;return{id:`crowd-power-${number}`,kind:'crowdDamage',amount:amount/100,cap:cap/100,radius:150,text:`+${amount}% damage per pest within 3 m (max +${cap}%).`};},
 (tier,number)=>{const amount=35+tier*5;return{id:`quiet-horizon-${number}`,kind:'isolatedRange',amount:amount/100,radius:250,text:`+${amount}% range while no pest is within 5 m.`};},
 (tier,number)=>{const amount=40+tier*5;return{id:`wounded-rhythm-${number}`,kind:'missingHealthAttack',amount:amount/100,text:`Up to +${amount}% attack speed from missing HP.`};},
 (tier,number)=>{const amount=35+tier*5;return{id:`perfect-rind-${number}`,kind:'fullHealthDamage',amount:amount/100,text:`+${amount}% damage while at full HP.`};},
 (tier,number)=>{const amount=2+Math.floor(tier/2),cap=50+tier*5;return{id:`water-pressure-${number}`,kind:'waterDamage',amount:amount/100,cap:cap/100,text:`+${amount}% damage per 10 water (max +${cap}%).`};},
 (tier,number)=>{const amount=30+tier*5,limit=10+tier;return{id:`empty-wallet-${number}`,kind:'poorSpeed',amount:amount/100,limit,text:`+${amount}% speed while holding ${limit} water or less.`};},
 (tier,number)=>{const amount=35+tier*5,distance=150+tier*5;return{id:`edge-tempo-${number}`,kind:'edgeAttack',amount:amount/100,distance,text:`+${amount}% attack speed within ${Math.round(distance/50)} m of the map edge.`};},
 (tier,number)=>{const amount=3+tier,radius=200+tier*5;return{id:`center-shell-${number}`,kind:'centerArmor',amount,radius,text:`+${amount} armor within ${Math.round(radius/50)} m of the map center.`};},
 (tier,number)=>{const amount=Number((.5+tier*.15).toFixed(2)),radius=175+tier*5;return{id:`tree-rest-${number}`,kind:'treeRegen',amount,radius,text:`Heal ${amount} HP/s within ${Math.round(radius/50)} m of a tree.`};},
 (tier,number)=>{const amount=15+tier*3,cap=60+tier*5;return{id:`farm-fury-${number}`,kind:'farmAttack',amount:amount/100,cap:cap/100,text:`+${amount}% attack speed per farm (max +${cap}%).`};},
 (tier,number)=>{const amount=1+Math.floor(tier/3),cap=5+tier,radius=180;return{id:`swarm-shell-${number}`,kind:'crowdArmor',amount,cap,radius,text:`+${amount} armor per nearby pest (max +${cap}).`};},
 (tier,number)=>{const amount=50+tier*10,seconds=10+tier;return{id:`final-surge-${number}`,kind:'lastSecondsDamage',amount:amount/100,seconds,text:`+${amount}% damage during the last ${seconds}s of a round.`};},
 (tier,number)=>{const amount=50+tier*10,seconds=10+tier;return{id:`opening-sprint-${number}`,kind:'firstSecondsSpeed',amount:amount/100,seconds,text:`+${amount}% speed during the first ${seconds}s of a round.`};},
 (tier,number)=>{const amount=10+tier*2,cap=70+tier*5;return{id:`arsenal-heart-${number}`,kind:'weaponDamage',amount:amount/100,cap:cap/100,text:`+${amount}% damage per equipped weapon (max +${cap}%).`};},
 (tier,number)=>{const amount=10+tier*3,cap=60+tier*5;return{id:`empty-holster-${number}`,kind:'emptySlotAttack',amount:amount/100,cap:cap/100,text:`+${amount}% attack speed per empty gun slot (max +${cap}%).`};},
 (tier,number)=>{const interval=Number((3-tier*.15).toFixed(2));return{id:`patient-guard-${number}`,kind:'stillShield',interval,amount:1,text:`Gain 1 shield every ${interval}s while standing still.`};}
];
const weapons=Object.keys(weaponTypes),generatedCharacters={};
triggerThemes.forEach((theme,triggerIndex)=>effects.forEach((effect,effectIndex)=>{
 const number=triggerIndex*effects.length+effectIndex+1,id=`c${String(number).padStart(3,'0')}`,trigger=triggers[triggerIndex],power=6+((triggerIndex+effectIndex)%5)*2,primary=effectSynergy[effect.id],secondary=triggerSynergy[trigger.id],synergies=primary===secondary?[primary,['power','precision','rapid','guard','growth','trick','harvest','element','impact','voltage','edge'].find(tag=>tag!==primary)]:[primary,secondary],profile=statProfiles[effectIndex],bonus=triggerStatBonuses[triggerIndex],perk=signaturePerks[effectIndex],drawback=characterDrawbacks[effectIndex],twist=powerTwists[(triggerIndex*7+effectIndex*3)%powerTwists.length],twistPower=2+((number*11+effectIndex)%5)*2,rule=originalRules[effectIndex](triggerIndex,number),powerName=`${theme.word} ${effectRoles[effectIndex]}`,powerId=`${trigger.id}-${effect.id}-${twist.id}-${String(number).padStart(3,'0')}`,triggerAbility=`${powerName}: ${trigger.when}, ${effect.what(power*itemPowerMultiplier)} and ${twist.text(twistPower)}.`;
 generatedCharacters[id]={
  name:`${theme.word} ${effectRoles[effectIndex]}`,
  desc:`A ${theme.flavor} specialist with ${effectFlavors[effectIndex]}.`,
  powerId,
  powerName,
  signature:`${perk.text} ${powerName} also ${twist.text(twistPower)}.`,
  triggerAbility,
  ability:`${perk.text} ${rule.text} ${triggerAbility}`,
  good:triggerAbility,
  bad:drawback.text,
  abilitySpec:{id:powerId,trigger:trigger.id,effect:effect.id,power,twist:twist.id,twistPower},
  ruleSpec:rule,
  synergies,
  hp:drawback.hp??((perk.hp??profile.hp)+(bonus.hp||0)),
  speed:drawback.speed??((perk.speed??profile.speed)+(bonus.speed||0)),
  damage:drawback.damage??Number(((perk.damage??profile.damage)+(bonus.damage||0)).toFixed(2)),
  armor:(perk.armor??profile.armor??0)+(bonus.armor||0),
  attack:drawback.attack??Number(((perk.attack??profile.attack??1)+(bonus.attack||0)).toFixed(2)),
  magnet:drawback.magnet??((perk.magnet??profile.magnet??90)+(bonus.magnet||0)),
  range:drawback.range??perk.range??profile.range??1,
  engineering:(perk.engineering??profile.engineering??0)+(bonus.engineering||0),
  harvesting:(perk.harvesting??profile.harvesting??0)+(bonus.harvesting||0),
  harvestingMultiplier:drawback.harvestingMultiplier??1,
  luck:(perk.luck??profile.luck??0)+(bonus.luck||0)+triggerIndex,
  farmCapacity:perk.farmCapacity??profile.farmCapacity??0,
  treeBonus:perk.treeBonus||0,
  weapon:weapons[(number*37+effectIndex*3)%weapons.length],
  weaponSlots:number%9===0?8:6,
  art:`/play/bravocado/assets/characters/c${String(number).padStart(3,'0')}.png`,
  artSource:'ChatGPT transparent pixel-art atlas'
 };
}));
const classes={...legacy,...generatedCharacters};
globalThis.BRAVOCADO_CHARACTERS={classes,legacy,generatedCharacters,triggerThemes,effectRoles,statProfiles,triggerStatBonuses,signaturePerks,characterDrawbacks,powerTwists,originalRules};
})();
