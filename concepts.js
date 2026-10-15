(() => {
  "use strict";

  const games = {
    "cloud-post": { name: "Cloud Post", image: "./art/concepts/cloud-post.jpg" },
    buttonwood: { name: "Buttonwood", image: "./art/concepts/buttonwood.jpg" },
    "neon-noodles": { name: "Neon Noodles", image: "./art/concepts/neon-noodles.jpg" },
    tideglass: { name: "Tideglass", image: "./art/concepts/tideglass.jpg" }
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

  const dialog = document.querySelector("#concept-dialog");
  const art = document.querySelector("#concept-dialog-art");
  const title = document.querySelector("#concept-dialog-title");
  const genre = document.querySelector("#concept-dialog-genre");
  const description = document.querySelector("#concept-dialog-description");
  const closeButton = document.querySelector("#concept-dialog-close");
  const cards = Array.from(document.querySelectorAll(".concept-card"));
  let selected = null;
  let lastTrigger = null;
  const currentCopy = () => copy[document.documentElement.lang] || copy.en;

  function updateLanguage() {
    const language = currentCopy();
    for (const node of document.querySelectorAll("[data-concept-i18n]")) node.textContent = language[node.dataset.conceptI18n];
    for (const card of cards) {
      const id = card.dataset.concept;
      card.querySelector("[data-concept-genre]").textContent = language.genres[id];
      card.setAttribute("aria-label", language.view.replace("{name}", games[id].name));
    }
    closeButton.setAttribute("aria-label", language.close);
    if (selected) showDetails(selected);
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
  cards.forEach(card => card.addEventListener("click", () => openCard(card)));
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
        const at = cards.indexOf(document.activeElement);
        cards[(at < 0 ? 0 : (at + direction + cards.length) % cards.length)].focus();
        pad.lastMove = performance.now();
      }
      pad.direction = direction;
      if (confirm && !pad.confirm && cards.includes(document.activeElement)) document.activeElement.click();
    }
    pad.cancel = cancel;
    pad.confirm = confirm;
  }, 70);
  updateLanguage();
})();
