import Phaser from "phaser";
import type { ArcadeGame } from "../../data/games";
import { createPixelVisual } from "../assets/assetPipeline";
import { createArcadeMachineFallback } from "../assets/fallbackArt";

export class ArcadeMachine extends Phaser.GameObjects.Container {
  public readonly gameData: ArcadeGame;
  private readonly collisionBox: Phaser.Geom.Rectangle;

  public constructor(scene: Phaser.Scene, gameData: ArcadeGame, x: number, y: number) {
    super(scene, x, y);
    this.gameData = gameData;
    this.collisionBox = new Phaser.Geom.Rectangle(x - 42, y - 42, 84, 88);
    this.setSize(88, 102);
    this.setDepth(y + 32);

    this.add(createPixelVisual(
      scene,
      "arcade.machine",
      (target) => createArcadeMachineFallback(target, gameData),
    ));

    const label = new Phaser.GameObjects.Text(scene, 0, 57, gameData.machineLabel, {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#fff2d0",
      fontStyle: "bold",
      letterSpacing: 1,
    });
    label.setOrigin(0.5);
    this.add(label);

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
