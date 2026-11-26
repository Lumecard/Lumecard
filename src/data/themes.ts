import { PNG_TEMPLATES } from "../cards/templates";

export interface CardTheme {
  id: string;
  label: string;
  /** Tailwind background classes; "asset" means use the asset's own gradient; "image" means a PNG card */
  bg: string;
  tagline?: string;
  /** PNG card: the two sides. The card can be flipped between them. */
  images?: { front: string; back: string; thumb: string };
}

const BUILT_IN: CardTheme[] = [
  { id: "asset", label: "Classic", bg: "asset" },
  { id: "love", label: "With Love", bg: "bg-gradient-to-br from-rose-400 via-pink-500 to-red-500", tagline: "With love" },
  { id: "thanks", label: "Thank You", bg: "bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500", tagline: "Thank you" },
  { id: "anniversary", label: "Anniversary", bg: "bg-gradient-to-br from-rose-400 via-yellow-300 to-pink-400", tagline: "Happy Anniversary" },
  { id: "birthday", label: "Birthday", bg: "bg-gradient-to-br from-orange-400 via-rose-400 to-blue-700", tagline: "Happy Birthday" },
  { id: "holiday", label: "Holiday", bg: "bg-gradient-to-br from-red-700 via-red-600 to-amber-500", tagline: "Happy Holidays" },
];

export const CARD_THEMES: CardTheme[] = [
  ...BUILT_IN,
  ...PNG_TEMPLATES.map((t): CardTheme => ({ id: t.id, label: t.label, bg: "image", images: { front: t.front, back: t.back, thumb: t.thumb } })),
];
