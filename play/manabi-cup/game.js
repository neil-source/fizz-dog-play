(() => {
  "use strict";

  const DATA = window.MATH_CUP_DATA;
  if (!DATA?.grades || !DATA?.generate) throw new Error("Math data failed to load");
  const $ = selector => document.querySelector(selector);
  const ui = {
    start: $("#startScreen"), quiz: $("#quizScreen"), result: $("#resultScreen"),
    home: $("#homeButton"), gradeNav: $("#gradeNav"), startGrade: $("#startGradeName"), startDescription: $("#startDescription"), unitGrid: $("#unitGrid"),
    back: $("#backButton"), gradeBadge: $("#gradeBadge"), modeBadge: $("#modeBadge"), count: $("#questionCount"), score: $("#scoreValue"), progress: $("#progressBar"),
    mascot: $("#mathMascot"), mascotSpeech: $("#mascotSpeech"), micStatus: $("#micStatus"), micLevel: $("#micLevel"),
    topic: $("#topicLabel"), wordProblem: $("#wordProblem"), prompt: $("#mathPrompt"), instruction: $("#answerInstruction"), choices: $("#choiceAnswers"),
    answerForm: $("#answerForm"), answerInput: $("#answerInput"), voice: $("#voiceButton"), check: $("#checkButton"), numberPad: $("#numberPad"),
    feedback: $("#feedback"), feedbackIcon: $("#feedbackIcon"), feedbackTitle: $("#feedbackTitle"), feedbackCopy: $("#feedbackCopy"), next: $("#nextButton"),
    resultBadge: $("#resultBadge"), resultTitle: $("#resultTitle"), finalScore: $("#finalScore"), resultMessage: $("#resultMessage"), best: $("#bestScore"), retry: $("#retryButton"), units: $("#unitsButton"),
    help: $("#helpButton"), settings: $("#settingsButton"), fullscreen: $("#fullscreenButton"), privacy: $("#privacyButton"),
    helpDialog: $("#helpDialog"), settingsDialog: $("#settingsDialog"), privacyDialog: $("#privacyDialog"), announcer: $("#announcer"),
    language: $("#languageSetting"), difficulty: $("#difficultySetting"), questionCount: $("#questionCountSetting"),
    controllerSensitivity: $("#controllerSensitivitySetting"), controllerSensitivityValue: $("#controllerSensitivityValue"), micGain: $("#micGainSetting"), micGainValue: $("#micGainValue"),
    catVoice: $("#catVoiceSetting"), catVolume: $("#catVolumeSetting"), catVolumeValue: $("#catVolumeValue"), catStyle: $("#catStyleSetting"), testVoice: $("#testVoiceButton"),
    largeText: $("#largeTextSetting"), contrast: $("#contrastSetting"), reduceMotion: $("#reduceMotionSetting"),
    reset: $("#resetButton"), resetStatus: $("#resetStatus"), controllerNotice: $("#controllerNotice"), controllerName: $("#controllerName"), controllerHelp: $("#controllerHelp")
  };

  const SETTINGS_KEY = "mathCupSettingsV1";
  const PROGRESS_KEY = "mathCupProgressV1";
  const CAT_AUDIO_VERSION = "20261003-math1";
  const QUESTION_LINES = [
    "Nice! You've got this!", "You're doing great!", "Keep going!", "You're good at this!", "Take your time!",
    "You can do it!", "Great focus!", "Keep it up!", "Believe in yourself!", "Let's do this!"
  ];
  const SUCCESS_LINES = [
    "Nice!", "Great job!", "You're doing great!", "Keep it up!", "Awesome!", "Well done!", "Super!", "You got it!", "Brilliant!", "Fantastic!",
    "Excellent!", "Good thinking!", "Way to go!", "Keep going!", "Wonderful!", "Strong work!", "That's right!", "You're learning fast!", "High five!", "Purr-fect!"
  ];
  const MISTAKE_LINES = [
    "One more time! You can do it!", "One more time! Keep trying!", "One more time! Almost!", "One more time! Take it slowly!", "One more time! Look carefully!",
    "One more time! Stay with it!", "One more time! Good try!", "One more time! Try the next one!", "One more time! You're getting closer!", "One more time! I believe in you!"
  ];
  const AUDIO_BY_LINE = new Map([
    ...QUESTION_LINES.map((line, index) => [line, `./assets/cat-voice/question-${String(index + 1).padStart(2, "0")}.wav?v=${CAT_AUDIO_VERSION}`]),
    ...SUCCESS_LINES.map((line, index) => [line, `./assets/cat-voice/success-${String(index + 1).padStart(2, "0")}.wav?v=${CAT_AUDIO_VERSION}`]),
    ...MISTAKE_LINES.map((line, index) => [line, `./assets/cat-voice/mistake-${String(index + 1).padStart(2, "0")}.wav?v=${CAT_AUDIO_VERSION}`])
  ]);
  const GRADE_COLORS = { 1: "#ffd65c", 2: "#ff9a79", 3: "#73d8ae", 4: "#74c9ee", 5: "#aaa2f4", 6: "#ef98c8" };
  const POSES = ["idle", "wave", "think", "write", "cheer", "clap", "bounce", "surprise", "sleepy", "perfect"];

  let selectedGrade = "1";
  let activeUnit = null;
  let questions = [];
  let current = 0;
  let score = 0;
  let answered = false;
  let roundMode = 1;
  let successIndex = 0;
  let mistakeIndex = 0;
  let mascotTimer = 0;
  let activeRecognition = null;
  let activeMicStream = null;
  let dictationAttempt = 0;
  let dictationMuted = false;
  let activeCatAudio = null;
  let catAudioGeneration = 0;
  let controllerSpeakerId = "";
  let controllerSpeakerLabel = "";
  let controllerSpeakerReady = false;
  let controllerConnected = false;
  let keyboardControllerMode = false;
  let controllerLabel = "PS5 コントローラー";
  let lastDialogTrigger = null;
  let resetArmed = false;
  let resetTimer = 0;
  const controllerStates = new Map();

  function clamp(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  }

  function readSettings() {
    const defaults = { language: "both", difficulty: "normal", questionCount: 10, controllerSensitivity: 1, micGain: 2.5, catVoice: true, catVolume: 1, catStyle: "gentle", largeText: false, contrast: false, reduceMotion: false };
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      return {
        language: ["both", "japanese", "english"].includes(saved.language) ? saved.language : defaults.language,
        difficulty: ["gentle", "normal", "challenge"].includes(saved.difficulty) ? saved.difficulty : defaults.difficulty,
        questionCount: [5, 10, 20].includes(Number(saved.questionCount)) ? Number(saved.questionCount) : defaults.questionCount,
        controllerSensitivity: clamp(saved.controllerSensitivity, .5, 2, 1),
        micGain: clamp(saved.micGain, 1, 4, 2.5),
        catVoice: saved.catVoice === undefined ? true : Boolean(saved.catVoice),
        catVolume: clamp(saved.catVolume, 0, 1, 1),
        catStyle: ["gentle", "kitten", "calm"].includes(saved.catStyle) ? saved.catStyle : defaults.catStyle,
        largeText: Boolean(saved.largeText), contrast: Boolean(saved.contrast),
        reduceMotion: saved.reduceMotion === undefined ? matchMedia("(prefers-reduced-motion: reduce)").matches : Boolean(saved.reduceMotion)
      };
    } catch { return defaults; }
  }

  function applySettings(settings = readSettings()) {
    document.body.classList.toggle("large-text", settings.largeText);
    document.body.classList.toggle("high-contrast", settings.contrast);
    document.body.classList.toggle("reduce-motion", settings.reduceMotion);
    ui.language.value = settings.language;
    ui.difficulty.value = settings.difficulty;
    ui.questionCount.value = String(settings.questionCount);
    ui.controllerSensitivity.value = String(Math.round(settings.controllerSensitivity * 100));
    ui.controllerSensitivityValue.textContent = `${Math.round(settings.controllerSensitivity * 100)}%`;
    ui.micGain.value = String(Math.round(settings.micGain * 100));
    ui.micGainValue.textContent = `${Math.round(settings.micGain * 100)}%`;
    ui.catVoice.checked = settings.catVoice;
    ui.catVolume.value = String(Math.round(settings.catVolume * 100));
    ui.catVolumeValue.textContent = `${Math.round(settings.catVolume * 100)}%`;
    ui.catStyle.value = settings.catStyle;
    ui.largeText.checked = settings.largeText;
    ui.contrast.checked = settings.contrast;
    ui.reduceMotion.checked = settings.reduceMotion;
    if (!settings.catVoice || settings.catVolume <= 0) stopCatVoice();
    if (activeCatAudio) {
      activeCatAudio.volume = settings.catVolume;
      activeCatAudio.playbackRate = settings.catStyle === "kitten" ? 1.12 : settings.catStyle === "calm" ? .9 : 1;
    }
  }

  function saveSettings() {
    const before = readSettings();
    const settings = {
      language: ui.language.value, difficulty: ui.difficulty.value, questionCount: Number(ui.questionCount.value),
      controllerSensitivity: Number(ui.controllerSensitivity.value) / 100,
      micGain: Number(ui.micGain.value) / 100,
      catVoice: ui.catVoice.checked, catVolume: Number(ui.catVolume.value) / 100, catStyle: ui.catStyle.value,
      largeText: ui.largeText.checked, contrast: ui.contrast.checked, reduceMotion: ui.reduceMotion.checked
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applySettings(settings);
    if (before.language !== settings.language) {
      renderUnits();
      if (!ui.quiz.hidden && !answered) renderQuestion();
    }
    announce("せっていを ほぞんしました");
  }

  function readProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch { return {}; }
  }

  function saveUnitProgress(unitId, result) {
    const progress = readProgress();
    const previous = progress[unitId] || { best: 0, rounds: 0, level: 1, perfect: false };
    const perfect = result === questions.length;
    progress[unitId] = {
      best: Math.max(previous.best, result), rounds: previous.rounds + 1,
      level: perfect ? 2 : previous.level || 1, perfect: previous.perfect || perfect,
      total: questions.length, updatedAt: Date.now()
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return progress[unitId];
  }

  function textFor(ja, en) {
    const language = readSettings().language;
    if (language === "japanese") return ja;
    if (language === "english") return en;
    return `${ja} / ${en}`;
  }

  function shuffle(items) {
    const values = [...items];
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
  }

  function announce(message) {
    ui.announcer.textContent = "";
    requestAnimationFrame(() => { ui.announcer.textContent = message; });
  }

  function gradeData() { return DATA.grades[selectedGrade]; }

  function renderUnits() {
    const grade = gradeData();
    const progress = readProgress();
    ui.startGrade.textContent = textFor(grade.ja, grade.en);
    ui.startDescription.textContent = textFor(grade.descriptionJa, grade.descriptionEn);
    ui.gradeNav.querySelectorAll("[data-grade]").forEach(button => button.classList.toggle("active", button.dataset.grade === selectedGrade));
    ui.unitGrid.replaceChildren();
    grade.units.forEach((unit, index) => {
      const saved = progress[unit.id] || {};
      const card = document.createElement("button");
      card.type = "button";
      card.className = `unit-card${saved.perfect ? " perfect" : ""}`;
      card.style.setProperty("--grade-color", GRADE_COLORS[selectedGrade]);
      card.innerHTML = `<span class="unit-number">${index + 1}</span><h2>${textFor(unit.ja, unit.en)}</h2><p>${textFor(unit.descJa, unit.descEn)}</p><footer><span>BEST ${saved.best || 0} / ${saved.total || readSettings().questionCount}</span><span class="perfect-mark">${saved.perfect ? "★ PERFECT" : saved.level === 2 ? "LEVEL 2" : "LEVEL 1"}</span></footer>`;
      card.addEventListener("click", () => startRound(unit));
      ui.unitGrid.append(card);
    });
  }

  function showScreen(name) {
    ui.start.hidden = name !== "start";
    ui.quiz.hidden = name !== "quiz";
    ui.result.hidden = name !== "result";
    if (name !== "quiz") stopAllVoice();
    updateControllerUi();
    if (controllerConnected || keyboardControllerMode) requestAnimationFrame(focusDefault);
  }

  function startRound(unit) {
    activeUnit = unit;
    const settings = readSettings();
    const saved = readProgress()[unit.id] || {};
    roundMode = saved.level === 2 ? 2 : 1;
    questions = Array.from({ length: settings.questionCount }, () => DATA.generate(unit, Math.random, settings.difficulty));
    current = 0;
    score = 0;
    successIndex = 0;
    mistakeIndex = 0;
    ui.gradeBadge.textContent = gradeData().ja;
    ui.gradeBadge.style.background = GRADE_COLORS[selectedGrade];
    showScreen("quiz");
    renderQuestion();
  }

  function currentQuestion() { return questions[current]; }

  const ENGLISH_NUMBERS = {
    zero: 0, oh: 0, one: 1, won: 1, two: 2, to: 2, too: 2, three: 3, four: 4, for: 4, five: 5, six: 6, seven: 7, eight: 8, ate: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90
  };
  const JAPANESE_NUMBERS = { ゼロ: 0, れい: 0, 零: 0, いち: 1, 一: 1, に: 2, 二: 2, さん: 3, 三: 3, よん: 4, し: 4, 四: 4, ご: 5, 五: 5, ろく: 6, 六: 6, なな: 7, しち: 7, 七: 7, はち: 8, 八: 8, きゅう: 9, く: 9, 九: 9, じゅう: 10, 十: 10, ひゃく: 100, 百: 100, せん: 1000, 千: 1000 };

  function englishWordsToNumber(value) {
    const cleaned = value.toLowerCase().replace(/-/g, " ").replace(/\band\b/g, " ").trim();
    if (!cleaned || !/^[a-z\s]+$/.test(cleaned)) return null;
    const tokens = cleaned.split(/\s+/);
    let total = 0, currentValue = 0, used = false;
    for (const token of tokens) {
      if (token in ENGLISH_NUMBERS) { currentValue += ENGLISH_NUMBERS[token]; used = true; }
      else if (token === "hundred") { currentValue = Math.max(1, currentValue) * 100; used = true; }
      else if (token === "thousand") { total += Math.max(1, currentValue) * 1000; currentValue = 0; used = true; }
      else if (["point", "dot"].includes(token)) return null;
      else return null;
    }
    return used ? total + currentValue : null;
  }

  function japaneseWordsToNumber(value) {
    const cleaned = value.replace(/[\s、。]/g, "");
    if (cleaned in JAPANESE_NUMBERS) return JAPANESE_NUMBERS[cleaned];
    const chars = [...cleaned];
    let total = 0, currentValue = 0, used = false;
    for (const char of chars) {
      if (!(char in JAPANESE_NUMBERS)) return null;
      const number = JAPANESE_NUMBERS[char];
      used = true;
      if (number === 10 || number === 100 || number === 1000) {
        currentValue = Math.max(1, currentValue) * number;
        if (number >= 100) { total += currentValue; currentValue = 0; }
      } else currentValue += number;
    }
    return used ? total + currentValue : null;
  }

  function spokenFraction(value) {
    const cleaned = value.toLowerCase().trim().replace(/-/g, " ");
    const common = { "a half": "1/2", half: "1/2", "one half": "1/2", "one third": "1/3", "two thirds": "2/3", "one quarter": "1/4", "one fourth": "1/4", "three quarters": "3/4", "three fourths": "3/4" };
    if (common[cleaned]) return common[cleaned];
    const over = cleaned.match(/^(.+?)\s+(?:over|divided by)\s+(.+)$/);
    if (over) {
      const numerator = englishWordsToNumber(over[1]) ?? Number(over[1]);
      const denominator = englishWordsToNumber(over[2]) ?? Number(over[2]);
      if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator) return DATA.fraction(numerator, denominator);
    }
    return null;
  }

  function canonicalAnswer(value) {
    let cleaned = String(value ?? "").normalize("NFKC").trim().toLowerCase();
    cleaned = cleaned.replace(/[￥¥$,]/g, "").replace(/(?:cm|km|m|円|平方|立方|degrees?|度)/g, "").trim();
    const spoken = spokenFraction(cleaned);
    if (spoken) return spoken;
    const englishNumber = englishWordsToNumber(cleaned);
    if (englishNumber !== null) return String(englishNumber);
    const japaneseNumber = japaneseWordsToNumber(cleaned);
    if (japaneseNumber !== null) return String(japaneseNumber);
    cleaned = cleaned.replace(/\s+/g, "").replace(/÷/g, "/").replace(/[。.!?]+$/g, "");
    const fractionMatch = cleaned.match(/^(-?\d+)\/(\d+)$/);
    if (fractionMatch && Number(fractionMatch[2])) return DATA.fraction(Number(fractionMatch[1]), Number(fractionMatch[2]));
    const number = Number(cleaned);
    return Number.isFinite(number) ? DATA.whole(number) : cleaned;
  }

  function answersMatch(value, expected) {
    const first = canonicalAnswer(value), second = canonicalAnswer(expected);
    if (first === second) return true;
    const fractionValue = candidate => {
      const match = candidate.match(/^(-?\d+)\/(\d+)$/);
      return match ? Number(match[1]) / Number(match[2]) : Number(candidate);
    };
    const firstNumber = fractionValue(first), secondNumber = fractionValue(second);
    return Number.isFinite(firstNumber) && Number.isFinite(secondNumber) && Math.abs(firstNumber - secondNumber) < .0001;
  }

  function formatChoice(value) { return String(value); }

  function makeChoices(answer) {
    const canonical = canonicalAnswer(answer);
    const options = new Set([canonical]);
    const fractionMatch = canonical.match(/^(-?\d+)\/(\d+)$/);
    if (fractionMatch) {
      const numerator = Number(fractionMatch[1]), denominator = Number(fractionMatch[2]);
      [DATA.fraction(numerator + 1, denominator), DATA.fraction(Math.max(1, numerator - 1), denominator), DATA.fraction(numerator, denominator + 1), DATA.fraction(numerator + 2, denominator + 1)].forEach(value => options.add(value));
    } else {
      const value = Number(canonical);
      const decimal = canonical.includes(".");
      const step = decimal ? (canonical.split(".")[1]?.length > 1 ? .01 : .1) : Math.max(1, Math.round(Math.abs(value) * .1));
      [value + step, value - step, value + step * 2, value - step * 2, value + step * 3, value - step * 3]
        .filter(option => value < 0 || option >= 0)
        .map(DATA.whole)
        .forEach(option => options.add(option));
    }
    const distractors = shuffle([...options].filter(value => value !== canonical && value !== "" && value !== "NaN")).slice(0, 3);
    return shuffle([canonical, ...distractors]);
  }

  function setMascotPose(pose) {
    const safe = POSES.includes(pose) ? pose : "idle";
    ui.mascot.className = `mascot-sprite mascot-${safe}`;
  }

  function stopMascotCycle() { clearTimeout(mascotTimer); mascotTimer = 0; }
  function startMascotCycle() {
    stopMascotCycle();
    if (answered || ui.quiz.hidden || readSettings().reduceMotion) return;
    const idle = ["idle", "wave", "think", "write", "sleepy"];
    let index = current % idle.length;
    const advance = () => {
      if (answered || ui.quiz.hidden) return;
      setMascotPose(idle[index++ % idle.length]);
      mascotTimer = setTimeout(advance, 2700);
    };
    advance();
  }

  function stopCatVoice() {
    catAudioGeneration += 1;
    if (activeCatAudio) {
      try { activeCatAudio.pause(); activeCatAudio.currentTime = 0; } catch { /* optional audio */ }
      activeCatAudio = null;
    }
    try { speechSynthesis?.cancel?.(); } catch { /* optional audio */ }
  }

  function systemCatVoice(message) {
    const settings = readSettings();
    if (dictationMuted || !settings.catVoice || settings.catVolume <= 0 || !window.SpeechSynthesisUtterance || !speechSynthesis?.speak) return false;
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "en-US";
    utterance.pitch = settings.catStyle === "kitten" ? 1.9 : settings.catStyle === "calm" ? 1.35 : 1.7;
    utterance.rate = settings.catStyle === "kitten" ? 1.12 : settings.catStyle === "calm" ? .9 : 1.02;
    utterance.volume = settings.catVolume;
    const voices = speechSynthesis.getVoices?.() || [];
    utterance.voice = voices.find(voice => /^en/i.test(voice.lang) && /samantha|victoria|zira|female/i.test(voice.name)) || voices.find(voice => /^en/i.test(voice.lang)) || null;
    speechSynthesis.speak(utterance);
    return true;
  }

  async function speakCat(message) {
    const settings = readSettings();
    if (dictationMuted || !settings.catVoice || settings.catVolume <= 0) { stopCatVoice(); return false; }
    stopCatVoice();
    const generation = catAudioGeneration;
    const source = AUDIO_BY_LINE.get(message);
    if (!source || !window.Audio) return systemCatVoice(message);
    const audio = new Audio(source);
    activeCatAudio = audio;
    audio.preload = "auto";
    audio.volume = settings.catVolume;
    audio.playbackRate = settings.catStyle === "kitten" ? 1.12 : settings.catStyle === "calm" ? .9 : 1;
    if ("preservesPitch" in audio) audio.preservesPitch = false;
    if ("webkitPreservesPitch" in audio) audio.webkitPreservesPitch = false;
    audio.addEventListener?.("ended", () => { if (activeCatAudio === audio) activeCatAudio = null; }, { once: true });
    await refreshControllerSpeaker();
    if (generation !== catAudioGeneration || dictationMuted) return false;
    if (controllerSpeakerId && typeof audio.setSinkId === "function") {
      try { await audio.setSinkId(controllerSpeakerId); controllerSpeakerReady = audio.sinkId === controllerSpeakerId; } catch { controllerSpeakerReady = false; }
    }
    if (generation !== catAudioGeneration || dictationMuted) return false;
    try { await audio.play(); return true; }
    catch {
      if (activeCatAudio === audio) activeCatAudio = null;
      return generation === catAudioGeneration && !dictationMuted ? systemCatVoice(message) : false;
    }
  }

  function setMascotSpeech(message, tone = "") {
    ui.mascotSpeech.textContent = message;
    ui.mascotSpeech.className = `mascot-speech${tone ? ` ${tone}` : ""}`;
    if (!dictationMuted && AUDIO_BY_LINE.has(message)) void speakCat(message);
  }

  function renderQuestion() {
    stopBrowserRecognition();
    dictationMuted = false;
    stopCatVoice();
    answered = false;
    const question = currentQuestion();
    const language = readSettings().language;
    ui.modeBadge.textContent = roundMode === 1 ? "Lv.1 えらぶ" : "Lv.2 はなす・かく";
    ui.count.textContent = `${current + 1} / ${questions.length}`;
    ui.score.textContent = score;
    ui.progress.style.width = `${(current + 1) / questions.length * 100}%`;
    ui.topic.textContent = textFor(activeUnit.ja, activeUnit.en);
    const word = language === "japanese" ? question.wordJa : language === "english" ? question.wordEn : question.wordJa && question.wordEn ? `${question.wordJa}\n${question.wordEn}` : question.wordJa || question.wordEn;
    ui.wordProblem.hidden = !word;
    ui.wordProblem.textContent = word;
    ui.wordProblem.style.whiteSpace = "pre-line";
    ui.prompt.textContent = question.prompt;
    ui.instruction.textContent = roundMode === 1 ? textFor("こたえを えらぼう", "CHOOSE THE ANSWER") : textFor("こたえを はなすか かこう", "SAY OR TYPE THE ANSWER");
    ui.feedback.hidden = true;
    ui.feedback.classList.remove("wrong");
    ui.next.hidden = true;
    ui.choices.hidden = roundMode !== 1;
    ui.answerForm.hidden = roundMode !== 2;
    ui.choices.replaceChildren();
    ui.answerInput.value = "";
    ui.answerInput.disabled = false;
    ui.answerInput.className = "";
    ui.check.disabled = false;
    ui.voice.disabled = false;
    setVoiceButton(false);
    ui.micStatus.textContent = roundMode === 2 ? "L3か 🎙 をおして、こたえを はなしてね" : "ねこが さんすうを おうえんするよ";
    if (roundMode === 1) {
      makeChoices(question.answer).forEach((choice, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-button";
        button.dataset.answer = choice;
        button.textContent = `${index + 1}. ${formatChoice(choice)}`;
        button.addEventListener("click", () => chooseAnswer(button, choice));
        ui.choices.append(button);
      });
    } else requestAnimationFrame(() => controllerConnected || keyboardControllerMode ? focusDefault() : ui.answerInput.focus());
    setMascotSpeech(QUESTION_LINES[current % QUESTION_LINES.length]);
    startMascotCycle();
    updateControllerUi();
  }

  function reaction(correct) {
    stopMascotCycle();
    if (correct) {
      const perfectLast = current === questions.length - 1 && score === questions.length;
      const line = perfectLast ? SUCCESS_LINES.at(-1) : SUCCESS_LINES[successIndex++ % SUCCESS_LINES.length];
      setMascotPose(perfectLast ? "perfect" : ["cheer", "clap", "bounce"][successIndex % 3]);
      setMascotSpeech(line, "success");
    } else {
      const line = MISTAKE_LINES[mistakeIndex++ % MISTAKE_LINES.length];
      setMascotPose(mistakeIndex % 2 ? "surprise" : "think");
      setMascotSpeech(line, "error");
    }
  }

  function finishAnswer(correct, selectedButton = null) {
    if (answered) return;
    answered = true;
    stopBrowserRecognition();
    dictationMuted = false;
    setVoiceButton(false);
    if (correct) score += 1;
    ui.score.textContent = score;
    if (roundMode === 1) {
      [...ui.choices.children].forEach(button => {
        button.disabled = true;
        if (answersMatch(button.dataset.answer, currentQuestion().answer)) button.classList.add("correct");
      });
      if (!correct && selectedButton) selectedButton.classList.add("wrong");
    } else {
      ui.answerInput.disabled = true;
      ui.check.disabled = true;
      ui.voice.disabled = true;
      ui.answerInput.classList.add(correct ? "correct" : "wrong");
    }
    reaction(correct);
    ui.feedback.hidden = false;
    ui.feedback.classList.toggle("wrong", !correct);
    ui.feedbackIcon.textContent = correct ? "○" : "△";
    ui.feedbackTitle.textContent = correct ? "せいかい！ / CORRECT!" : "ONE MORE TIME!";
    const question = currentQuestion();
    ui.feedbackCopy.textContent = `${textFor(question.explanationJa, question.explanationEn)}  Answer: ${question.answer}`;
    ui.next.textContent = current === questions.length - 1 ? "けっかを みる →" : "つぎの もんだい →";
    ui.next.hidden = false;
    updateControllerUi();
    ui.next.focus();
  }

  function chooseAnswer(button, value) { finishAnswer(answersMatch(value, currentQuestion().answer), button); }
  function submitWrittenAnswer() {
    if (answered) return;
    const value = ui.answerInput.value.trim();
    if (!value) { ui.answerInput.focus(); ui.answerInput.animate?.([{ transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "none" }], { duration: 220 }); return; }
    finishAnswer(answersMatch(value, currentQuestion().answer));
  }

  function nextQuestion() {
    if (!answered) return;
    current += 1;
    if (current >= questions.length) showResult();
    else renderQuestion();
  }

  function showResult() {
    const saved = saveUnitProgress(activeUnit.id, score);
    const perfect = score === questions.length;
    ui.resultBadge.textContent = perfect ? "★" : score >= questions.length * .7 ? "✓" : "+";
    ui.resultTitle.textContent = perfect ? "PERFECT!" : score >= questions.length * .7 ? "よく できました！" : "ONE MORE TIME!";
    ui.finalScore.textContent = score;
    ui.finalScore.nextElementSibling.textContent = `/ ${questions.length}`;
    ui.resultMessage.textContent = perfect && roundMode === 1 ? "つぎは こたえを はなすか かく レベルだよ！" : perfect ? "さんすうマスター！" : "まちがえた もんだいを もういちど やってみよう。";
    ui.best.textContent = `BEST ${saved.best} / ${saved.total}${saved.perfect ? " · ★ PERFECT" : ""}`;
    showScreen("result");
  }

  function returnToUnits() { renderUnits(); showScreen("start"); }

  function buildNumberPad() {
    ["7", "8", "9", "⌫", "4", "5", "6", "/", "1", "2", "3", ".", "0", "−", "CLEAR", "ANSWER"].forEach(value => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `number-key${value === "CLEAR" || value === "ANSWER" ? " wide" : ""}${value === "ANSWER" ? " answer" : ""}`;
      button.textContent = value;
      button.dataset.key = value;
      button.addEventListener("click", () => useNumberKey(value));
      ui.numberPad.append(button);
    });
  }

  function useNumberKey(key) {
    if (answered || roundMode !== 2) return;
    if (key === "ANSWER") return submitWrittenAnswer();
    if (key === "CLEAR") ui.answerInput.value = "";
    else if (key === "⌫") ui.answerInput.value = ui.answerInput.value.slice(0, -1);
    else ui.answerInput.value += key === "−" ? "-" : key;
    ui.answerInput.focus({ preventScroll: true });
  }

  function setVoiceButton(active, connecting = false) {
    ui.voice.classList.toggle("active", active);
    ui.voice.textContent = active ? connecting ? "✕ とめる" : "■ とめる" : "🎙 はなす";
  }

  function stopTracks(stream = activeMicStream) {
    window.ManabiMicrophone?.close(stream);
    ui.micLevel.hidden = true;
    if (stream === activeMicStream) activeMicStream = null;
  }
  function stopBrowserRecognition() {
    const recognition = activeRecognition;
    activeRecognition = null;
    try { recognition?.abort?.(); } catch { /* already ended */ }
    stopTracks();
  }
  function stopAllVoice() {
    dictationAttempt += 1;
    stopBrowserRecognition();
    dictationMuted = false;
    setVoiceButton(false);
    stopCatVoice();
  }

  function rememberControllerSpeaker(devices = [], controllerMic = null) {
    const outputs = devices.filter(device => device.kind === "audiooutput");
    const speaker = outputs.find(device => controllerSpeakerId && device.deviceId === controllerSpeakerId)
      || outputs.find(device => controllerMic?.groupId && device.groupId === controllerMic.groupId)
      || outputs.find(device => /dualsense|wireless controller|ps5|controller/i.test(device.label));
    if (speaker?.deviceId) {
      if (controllerSpeakerId !== speaker.deviceId) controllerSpeakerReady = false;
      controllerSpeakerId = speaker.deviceId;
      controllerSpeakerLabel = speaker.label || "Wireless Controller";
    } else {
      controllerSpeakerId = "";
      controllerSpeakerLabel = "";
      controllerSpeakerReady = false;
    }
    return speaker || null;
  }

  async function refreshControllerSpeaker() {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices?.() || [];
      return rememberControllerSpeaker(devices);
    } catch {
      return null;
    }
  }

  async function preferredMicrophone() {
    const capture = await window.ManabiMicrophone.open({ gain: readSettings().micGain });
    rememberControllerSpeaker(capture.devices, capture.controllerMic);
    if (controllerSpeakerId && window.Audio) {
      const probe = new Audio();
      if (typeof probe.setSinkId === "function") {
        try { await probe.setSinkId(controllerSpeakerId); controllerSpeakerReady = probe.sinkId === controllerSpeakerId; } catch { controllerSpeakerReady = false; }
      }
    }
    return capture;
  }

  function useDictatedAnswer(result) {
    const alternatives = Array.from(result || []).map(candidate => candidate?.transcript || "");
    const answer = alternatives.find(value => answersMatch(value, currentQuestion().answer)) || alternatives[0] || "";
    if (!answer || answered) return;
    stopBrowserRecognition();
    setVoiceButton(false);
    dictationMuted = false;
    ui.answerInput.value = canonicalAnswer(answer);
    ui.micStatus.textContent = controllerSpeakerReady ? `こたえを きいたよ！ · PS5スピーカー: ${controllerSpeakerLabel}` : "こたえを きいたよ！";
    submitWrittenAnswer();
  }

  function beginRecognition(capture, microphoneLabel) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) throw new Error("Speech recognition unavailable");
    const recognition = new Recognition();
    activeRecognition = recognition;
    recognition.lang = readSettings().language === "japanese" ? "ja-JP" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    setVoiceButton(true);
    ui.micStatus.textContent = `こたえを きいているよ · ${microphoneLabel}`;
    recognition.onresult = event => { if (event.results?.[0]?.length) useDictatedAnswer(event.results[0]); };
    recognition.onerror = event => {
      if (activeRecognition !== recognition) return;
      stopBrowserRecognition(); dictationMuted = false; setVoiceButton(false);
      ui.micStatus.textContent = /not-allowed/.test(event.error) ? "Chromeのマイク許可を たしかめてね" : "もういちど はなしてね";
      setMascotPose("surprise");
    };
    recognition.onend = () => {
      if (activeRecognition !== recognition) return;
      activeRecognition = null; stopTracks(); dictationMuted = false; setVoiceButton(false);
      if (!answered && !ui.answerInput.value) ui.micStatus.textContent = "L3か 🎙 をおして、もういちど はなしてね";
    };
    try { recognition.start(capture.track); }
    catch { recognition.start(); ui.micStatus.textContent = "Chromeの通常マイクで きいているよ"; }
    const hasMeter = window.ManabiMicrophone.watchLevel(capture.stream, (level, muted) => {
      ui.micLevel.textContent = muted ? "🔇 マイクがミュート中" : `🎙 ${"▰".repeat(Math.max(0, Math.min(5, Math.ceil(level * 5))))}${"▱".repeat(Math.max(0, 5 - Math.ceil(level * 5)))}`;
    });
    ui.micLevel.hidden = !hasMeter;
    setMascotPose("think");
  }

  async function startVoiceAnswer() {
    if (activeRecognition || dictationMuted) {
      dictationAttempt += 1; stopBrowserRecognition(); dictationMuted = false; setVoiceButton(false); ui.micStatus.textContent = "マイクを とめました"; return;
    }
    if (answered || roundMode !== 2 || ui.quiz.hidden) { ui.micStatus.textContent = "Lv.2の もんだいで つかえるよ"; return; }
    if (!navigator.mediaDevices?.getUserMedia) { ui.micStatus.textContent = "このブラウザーでは マイクが つかえません"; return; }
    const attempt = ++dictationAttempt;
    dictationMuted = true;
    stopCatVoice();
    setVoiceButton(true, true);
    ui.micStatus.textContent = "マイクを じゅんびしているよ…";
    try {
      const capture = await preferredMicrophone();
      const { stream, controllerMic } = capture;
      if (attempt !== dictationAttempt) { stopTracks(stream); return; }
      activeMicStream = stream;
      const label = controllerMic ? `PS5マイク: ${controllerMic.label || "Wireless Controller"}` : `マイク: ${stream.getAudioTracks()[0]?.label || "default"}`;
      beginRecognition(capture, label);
    } catch (error) {
      if (attempt !== dictationAttempt) return;
      stopBrowserRecognition(); dictationMuted = false; setVoiceButton(false);
      ui.micStatus.textContent = error?.name === "NotFoundError" ? "マイクが みつかりません" : "Chromeのマイクを きょかしてね";
    }
  }

  function activeDialog() { return document.querySelector("dialog[open]"); }
  function openDialog(dialog, trigger) { if (!dialog || dialog.open) return; lastDialogTrigger = trigger || document.activeElement; dialog.showModal(); requestAnimationFrame(() => focusElement(dialog.querySelector("button,select,input"))); updateControllerUi(); }
  function closeDialog(dialog = activeDialog()) { if (dialog?.open) dialog.close(); }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  function updateFullscreen() { ui.fullscreen.firstChild.textContent = document.fullscreenElement ? "↙ " : "⛶ "; }

  function resetProgress() {
    if (!resetArmed) {
      resetArmed = true; ui.reset.textContent = "もういちど おして けす"; ui.resetStatus.textContent = "もういちど おすと きろくが きえます。";
      clearTimeout(resetTimer); resetTimer = setTimeout(() => { resetArmed = false; ui.reset.textContent = "きろくを けす"; ui.resetStatus.textContent = ""; }, 5000); return;
    }
    localStorage.removeItem(PROGRESS_KEY); resetArmed = false; clearTimeout(resetTimer); ui.reset.textContent = "きろくを けす"; ui.resetStatus.textContent = "きろくを けしました。"; renderUnits();
  }

  function visibleControls() {
    const scope = activeDialog() || document;
    return [...scope.querySelectorAll("button:not([disabled]),input:not([disabled]),select:not([disabled])")].filter(element => !element.hidden && getComputedStyle(element).display !== "none" && element.getClientRects().length);
  }
  function focusElement(element) { if (!element) return; element.focus({ preventScroll: true }); element.scrollIntoView({ block: "nearest", inline: "nearest" }); }
  function focusDefault() {
    let target;
    if (activeDialog()) target = activeDialog().querySelector("button,select,input");
    else if (!ui.quiz.hidden) target = answered ? ui.next : roundMode === 1 ? ui.choices.querySelector("button") : ui.numberPad.querySelector("button");
    else if (!ui.result.hidden) target = ui.retry;
    else target = ui.unitGrid.querySelector("button");
    focusElement(target);
  }
  function moveFocus(dx, dy) {
    const controls = visibleControls();
    const currentElement = controls.includes(document.activeElement) ? document.activeElement : null;
    if (!currentElement) return focusDefault();
    const box = currentElement.getBoundingClientRect(), cx = box.left + box.width / 2, cy = box.top + box.height / 2;
    const candidates = controls.filter(element => element !== currentElement).map(element => {
      const rect = element.getBoundingClientRect(), x = rect.left + rect.width / 2 - cx, y = rect.top + rect.height / 2 - cy;
      const forward = x * dx + y * dy, sideways = Math.abs(x * dy - y * dx);
      return { element, forward, score: forward + sideways * 2.1 };
    }).filter(item => item.forward > 4).sort((a, b) => a.score - b.score);
    if (candidates[0]) focusElement(candidates[0].element);
  }
  function activateFocused() {
    if (!ui.quiz.hidden && answered) return ui.next.click();
    const element = document.activeElement;
    if (element instanceof HTMLButtonElement && !element.disabled) element.click();
    else if (element instanceof HTMLInputElement && element.type === "checkbox") element.click();
    else focusDefault();
  }
  function controllerBack() { if (activeDialog()) closeDialog(); else if (!ui.quiz.hidden || !ui.result.hidden) returnToUnits(); }
  function handleControllerButton(index) {
    const directions = { 12: [0, -1], 13: [0, 1], 14: [-1, 0], 15: [1, 0] };
    if (directions[index]) return moveFocus(...directions[index]);
    if (index === 10) return startVoiceAnswer();
    if (index === 0) return activateFocused();
    if (index === 1) return controllerBack();
    if (index === 2 && !ui.quiz.hidden && roundMode === 2 && !answered) return useNumberKey("⌫");
    if (index === 9 && !ui.quiz.hidden && roundMode === 2 && !answered) return submitWrittenAnswer();
    if (!ui.quiz.hidden && roundMode === 1 && !answered && index >= 4 && index <= 7) ui.choices.children[index - 4]?.click();
  }
  function connectedPad() { try { return [...(navigator.getGamepads?.() || [])].find(Boolean) || null; } catch { return null; } }
  function buttonPressed(pad, index) {
    const rawPlayStation = pad?.mapping !== "standard" && /dualsense|playstation|wireless controller|054c/i.test(pad?.id || "");
    const physicalIndex = rawPlayStation ? ({ 0: 1, 1: 2, 2: 0 })[index] ?? index : index;
    const button = pad?.buttons?.[physicalIndex];
    return Boolean(button && (button.pressed || button.value > .55));
  }
  function pollController(time) {
    const pad = connectedPad();
    if (Boolean(pad) !== controllerConnected) {
      controllerConnected = Boolean(pad); controllerStates.clear();
      if (pad) controllerLabel = /dualsense|playstation|wireless controller|054c/i.test(pad.id || "") ? "PS5 コントローラー" : "コントローラー";
      updateControllerUi();
      if (pad) {
        void refreshControllerSpeaker();
        requestAnimationFrame(focusDefault);
      }
    }
    if (pad) {
      const axes = pad.axes || [];
      const hat = Number(axes[9]);
      const directions = {
        12: buttonPressed(pad, 12) || axes[1] < -.65 || (Number.isFinite(hat) && ((hat >= -1 && hat < -.7) || hat >= .95)),
        13: buttonPressed(pad, 13) || axes[1] > .65 || (Number.isFinite(hat) && hat >= -.2 && hat < .45),
        14: buttonPressed(pad, 14) || axes[0] < -.65 || (Number.isFinite(hat) && hat >= .4 && hat <= 1),
        15: buttonPressed(pad, 15) || axes[0] > .65 || (Number.isFinite(hat) && hat >= -.75 && hat < -.1)
      };
      [0, 1, 2, 4, 5, 6, 7, 9, 10, 12, 13, 14, 15].forEach(index => {
        const down = index in directions ? directions[index] : buttonPressed(pad, index);
        const state = controllerStates.get(index) || { down: false, repeatAt: 0 };
        const repeat = index >= 12;
        const interval = 125 / readSettings().controllerSensitivity;
        if (down && !state.down) { state.down = true; state.repeatAt = time + 280; handleControllerButton(index); }
        else if (down && repeat && time >= state.repeatAt) { state.repeatAt = time + interval; handleControllerButton(index); }
        else if (!down) state.down = false;
        controllerStates.set(index, state);
      });
    }
    requestAnimationFrame(pollController);
  }
  function updateControllerUi() {
    const active = controllerConnected || keyboardControllerMode;
    document.body.classList.toggle("gamepad-active", active);
    ui.controllerNotice.hidden = !active;
    ui.controllerName.textContent = `🎮 ${controllerLabel}`;
    ui.controllerHelp.textContent = !ui.quiz.hidden && roundMode === 2 ? "方向キー：数字 · ✕：入力 · □：けす · OPTIONS：こたえる · L3：マイク" : "方向キー：いどう · ✕：えらぶ · ○：もどる · L3：マイク";
  }

  ui.gradeNav.addEventListener("click", event => { const button = event.target.closest("[data-grade]"); if (button) { selectedGrade = button.dataset.grade; renderUnits(); } });
  ui.home.addEventListener("click", returnToUnits);
  ui.back.addEventListener("click", returnToUnits);
  ui.next.addEventListener("click", nextQuestion);
  ui.retry.addEventListener("click", () => startRound(activeUnit));
  ui.units.addEventListener("click", returnToUnits);
  ui.answerForm.addEventListener("submit", event => { event.preventDefault(); submitWrittenAnswer(); });
  ui.voice.addEventListener("click", startVoiceAnswer);
  ui.help.addEventListener("click", () => openDialog(ui.helpDialog, ui.help));
  ui.settings.addEventListener("click", () => openDialog(ui.settingsDialog, ui.settings));
  ui.privacy.addEventListener("click", () => openDialog(ui.privacyDialog, ui.privacy));
  ui.fullscreen.addEventListener("click", toggleFullscreen);
  ui.reset.addEventListener("click", resetProgress);
  [ui.language, ui.difficulty, ui.questionCount, ui.controllerSensitivity, ui.micGain, ui.catVoice, ui.catVolume, ui.catStyle, ui.largeText, ui.contrast, ui.reduceMotion].forEach(control => control.addEventListener("change", saveSettings));
  ui.controllerSensitivity.addEventListener("input", () => { ui.controllerSensitivityValue.textContent = `${ui.controllerSensitivity.value}%`; });
  ui.micGain.addEventListener("input", () => { ui.micGainValue.textContent = `${ui.micGain.value}%`; });
  ui.catVolume.addEventListener("input", () => { ui.catVolumeValue.textContent = `${ui.catVolume.value}%`; if (activeCatAudio) activeCatAudio.volume = Number(ui.catVolume.value) / 100; });
  ui.testVoice.addEventListener("click", () => { void speakCat("Nice!"); });
  document.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => closeDialog(button.closest("dialog"))));
  [ui.helpDialog, ui.settingsDialog, ui.privacyDialog].forEach(dialog => dialog.addEventListener("close", () => { updateControllerUi(); const target = lastDialogTrigger; lastDialogTrigger = null; requestAnimationFrame(() => focusElement(target)); }));
  document.addEventListener("fullscreenchange", updateFullscreen);
  window.addEventListener("pagehide", stopAllVoice);
  document.addEventListener("keydown", event => {
    const directions = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    if (!controllerConnected && directions[event.key] && document.activeElement !== ui.answerInput) {
      event.preventDefault(); keyboardControllerMode = true; controllerLabel = "キーボード / CONTROLLER"; updateControllerUi(); moveFocus(...directions[event.key]); return;
    }
    if (!ui.quiz.hidden && roundMode === 1 && !answered && /^[1-4]$/.test(event.key)) ui.choices.children[Number(event.key) - 1]?.click();
    else if (!ui.quiz.hidden && answered && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); nextQuestion(); }
  });

  buildNumberPad();
  applySettings();
  renderUnits();
  showScreen("start");
  updateFullscreen();
  void refreshControllerSpeaker();
  navigator.mediaDevices?.addEventListener?.("devicechange", refreshControllerSpeaker);
  requestAnimationFrame(pollController);

  window.__mathCup = {
    start: (grade, unitIndex = 0, mode = null) => { selectedGrade = String(grade); renderUnits(); startRound(DATA.grades[selectedGrade].units[unitIndex]); if (mode) { roundMode = mode; renderQuestion(); } },
    answer: value => { if (roundMode === 1) { const button = [...ui.choices.children].find(item => answersMatch(item.dataset.answer, value)); if (button) chooseAnswer(button, value); else finishAnswer(false); } else { ui.answerInput.value = String(value); submitWrittenAnswer(); } },
    current: () => ({ ...currentQuestion(), grade: selectedGrade, mode: roundMode, answered, score }),
    canonical: canonicalAnswer,
    matches: answersMatch,
    voice: () => ({ listening: Boolean(activeRecognition), muted: dictationMuted }),
    press: handleControllerButton,
    settings: readSettings,
    speaker: () => ({ id: controllerSpeakerId, label: controllerSpeakerLabel, ready: controllerSpeakerReady })
  };
})();
