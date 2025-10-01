export const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
export const html = LitElement.prototype.html;
export const css = LitElement.prototype.css;

export const COLORS = [
  "primary","accent","red","pink","purple","deep-purple","indigo","blue","light-blue",
  "cyan","teal","green","light-green","lime","yellow","amber","orange","deep-orange",
  "brown","light-grey","grey","dark-grey","blue-grey","black","white","disabled",
];

export const PALETTES = {
  "red_to_green": ["red","deep-orange","orange","amber","yellow","lime","light-green","green"],
  "green_to_red": ["green","light-green","lime","yellow","amber","orange","deep-orange","red"],
}

export const DM_BOTH = "both"
export const DM_ICON = "icon"
export const DM_BAR = "bar"
export const DISPLAY_MODES = [DM_BOTH, DM_ICON, DM_BAR]

export const BP_BOTTOM = "bottom"
export const BP_RIGHT = "right"
export const BAR_POSITIONS = [BP_BOTTOM, BP_RIGHT]

export const DEFAULT_MIN_VALUE = 0 
export const DEFAULT_MAX_VALUE = 100
export const DEFAULT_DECIMALS = 2
export const MAX_RIGHT_BAR_HEIGHT = 34
export const DEFAULT_BOTTOM_BAR_HEIGHT = 42
export const DEFAULT_BAR_BORDER_RADIUS = 12
export const VALUE_FONT_SIZE_ROW = 14
export const VALUE_FONT_SIZE_COLUMN = 12
