'use strict';

let onlineSnapshotClock=0,onlineInputClock=0,onlineLastPhase='',onlinePlayerCount=1;
const ONLINE_SNAPSHOT_INTERVAL=.08,ONLINE_INPUT_INTERVAL=1/30,ONLINE_INTERPOLATION=20;

function onlineClass(id){return classes[id]?id:'ranger';}
function onlineSend(message){if(onlineSocket?.readyState===WebSocket.OPEN&&onlineSocket.bufferedAmount<262144)onlineSocket.send(JSON.stringify(message));}
function onlineNotice(message){const notice=$('onlineNotice');if(notice)notice.textContent=message||'';}
function updateOnlineStatus(){const status=$('onlineStatus');if(!status)return;if(onlineRole==='host')status.textContent=`ROOM ${onlineRoom} · ${onlineCrew.size+1}/4`;else if(onlineRole==='guest')status.textContent=`ROOM ${onlineRoom} · ${onlinePlayerCount}/4`;else if(onlineRole==='connecting')status.textContent='CONNECTING…';else status.textContent='OFFLINE';status.classList.toggle('connected',onlineRole==='host'||onlineRole==='guest');status.title=onlineRoom?`Share room code ${onlineRoom}`:'Play online co-op';}
function onlineInput(){let x=(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0),y=(keys.s||keys.ArrowDown?1:0)-(keys.w||keys.ArrowUp?1:0);if(pointer){x=pointer.dx;y=pointer.dy;}else if(controllerPad&&(controllerMove.x||controllerMove.y)){x=controllerMove.x;y=controllerMove.y;}const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}return{x,y};}
function onlineMergeEntities(current,incoming,key,mode='interpolate'){
 const previous=new Map((current||[]).map((entry,index)=>[entry[key]??`index-${index}`,entry]));
 return(incoming||[]).map((next,index)=>{const id=next[key]??`index-${index}`,old=previous.get(id);if(!old)return mode==='interpolate'?{...next,_netX:next.x,_netY:next.y}:{...next};const merged={...old,...next};if(mode==='interpolate'){merged.x=old.x;merged.y=old.y;merged._netX=next.x;merged._netY=next.y;}else if(mode==='extrapolate'){merged.x=old.x;merged.y=old.y;}return merged;});
}
function onlineInterpolateEntities(entries,dt){const step=Math.min(1,dt*ONLINE_INTERPOLATION);for(const entry of entries||[]){if(Number.isFinite(entry._netX))entry.x+=(entry._netX-entry.x)*step;if(Number.isFinite(entry._netY))entry.y+=(entry._netY-entry.y)*step;}}
function onlineLobbyPlayers(){return[{id:onlineClientId,name:classes[chosen].name,classId:chosen},...[...onlineCrew.values()].map(member=>({id:member.id,name:member.name,classId:member.classId}))];}
function onlineLobbyCrewMarkup(players=onlineLobbyPlayers()){return`<div class="lobby-crew">${players.map((member,index)=>`<div class="lobby-player"><img src="${artPaths[`hero-${onlineClass(member.classId)}`]}" alt=""><span>${member.name}</span><small>${index===0?'HOST':'READY'}</small></div>`).join('')}</div>`;}

function showOnlineMenu(message=''){
 state='online';setScreen();
 const linkedRoom=new URLSearchParams(location.search).get('room')?.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5)||'';
 overlay(`<div class="tag">UP TO FOUR PLAYERS</div><h2>ONLINE<br><span>CO-OP</span></h2><p class="online-intro">The host runs the shared grove and chooses upgrades. Everyone can move, fight, collect water, and use a PS5 controller.</p><div class="online-lobby"><button class="primary" id="createOnline" data-controller-default>CREATE ROOM</button><button id="quickOnline">QUICK JOIN</button><div class="online-code-row"><input id="roomCode" class="room-code" maxlength="5" value="${linkedRoom}" autocomplete="off" spellcheck="false" aria-label="Five character room code" placeholder="ROOM CODE"><button id="joinOnline">JOIN CODE</button></div></div><div class="notice" id="onlineNotice">${message}</div><button id="onlineBack">← BACK</button><div class="controller-help">LEFT STICK CURSOR · D-PAD SNAP · ✕ / A SELECT</div>`);
 const input=$('roomCode');input.oninput=()=>{input.value=input.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);};
 $('createOnline').onclick=()=>connectOnline('create');
 $('quickOnline').onclick=()=>connectOnline('quick-join');
 $('joinOnline').onclick=()=>{const code=input.value.trim();if(code.length!==5)return onlineNotice('Enter the five-character room code.');connectOnline('join',code);};
 $('onlineBack').onclick=()=>{leaveOnline();history.replaceState(null,'',location.pathname);menu();};
}

