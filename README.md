# 012S Jelly World

012S Jelly World 是一個可愛像素風的互動世界／遊戲大廳。玩家可以操作自己的水母，在戶外小鎮式 Lobby 裡探索 LAB、LIVE、EVENT、INFO 與 ARCADE，和 NPC 對話、查看活動公告，或開啟 012S 的四款外部小遊戲。

## Phase 1

目前版本是可在本機遊玩的 MVP，包含：

- 012S JELLY WORLD 開始畫面與 Lobby
- 程式化 Pixel Placeholder：水母、NPC、獨立建築、Arcade 機台、家具、招牌與戶外地圖
- 32px tile-based 草地、石板道路、水道、橋樑、樹木、圍欄與中央廣場
- Phase 1.2 Pixel Art polish：統一 GBA 風格色盤、硬邊陰影、地形細節、建築層次與角色 Y 軸遮擋
- Phase 1.3 Visual Cohesion：細碎草地紋理、縮小石板視覺顆粒、戶外建築外觀、中央廣場草地島與 Camera deadzone
- Phase 1.4 Pixel Art Asset Pipeline：集中 Registry、BootScene preload、正式素材 fallback、Sprite/Sprite Sheet ready actors、可替換建築／地形／道具圖層
- 以 `reference/jelly-world-visual-direction.png` 為視覺方向參考的探索式 RPG 世界配置
- 螢幕跟隨玩家的探索鏡頭，支援在完整 1800×1200 世界中移動
- WASD、方向鍵與手機 D-pad 移動
- 共用 Interaction System 與互動距離判定
- 阿長、莘蒂、012S BOT 共用 Dialogue System
- PPT+1 三重抽獎活動公佈欄與「活動功能開發中」狀態
- 四台資料驅動的 Arcade Machine／Game Modal
- GitHub Pages subpath 與 GitHub Actions workflow 設定

Phase 1 不包含登入、後端、正式點數、正式抽獎、AI 客服、成績同步或商品購買。

## 技術棧

- Vite
- TypeScript
- Phaser 3
- CSS
- pnpm

## 安裝

```bash
pnpm install
```

## 啟動

```bash
pnpm dev
```

## Build / Typecheck

```bash
pnpm build
pnpm typecheck
```

## 操作

### Desktop

- `WASD` 或方向鍵：移動水母
- `E`：和附近的互動物件互動
- 對話開啟時按 `E`：關閉對話
- `Esc`：關閉目前的 Dialogue 或 Modal

### Mobile

- 觸控裝置會顯示左下角 D-pad
- 右下角「互動」按鈕等同 `E`
- 主要體驗以 Landscape 橫向為主；Portrait 會顯示旋轉建議，但不會鎖死操作

## NPC

- 阿長｜總經理：位於 LAB／研究區
- 莘蒂｜直播天后：位於 LIVE／直播區
- 012S BOT｜客服機器人：位於 INFO／SERVICE 區

NPC 台詞集中在 `src/data/dialogues.ts`，每次互動會從指定句子中隨機選擇。

## Arcade

四款機台資料集中在 `src/data/games.ts`，開始遊戲會由使用者的 click／touch handler 直接用新分頁開啟：

1. 消失的格子 — https://sharkwang0903.github.io/The-disappearing-grid/
2. 一刀切 — https://sharkwang0903.github.io/one-cut-game/
3. 色彩敏感度測試 — https://sharkwang0903.github.io/color-sensitivity-test/
4. Jelly Chain — https://alberthuang-012s.github.io/012s-jelly-chain-game/

## Reference

`reference/` 用於放置 PPT+1、未來產品、角色與視覺參考。Phase 1 的 runtime 不依賴該資料夾內的圖片，因此缺少圖片時仍可正常啟動。

## Pixel Art Pipeline

- 正式素材根目錄：`public/assets/pixel/`
- Registry：`src/game/assets/assetRegistry.ts`
- 唯一 preload 入口：`src/game/scenes/BootScene.ts`
- 視覺 fallback 與正式 Sprite 共用同一個 actor visual root；邏輯、碰撞、互動與對話不依賴圖片 alpha
- `terrain.main` 已完成 acceptance 並採 `enabled: true`；其他尚未審核的 PNG/WebP 仍維持 `enabled: false`，避免空檔案或假 placeholder 進入 runtime
- 詳細尺寸、色盤、角色／建築規格與樹木雙層排序請見 [`docs/PIXEL_ART_SPEC.md`](docs/PIXEL_ART_SPEC.md)

## Pixel Asset Validation

正式 Pixel Art 進入 `public/assets/pixel/` 前，先使用 validator 檢查 PNG
尺寸、RGBA alpha、tile/frame grid、occupancy 與 deterministic grid diagnostics：

```bash
pnpm validate:assets
pnpm validate:terrain -- path/to/terrain.png
pnpm validate:terrain -- --strict path/to/terrain.png
pnpm validate:assets -- --json --report --debug-grid
pnpm test:assets
pnpm build:terrain
```

正式 Terrain 的 manifest 位於
`public/assets/pixel/tiles/terrain/terrain.manifest.json`：16×16 native tile、
256×256 sheet、16 columns × 16 rows、margin 0、spacing 0。缺少正式檔案時預設
輸出 `SKIP / NOT FOUND`；CI 或 acceptance gate 可使用 `--strict` 使其變成 FAIL。

正式 Terrain 由 `scripts/pixel-assets/build-formal-terrain.ts` 以 integer
16×16 matrix deterministic 產生，不會縮放或裁切 reference。輸出為
`public/assets/pixel/tiles/terrain/terrain.png`；人工查看用的
`validation-output/terrain-preview.png` 與 validator report/debug image 永遠
留在 runtime asset tree 之外。固定 tile ID 與 row/column mapping 集中在
`src/game/assets/terrainTileMap.ts`；正式 Terrain runtime 只透過 Registry 的 `terrain.main`
載入 `public/assets/pixel/tiles/terrain/terrain.png`，不會讀取 `reference/` 或
`validation-output/`。

## GitHub Pages

Vite 已設定：

```ts
base: "/012s-jelly-world/"
```

之後部署時：

1. Push `main`
2. 開啟 GitHub Repository → Settings
3. 進入 Pages
4. Source 選 GitHub Actions
5. 讓 workflow build 並部署
6. 預期網址：https://alberthuang-012s.github.io/012s-jelly-world/

`.github/workflows/pages.yml` 已準備好 Vite、pnpm、production build 與 Pages artifact 流程。本次只建立部署能力，沒有 Push、Enable Pages 或觸發正式部署。

## Known Limitations

- 目前是本機 MVP，尚未連接會員登入或正式後端
- 沒有正式點數、Wallet、抽獎、優惠券、訂單或購買流程
- 沒有 AI 客服 API、NPC AI、多人連線或跨 Repository 狀態同步
- 角色與環境仍是可替換的程式化 Pixel Placeholder
- 外部遊戲是否可存取取決於各自的 GitHub Pages 網站與瀏覽器 popup policy
