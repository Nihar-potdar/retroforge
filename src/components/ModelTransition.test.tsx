// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import type { AssemblyItem } from "@/models/placement";
import { productModelRegistry } from "@/models/registry";
import { ModelTransition } from "./ModelTransition";

// SVG hosts let us test React mount/unmount behavior without a WebGL renderer.
vi.mock("@/models/models", () => ({
  ComponentModel: () => <g data-testid="model" />,
}));
vi.mock("./InstallAnimation", () => ({
  InstallAnimation: ({ children }: { children: ReactNode }) => (
    <g data-testid="entrance">{children}</g>
  ),
}));
afterEach(cleanup);
const item: AssemblyItem = {
  key: "cpu:first",
  placement: { position: [0, 0, 0], scale: 1 },
  model: Object.values(productModelRegistry).find(
    (model) => model.kind === "cpu",
  )!,
};

it("removes models synchronously even while their entrance is running", () => {
  const view = render(
    <svg>
      <ModelTransition item={item} shadows={false} animate />
    </svg>,
  );
  expect(view.queryByTestId("model")).not.toBeNull();
  view.rerender(
    <svg>
      <ModelTransition item={null} shadows={false} animate />
    </svg>,
  );
  expect(view.queryByTestId("model")).toBeNull();
  expect(view.queryByTestId("entrance")).toBeNull();
});

it("never retains the old model during replacement or reanimates unchanged initial parts", () => {
  const view = render(
    <svg>
      <ModelTransition item={item} shadows={false} animate={false} />
    </svg>,
  );
  view.rerender(
    <svg>
      <ModelTransition item={item} shadows={false} animate />
    </svg>,
  );
  expect(view.queryByTestId("entrance")).toBeNull();
  const replacement = { ...item, key: "cpu:replacement" };
  view.rerender(
    <svg>
      <ModelTransition item={replacement} shadows={false} animate />
    </svg>,
  );
  expect(view.queryAllByTestId("model")).toHaveLength(1);
  expect(
    view.container.querySelector('group[name="installed:cpu:first"]'),
  ).toBeNull();
  expect(
    view.container.querySelector('group[name="installed:cpu:replacement"]'),
  ).not.toBeNull();
  expect(view.queryByTestId("entrance")).not.toBeNull();
});
