export type CharacterId = "achang" | "xindi" | "bot";

export interface DialogueData {
  id: CharacterId;
  name: string;
  role: string;
  lines: readonly string[];
}

export const dialogueData: Record<CharacterId, DialogueData> = {
  achang: {
    id: "achang",
    name: "阿長",
    role: "總經理",
    lines: ["100%科學", "科學是絕對的", "新科學的進步"],
  },
  xindi: {
    id: "xindi",
    name: "莘蒂",
    role: "直播天后",
    lines: ["等等要直播了", "大家晚安，我是莘蒂", "今天要跟粉絲們聊什麼呢"],
  },
  bot: {
    id: "bot",
    name: "012S BOT",
    role: "客服機器人",
    lines: ["研發中，敬請期待"],
  },
};

export function getRandomDialogueLine(characterId: CharacterId): string {
  const lines = dialogueData[characterId].lines;
  return lines[Math.floor(Math.random() * lines.length)] ?? lines[0];
}
