import Phaser from "phaser";
import type { LobbyLayout } from "./WorldDecor";

export const WORLD_WIDTH = 1536;
export const WORLD_HEIGHT = 1024;
export const WORLD_BOUNDS = new Phaser.Geom.Rectangle(270, 180, 1220, 800);

// All coordinates use the production town plate's 1536 × 1024 coordinate system.
export function renderTownV2(scene: Phaser.Scene): LobbyLayout {
  scene.add.image(0, 0, "town-v2").setOrigin(0).setDepth(0);
  const footprints = [
    [160, 100, 340, 225], [1035, 100, 300, 240],
    // The sign panel is above ground; only its bottom support blocks movement.
    // Leave a continuous passage behind it instead of blocking the whole artwork.
    [650, 408, 238, 20], [470, 637, 600, 215],
    // INFO roof overhang is visual only; collide with the ground-level walls.
    [1148, 540, 238, 115],
    // Keep the visible eastern bypass open, while blocking the outer cliff.
    [1470, 580, 66, 444], [1400, 810, 70, 214],
    [270, 0, 350, 100], [925, 0, 450, 100], [270, 380, 20, 120],
    [380, 390, 155, 83],
    // The INFO bench was removed; only the remaining shrub base blocks movement.
    [1302, 732, 31, 35],
    [1200, 800, 200, 180], [270, 570, 95, 355],
    [627, 425, 83, 53], [831, 426, 76, 53],
  ];
  // Only the planted base blocks movement. Canopies overhang the paving and
  // must not create invisible walls across the plaza or its turning corners.
  footprints.push(
    [474, 594, 46, 43], [540, 597, 400, 40], [964, 594, 44, 43],
    [450, 966, 165, 14], [977, 966, 140, 14],
  );
  const solids = footprints.map(([x, y, w, h]) => new Phaser.Geom.Rectangle(x, y, w, h));
  // Facade overlays share their ground depth with actors to preserve occlusion.
  const facades = [[160, 100, 340, 230], [1035, 100, 300, 245],
    [635, 250, 265, 177], [1128, 435, 280, 220], [470, 637, 600, 215]];
  facades.forEach(([x, y, w, h], i) => {
    const frame = `facade-${i}`;
    if (!scene.textures.get("town-v2").has(frame)) scene.textures.get("town-v2").add(frame, 0, x, y, w, h);
    const facade = scene.add.image(x, y, "town-v2", frame).setOrigin(0).setDepth(y + h);
    facade.setData("occludingFacade", true);
    if (i === 2) facade.setName("event-board-foreground");
    if (i === 3) {
      // The INFO atlas rectangle includes road in its upper corners. Mask that
      // empty space out so it cannot cut a walking character along a straight edge.
      const silhouette = scene.make.graphics({ x: 0, y: 0 }, false);
      silhouette.fillStyle(0xffffff);
      silhouette.fillPoints([
        new Phaser.Geom.Point(1180, 435), new Phaser.Geom.Point(1370, 435),
        new Phaser.Geom.Point(1408, 480), new Phaser.Geom.Point(1408, 540),
        new Phaser.Geom.Point(1386, 532), new Phaser.Geom.Point(1386, 655),
        new Phaser.Geom.Point(1148, 655), new Phaser.Geom.Point(1148, 532),
        new Phaser.Geom.Point(1128, 540), new Phaser.Geom.Point(1128, 482),
      ], true);
      const mask = silhouette.createGeometryMask();
      facade.setMask(mask);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        facade.clearMask();
        mask.destroy();
        silhouette.destroy();
      });
    }
  });
  for (let i = 0; i < 16; i++) {
    const x = 380 + (i * 127) % 710, y = 370 + (i * 83) % 260;
    const mote = scene.add.rectangle(x, y, 3, 3, i % 3 ? 0xfff4b0 : 0xffffff, 0.7).setDepth(1100);
    scene.tweens.add({ targets: mote, y: y - 22, x: x + 12, alpha: 0, duration: 2600 + i * 130, delay: i * 190, repeat: -1, yoyo: true });
  }
  return {
    solids, spawn: { x: 768, y: 545 }, announcement: { x: 768, y: 440 },
    npcPositions: { achang: { x: 320, y: 355 }, xindi: { x: 1185, y: 375 }, bot: { x: 1268, y: 678 } },
    arcadePositions: [579, 700, 836, 957].map(x => ({ x, y: 843 })),
  };
}
