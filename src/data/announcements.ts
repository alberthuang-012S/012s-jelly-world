export interface Announcement {
  id: string;
  tag: string;
  title: string;
  body: string;
  placeholderTitle: string;
  placeholderSubtitle: string;
  primaryLabel: string;
  developmentMessage: string;
}

export const announcements: readonly Announcement[] = [
  {
    id: "ppt-plus-one-triple-lottery",
    tag: "PPT+1 / EVENT NEWS",
    title: "PPT+1 三重抽獎活動",
    body: "快來參加PPT+1三重抽獎活動",
    placeholderTitle: "PPT+1",
    placeholderSubtitle: "PRODUCT IMAGE",
    primaryLabel: "查看活動",
    developmentMessage: "活動功能開發中",
  },
];
