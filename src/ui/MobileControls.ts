import type { TouchDirection } from "../game/systems/InputManager";

export interface MobileControlHandlers {
  onDirection: (direction: TouchDirection, pressed: boolean) => void;
  onInteract: () => void;
}

export class MobileControls {
  private readonly root: HTMLElement;
  private handlers: MobileControlHandlers | undefined;
  private readonly directionButtons: HTMLButtonElement[];

  public constructor(root: HTMLElement) {
    this.root = root;
    this.directionButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-direction]"));
    for (const button of this.directionButtons) {
      const direction = button.dataset.direction as TouchDirection;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        button.classList.add("is-pressed");
        this.handlers?.onDirection(direction, true);
      });
      const release = (event: PointerEvent) => {
        event.preventDefault();
        button.classList.remove("is-pressed");
        this.handlers?.onDirection(direction, false);
      };
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", () => {
        button.classList.remove("is-pressed");
        this.handlers?.onDirection(direction, false);
      });
    }

    const interactButton = root.querySelector<HTMLButtonElement>("#mobile-interact");
    let skipPointerClick = false;
    interactButton?.addEventListener("pointerdown", () => {
      skipPointerClick = false;
      interactButton.classList.add("is-pressed");
    });
    interactButton?.addEventListener("pointerup", () => {
      interactButton.classList.remove("is-pressed");
      skipPointerClick = true;
      this.handlers?.onInteract();
    });
    interactButton?.addEventListener("pointercancel", () => {
      skipPointerClick = false;
      interactButton.classList.remove("is-pressed");
    });
    interactButton?.addEventListener("click", (event) => {
      // Keyboard activation has detail 0; pointer activation already ran on pointerup.
      if (skipPointerClick && event.detail > 0) {
        skipPointerClick = false;
        return;
      }
      skipPointerClick = false;
      this.handlers?.onInteract();
    });
  }

  public setHandlers(handlers: MobileControlHandlers): void {
    this.handlers = handlers;
  }

  public releaseAll(): void {
    for (const button of this.directionButtons) {
      button.classList.remove("is-pressed");
      const direction = button.dataset.direction as TouchDirection;
      this.handlers?.onDirection(direction, false);
    }
  }
}
