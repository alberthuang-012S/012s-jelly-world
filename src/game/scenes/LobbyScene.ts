import Phaser from "phaser";
import { arcadeGames } from "../../data/games";
import { announcements } from "../../data/announcements";
import type { CharacterId } from "../../data/dialogues";
import { NPC, type NPCConfig } from "../actors/NPC";
import { PlayerJelly } from "../actors/PlayerJelly";
import { getGameUI } from "../../ui/GameUI";
import { DialogueSystem } from "../systems/DialogueSystem";
import { GamePortalSystem } from "../systems/GamePortalSystem";
import { InputManager } from "../systems/InputManager";
import { CollisionSystem } from "../systems/CollisionSystem";
import { InteractionSystem } from "../systems/InteractionSystem";
import { renderTownV2, WORLD_BOUNDS, ACTIVE_WORLD_HEIGHT, WORLD_WIDTH } from "../world/TownV2";

const NPC_CONFIGS: readonly NPCConfig[] = [
  { id: "achang", name: "阿長", role: "總經理", x: 247, y: 219, variant: "manager", accent: 0x67c8df },
  { id: "xindi", name: "莘蒂", role: "直播天后", x: 1038, y: 219, variant: "streamer", accent: 0xf28b75 },
  { id: "bot", name: "012S BOT", role: "客服機器人", x: 1042, y: 402, variant: "bot", accent: 0x9b8ce9 },
];

