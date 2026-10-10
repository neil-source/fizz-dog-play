'use strict';

(()=>{
  const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
  const tracks={
    menu:{bpm:58,wave:'sine',hold:2.8,melody:[69,null,null,65,null,null,62,null,60,null,null,62,null,null,57,null],bass:[38,34,41,36],chords:[[50,53,57],[46,50,53],[53,57,60],[48,52,55]]},
    level:{bpm:76,wave:'triangle',hold:2.15,melody:[69,null,65,null,62,null,null,60,62,null,65,null,64,null,60,null],bass:[38,36,34,33],chords:[[50,53,57],[48,52,55],[46,50,53],[45,48,52]]},
    shop:{bpm:64,wave:'sine',hold:2.65,melody:[64,null,null,60,null,57,null,null,62,null,null,59,null,55,null,null],bass:[33,29,36,31],chords:[[45,48,52],[41,45,48],[48,52,55],[43,47,50]]},
    boss:{bpm:106,wave:'triangle',hold:1.35,melody:[50,null,53,50,null,56,55,null,49,null,53,49,null,57,56,null],bass:[26,26,29,25],chords:[[38,41,45],[38,41,44],[41,44,48],[37,41,44]]},
    end:{bpm:52,wave:'sine',hold:3.1,melody:[65,null,null,62,null,null,57,null,60,null,null,57,null,null,53,null],bass:[34,31,29,33],chords:[[46,50,53],[43,46,50],[41,45,48],[45,48,52]]}
  };
  let context=null,master=null,musicBus=null,sfxBus=null,noiseBuffer=null,timer=null,nextStepTime=0,step=0,scene='menu',paused=false;
  let enabled=true;
  try{enabled=localStorage.getItem('sketchbound-sound')!=='off';}catch{}
  const stats={events:{},sceneChanges:['menu']};
  const frequency=midi=>440*Math.pow(2,(midi-69)/12);

  function ensureAudio(){
    if(context||!AudioContextClass)return context;
    context=new AudioContextClass();
    master=context.createGain();musicBus=context.createGain();sfxBus=context.createGain();
    master.gain.value=enabled?1:0;musicBus.gain.value=.13;sfxBus.gain.value=.27;
    musicBus.connect(master);sfxBus.connect(master);master.connect(context.destination);
    noiseBuffer=context.createBuffer(1,Math.max(1,Math.floor(context.sampleRate*.8)),context.sampleRate);
    const channel=noiseBuffer.getChannelData(0);for(let index=0;index<channel.length;index++)channel[index]=Math.random()*2-1;
    nextStepTime=context.currentTime+.06;
    timer=setInterval(scheduleMusic,70);
    return context;
  }

  function unlock(){
    const audio=ensureAudio();
    if(!audio||!enabled)return Promise.resolve(false);
    nextStepTime=Math.max(nextStepTime,audio.currentTime+.03);
    return audio.state==='suspended'?audio.resume().then(()=>true).catch(()=>false):Promise.resolve(true);
  }

  function tone(time,midi,duration=.12,wave='triangle',volume=.1,bus=musicBus,slide=null,attack=.012,cutoff=null){
    if(!context||!bus||midi==null)return;
    const oscillator=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter();
    oscillator.type=wave;oscillator.frequency.setValueAtTime(frequency(midi),time);
    if(slide!=null)oscillator.frequency.exponentialRampToValueAtTime(Math.max(30,frequency(slide)),time+duration);
    filter.type='lowpass';filter.frequency.value=cutoff||(wave==='sawtooth'?1500:2600);filter.Q.value=.7;
    gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),time+Math.min(attack,duration*.42));gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    oscillator.connect(filter);filter.connect(gain);gain.connect(bus);oscillator.start(time);oscillator.stop(time+duration+.03);
  }

  function noise(time,duration=.08,volume=.07,frequencyValue=900,bus=sfxBus,q=.8){
    if(!context||!noiseBuffer)return;
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=frequencyValue;filter.Q.value=q;
    gain.gain.setValueAtTime(Math.max(.0002,volume),time);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    source.connect(filter);filter.connect(gain);gain.connect(bus);source.start(time);source.stop(time+duration+.02);
  }

  function pad(time,notes,duration,volume=.022){
    if(!context||!musicBus)return;
    notes.forEach((midi,index)=>{
      const oscillator=context.createOscillator(),gain=context.createGain(),filter=context.createBiquadFilter();
      oscillator.type=index===0?'sine':'triangle';oscillator.frequency.value=frequency(midi);oscillator.detune.value=(index-1)*3;
      filter.type='lowpass';filter.frequency.value=920;filter.Q.value=.45;
      gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(volume,time+.28);gain.gain.setValueAtTime(volume*.72,time+Math.max(.3,duration-.42));gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
      oscillator.connect(filter);filter.connect(gain);gain.connect(musicBus);oscillator.start(time);oscillator.stop(time+duration+.04);
    });
  }

  function scheduleMusic(){
    if(!context||context.state!=='running'||!enabled||paused)return;
    const track=tracks[scene]||tracks.level,stepLength=60/track.bpm/2;
    if(nextStepTime<context.currentTime-.25)nextStepTime=context.currentTime+.03;
    while(nextStepTime<context.currentTime+.22){
      const melody=track.melody[step%track.melody.length],bar=Math.floor(step/8)%track.bass.length,bass=track.bass[bar];
      if(step%8===0)pad(nextStepTime,track.chords[bar],stepLength*7.7,scene==='boss'?.018:.021);
      if(melody!=null)tone(nextStepTime,melody,stepLength*track.hold,track.wave,scene==='boss'?.035:.031,musicBus,null,.09,scene==='boss'?1200:1500);
      if(step%4===0)tone(nextStepTime,bass,stepLength*3.3,'sine',.05,musicBus,null,.07,650);
      if(scene==='level'||scene==='boss'){
        if(step%4===0)tone(nextStepTime,29,stepLength*.48,'sine',scene==='boss'?.062:.04,musicBus,24,.006,420);
        if(scene==='boss'&&step%8===4)noise(nextStepTime,.11,.016,460,musicBus,.65);
      }
      nextStepTime+=stepLength;step++;
    }
  }

  function performEffect(name){
    if(!context||context.state!=='running')return;
    const now=context.currentTime+.004;
    if(name==='jump'){noise(now,.15,.075,520);tone(now,50,.18,'triangle',.075,sfxBus,57,.025,900);}
    else if(name==='dash'){noise(now,.19,.13,360);tone(now,43,.2,'sawtooth',.07,sfxBus,34,.008,720);}
    else if(name==='fire'){noise(now,.24,.13,220);tone(now,43,.28,'sawtooth',.13,sfxBus,32,.01,680);tone(now+.025,55,.17,'triangle',.055,sfxBus,46,.02,900);}
    else if(name==='shoot'){noise(now,.075,.12,1120);tone(now,43,.12,'triangle',.11,sfxBus,34,.004,760);}
    else if(name==='melee'){noise(now,.13,.14,610);tone(now,48,.16,'sawtooth',.095,sfxBus,36,.006,820);}
    else if(name==='coin'){tone(now,72,.18,'sine',.095,sfxBus,69,.008,1700);tone(now+.07,75,.26,'triangle',.07,sfxBus,72,.012,1500);}
    else if(name==='shield'){noise(now,.17,.11,1450);tone(now,55,.34,'triangle',.11,sfxBus,48,.008,1300);}
    else if(name==='hurt'){noise(now,.27,.17,190);tone(now,40,.34,'sawtooth',.15,sfxBus,29,.008,560);}
    else if(name==='enemy'){tone(now,50,.28,'triangle',.11,sfxBus,35,.008,760);noise(now,.19,.1,330);}
    else if(name==='boss'){tone(now,31,.78,'sawtooth',.18,sfxBus,24,.06,420);noise(now,.52,.15,125);}
    else if(name==='bossAttack'){tone(now,38,.35,'sawtooth',.16,sfxBus,27,.006,520);noise(now,.29,.14,185);}
    else if(name==='bossDefeat'){[43,40,36,31].forEach((note,index)=>tone(now+index*.12,note,.36,'triangle',.1,sfxBus,note-5,.012,700));noise(now,.58,.16,155);}
    else if(name==='buy'){[57,60,64].forEach((note,index)=>tone(now+index*.09,note,.32,'sine',.075,sfxBus,null,.025,1400));}
    else if(name==='magic'){[57,60,64,69].forEach((note,index)=>tone(now+index*.065,note,.38,'sine',.065,sfxBus,note-2,.04,1250));}
    else if(name==='transition'){tone(now,57,.48,'triangle',.08,sfxBus,45,.08,1050);}
    else if(name==='win'){[62,65,69,65,62].forEach((note,index)=>tone(now+index*.14,note,.48,'sine',.075,sfxBus,null,.06,1350));}
    else if(name==='click'){tone(now,55,.075,'triangle',.06,sfxBus,51,.004,950);}
  }

  function play(name){
    stats.events[name]=(stats.events[name]||0)+1;
    if(!enabled)return false;
    unlock().then(ok=>{if(ok)performEffect(name);});return true;
  }

  function setScene(nextScene){
    if(!tracks[nextScene])nextScene='level';
    if(scene===nextScene)return;
    scene=nextScene;step=0;stats.sceneChanges.push(scene);
    if(context)nextStepTime=context.currentTime+.04;
  }

  function setPaused(value){
    paused=!!value;
    if(context&&musicBus)musicBus.gain.setTargetAtTime(paused ? .025 : .13,context.currentTime,.08);
    if(!paused&&context)nextStepTime=context.currentTime+.04;
  }

  function updateButton(){
    const button=document.getElementById('soundToggle');if(!button)return;
    const label=document.getElementById('soundToggleLabel');
    if(label)label.textContent=enabled?'SOUND ON':'SOUND OFF';
    button.setAttribute('aria-pressed',String(enabled));
    button.setAttribute('aria-label',enabled?'Turn game sound off':'Turn game sound on');
  }

  function toggle(){
    enabled=!enabled;
    try{localStorage.setItem('sketchbound-sound',enabled?'on':'off');}catch{}
    const audio=ensureAudio();
    if(audio&&master)master.gain.setTargetAtTime(enabled?1:0,audio.currentTime,.025);
    if(enabled)unlock();
    updateButton();return enabled;
  }

  const api={unlock,play,setScene,setPaused,toggle,get enabled(){return enabled;},get scene(){return scene;},get stats(){return{events:{...stats.events},sceneChanges:[...stats.sceneChanges]};}};
  globalThis.gameSound=api;
  addEventListener('pointerdown',unlock,{capture:true,passive:true});
  addEventListener('touchstart',unlock,{capture:true,passive:true});
  addEventListener('keydown',event=>{
    unlock();
    const typing=/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName||'');
    if(event.code==='KeyM'&&!event.repeat&&!typing){event.preventDefault();toggle();}
  },{capture:true});
  document.addEventListener('click',event=>{const button=event.target.closest?.('button');if(button&&button.id!=='soundToggle')play('click');});
  document.getElementById('soundToggle')?.addEventListener('click',toggle);
  updateButton();
})();
