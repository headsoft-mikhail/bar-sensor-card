import {
    AT_MORE_INFO,
    AT_PERFORM_ACTION,
} from "../constants.js"


const handleAction = (node, hass, config, actionType) => {
  if (!config) return;

  const actionConfig = actionType === "tap" 
  ? config.tap_action || { action: AT_MORE_INFO } 
  : config.hold_action;
  if (!actionConfig) return;

  const { action } = actionConfig;

  switch (action) {
    case AT_MORE_INFO: {
      const entityId = actionConfig.entity || config.entity;
      node.dispatchEvent(new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      }));
      break;
    }
    case AT_PERFORM_ACTION: {
      if (!hass || !actionConfig.perform_action) return;
      const [domain, service] = actionConfig.perform_action.split(".");
      hass.callService(domain, service, actionConfig.target || {});
      break;
    }
    default:
      return;
  }
};

export const actionHandler = (node, hass, config) => {
  if (!node) return;

  let holdTimeout;
  let held = false;
  const holdTime = config.hold_time ?? 500;

  const start = () => {
    if (!config.hold_action) return;
    held = false;
    holdTimeout = setTimeout(() => {
      handleAction(node, hass, config, "hold");
      held = true;
    }, holdTime);
  };

  const clear = () => {
    if (holdTimeout) {
      clearTimeout(holdTimeout);
      holdTimeout = null;
    }
  };

  node.addEventListener("mousedown", start);
  node.addEventListener("mouseup", () => {
    clear();
    if (!held) {
      handleAction(node, hass, config, "tap");
    }
  });
  node.addEventListener("mouseleave", clear);

  node.addEventListener("touchstart", start);
  node.addEventListener("touchend", (ev) => {
    clear();
    if (!held) {
      handleAction(node, hass, config, "tap");
    }
    ev.preventDefault();
  });
  node.addEventListener("touchcancel", clear);
};