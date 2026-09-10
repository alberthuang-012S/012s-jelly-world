import Phaser from "phaser";
import type { CharacterId } from "../../data/dialogues";

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

    const frame = { manager: 0, streamer: 1, bot: 2 }[config.variant];
    const shadow = new Phaser.GameObjects.Ellipse(scene, 0, 12, 32, 9, 0x315477, 0.2);
    const sprite = new Phaser.GameObjects.Image(scene, 0, -23, "npcs-v2", frame).setDisplaySize(55, 110);
    this.add([shadow, sprite]);
    // Anchor the badge above each sprite's visible head, including BOT's antenna.
    const nameY = config.y - (config.variant === "bot" ? 46 : 58);
    const name = new Phaser.GameObjects.Text(scene, config.x, nameY, config.name, {
      fontFamily: '"Microsoft JhengHei", sans-serif', fontSize: "18px", color: "#ffffff",
      backgroundColor: "#17376c", padding: { x: 10, y: 6 }, fontStyle: "bold",
    }).setOrigin(0.5, 1).setResolution(3).setDepth(2000);
    name.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    scene.add.existing(name);
    this.once(Phaser.GameObjects.Events.DESTROY, () => name.destroy());

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
