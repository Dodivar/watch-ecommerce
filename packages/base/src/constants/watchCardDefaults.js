/** Viewport min-width for desktop hover second image on WatchCard */
export const DESKTOP_HOVER_SECOND_IMAGE_MQ = '(min-width: 768px)'

/** Max images navigable on catalog grid cards (collection, search). */
export const WATCH_CARD_MAX_IMAGES = 5

/** Shared props for carousels (hover swap, no swipe navigation). */
export const WATCH_CARD_CATALOG_PROPS = {
  hoverSecondImage: true,
  showImageNavigation: false,
}

/** Shared props for catalog grids (collection, search). */
export const WATCH_CARD_GRID_PROPS = {
  hoverSecondImage: false,
  showImageNavigation: true,
}
