/**
 * Emil Kowalski Craft - Motion & Spring Physics Standards
 * Centralized motion tokens, springs, and variants for NetPulse.
 */

export const springs = {
  // Snappy: For toggles, micro-buttons, checkboxes, tab indicators, FLIP pills
  snappy: { type: "spring", stiffness: 500, damping: 35, mass: 0.8 },

  // Interactive (Default): For dropdowns, popovers, drawers, hover cards, page switches
  interactive: { type: "spring", stiffness: 400, damping: 30 },

  // Smooth / Large: For full modals, page sheets, expanding cards
  smooth: { type: "spring", stiffness: 300, damping: 32 },

  // Bouncy / Playful: For success badges, notifications, celebration icons only
  bouncy: { type: "spring", stiffness: 400, damping: 18 },
} as const;

export const pageTransitionVariants = {
  initial: { opacity: 0, y: 8, scale: 0.995 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.995 },
};

export const cardHoverVariants = {
  rest: { y: 0 },
  hover: { y: -2 },
};

export const modalVariants = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 12 },
};

export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
