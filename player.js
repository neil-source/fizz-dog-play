(() => {
  "use strict";

  const frame = document.querySelector("#game-frame");
  const loading = document.querySelector("#loading-message");
  const back = document.querySelector("#return-link");
  const backLabel = document.querySelector("#return-label");
  const title = document.querySelector("#game-title");
  const menu = document.querySelector("#game-menu");
  const menuLabel = document.querySelector("#menu-label");
  const list = document.querySelector("#game-list");
  const previous = document.querySelector("#previous-game");
  const next = document.querySelector("#next-game");
  const direct = document.querySelector("#open-direct");
  const openLabel = document.querySelector("#open-label");
  const labels = {
    en: { back: "All games", games: "Games", open: "Open separately", previous: "Previous game", next: "Next game", loading: "Loading game…", unavailable: "This game is unavailable", hold: "Hold OPTIONS to return to all games" },
    ja: { back: "ゲーム一覧", games: "ゲーム", open: "別画面で開く", previous: "前のゲーム", next: "次のゲーム", loading: "読み込み中…", unavailable: "このゲームは利用できません", hold: "OPTIONSを長押しでゲーム一覧へ" },
    es: { back: "Todos los juegos", games: "Juegos", open: "Abrir aparte", previous: "Juego anterior", next: "Juego siguiente", loading: "Cargando juego…", unavailable: "Este juego no está disponible", hold: "Mantén OPTIONS para volver a los juegos" },
    fr: { back: "Tous les jeux", games: "Jeux", open: "Ouvrir à part", previous: "Jeu précédent", next: "Jeu suivant", loading: "Chargement…", unavailable: "Ce jeu est indisponible", hold: "Maintiens OPTIONS pour revenir aux jeux" },
    de: { back: "Alle Spiele", games: "Spiele", open: "Separat öffnen", previous: "Vorheriges Spiel", next: "Nächstes Spiel", loading: "Spiel wird geladen…", unavailable: "Dieses Spiel ist nicht verfügbar", hold: "OPTIONS halten, um zurückzugehen" },
    pt: { back: "Todos os jogos", games: "Jogos", open: "Abrir separado", previous: "Jogo anterior", next: "Próximo jogo", loading: "Carregando jogo…", unavailable: "Este jogo está indisponível", hold: "Segure OPTIONS para voltar aos jogos" }
  };

  function language() {
    let preferred = "auto";
    try { preferred = JSON.parse(localStorage.getItem("fizz-dog-settings-v1") || "null")?.language || "auto"; }
    catch { /* Browser storage is optional. */ }
    if (preferred === "auto") preferred = (navigator.languages?.[0] || navigator.language || "en").split("-")[0];
    return labels[preferred] ? preferred : "en";
  }
  const copy = labels[language()];
  document.documentElement.lang = language();
  backLabel.textContent = copy.back;
  menuLabel.textContent = copy.games;
  openLabel.textContent = copy.open;
  previous.setAttribute("aria-label", copy.previous);
  next.setAttribute("aria-label", copy.next);
  direct.setAttribute("aria-label", copy.open);
  back.title = copy.hold;
  loading.textContent = copy.loading;
  const requestedGame = new URLSearchParams(location.search).get("game");
  if (requestedGame) back.href = `./?from=${encodeURIComponent(requestedGame)}`;

  let games = [];
  let current = null;

  function show(slug, push = false) {
    const index = games.findIndex((game) => game.slug === slug);
    if (index < 0) {
      title.textContent = copy.unavailable;
      loading.textContent = copy.unavailable;
      loading.hidden = false;
      frame.removeAttribute("src");
      return;
    }
    const game = games[index];
    if (push) history.pushState({ game: slug }, "", `./player.html?game=${encodeURIComponent(slug)}`);
    current = game;
    document.title = `${game.name} · Shitaky Games`;
    title.textContent = game.name;
    back.href = `./?from=${encodeURIComponent(slug)}`;
    direct.href = game.url;
    direct.setAttribute("aria-label", `${copy.open}: ${game.name}`);
    previous.dataset.game = games[(index - 1 + games.length) % games.length].slug;
    next.dataset.game = games[(index + 1) % games.length].slug;
    for (const link of list.querySelectorAll("a[data-game]")) {
      if (link.dataset.game === slug) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    }
    loading.textContent = copy.loading;
    loading.hidden = false;
    frame.title = game.name;
    frame.src = game.url;
  }

  frame.addEventListener("load", () => {
    if (!current) return;
    loading.hidden = true;
    frame.focus();
  });
  previous.addEventListener("click", () => show(previous.dataset.game, true));
  next.addEventListener("click", () => show(next.dataset.game, true));
  list.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-game]");
    if (!link) return;
    event.preventDefault();
    menu.open = false;
    show(link.dataset.game, true);
  });
  document.addEventListener("pointerdown", (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  window.addEventListener("popstate", () => show(new URLSearchParams(location.search).get("game")));

  let optionsHeldAt = 0;
  let exiting = false;
  setInterval(() => {
    let pad = null;
    try { pad = [...(navigator.getGamepads?.() || [])].find(Boolean); }
    catch { /* Controller support is optional. */ }
    const held = Boolean(pad?.buttons?.[9]?.pressed || pad?.buttons?.[9]?.value > 0.5);
    if (!held) { optionsHeldAt = 0; exiting = false; return; }
    if (!optionsHeldAt) optionsHeldAt = performance.now();
    if (!exiting && performance.now() - optionsHeldAt > 850) {
      exiting = true;
      location.assign(back.href);
    }
  }, 80);

  fetch("./index.html", { cache: "no-cache" }).then(async (response) => {
    if (!response.ok) throw new Error(`Gallery returned ${response.status}`);
    const gallery = new DOMParser().parseFromString(await response.text(), "text/html");
    games = [...gallery.querySelectorAll(".game-cover[data-portal][data-game-src]")].map((card) => ({
      slug: card.dataset.portal,
      name: card.querySelector("strong")?.textContent?.trim() || card.dataset.portal,
      url: new URL(card.dataset.gameSrc, location.href).href
    })).filter((game) => /^https?:$/.test(new URL(game.url).protocol));
    if (!games.length) throw new Error("The gallery has no games");
    list.replaceChildren(...games.map((game) => {
      const link = document.createElement("a");
      link.href = `./player.html?game=${encodeURIComponent(game.slug)}`;
      link.dataset.game = game.slug;
      link.textContent = game.name;
      return link;
    }));
    show(requestedGame);
  }).catch((error) => {
    title.textContent = copy.unavailable;
    loading.textContent = copy.unavailable;
    console.error(error);
  });
})();
