import Phaser from "phaser";

export type TouchDirection = "up" | "down" | "left" | "right";

export interface MovementVector {
  x: number;
  y: number;
}

export class InputManager {
  private readonly wKey: Phaser.Input.Keyboard.Key;
  private readonly aKey: Phaser.Input.Keyboard.Key;
  private readonly sKey: Phaser.Input.Keyboard.Key;
  private readonly dKey: Phaser.Input.Keyboard.Key;
  private readonly eKey: Phaser.Input.Keyboard.Key;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly touchState: Record<TouchDirection, boolean> = {
    up: false,
    down: false,
    left: false,
    right: false,
  };
  private interactQueued = false;
  private interactKeyHeld = false;

  public constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is required for the lobby scene.");
    }
    this.wKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.eKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.cursors = keyboard.createCursorKeys();
    keyboard.on("keydown-E", () => {
      if (!this.interactKeyHeld) {
        this.interactQueued = true;
        this.interactKeyHeld = true;
      }
    });
    keyboard.on("keyup-E", () => {
      this.interactKeyHeld = false;
    });
  }

  public setTouchDirection(direction: TouchDirection, pressed: boolean): void {
    this.touchState[direction] = pressed;
  }

  public clearTouchDirections(): void {
    for (const direction of Object.keys(this.touchState) as TouchDirection[]) {
      this.touchState[direction] = false;
    }
  }

  public triggerInteract(): void {
    this.interactQueued = true;
  }

  public consumeInteract(): boolean {
    const queued = this.interactQueued;
    this.interactQueued = false;
    return queued;
  }

  public getMovement(): MovementVector {
    const up = this.wKey.isDown || this.cursors.up?.isDown || this.touchState.up;
    const down = this.sKey.isDown || this.cursors.down?.isDown || this.touchState.down;
    const left = this.aKey.isDown || this.cursors.left?.isDown || this.touchState.left;
    const right = this.dKey.isDown || this.cursors.right?.isDown || this.touchState.right;
    const x = Number(right) - Number(left);
    const y = Number(down) - Number(up);
    const length = Math.hypot(x, y);

    if (length === 0) {
      return { x: 0, y: 0 };
    }
    return { x: x / length, y: y / length };
  }
}
