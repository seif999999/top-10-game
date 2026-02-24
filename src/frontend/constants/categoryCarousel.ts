/**
 * Shared dimensions for category carousel (Game Setup & Multiplayer Category).
 * Fixed values so cards and nav buttons look identical on every screen.
 */
export const CATEGORY_CAROUSEL = {
  /** Card width in px - same on all devices */
  CARD_WIDTH: 280,
  /** Card height in px (aspect ratio ~5:4) */
  CARD_HEIGHT: 350,
  /** Left/right nav button size in px - compact, no border */
  NAV_BUTTON_SIZE: 40,
  /** Chevron font size for nav buttons */
  NAV_CHEVRON_FONT_SIZE: 20,
  /** Card border radius */
  CARD_BORDER_RADIUS: 24,
} as const;