function onlineHostLobby(message='No enemies spawn until you start the battle.'){
 state='online-lobby';setScreen();enemies=[];spawnWarnings=[];bullets=[];particles=[];visualEffects=[];enemyDeathEffects=[];
 overlay(`<div class="tag">ENEMY-FREE LOBBY · ${onlineCrew.size+1}/4 PLAYERS</div><h2>ROOM<br><span>${onlineRoom}</span></h2>${onlineLobbyCrewMarkup()}<p class="online-intro">${message}</p><div class="menu-actions"><button class="primary" id="startOnlineRun" data-controller-default>START BATTLE</button><button id="copyOnlineLink">COPY INVITE LINK</button><button id="leaveOnlineLobby">LEAVE ROOM</button></div><div class="notice" id="lobbyNotice">Friends can join with code ${onlineRoom} before the battle starts.</div><div class="controller-help">LEFT STICK CURSOR · D-PAD SNAP · ✕ / A SELECT</div>`);
 $('startOnlineRun').onclick=()=>{onlineSend({type:'start-room'});start();};
 $('copyOnlineLink').onclick=async()=>{const link=`${location.origin}${location.pathname}?room=${onlineRoom}`;try{await navigator.clipboard.writeText(link);$('lobbyNotice').textContent='INVITE LINK COPIED';}catch{$('lobbyNotice').textContent=`SHARE CODE ${onlineRoom}`;}};
 $('leaveOnlineLobby').onclick=()=>{leaveOnline();menu();};
 updateOnlineStatus();
}

function connectOnline(action,room=''){
 if(onlineRole==='connecting')return;
 leaveOnline();onlineRole='connecting';onlineRoom=room;updateOnlineStatus();onlineNotice('Connecting to the grove…');
 const protocol=location.protocol==='https:'?'wss':'ws',socket=new WebSocket(`${protocol}://${location.host}/online`);onlineSocket=socket;
 socket.addEventListener('open',()=>{if(socket!==onlineSocket)return;onlineSend({type:action,room,name:classes[chosen].name,classId:chosen});});
 socket.addEventListener('message',event=>{if(socket!==onlineSocket)return;let message;try{message=JSON.parse(event.data);}catch{return;}handleOnlineMessage(message);});
 socket.addEventListener('close',()=>{if(socket!==onlineSocket)return;onlineSocket=null;const wasOnline=onlineRole!=='offline'&&onlineRole!=='connecting';onlineRole='offline';onlineRoom='';onlineClientId='';onlineCrew.clear();onlineRenderCrew=[];updateOnlineStatus();if(wasOnline)showOnlineMenu('The online connection closed.');else onlineNotice('Could not connect. Try again.');});
 socket.addEventListener('error',()=>{if(socket===onlineSocket)onlineNotice('The grove server could not connect.');});
}

