import { useState, type ReactNode } from "react";
import { AppContext } from "./SelectedComponentContext";
import type { CompatibleComponent } from "@/data/type";

export function SelectComponentProvider({ children }: { children: ReactNode }) {
  const [selectedComponent, SetSelectedComponent] =
    useState<CompatibleComponent | null>(null);

  return (
    <AppContext.Provider value={{ selectedComponent, SetSelectedComponent }}>
      {children}
    </AppContext.Provider>
  );
}
