export interface ArcadeGame {
  id: string;
  name: string;
  description: string;
  url: string;
  machineLabel: string;
  accent: number;
  icon: "grid" | "cut" | "color" | "chain";
}

export const arcadeGames: readonly ArcadeGame[] = [
  {
    id: "disappearing-grid",
    name: "消失的格子",
    description: "記住出現的位置，挑戰你的空間記憶。",
    url: "https://sharkwang0903.github.io/The-disappearing-grid/",
    machineLabel: "01 GRID",
    accent: 0x67c8df,
    icon: "grid",
  },
  {
    id: "one-cut",
    name: "一刀切",
    description: "觀察圖形並找出最佳的一刀。",
    url: "https://sharkwang0903.github.io/one-cut-game/",
    machineLabel: "02 CUT",
    accent: 0xf28b75,
    icon: "cut",
  },
  {
    id: "color-sensitivity",
    name: "色彩敏感度測試",
    description: "找出不一樣的顏色，挑戰視覺敏銳度。",
    url: "https://sharkwang0903.github.io/color-sensitivity-test/",
    machineLabel: "03 RGB",
    accent: 0xf0c75e,
    icon: "color",
  },
  {
    id: "jelly-chain",
    name: "Jelly Chain",
    description: "連結水母、累積分數，挑戰更高紀錄。",
    url: "https://alberthuang-012s.github.io/012s-jelly-chain-game/",
    machineLabel: "04 CHAIN",
    accent: 0x9b8ce9,
    icon: "chain",
  },
];