function handleOnlineMessage(message){
 if(message.type==='error'){const socket=onlineSocket;onlineSocket=null;if(socket?.readyState<2)socket.close();onlineNotice(message.message||'Could not join that room.');onlineRole='offline';updateOnlineStatus();return;}
 if(message.type==='room'){
  onlineRoom=message.room;onlineClientId=message.id;onlineLastPhase='';onlineSnapshotClock=onlineInputClock=0;
  if(message.host){onlineRole='host';onlineCrew.clear();history.replaceState(null,'',`${location.pathname}?room=${onlineRoom}`);onlineHostLobby();}
  else{onlineRole='guest';state='online-wait';history.replaceState(null,'',`${location.pathname}?room=${onlineRoom}`);onlineWaitingOverlay('Waiting for the host to start the battle…');}
  updateOnlineStatus();return;
 }
 if(message.type==='peer-join'&&onlineRole==='host'){onlineCrew.set(message.id,makeOnlineCrewMember(message));if(state==='online-lobby')onlineHostLobby('A player joined. Start when your crew is ready.');else updateOnlineStatus();return;}
 if(message.type==='peer-leave'&&onlineRole==='host'){onlineCrew.delete(message.id);if(state==='online-lobby')onlineHostLobby('A player left. The lobby is still enemy-free.');else updateOnlineStatus();return;}
 if(message.type==='peer-input'&&onlineRole==='host'){const member=onlineCrew.get(message.id);if(member){member.input={x:clamp(Number(message.input?.x)||0,-1,1),y:clamp(Number(message.input?.y)||0,-1,1)};if(message.input?.dash)member.dashQueued=true;}return;}
 if(message.type==='snapshot'&&onlineRole==='guest')applyOnlineSnapshot(message.snapshot);
 if(message.type==='room-closed'){const reason=message.reason||'The host closed the room.';leaveOnline();showOnlineMenu(reason);}
}

function leaveOnline(){const socket=onlineSocket;onlineSocket=null;if(socket&&socket.readyState<2)socket.close();onlineRole='offline';onlineRoom='';onlineClientId='';onlineCrew.clear();onlineRenderCrew=[];onlinePlayerCount=1;onlineLastPhase='';if(new URLSearchParams(location.search).has('room'))history.replaceState(null,'',location.pathname);updateOnlineStatus();}

function makeOnlineCrewMember({id,name,classId}){
 const safeClass=onlineClass(classId),definition=classes[safeClass],baseStats=characterBaseStats(definition),angle=(onlineCrew.size+1)/4*TAU,origin=player||{x:activeWorldWidth()/2,y:activeWorldHeight()/2};
 return{id,name:String(name||definition.name).slice(0,24),classId:safeClass,x:clamp(origin.x+Math.cos(angle)*100,25,activeWorldWidth()-25),y:clamp(origin.y+Math.sin(angle)*100,25,activeWorldHeight()-25),r:HERO_RADIUS,...baseStats,shield:0,nextCrit:0,damageBoost:0,damageBoostTimer:0,attackBoost:0,attackBoostTimer:0,speedBoost:0,speedBoostTimer:0,rangeBoost:0,rangeBoostTimer:0,moving:false,standingTime:0,ruleClock:0,dash:0,dashCooldown:0,dashQueued:false,hurtFeedback:0,abilityPulseClock:8,abilityLowHealthClock:10,shotsFired:0,input:{x:0,y:0},weapon:{type:definition.weapon,level:1,cool:0,angle:0,flash:0,meleeTime:0,meleeDuration:.22,meleeReach:0}};
}

