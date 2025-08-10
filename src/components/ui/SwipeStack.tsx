import React from "react";
import {
  motion,
  AnimatePresence,
  useAnimationControls,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { ProductCard } from "@shopify/shop-minis-react";

type KeyFn = (item: any, index: number) => string;

export interface SwipeStackProps {
  items: any[];
  keyExtractor?: KeyFn;
  width?: number;
  gapY?: number;
  gapScale?: number;
  dismissOffset?: number;
  dismissVelocity?: number;
  onSwipeLeft?: (key: string) => void | Promise<void>;
  onSwipeRight?: (key: string) => void | Promise<void>;
  onCardClick?: (product: any) => void;
  onTopChange?: (topItem: { key: string; product: any } | null) => void;
  dropTargets?: {
    getRects: () => { left: DOMRect | null; right: DOMRect | null };
    onHover?: (side: "left" | "right" | null) => void;
    onDropPulse?: (side: "left" | "right") => void;
    hoverPadding?: number; // extra px radius to begin hover
  };
}

const DEFAULTS = {
  width: 220,
  gapY: 12,
  gapScale: 0.05,
  dismissOffset: 120,
  dismissVelocity: 700,
};

const defaultKeyExtractor: KeyFn = (it, i) =>
  String(it?.id ?? it?.productId ?? it?.handle ?? i);

export default function SwipeStack({
  items,
  keyExtractor = defaultKeyExtractor,
  width = DEFAULTS.width,
  gapY = DEFAULTS.gapY,
  gapScale = DEFAULTS.gapScale,
  dismissOffset = DEFAULTS.dismissOffset,
  dismissVelocity = DEFAULTS.dismissVelocity,
  onSwipeLeft,
  onSwipeRight,
  onCardClick,
  onTopChange,
  dropTargets,
}: SwipeStackProps) {
  const [order, setOrder] = React.useState<string[]>([]);
  const [keyMap, setKeyMap] = React.useState<Record<string, any>>({});

  React.useEffect(() => {
    const keys = items.map(keyExtractor);
    setKeyMap(Object.fromEntries(keys.map((k, i) => [k, items[i]])));
    setOrder((prev) => {
      const kept = prev.filter((k) => keys.includes(k));
      const incoming = keys.filter((k) => !kept.includes(k));
      return [...kept, ...incoming];
    });
  }, [JSON.stringify(items.map(keyExtractor))]);

  // Track top card changes and notify parent
  React.useEffect(() => {
    if (onTopChange) {
      if (order.length === 0) {
        onTopChange(null);
      } else {
        const topKey = order[order.length - 1];
        const topProduct = keyMap[topKey];
        if (topProduct) {
          onTopChange({ key: topKey, product: topProduct });
        }
      }
    }
  }, [order, keyMap, onTopChange]);

  const handleLeft = async (key: string) => {
    setOrder((prev) => prev.filter((k) => k !== key));
    await onSwipeLeft?.(key);
  };

  const handleRight = async (key: string) => {
    // remove (no cycle)
    setOrder((prev) => prev.filter((k) => k !== key));
    await onSwipeRight?.(key);
  };

  return (
    <div className="relative" style={{ width }}>
      <AnimatePresence initial={false}>
        {order.map((key, idx) => {
          const isTop = idx === order.length - 1;
          const depth = order.length - 1 - idx; // 0 = top
          const product = keyMap[key];
          if (!product) return null;
          return (
            <StackCard
              key={key}
              z={100 + idx}
              depth={depth}
              width={width}
              gapY={gapY}
              gapScale={gapScale}
              dismissOffset={dismissOffset}
              dismissVelocity={dismissVelocity}
              product={product}
              isTop={isTop}
              onSwipeLeft={() => handleLeft(key)}
              onSwipeRight={() => handleRight(key)}
              onTapCard={onCardClick}
              dropTargets={dropTargets}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------ Card ---------------------------------- */

function StackCard({
  product,
  depth,
  z,
  width,
  gapY,
  gapScale,
  dismissOffset,
  dismissVelocity,
  isTop,
  onSwipeLeft,
  onSwipeRight,
  onTapCard,
  dropTargets,
}: {
  product: any;
  depth: number;
  z: number;
  width: number;
  gapY: number;
  gapScale: number;
  dismissOffset: number;
  dismissVelocity: number;
  isTop: boolean;
  onSwipeLeft: () => void | Promise<void>;
  onSwipeRight: () => void | Promise<void>;
  onTapCard?: (product: any) => void;
  dropTargets?: SwipeStackProps["dropTargets"];
}) {
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const scale = 1 - depth * gapScale;
  const y = depth * gapY;

  // hover tracking against dock icons
  const hoverSideRef = React.useRef<"left" | "right" | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Tap vs drag
  const startPt = React.useRef<{ x: number; y: number } | null>(null);
  const didDrag = React.useRef(false);
  const TAP_MOVE_TOLERANCE = 8;

  React.useEffect(() => {
    if (!isTop) {
      controls.set({ x: 0, rotate: 0, opacity: 1 });
    }
  }, [isTop, controls]);

  const insideWithPadding = (point: { x: number; y: number }, rect: DOMRect, pad = 0) => {
    return (
      point.x >= rect.left - pad &&
      point.x <= rect.right + pad &&
      point.y >= rect.top - pad &&
      point.y <= rect.bottom + pad
    );
  };

  const onDrag: React.ComponentProps<typeof motion.div>["onDrag"] = (_, info) => {
    if (!isTop || !dropTargets?.getRects) return;
    const rects = dropTargets.getRects();
    const pad = dropTargets.hoverPadding ?? 24;

    const px = info.point.x;
    const py = info.point.y;
    let side: "left" | "right" | null = null;

    if (rects.left && insideWithPadding({ x: px, y: py }, rects.left, pad)) side = "left";
    else if (rects.right && insideWithPadding({ x: px, y: py }, rects.right, pad)) side = "right";

    if (side !== hoverSideRef.current) {
      hoverSideRef.current = side;
      dropTargets.onHover?.(side);
    }
  };

  const onEnd = async (_: any, info: { point: { x: number; y: number }; offset: { x: number }; velocity: { x: number } }) => {
    // If we are hovering over a dock icon, treat as a drop immediately
    if (hoverSideRef.current) {
      const side = hoverSideRef.current;
      // pulse the icon
      dropTargets?.onDropPulse?.(side);
      // fade & shrink the card a touch
      await controls.start({ scale: 0.9, opacity: 0, transition: { duration: 0.18 } });
      if (side === "left") {
        await onSwipeLeft();
      } else {
        await onSwipeRight();
      }
      // reset hover state
      hoverSideRef.current = null;
      dropTargets?.onHover?.(null);
      return;
    }

    // Otherwise fall back to threshold-based swipe
    const dx = info.offset.x;
    const vx = info.velocity.x;

    if (dx < -dismissOffset || vx < -dismissVelocity) {
      await controls.start({ x: -window.innerWidth, rotate: -18, opacity: 0, transition: { duration: 0.22 } });
      await onSwipeLeft();
      return;
    }
    if (dx > dismissOffset || vx > dismissVelocity) {
      await controls.start({ x: window.innerWidth, rotate: 18, opacity: 0, transition: { duration: 0.22 } });
      await onSwipeRight();
      return;
    }
    await controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 600, damping: 40, mass: 0.8 } });
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    startPt.current = { x: e.clientX, y: e.clientY };
    didDrag.current = false;
  };
  const handleDragStart = () => { didDrag.current = true; };
  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!onTapCard || !startPt.current) return;
    if (didDrag.current) {
      const dx = Math.abs(e.clientX - startPt.current.x);
      const dy = Math.abs(e.clientY - startPt.current.y);
      if (dx > TAP_MOVE_TOLERANCE || dy > TAP_MOVE_TOLERANCE) return;
    }
    onTapCard(product);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: y + 20, scale: scale * 0.98 }}
      animate={{ opacity: 1, y, scale }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="absolute left-1/2 -translate-x-1/2"
      style={{ zIndex: z, width }}
    >
      <motion.div
        ref={cardRef}
        drag={isTop ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        dragMomentum={false}
        onDrag={onDrag}
        onDragStart={isTop ? handleDragStart : undefined}
        onDragEnd={isTop ? onEnd : undefined}
        style={{ x, rotate }}
        animate={controls}
        whileTap={isTop ? { cursor: "grabbing", scale: 0.99 } : undefined}
        className="relative will-change-transform"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-gray-200/70 px-2 pt-2 pb-3 vision-board-card">
          <div className="overflow-hidden rounded-xl pointer-events-auto">
            <ProductCard product={product} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
