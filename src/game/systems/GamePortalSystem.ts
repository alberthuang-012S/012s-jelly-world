import type { ArcadeGame } from "../../data/games";
import { Modal } from "../../ui/Modal";
import { Toast } from "../../ui/Toast";

export class GamePortalSystem {
  private readonly modal: Modal;
  private readonly toast: Toast;

  public constructor(modal: Modal, toast: Toast) {
    this.modal = modal;
    this.toast = toast;
  }

  public open(game: ArcadeGame): void {
    this.modal.open({
      kicker: `ARCADE / ${game.machineLabel}`,
      title: game.name,
      body: game.description,
      placeholderTitle: game.machineLabel,
      placeholderSubtitle: "GAME PORTAL",
      primaryLabel: game.url ? "開始遊戲" : undefined,
      onPrimary: game.url ? () => {
        // This remains directly inside the user click/touch handler for mobile popup rules.
        const opened = window.open(game.url!, "_blank", "noopener,noreferrer");
        if (!opened) {
          this.toast.show("瀏覽器封鎖了新分頁，請允許彈出視窗後再試。", "warning");
        }
      } : undefined,
    });
  }
}