function resetOnlineCrewForRun(){if(onlineRole!=='host'||!player)return;let index=0;for(const member of onlineCrew.values()){const definition=classes[onlineClass(member.classId)],baseStats=characterBaseStats(definition),angle=++index/Math.max(2,onlineCrew.size)*TAU;Object.assign(member,{x:clamp(player.x+Math.cos(angle)*105,25,activeWorldWidth()-25),y:clamp(player.y+Math.sin(angle)*105,25,activeWorldHeight()-25),r:HERO_RADIUS,...baseStats,shield:0,nextCrit:0,damageBoost:0,damageBoostTimer:0,attackBoost:0,attackBoostTimer:0,speedBoost:0,speedBoostTimer:0,rangeBoost:0,rangeBoostTimer:0,moving:false,standingTime:0,ruleClock:0,dash:0,dashCooldown:0,dashQueued:false,hurtFeedback:0,abilityPulseClock:8,abilityLowHealthClock:10,shotsFired:0,input:{x:0,y:0},weapon:{type:definition.weapon,level:1,cool:0,angle:angle,flash:0,meleeTime:0,meleeDuration:.22,meleeReach:0}});}}
function healOnlineCrewForWave(){if(onlineRole!=='host')return;for(const member of onlineCrew.values()){member.hp=member.hp<=0?Math.ceil(member.maxHp*.5):Math.min(member.maxHp,member.hp+Math.ceil(member.maxHp*.25));dispatchCharacterAbility('roundStart',{round:wave},member,[member.weapon]);}}
function onlineCrewAlive(){return[player,...onlineCrew.values()].filter(member=>member&&member.hp>0);}
function onlineEnemyTarget(enemy){let target=player,near=distance(enemy,player);for(const member of onlineCrew.values()){if(member.hp<=0)continue;const d=distance(enemy,member);if(d<near){near=d;target=member;}}return target;}
function onlineTargetCanSeeEnemy(target,enemy,margin=0){const viewX=clamp(target.x-W/2,0,Math.max(0,activeWorldWidth()-W)),viewY=clamp(target.y-H/2,0,Math.max(0,activeWorldHeight()-H));return enemy.x+enemy.r>=viewX-margin&&enemy.x-enemy.r<=viewX+W+margin&&enemy.y+enemy.r>=viewY-margin&&enemy.y-enemy.r<=viewY+H+margin;}
function onlineMoveEnemyTowardTargetView(enemy,target,dt){const viewX=clamp(target.x-W/2,0,Math.max(0,activeWorldWidth()-W)),viewY=clamp(target.y-H/2,0,Math.max(0,activeWorldHeight()-H)),margin=Math.max(24,enemy.r||0),x=clamp(enemy.x,viewX+margin,viewX+W-margin),y=clamp(enemy.y,viewY+margin,viewY+H-margin),dx=x-enemy.x,dy=y-enemy.y,d=Math.hypot(dx,dy)||1,mult=enemy.slowTime>0?.42:.76,moveX=dx/d*enemy.speed*mult*dt,moveY=dy/d*enemy.speed*mult*dt;if(Math.abs(moveX)>.01)enemy.facing=moveX>0?1:-1;enemy.x=clamp(enemy.x+moveX,20,activeWorldWidth()-20);enemy.y=clamp(enemy.y+moveY,20,activeWorldHeight()-20);enemy.hit=Math.max(0,(enemy.hit||0)-dt);}
function onlineSpawnBlocker(warning){return onlineCrewAlive().find(member=>distance(warning,member)<=78)||null;}
function onlineProjectileTarget(bullet){let target=null,near=Infinity;for(const member of onlineCrewAlive()){const d=distance(bullet,member);if(characterTouches(member,bullet,bullet.r)&&d<near){near=d;target=member;}}return target;}

function hurtOnlineCrew(member,amount,source){if(!member||member.hp<=0)return false;const armor=(member.armor||0)+characterRuleModifiers(member,[member.weapon]).armor;let hit=amount*difficulties[difficultyIndex].damage*ENEMY_DAMAGE*100/(100+armor*8);if(member.shield>0){const blocked=Math.min(member.shield,hit);member.shield-=blocked;hit-=blocked;}member.hp=Math.max(0,member.hp-hit);if(member.hurtFeedback<=0){member.hurtFeedback=.2;floatText(member.x,member.y-48,`-${Math.max(1,Math.ceil(hit))}`,'#ffa48f',19);showEffect('hit',member.x,member.y,68,.32);if(source&&!source.pursuer){const dx=member.x-source.x,dy=member.y-source.y,d=Math.hypot(dx,dy)||1;source.x-=dx/d*18;source.y-=dy/d*18;}dispatchCharacterAbility('hurt',{amount:hit,source},member,[member.weapon]);}if(member.hp<=0)floatText(member.x,member.y-70,'PLAYER DOWN','#ffcf66',22);return true;}

