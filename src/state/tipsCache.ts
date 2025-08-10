// src/state/tipsCache.ts
export type TipsPayload = any; // replace with your type if you have one

// Single shared cache across pages (module singleton)
export const tipsCache = new Map<string, TipsPayload | null>();

// Keep this in sync with VisionBoardPage/SwipeStack keying
export const tipKeyOf = (p: any, i: number) =>
  String(p?.id ?? p?.productId ?? p?.handle ?? i);
