import Phaser from "phaser";
import type { PlayerJelly } from "../actors/PlayerJelly";
import { InteractionPrompt } from "../../ui/InteractionPrompt";

export type InteractionType = "npc" | "announcement" | "arcade";

export interface Interactable {
  id: string;
  type: InteractionType;
  x: number;
  y: number;
  interactionRadius: number;
  prompt: string;
  priority: number;
  onInteract: () => void;
}

export class InteractionSystem {
  private readonly prompt: InteractionPrompt;
  private readonly interactables: Interactable[] = [];
  private current: Interactable | null = null;

  public constructor(prompt: InteractionPrompt) {
    this.prompt = prompt;
  }

  public register(interactable: Interactable): void {
    this.interactables.push(interactable);
  }

  public update(player: PlayerJelly, blocked = false): void {
    if (blocked) {
      this.current = null;
      this.prompt.hide();
      return;
    }

    const nearby = this.interactables
      .map((candidate) => ({
        candidate,
        distance: Phaser.Math.Distance.Between(player.x, player.y, candidate.x, candidate.y),
      }))
      .filter(({ candidate, distance }) => distance <= candidate.interactionRadius)
      .sort((a, b) => {
        if (a.candidate.priority !== b.candidate.priority) {
          return b.candidate.priority - a.candidate.priority;
        }
        return a.distance - b.distance;
      });

    this.current = nearby[0]?.candidate ?? null;
    if (this.current) {
      this.prompt.show(this.current.prompt);
    } else {
      this.prompt.hide();
    }
  }

  public tryInteract(): boolean {
    if (!this.current) {
      return false;
    }
    const target = this.current;
    this.current = null;
    this.prompt.hide();
    target.onInteract();
    return true;
  }
}
