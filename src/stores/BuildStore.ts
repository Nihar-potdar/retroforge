import type { BUILD, Category } from "@/data/type";
import { cases } from "@/data/case";
import { create } from "zustand";

export type BuildIntent = "initial" | "edit" | "load" | "reset";
export const DEFAULT_CASE = cases.find((part) => part.id === 3)!;
export function createFreshBuild(): BUILD {
  return { CASE: { ...DEFAULT_CASE }, STORAGE: [] };
}
type BuildUpdate = BUILD | ((previous: BUILD) => BUILD);
type BuildStore = {
  build: BUILD;
  intent: BuildIntent;
  revision: number;
  defaultCaseNotice: boolean;
  dismissDefaultCaseNotice: () => void;
  setBuild: (
    update: BuildUpdate,
    intent?: Exclude<BuildIntent, "initial">,
  ) => void;
  setPart: <K extends Category>(category: K, part: BUILD[K]) => void;
};
export const useBuildStore = create<BuildStore>((set) => ({
  build: createFreshBuild(),
  intent: "initial",
  revision: 0,
  defaultCaseNotice: true,
  dismissDefaultCaseNotice: () => set({ defaultCaseNotice: false }),
  setBuild: (update, intent = "edit") =>
    set((state) => {
      const build = typeof update === "function" ? update(state.build) : update;
      return {
        build,
        intent,
        revision: state.revision + 1,
        defaultCaseNotice:
          intent === "reset" ||
          (intent === "edit" &&
            state.defaultCaseNotice &&
            build.CASE === state.build.CASE),
      };
    }),
  setPart: (category, part) =>
    set((state) => ({
      build: { ...state.build, [category]: part },
      intent: "edit",
      revision: state.revision + 1,
      defaultCaseNotice: category === "CASE" ? false : state.defaultCaseNotice,
    })),
}));
