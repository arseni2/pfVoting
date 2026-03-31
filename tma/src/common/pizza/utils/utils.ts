import type { ProductBadge } from "@/App.vue";

export const getImageUrl = (path: string): string => {
  if (!path) return "";
  if (path.startsWith("//") || path.startsWith("http")) {
    return path;
  }
  return `//cdpiz1.pizzasoft.ru${path}`;
};

export const getIsNew = (badges?: ProductBadge[]): boolean => {
  return badges?.some((badge) => badge.type === "new") ?? false;
};

export const formatWeight = (weight: number): string => {
  if (weight === 0) return "";
  return `${weight} г`;
};

export const getBadgeClasses = (type: string): string => {
  const classes: Record<string, string> = {
    hit: "bg-red-500 text-white",
    new: "bg-green-500 text-white",
    spicy: "bg-orange-500 text-white",
    piquant: "bg-purple-500 text-white",
  };
  return classes[type] || "bg-gray-200 text-gray-700";
};

export const getBadgeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    hit: "хит",
    new: "новинка",
    spicy: "острое",
    piquant: "пикантное",
  };
  return labels[type] || type;
};
