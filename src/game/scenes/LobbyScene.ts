import Phaser from "phaser";
import { arcadeGames } from "../../data/games";
import { announcements } from "../../data/announcements";
import type { CharacterId } from "../../data/dialogues";
import { NPC, type NPCConfig } from "../actors/NPC";
import { PlayerJelly } from "../actors/PlayerJelly";
import { ArcadeMachine } from "../actors/ArcadeMachine";
import { getGameUI } from "../../ui/GameUI";
import { DialogueSystem } from "../systems/DialogueSystem";
import { GamePortalSystem } from "../systems/GamePortalSystem";
import { InputManager } from "../systems/InputManager";
import { CollisionSystem } from "../systems/CollisionSystem";
import { InteractionSystem } from "../systems/InteractionSystem";
import { renderLobby, WORLD_BOUNDS, WORLD_HEIGHT, WORLD_WIDTH } from "../world/WorldDecor";

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
  private readonly ui = getGameUI();
  private activeZone = "CENTRAL PLAZA";

  public constructor() {
    super("LobbyScene");
  }

  public create(): void {
    const layout = renderLobby(this);
    this.inputManager = new InputManager(this);
    this.dialogueSystem = new DialogueSystem(this.ui.dialogue);
    this.gamePortalSystem = new GamePortalSystem(this.ui.modal, this.ui.toast);
    this.interactionSystem = new InteractionSystem(this.ui.prompt);
    this.collisionSystem = new CollisionSystem(WORLD_BOUNDS, layout.solids);
    this.player = new PlayerJelly(this, layout.spawn.x, layout.spawn.y);
    this.cameras.main.setBackgroundColor("#8fd08b");
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    // Keep a little more of the town above the player in frame while the
    // deadzone prevents tiny movements from making the composition jitter.
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12, 0, 72);
    this.cameras.main.setDeadzone(220, 108);

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
    this.player.setMoving(moving);
    this.collisionSystem.move(this.player, direction, delta);
    this.player.tick(time);
    this.updateZoneLabel();
    this.interactionSystem.update(this.player);

    if (interactPressed) {
      this.interactionSystem.tryInteract();
    }
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
      const machine = new ArcadeMachine(this, game, position.x, position.y);
      this.collisionSystem.addObstacle(machine.getCollisionRect());
      this.interactionSystem.register({
        id: `arcade-${game.id}`,
        type: "arcade",
        x: position.x,
        y: position.y - 52,
        interactionRadius: 83,
        prompt: "開始遊戲",
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
    if (x < 720 && y < 485) {
      return "LAB / RESEARCH";
    }
    if (x > 1100 && y < 485) {
      return "LIVE / STUDIO";
    }
    if (x > 1270 && y > 520 && y < 810) {
      return "INFO / SERVICE";
    }
    if (y > 835) {
      return "ARCADE / PLAY";
    }
    if (x > 700 && x < 1100 && y > 390 && y < 560) {
      return "EVENT / NEWS";
    }
    return "CENTRAL PLAZA";
  }
}
