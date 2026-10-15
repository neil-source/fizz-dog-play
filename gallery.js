(() => {
  "use strict";

  const search = document.querySelector("#game-search");
  const cards = [...document.querySelectorAll(".game-cover")];
  const chips = [...document.querySelectorAll(".category-chip")];
  const navLinks = [...document.querySelectorAll(".store-nav a")];
  const charts = document.querySelector("#top-charts");
  const noResults = document.querySelector("#no-results");
  let activeFilter = "all";

  function visibleCards() { return cards.filter((card) => !card.hidden); }
  function selectNav(hash) {
    for (const link of navLinks) link.classList.toggle("active", link.getAttribute("href") === hash);
  }
  function update() {
    const query = search.value.trim().toLocaleLowerCase();
    const freeLabel = window.FizzSettings?.t("freeToPlay") || "Free · Play in browser";
    for (const card of cards) {
      const terms = `${card.querySelector("strong")?.textContent || ""} ${card.querySelector(".cover-footer span")?.textContent || ""}`.toLocaleLowerCase();
      card.hidden = (activeFilter !== "all" && card.dataset.category !== activeFilter) || !terms.includes(query);
      card.querySelector(".cover-footer").dataset.free = freeLabel;
    }
    charts.hidden = Boolean(query) || activeFilter !== "all";
    for (const chip of chips) {
      const selected = chip.dataset.filter === activeFilter;
      chip.classList.toggle("active", selected);
      chip.setAttribute("aria-pressed", String(selected));
    }
    noResults.hidden = visibleCards().length > 0;
  }

  search.addEventListener("input", () => {
    activeFilter = "all";
    selectNav("#all-games");
    document.querySelector("#all-games").scrollIntoView({ block: "start" });
    update();
  });
  search.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { search.value = ""; update(); search.blur(); }
  });
  window.addEventListener("fizz-settings-change", update);
  for (const chip of chips) chip.addEventListener("click", () => {
    activeFilter = chip.dataset.filter;
    selectNav("#categories");
    search.value = "";
    update();
    document.querySelector("#all-games").scrollIntoView({ block: "start" });
  });
  for (const anchor of document.querySelectorAll('.store-nav a[href="#all-games"],.store-nav a[href="#top-charts"]')) {
    anchor.addEventListener("click", () => {
      selectNav(anchor.getAttribute("href"));
      activeFilter = "all";
      search.value = "";
      update();
    });
  }
  document.querySelector('.store-nav a[href="#categories"]').addEventListener("click", () => selectNav("#categories"));

  const returnedSlug = new URLSearchParams(location.search).get("from");
  const returnedCard = cards.find((card) => card.dataset.portal === returnedSlug);
  if (returnedCard) {
    requestAnimationFrame(() => {
      returnedCard.classList.add("returned");
      returnedCard.focus({ preventScroll: true });
      returnedCard.scrollIntoView({ block: "center" });
      history.replaceState(history.state, "", location.pathname + location.hash);
      setTimeout(() => returnedCard.classList.remove("returned"), 2500);
    });
  }

  let lastMove = 0;
  let wasConfirm = false;
  let wasOptions = false;
  function nextCard(direction) {
    const choices = visibleCards();
    if (!choices.length) return null;
    const current = document.activeElement;
    if (!choices.includes(current)) return choices[0];
    const from = current.getBoundingClientRect();
    const x = from.left + from.width / 2;
    const y = from.top + from.height / 2;
    const candidates = choices.filter((card) => card !== current).map((card) => {
      const rect = card.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - x;
      const dy = rect.top + rect.height / 2 - y;
      const primary = direction === "right" ? dx : direction === "left" ? -dx : direction === "down" ? dy : -dy;
      const secondary = direction === "left" || direction === "right" ? Math.abs(dy) : Math.abs(dx);
      return { card, primary, score: primary + secondary * 2 };
    }).filter((item) => item.primary > 8).sort((a, b) => a.score - b.score);
    if (candidates.length) return candidates[0].card;
    return direction === "left" || direction === "up" ? choices.at(-1) : choices[0];
  }
  setInterval(() => {
    let pad;
    try { pad = [...(navigator.getGamepads?.() || [])].find(Boolean); }
    catch { return; }
    if (!pad) return;
    if (document.querySelector("#settings-dialog")?.open) { window.FizzSettings?.handleGamepad(pad); return; }
    if (document.querySelector("#request-dialog")?.open) return;
    const pressed = (index) => Boolean(pad.buttons?.[index]?.pressed);
    const options = pressed(9);
    if (options && !wasOptions) window.FizzSettings?.open();
    wasOptions = options;
    const horizontal = Number(pressed(15) || (pad.axes?.[0] || 0) > .55) - Number(pressed(14) || (pad.axes?.[0] || 0) < -.55);
    const vertical = Number(pressed(13) || (pad.axes?.[1] || 0) > .55) - Number(pressed(12) || (pad.axes?.[1] || 0) < -.55);
    const direction = Math.abs(horizontal) >= Math.abs(vertical) && horizontal ? horizontal > 0 ? "right" : "left" : vertical ? vertical > 0 ? "down" : "up" : null;
    if (direction && performance.now() - lastMove > 220) {
      nextCard(direction)?.focus();
      lastMove = performance.now();
    }
    const confirm = pressed(0);
    if (confirm && !wasConfirm && document.activeElement?.matches(".game-cover")) document.activeElement.click();
    wasConfirm = confirm;
  }, 70);

  update();
  window.__shitakyGallery = { cards, visibleCards, update };
})();