function onlineMemberTarget(member,range){let target=null,near=range;for(const enemy of enemies){const d=distance(member,enemy);if(enemy.hp>0&&onlineTargetCanSeeEnemy(member,enemy)&&d<near){near=d;target=enemy;}}if(target)return target;for(const tree of trees){const d=distance(member,tree);if(tree.alive&&onlineTargetCanSeeEnemy(member,tree)&&d<near){near=d;target=tree;}}return target;}
function updateOnlineCrew(dt){
 if(onlineRole!=='host'||!player)return;
 for(const member of onlineCrew.values()){
  member.hurtFeedback=Math.max(0,(member.hurtFeedback||0)-dt);member.dashCooldown=Math.max(0,(member.dashCooldown||0)-dt);member.dash=Math.max(0,(member.dash||0)-dt);member.weapon.cool-=dt;member.weapon.flash=Math.max(0,(member.weapon.flash||0)-dt);member.weapon.meleeTime=Math.max(0,(member.weapon.meleeTime||0)-dt);for(const timer of ['damageBoostTimer','attackBoostTimer','speedBoostTimer','rangeBoostTimer'])member[timer]=Math.max(0,(member[timer]||0)-dt);
  if(member.hp<=0){member.moving=false;continue;}
  member.abilityPulseClock=(member.abilityPulseClock??8)-dt;if(member.abilityPulseClock<=0){member.abilityPulseClock=8;dispatchCharacterAbility('interval',{},member,[member.weapon]);}if(member.hp<member.maxHp/2){member.abilityLowHealthClock=(member.abilityLowHealthClock??10)-dt;if(member.abilityLowHealthClock<=0){member.abilityLowHealthClock=10;dispatchCharacterAbility('lowHealth',{},member,[member.weapon]);}}else member.abilityLowHealthClock=10;
  if(member.dashQueued&&member.dashCooldown<=0){member.dash=.18;member.dashCooldown=2.4;dispatchCharacterAbility('dash',{},member,[member.weapon]);}member.dashQueued=false;
  let x=member.input.x||0,y=member.input.y||0,length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}member.moving=length>.1;member.standingTime=member.moving?0:(member.standingTime||0)+dt;const ruleMods=characterRuleModifiers(member,[member.weapon]),moveBoost=(member.speedBoostTimer>0?1+(member.speedBoost||0):1)*ruleMods.speed;member.x=clamp(member.x+x*member.speed*moveBoost*(member.dash>0?3.1:1)*dt,25,activeWorldWidth()-25);member.y=clamp(member.y+y*member.speed*moveBoost*(member.dash>0?3.1:1)*dt,25,activeWorldHeight()-25);updateCharacterRule(member,dt);
  const weapon=member.weapon,definition=weaponTypes[weapon.type],rangeBoost=activeRangeMultiplier(member,[weapon]),effectiveRange=weaponLockRange(definition)*rangeBoost,target=onlineMemberTarget(member,effectiveRange);if(!target)continue;const angle=Math.atan2(target.y-member.y,target.x-member.x);weapon.angle=angle;if(weapon.cool>0)continue;const attackBoost=((member.attack||1)+(member.attackBoostTimer>0?member.attackBoost||0:0))*ruleMods.attack,damageBoost=(member.damage||1)*(member.damageBoostTimer>0?1+(member.damageBoost||0):1)*ruleMods.damage,crit=(member.nextCrit||0)>0;if(crit)member.nextCrit--;weapon.cool=weaponAttackTime(definition)/attackBoost;weapon.flash=.1;member.shotsFired=(member.shotsFired||0)+1;if(member.shotsFired%8===0)dispatchCharacterAbility('shot',{weapon},member,[weapon]);
  if(definition.melee){weapon.meleeDuration=clamp(weaponAttackTime(definition)*.46,.16,.32);weapon.meleeTime=weapon.meleeDuration;weapon.meleeReach=Math.max(36,effectiveRange-48);const attack={...definition,damage:weaponDamageAtTier(definition,weapon.level||1)*damageBoost,crit,onlineOwnerId:member.id,vx:Math.cos(angle),vy:Math.sin(angle)};if(enemies.includes(target))applyWeaponHit(target,attack);else damageTree(target,attack.damage);}
  else{const width=(weaponWidths[weapon.type]||64)*SPRITE_SCALE,muzzle=52+width*.47,count=(definition.pellets||1)*(definition.burst||1),spread=definition.spread??(definition.burst?0.045:0);for(let shot=0;shot<count;shot++){const shotAngle=angle+(shot-(count-1)/2)*spread,projectile=makeProjectile({...definition,range:effectiveRange,speed:weaponShotSpeed(definition)},member.x+Math.cos(angle)*muzzle,member.y+Math.sin(angle)*muzzle,shotAngle,weaponDamageAtTier(definition,weapon.level||1)*damageBoost,crit);projectile.onlineOwnerId=member.id;addBullet(projectile);}}
 }
 gems=gems.filter(gem=>{for(const member of onlineCrew.values())if(member.hp>0&&distance(gem,member)<MATERIAL_COLLECT_DISTANCE){collect(gem,{online:true,characterActor:member,characterWeapons:[member.weapon]});return false;}return true;});
 baskets=baskets.filter(basket=>{for(const member of onlineCrew.values())if(member.hp>0&&distance(basket,member)<30){member.hp=Math.min(member.maxHp,member.hp+5);collect({value:3},{basket:true,online:true,characterActor:member,characterWeapons:[member.weapon]});floatText(member.x,member.y-48,'+5 HP · ◆3','#f2d58c',20);showEffect('heal',basket.x,basket.y,78,.65);return false;}return true;});
}

