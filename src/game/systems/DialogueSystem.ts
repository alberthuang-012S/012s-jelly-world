import type { CharacterId } from "../../data/dialogues";
import { dialogueData, getRandomDialogueLine } from "../../data/dialogues";
import { DialogueBox } from "../../ui/DialogueBox";

export class DialogueSystem {
  private readonly box: DialogueBox;

  public constructor(box: DialogueBox) {
    this.box = box;
  }

  public open(characterId: CharacterId): void {
    const character = dialogueData[characterId];
    this.box.open({
      name: character.name,
      role: character.role,
      text: getRandomDialogueLine(characterId),
    });
  }

  public close(): void {
    this.box.close();
  }

  public isOpen(): boolean {
    return this.box.isOpen();
  }
}
