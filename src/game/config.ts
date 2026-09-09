import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { LobbyScene } from "./scenes/LobbyScene";

export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#9ddfc8",
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  scene: [BootScene, LobbyScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
  },
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
    powerPreference: "high-performance",
  },
  input: {
    activePointers: 3,
  },
};
