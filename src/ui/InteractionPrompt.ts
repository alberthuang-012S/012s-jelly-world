export class InteractionPrompt {
  private readonly root: HTMLElement;
  private readonly desktopLabel: HTMLElement;
  private readonly mobileLabel: HTMLElement;
  private visiblePrompt: string | null = null;

  public constructor(root: HTMLElement) {
    this.root = root;
    this.desktopLabel = this.getElement(".prompt-label-desktop");
    this.mobileLabel = this.getElement(".prompt-label-mobile");
  }

  public show(prompt: string): void {
    if (this.visiblePrompt === prompt) return;
    this.visiblePrompt = prompt;
    const dialogue = prompt === "對話";
    this.root.classList.toggle("is-dialogue-prompt", dialogue);
    this.desktopLabel.textContent = dialogue ? "開始對話" : prompt;
    this.mobileLabel.textContent = dialogue ? "按互動開始對話" : prompt;
    this.root.hidden = false;
    this.root.classList.add("is-visible");
  }

  public hide(): void {
    if (this.visiblePrompt === null && this.root.hidden) return;
    this.visiblePrompt = null;
    this.root.hidden = true;
    this.root.classList.remove("is-visible");
  }

  private getElement(selector: string): HTMLElement {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (!element) {
      throw new Error(`Interaction prompt element missing: ${selector}`);
    }
    return element;
  }
}