function drawOnlineCrewMembers(){
 const members=onlineRole==='host'?[...onlineCrew.values()]:onlineRole==='guest'?onlineRenderCrew:[];
 for(const member of members){
  const weapon=member.weapon||{type:member.weaponType,angle:member.weaponAngle,flash:member.weaponFlash,meleeTime:member.meleeTime,meleeDuration:member.meleeDuration,meleeReach:member.meleeReach},definition=weaponTypes[weapon.type]||weaponTypes.pistol,angle=Number.isFinite(weapon.angle)?weapon.angle:0,progress=definition.melee&&weapon.meleeTime>0?Math.sin(clamp(1-weapon.meleeTime/(weapon.meleeDuration||.22),0,1)*Math.PI):0,thrust=progress*(weapon.meleeReach||0),weaponX=member.x+Math.cos(angle)*(52+thrust),weaponY=member.y+Math.sin(angle)*(42+thrust);
  ctx.save();ctx.globalAlpha=member.hp>0?1:.38;drawArt(heroArt(onlineClass(member.classId)),member.x,member.y+(member.moving?Math.sin(worldTime*18)*3:0),HERO_DRAW_SIZE*SPRITE_SCALE);ctx.translate(weaponX,weaponY);ctx.rotate(angle);drawLocalArt(art[`weapon-${weapon.type}`],(weaponWidths[weapon.type]||64)*SPRITE_SCALE);if(!definition.melee&&weapon.flash>0){ctx.translate((weaponWidths[weapon.type]||64)*SPRITE_SCALE*.48+14,0);drawLocalArt(art['muzzle-flash'],52*SPRITE_SCALE);}ctx.restore();
  const width=70*SPRITE_SCALE,y=member.y-43*SPRITE_SCALE;ctx.fillStyle='#101610dd';ctx.fillRect(member.x-width/2-3,y-3,width+6,14);ctx.fillStyle=member.hp>0?'#8be8a0':'#566158';ctx.fillRect(member.x-width/2,y,width*clamp(member.hp/member.maxHp,0,1),8);ctx.strokeStyle='#f6e4ca';ctx.lineWidth=2;ctx.strokeRect(member.x-width/2,y,width,8);ctx.fillStyle='#f6e4ca';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText(member.hp>0?member.name:`${member.name} · DOWN`,member.x,member.y+46);
 }
}

