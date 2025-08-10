import React from "react";

type Product = any;

type Ctx = {
  items: Product[];
  add: (p: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const VisionBoardCtx = React.createContext<Ctx | null>(null);

export const VisionBoardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = React.useState<Product[]>([]);

  const add = (p: Product) => {
    setItems((prev) => {
      const id = (p?.id ?? p?.productId ?? p?.handle ?? Math.random().toString()) as string;
      const exists = prev.some((x) => (x?.id ?? x?.productId ?? x?.handle) === id);
      return exists ? prev : [...prev, p];
    });
  };

  const remove = (id: string) => {
    setItems((prev) => prev.filter((x) => (x?.id ?? x?.productId ?? x?.handle) !== id));
  };

  const clear = () => setItems([]);

  return (
    <VisionBoardCtx.Provider value={{ items, add, remove, clear }}>
      {children}
    </VisionBoardCtx.Provider>
  );
};

export const useVisionBoard = () => {
  const ctx = React.useContext(VisionBoardCtx);
  if (!ctx) throw new Error("useVisionBoard must be used within <VisionBoardProvider>");
  return ctx;
};
