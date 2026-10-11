(() => {
  const originalFetch = window.fetch.bind(window);
  const wasmPath = new URL("index.wasm", location.href).pathname;
  window.fetch = (input, options) => {
    const url = typeof input === "string" || input instanceof URL ? input : input.url;
    if (new URL(url, location.href).pathname !== wasmPath) return originalFetch(input, options);
    return Promise.all(Array.from({ length: 5 }, async (_, index) => {
      const response = await originalFetch(new URL(`index.wasm.part${index}`, location.href), options);
      if (!response.ok) throw new Error(`Type Flight runtime part ${index + 1} could not load (${response.status}).`);
      return response.arrayBuffer();
    })).then(parts => new Response(new Blob(parts, { type: "application/wasm" }), {
      status: 200,
      headers: { "content-type": "application/wasm", "content-length": "39513091" }
    }));
  };
})();
