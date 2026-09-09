import Phaser from "phaser";
import type { PlayerJelly } from "../actors/PlayerJelly";
import type { MovementVector } from "./InputManager";

export class CollisionSystem {
  private readonly obstacles: Phaser.Geom.Rectangle[];
  private readonly bounds: Phaser.Geom.Rectangle;
  private readonly speed = 245;

  public constructor(bounds: Phaser.Geom.Rectangle, obstacles: Phaser.Geom.Rectangle[] = []) {
    this.bounds = new Phaser.Geom.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
    this.obstacles = obstacles;
  }

  public addObstacle(obstacle: Phaser.Geom.Rectangle): void {
    this.obstacles.push(new Phaser.Geom.Rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height));
  }

  public move(player: PlayerJelly, direction: MovementVector, delta: number): boolean {
    const distance = (this.speed * Math.min(delta, 50)) / 1000;
    const dx = direction.x * distance;
    const dy = direction.y * distance;
    let moved = false;

    if (dx !== 0 && this.canStand(player, player.x + dx, player.y)) {
      player.x += dx;
      moved = true;
    }
    if (dy !== 0 && this.canStand(player, player.x, player.y + dy)) {
      player.y += dy;
      moved = true;
    }

    return moved;
  }

  private canStand(player: PlayerJelly, x: number, y: number): boolean {
    const box = player.getCollisionBoxAt(x, y);
    const insideBounds =
      box.left >= this.bounds.left &&
      box.right <= this.bounds.right &&
      box.top >= this.bounds.top &&
      box.bottom <= this.bounds.bottom;
    if (!insideBounds) {
      return false;
    }

    return !this.obstacles.some((obstacle) => Phaser.Geom.Intersects.RectangleToRectangle(box, obstacle));
  }
}
