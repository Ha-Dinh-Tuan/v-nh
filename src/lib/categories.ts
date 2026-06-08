export type Category = {
  name: string;
  emoji: string;
  color: string; // tailwind bg class hex via inline style
  sub: string[];
};

export const CATEGORIES: Category[] = [
  { name: "Ăn uống", emoji: "🍜", color: "#FB7185", sub: ["Cơm", "Đồ ăn vặt", "Trà sữa", "Cafe"] },
  { name: "Đi lại", emoji: "🛵", color: "#F59E0B", sub: ["Xăng", "Grab", "Gửi xe"] },
  { name: "Học tập", emoji: "📚", color: "#60A5FA", sub: ["Tài liệu", "Khóa học", "Đồ dùng học tập"] },
  { name: "Giải trí", emoji: "🎮", color: "#A78BFA", sub: ["Game", "Xem phim", "Đi chơi"] },
  { name: "Người yêu", emoji: "💖", color: "#EC4899", sub: ["Ăn uống", "Quà tặng", "Hẹn hò", "Du lịch"] },
  { name: "Khác", emoji: "✨", color: "#94A3B8", sub: [] },
];

export const findCategory = (name: string) =>
  CATEGORIES.find((c) => c.name === name) ?? CATEGORIES[CATEGORIES.length - 1];
