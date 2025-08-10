// src/components/ui/LongPressToAdd.tsx
import React from "react";
import "animate.css";
import { useLongPress } from "use-long-press";
import { useVisionBoard } from "../../context/VisionBoardContext";

type Props = {
  product: any;
  children: React.ReactNode;
  onAdded?: () => void; // parent removes from grid & triggers global toast
};

export default function LongPressToAdd({ product, children, onAdded }: Props) {
  const { add } = useVisionBoard();

  const [popping, setPopping] = React.useState(false);
  const [disabled, setDisabled] = React.useState(false);

  // Suppress the click that often follows a long-press so ProductCard doesn't open
  const suppressClickRef = React.useRef(false);
  const swallowIfSuppressed = (e: React.SyntheticEvent) => {
    if (!suppressClickRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent?.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
  };

  const handleAdd = React.useCallback(() => {
    if (disabled) return;
    setDisabled(true);

    // pop animation + add
    setPopping(true);
    add(product);
    onAdded?.();

    // suppress the “click after press” for a moment
    suppressClickRef.current = true;
    setTimeout(() => { suppressClickRef.current = false; }, 600);

    // end the pop + re-enable
    setTimeout(() => {
      setPopping(false);
      setDisabled(false);
    }, 400);
  }, [add, product, onAdded, disabled]);

  const bind = useLongPress(handleAdd, {
    threshold: 450,
    cancelOnMovement: 12,
    captureEvent: true,
  });

  return (
    <div
      {...bind()}
      onClickCapture={swallowIfSuppressed}
      onPointerUpCapture={swallowIfSuppressed}
      onTouchEndCapture={swallowIfSuppressed}
      onMouseUpCapture={swallowIfSuppressed}
      onContextMenu={(e) => e.preventDefault()}
      className="relative select-none cursor-pointer"
      style={{
        WebkitUserSelect: "none",
        userSelect: "none",
        WebkitTouchCallout: "none",
        touchAction: "manipulation",
      }}
    >
      <div className={popping ? "animate__animated animate__faster animate__heartBeat" : ""}>
        {children}
      </div>

      {/* hint */}
      <div className="pointer-events-none absolute inset-x-0 -top-3 flex justify-center">
        <div className="text-[10px] text-gray-500 bg-white/80 backdrop-blur px-2 py-0.5 rounded-full shadow">
          Press & hold to add
        </div>
      </div>
    </div>
  );
}
