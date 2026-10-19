import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { cpus } from "@/data/cpu";
import { psus } from "@/data/psu";
import { assessBuild } from "@/Logic/Compatibility/BuildAssessment";
import {
  CompatibilityIssueCard,
  CompatibilityIssuesPanel,
} from "./CompatibilityIssuesPanel";
import { PowerSummary } from "./PowerSummary";

describe("compatibility presentation", () => {
  it("renders a system-level capacity issue without pair references", () => {
    const { issues } = assessBuild({
      CPU: cpus[8],
      PSU: { ...psus[0], wattage: 1 },
      STORAGE: [],
    });
    const html = renderToStaticMarkup(
      createElement(CompatibilityIssueCard, {
        issue: issues[0],
        onSuggestedAction: () => {},
      }),
    );
    expect(html).toContain("PSU capacity is below estimated load");
    expect(html).toContain("283W");
    expect(html).toContain("Review PSU");
    expect(html).toContain(psus[0].name);
  });

  it("distinguishes warning-only and error statuses", () => {
    const build = { CPU: { ...cpus[0], maxPowerW: 100 }, STORAGE: [] };
    const warningIssues = assessBuild({
      ...build,
      PSU: { ...psus[0], wattage: 130 },
    }).issues;
    const errorIssues = assessBuild({
      ...build,
      PSU: { ...psus[0], wattage: 129 },
    }).issues;
    const render = (issues: typeof warningIssues) =>
      renderToStaticMarkup(
        createElement(CompatibilityIssuesPanel, {
          issues,
          onSuggestedAction: () => {},
        }),
      );
    expect(render(warningIssues)).toContain("Compatibility warnings");
    expect(render(warningIssues)).not.toContain("Compatibility errors");
    expect(render(errorIssues)).toContain("Compatibility errors");
    expect(render([])).toContain("No issues found");
  });

  it("marks incomplete estimates and presents the assumptions without a PSU", () => {
    const { power } = assessBuild({ CPU: cpus[8], STORAGE: [] });
    const html = renderToStaticMarkup(createElement(PowerSummary, { power }));
    expect(html).toContain("Partial power estimate");
    expect(html).toContain("Missing:");
    expect(html).toContain("No PSU selected");
    expect(html).toContain("CPU power budget");
    expect(html).toContain("283W load");
  });
});
