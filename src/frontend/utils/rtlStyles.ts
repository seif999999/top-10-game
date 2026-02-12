/**
 * RTL-aware style helpers.
 * Use these for logical "start" / "end" spacing and for directional icons
 * so layout and arrows respect RTL (e.g. Arabic).
 */

import type { ViewStyle, TextStyle } from 'react-native';

/**
 * Returns margin for the "start" (leading) side of content in the current layout direction.
 * Use for spacing between icon and text, or before the first item in a row.
 * In LTR: marginRight (e.g. after an icon on the left).
 * In RTL: marginLeft (e.g. after an icon on the right).
 */
export function marginStart(value: number, isRTL: boolean): Pick<ViewStyle, 'marginLeft' | 'marginRight'> {
  return isRTL ? { marginLeft: value } : { marginRight: value };
}

/**
 * Returns margin for the "end" (trailing) side of content.
 */
export function marginEnd(value: number, isRTL: boolean): Pick<ViewStyle, 'marginLeft' | 'marginRight'> {
  return isRTL ? { marginRight: value } : { marginLeft: value };
}

/**
 * Returns padding for the start/end sides (e.g. list padding).
 */
export function paddingStart(value: number, isRTL: boolean): Pick<ViewStyle, 'paddingLeft' | 'paddingRight'> {
  return isRTL ? { paddingRight: value } : { paddingLeft: value };
}

export function paddingEnd(value: number, isRTL: boolean): Pick<ViewStyle, 'paddingLeft' | 'paddingRight'> {
  return isRTL ? { paddingLeft: value } : { paddingRight: value };
}

/**
 * Back arrow: points to the "back" direction (left in LTR, right in RTL).
 */
export function backArrow(isRTL: boolean): string {
  return isRTL ? '→' : '←';
}

/**
 * Forward/next arrow: points to the "forward" direction (right in LTR, left in RTL).
 */
export function forwardArrow(isRTL: boolean): string {
  return isRTL ? '←' : '→';
}

/**
 * Position at the "end" of a row (e.g. close button in header).
 * Use with position: 'absolute' and top/bottom as needed.
 */
export function positionEnd(value: number, isRTL: boolean): Pick<ViewStyle, 'left' | 'right'> {
  return isRTL ? { left: value } : { right: value };
}

export function positionStart(value: number, isRTL: boolean): Pick<ViewStyle, 'left' | 'right'> {
  return isRTL ? { right: value } : { left: value };
}
