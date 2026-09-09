import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  getPlayerJellyAnimationKey,
  PLAYER_JELLY_ASSET_ID,
  PLAYER_JELLY_DIRECTION_ROWS,
  PLAYER_JELLY_WALK_SEQUENCE,
  resolvePlayerJellyFacing,
} from "../../src/game/assets/playerJellyRuntime.ts";

const manifest = JSON.parse(
  await readFile("public/assets/pixel/characters/player/player-jelly.manifest.json", "utf8"),
) as {
  frameWidth: number;
  frameHeight: number;
  directions: typeof PLAYER_JELLY_DIRECTION_ROWS;
  animations: { walk: { sequence: readonly number[] } };
};

assert.equal(PLAYER_JELLY_ASSET_ID, "character.player.jelly");
assert.equal(manifest.frameWidth, 24);
assert.equal(manifest.frameHeight, 32);
assert.deepEqual(manifest.directions, PLAYER_JELLY_DIRECTION_ROWS);
assert.deepEqual(manifest.animations.walk.sequence, PLAYER_JELLY_WALK_SEQUENCE);
assert.equal(getPlayerJellyAnimationKey("down", false), "player-jelly-idle-down");
assert.equal(getPlayerJellyAnimationKey("left", true), "player-jelly-walk-left");
assert.equal(getPlayerJellyAnimationKey("up", false), "player-jelly-idle-up");
assert.equal(resolvePlayerJellyFacing(-1, 0, "down"), "left");
assert.equal(resolvePlayerJellyFacing(1, 0, "down"), "right");
assert.equal(resolvePlayerJellyFacing(0, -1, "down"), "up");
assert.equal(resolvePlayerJellyFacing(0, 0, "right"), "right");
assert.equal(resolvePlayerJellyFacing(1, 1, "down"), "right");

console.log("Player runtime mapping: PASS");
