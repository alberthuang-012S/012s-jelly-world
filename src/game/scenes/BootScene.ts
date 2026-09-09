import Phaser from "phaser";
import { preloadPixelAssets, registerPixelAnimations } from "../assets/assetPipeline";

export class BootScene extends Phaser.Scene {
  public constructor() {
    super("BootScene");
  }

  public preload(): void {
    preloadPixelAssets(this);
  }

  public create(): void {
    registerPixelAnimations(this);
    this.scene.start("LobbyScene");
  }
}
