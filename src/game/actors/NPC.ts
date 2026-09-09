import Phaser from "phaser";
import type { CharacterId } from "../../data/dialogues";
import { createPixelVisual } from "../assets/assetPipeline";
import { createNPCFallback } from "../assets/fallbackArt";
import { getCharacterAssetId } from "../assets/assetRegistry";

export type NPCVariant = "manager" | "streamer" | "bot";

export interface NPCConfig {
  id: CharacterId;
  name: string;
  role: string;
  x: number;
  y: number;
  variant: NPCVariant;
  accent: number;
}

export class NPC extends Phaser.GameObjects.Container {
  public readonly id: CharacterId;
  public readonly name: string;
  public readonly role: string;
  public readonly collisionBox: Phaser.Geom.Rectangle;

  public constructor(scene: Phaser.Scene, config: NPCConfig) {
    super(scene, config.x, config.y);
    this.id = config.id;
    this.name = config.name;
    this.role = config.role;
    this.collisionBox = new Phaser.Geom.Rectangle(config.x - 21, config.y - 20, 42, 42);
    this.setSize(60, 84);
    this.setDepth(config.y + 34);

    this.add(createPixelVisual(
      scene,
      getCharacterAssetId(config.variant),
      (target) => createNPCFallback(target, config.variant),
    ));

    scene.add.existing(this);
  }

  public getCollisionRect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.collisionBox.x,
      this.collisionBox.y,
      this.collisionBox.width,
      this.collisionBox.height,
    );
  }

}
