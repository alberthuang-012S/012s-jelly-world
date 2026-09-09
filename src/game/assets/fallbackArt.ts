import Phaser from "phaser";
import type { ArcadeGame } from "../../data/games";

export type NPCFallbackVariant = "manager" | "streamer" | "bot";

export function createPlayerJellyFallback(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-9, -32, 18, 4);
  g.fillRect(-16, -28, 32, 5);
  g.fillRect(-21, -23, 42, 8);
  g.fillRect(-23, -15, 46, 18);
  g.fillRect(-20, 3, 40, 7);

  g.fillStyle(0x4aaac5, 1);
  g.fillRect(-9, -28, 18, 3);
  g.fillRect(-15, -24, 30, 6);
  g.fillRect(-18, -17, 36, 18);
  g.fillRect(-15, 1, 30, 7);
  g.fillStyle(0x79d3dc, 1);
  g.fillRect(-12, -21, 24, 9);
  g.fillRect(-15, -12, 30, 12);
  g.fillStyle(0x9ae3e1, 0.9);
  g.fillRect(-8, -20, 9, 6);
  g.fillRect(-12, -12, 5, 5);
  g.fillStyle(0xc9f1dc, 0.85);
  g.fillRect(-8, -24, 6, 3);

  g.fillStyle(0x24324a, 1);
  g.fillRect(-10, -5, 5, 6);
  g.fillRect(5, -5, 5, 6);
  g.fillStyle(0xd36579, 1);
  g.fillRect(-4, 4, 8, 3);
  g.fillStyle(0x3c8fae, 1);
  g.fillRect(-17, 8, 7, 14);
  g.fillRect(-5, 8, 8, 20);
  g.fillRect(10, 8, 7, 15);
  g.fillStyle(0x67c5d3, 1);
  g.fillRect(-14, 10, 3, 10);
  g.fillRect(-2, 10, 3, 16);
  g.fillRect(12, 10, 3, 11);
  g.fillStyle(0x2f718c, 1);
  g.fillRect(-17, 19, 7, 4);
  g.fillRect(-5, 25, 8, 4);
  g.fillRect(10, 20, 7, 4);
  return g;
}

export function createNPCFallback(scene: Phaser.Scene, variant: NPCFallbackVariant): Phaser.GameObjects.Graphics {
  const g = new Phaser.GameObjects.Graphics(scene);
  if (variant === "manager") {
    drawManager(g);
  } else if (variant === "streamer") {
    drawStreamer(g);
  } else {
    drawBot(g);
  }
  return g;
}

export function createArcadeMachineFallback(
  scene: Phaser.Scene,
  gameData: ArcadeGame,
): Phaser.GameObjects.Graphics {
  const g = new Phaser.GameObjects.Graphics(scene);
  g.fillStyle(0x29394c, 0.42);
  g.fillRect(-43, 45, 86, 7);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-41, -44, 82, 89);
  g.fillStyle(0x395774, 1);
  g.fillRect(-36, -38, 72, 78);
  g.fillStyle(gameData.accent, 1);
  g.fillRect(-36, -38, 72, 11);
  g.fillStyle(0xe8efdd, 1);
  g.fillRect(-31, -23, 62, 35);
  g.fillStyle(0x203b58, 1);
  g.fillRect(-27, -19, 54, 27);
  g.fillStyle(gameData.accent, 0.32);
  g.fillRect(-23, -16, 46, 21);
  g.fillStyle(0xb1e8df, 0.75);
  g.fillRect(-21, -14, 17, 4);
  drawArcadeIcon(g, gameData.icon, gameData.accent);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-27, 19, 20, 5);
  g.fillRect(7, 19, 20, 5);
  g.fillStyle(0x66869a, 1);
  g.fillRect(-36, 27, 72, 13);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-24, 30, 48, 5);
  g.fillStyle(gameData.accent, 1);
  g.fillRect(-16, 38, 10, 5);
  g.fillRect(6, 38, 10, 5);
  g.fillStyle(0xffd66e, 1);
  g.fillRect(-15, 31, 4, 3);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-34, 39, 9, 6);
  g.fillRect(25, 39, 9, 6);
  return g;
}

function drawManager(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x29394c, 0.42);
  g.fillRect(-21, 30, 42, 6);
  g.fillRect(-13, 36, 26, 3);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-20, -2, 40, 34);
  g.fillRect(-24, 4, 8, 20);
  g.fillRect(16, 4, 8, 20);
  g.fillStyle(0x33465e, 1);
  g.fillRect(-16, 2, 32, 26);
  g.fillStyle(0x4a5e78, 1);
  g.fillRect(-14, 4, 5, 20);
  g.fillStyle(0xfff3db, 1);
  g.fillRect(-10, 0, 20, 23);
  g.fillStyle(0xd75b7a, 1);
  g.fillRect(-3, 1, 6, 15);
  g.fillStyle(0xffd16e, 1);
  g.fillRect(-1, 3, 3, 5);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-16, 28, 12, 8);
  g.fillRect(4, 28, 12, 8);
  g.fillStyle(0xf0c49c, 1);
  g.fillRect(-15, -31, 30, 26);
  g.fillRect(-11, -35, 22, 5);
  g.fillStyle(0x18243d, 1);
  g.fillRect(-17, -39, 34, 9);
  g.fillRect(-21, -33, 7, 10);
  g.fillRect(14, -35, 7, 9);
  g.fillStyle(0x3c4960, 1);
  g.fillRect(-10, -34, 12, 3);
  g.fillStyle(0x2d3851, 1);
  g.fillRect(-10, -20, 4, 5);
  g.fillRect(6, -20, 4, 5);
  g.fillStyle(0x9d4b55, 1);
  g.fillRect(-4, -10, 8, 3);
}

