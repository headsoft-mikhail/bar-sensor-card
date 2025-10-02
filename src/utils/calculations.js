import {
  COLORS,
  PALETTES,
} from "../constants.js"

export function isActiveState(state) {
  if (["unavailable", "unknown", "off"].includes(state)) {
    return false;
  }
  return true;
}

export function styleMap(styles_dict) {
    return Object.entries(styles_dict)
      .map(([k,v]) => `${k}: ${v};`)
      .join(" ");
}

export function hexToRgbString(hex) {
  if (!hex) return "";
  let clean = String(hex).replace("#", "");
  if (clean.length === 3) clean = clean.split("").map(x => x + x).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return "";
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

export function computeRgbColor(color) {
  if (!color && color !== "") return "";
  if (color === "primary" || color === "accent") {
    return `var(--rgb-${color}-color)`;
  }
  if (COLORS.includes(color)) {
    return `var(--rgb-${color})`;
  }
  if (typeof color === "string" && color.startsWith("#")) {
    return hexToRgbString(color);
  }
  return color;
}

export function calculateCurrentPercent(current_value, min, max) {
  const minN = Number(min ?? 0);
  const maxN = Number(max ?? 0);
  const curN = Number(current_value ?? 0);
  const range = maxN - minN;
  if (!isFinite(range) || range === 0) return 0;
  const current_percent = Math.max(0, Math.min(100, ((curN - minN) / range) * 100));
  return current_percent;
}

export function getColorForValue(current_percent, palette_name) {
  const palette = PALETTES[palette_name]
  let current_color_index = Math.min(palette.length - 1, Math.floor(current_percent / (100 / palette.length)));
  return palette[current_color_index];
}

export function getDisplayValue(value, decimals) {
  const v = Number(parseFloat(value));

  if (!isFinite(v)) return 0;
  if (decimals === undefined || decimals === null) return v;
  const d = Number(decimals);
  if (!Number.isFinite(d)) return v;
  if (d === 0) return Math.round(v);
  return parseFloat(v.toFixed(d));
}

export function getDisplayUnit(u) {
  if (["%", ""].includes(u)) {
    return u
  }
  return " " + u
}

export function selectSensorIcon(device_class, current_percent) {
  switch (device_class) {
    case "battery":
      if (isNaN(current_percent) || current_percent < 0) return "mdi:battery-unknown";
      if (current_percent <= 5) return "mdi:battery-outline";
      if (current_percent >= 100) return "mdi:battery"; 
      return `mdi:battery-${Math.floor(current_percent / 10) * 10}`;
    case "temperature":
      return "mdi:thermometer";
    case "humidity":
      return "mdi:water-percent";
    case "power":
      return "mdi:flash";
    case "energy":
      return "mdi:lightning-bolt";
    case "pressure":
      return "mdi:gauge";
    case "signal_strength":
      if (isNaN(current_percent) || current_percent < 0) return "mdi:wifi-strength-alert-outline";
      if (current_percent <= 20) return "mdi:wifi-strength-outline";
      if (current_percent <= 40) return "mdi:wifi-strength-1";
      if (current_percent <= 60) return "mdi:wifi-strength-2";
      if (current_percent <= 80) return "mdi:wifi-strength-3";
      return "mdi:wifi-strength-4";
    case "current":
      return "mdi:current-ac";
    case "voltage":
      return "mdi:sine-wave";
    case "illuminance":
      if (isNaN(current_percent) || current_percent < 0) return "mdi:brightness-1";
      if (current_percent <= 30) return "mdi:brightness-5";
      if (current_percent <= 70) return "mdi:brightness-6";
      return "mdi:brightness-7";
    default:
      return "mdi:eye";
  }
}
