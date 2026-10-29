/* CDN según el taller, con respaldo local fijado a la misma versión. */
(() => {
  let ready = false,
    fallback;
  const boot = () => {
    if (ready) return;
    ready = true;
    clearTimeout(fallback);
    import("./game.js").catch(fail);
  };
  const fail = () => {
    document.querySelector("#modal-title").textContent = "No se pudo iniciar";
    document.querySelector("#modal-copy").hidden = false;
    document.querySelector("#modal-copy").textContent =
      "Recarga la página. Si persiste, revisa que los archivos del juego se hayan publicado completos.";
    document.querySelector("#primary").textContent = "Recargar";
    document.querySelector("#primary").onclick = () => location.reload();
  };
  const local = () => {
    if (ready) return;
    const s = document.createElement("script");
    s.src = "./assets/vendor/phaser.min.js";
    s.onload = boot;
    s.onerror = fail;
    document.head.append(s);
  };
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js";
  s.onload = boot;
  s.onerror = () => {
    clearTimeout(fallback);
    local();
  };
  document.head.append(s);
  fallback = setTimeout(local, 2500);
})();
