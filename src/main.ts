import Phaser from "phaser";
import "./styles/main.css";
import { GAME_CONFIG } from "./game/config";
import { getGameUI, initializeGameUI } from "./ui/GameUI";

const ui = initializeGameUI();
const game = new Phaser.Game(GAME_CONFIG);

const touchDevice = navigator.maxTouchPoints > 0 || "ontouchstart" in window;
document.body.classList.toggle("touch-device", touchDevice);

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
window.addEventListener("resize", () => {
  document.documentElement.style.setProperty("--viewport-height", `${window.innerHeight}px`);
});
document.documentElement.style.setProperty("--viewport-height", `${window.innerHeight}px`);

document.addEventListener("contextmenu", (event) => {
  if ((event.target as HTMLElement | null)?.closest("#game-shell")) {
    event.preventDefault();
  }
});
