import {
    AT_MORE_INFO,
    AT_PERFORM_ACTION,
    ACTION_TYPES,
    DEFAULT_TAP_ACTION,
} from "../constants.js"


const handleAction = (node, hass, config, actionType) => {
  if (!config) return;

  let actionConfig
  switch (actionType) {
    case "tap":
      actionConfig = config.tap_action || DEFAULT_TAP_ACTION;
      break;
    case "hold":
      actionConfig = config.hold_action;
      break;
    default:
      return;
  }
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

const getStartCoords = (event) => {
  if (event.touches && event.touches.length > 0) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
};

const getEndCoords = (event) => {
  if (event.changedTouches && event.changedTouches.length > 0) {
    return { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
};

const detectScroll = (startX, startY, endX, endY, tolerance = 10) => {
  const dx = Math.abs(endX - startX);
  const dy = Math.abs(endY - startY);
  return dx > tolerance || dy > tolerance;
};

const cancelHold = (state) => {
  if (state.holdTimeout) {
    clearTimeout(state.holdTimeout);
    state.holdTimeout = null;
  }
};

const isTapActionEnabled = (config) => {
  const tap = config.tap_action || DEFAULT_TAP_ACTION;
  return ACTION_TYPES.includes(tap.action);
};

const isHoldActionEnabled = (config) => {
  const hold = config.hold_action;
  return hold && ACTION_TYPES.includes(hold.action);
};

const onPressStart = (event, node, hass, config, state) => {
  const { x, y } = getStartCoords(event);
  state.startX = x;
  state.startY = y;
  state.held = false;
  state.scrolling = false;

  if (isTapActionEnabled(config) || isHoldActionEnabled(config)) {
    state.holdTimeout = handleHold(node, hass, config, state.holdTime, () => {
      state.held = true;
    });
  }
};

const onPressMove = (event, state) => {
  const { x, y } = getEndCoords(event);
  if (detectScroll(state.startX, state.startY, x, y)) {
    state.scrolling = true;
    cancelHold(state);
  }
};

const onPressEnd = (event, node, hass, config, state) => {
  cancelHold(state);

  const { x: endX, y: endY } = getEndCoords(event);
  if (state.scrolling || detectScroll(state.startX, state.startY, endX, endY)) return;

  if (!state.held && isTapActionEnabled(config)) handleTap(node, hass, config);
};

const handleTap = (node, hass, config) => {
  handleAction(node, hass, config, "tap");
};

const handleHold = (node, hass, config, holdTime, onHeld) => {
  return setTimeout(() => {
    handleAction(node, hass, config, "hold");
    onHeld();
  }, holdTime);
};

export const actionHandler = (node, hass, config) => {
  if (!node) return;

  const state = {
    holdTimeout: null,
    held: false,
    scrolling: false,
    startX: 0,
    startY: 0,
    holdTime: config.hold_time ?? 500,
  };

  node.addEventListener("mousedown", (event) =>
    onPressStart(event, node, hass, config, state)
  );
  node.addEventListener("mousemove", (event) => onPressMove(event, state));
  node.addEventListener("mouseup", (event) =>
    onPressEnd(event, node, hass, config, state)
  );
  node.addEventListener("mouseleave", () => cancelHold(state));

  node.addEventListener("touchstart", (event) =>
    onPressStart(event, node, hass, config, state),
    { passive: true }
  );
  node.addEventListener("touchmove", (event) => onPressMove(event, state), { passive: true });
  node.addEventListener("touchend", (event) => {
    onPressEnd(event, node, hass, config, state);
    event.preventDefault();
  });
  node.addEventListener("touchcancel", () => cancelHold(state));
};