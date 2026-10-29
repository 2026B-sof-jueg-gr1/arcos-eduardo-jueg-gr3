import {
  WORLD,
  PLATFORMS,
  GOAL,
  ZONES,
  jumpSpeed,
  zoneAt,
  formatTime,
  heightAt,
  readBest,
  writeBest,
} from "./model.js";
const $ = (id) => document.getElementById(id);
const ui = Object.fromEntries(
  [
    "time",
    "jumps",
    "falls",
    "best",
    "altitude",
    "charge-fill",
    "charge-label",
    "overlay",
    "modal-tag",
    "modal-title",
    "modal-copy",
    "modal-foot",
    "primary",
    "secondary",
    "pause",
    "sound",
    "zone-title",
    "zone-count",
    "stage",
    "toast",
  ].map((k) => [k, $(k)]),
);
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const input = { left: false, right: false, jump: false };
let soundOn = false,
  audio,
  scene,
  best = null;
try {
  best = readBest(localStorage);
} catch {
  /* Storage can be disabled. */
}
ui.best.textContent = best ? formatTime(best) : "—";
function tone(freq, duration = 0.08, type = "sine", volume = 0.04) {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const o = audio.createOscillator(),
      g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      freq * 0.65,
      audio.currentTime + duration,
    );
    g.gain.setValueAtTime(volume, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + duration);
  } catch {
    /* Audio is optional. */
  }
}
function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ui.toast.classList.remove("show"), 2500);
}
function clearInput() {
  for (const key of Object.keys(input)) input[key] = false;
  document
    .querySelectorAll("[data-touch]")
    .forEach((b) => b.classList.remove("held"));
  if (scene) {
    scene.charging = false;
    scene.charge = 0;
    scene.wasJump = false;
  }
}
function modal(mode) {
  clearInput();
  ui.overlay.hidden = false;
  ui.secondary.hidden = true;
  ui["modal-foot"].textContent = "SIN PRISAS. SIN CHECKPOINTS.";
  if (mode === "paused") {
    ui["modal-tag"].textContent = "TÓMATE UN RESPIRO";
    ui["modal-title"].textContent = "La cima puede esperar.";
    ui["modal-copy"].textContent =
      "Tu ascenso está en pausa. Retoma el camino cuando quieras.";
    ui.primary.textContent = "Continuar el ascenso ↗";
    ui.primary.onclick = () => scene.resume();
    ui.secondary.hidden = false;
    ui.secondary.textContent = "Empezar de nuevo";
    ui.secondary.onclick = () => modal("reset");
  } else if (mode === "reset") {
    ui["modal-tag"].textContent = "VOLVER AL PRIMER PASO";
    ui["modal-title"].textContent = "¿Otro comienzo?";
    ui["modal-copy"].textContent =
      "Reiniciar devuelve al pie de la torre y pone a cero el tiempo, los saltos y las caídas. Tu récord se conserva.";
    ui.primary.textContent = "Sí, empezar de nuevo ↗";
    ui.primary.onclick = () => scene.startRun();
    ui.secondary.hidden = false;
    ui.secondary.textContent = "Seguir con este intento";
    ui.secondary.onclick = () => scene.resume();
  } else if (mode === "won") {
    ui["modal-tag"].textContent = "LA CORONA ES TUYA";
    ui["modal-title"].textContent = "Llegaste a la cima.";
    ui["modal-copy"].textContent =
      `Cinco zonas, ${scene.jumps} saltos y ${scene.falls} caídas. Tu tiempo: ${formatTime(scene.elapsed)}. Todo ese camino ya es tuyo.`;
    ui.primary.textContent = "Volver a intentarlo ↗";
    ui.primary.onclick = () => scene.startRun();
    ui["modal-foot"].textContent = scene.newRecord
      ? "NUEVO MEJOR TIEMPO EN ESTE DISPOSITIVO"
      : "CADA INTENTO CUENTA.";
  }
  requestAnimationFrame(() => ui.primary.focus({ preventScroll: true }));
}
class Climb extends Phaser.Scene {
  constructor() {
    super("Climb");
  }
  create() {
    scene = this;
    this.state = "ready";
    this.elapsed = 0;
    this.jumps = 0;
    this.falls = 0;
    this.zone = -1;
    this.highestZone = 0;
    this.charge = 0;
    this.charging = false;
    this.wasJump = false;
    this.airVX = 0;
    this.lastBounce = -Infinity;
    this.dropOrigin = WORLD.ground;
    this.fallCounted = false;
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    this.physics.world.setBoundsCollision(true, true, true, false);
    this.makeTextures();
    this.sky = this.add.graphics().setScrollFactor(0).setDepth(-20);
    this.detail = this.add.graphics().setDepth(-5);
    this.paintWorld();
    this.platforms = this.physics.add.staticGroup();
    for (const p of PLATFORMS) {
      const block = this.add.rectangle(p.x, p.y + 12, p.width, 24, 0x000000, 0);
      this.physics.add.existing(block, true);
      block.platformId = p.id;
      this.platforms.add(block);
    }
    this.player = this.physics.add
      .sprite(120, WORLD.ground, "knight")
      .setOrigin(0.5, 1)
      .setDepth(5);
    this.player.body.setSize(WORLD.playerW, WORLD.playerH).setOffset(5, 10);
    this.player.setCollideWorldBounds(true);
    this.player.body.setMaxVelocity(500, 1100);
    this.physics.add.collider(this.player, this.platforms, (_player, block) => {
      if (this.player.body.blocked.down) this.lastPlatform = block.platformId;
    });
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.startFollow(
      this.player,
      true,
      1,
      reducedMotion ? 1 : 0.14,
      0,
      -100,
    );
    this.cameras.main.setScroll(0, 2700);
    this.chargeRing = this.add.graphics().setDepth(4);
    this.crown = this.add.image(GOAL.x, GOAL.y - 45, "crown").setDepth(3);
    this.goalGlow = this.add
      .circle(GOAL.x, GOAL.y - 44, 34, 0xe2bd70, 0.1)
      .setDepth(1);
    if (!reducedMotion)
      this.tweens.add({
        targets: [this.crown, this.goalGlow],
        y: "-=7",
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    this.physics.pause();
    this.paintSky(0);
    this.renderUI();
    this.bindControls();
    ui.primary.onclick = () => this.startRun();
    ui.primary.focus({ preventScroll: true });
    this.game.events.on("blur", () => this.pauseRun());
    if (new URLSearchParams(location.search).has("qa"))
      window.__CIMA__ = {
        game: this.game,
        scene: this,
        input,
        WORLD,
        PLATFORMS,
      };
  }
  makeTextures() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    for (const crouch of [false, true]) {
      g.clear();
      const d = crouch ? 5 : 0;
      g.fillStyle(0x233442);
      g.fillRect(7, 36, 7, 8);
      g.fillRect(19, 36, 7, 8);
      g.fillStyle(0xa85442);
      g.fillRect(4, 17 + d, 18, 18 - d);
      g.fillRect(2, 29, 8, 9);
      g.fillStyle(0xdbc89b);
      g.fillRect(10, 24 + d, 15, 12 - d);
      g.fillStyle(0x435d66);
      g.fillRect(8, 9 + d, 19, 17);
      g.fillStyle(0xb8c5be);
      g.fillRect(9, 7 + d, 16, 14);
      g.fillRect(6, 14 + d, 23, 9);
      g.fillStyle(0x263d48);
      g.fillRect(13, 14 + d, 14, 4);
      g.fillStyle(0xe0ba67);
      g.fillRect(11, 6 + d, 4, 4);
      g.fillRect(10, 2 + d, 3, 5);
      g.fillRect(16, 3 + d, 3, 4);
      g.fillStyle(0x839a98);
      g.fillRect(24, 24 + d, 5, 10 - d);
      g.fillStyle(0xe1d8b5);
      g.fillRect(9, 25 + d, 4, 8 - d);
      g.generateTexture(crouch ? "crouch" : "knight", 32, 44);
    }
    g.clear();
    g.fillStyle(0xf2d38b);
    g.fillPoints(
      [
        { x: 2, y: 4 },
        { x: 10, y: 10 },
        { x: 16, y: 0 },
        { x: 22, y: 10 },
        { x: 30, y: 4 },
        { x: 27, y: 24 },
        { x: 5, y: 24 },
      ],
      true,
    );
    g.fillStyle(0xb47a40);
    g.fillRect(5, 24, 22, 4);
    g.fillStyle(0xeff5e5);
    g.fillRect(15, 13, 3, 5);
    g.generateTexture("crown", 32, 30);
    g.destroy();
  }
  paintSky(zone) {
    this.zone = zone;
    const c = ZONES[zone],
      g = this.sky;
    g.clear();
    g.fillStyle(c.sky);
    g.fillRect(0, 0, 800, 600);
    g.fillStyle(zone === 4 ? 0xeed7a0 : 0xe9e6c7, zone === 4 ? 0.95 : 0.65);
    g.fillCircle(646, 106, zone === 4 ? 32 : 43);
    if (zone === 4) {
      g.fillStyle(0xe4e1cd, 0.7);
      for (let i = 0; i < 38; i++)
        g.fillRect((i * 137 + 71) % 800, (i * 83 + 20) % 330, 2, 2);
    } else {
      g.fillStyle(0xf5f3dd, 0.3);
      for (let i = 0; i < 5; i++) {
        const x = i * 185 - 30,
          y = 90 + (i % 3) * 53;
        g.fillRect(x, y, 100, 12);
        g.fillRect(x + 20, y - 8, 50, 10);
      }
    }
    g.fillStyle(c.far);
    g.fillPoints(
      [
        { x: 0, y: 380 },
        { x: 70, y: 280 },
        { x: 180, y: 340 },
        { x: 310, y: 180 },
        { x: 450, y: 340 },
        { x: 590, y: 230 },
        { x: 800, y: 350 },
        { x: 800, y: 600 },
        { x: 0, y: 600 },
      ],
      true,
    );
    g.fillStyle(c.near, 0.6);
    g.fillPoints(
      [
        { x: 0, y: 485 },
        { x: 150, y: 345 },
        { x: 260, y: 420 },
        { x: 420, y: 330 },
        { x: 580, y: 470 },
        { x: 710, y: 370 },
        { x: 800, y: 460 },
        { x: 800, y: 600 },
        { x: 0, y: 600 },
      ],
      true,
    );
    g.fillStyle(c.sky, 0.18);
    for (let i = 0; i < 4; i++) g.fillRect(0, 450 + i * 38, 800, 15 + i * 7);
    ui.stage.classList.toggle("night", zone === 4);
  }
  paintWorld() {
    const g = this.detail;
    for (const p of PLATFORMS) {
      const c = ZONES[p.zone],
        left = p.x - p.width / 2;
      g.fillStyle(0x142d3d, 0.15);
      g.fillRect(left + 5, p.y + 9, p.width, 27);
      g.fillStyle(c.stone);
      g.fillRect(left, p.y, p.width, 24);
      g.fillStyle(c.top);
      g.fillRect(left, p.y, p.width, 5);
      g.fillStyle(0x1c3840, 0.22);
      g.fillRect(left, p.y + 20, p.width, 4);
      for (let j = 16; j < p.width; j += 31) {
        g.fillRect(left + j, p.y + 9 + (j % 2) * 3, 13, 2);
        g.fillRect(left + j + 5, p.y + 12, 2, 8);
      }
      g.fillStyle(c.top, 0.7);
      for (let j = 8; j < p.width - 8; j += 19)
        g.fillRect(left + j, p.y - 3, 3, 4);
      if (p.id % 5 === 1 && p.id > 1) {
        const y = p.y + 45;
        g.fillStyle(c.stone, 0.4);
        g.fillRect(left + 15, y, 22, 90);
        g.fillRect(left + 10, y, 32, 9);
        g.fillRect(left + 8, y + 81, 36, 9);
      }
      if (p.zone === 1 && p.id % 2 === 0) {
        g.fillStyle(0x365d54);
        g.fillRect(left + 15, p.y - 46, 7, 46);
        g.fillStyle(0x477c67);
        g.fillTriangle(
          left - 8,
          p.y - 35,
          left + 44,
          p.y - 35,
          left + 18,
          p.y - 86,
        );
        g.fillTriangle(
          left - 2,
          p.y - 51,
          left + 38,
          p.y - 51,
          left + 18,
          p.y - 96,
        );
      }
      if (p.zone === 2 && p.id % 2 === 1) {
        g.fillStyle(c.stone);
        g.fillRect(left + 12, p.y - 49, 13, 49);
        g.fillRect(left + 8, p.y - 53, 22, 7);
        g.fillStyle(c.top);
        g.fillRect(left + 8, p.y - 55, 22, 3);
      }
      if (p.id === 0) {
        g.fillStyle(0x3d615b);
        g.fillRect(38, p.y - 50, 7, 50);
        g.fillStyle(0xc39155);
        g.fillRect(20, p.y - 54, 78, 28);
        g.fillStyle(0x553f37);
        g.fillRect(27, p.y - 44, 42, 3);
        g.fillTriangle(71, p.y - 48, 81, p.y - 43, 71, p.y - 38);
      }
    }
    g.lineStyle(1, 0xf2e9ca, 0.15);
    for (let z = 1; z < 5; z++) {
      const y = WORLD.ground - z * 600 + 35;
      g.lineBetween(0, y, 800, y);
    }
  }
  bindControls() {
    const mapping = {
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
      Space: "jump",
    };
    this.heldCodes = new Set();
    window.addEventListener("keydown", (e) => {
      if (mapping[e.code]) {
        if (e.target instanceof HTMLButtonElement && this.state !== "playing")
          return;
        e.preventDefault();
        this.heldCodes.add(e.code);
        input[mapping[e.code]] = true;
      }
      if (e.repeat) return;
      if (e.code === "Escape") {
        e.preventDefault();
        if (this.state === "playing") this.pauseRun();
        else if (this.state === "paused") this.resume();
      }
      if (
        e.code === "KeyR" &&
        (this.state === "playing" || this.state === "paused")
      ) {
        e.preventDefault();
        this.pauseRun();
        modal("reset");
      }
      if (e.code === "KeyM") toggleSound();
    });
    window.addEventListener("keyup", (e) => {
      if (mapping[e.code]) {
        e.preventDefault();
        this.heldCodes.delete(e.code);
        input[mapping[e.code]] = [...this.heldCodes].some(
          (code) => mapping[code] === mapping[e.code],
        );
      }
    });
    document.querySelectorAll("[data-touch]").forEach((button) => {
      button.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (this.state !== "playing") return;
        button.setPointerCapture(e.pointerId);
        input[button.dataset.touch] = true;
        button.classList.add("held");
      });
      const release = (e) => {
        e.preventDefault();
        input[button.dataset.touch] = false;
        button.classList.remove("held");
      };
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
    });
    window.addEventListener("blur", () => this.pauseRun());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pauseRun();
    });
    ui.pause.onclick = () =>
      this.state === "playing" ? this.pauseRun() : this.resume();
    ui.sound.onclick = toggleSound;
    $("fullscreen").onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.querySelector(".play-area").requestFullscreen();
      } catch {
        toast("La pantalla completa no está disponible en este navegador.");
      }
    };
  }
  startRun() {
    clearInput();
    clearTimeout(toast.timer);
    ui.toast.classList.remove("show");
    ui.toast.textContent = "";
    this.lastBounce = -Infinity;
    this.chargeRing.clear();
    this.heldCodes.clear();
    this.state = "playing";
    this.elapsed = 0;
    this.jumps = 0;
    this.falls = 0;
    this.highestZone = 0;
    this.highest = 0;
    this.airVX = 0;
    this.dropOrigin = WORLD.ground;
    this.fallCounted = false;
    this.lastPlatform = 0;
    this.newRecord = false;
    this.wasGrounded = false;
    this.player.body.reset(120, WORLD.ground);
    this.player.setVelocity(0, 0).setTexture("knight").setFlipX(false);
    this.physics.resume();
    ui.overlay.hidden = true;
    ui.pause.disabled = false;
    ui.pause.textContent = "Ⅱ Pausa";
    ui.primary.blur();
    this.cameras.main.setScroll(0, 2700);
    this.paintSky(0);
    this.renderUI();
    tone(420, 0.1);
  }
  pauseRun() {
    if (this.state !== "playing") return;
    this.state = "paused";
    this.physics.pause();
    this.heldCodes.clear();
    modal("paused");
    ui.pause.textContent = "↗ Seguir";
    this.renderUI();
  }
  resume() {
    if (this.state !== "paused") return;
    clearInput();
    this.heldCodes.clear();
    this.state = "playing";
    ui.overlay.hidden = true;
    ui.primary.blur();
    this.physics.resume();
    ui.pause.textContent = "Ⅱ Pausa";
  }
  win() {
    if (this.state !== "playing") return;
    this.state = "won";
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.newRecord = !best || this.elapsed < best;
    if (this.newRecord) {
      best = this.elapsed;
      try {
        writeBest(localStorage, best);
      } catch {}
      ui.best.textContent = formatTime(best);
    }
    ui.pause.disabled = true;
    this.renderUI();
    tone(880, 0.4, "triangle");
    modal("won");
  }
  update(_time, delta) {
    if (this.state !== "playing") return;
    const dt = Math.min(delta, 50),
      body = this.player.body,
      grounded = body.blocked.down || body.touching.down;
    this.elapsed += dt;
    if (grounded) {
      if (!this.wasGrounded) {
        tone(this.fallCounted ? 140 : 220, 0.05, "triangle");
        this.airVX = 0;
        this.dropOrigin = body.bottom;
        this.fallCounted = false;
      }
      const dir = Number(input.right) - Number(input.left);
      if (dir) this.player.setFlipX(dir < 0);
      if (input.jump && !this.wasJump) {
        this.charging = true;
        this.charge = 0;
      }
      if (this.charging) {
        this.charge = Math.min(1, this.charge + dt / WORLD.chargeMs);
        body.setVelocityX(0);
        this.player.setTexture("crouch");
        if (!input.jump) {
          this.airVX = dir * WORLD.jumpX;
          body.setVelocity(this.airVX, -jumpSpeed(this.charge));
          this.dropOrigin = body.bottom;
          this.jumps++;
          this.charging = false;
          this.player.setTexture("knight");
          tone(300 + this.charge * 250, 0.12, "square", 0.018);
        }
      } else body.setVelocityX(dir * WORLD.walk);
    } else {
      this.charging = false;
      this.charge = 0;
      this.player.setTexture("knight");
      if (
        (body.blocked.left || body.blocked.right) &&
        this.time.now - this.lastBounce > 100
      ) {
        this.airVX = -(this.airVX || (body.blocked.left ? -180 : 180)) * 0.7;
        this.lastBounce = this.time.now;
        tone(120, 0.04);
      }
      body.setVelocityX(this.airVX);
      this.dropOrigin = Math.min(this.dropOrigin, body.bottom);
      if (!this.fallCounted && body.bottom - this.dropOrigin > 190) {
        this.falls++;
        this.fallCounted = true;
      }
    }
    this.wasJump = input.jump;
    this.wasGrounded = grounded;
    if (body.top > WORLD.height + 80) {
      this.player.body.reset(120, WORLD.ground);
      this.player.setVelocity(0, 0);
      this.airVX = 0;
      this.falls++;
    }
    const z = zoneAt(body.bottom);
    if (z !== this.zone) {
      this.paintSky(z);
      if (z > this.highestZone) {
        this.highestZone = z;
        toast(`${String(z + 1).padStart(2, "0")} · ${ZONES[z].name}`);
        tone(660, 0.16, "triangle");
      }
    }
    this.highest = Math.max(this.highest || 0, heightAt(body.center.y));
    this.chargeRing.clear();
    if (this.charging) {
      this.chargeRing.lineStyle(2, 0xf2d18b, 0.8);
      this.chargeRing.strokeCircle(
        this.player.x,
        this.player.y - 17,
        25 + this.charge * 8,
      );
    }
    if (
      grounded &&
      this.lastPlatform === GOAL.id &&
      Math.abs(this.player.x - GOAL.x) < GOAL.width / 2
    )
      this.win();
    this.renderUI();
  }
  renderUI() {
    const body = this.player.body,
      z = Math.max(0, this.zone);
    ui.time.textContent = formatTime(this.elapsed);
    ui.jumps.textContent = this.jumps;
    ui.falls.textContent = this.falls;
    ui.altitude.textContent = String(heightAt(body.center.y)).padStart(3, "0");
    ui["charge-fill"].style.width = `${this.charging ? this.charge * 100 : 0}%`;
    ui["charge-label"].textContent = this.charging
      ? `${Math.round(this.charge * 100)}%`
      : "LISTO";
    ui["zone-title"].textContent = `0${z + 1} · ${ZONES[z].tag}`;
    ui["zone-count"].textContent = `0${z + 1} / 05`;
    document.querySelectorAll("#zone-list li").forEach((li, i) => {
      li.classList.toggle("active", i === z);
      li.classList.toggle("visited", i < this.highestZone);
      if (i === z) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
  }
}
function toggleSound() {
  soundOn = !soundOn;
  ui.sound.textContent = soundOn ? "Sonido ON" : "Sonido OFF";
  ui.sound.setAttribute("aria-pressed", String(soundOn));
  ui.sound.setAttribute(
    "aria-label",
    soundOn ? "Silenciar sonido" : "Activar sonido",
  );
  if (soundOn) tone(440);
}
new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 800,
  height: 600,
  backgroundColor: "#aecad2",
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: WORLD.gravity },
      debug: false,
      fps: 60,
      fixedStep: true,
    },
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
  scene: [Climb],
  callbacks: {
    postBoot: (game) => {
      game.canvas.setAttribute("aria-hidden", "true");
    },
  },
});
