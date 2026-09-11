export interface ArcadeGame {
  id: string;
  name: string;
  description: string;
  url: string | null;
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
    id: "color-sorting",
    name: "顏色排序",
    description: "挑戰顏色排序。",
    url: "https://sharkwang0903.github.io/Color-Sorting-Game/",
    machineLabel: "04 SORT",
    accent: 0x9b8ce9,
    icon: "color",
  },
  { id: "time-test", name: "時間挑戰", description: "挑戰你的時間感。", url: "https://sharkwang0903.github.io/time-test-game/", machineLabel: "05 TIME", accent: 0x67c8df, icon: "grid" },
  { id: "number-memory", name: "數字記憶", description: "挑戰你的數字記憶。", url: "https://sharkwang0903.github.io/number-memory/", machineLabel: "06 NUMBER", accent: 0xf28b75, icon: "grid" },
  { id: "jellyfish-memory", name: "水母記憶", description: "挑戰你的水母記憶。", url: "https://sharkwang0903.github.io/jellyfish-memory/", machineLabel: "07 MEMORY", accent: 0xf0c75e, icon: "grid" },
  { id: "coming-soon", name: "新遊戲準備中", description: "第八台遊戲機尚未開放，敬請期待！", url: null, machineLabel: "08 SOON", accent: 0x9b8ce9, icon: "chain" },
];
