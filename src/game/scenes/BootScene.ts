import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  private assetsFailed = false;
  public constructor() {
    super("BootScene");
  }

  public preload(): void {
    this.load.image("town-v2", `${import.meta.env.BASE_URL}assets/v2/town-unified-refined.png`);
    this.load.spritesheet("jelly-preferred", `${import.meta.env.BASE_URL}assets/v2/jelly-preferred.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet("npcs-v2", `${import.meta.env.BASE_URL}assets/v2/npcs-outfits.png`, { frameWidth: 512, frameHeight: 1024 });
    this.load.on("loaderror", () => {
      this.assetsFailed = true;
      const button = document.querySelector<HTMLButtonElement>("#enter-world");
      if (button) button.textContent = "素材載入失敗，請重新整理";
    });
  }

  public create(): void {
    if (this.assetsFailed) return;
    this.scene.start("LobbyScene");
    const button = document.querySelector<HTMLButtonElement>("#enter-world");
    if (button) { button.disabled = false; button.innerHTML = '<span>進入世界</span><span class="enter-arrow" aria-hidden="true">→</span>'; }
  }
}
