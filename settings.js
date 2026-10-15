(() => {
  "use strict";

  const storageKey = "fizz-dog-settings-v1";
  const supported = ["en", "ja", "es", "fr", "de", "pt"];
  const words = {
    en: {
      gameCount: "10 games to play", settings: "Settings", requestChange: "Request a change", walkToGame: "WALK TO A GAME",
      keyboardHint: "A / D or ← → move · Space jump · Shift run", touchHint: "Use the buttons to move and jump", controllerHint: "Stick / D-pad move · ✕ jump · R2 run · □ play · Options settings",
      playChip: "PLAY →", playGame: "Play game", jump: "JUMP", run: "RUN", moveLeft: "Move left", moveRight: "Move right",
      canvasHelp: "Move Shitaky with A and D, arrow keys, touch buttons, or a controller stick or D-pad. Jump with Space, W, Up, or Cross. Run with Shift or R2. Press E or Square near a game cover to play it.",
      loadingArt: "Loading Shitaky…", artError: "Shitaky art could not load. Please refresh.",
      inkSubtitle: "Paper arena brawler", sketchSubtitle: "Hand-drawn platformer", exfilSubtitle: "3D DMZ survival", dmz2Subtitle: "Pixel extraction", deadSubtitle: "Survive the night", bravoSubtitle: "Grove survivor", cupSubtitle: "Grade 1–6 math game", devilSubtitle: "Trick platformer", flightSubtitle: "Pixel typing game",
      settingsIntro: "Choose how Shitaky Games looks and controls. Your choices are saved on this device.", language: "Language", automatic: "Automatic", device: "Controls / device", keyboard: "Keyboard", touch: "Touch screen", controller: "Controller", largeText: "Larger text", highContrast: "High contrast", reduceMotion: "Reduce motion", fullscreen: "Full screen", exitFullscreen: "Exit full screen", resetSettings: "Reset settings", settingsScope: "These settings change the Shitaky Games gallery. Each game may have its own controls and language options.", closeSettings: "Close settings", deviceAutoKeyboard: "Using keyboard controls", deviceAutoTouch: "Using touch controls", deviceControllerReady: "Controller connected", deviceControllerMissing: "Connect a controller to use it here", deviceKeyboard: "Keyboard controls selected", deviceTouch: "Touch buttons are shown",
      requestTitle: "Request a game change", closeRequest: "Close request form", whichGame: "Which game?", whatChange: "What should change?", requestExample: "Example: Make the jump in EXFIL ZERO feel more natural.", requestOfflineNote: "Send your idea. Codex starts when your Mac is connected, with an hourly backup when it is offline.", requestOnlineNote: "Codex is connected. New requests should start within a few seconds.", send: "Send", sending: "Sending your request…", sentOnline: "Sent. Codex should start within a few seconds.", sentOffline: "Saved. Codex will start when your Mac is online or on the next hourly run.", working: "Codex is working on your request.", completed: "Done: ", completedFallback: "Your change was finished.", blocked: "Codex needs help: ", blockedFallback: "This change could not be finished yet.", sendError: "Could not send your request. Your text is still here so you can try again."
    },
    ja: {
      gameCount: "10個のゲーム", settings: "設定", requestChange: "変更をリクエスト", walkToGame: "ゲームまで歩こう", keyboardHint: "A / D または ← → で移動 · Space でジャンプ", touchHint: "ボタンで移動とジャンプ", controllerHint: "スティック / 十字キーで移動 · ✕ ジャンプ · □ プレイ · Options 設定", playChip: "遊ぶ →", playGame: "遊ぶ", jump: "ジャンプ", run: "走る", moveLeft: "左へ移動", moveRight: "右へ移動", canvasHelp: "AとD、矢印キー、タッチボタン、またはコントローラーでシタキーを動かします。Space、W、上、または✕でジャンプ。ゲームの近くでEまたは□を押して遊びます。", loadingArt: "シタキーの絵を読み込み中…", artError: "シタキーの絵を読み込めません。再読み込みしてください。", inkSubtitle: "紙のアリーナ対戦", sketchSubtitle: "手描きのアクション", exfilSubtitle: "3Dサバイバル", dmz2Subtitle: "ドット絵の脱出ゲーム", deadSubtitle: "夜を生き延びよう", bravoSubtitle: "森のサバイバル", cupSubtitle: "小学1～6年の算数", devilSubtitle: "仕掛けだらけのアクション", flightSubtitle: "ドット絵タイピング", settingsIntro: "Shitaky Gamesの見た目と操作を選べます。この端末に保存されます。", language: "言語", automatic: "自動", device: "操作方法 / 端末", keyboard: "キーボード", touch: "タッチ画面", controller: "コントローラー", largeText: "文字を大きく", highContrast: "高コントラスト", reduceMotion: "動きを減らす", fullscreen: "全画面表示", exitFullscreen: "全画面を終了", resetSettings: "設定をリセット", settingsScope: "この設定はShitaky Gamesのギャラリーに適用されます。各ゲームには別の操作や言語設定がある場合があります。", closeSettings: "設定を閉じる", deviceAutoKeyboard: "キーボードで操作中", deviceAutoTouch: "タッチで操作中", deviceControllerReady: "コントローラー接続中", deviceControllerMissing: "コントローラーを接続してください", deviceKeyboard: "キーボード操作を選択中", deviceTouch: "タッチボタンを表示中", requestTitle: "ゲームの変更をリクエスト", closeRequest: "リクエストを閉じる", whichGame: "どのゲーム？", whatChange: "何を変えたいですか？", requestExample: "例：EXFIL ZEROのジャンプをもっと自然に。", requestOfflineNote: "アイデアを送信してください。MacがオンラインならCodexが開始し、オフライン時は毎時確認します。", requestOnlineNote: "Codexに接続中です。リクエストは数秒以内に開始されます。", send: "送信", sending: "送信中…", sentOnline: "送信しました。Codexが数秒以内に開始します。", sentOffline: "保存しました。Macがオンラインになるか、次の毎時確認で開始します。", working: "Codexが対応中です。", completed: "完了：", completedFallback: "変更が完了しました。", blocked: "Codexに確認が必要：", blockedFallback: "まだ完了できません。", sendError: "送信できませんでした。文章は残っているので再試行できます。"
    },
    es: {
      gameCount: "10 juegos", settings: "Ajustes", requestChange: "Pedir un cambio", walkToGame: "CAMINA HASTA UN JUEGO", keyboardHint: "A / D o ← → para moverte · Espacio para saltar", touchHint: "Usa los botones para moverte y saltar", controllerHint: "Stick / cruceta mover · ✕ saltar · □ jugar · Options ajustes", playChip: "JUGAR →", playGame: "Jugar", jump: "SALTAR", run: "CORRER", moveLeft: "Mover a la izquierda", moveRight: "Mover a la derecha", canvasHelp: "Mueve a Shitaky con A y D, las flechas, los botones táctiles o un mando. Salta con Espacio, W, Arriba o ✕. Pulsa E o □ junto a un juego para entrar.", loadingArt: "Cargando Shitaky…", artError: "No se pudo cargar Shitaky. Actualiza la página.", inkSubtitle: "Combate en papel", sketchSubtitle: "Plataformas dibujadas a mano", exfilSubtitle: "Supervivencia DMZ en 3D", dmz2Subtitle: "Extracción pixelada", deadSubtitle: "Sobrevive a la noche", bravoSubtitle: "Supervivencia en el bosque", cupSubtitle: "Matemáticas de primaria", devilSubtitle: "Plataformas con trampas", flightSubtitle: "Juego de escritura pixel", settingsIntro: "Elige el aspecto y los controles de Shitaky Games. Se guardan en este dispositivo.", language: "Idioma", automatic: "Automático", device: "Controles / dispositivo", keyboard: "Teclado", touch: "Pantalla táctil", controller: "Mando", largeText: "Texto más grande", highContrast: "Alto contraste", reduceMotion: "Reducir movimiento", fullscreen: "Pantalla completa", exitFullscreen: "Salir de pantalla completa", resetSettings: "Restablecer ajustes", settingsScope: "Estos ajustes cambian la galería de Shitaky Games. Cada juego puede tener sus propios controles e idiomas.", closeSettings: "Cerrar ajustes", deviceAutoKeyboard: "Usando el teclado", deviceAutoTouch: "Usando controles táctiles", deviceControllerReady: "Mando conectado", deviceControllerMissing: "Conecta un mando para usarlo aquí", deviceKeyboard: "Teclado seleccionado", deviceTouch: "Botones táctiles visibles", requestTitle: "Pedir un cambio en un juego", closeRequest: "Cerrar solicitud", whichGame: "¿Qué juego?", whatChange: "¿Qué quieres cambiar?", requestExample: "Ejemplo: Haz que el salto en EXFIL ZERO sea más natural.", requestOfflineNote: "Envía tu idea. Codex empieza cuando tu Mac se conecte; también revisa cada hora.", requestOnlineNote: "Codex está conectado. Las solicitudes deberían empezar en segundos.", send: "Enviar", sending: "Enviando…", sentOnline: "Enviado. Codex debería empezar en segundos.", sentOffline: "Guardado. Codex empezará cuando tu Mac esté conectado o en la siguiente revisión horaria.", working: "Codex está trabajando en tu solicitud.", completed: "Listo: ", completedFallback: "El cambio se completó.", blocked: "Codex necesita ayuda: ", blockedFallback: "El cambio todavía no se puede terminar.", sendError: "No se pudo enviar. Tu texto sigue aquí para que lo intentes de nuevo."
    },
    fr: {
      gameCount: "10 jeux", settings: "Réglages", requestChange: "Demander un changement", walkToGame: "MARCHE VERS UN JEU", keyboardHint: "A / D ou ← → pour bouger · Espace pour sauter", touchHint: "Utilise les boutons pour bouger et sauter", controllerHint: "Stick / croix bouger · ✕ sauter · □ jouer · Options réglages", playChip: "JOUER →", playGame: "Jouer", jump: "SAUTER", run: "COURIR", moveLeft: "Aller à gauche", moveRight: "Aller à droite", canvasHelp: "Déplace Shitaky avec A et D, les flèches, les boutons tactiles ou une manette. Saute avec Espace, W, Haut ou ✕. Appuie sur E ou □ près d'un jeu pour y jouer.", loadingArt: "Chargement de Shitaky…", artError: "Impossible de charger Shitaky. Actualise la page.", inkSubtitle: "Combat dans une arène de papier", sketchSubtitle: "Plateforme dessinée à la main", exfilSubtitle: "Survie DMZ en 3D", dmz2Subtitle: "Extraction en pixels", deadSubtitle: "Survis à la nuit", bravoSubtitle: "Survie dans le bosquet", cupSubtitle: "Maths du primaire", devilSubtitle: "Plateforme à pièges", flightSubtitle: "Jeu de frappe pixel", settingsIntro: "Choisis l'apparence et les commandes de Shitaky Games. Elles sont enregistrées sur cet appareil.", language: "Langue", automatic: "Automatique", device: "Commandes / appareil", keyboard: "Clavier", touch: "Écran tactile", controller: "Manette", largeText: "Texte agrandi", highContrast: "Contraste élevé", reduceMotion: "Réduire les animations", fullscreen: "Plein écran", exitFullscreen: "Quitter le plein écran", resetSettings: "Réinitialiser", settingsScope: "Ces réglages concernent la galerie Shitaky Games. Chaque jeu peut avoir ses propres commandes et langues.", closeSettings: "Fermer les réglages", deviceAutoKeyboard: "Commandes clavier", deviceAutoTouch: "Commandes tactiles", deviceControllerReady: "Manette connectée", deviceControllerMissing: "Connecte une manette pour l'utiliser ici", deviceKeyboard: "Clavier sélectionné", deviceTouch: "Boutons tactiles affichés", requestTitle: "Demander un changement de jeu", closeRequest: "Fermer la demande", whichGame: "Quel jeu ?", whatChange: "Que faut-il changer ?", requestExample: "Exemple : Rends le saut d'EXFIL ZERO plus naturel.", requestOfflineNote: "Envoie ton idée. Codex démarre quand ton Mac est en ligne, avec une vérification chaque heure.", requestOnlineNote: "Codex est connecté. Les demandes devraient démarrer en quelques secondes.", send: "Envoyer", sending: "Envoi…", sentOnline: "Envoyé. Codex devrait démarrer en quelques secondes.", sentOffline: "Enregistré. Codex démarrera quand ton Mac sera en ligne ou lors de la prochaine vérification horaire.", working: "Codex travaille sur ta demande.", completed: "Terminé : ", completedFallback: "Le changement est terminé.", blocked: "Codex a besoin d'aide : ", blockedFallback: "Ce changement ne peut pas encore être terminé.", sendError: "Envoi impossible. Ton texte est conservé pour réessayer."
    },
    de: {
      gameCount: "10 Spiele", settings: "Einstellungen", requestChange: "Änderung anfragen", walkToGame: "GEH ZU EINEM SPIEL", keyboardHint: "A / D oder ← → bewegen · Leertaste springen", touchHint: "Mit den Tasten bewegen und springen", controllerHint: "Stick / Steuerkreuz bewegen · ✕ springen · □ spielen · Options Einstellungen", playChip: "SPIELEN →", playGame: "Spielen", jump: "SPRINGEN", run: "RENNEN", moveLeft: "Nach links", moveRight: "Nach rechts", canvasHelp: "Bewege Shitaky mit A und D, Pfeiltasten, Touch-Tasten oder Controller. Springe mit Leertaste, W, Hoch oder ✕. Drücke E oder □ bei einem Spiel, um es zu öffnen.", loadingArt: "Shitaky wird geladen…", artError: "Shitaky konnte nicht geladen werden. Bitte neu laden.", inkSubtitle: "Kampf in der Papierarena", sketchSubtitle: "Handgezeichnetes Jump-and-Run", exfilSubtitle: "3D-DMZ-Überleben", dmz2Subtitle: "Pixel-Extraktion", deadSubtitle: "Überlebe die Nacht", bravoSubtitle: "Überleben im Hain", cupSubtitle: "Mathe für die Grundschule", devilSubtitle: "Jump-and-Run mit Fallen", flightSubtitle: "Pixel-Tippspiel", settingsIntro: "Wähle Darstellung und Steuerung von Shitaky Games. Die Auswahl wird auf diesem Gerät gespeichert.", language: "Sprache", automatic: "Automatisch", device: "Steuerung / Gerät", keyboard: "Tastatur", touch: "Touchscreen", controller: "Controller", largeText: "Größerer Text", highContrast: "Hoher Kontrast", reduceMotion: "Weniger Bewegung", fullscreen: "Vollbild", exitFullscreen: "Vollbild verlassen", resetSettings: "Zurücksetzen", settingsScope: "Diese Einstellungen gelten für die Shitaky-Games-Galerie. Einzelne Spiele können eigene Steuerungen und Sprachen haben.", closeSettings: "Einstellungen schließen", deviceAutoKeyboard: "Tastatursteuerung aktiv", deviceAutoTouch: "Touch-Steuerung aktiv", deviceControllerReady: "Controller verbunden", deviceControllerMissing: "Verbinde einen Controller, um ihn hier zu nutzen", deviceKeyboard: "Tastatur ausgewählt", deviceTouch: "Touch-Tasten sichtbar", requestTitle: "Spieländerung anfragen", closeRequest: "Anfrage schließen", whichGame: "Welches Spiel?", whatChange: "Was soll sich ändern?", requestExample: "Beispiel: Der Sprung in EXFIL ZERO soll natürlicher sein.", requestOfflineNote: "Sende deine Idee. Codex startet, wenn dein Mac online ist, und prüft sonst stündlich.", requestOnlineNote: "Codex ist verbunden. Neue Anfragen sollten in Sekunden starten.", send: "Senden", sending: "Wird gesendet…", sentOnline: "Gesendet. Codex sollte in Sekunden starten.", sentOffline: "Gespeichert. Codex startet, wenn dein Mac online ist oder bei der nächsten stündlichen Prüfung.", working: "Codex bearbeitet deine Anfrage.", completed: "Fertig: ", completedFallback: "Die Änderung ist fertig.", blocked: "Codex braucht Hilfe: ", blockedFallback: "Diese Änderung konnte noch nicht beendet werden.", sendError: "Senden fehlgeschlagen. Dein Text bleibt für einen neuen Versuch erhalten."
    },
    pt: {
      gameCount: "10 jogos", settings: "Configurações", requestChange: "Pedir mudança", walkToGame: "ANDE ATÉ UM JOGO", keyboardHint: "A / D ou ← → para mover · Espaço para pular", touchHint: "Use os botões para mover e pular", controllerHint: "Analógico / direcional mover · ✕ pular · □ jogar · Options configurações", playChip: "JOGAR →", playGame: "Jogar", jump: "PULAR", run: "CORRER", moveLeft: "Mover para a esquerda", moveRight: "Mover para a direita", canvasHelp: "Mova Shitaky com A e D, setas, botões de toque ou controle. Pule com Espaço, W, Cima ou ✕. Aperte E ou □ perto de um jogo para jogar.", loadingArt: "Carregando Shitaky…", artError: "Não foi possível carregar Shitaky. Atualize a página.", inkSubtitle: "Batalha na arena de papel", sketchSubtitle: "Plataforma desenhada à mão", exfilSubtitle: "Sobrevivência DMZ em 3D", dmz2Subtitle: "Extração em pixels", deadSubtitle: "Sobreviva à noite", bravoSubtitle: "Sobrevivência no bosque", cupSubtitle: "Matemática do ensino fundamental", devilSubtitle: "Plataforma com armadilhas", flightSubtitle: "Jogo de digitação pixel", settingsIntro: "Escolha a aparência e os controles do Shitaky Games. Suas escolhas ficam salvas neste dispositivo.", language: "Idioma", automatic: "Automático", device: "Controles / dispositivo", keyboard: "Teclado", touch: "Tela sensível ao toque", controller: "Controle", largeText: "Texto maior", highContrast: "Alto contraste", reduceMotion: "Reduzir movimento", fullscreen: "Tela cheia", exitFullscreen: "Sair da tela cheia", resetSettings: "Redefinir configurações", settingsScope: "Estas configurações mudam a galeria Shitaky Games. Cada jogo pode ter seus próprios controles e idiomas.", closeSettings: "Fechar configurações", deviceAutoKeyboard: "Usando teclado", deviceAutoTouch: "Usando toque", deviceControllerReady: "Controle conectado", deviceControllerMissing: "Conecte um controle para usá-lo aqui", deviceKeyboard: "Teclado selecionado", deviceTouch: "Botões de toque visíveis", requestTitle: "Pedir mudança em um jogo", closeRequest: "Fechar pedido", whichGame: "Qual jogo?", whatChange: "O que deve mudar?", requestExample: "Exemplo: Deixe o pulo em EXFIL ZERO mais natural.", requestOfflineNote: "Envie sua ideia. O Codex começa quando seu Mac estiver online, com uma verificação por hora.", requestOnlineNote: "Codex conectado. Novos pedidos devem começar em segundos.", send: "Enviar", sending: "Enviando…", sentOnline: "Enviado. O Codex deve começar em segundos.", sentOffline: "Salvo. O Codex começará quando seu Mac estiver online ou na próxima verificação por hora.", working: "O Codex está trabalhando no seu pedido.", completed: "Pronto: ", completedFallback: "A mudança foi concluída.", blocked: "O Codex precisa de ajuda: ", blockedFallback: "Esta mudança ainda não pôde ser concluída.", sendError: "Não foi possível enviar. Seu texto continua aqui para tentar de novo."
    }
  };

  const siteWords = {
    en: { explore: "Explore", allGames: "All games", searchGames: "Search games", welcomeEyebrow: "A little place to play", welcomeTitle: "Find your next favorite game.", welcomeDescription: "Tap a game to start playing. Come back anytime to choose another.", exploreGames: "Explore games", playFeatured: "Play Level Devil", controllerBrowse: "Using a controller? Move with the D-pad or stick and press ✕ to play.", featuredGame: "FEATURED GAME", browseDescription: "Open any game with one click or tap.", filterGames: "Filter games", filterAll: "All", filterAction: "Action", filterAdventure: "Adventure", filterLearning: "Learning", noResultsTitle: "No games found", noResultsDescription: "Try a different search.", footerLine: "Find a game. Have fun. Come back for more.", deviceTouch: "Touch screen selected", settingsScope: "These settings change Shitaky Games pages. Each game may have its own controls and language options." },
    ja: { explore: "見つける", allGames: "すべてのゲーム", searchGames: "ゲームを検索", welcomeEyebrow: "気軽に遊べる場所", welcomeTitle: "次のお気に入りを見つけよう。", welcomeDescription: "気になるゲームを選んですぐに遊べます。いつでも一覧に戻れます。", exploreGames: "ゲームを見る", playFeatured: "Level Devilで遊ぶ", controllerBrowse: "コントローラーでは十字キーかスティックで選び、✕で遊べます。", featuredGame: "おすすめゲーム", browseDescription: "クリックまたはタップですぐに遊べます。", filterGames: "ゲームを絞り込む", filterAll: "すべて", filterAction: "アクション", filterAdventure: "アドベンチャー", filterLearning: "学習", noResultsTitle: "ゲームが見つかりません", noResultsDescription: "別の言葉で検索してください。", footerLine: "ゲームを見つけて、楽しく遊ぼう。", deviceTouch: "タッチ画面を選択中", settingsScope: "この設定はShitaky Gamesのページに適用されます。各ゲームには別の操作や言語設定がある場合があります。" },
    es: { explore: "Explorar", allGames: "Todos los juegos", searchGames: "Buscar juegos", welcomeEyebrow: "Un lugar para jugar", welcomeTitle: "Encuentra tu próximo juego favorito.", welcomeDescription: "Elige una portada, juega y vuelve cuando quieras. Todos tus juegos están aquí.", exploreGames: "Explorar juegos", playFeatured: "Jugar Level Devil", controllerBrowse: "Con mando, usa la cruceta o el joystick y pulsa ✕ para jugar.", featuredGame: "JUEGO DESTACADO", browseDescription: "Abre cualquier juego con un clic o toque.", filterGames: "Filtrar juegos", filterAll: "Todos", filterAction: "Acción", filterAdventure: "Aventura", filterLearning: "Aprendizaje", noResultsTitle: "No se encontraron juegos", noResultsDescription: "Prueba otra búsqueda.", footerLine: "Encuentra un juego, diviértete y vuelve por más.", deviceTouch: "Pantalla táctil seleccionada", settingsScope: "Estos ajustes cambian las páginas de Shitaky Games. Cada juego puede tener sus propios controles e idiomas." },
    fr: { explore: "Explorer", allGames: "Tous les jeux", searchGames: "Chercher un jeu", welcomeEyebrow: "Un endroit pour jouer", welcomeTitle: "Trouvez votre prochain jeu préféré.", welcomeDescription: "Choisissez un jeu, lancez-le et revenez quand vous voulez. Tous vos jeux sont ici.", exploreGames: "Explorer les jeux", playFeatured: "Jouer à Level Devil", controllerBrowse: "Avec une manette, déplacez-vous avec la croix ou le stick et appuyez sur ✕.", featuredGame: "JEU À LA UNE", browseDescription: "Ouvrez un jeu en un clic ou un toucher.", filterGames: "Filtrer les jeux", filterAll: "Tous", filterAction: "Action", filterAdventure: "Aventure", filterLearning: "Éducatif", noResultsTitle: "Aucun jeu trouvé", noResultsDescription: "Essayez une autre recherche.", footerLine: "Trouvez un jeu et amusez-vous.", deviceTouch: "Écran tactile sélectionné", settingsScope: "Ces réglages changent les pages de Shitaky Games. Chaque jeu peut avoir ses propres commandes et langues." },
    de: { explore: "Entdecken", allGames: "Alle Spiele", searchGames: "Spiele suchen", welcomeEyebrow: "Ein Ort zum Spielen", welcomeTitle: "Finde dein nächstes Lieblingsspiel.", welcomeDescription: "Wähle ein Spiel, leg los und komm jederzeit zurück. Alle deine Spiele sind hier.", exploreGames: "Spiele entdecken", playFeatured: "Level Devil spielen", controllerBrowse: "Mit Controller: Steuerkreuz oder Stick bewegen, ✕ zum Spielen drücken.", featuredGame: "SPIELTIPP", browseDescription: "Öffne jedes Spiel mit einem Klick oder Tipp.", filterGames: "Spiele filtern", filterAll: "Alle", filterAction: "Action", filterAdventure: "Abenteuer", filterLearning: "Lernen", noResultsTitle: "Keine Spiele gefunden", noResultsDescription: "Versuche eine andere Suche.", footerLine: "Finde ein Spiel und hab Spaß.", deviceTouch: "Touchscreen ausgewählt", settingsScope: "Diese Einstellungen gelten für die Seiten von Shitaky Games. Einzelne Spiele können eigene Steuerungen und Sprachen haben." },
    pt: { explore: "Explorar", allGames: "Todos os jogos", searchGames: "Buscar jogos", welcomeEyebrow: "Um lugar para jogar", welcomeTitle: "Encontre seu próximo jogo favorito.", welcomeDescription: "Escolha uma capa, jogue e volte quando quiser. Todos os seus jogos estão aqui.", exploreGames: "Explorar jogos", playFeatured: "Jogar Level Devil", controllerBrowse: "Com controle, use o direcional ou analógico e aperte ✕ para jogar.", featuredGame: "JOGO EM DESTAQUE", browseDescription: "Abra qualquer jogo com um clique ou toque.", filterGames: "Filtrar jogos", filterAll: "Todos", filterAction: "Ação", filterAdventure: "Aventura", filterLearning: "Aprender", noResultsTitle: "Nenhum jogo encontrado", noResultsDescription: "Tente outra busca.", footerLine: "Encontre um jogo, divirta-se e volte sempre.", deviceTouch: "Tela sensível ao toque selecionada", settingsScope: "Estas configurações mudam as páginas do Shitaky Games. Cada jogo pode ter seus próprios controles e idiomas." }
  };
  const kanjiSubtitles = {
    en: "Grades 1–6 kanji", ja: "小学1～6年の漢字", es: "Kanji de 1.º a 6.º",
    fr: "Kanjis du CP à la 6e", de: "Kanji der Klassen 1–6", pt: "Kanji do 1.º ao 6.º ano"
  };
  const storeWords = {
    en: { browseGames: "Browse Shitaky Games", topPicks: "Top picks", categories: "Categories", chartsDescription: "A good place to start.", freeToPlay: "Free · Play in browser" },
    ja: { browseGames: "Shitaky Gamesを探す", topPicks: "おすすめ", categories: "カテゴリー", chartsDescription: "ここから始めよう。", freeToPlay: "無料 · ブラウザーで遊ぶ" },
    es: { browseGames: "Explora Shitaky Games", topPicks: "Recomendados", categories: "Categorías", chartsDescription: "Un buen lugar para empezar.", freeToPlay: "Gratis · Juega en el navegador" },
    fr: { browseGames: "Découvrez Shitaky Games", topPicks: "Nos sélections", categories: "Catégories", chartsDescription: "Un bon point de départ.", freeToPlay: "Gratuit · Jouer dans le navigateur" },
    de: { browseGames: "Shitaky Games entdecken", topPicks: "Unsere Tipps", categories: "Kategorien", chartsDescription: "Ein guter Anfang.", freeToPlay: "Kostenlos · Im Browser spielen" },
    pt: { browseGames: "Explore Shitaky Games", topPicks: "Destaques", categories: "Categorias", chartsDescription: "Um bom lugar para começar.", freeToPlay: "Grátis · Jogue no navegador" }
  };
  for (const code of supported) Object.assign(words[code], siteWords[code], storeWords[code], { kanjiSubtitle: kanjiSubtitles[code] });

  const defaults = { language: "auto", device: "auto", largeText: false, highContrast: false, reduceMotion: false };
  let settings = { ...defaults };
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (stored && typeof stored === "object") {
      if (stored.language === "auto" || supported.includes(stored.language)) settings.language = stored.language;
      if (["auto", "keyboard", "touch", "controller"].includes(stored.device)) settings.device = stored.device;
      for (const key of ["largeText", "highContrast", "reduceMotion"]) settings[key] = stored[key] === true;
    }
  } catch { /* Settings still work when storage is unavailable. */ }

  const dialog = document.querySelector("#settings-dialog");
  const trigger = document.querySelector("#settings-trigger");
  const close = document.querySelector("#settings-close");
  const language = document.querySelector("#settings-language");
  const device = document.querySelector("#settings-device");
  const largeText = document.querySelector("#settings-large-text");
  const highContrast = document.querySelector("#settings-high-contrast");
  const reduceMotion = document.querySelector("#settings-reduce-motion");
  const deviceStatus = document.querySelector("#settings-device-status");
  const fullscreen = document.querySelector("#settings-fullscreen");

  function activeLanguage() {
    if (settings.language !== "auto") return settings.language;
    const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language || "en"];
    return browserLanguages.map(value => value.toLowerCase().split("-")[0]).find(value => supported.includes(value)) || "en";
  }
  function t(key) { return words[activeLanguage()][key] || words.en[key] || key; }
  function controllerConnected() {
    try { return Array.from(navigator.getGamepads?.() || []).some(Boolean); }
    catch { return false; }
  }
  function refreshDeviceStatus() {
    const connected = controllerConnected();
    const coarse = matchMedia("(pointer: coarse)").matches;
    const key = settings.device === "controller" ? connected ? "deviceControllerReady" : "deviceControllerMissing"
      : settings.device === "touch" ? "deviceTouch"
      : settings.device === "keyboard" ? "deviceKeyboard"
      : connected ? "deviceControllerReady" : coarse ? "deviceAutoTouch" : "deviceAutoKeyboard";
    deviceStatus.textContent = t(key);
  }
  function apply() {
    document.documentElement.lang = activeLanguage();
    document.body.classList.toggle("large-text", settings.largeText);
    document.body.classList.toggle("high-contrast", settings.highContrast);
    document.body.classList.toggle("reduce-motion", settings.reduceMotion);
    document.body.dataset.inputMode = settings.device;
    language.value = settings.language;
    device.value = settings.device;
    largeText.checked = settings.largeText;
    highContrast.checked = settings.highContrast;
    reduceMotion.checked = settings.reduceMotion;
    for (const node of document.querySelectorAll("[data-i18n]")) node.textContent = t(node.dataset.i18n);
    for (const node of document.querySelectorAll("[data-i18n-aria]")) node.setAttribute("aria-label", t(node.dataset.i18nAria));
    for (const node of document.querySelectorAll("[data-i18n-placeholder]")) node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder));
    document.title = "Shitaky Games · " + t("gameCount");
    fullscreen.textContent = t(document.fullscreenElement ? "exitFullscreen" : "fullscreen");
    refreshDeviceStatus();
    window.dispatchEvent(new CustomEvent("fizz-settings-change", { detail: { ...settings, language: activeLanguage() } }));
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* The current page still reflects the setting. */ }
    apply();
  }
  function open() {
    if (dialog.open) return;
    if (document.querySelector("#request-dialog")?.open) return;
    dialog.showModal();
    language.focus();
    refreshDeviceStatus();
  }
  function closeDialog() { dialog.close(); }
  trigger.addEventListener("click", open);
  close.addEventListener("click", closeDialog);
  dialog.addEventListener("click", event => { if (event.target === dialog) closeDialog(); });
  dialog.addEventListener("close", () => trigger.focus());
  language.addEventListener("change", () => { settings.language = language.value; save(); });
  device.addEventListener("change", () => { settings.device = device.value; save(); });
  largeText.addEventListener("change", () => { settings.largeText = largeText.checked; save(); });
  highContrast.addEventListener("change", () => { settings.highContrast = highContrast.checked; save(); });
  reduceMotion.addEventListener("change", () => { settings.reduceMotion = reduceMotion.checked; save(); });
  document.querySelector("#settings-reset").addEventListener("click", () => {
    settings = { ...defaults };
    try { localStorage.removeItem(storageKey); } catch { /* Optional storage. */ }
    apply();
  });
  fullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Full screen is optional on some devices. */ }
    fullscreen.textContent = t(document.fullscreenElement ? "exitFullscreen" : "fullscreen");
  });
  document.addEventListener("fullscreenchange", () => { fullscreen.textContent = t(document.fullscreenElement ? "exitFullscreen" : "fullscreen"); });
  setInterval(() => { if (dialog.open) refreshDeviceStatus(); }, 500);

  const padState = { vertical: 0, horizontal: 0, confirm: false, cancel: false, lastMove: 0 };
  function handleGamepad(pad) {
    if (!dialog.open) return;
    const pressed = index => Boolean(pad.buttons?.[index]?.pressed);
    const vertical = Number(pressed(13) || (pad.axes?.[1] || 0) > 0.55) - Number(pressed(12) || (pad.axes?.[1] || 0) < -0.55);
    const horizontal = Number(pressed(15) || (pad.axes?.[0] || 0) > 0.55) - Number(pressed(14) || (pad.axes?.[0] || 0) < -0.55);
    const confirm = pressed(0);
    const cancel = pressed(1);
    const now = performance.now();
    const controls = [...dialog.querySelectorAll("select, input, button")];
    const focused = document.activeElement;
    if (vertical && (vertical !== padState.vertical || now - padState.lastMove > 280)) {
      const index = Math.max(0, controls.indexOf(focused));
      controls[(index + vertical + controls.length) % controls.length].focus();
      padState.lastMove = now;
    }
    if (horizontal && (horizontal !== padState.horizontal || now - padState.lastMove > 280) && focused?.tagName === "SELECT") {
      focused.selectedIndex = (focused.selectedIndex + horizontal + focused.options.length) % focused.options.length;
      focused.dispatchEvent(new Event("change", { bubbles: true }));
      padState.lastMove = now;
    }
    if (confirm && !padState.confirm) {
      if (focused?.tagName === "SELECT") {
        focused.selectedIndex = (focused.selectedIndex + 1) % focused.options.length;
        focused.dispatchEvent(new Event("change", { bubbles: true }));
      } else focused?.click();
    }
    if (cancel && !padState.cancel) closeDialog();
    Object.assign(padState, { vertical, horizontal, confirm, cancel });
  }

  window.FizzSettings = { t, open, handleGamepad, get deviceMode() { return settings.device; }, get language() { return activeLanguage(); } };
  apply();
})();
