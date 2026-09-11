# V2 美術重製

## 方向與素材

依照 `reference/jelly-world-v2-art-direction-master.png`（使用者提到的 v2 路徑在專案中實際位於 reference 根目錄），將 runtime 全面改成明亮像素小鎮：藍／粉／紫屋頂、花木、奶油石板、藍色河岸、藍白水母、三位細緻 NPC、亮色琺瑯招牌介面。

使用內建 image_gen 工具，沒有使用 CLI/API fallback。正式素材皆在 `public/assets/v2/`：

- town.png：1536×1024，完整小鎮場景；建築再以同素材 texture frame 分層遮擋。
- jelly.png：1254×1254，透明正面；同時用於開始畫面。
- jelly-side.png：1214×1295，透明左側面；右側面由 runtime 翻轉。
- jelly-back.png：1254×1254，透明背面。
- npcs.png：1536×1024，三欄透明角色圖，每欄 512×1024。

四向水母用獨立圖片與程式浮動／傾斜動畫；不是逐格走路 sprite sheet。場景採整張底圖加建築前景裁框，沒有假裝成可編輯的 tile atlas。地圖座標、障礙物、NPC 與機台熱區集中在 `src/game/world/TownV2.ts`。原先 tile pipeline 的檔案保留，但 V2 不再載入。

## 生成提示詞

### town.png

Use case: stylized-concept. Create a production game background plate, landscape 1536x1024. The provided image is STYLE REFERENCE only. Make ONLY the beautiful explorable town scene full bleed, no reference sheet, no UI, no characters anywhere, no jelly, no humans, no robot NPC. Match the exceptionally detailed bright cozy top down pixel RPG art: saturated azure blue, pink, violet roofs, lush sculpted pixel trees, white daisies and pink flowers, honey cream cobblestone, blue stream and rocky cliffs, wood benches, lamps. Camera orthographic top down 3/4 RPG. Layout: stream at far left 0-12% width, dense trees framing all outer edges; blue LAB building upper left footprint x20-40%, y16-40%; pink LIVE studio upper right x72-90%, y16-40%; arch gate top center x45-62%, y3-20%, sign '012S WORLD'; large wooden EVENT NEWS board centered x43-61%, y28-47%, central sheet text 'PPT+1'; wide empty central walkable cream cobblestone plaza from x33-72%, y48-65%; small purple INFO booth middle right x76-92%, y49-70% with EMPTY open service window (no robot); blue ARCADE pavilion bottom center x31-72%, y72-92%, with FOUR colorful arcade cabinets aligned at x38%,48%,58%,68%, all at y85%, labels '01 GRID', '02 CUT', '03 RGB', '04 CHAIN'. Paths connect all attractions. Leave clear walkable space in front of all buildings and below arcade. No people at all, interactive sprites will be added by game engine. Rich handmade pixel material textures, sunny leaves, clustered pixel shading, crisp pixel outlines, charming premium pixel town. Only image text permitted: 012S WORLD, LAB, LIVE, INFO, ARCADE, EVENT NEWS, PPT+1 and the four cabinet labels. No watermark, no legend, no palette, no sprite sheets.

### jelly.png

Use case: stylized-concept. Production game character asset on genuinely TRANSPARENT background. ONE SINGLE cute front facing blue and white jelly mascot, matching player jelly in right panel of reference. Full body centered, generous transparent padding. Crisp detailed pixel art at apparent 48x56 native resolution, enlarged clean nearest neighbor pixels. Round warm white face, tiny burgundy eyes with white highlights, smile, pink blush, bright azure blue cloud shaped tuft on head with white rim light, cobalt outline and five short rounded blue droplet tentacles shaded ice blue to royal blue. Adorable, exactly the same identity as reference. No floor, no shadow, no words, no grid, no other sprites, no background scene. Square canvas 1024x1024, character occupies about 75 percent height. Actual transparent alpha.

### npcs.png

