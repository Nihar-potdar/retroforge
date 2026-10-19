import { createContext, type Dispatch, type SetStateAction } from "react";
import type { CompatibleComponent } from "@/data/type";

export const AppContext = createContext<{
  selectedComponent: CompatibleComponent | null;
  SetSelectedComponent: Dispatch<SetStateAction<CompatibleComponent | null>>;
} | null>(null);
