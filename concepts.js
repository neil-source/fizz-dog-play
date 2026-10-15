(() => {
  "use strict";

  const games = {
    "cloud-post": { name: "Cloud Post", image: "./art/concepts/cloud-post-cover.jpg" },
    buttonwood: { name: "Buttonwood", image: "./art/concepts/buttonwood-cover.jpg" },
    "neon-noodles": { name: "Neon Noodles", image: "./art/concepts/neon-noodles-cover.jpg" },
    tideglass: { name: "Tideglass", image: "./art/concepts/tideglass-cover.jpg" },
    "comet-cart": { name: "Comet Cart", image: "./art/concepts/comet-cart-cover.jpg" },
    "moonberry-market": { name: "Moonberry Market", image: "./art/concepts/moonberry-market-cover.jpg" },
    "clockwork-cove": { name: "Clockwork Cove", image: "./art/concepts/clockwork-cove-cover.jpg" },
    "beat-bloom": { name: "Beat Bloom", image: "./art/concepts/beat-bloom-cover.jpg" }
  };
  const copy = {
    en: {
      heroEyebrow: "FROM SHITAKY GAMES", heroTitle: "Little worlds. Big feelings.", heroBody: "Meet a few playful worlds we are dreaming up. Browse the art, find a favorite, and see what each game could become.", heroStatus: "4 original game concepts", sectionEyebrow: "THE DRAWING BOARD", sectionTitle: "Explore the ideas", conceptCount: "4 concepts", conceptLabel: "Concept", conceptNote: "These are concept previews, not playable games yet.", footerNote: "Made for curious players.", detailEyebrow: "GAME CONCEPT", detailNote: "This is an idea and original concept art. There is no playable build yet.", close: "Close concept details", view: "View {name} concept",
      genres: { "cloud-post": "Cozy adventure", buttonwood: "Craft puzzle", "neon-noodles": "Arcade cooking", tideglass: "Ocean adventure" },
      descriptions: { "cloud-post": "Carry letters between sky islands, ride warm winds, and help each village reconnect.", buttonwood: "Stitch paths through a tiny forest and solve friendly puzzles with its handmade neighbors.", "neon-noodles": "Flip pans, time your recipes, and feed a city that never slows down.", tideglass: "Explore living reefs, collect lost light, and bring color back to the sea." }
    },
    ja: {
      heroEyebrow: "SHITAKY GAMES より", heroTitle: "小さな世界。大きなワクワク。", heroBody: "考案中の遊び心あふれる世界をご紹介します。アートを見て、お気に入りのアイデアを探してください。", heroStatus: "4つのオリジナルゲーム案", sectionEyebrow: "アイデアノート", sectionTitle: "ゲーム案を見る", conceptCount: "4つのコンセプト", conceptLabel: "コンセプト", conceptNote: "ここにあるのはゲーム案の紹介です。まだプレイはできません。", footerNote: "好奇心いっぱいのプレイヤーへ。", detailEyebrow: "ゲーム案", detailNote: "オリジナルのゲーム案とコンセプトアートです。まだプレイできるゲームはありません。", close: "詳細を閉じる", view: "{name} のゲーム案を見る",
      genres: { "cloud-post": "ほのぼの冒険", buttonwood: "クラフトパズル", "neon-noodles": "料理アーケード", tideglass: "海の冒険" },
      descriptions: { "cloud-post": "空に浮かぶ島々へ手紙を届け、風に乗って村の人々をつなげます。", buttonwood: "小さな森に糸の道を縫い、手作りの仲間たちとパズルを解きます。", "neon-noodles": "鍋を振り、タイミングよく料理して、眠らない街のお客さんを満足させます。", tideglass: "色鮮やかなサンゴ礁を探検し、失われた光を集めて海に色を取り戻します。" }
    },
    es: {
      heroEyebrow: "DE SHITAKY GAMES", heroTitle: "Mundos pequeños. Grandes emociones.", heroBody: "Conoce algunos mundos que estamos imaginando. Explora el arte y elige tu idea favorita.", heroStatus: "4 ideas originales de juegos", sectionEyebrow: "EN EL TABLERO", sectionTitle: "Explora las ideas", conceptCount: "4 conceptos", conceptLabel: "Concepto", conceptNote: "Son avances de ideas, todavía no son juegos disponibles.", footerNote: "Hecho para jugadores curiosos.", detailEyebrow: "IDEA DE JUEGO", detailNote: "Esta es una idea con arte original. Todavía no hay un juego disponible.", close: "Cerrar detalles", view: "Ver la idea de {name}",
      genres: { "cloud-post": "Aventura tranquila", buttonwood: "Puzles artesanales", "neon-noodles": "Cocina arcade", tideglass: "Aventura marina" },
      descriptions: { "cloud-post": "Lleva cartas entre islas flotantes, viaja con el viento y ayuda a reunir sus pueblos.", buttonwood: "Cose caminos por un bosque diminuto y resuelve puzles con sus vecinos de tela.", "neon-noodles": "Saltea, cocina a tiempo y alimenta a una ciudad que nunca se detiene.", tideglass: "Explora arrecifes, recoge luz perdida y devuelve el color al mar." }
    },
    fr: {
      heroEyebrow: "PAR SHITAKY GAMES", heroTitle: "Petits mondes. Grandes émotions.", heroBody: "Découvrez quelques univers que nous imaginons. Parcourez les illustrations et trouvez votre idée préférée.", heroStatus: "4 idées de jeux originales", sectionEyebrow: "EN PRÉPARATION", sectionTitle: "Explorer les idées", conceptCount: "4 concepts", conceptLabel: "Concept", conceptNote: "Ce sont des aperçus de concepts, pas encore des jeux jouables.", footerNote: "Pour les joueurs curieux.", detailEyebrow: "CONCEPT DE JEU", detailNote: "Voici une idée et une illustration originale. Aucun jeu jouable n'est encore disponible.", close: "Fermer les détails", view: "Voir le concept {name}",
      genres: { "cloud-post": "Aventure douce", buttonwood: "Puzzle artisanal", "neon-noodles": "Cuisine arcade", tideglass: "Aventure marine" },
      descriptions: { "cloud-post": "Livrez des lettres entre les îles célestes, suivez les vents et rapprochez leurs habitants.", buttonwood: "Cousez des chemins dans une petite forêt et résolvez des énigmes avec ses voisins en tissu.", "neon-noodles": "Faites sauter les nouilles, cuisinez au bon moment et nourrissez une ville infatigable.", tideglass: "Explorez les récifs, recueillez la lumière perdue et rendez ses couleurs à la mer." }
    },
    de: {
      heroEyebrow: "VON SHITAKY GAMES", heroTitle: "Kleine Welten. Große Gefühle.", heroBody: "Entdecke einige Welten, die wir uns ausdenken. Schau dir die Bilder an und finde deine Lieblingsidee.", heroStatus: "4 eigene Spielideen", sectionEyebrow: "AUF DEM ZEICHENBRETT", sectionTitle: "Ideen entdecken", conceptCount: "4 Konzepte", conceptLabel: "Konzept", conceptNote: "Das sind Spielideen, noch keine spielbaren Spiele.", footerNote: "Für neugierige Spieler gemacht.", detailEyebrow: "SPIELKONZEPT", detailNote: "Dies ist eine Idee mit eigener Konzeptgrafik. Eine spielbare Version gibt es noch nicht.", close: "Details schließen", view: "Konzept {name} ansehen",
      genres: { "cloud-post": "Gemütliches Abenteuer", buttonwood: "Bastelrätsel", "neon-noodles": "Arcade-Kochspiel", tideglass: "Meeresabenteuer" },
      descriptions: { "cloud-post": "Bringe Briefe von Himmelsinsel zu Himmelsinsel und verbinde die Dörfer mit dem Wind.", buttonwood: "Nähe Wege durch einen winzigen Wald und löse Rätsel mit seinen Stoffbewohnern.", "neon-noodles": "Schwenke die Pfanne, koche im richtigen Moment und versorge eine Stadt ohne Pause.", tideglass: "Erkunde Riffe, sammle verlorenes Licht und bringe Farbe ins Meer zurück." }
    },
    pt: {
      heroEyebrow: "DA SHITAKY GAMES", heroTitle: "Mundos pequenos. Grandes emoções.", heroBody: "Conheça alguns mundos que estamos imaginando. Explore as artes e escolha sua ideia favorita.", heroStatus: "4 ideias originais de jogos", sectionEyebrow: "NA PRANCHETA", sectionTitle: "Explore as ideias", conceptCount: "4 conceitos", conceptLabel: "Conceito", conceptNote: "Estas são prévias de ideias, ainda não são jogos para jogar.", footerNote: "Feito para jogadores curiosos.", detailEyebrow: "IDEIA DE JOGO", detailNote: "Esta é uma ideia com arte original. Ainda não existe uma versão jogável.", close: "Fechar detalhes", view: "Ver o conceito de {name}",
      genres: { "cloud-post": "Aventura tranquila", buttonwood: "Quebra-cabeça artesanal", "neon-noodles": "Culinária arcade", tideglass: "Aventura no oceano" },
      descriptions: { "cloud-post": "Leve cartas entre ilhas no céu, pegue carona no vento e aproxime seus moradores.", buttonwood: "Costure caminhos por uma floresta minúscula e resolva desafios com seus vizinhos de pano.", "neon-noodles": "Mexa as panelas, acerte o tempo das receitas e alimente uma cidade que não para.", tideglass: "Explore recifes, junte a luz perdida e devolva as cores ao mar." }
    }
  };

  const storeCopy = {
    en: { navDiscover: "Discover", navTop: "Top concepts", search: "Search game concepts", introEyebrow: "SHITAKY GAMES", introTitle: "Find your next little world", introBody: "Browse original game ideas, each with its own cover and story.", featuredTitle: "Featured concept", featuredSubtitle: "A new idea to explore", featuredTag: "FEATURED GAME IDEA", featuredBody: "Race a little kart across looping tracks on pocket-sized planets.", browseTitle: "Explore games", browseSubtitle: "Pick a world and see the game idea behind its cover.", conceptCount: "8 concepts", filterAll: "All", filterAdventure: "Adventure", filterPuzzle: "Puzzle", filterArcade: "Arcade", filterCozy: "Cozy", noResults: "No concepts match that search.", topTitle: "Top concepts", topSubtitle: "A few favorites from the idea shelf", aboutTitle: "About this game idea", detailNote: "This is an idea and original cover art. There is no playable build yet.", genres: { "comet-cart": "Space racing", "moonberry-market": "Market builder", "clockwork-cove": "Puzzle adventure", "beat-bloom": "Rhythm garden" }, descriptions: { "comet-cart": "Race a tiny kart across looping tracks on pocket-sized planets, catching comets for speed boosts.", "moonberry-market": "Build a moonlit market, trade glowing berries, and make a little place for every visitor.", "clockwork-cove": "Turn giant gears to move bridges, open tidal gates, and reach the lighthouse across the cove.", "beat-bloom": "Step to the rhythm, grow bright flowers, and bring music back to a quiet garden." } },
    ja: { navDiscover: "見つける", navTop: "人気の案", search: "ゲーム案を検索", introEyebrow: "SHITAKY GAMES", introTitle: "次の小さな世界を見つけよう", introBody: "それぞれの表紙と物語を持つオリジナルのゲーム案を見てみよう。", featuredTitle: "注目のゲーム案", featuredSubtitle: "新しいアイデアをチェック", featuredTag: "注目のゲーム案", featuredBody: "小さな惑星を結ぶコースをカートで駆け抜けよう。", browseTitle: "ゲーム案を探す", browseSubtitle: "表紙を選んで、どんなゲームになるか見てみよう。", conceptCount: "8つのコンセプト", filterAll: "すべて", filterAdventure: "冒険", filterPuzzle: "パズル", filterArcade: "アーケード", filterCozy: "のんびり", noResults: "一致するゲーム案がありません。", topTitle: "人気のゲーム案", topSubtitle: "アイデア棚からのおすすめ", aboutTitle: "このゲーム案について", detailNote: "これはオリジナルのゲーム案と表紙アートです。まだプレイできません。", genres: { "comet-cart": "宇宙レース", "moonberry-market": "マーケット作り", "clockwork-cove": "パズル冒険", "beat-bloom": "リズムガーデン" }, descriptions: { "comet-cart": "小さな惑星のループコースを走り、彗星を集めてスピードアップ。", "moonberry-market": "月明かりの市場を作り、光るベリーを交換して、お客さんを迎えよう。", "clockwork-cove": "大きな歯車を回して橋や水門を動かし、入り江の灯台を目指そう。", "beat-bloom": "リズムに合わせて歩き、花を咲かせて、静かな庭に音楽を取り戻そう。" } },
    es: { navDiscover: "Descubrir", navTop: "Más destacados", search: "Buscar ideas de juegos", introEyebrow: "SHITAKY GAMES", introTitle: "Encuentra tu próximo pequeño mundo", introBody: "Explora ideas de juegos originales, cada una con su portada e historia.", featuredTitle: "Concepto destacado", featuredSubtitle: "Una nueva idea para explorar", featuredTag: "IDEA DESTACADA", featuredBody: "Corre en un pequeño kart por pistas que rodean planetas diminutos.", browseTitle: "Explorar juegos", browseSubtitle: "Elige un mundo y descubre la idea detrás de su portada.", conceptCount: "8 conceptos", filterAll: "Todos", filterAdventure: "Aventura", filterPuzzle: "Puzles", filterArcade: "Arcade", filterCozy: "Tranquilos", noResults: "No hay conceptos que coincidan.", topTitle: "Conceptos destacados", topSubtitle: "Favoritos de nuestra colección de ideas", aboutTitle: "Acerca de esta idea", detailNote: "Esta es una idea con portada original. Todavía no hay un juego disponible.", genres: { "comet-cart": "Carreras espaciales", "moonberry-market": "Crear un mercado", "clockwork-cove": "Aventura de puzles", "beat-bloom": "Jardín rítmico" }, descriptions: { "comet-cart": "Compite por pistas alrededor de planetas pequeños y recoge cometas para acelerar.", "moonberry-market": "Construye un mercado nocturno, intercambia bayas luminosas y recibe a todos.", "clockwork-cove": "Gira engranajes gigantes para mover puentes, abrir compuertas y llegar al faro.", "beat-bloom": "Sigue el ritmo, cultiva flores brillantes y devuelve la música a un jardín tranquilo." } },
    fr: { navDiscover: "Découvrir", navTop: "Les favoris", search: "Chercher des idées de jeux", introEyebrow: "SHITAKY GAMES", introTitle: "Trouvez votre prochain petit monde", introBody: "Explorez des idées de jeux originales, chacune avec sa couverture et son histoire.", featuredTitle: "Concept à la une", featuredSubtitle: "Une nouvelle idée à explorer", featuredTag: "IDÉE À LA UNE", featuredBody: "Foncez en petit kart sur des pistes autour de planètes miniatures.", browseTitle: "Explorer les jeux", browseSubtitle: "Choisissez un monde et découvrez l'idée derrière sa couverture.", conceptCount: "8 concepts", filterAll: "Tout", filterAdventure: "Aventure", filterPuzzle: "Puzzle", filterArcade: "Arcade", filterCozy: "Détente", noResults: "Aucun concept ne correspond à la recherche.", topTitle: "Concepts favoris", topSubtitle: "Quelques idées que nous aimons", aboutTitle: "À propos de cette idée", detailNote: "Voici une idée et une couverture originale. Aucun jeu jouable n'est encore disponible.", genres: { "comet-cart": "Course spatiale", "moonberry-market": "Marché à construire", "clockwork-cove": "Aventure puzzle", "beat-bloom": "Jardin rythmique" }, descriptions: { "comet-cart": "Foncez sur des pistes autour de petites planètes et attrapez des comètes pour accélérer.", "moonberry-market": "Créez un marché au clair de lune, échangez des baies lumineuses et accueillez chacun.", "clockwork-cove": "Tournez d'énormes engrenages pour déplacer les ponts et atteindre le phare.", "beat-bloom": "Avancez en rythme, faites pousser des fleurs et rendez sa musique au jardin." } },
    de: { navDiscover: "Entdecken", navTop: "Top-Konzepte", search: "Spielideen suchen", introEyebrow: "SHITAKY GAMES", introTitle: "Finde deine nächste kleine Welt", introBody: "Entdecke eigene Spielideen, jede mit Cover und Geschichte.", featuredTitle: "Vorgestelltes Konzept", featuredSubtitle: "Eine neue Idee zum Entdecken", featuredTag: "SPIELIDEE IM FOKUS", featuredBody: "Rase im kleinen Kart über Strecken auf winzigen Planeten.", browseTitle: "Spiele entdecken", browseSubtitle: "Wähle eine Welt und sieh die Idee hinter ihrem Cover.", conceptCount: "8 Konzepte", filterAll: "Alle", filterAdventure: "Abenteuer", filterPuzzle: "Rätsel", filterArcade: "Arcade", filterCozy: "Gemütlich", noResults: "Keine passenden Konzepte gefunden.", topTitle: "Top-Konzepte", topSubtitle: "Ein paar Favoriten aus dem Ideenregal", aboutTitle: "Über diese Spielidee", detailNote: "Dies ist eine Idee mit eigenem Cover. Eine spielbare Version gibt es noch nicht.", genres: { "comet-cart": "Weltraumrennen", "moonberry-market": "Markt aufbauen", "clockwork-cove": "Rätselabenteuer", "beat-bloom": "Rhythmusgarten" }, descriptions: { "comet-cart": "Rase über Schleifen um winzige Planeten und sammle Kometen als Geschwindigkeitsschub.", "moonberry-market": "Baue einen Markt im Mondlicht, tausche leuchtende Beeren und begrüße alle Gäste.", "clockwork-cove": "Drehe riesige Zahnräder, bewege Brücken und erreiche den Leuchtturm.", "beat-bloom": "Geh im Takt, lass bunte Blumen wachsen und bring Musik in einen stillen Garten." } },
    pt: { navDiscover: "Descobrir", navTop: "Destaques", search: "Buscar ideias de jogos", introEyebrow: "SHITAKY GAMES", introTitle: "Encontre seu próximo pequeno mundo", introBody: "Explore ideias originais de jogos, cada uma com sua capa e história.", featuredTitle: "Conceito em destaque", featuredSubtitle: "Uma nova ideia para explorar", featuredTag: "IDEIA EM DESTAQUE", featuredBody: "Corra com um pequeno kart por pistas em planetas minúsculos.", browseTitle: "Explore jogos", browseSubtitle: "Escolha um mundo e descubra a ideia por trás da capa.", conceptCount: "8 conceitos", filterAll: "Todos", filterAdventure: "Aventura", filterPuzzle: "Quebra-cabeça", filterArcade: "Arcade", filterCozy: "Tranquilo", noResults: "Nenhum conceito corresponde à busca.", topTitle: "Conceitos em destaque", topSubtitle: "Alguns favoritos da nossa coleção de ideias", aboutTitle: "Sobre esta ideia", detailNote: "Esta é uma ideia com capa original. Ainda não existe uma versão jogável.", genres: { "comet-cart": "Corrida espacial", "moonberry-market": "Criar um mercado", "clockwork-cove": "Aventura de enigmas", "beat-bloom": "Jardim rítmico" }, descriptions: { "comet-cart": "Corra em pistas que contornam planetas pequenos e pegue cometas para acelerar.", "moonberry-market": "Monte um mercado ao luar, troque frutas brilhantes e receba cada visitante.", "clockwork-cove": "Gire engrenagens gigantes para mover pontes e chegar ao farol da enseada.", "beat-bloom": "Pise no ritmo, faça flores crescerem e devolva a música a um jardim quieto." } }
  };
  for (const [language, addition] of Object.entries(storeCopy)) {
    copy[language] = { ...copy[language], ...addition,
      genres: { ...copy[language].genres, ...addition.genres },
      descriptions: { ...copy[language].descriptions, ...addition.descriptions } };
  }

  const dialog = document.querySelector("#concept-dialog");
  const art = document.querySelector("#concept-dialog-art");
  const title = document.querySelector("#concept-dialog-title");
  const genre = document.querySelector("#concept-dialog-genre");
  const description = document.querySelector("#concept-dialog-description");
  const closeButton = document.querySelector("#concept-dialog-close");
  const cards = Array.from(document.querySelectorAll(".concept-card"));
  const openers = Array.from(document.querySelectorAll("button[data-concept]"));
  const search = document.querySelector("#concept-search");
  const filters = Array.from(document.querySelectorAll(".genre-filter"));
  const noResults = document.querySelector("#no-concepts");
  const total = document.querySelector(".concept-total");
  let selected = null;
  let lastTrigger = null;
  let activeFilter = "all";
  const currentCopy = () => copy[document.documentElement.lang] || copy.en;

  function updateLanguage() {
    const language = currentCopy();
    for (const node of document.querySelectorAll("[data-concept-i18n]")) node.textContent = language[node.dataset.conceptI18n];
    for (const opener of openers) {
      const id = opener.dataset.concept;
      for (const label of opener.querySelectorAll("[data-concept-genre]")) label.textContent = language.genres[id];
      opener.setAttribute("aria-label", language.view.replace("{name}", games[id].name));
    }
    search.placeholder = language.search;
    search.setAttribute("aria-label", language.search);
    closeButton.setAttribute("aria-label", language.close);
    if (selected) showDetails(selected);
    filterCards();
  }
  function filterCards() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const card of cards) {
      const id = card.dataset.concept;
      const genreMatch = activeFilter === "all" || card.dataset.genre.split(" ").includes(activeFilter);
      const searchText = [games[id].name, currentCopy().genres[id], currentCopy().descriptions[id], card.dataset.genre].join(" ").toLocaleLowerCase();
      card.hidden = !genreMatch || !searchText.includes(query);
      if (!card.hidden) visible++;
    }
    noResults.hidden = visible !== 0;
    total.textContent = activeFilter === "all" && !query ? currentCopy().conceptCount : `${visible} / ${cards.length}`;
    document.querySelector(".feature-section").hidden = Boolean(query) || activeFilter !== "all";
    document.querySelector(".top-section").hidden = Boolean(query) || activeFilter !== "all";
  }
  function showDetails(id) {
    const game = games[id];
    const language = currentCopy();
    art.src = game.image;
    art.alt = document.querySelector(`[data-concept="${id}"] .concept-art img`).alt;
    title.textContent = game.name;
    genre.textContent = language.genres[id];
    description.textContent = language.descriptions[id];
  }
  function openCard(card) {
    selected = card.dataset.concept;
    lastTrigger = card;
    showDetails(selected);
    dialog.showModal();
    closeButton.focus();
  }
  openers.forEach(opener => opener.addEventListener("click", () => openCard(opener)));
  search.addEventListener("input", filterCards);
  filters.forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    for (const filter of filters) {
      const active = filter === button;
      filter.classList.toggle("active", active);
      filter.setAttribute("aria-pressed", String(active));
    }
    filterCards();
  }));
  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => { selected = null; lastTrigger?.focus(); });
  new MutationObserver(updateLanguage).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  const pad = { direction: 0, lastMove: 0, confirm: false, cancel: false };
  setInterval(() => {
    const gamepad = (() => { try { return Array.from(navigator.getGamepads?.() || []).find(Boolean); } catch { return null; } })();
    if (!gamepad) return;
    const pressed = index => Boolean(gamepad.buttons?.[index]?.pressed);
    const cancel = pressed(1);
    const confirm = pressed(0);
    const settingsOpen = document.querySelector("#settings-dialog")?.open;
    if (dialog.open && cancel && !pad.cancel) dialog.close();
    if (!dialog.open && !settingsOpen) {
      const horizontal = (pressed(15) || (gamepad.axes?.[0] || 0) > .55 ? 1 : 0) - (pressed(14) || (gamepad.axes?.[0] || 0) < -.55 ? 1 : 0);
      const vertical = (pressed(13) || (gamepad.axes?.[1] || 0) > .55 ? 1 : 0) - (pressed(12) || (gamepad.axes?.[1] || 0) < -.55 ? 1 : 0);
      const direction = horizontal || vertical;
      if (direction && (direction !== pad.direction || performance.now() - pad.lastMove > 270)) {
        const visibleCards = cards.filter(card => !card.hidden);
        const at = visibleCards.indexOf(document.activeElement);
        if (visibleCards.length) visibleCards[(at < 0 ? 0 : (at + direction + visibleCards.length) % visibleCards.length)].focus();
        pad.lastMove = performance.now();
      }
      pad.direction = direction;
      if (confirm && !pad.confirm && openers.includes(document.activeElement)) document.activeElement.click();
    }
    pad.cancel = cancel;
    pad.confirm = confirm;
  }, 70);
  updateLanguage();
})();