Production pixel RPG NPC sprites on genuine transparent background. Landscape image exactly 1536x1024 divided into THREE invisible equal width columns 512x1024. Each column one centered full body front facing NPC, same baseline y800 and top y230, ample clear separation. Left column center x256: cute chibi male scientist manager with navy hair, white lab coat, blue tie, dark trousers and tiny shoes. Middle column center x768: cute chibi female livestream host with long chestnut brown hair, pink jacket, white blouse, dark skirt, little shoes, holding tiny microphone. Right column center x1280: friendly small white and blue service robot, cyan face screen, two dark eyes, blue headphones and tiny antenna, short legs. Match detailed cheerful pixel shading and character proportions of NPCs in provided style reference. Crisp small square pixels with navy outlines, bright highlights, soft blue shadows. No text, no labels, no scenery, no floor or shadow, no grid, no borders. Exactly three isolated characters, no jelly. Actual transparent alpha.

### jelly-back.png

A single cute pixel art blue-white jelly creature viewed from BEHIND, isolated on actual transparent PNG alpha background. Full body centered on square 1024x1024 canvas. Rounded cream white body, bright azure blue cloud tuft on top, navy pixel outline, five short round shaded blue droplet legs. Back view, absolutely no eyes or facial features. Crisp pixel art, apparent native size 48x56, same style as cute top down RPG game mascot, clean pixel clusters. Character occupies 75% height. Output with transparent background, no checkerboard, no background design, no floor, no shadows, no glow, no text.

### jelly-side.png

A single cute pixel art blue-white jelly creature viewed in LEFT PROFILE, isolated on actual transparent PNG alpha background. Full body centered on square 1024x1024 canvas. Rounded cream white body, bright azure blue CLOUD SHAPED three-lobed tuft on top with white highlight rim (not a tall flame or curl), navy pixel outline, five short round shaded blue droplet legs. Looking to left edge with one tiny burgundy eye with white highlight, tiny smile and pink blush on left side of face. Crisp pixel art, apparent native size 48x56, clean small pixel clusters. Same chibi cozy top down RPG mascot style. Character occupies 75% height. Output with actual transparent background, no checkerboard, no background design, no floor, no shadows, no glow, no text.

生成的灰棋盤方向合圖未通過透明度檢查，因此沒有放入正式素材。

## 驗證紀錄

- `pnpm typecheck` 通過。
- `pnpm build` 通過；Phaser bundle 仍有既有大型 chunk 提示。
- `pnpm validate:art-v2`：五個正式 PNG 的尺寸、角色透明度與 NPC 分格可見內容全部通過。
- 實際瀏覽器：開始畫面、遊戲畫面、844×390 手機橫向控制介面皆已檢視。
- 以 runtime 真正碰撞判定從出生點做 5px 網格 flood fill，12,601 個可行走樣點；三位 NPC、看板、四台遊戲機共八個目標全部可達。
- 八個互動點使用實際 InteractionSystem 開啟對話／Modal，標題皆吻合。外部遊戲網站本身未納入此次改版測試。
- 瀏覽器未記錄 runtime error 或 warn。
- 手機測試發現 Phaser 自動置中與 CSS Grid 重複置中，已移除 Grid 置中。

## 2026-09-10：使用者指定水母

使用 `reference/player-jelly-preferred.png` 原圖，經使用者明確同意採程式去背／裁切。圖片工具產出的棋盤背景版本沒有採用。`scripts/pixel-assets/build-preferred-jelly.ts` 只移除與每格邊界連通的中性灰背景，保留封閉白色臉部，使用 nearest-neighbor 裁成四格 64×64，每格角色高度 56px，底線一致。正式檔為 `public/assets/v2/jelly-preferred.png`；開始畫面使用 `jelly-preferred-front.png`。

Runtime 四格依序為 down、left、right、up，直接使用原圖兩個側面，不做鏡像，不依方向改變縮放。取消走路旋轉，採連續相位與漸變浮動速度，避免啟停跳動。這張原圖提供四個朝向，移動動畫以輕微上下浮動呈現。

重建：`node --experimental-strip-types scripts/pixel-assets/build-preferred-jelly.ts`。

