export interface ModalContent {
  kicker: string;
  title: string;
  body: string;
  placeholderTitle: string;
  placeholderSubtitle: string;
  primaryLabel?: string;
  onPrimary?: () => void;
}

export class Modal {
  private readonly root: HTMLElement;
  private readonly kickerElement: HTMLElement;
  private readonly titleElement: HTMLElement;
  private readonly bodyElement: HTMLElement;
  private readonly statusElement: HTMLElement;
  private readonly placeholderTitleElement: HTMLElement;
  private readonly placeholderSubtitleElement: HTMLElement;
  private readonly primaryButton: HTMLButtonElement;
  private readonly closeButtons: HTMLButtonElement[];

  public constructor(root: HTMLElement) {
    this.root = root;
    this.kickerElement = this.getElement("#modal-kicker");
    this.titleElement = this.getElement("#modal-title");
    this.bodyElement = this.getElement("#modal-body");
    this.statusElement = this.getElement("#modal-status");
    this.placeholderTitleElement = this.getElement("#modal-placeholder-title");
    this.placeholderSubtitleElement = this.getElement("#modal-placeholder-subtitle");
    this.primaryButton = this.getElement("#modal-primary") as HTMLButtonElement;
    const iconButton = this.getElement("#modal-close-icon") as HTMLButtonElement;
    const secondaryButton = this.getElement("#modal-secondary") as HTMLButtonElement;
    this.closeButtons = [iconButton, secondaryButton];
    for (const button of this.closeButtons) {
      button.addEventListener("click", () => this.close());
    }
    root.querySelector<HTMLElement>("[data-modal-close='true']")?.addEventListener("click", () => this.close());
  }

  public open(content: ModalContent): void {
    this.kickerElement.textContent = content.kicker;
    this.titleElement.textContent = content.title;
    this.bodyElement.textContent = content.body;
    this.placeholderTitleElement.textContent = content.placeholderTitle;
    this.placeholderSubtitleElement.textContent = content.placeholderSubtitle;
    this.statusElement.textContent = "";
    this.statusElement.hidden = true;
    this.primaryButton.textContent = content.primaryLabel ?? "關閉";
    this.primaryButton.hidden = !content.primaryLabel || !content.onPrimary;
    this.primaryButton.onclick = content.onPrimary ?? null;
    this.root.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => (content.onPrimary ? this.primaryButton : this.closeButtons[1]).focus());
  }

  public setStatus(message: string): void {
    this.statusElement.textContent = message;
    this.statusElement.hidden = false;
  }

  public close(): void {
    this.root.hidden = true;
    this.primaryButton.onclick = null;
    document.body.classList.remove("modal-open");
  }

  public isOpen(): boolean {
    return !this.root.hidden;
  }

  private getElement(selector: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Modal element missing: ${selector}`);
    }
    return element;
  }
}
