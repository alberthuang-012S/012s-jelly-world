import { DialogueBox } from "./DialogueBox";
import { InteractionPrompt } from "./InteractionPrompt";
import { MobileControls } from "./MobileControls";
import { Modal } from "./Modal";
import { Toast } from "./Toast";

export interface GameUI {
  prompt: InteractionPrompt;
  dialogue: DialogueBox;
  modal: Modal;
  mobile: MobileControls;
  toast: Toast;
  zoneLabel: HTMLElement;
}

let activeUI: GameUI | undefined;

export function initializeGameUI(): GameUI {
  const ui: GameUI = {
    prompt: new InteractionPrompt(requireElement("#interaction-prompt")),
    dialogue: new DialogueBox(requireElement("#dialogue-root")),
    modal: new Modal(requireElement("#modal-root")),
    mobile: new MobileControls(requireElement("#mobile-controls")),
    toast: new Toast(requireElement("#toast")),
    zoneLabel: requireElement("#zone-label"),
  };
  activeUI = ui;
  return ui;
}

export function getGameUI(): GameUI {
  if (!activeUI) {
    throw new Error("Game UI has not been initialized.");
  }
  return activeUI;
}

function requireElement(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Required UI element missing: ${selector}`);
  }
  return element;
}