## 2026-09-10：道路可讀性與環路

正式背景切換至 `public/assets/v2/town-roads.png`，使用內建 imagegen 編輯原 town.png；開始畫面同步切換。保留舊圖以便比對。

- 中央廣場通往 ARCADE 屋頂的假入口改成連續花籬，增加左右導引牌。
- 開放西側、東側與南側的連續石板環路，南側移除擋在機台入口的視覺圍欄。
- INFO 向東移動，屋身碰撞與前景改為 x1128，BOT 同步移至 x1268。
- 更新花籬與南側樹叢碰撞，移除新道路上的舊障礙範圍。
- 實際 runtime 以玩家碰撞盒每 2px 取樣驗證六段連續路線：(768,545) → (768,520) → (400,520) → (400,900) → (1090,900) → (1090,520) → (768,520)，全段通過。
- 以出生點 flood fill 驗證八個互動目標均可達；型別與正式素材檢查通過。

### 道路圖生成提示詞

Edit this production RPG map to improve WALKABLE ROAD DESIGN. Preserve exact 1536x1024 canvas, pixel art style and all existing building designs/text. Keep LAB, LIVE, gate, EVENT board, ARCADE and its four cabinets EXACTLY at original positions. Move ONLY INFO booth 100 pixels to the right, its new roof footprint x1170-1450 y435-655, counter facing south. Create a continuous unobstructed wide cream cobblestone LOOP around arcade: west vertical road x365-465 from y500 to950, east vertical road x1075-1170 from y500 to950, and south horizontal road x365-1170 from y865 to960. Connect both roads naturally to existing central plaza y490-570. Remove the lamp at x1050 y580 and all plants or other objects blocking this east corridor. Move the lamp at x1100 y790 out of the corridor too. Replace the deceptive narrow gray path at x710-825 y600-640 that leads directly into arcade ROOF with a low continuous flowering hedge: no walkway pointing into the roof. At arcade front remove the horizontal fence/curb barrier x490-1040 y870-910; make the gray arcade apron merge openly and smoothly into the southern cream road, so cabinets can be approached directly. Roads should have clean readable edges, no plants/lamps/posts in walkable lanes. Retain trees, flowers, cliffs and river outside road changes. Preserve left and right outer scenery and all sign wording. Do not add people, characters, UI or text. High quality pixel detail identical to original. Main purpose: both left and right roads clearly lead from central plaza to arcade FRONT, INFO is east of the new right road.

碰撞座標依實際生成圖重新量測，沒有直接假設生成圖精確遵循提示詞座標。

## NPC 服裝與姓名牌

阿長改穿深藍西裝，莘蒂改穿粉色 A 字洋裝。內建 imagegen 編輯結果保存在 `reference/npc-outfits-source.png`，沿用已獲同意的程式去背流程，由 `scripts/pixel-assets/build-npc-outfits.ts` 產出 `public/assets/v2/npcs-outfits.png`；BOT 欄直接保留原檔像素。

姓名牌由 11px 提升到 18px，採 3 倍文字解析度、白字深藍底、線性取樣；獨立顯示於場景前景上方，避免名字被建築蓋住。實際瀏覽器確認兩套服裝與三個姓名牌顯示正常，型別與素材檢查通過。

生成提示詞：Edit ONLY the clothing of the two humans in this transparent pixel RPG NPC sprite sheet. Keep exact 1536x1024 canvas, 3 columns of 512x1024, characters at identical positions and sizes. Left man: replace white lab coat with tailored dark navy BUSINESS SUIT, matching suit jacket and trousers, white shirt, blue tie, black dress shoes. No lab coat, no ID lanyard. Middle woman: replace jacket/blouse/skirt outfit with a single elegant pink A-LINE DRESS, fitted bodice, clearly flared knee-length skirt, short sleeves, small waist ribbon, pink or dark shoes. Keep her handheld microphone. Preserve both original faces, hairstyles, cute proportions and pixel shading. Right robot remains completely unchanged. Preserve genuine transparent alpha background, no gray checkerboard, no glow, no added scenery, no text.

