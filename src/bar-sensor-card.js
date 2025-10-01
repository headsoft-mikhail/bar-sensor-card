import {
  LitElement,
  html,
  css,
  PALETTES,
  DISPLAY_MODES,
  DM_BOTH,
  DM_ICON,
  DM_BAR,
  BP_BOTTOM,
  BP_RIGHT,
  BAR_POSITIONS,
  MAX_RIGHT_BAR_HEIGHT,
  DEFAULT_BOTTOM_BAR_HEIGHT,
  DEFAULT_BAR_BORDER_RADIUS,
  DEFAULT_DECIMALS,
  DEFAULT_MIN_VALUE,
  DEFAULT_MAX_VALUE,
  VALUE_FONT_SIZE_ROW,
  VALUE_FONT_SIZE_COLUMN,
} from "./constants.js"
import {
  getDisplayUnit,
  getDisplayValue,
  isActiveState,
  styleMap,
  calculateCurrentPercent,
  computeRgbColor,
  getColorForValue,
  selectSensorIcon,
} from "./utils.js"


class BarSensorCard extends LitElement {
  static get properties() {
    return {
      _hass: { state: true },
      config: { type: Object },
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    if (!config.entity) throw new Error("Entity is required in configuration");
    this.config = config;
  }

  set hass(hass) {
    this._hass = hass;
    this.requestUpdate();
  }

  _handleBarClick(entity) {
    const e = new CustomEvent("hass-more-info", {
      detail: { entityId: entity },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(e);
  }

  _render_icon(icon, color) {
    const iconStyle = {};
    iconStyle["--icon-color"] = `rgb(${color})`;
    iconStyle["--shape-color"] = `rgba(${color}, 0.2)`;
    return html`
    <div class="icon-wrapper" style=${styleMap(iconStyle)}>
      <ha-icon .icon=${icon}></ha-icon>
    </div>`;
  }

  _render_state(title, value, unit, show_value_inline) { 
    const infoStyle = {}
    infoStyle["flex-direction"] = show_value_inline ? "row" : "column";
    infoStyle["justify-content"] = show_value_inline ? "space-between" : "center";
    infoStyle["align-items"] = show_value_inline ? "center" : "flex-start";
    const secondaryStyle = {}
    secondaryStyle["font-size"] = `${show_value_inline ? VALUE_FONT_SIZE_ROW: VALUE_FONT_SIZE_COLUMN}px`
    return html`
      <div class="info" style=${styleMap(infoStyle)}>
        <span class="primary">${title}</span>
        <span class="secondary" style=${styleMap(secondaryStyle)}>${value}${unit}</span>
      </div>`;
  }

  _render_right_bar(percent, color, position, height, border_radius) {
    if (position!=BP_RIGHT) {
      return html``
    }

    const barContainerStyle = {} 
    barContainerStyle["background-color"] = `rgba(${color}, 0.2)`; 
    barContainerStyle["height"] = `${Math.min(MAX_RIGHT_BAR_HEIGHT, height)}px`
    barContainerStyle["width"] = `100%`
    barContainerStyle["border-radius"] = `${border_radius}px`
    const barStyle = {} 
    barStyle["background-color"] = `rgb(${color})`;
    barStyle["width"] = `${percent}%`;
    return html`
    <div class="right-bar-wrapper">
      <div class="bar-container" style=${styleMap(barContainerStyle)}>
        <div class="bar-filler" style=${styleMap(barStyle)}>
        </div>
      </div>
    </div>
    `;
  }

  _render_bottom_bar(percent, color, position, height, border_radius) {
    if (position!=BP_BOTTOM) {
      return html``;
    }

    const barContainerStyle = {} 
    barContainerStyle["background-color"] = `rgba(${color}, 0.2)`; 
    barContainerStyle["height"] = `${height}px`
    barContainerStyle["border-radius"] = `${border_radius}px`
    const barStyle = {} 
    barStyle["background-color"] = `rgb(${color})`;
    barStyle["width"] = `${percent}%`;
    return html`
      <div class="bottom-bar-wrapper">
        <div class="bar-container" style=${styleMap(barContainerStyle)}>
          <div class="bar-filler" style=${styleMap(barStyle)}>
          </div>
        </div>
      </div>
    `;
  }


  render() {
    if (!this._hass || !this.config) return html``;

    const entity = this._hass.states?.[this.config?.entity];
    if (!entity) return html`<ha-card><div class="card">Entity not found: ${this.config.entity}</div></ha-card>`;

    const display_mode = DISPLAY_MODES.includes(this.config?.display_mode)? this.config.display_mode: DM_BOTH
    const show_icon = [DM_BOTH, DM_ICON].includes(display_mode)
    const show_bar = [DM_BOTH, DM_BAR].includes(display_mode)

    let display_value
    let unit
    let current_percent
    let icon_color_key
    let bar_color_key

    if (isActiveState(entity.state)) {
      unit = getDisplayUnit(entity.attributes?.unit_of_measurement || "")
      const decimals = Number.isInteger(this.config?.decimals) ? this.config.decimals : DEFAULT_DECIMALS;
      display_value = getDisplayValue(entity.state, decimals)

      const min = this.config?.min ?? DEFAULT_MIN_VALUE;
      const max = this.config?.max ?? DEFAULT_MAX_VALUE;
      current_percent = calculateCurrentPercent(display_value, min, max);

      const palette_name = Object.keys(PALETTES).includes(this.config?.palette)?  this.config?.palette : "red_to_green";
      const dynamic_color_key = getColorForValue(current_percent, palette_name);

      const enable_dynamic_icon_color = !!this.config?.enable_dynamic_icon_color;
      icon_color_key = enable_dynamic_icon_color ? dynamic_color_key : this.config?.icon_color || this.config?.color || "var(--rgb-accent-color)";
      
      const enable_dynamic_bar_color = !!this.config?.enable_dynamic_bar_color;
      bar_color_key = enable_dynamic_bar_color ? dynamic_color_key : this.config?.bar_color || this.config?.color || "var(--rgb-accent-color)";
    } else {
      display_value = entity.state
      unit = ""
      current_percent = 0
      icon_color_key = "var(--rgb-disabled)"
      bar_color_key = "var(--rgb-disabled)"
    } 
        
    const stateHtml = this._render_state(this.config?.title || entity.attributes?.friendly_name, display_value, unit, this.config.show_value_inline)

    let iconHtml
    if (show_icon) {
      const icon = this.config?.icon || entity.attributes?.icon || selectSensorIcon(entity?.attributes?.device_class, current_percent);
      const icon_color = computeRgbColor(icon_color_key);
      iconHtml = this._render_icon(icon, icon_color);
    } else {
      iconHtml = ""
    }

    let rightBarHtml
    let bottomBarHtml
    
    if (show_bar) {
      const bar_color = computeRgbColor(bar_color_key)
      const bar_position = BAR_POSITIONS.includes(this.config?.bar_position)? this.config?.bar_position: BP_BOTTOM
      rightBarHtml = this._render_right_bar(
        current_percent, 
        bar_color, 
        bar_position,
        this.config?.bar_height || MAX_RIGHT_BAR_HEIGHT, 
        this.config?.bar_border_radius || DEFAULT_BAR_BORDER_RADIUS,
      );      
      bottomBarHtml = this._render_bottom_bar(
        current_percent, 
        bar_color, 
        bar_position,
        this.config?.bar_height || DEFAULT_BOTTOM_BAR_HEIGHT, 
        this.config?.bar_border_radius || DEFAULT_BAR_BORDER_RADIUS,
      );
    } else {
      rightBarHtml = ""
      bottomBarHtml = ""
    }

    return html`
      <ha-card class="bar-sensor-card" @click=${() => this._handleBarClick(this.config?.entity)}>
        <div class="content">
          ${iconHtml}
          ${stateHtml}
          ${rightBarHtml}
        </div>
        ${bottomBarHtml}
      </ha-card>
    `;
  }

  getCardSize() {
    return 1;
  }

  static get styles() {
    return css`
      :host {
        --rgb-red: 244, 67, 54;
        --rgb-pink: 233, 30, 99;
        --rgb-purple: 146, 107, 199;
        --rgb-deep-purple: 110, 65, 171;
        --rgb-indigo: 63, 81, 181;
        --rgb-blue: 33, 150, 243;
        --rgb-light-blue: 3, 169, 244;
        --rgb-cyan: 0, 188, 212;
        --rgb-teal: 0, 150, 136;
        --rgb-green: 76, 175, 80;
        --rgb-light-green: 139, 195, 74;
        --rgb-lime: 205, 220, 57;
        --rgb-yellow: 255, 235, 59;
        --rgb-amber: 255, 193, 7;
        --rgb-orange: 255, 152, 0;
        --rgb-deep-orange: 255, 111, 34;
        --rgb-brown: 121, 85, 72;
        --rgb-light-grey: 189, 189, 189;
        --rgb-grey: 158, 158, 158;
        --rgb-dark-grey: 96, 96, 96;
        --rgb-blue-grey: 96, 125, 139;
        --rgb-black: 0, 0, 0;
        --rgb-white: 255, 255, 255;
        --rgb-disabled: 189, 189, 189;
      }
      .bar-sensor-card {
        cursor: pointer;
      }
      .bar-sensor-card .content {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 10px;
      }
      .icon-wrapper {
        width: 37px;
        height: 37px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--shape-color);
        flex-shrink: 0;
      }
      .icon-wrapper ha-icon {
        color: var(--icon-color);
        width: 24px;
        height: 24px;
      }
      .info {
        display: flex;   
        flex: 1 1 0;               
        min-width: 0;              
        overflow: hidden;   
        gap: 4px;       
      }
      .info .primary {
        flex: 1 1 auto;            
        overflow: hidden;          
        text-overflow: ellipsis;   
        white-space: nowrap;       
        font-size: 14px;
        font-weight: 600;
        line-height: 20px;
        color: var(--primary-text-color, #fff);
      }
      .info .secondary {
        flex: 0 0 auto;   
        overflow: hidden;          
        text-overflow: ellipsis;   
        white-space: nowrap;              
        line-height: 15px;
        color: var(--primary-text-color, #fff);
        padding: 0 4px 0 0;
      }
      .bottom-bar-wrapper {
        padding: 0px 12px 12px 12px
      }
      .right-bar-wrapper {
        flex: 1;
        min-width: 50%;
        display: flex;
        align-items: center;
      }
      .bar-container {
        overflow: hidden;
        width: 100%;
        pointer-events: none;
      }
      .bar-filler {
        height: 100%;
        transition: width 0.4s ease;
        pointer-events: none;
      }
  `;
  }
}


if (!customElements.get("bar-sensor-card")) {
  customElements.define("bar-sensor-card", BarSensorCard);
}

(window).customCards = (window).customCards || [];
(window).customCards.push({
  type: 'bar-sensor-card',
  name: 'Bar Sensor Card',
  description: 'Custom mushroom-like sensor card with dynamic colored icon and bar',
});