export class LobbyScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private dialogueSystem!: DialogueSystem;
  private gamePortalSystem!: GamePortalSystem;
  private interactionSystem!: InteractionSystem;
  private collisionSystem!: CollisionSystem;
  private player!: PlayerJelly;
  private occludingFacades: Phaser.GameObjects.Image[] = [];
  private readonly ui = getGameUI();
  private activeZone = "CENTRAL PLAZA";

  public constructor() {
    super("LobbyScene");
  }

  public create(): void {
    const layout = renderTownV2(this);
    this.occludingFacades = this.children.list.filter(object => object.getData("occludingFacade")) as Phaser.GameObjects.Image[];
    this.inputManager = new InputManager(this);
    this.dialogueSystem = new DialogueSystem(this.ui.dialogue);
    this.gamePortalSystem = new GamePortalSystem(this.ui.modal, this.ui.toast);
    this.interactionSystem = new InteractionSystem(this.ui.prompt);
    this.collisionSystem = new CollisionSystem(WORLD_BOUNDS, layout.solids);
    this.player = new PlayerJelly(this, layout.spawn.x, layout.spawn.y);
    this.cameras.main.setBackgroundColor("#80be69");
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, ACTIVE_WORLD_HEIGHT);
    // Keep a little more of the town above the player in frame while the
    // deadzone prevents tiny movements from making the composition jitter.
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12, 0, 30);
    this.resizeCamera();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeCamera, this);
    });
    this.cameras.main.centerOn(layout.spawn.x, layout.spawn.y - 30);
    this.ui.zoneLabel.textContent = "CENTRAL PLAZA";

    this.createNPCs(layout.npcPositions);
    this.createAnnouncement(layout.announcement);
    this.createArcadeMachines(layout.arcadePositions);
    this.bindMobileControls();

    this.input.keyboard?.on("keydown-ESC", () => {
      if (this.ui.dialogue.isOpen()) {
        this.dialogueSystem.close();
      } else if (this.ui.modal.isOpen()) {
        this.ui.modal.close();
      }
    });

    // The world is rendered behind the welcome screen until the player enters.
    this.scene.pause();
  }

  public update(time: number, delta: number): void {
    const interactPressed = this.inputManager.consumeInteract();
    const blocking = this.ui.dialogue.isOpen() || this.ui.modal.isOpen();

    if (blocking) {
      this.inputManager.clearTouchDirections();
      if (this.ui.dialogue.isOpen() && interactPressed) {
        this.dialogueSystem.close();
      }
      this.interactionSystem.update(this.player, true);
      return;
    }

    const direction = this.inputManager.getMovement();
    const moving = direction.x !== 0 || direction.y !== 0;
    this.player.setMoving(moving, direction.x, direction.y);
    this.collisionSystem.move(this.player, direction, delta);
    this.player.tick(time);
    // Fade elevated artwork only while it overlaps a player rendered behind it.
    // Use the visible character's head/feet bounds, rather than its ground collider.
    for (const facade of this.occludingFacades) {
      const overlaps = this.player.x + 26 > facade.x &&
        this.player.x - 26 < facade.x + facade.width &&
        this.player.y + 6 > facade.y &&
        this.player.y - 54 < facade.y + facade.height;
      facade.setAlpha(overlaps && this.player.depth < facade.depth ? 0.35 : 1);
    }
    this.updateZoneLabel();
    this.interactionSystem.update(this.player);

    if (interactPressed) {
      this.interactionSystem.tryInteract();
    }
  }

  private resizeCamera(): void {
    const { width, height } = this.scale.gameSize;
    const mobile = (navigator.maxTouchPoints > 0 || matchMedia("(pointer: coarse)").matches) &&
      Math.min(width, height) <= 900;
    // CSS-sized canvas avoids shrinking the entire 1280px town onto a phone.
    // Keep the same readable character size in portrait and landscape.
    this.cameras.main.setZoom(mobile ? 1.25 : Math.min(width / 1280, height / 720) * 0.9);
    this.cameras.main.setDeadzone(mobile ? 72 : 220, mobile ? 48 : 108);
    this.cameras.main.centerOn(this.player.x, this.player.y - 30);
    this.inputManager.clearTouchDirections();
    this.ui.mobile.releaseAll();
  }

  private createNPCs(positions: {
    achang: { x: number; y: number };
    xindi: { x: number; y: number };
    bot: { x: number; y: number };
  }): void {
    for (const baseConfig of NPC_CONFIGS) {
      const position = positions[baseConfig.id];
      const config = { ...baseConfig, x: position.x, y: position.y };
      const npc = new NPC(this, config);
      this.collisionSystem.addObstacle(npc.getCollisionRect());
      this.interactionSystem.register({
        id: `npc-${config.id}`,
        type: "npc",
        x: config.x,
        y: config.y,
        interactionRadius: 82,
        prompt: "對話",
        priority: 3,
        onInteract: () => this.dialogueSystem.open(config.id),
      });
      npc.setDepth(config.y + 34);
    }
  }

  private createAnnouncement(position: { x: number; y: number }): void {
    const announcement = announcements[0];
    if (!announcement) {
      return;
    }
    this.interactionSystem.register({
      id: announcement.id,
      type: "announcement",
      x: position.x,
      y: position.y + 34,
      interactionRadius: 86,
      prompt: "查看公佈欄",
      priority: 2,
      onInteract: () => {
        this.ui.modal.open({
          kicker: announcement.tag,
          title: announcement.title,
          body: announcement.body,
          placeholderTitle: announcement.placeholderTitle,
          placeholderSubtitle: announcement.placeholderSubtitle,
          primaryLabel: announcement.primaryLabel,
          onPrimary: () => this.ui.modal.setStatus(announcement.developmentMessage),
        });
      },
    });
  }

  private createArcadeMachines(positions: Array<{ x: number; y: number }>): void {
    arcadeGames.forEach((game, index) => {
      const position = positions[index];
      if (!position) {
        return;
      }
      this.interactionSystem.register({
        id: `arcade-${game.id}`,
        type: "arcade",
        x: position.x,
        y: position.y + 30,
        interactionRadius: 64,
        prompt: `開始遊戲 · ${game.machineLabel}`,
        priority: 1,
        onInteract: () => this.gamePortalSystem.open(game),
      });
    });
  }

  private bindMobileControls(): void {
    this.ui.mobile.setHandlers({
      onDirection: (direction, pressed) => this.inputManager.setTouchDirection(direction, pressed),
      onInteract: () => this.inputManager.triggerInteract(),
    });
  }

  private updateZoneLabel(): void {
    const nextZone = this.getZoneLabel(this.player.x, this.player.y);
    if (nextZone !== this.activeZone) {
      this.activeZone = nextZone;
      this.ui.zoneLabel.textContent = nextZone;
    }
  }

  private getZoneLabel(x: number, y: number): string {
    if (x < 560 && y < 490) {
      return "LAB / RESEARCH";
    }
    if (x > 1000 && y < 430) {
      return "LIVE / STUDIO";
    }
    if (x > 1060 && y >= 430 && y < 790) {
      return "INFO / SERVICE";
    }
    if (y > 790) {
      return "ARCADE / PLAY";
    }
    if (x > 620 && x < 925 && y > 390 && y < 515) {
      return "EVENT / NEWS";
    }
    return "CENTRAL PLAZA";
  }
}
