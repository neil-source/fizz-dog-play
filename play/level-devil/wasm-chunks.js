(() => {
  const overlay = document.createElement("div");
  overlay.id = "level-devil-loading";
  overlay.innerHTML = '<img src="index.png" alt="Level Devil opening room"><strong>LOADING LEVEL DEVIL…</strong>';
  overlay.style.cssText = "position:fixed;inset:0;z-index:15;display:grid;place-content:center;gap:14px;padding:3vw;background:#30242c;color:#fff1cf;text-align:center;font:900 18px system-ui,sans-serif;letter-spacing:.08em";
  overlay.querySelector("img").style.cssText = "display:block;width:min(100%,960px);max-height:80vh;object-fit:contain;image-rendering:pixelated";
  document.body.append(overlay);
  const originalFetch = window.fetch.bind(window);
  const wasmPath = new URL("index.wasm", location.href).pathname;
  window.fetch = (input, options) => {
    const url = typeof input === "string" || input instanceof URL ? input : input.url;
    if (new URL(url, location.href).pathname !== wasmPath) return originalFetch(input, options);
    return Promise.all(Array.from({ length: 5 }, async (_, index) => {
      const response = await originalFetch(new URL(`index.wasm.part${index}`, location.href), options);
      if (!response.ok) throw new Error(`Level Devil runtime part ${index + 1} could not load (${response.status}).`);
      return response.arrayBuffer();
    })).then(parts => new Response(new Blob(parts, { type: "application/wasm" }), {
      status: 200,
      headers: { "content-type": "application/wasm", "content-length": "39513091" }
    }));
  };
})();