function onlinePlain(entity){const result={};for(const [key,value] of Object.entries(entity||{})){if(typeof value==='number'){if(Number.isFinite(value))result[key]=value;}else if(typeof value==='string'||typeof value==='boolean')result[key]=value;}return result;}
function onlineSnapshotPlayer(id,member,weapon){return{...onlinePlain(member),id,classId:onlineClass(member.classId||(member===player?chosen:'ranger')),name:member.name||(member===player?classes[chosen].name:'Online Player'),weaponType:weapon?.type||classes[onlineClass(member.classId)].weapon,weaponAngle:weapon?.angle||0,weaponFlash:weapon?.flash||0,meleeTime:weapon?.meleeTime||0,meleeDuration:weapon?.meleeDuration||.22,meleeReach:weapon?.meleeReach||0};}
function makeOnlineSnapshot(){
 const players=[onlineSnapshotPlayer(onlineClientId,player,weapons[0]),...[...onlineCrew.values()].map(member=>onlineSnapshotPlayer(member.id,member,member.weapon))];
 return{phase:state,wave,remaining,elapsed,money,level,xp,xpGoal,kills,difficultyIndex,worldTime,worldWidth:activeWorldWidth(),worldHeight:activeWorldHeight(),players,weapons:weapons.map(onlinePlain),items:[...items],itemTiers:itemTierState.map(entry=>entry?.level||0),enemies:enemies.map(onlinePlain),spawnWarnings:spawnWarnings.map(onlinePlain),structures:structures.map(onlinePlain),trees:trees.map(onlinePlain),farms:farms.map(onlinePlain),baskets:baskets.map(onlinePlain),gems:gems.map(onlinePlain),bullets:bullets.map(onlinePlain),visualEffects:visualEffects.map(onlinePlain),enemyDeathEffects:enemyDeathEffects.map(onlinePlain),effectWaves:effectWaves.map(onlinePlain),effectLinks:effectLinks.map(onlinePlain),texts:texts.filter(text=>text.damage).slice(-48).map(onlinePlain)};
}
function makeOnlineLobbySnapshot(){return{phase:'online-lobby',players:onlineLobbyPlayers()};}

function onlineWaitingOverlay(label){state='online-wait';setScreen();overlay(`<div class="tag">ROOM ${onlineRoom} · ${onlinePlayerCount}/4 PLAYERS</div><h2>CREW<br><span>CONNECTED</span></h2><div class="room-code-display">${onlineRoom}</div><p>${label}</p><p class="online-intro">No enemies can spawn in the joining lobby. The host controls upgrades and the shop after the battle starts.</p><button id="leaveOnline" data-controller-default>LEAVE ROOM</button>`);$('leaveOnline').onclick=()=>{leaveOnline();history.replaceState(null,'',location.pathname);menu();};}
function applyOnlineSnapshot(snapshot){
 if(!snapshot||!Array.isArray(snapshot.players))return;onlinePlayerCount=snapshot.players.length;updateOnlineStatus();
 if(snapshot.phase!=='playing'){
  const label=({'online-lobby':'Waiting for the host to start the enemy-free lobby…',paused:'The host paused the grove.',upgrade:'The host is choosing an upgrade…',shop:'The host is choosing gear…',dead:'The crew was made into guacamole.',won:'The run is complete.'}[snapshot.phase]||'Waiting for the host…');
  if(snapshot.phase!==onlineLastPhase||state!=='online-wait')onlineWaitingOverlay(label);onlineLastPhase=snapshot.phase;return;
 }
 const self=snapshot.players.find(entry=>entry.id===onlineClientId);if(!self)return;const browsingItems=state==='inventory',oldChosen=chosen,priorPlayer=player&&onlineLastPhase==='playing'?player:null;chosen=onlineClass(self.classId);
 runWorldWidth=snapshot.worldWidth||WORLD_W;runWorldHeight=snapshot.worldHeight||WORLD_H;const defaults={r:HERO_RADIUS,...characterBaseStats(classes[chosen]),shield:0,nextCrit:0,damageBoost:0,damageBoostTimer:0,attackBoost:0,attackBoostTimer:0,speedBoost:0,speedBoostTimer:0,rangeBoost:0,rangeBoostTimer:0,hurtFeedback:0,standingTime:0,ruleClock:0};player={...defaults,...self};
 if(priorPlayer){player.x=priorPlayer.x;player.y=priorPlayer.y;player._netX=self.x;player._netY=self.y;}onlineRenderCrew=onlineMergeEntities(onlineRenderCrew,snapshot.players.filter(entry=>entry.id!==onlineClientId),'id');weapons=[{type:self.weaponType||classes[chosen].weapon,level:1,cool:0,angle:self.weaponAngle||0,flash:self.weaponFlash||0,meleeTime:self.meleeTime||0,meleeDuration:self.meleeDuration||.22,meleeReach:self.meleeReach||0}];items=snapshot.items||[];itemTierState=items.map((type,index)=>({type,level:snapshot.itemTiers?.[index]??1}));dashTimer=self.dashCooldown||0;
 wave=snapshot.wave;remaining=snapshot.remaining;elapsed=snapshot.elapsed;money=snapshot.money;level=snapshot.level;xp=snapshot.xp;xpGoal=snapshot.xpGoal;kills=snapshot.kills;difficultyIndex=snapshot.difficultyIndex;worldTime=Math.max(worldTime,snapshot.worldTime||0);
 enemies=onlineMergeEntities(enemies,snapshot.enemies,'netId');spawnWarnings=snapshot.spawnWarnings||[];structures=snapshot.structures||[];trees=snapshot.trees||[];farms=snapshot.farms||[];baskets=snapshot.baskets||[];gems=snapshot.gems||[];bullets=onlineMergeEntities(bullets,snapshot.bullets,'netId','extrapolate');visualEffects=snapshot.visualEffects||[];enemyDeathEffects=snapshot.enemyDeathEffects||[];effectWaves=snapshot.effectWaves||[];effectLinks=snapshot.effectLinks||[];particles=[];texts=snapshot.texts||[];
 if(!browsingItems){if(onlineLastPhase!=='playing'){camera={x:clamp(player.x-W/2,0,Math.max(0,activeWorldWidth()-W)),y:clamp(player.y-H/2,0,Math.max(0,activeWorldHeight()-H))};hideOverlay();setScreen('playing');$('pause').textContent='HOST CONTROLS';}state='playing';}else{state='inventory';setScreen('inventory');$('inventoryPanel').hidden=false;renderItemInventory();}onlineLastPhase='playing';if(oldChosen!==chosen)updateSurvivor();updateUI();
}

