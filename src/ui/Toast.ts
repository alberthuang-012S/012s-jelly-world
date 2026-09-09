export class Toast {
  private readonly root: HTMLElement;
  private timeoutId: number | undefined;

  public constructor(root: HTMLElement) {
    this.root = root;
  }

  public show(message: string, tone: "default" | "warning" = "default"): void {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
    }
    this.root.textContent = message;
    this.root.dataset.tone = tone;
    this.root.hidden = false;
    this.timeoutId = window.setTimeout(() => {
      this.root.hidden = true;
    }, 3600);
  }
}
