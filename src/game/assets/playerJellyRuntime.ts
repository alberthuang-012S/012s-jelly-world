export const PLAYER_JELLY_ASSET_ID = "character.player.jelly" as const;

export const PLAYER_JELLY_DIRECTIONS = ["down", "left", "right", "up"] as const;
export type PlayerJellyFacing = (typeof PLAYER_JELLY_DIRECTIONS)[number];

export const PLAYER_JELLY_DIRECTION_ROWS: Readonly<Record<PlayerJellyFacing, number>> = {
  down: 0,
  left: 1,
  right: 2,
  up: 3,
};

export const PLAYER_JELLY_WALK_SEQUENCE = [1, 0, 2, 3, 0] as const;

export function getPlayerJellyAnimationKey(facing: PlayerJellyFacing, moving: boolean): string {
  return `player-jelly-${moving ? "walk" : "idle"}-${facing}`;
}

export function resolvePlayerJellyFacing(
  movementX: number,
  movementY: number,
  currentFacing: PlayerJellyFacing,
): PlayerJellyFacing {
  if (movementX === 0 && movementY === 0) {
    return currentFacing;
  }

  if (Math.abs(movementX) >= Math.abs(movementY) && movementX !== 0) {
    return movementX < 0 ? "left" : "right";
  }

  return movementY < 0 ? "up" : "down";
}
