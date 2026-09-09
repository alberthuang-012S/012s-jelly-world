export interface DialoguePayload {
  name: string;
  role: string;
  text: string;
}

export class DialogueBox {
  private readonly root: HTMLElement;
  private readonly nameElement: HTMLElement;
  private readonly roleElement: HTMLElement;
  private readonly textElement: HTMLElement;
  private readonly closeButton: HTMLButtonElement;
  private closeCallback: (() => void) | undefined;

  public constructor(root: HTMLElement) {
    this.root = root;
    this.nameElement = this.getElement("#dialogue-name");
    this.roleElement = this.getElement("#dialogue-role");
    this.textElement = this.getElement("#dialogue-text");
    this.closeButton = this.getElement("#dialogue-close") as HTMLButtonElement;
    this.closeButton.addEventListener("click", () => this.close());
  }

  public open(payload: DialoguePayload): void {
    this.nameElement.textContent = payload.name;
    this.roleElement.textContent = payload.role;
    this.textElement.textContent = payload.text;
    this.root.hidden = false;
    document.body.classList.add("dialogue-open");
    requestAnimationFrame(() => this.closeButton.focus());
  }

  public close(): void {
    this.root.hidden = true;
    document.body.classList.remove("dialogue-open");
    const callback = this.closeCallback;
    this.closeCallback = undefined;
    callback?.();
  }

  public isOpen(): boolean {
    return !this.root.hidden;
  }

  private getElement(selector: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Dialogue element missing: ${selector}`);
    }
    return element;
  }
}