function updateOnlineGuest(dt){
 worldTime+=dt;if(state!=='playing'||!player)return;onlineInterpolateEntities(onlineRenderCrew,dt);onlineInterpolateEntities(enemies,dt);for(const bullet of bullets){bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;}player.hurtFeedback=Math.max(0,(player.hurtFeedback||0)-dt);player.dash=Math.max(0,(player.dash||0)-dt);if(player.hp>0){let{x,y}=onlineInput();const length=Math.hypot(x,y);player.moving=length>.1;player.standingTime=player.moving?0:(player.standingTime||0)+dt;const ruleMods=characterRuleModifiers(player),boost=(player.dash>0?3.1:1)*ruleMods.speed,moveX=x*player.speed*boost*dt,moveY=y*player.speed*boost*dt;player.x=clamp(player.x+moveX,25,activeWorldWidth()-25);player.y=clamp(player.y+moveY,25,activeWorldHeight()-25);if(Number.isFinite(player._netX)){player._netX=clamp(player._netX+moveX,25,activeWorldWidth()-25);player._netY=clamp(player._netY+moveY,25,activeWorldHeight()-25);}}if(Number.isFinite(player._netX)){const correction=Math.min(1,dt*8);player.x+=(player._netX-player.x)*correction;player.y+=(player._netY-player.y)*correction;}const targetX=clamp(player.x-W/2,0,Math.max(0,activeWorldWidth()-W)),targetY=clamp(player.y-H/2,0,Math.max(0,activeWorldHeight()-H)),step=Math.min(1,dt*9);camera.x+=(targetX-camera.x)*step;camera.y+=(targetY-camera.y)*step;
}
function onlineFrame(dt){
 if(onlineRole==='host'){onlineSnapshotClock+=dt;if(onlineSnapshotClock>=ONLINE_SNAPSHOT_INTERVAL){onlineSnapshotClock=0;onlineSend({type:'snapshot',snapshot:state==='online-lobby'?makeOnlineLobbySnapshot():makeOnlineSnapshot()});updateOnlineStatus();}}
 else if(onlineRole==='guest'&&(state==='playing'||state==='inventory')){onlineInputClock+=dt;if(onlineInputClock>=ONLINE_INPUT_INTERVAL||onlineDashQueued){onlineInputClock=0;const input=state==='playing'?onlineInput():{x:0,y:0};input.dash=state==='playing'&&onlineDashQueued;onlineDashQueued=false;onlineSend({type:'input',input});}}
}

updateOnlineStatus();
const sharedRoom=new URLSearchParams(location.search).get('room')?.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);if(sharedRoom?.length===5)queueMicrotask(()=>{showOnlineMenu();const input=$('roomCode');if(input)input.value=sharedRoom;});
