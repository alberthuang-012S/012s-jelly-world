import Phaser from "phaser";
import "./styles/main.css";
import { GAME_CONFIG } from "./game/config";
import { getGameUI, initializeGameUI } from "./ui/GameUI";

const ui = initializeGameUI();

const touchDevice = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
document.body.classList.toggle("touch-device", touchDevice);
function updateViewportSize(): void {
  const viewport = window.visualViewport;
  const useVisual = viewport && viewport.scale === 1;
  document.documentElement.style.setProperty("--viewport-height", `${useVisual ? viewport.height : window.innerHeight}px`);
  document.documentElement.style.setProperty("--viewport-width", `${useVisual ? viewport.width : window.innerWidth}px`);
}
updateViewportSize();
// Apply mobile layout before Phaser measures its parent for the first frame.
export const game = new Phaser.Game(GAME_CONFIG);

const startScreen = document.querySelector<HTMLElement>("#start-screen");
const enterButton = document.querySelector<HTMLButtonElement>("#enter-world");
if (!startScreen || !enterButton) {
  throw new Error("Start screen could not be initialized.");
}

enterButton.addEventListener("click", () => {
  startScreen.hidden = true;
  document.body.classList.add("world-active");
  game.scene.resume("LobbyScene");
  getGameUI().toast.show("探索開始！找到世界裡的每個角落吧。", "default");
});

window.addEventListener("blur", () => ui.mobile.releaseAll());
// Mobile orientation events can precede the final CSS/visual viewport layout.
// Observe the actual parent as well, and synchronize on the next rendered frame.
const canvasParent = document.querySelector<HTMLElement>("#game-container")!;
let resizeFrame = 0;
let orientationTimer = 0;
function scheduleViewportSync(): void {
  updateViewportSize();
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (!game.isBooted || !game.scale) return;
    const { width, height } = canvasParent.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    game.scale.getParentBounds();
    if (Math.abs(game.scale.width - width) > 0.5 || Math.abs(game.scale.height - height) > 0.5) {
      game.scale.refresh();
    } else {
      game.scale.updateBounds();
    }
  });
}
function onOrientationChange(): void {
  ui.mobile.releaseAll();
  scheduleViewportSync();
  window.clearTimeout(orientationTimer);
  orientationTimer = window.setTimeout(scheduleViewportSync, 300);
}
const viewportObserver = new ResizeObserver(scheduleViewportSync);
viewportObserver.observe(canvasParent);
window.addEventListener("resize", scheduleViewportSync);
window.addEventListener("orientationchange", onOrientationChange);
window.visualViewport?.addEventListener("resize", scheduleViewportSync);
screen.orientation?.addEventListener("change", onOrientationChange);
game.events.once(Phaser.Core.Events.READY, scheduleViewportSync);
game.events.once(Phaser.Core.Events.DESTROY, () => {
  viewportObserver.disconnect();
  cancelAnimationFrame(resizeFrame);
  window.clearTimeout(orientationTimer);
  window.removeEventListener("resize", scheduleViewportSync);
  window.removeEventListener("orientationchange", onOrientationChange);
  window.visualViewport?.removeEventListener("resize", scheduleViewportSync);
  screen.orientation?.removeEventListener("change", onOrientationChange);
});

document.addEventListener("contextmenu", (event) => {
  if ((event.target as HTMLElement | null)?.closest("#game-shell")) {
    event.preventDefault();
  }
});
