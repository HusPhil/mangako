import { Dimensions, StatusBar } from "react-native";

export const SCREEN_WIDTH = Dimensions.get("window").width;
export const SCREEN_HEIGHT = Dimensions.get("window").height;
export const STATUS_BAR_HEIGHT = StatusBar.currentHeight ?? 0;

// Direction lock
export const DIRECTION_LOCK_THRESHOLD = 10;
export const DIRECTION_LOCK_THRESHOLD_SQ =
  DIRECTION_LOCK_THRESHOLD * DIRECTION_LOCK_THRESHOLD;

// Panning angle limits
export const MAX_HORIZONTAL_ANGLE_DEG = 30;
export const MAX_ANGLE_TAN = Math.tan(
  MAX_HORIZONTAL_ANGLE_DEG * (Math.PI / 180),
);
export const MAX_FLIP_ANGLE_TAN = MAX_ANGLE_TAN; // same value, single source of truth

// Page flip / list drag
export const LIST_DRAG_OVERFLOW_THRESHOLD = 4;
export const PAGE_FLIP_VELOCITY_THRESHOLD = 500;

// Double-tap zoom
export const DOUBLE_TAP_ZOOM_SCALE = 2.5;
export const DOUBLE_TAP_MAX_DURATION = 300; // ms
export const DOUBLE_TAP_MAX_DISTANCE = 40; // px
export const DOUBLE_TAP_ZOOM_DURATION = 300; // ms

// Tap zone
export const SIDE_TAP_ZONE_WIDTH = SCREEN_WIDTH / 3;
