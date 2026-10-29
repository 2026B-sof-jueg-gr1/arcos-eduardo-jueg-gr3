export const WORLD = {
  width: 800,
  height: 3300,
  ground: 3240,
  gravity: 1300,
  chargeMs: 800,
  walk: 150,
  jumpX: 250,
  minJump: 250,
  maxJump: 690,
  playerW: 22,
  playerH: 34,
};
export const ZONES = [
  {
    name: "El primer paso",
    tag: "PRADERA",
    sky: 0xaecad2,
    far: 0x7d9fa5,
    near: 0x526f77,
    stone: 0x617b73,
    top: 0x9fb872,
  },
  {
    name: "Raíces antiguas",
    tag: "BOSQUE",
    sky: 0x8eb7ad,
    far: 0x638c86,
    near: 0x365f60,
    stone: 0x5b7770,
    top: 0x9bc18b,
  },
  {
    name: "Lo que queda",
    tag: "RUINAS",
    sky: 0xa4adc5,
    far: 0x7d88a7,
    near: 0x535d7f,
    stone: 0x778098,
    top: 0xb5b6c5,
  },
  {
    name: "Sobre las nubes",
    tag: "CIELO",
    sky: 0xc3cddd,
    far: 0x9daec7,
    near: 0x7d93b2,
    stone: 0x7d8fa3,
    top: 0xe0e4dd,
  },
  {
    name: "La última luz",
    tag: "CUMBRE",
    sky: 0x2f405f,
    far: 0x344b68,
    near: 0x233752,
    stone: 0x63748a,
    top: 0xdec68c,
  },
];
const centers = [
  300, 490, 660, 470, 270, 100, 290, 480, 670, 490, 300, 110, 290, 480, 660,
  470, 280, 110, 300, 490, 670, 480, 290, 120, 310,
];
export const PLATFORMS = [
  { id: 0, x: 400, y: WORLD.ground, width: 800, zone: 0 },
  ...centers.map((x, i) => ({
    id: i + 1,
    x,
    y: WORLD.ground - (i + 1) * 120,
    width: 158 - Math.floor(i / 5) * 12,
    zone: Math.min(4, Math.floor(i / 5)),
  })),
];
export const GOAL = PLATFORMS.at(-1);
export const jumpSpeed = (charge) =>
  WORLD.minJump +
  (WORLD.maxJump - WORLD.minJump) * Math.max(0, Math.min(1, charge));
export const zoneAt = (y) =>
  Math.max(0, Math.min(4, Math.floor((WORLD.ground - y) / 600)));
export const formatTime = (ms) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
};
export const heightAt = (y) =>
  Math.max(0, Math.round((WORLD.ground - y - WORLD.playerH / 2) / 10));
export function readBest(storage) {
  try {
    const n = Number(storage.getItem("cima.best.v1"));
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
export function writeBest(storage, ms) {
  try {
    storage.setItem("cima.best.v1", String(ms));
  } catch {
    /* El juego también funciona sin almacenamiento. */
  }
}