function drawStreamer(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x29394c, 0.42);
  g.fillRect(-22, 31, 44, 6);
  g.fillRect(-14, 37, 28, 3);
  g.fillStyle(0xd75b7a, 1);
  g.fillRect(-20, 2, 40, 30);
  g.fillRect(-27, 17, 7, 12);
  g.fillRect(20, 17, 7, 12);
  g.fillStyle(0xef7e91, 1);
  g.fillRect(-15, 5, 30, 22);
  g.fillStyle(0xc85d78, 1);
  g.fillRect(-14, 20, 28, 7);
  g.fillStyle(0xffd1ad, 1);
  g.fillRect(-14, -30, 28, 26);
  g.fillStyle(0x75483e, 1);
  g.fillRect(-19, -37, 38, 10);
  g.fillRect(-22, -31, 8, 32);
  g.fillRect(14, -31, 8, 36);
  g.fillRect(-16, -41, 30, 6);
  g.fillStyle(0x9b6552, 1);
  g.fillRect(-11, -35, 13, 3);
  g.fillStyle(0x2d3851, 1);
  g.fillRect(-9, -18, 4, 5);
  g.fillRect(5, -18, 4, 5);
  g.fillStyle(0xb84f68, 1);
  g.fillRect(-5, -9, 10, 3);
  g.fillStyle(0xfff3db, 1);
  g.fillRect(-5, 7, 10, 8);
  g.fillStyle(0xf0b3bd, 1);
  g.fillRect(-14, 27, 28, 5);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-8, 31, 6, 6);
  g.fillRect(2, 31, 6, 6);
  g.fillStyle(0x24324a, 1);
  g.fillRect(24, -2, 4, 17);
  g.fillRect(21, 14, 10, 3);
  g.fillStyle(0xffd36e, 1);
  g.fillRect(22, -7, 8, 7);
}

function drawBot(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x29394c, 0.42);
  g.fillRect(-23, 29, 46, 7);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-23, -22, 46, 49);
  g.fillRect(-18, -28, 36, 6);
  g.fillStyle(0x6dc9d3, 1);
  g.fillRect(-18, -17, 36, 39);
  g.fillStyle(0xf0f3df, 1);
  g.fillRect(-14, -13, 28, 21);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-10, -8, 5, 5);
  g.fillRect(5, -8, 5, 5);
  g.fillRect(-7, 1, 14, 3);
  g.fillStyle(0x6d62c8, 1);
  g.fillRect(-29, -9, 6, 18);
  g.fillRect(23, -9, 6, 18);
  g.fillStyle(0xffd66e, 1);
  g.fillRect(-3, -37, 6, 9);
  g.fillRect(-6, -41, 12, 4);
  g.fillStyle(0x24324a, 1);
  g.fillRect(-16, 26, 11, 7);
  g.fillRect(5, 26, 11, 7);
  g.fillStyle(0xb1e8df, 1);
  g.fillRect(-11, -12, 8, 3);
}

function drawArcadeIcon(
  g: Phaser.GameObjects.Graphics,
  icon: ArcadeGame["icon"],
  accent: number,
): void {
  g.lineStyle(2, accent, 1);
  if (icon === "grid") {
    g.strokeRect(-17, -11, 12, 9);
    g.strokeRect(5, -11, 12, 9);
    g.strokeRect(-17, 3, 12, 9);
    g.strokeRect(5, 3, 12, 9);
  } else if (icon === "cut") {
    g.lineBetween(-16, 11, 14, -12);
    g.fillStyle(accent, 1);
    g.fillRect(-19, 8, 7, 7);
    g.fillRect(11, -15, 7, 7);
  } else if (icon === "color") {
    g.fillStyle(0xf28b75, 1);
    g.fillRect(-17, -11, 12, 12);
    g.fillStyle(0x67c8df, 1);
    g.fillRect(5, -11, 12, 12);
    g.fillStyle(0x9b8ce9, 1);
    g.fillRect(-6, 4, 12, 12);
  } else {
    g.strokeRect(-17, -11, 17, 19);
    g.strokeRect(0, -11, 17, 19);
    g.fillStyle(accent, 1);
    g.fillRect(-3, -4, 6, 6);
  }
}
