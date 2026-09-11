export interface Announcement {
  id: string;
  tag: string;
  title: string;
  body: string;
  placeholderTitle: string;
  placeholderSubtitle: string;
  primaryLabel: string;
  url: string;
}

export const announcements: readonly Announcement[] = [
  {
    id: "ppt-plus-one-triple-lottery",
    tag: "PPT+1 / EVENT NEWS",
    title: "PPT+1 拉霸活動",
    body: "購買 PPT+1 可獲得拉霸次數。點擊下方按鈕前往活動。",
    placeholderTitle: "PPT+1",
    placeholderSubtitle: "COMMUNITY EVENT",
    primaryLabel: "前往拉霸活動",
    url: "https://alberthuang-012s.github.io/012s-jelly-chain-game/",
  },
];
