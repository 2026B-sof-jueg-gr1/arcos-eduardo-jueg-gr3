import test from "node:test";
import assert from "node:assert/strict";
import {
  WORLD,
  PLATFORMS,
  GOAL,
  ZONES,
  jumpSpeed,
  zoneAt,
  formatTime,
  readBest,
  writeBest,
} from "../src/model.js";
test("charge is monotonic and capped", () => {
  assert.equal(jumpSpeed(-1), WORLD.minJump);
  assert.equal(jumpSpeed(2), WORLD.maxJump);
  assert.ok(jumpSpeed(0.5) < jumpSpeed(1));
  assert.ok(jumpSpeed(1) ** 2 / (2 * WORLD.gravity) > 160);
});
test("all 25 required ascents are analytically reachable", () => {
  assert.equal(ZONES.length, 5);
  assert.equal(GOAL.id, 25);
  for (let i = 1; i < PLATFORMS.length; i++) {
    const a = PLATFORMS[i - 1],
      b = PLATFORMS[i],
      rise = a.y - b.y,
      discriminant = WORLD.maxJump ** 2 - 2 * WORLD.gravity * rise;
    assert.ok(discriminant > 0, `height ${i}`);
    const travel =
      (WORLD.jumpX * (WORLD.maxJump + Math.sqrt(discriminant))) / WORLD.gravity;
    const minimumGap = Math.max(
      0,
      Math.abs(a.x - b.x) - (a.width + b.width) / 2 + WORLD.playerW,
    );
    assert.ok(travel > minimumGap, `gap ${i}`);
    assert.ok(b.x - b.width / 2 >= 0 && b.x + b.width / 2 <= WORLD.width);
  }
});
test("zone boundaries and clamping", () => {
  assert.equal(zoneAt(4000), 0);
  assert.equal(zoneAt(0), 4);
  for (let i = 0; i < 5; i++)
    assert.equal(zoneAt(WORLD.ground - i * 600 - 1), i);
});
test("long attempt formatting", () => {
  assert.equal(formatTime(0), "00:00");
  assert.equal(formatTime(61000), "01:01");
  assert.equal(formatTime(3600000), "60:00");
});
test("records tolerate missing, corrupt or denied storage", () => {
  assert.equal(readBest({ getItem: () => null }), null);
  for (const value of ["oops", "-9", "0", "Infinity"])
    assert.equal(readBest({ getItem: () => value }), null);
  assert.equal(readBest({ getItem: () => "5000" }), 5000);
  assert.equal(
    readBest({
      getItem: () => {
        throw Error("denied");
      },
    }),
    null,
  );
  assert.doesNotThrow(() =>
    writeBest(
      {
        setItem: () => {
          throw Error("denied");
        },
      },
      5000,
    ),
  );
});
