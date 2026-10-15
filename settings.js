(() => {
  "use strict";

  const storageKey = "fizz-dog-settings-v1";
  const words = {
    en: { gameCount: "0 games", emptyTitle: "No games here right now", emptyDescription: "Shitaky Games is empty for now.", settings: "Settings", settingsIntro: "Choose how Shitaky Games looks and controls. Your choices are saved on this device.", language: "Language", automatic: "Automatic", device: "Controls / device", keyboard: "Keyboard", touch: "Touch screen", controller: "Controller", largeText: "Larger text", highContrast: "High contrast", reduceMotion: "Reduce motion", fullscreen: "Full screen", exitFullscreen: "Exit full screen", resetSettings: "Reset settings", settingsScope: "These settings change Shitaky Games.", closeSettings: "Close settings", deviceAutoKeyboard: "Using keyboard", deviceAutoTouch: "Using touch screen", deviceControllerReady: "Controller connected", deviceControllerMissing: "Connect a controller to use it here", deviceKeyboard: "Keyboard selected", deviceTouch: "Touch screen selected" },
    ja: { gameCount: "ゲーム 0 件", emptyTitle: "現在ゲームはありません", emptyDescription: "Shitaky Gamesは今のところ空です。", settings: "設定", settingsIntro: "Shitaky Gamesの表示と操作を選べます。設定はこの端末に保存されます。", language: "言語", automatic: "自動", device: "操作方法 / 端末", keyboard: "キーボード", touch: "タッチ画面", controller: "コントローラー", largeText: "文字を大きく", highContrast: "高コントラスト", reduceMotion: "動きを減らす", fullscreen: "全画面表示", exitFullscreen: "全画面を終了", resetSettings: "設定をリセット", settingsScope: "この設定はShitaky Gamesに適用されます。", closeSettings: "設定を閉じる", deviceAutoKeyboard: "キーボードを使用中", deviceAutoTouch: "タッチ画面を使用中", deviceControllerReady: "コントローラー接続中", deviceControllerMissing: "コントローラーを接続してください", deviceKeyboard: "キーボードを選択中", deviceTouch: "タッチ画面を選択中" },
    es: { gameCount: "0 juegos", emptyTitle: "Ahora no hay juegos", emptyDescription: "Shitaky Games está vacío por ahora.", settings: "Ajustes", settingsIntro: "Elige cómo se ve y se controla Shitaky Games. Tus opciones se guardan en este dispositivo.", language: "Idioma", automatic: "Automático", device: "Controles / dispositivo", keyboard: "Teclado", touch: "Pantalla táctil", controller: "Mando", largeText: "Texto más grande", highContrast: "Alto contraste", reduceMotion: "Reducir movimiento", fullscreen: "Pantalla completa", exitFullscreen: "Salir de pantalla completa", resetSettings: "Restablecer ajustes", settingsScope: "Estos ajustes cambian Shitaky Games.", closeSettings: "Cerrar ajustes", deviceAutoKeyboard: "Usando teclado", deviceAutoTouch: "Usando pantalla táctil", deviceControllerReady: "Mando conectado", deviceControllerMissing: "Conecta un mando para usarlo aquí", deviceKeyboard: "Teclado seleccionado", deviceTouch: "Pantalla táctil seleccionada" },
    fr: { gameCount: "0 jeu", emptyTitle: "Aucun jeu pour le moment", emptyDescription: "Shitaky Games est vide pour le moment.", settings: "Réglages", settingsIntro: "Choisissez l'apparence et les commandes de Shitaky Games. Vos choix sont enregistrés sur cet appareil.", language: "Langue", automatic: "Automatique", device: "Commandes / appareil", keyboard: "Clavier", touch: "Écran tactile", controller: "Manette", largeText: "Texte agrandi", highContrast: "Contraste élevé", reduceMotion: "Réduire les animations", fullscreen: "Plein écran", exitFullscreen: "Quitter le plein écran", resetSettings: "Réinitialiser", settingsScope: "Ces réglages modifient Shitaky Games.", closeSettings: "Fermer les réglages", deviceAutoKeyboard: "Clavier utilisé", deviceAutoTouch: "Écran tactile utilisé", deviceControllerReady: "Manette connectée", deviceControllerMissing: "Connectez une manette pour l'utiliser ici", deviceKeyboard: "Clavier sélectionné", deviceTouch: "Écran tactile sélectionné" },
    de: { gameCount: "0 Spiele", emptyTitle: "Zurzeit sind keine Spiele hier", emptyDescription: "Shitaky Games ist momentan leer.", settings: "Einstellungen", settingsIntro: "Wähle Darstellung und Steuerung von Shitaky Games. Deine Auswahl wird auf diesem Gerät gespeichert.", language: "Sprache", automatic: "Automatisch", device: "Steuerung / Gerät", keyboard: "Tastatur", touch: "Touchscreen", controller: "Controller", largeText: "Größerer Text", highContrast: "Hoher Kontrast", reduceMotion: "Weniger Bewegung", fullscreen: "Vollbild", exitFullscreen: "Vollbild verlassen", resetSettings: "Zurücksetzen", settingsScope: "Diese Einstellungen ändern Shitaky Games.", closeSettings: "Einstellungen schließen", deviceAutoKeyboard: "Tastatur wird verwendet", deviceAutoTouch: "Touchscreen wird verwendet", deviceControllerReady: "Controller verbunden", deviceControllerMissing: "Verbinde einen Controller, um ihn hier zu nutzen", deviceKeyboard: "Tastatur ausgewählt", deviceTouch: "Touchscreen ausgewählt" },
    pt: { gameCount: "0 jogos", emptyTitle: "Nenhum jogo por enquanto", emptyDescription: "Shitaky Games está vazio por enquanto.", settings: "Configurações", settingsIntro: "Escolha a aparência e os controles do Shitaky Games. Suas escolhas ficam salvas neste dispositivo.", language: "Idioma", automatic: "Automático", device: "Controles / dispositivo", keyboard: "Teclado", touch: "Tela sensível ao toque", controller: "Controle", largeText: "Texto maior", highContrast: "Alto contraste", reduceMotion: "Reduzir movimento", fullscreen: "Tela cheia", exitFullscreen: "Sair da tela cheia", resetSettings: "Redefinir configurações", settingsScope: "Estas configurações mudam o Shitaky Games.", closeSettings: "Fechar configurações", deviceAutoKeyboard: "Usando teclado", deviceAutoTouch: "Usando tela sensível ao toque", deviceControllerReady: "Controle conectado", deviceControllerMissing: "Conecte um controle para usá-lo aqui", deviceKeyboard: "Teclado selecionado", deviceTouch: "Tela sensível ao toque selecionada" }
  };
  const defaults = { language: "auto", device: "auto", largeText: false, highContrast: false, reduceMotion: false };
  let settings = { ...defaults };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (saved && typeof saved === "object") {
      if (saved.language === "auto" || words[saved.language]) settings.language = saved.language;
      if (["auto", "keyboard", "touch", "controller"].includes(saved.device)) settings.device = saved.device;
      for (const key of ["largeText", "highContrast", "reduceMotion"]) settings[key] = saved[key] === true;
    }
  } catch { /* Storage is optional. */ }

  const dialog = document.querySelector("#settings-dialog");
  const trigger = document.querySelector("#settings-trigger");
  const language = document.querySelector("#settings-language");
  const device = document.querySelector("#settings-device");
  const fullscreen = document.querySelector("#settings-fullscreen");
  const status = document.querySelector("#settings-device-status");
  const checks = { largeText: document.querySelector("#settings-large-text"), highContrast: document.querySelector("#settings-high-contrast"), reduceMotion: document.querySelector("#settings-reduce-motion") };
  const activeLanguage = () => settings.language !== "auto" ? settings.language : (navigator.languages || [navigator.language || "en"]).map(value => value.toLowerCase().split("-")[0]).find(code => words[code]) || "en";
  const t = key => words[activeLanguage()][key] || words.en[key] || key;
  const controllerConnected = () => { try { return Array.from(navigator.getGamepads?.() || []).some(Boolean); } catch { return false; } };
  function refreshStatus() {
    const connected = controllerConnected();
    const key = settings.device === "controller" ? connected ? "deviceControllerReady" : "deviceControllerMissing"
      : settings.device === "touch" ? "deviceTouch" : settings.device === "keyboard" ? "deviceKeyboard"
      : connected ? "deviceControllerReady" : matchMedia("(pointer: coarse)").matches ? "deviceAutoTouch" : "deviceAutoKeyboard";
    status.textContent = t(key);
  }
  function apply() {
    document.documentElement.lang = activeLanguage();
    for (const key of Object.keys(checks)) {
      checks[key].checked = settings[key];
      document.body.classList.toggle(key.replace(/[A-Z]/g, letter => "-" + letter.toLowerCase()), settings[key]);
    }
    language.value = settings.language;
    device.value = settings.device;
    document.body.dataset.inputMode = settings.device;
    for (const node of document.querySelectorAll("[data-i18n]")) node.textContent = t(node.dataset.i18n);
    for (const node of document.querySelectorAll("[data-i18n-aria]")) node.setAttribute("aria-label", t(node.dataset.i18nAria));
    document.title = "Shitaky Games";
    fullscreen.textContent = t(document.fullscreenElement ? "exitFullscreen" : "fullscreen");
    refreshStatus();
  }
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* Storage is optional. */ } apply(); }
  function open() { if (dialog.open) return; dialog.showModal(); language.focus(); refreshStatus(); }
  function close() { if (dialog.open) dialog.close(); }
  trigger.addEventListener("click", open);
  document.querySelector("#settings-close").addEventListener("click", close);
  dialog.addEventListener("click", event => { if (event.target === dialog) close(); });
  dialog.addEventListener("close", () => trigger.focus());
  language.addEventListener("change", () => { settings.language = language.value; save(); });
  device.addEventListener("change", () => { settings.device = device.value; save(); });
  for (const [key, input] of Object.entries(checks)) input.addEventListener("change", () => { settings[key] = input.checked; save(); });
  document.querySelector("#settings-reset").addEventListener("click", () => { settings = { ...defaults }; try { localStorage.removeItem(storageKey); } catch { /* Storage is optional. */ } apply(); });
  fullscreen.addEventListener("click", async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { /* Full screen is optional. */ } apply(); });
  document.addEventListener("fullscreenchange", apply);
  const pad = { options: false, confirm: false, cancel: false, direction: 0, lastMove: 0 };
  setInterval(() => {
    const gamepad = (() => { try { return Array.from(navigator.getGamepads?.() || []).find(Boolean); } catch { return null; } })();
    if (!gamepad) return;
    const pressed = index => Boolean(gamepad.buttons?.[index]?.pressed);
    const options = pressed(9);
    if (options && !pad.options) open();
    pad.options = options;
    if (!dialog.open) return;
    const controls = [...dialog.querySelectorAll("select, input, button")];
    const direction = Number(pressed(13) || (gamepad.axes?.[1] || 0) > .55) - Number(pressed(12) || (gamepad.axes?.[1] || 0) < -.55);
    if (direction && (direction !== pad.direction || performance.now() - pad.lastMove > 280)) {
      controls[(Math.max(0, controls.indexOf(document.activeElement)) + direction + controls.length) % controls.length].focus();
      pad.lastMove = performance.now();
    }
    pad.direction = direction;
    if (pressed(0) && !pad.confirm) document.activeElement?.click();
    if (pressed(1) && !pad.cancel) close();
    pad.confirm = pressed(0);
    pad.cancel = pressed(1);
  }, 70);
  apply();
})();