## 移除 INFO 下方長椅

內建 imagegen 將 INFO 下方長椅及陰影移除，补成草地，正式背景為 `public/assets/v2/town-no-bench.png`。Boot 與開始畫面同步引用；刪除長椅碰撞，保留旁邊樹叢。

提示詞：Precise object removal. Remove ONLY the small wooden BENCH directly BELOW the purple INFO booth, at pixel rectangle x1182 y698 to1292 y767 in this 1536x1024 image. Replace that bench and its shadow with unobstructed matching green grass ground. Preserve the small tree immediately to its right, the nearby gray post, flowers and all roads. Preserve ALL other pixels and all building positions, signs, color, art style, camera, canvas dimensions. Do NOT remove any other benches: keep the bench near LAB on the left and bottom left bench unchanged. Do NOT change the INFO service counter, roof, or building. Only remove the outdoor bench below INFO. Full image 1536x1024.


## Southern arcade replacement (2026-09-11)

Replaced the tiled southern garden with `public/assets/v2/town-south-arcade.png`, generated using built-in imagegen from `reference/jelly-world-new-map.png`. Native 1536×1024 image; the lower region starting at source y=530 is displayed at world y=873. The upper town retains its existing assets.

Prompt: Edit the exact reference map, preserving architecture, paving, trees, rivers and pixel scale. Redesign lower cabinets in place: green stopwatch / 05 TIME; pink 123 / 06 NUMBER; amber blue jellyfish / 07 MEMORY; inactive blue padlock / 08 SOON. Upper fourth cabinet: sorted colored tubes / 04 SORT. Remove people and player characters from paths; no new props or buildings.

South uses a single background and one fading building overlay. No procedural tree masks. Cabinet interactions are at y=1243; left and right walkways connect to the northern arcade. The eighth cabinet has no URL.


## Bulletin flags and memory cabinet (2026-09-11)
Built-in imagegen edits saved as `public/assets/v2/town-no-flags.png` and `public/assets/v2/town-south-memory.png`.

Prompt 1: Edit exact 1536x1024 town. Remove only the two blue banners, poles and stone bases immediately beside EVENT NEWS at x600/x935, y280–455. Fill with matching cream paving. Preserve board, planters, buildings, layout and all other details.

Prompt 2: Edit exact southern map. Redesign only lower third cabinet 07 MEMORY at x827,y744–873: lavender/indigo body with turquoise edges, two overlapping memory cards (question-mark back and tiny jellyfish face). Preserve label, footprint, cabinet size and all other map elements.


## Unified map and seam repair (2026-09-11)
Built-in imagegen combined `town-no-flags.png` and `town-south-memory.png` into `public/assets/v2/town-unified.png`. Actual output: 1330×1183, mapped consistently to the 1536×1367 world. No runtime horizontal splice; facade frames are extracted from the same image with source/world coordinate conversion. This unifies detail rendering; it is not a native-resolution increase.

Prompt: Combine upper source y0–873 with lower source y530–1024 at world offset343 into one seamless map. Preserve LAB, LIVE, board with no flags, INFO, and both arcade buildings. Repair roads, riverbanks, cliffs and trees across y830–960; no horizontal cuts or split trees. Match crisp pixel edges, contrast and detail across both halves. Preserve TIME stopwatch, NUMBER digits, MEMORY cards and SOON lock; no characters or new props in paths. Requested 1536×1367; generator returned 1330×1183, so source/world scaling is explicit.

Final refinement: `public/assets/v2/town-unified-refined.png` (1329×1183). Built-in prompt: refine the exact unified map with crisp pixel edges and consistent lower-half texture, preserve every building/road and label, correct 04 SORT to three tubes. Requested high-resolution output (3072×2736, minimum width2048) but tool returned1329×1183; do not describe it as a resolution increase. Selected for visibly cleaner pixel outlines and unified materials. Runtime has no sorting-screen patch or north/south splice.
