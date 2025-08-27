// src/components/ui/LongPressToAdd.tsx
import React from "react";
import { useLongPress } from "use-long-press";
import { useVisionBoard } from "../context/VisionBoardContext";
import { motion } from "framer-motion";


type Props = {
 product: any;
 children: React.ReactNode;
 onAdded?: (product: any, element: HTMLElement | null) => void; // parent removes from grid & triggers animation
};


export default function LongPressToAdd({ product, children, onAdded }: Props) {
 const { add } = useVisionBoard();


 const [popping, setPopping] = React.useState(false);
 const [disabled, setDisabled] = React.useState(false);
 const elementRef = React.useRef<HTMLDivElement>(null);


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
   onAdded?.(product, elementRef.current);


   // suppress the "click after press" for a moment
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
     ref={elementRef}
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
     <motion.div
       animate={popping ? { scale: [1, 1.3, 1, 1.3, 1] } : {}}
       transition={{ duration: 0.4 }}
     >
       {children}
     </motion.div>
   </div>
 );
}



