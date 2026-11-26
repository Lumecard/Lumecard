import type { CardTheme } from "../data/themes";

/** Starts downloading a PNG card's pictures now, so they are ready when the card is shown. */
export function preloadCard(theme: CardTheme | undefined) {
  if (!theme?.images) return;
  for (const src of [theme.images.front, theme.images.back]) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}
