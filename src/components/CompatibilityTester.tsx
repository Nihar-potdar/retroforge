import { useState } from "react";
import { cpus } from "../data/cpu";
import { motherboards } from "../data/motherboard";
import { ramKits } from "../data/ram";
import { gpus } from "../data/gpu";
import { cases } from "../data/case";
import { storageDevices } from "../data/storage";
import { assessBuild } from "../Logic/Compatibility/BuildAssessment";
import { buildWithCandidate } from "../Logic/Compatibility/CandidateCompatibility";
import { PowerSummary } from "./PowerSummary";
import type {
  BUILD,
  BuildAssessment,
  CompatibleComponent,
  ComponentType,
} from "../data/type";
import { psus } from "../data/psu";

const componentOptions: Record<ComponentType, CompatibleComponent[]> = {
  CPU: cpus,
  Motherboard: motherboards,
  RAM: ramKits,
  PSU: psus,
  GPU: gpus,
  Case: cases,
  Storage: storageDevices,
};

const componentTypes: ComponentType[] = [
  "CPU",
  "Motherboard",
  "RAM",
  "GPU",
  "Case",
  "Storage",
  "PSU",
];

export default function CompatibilityTester() {
  const [selectedIds, setSelectedIds] = useState<
    Partial<Record<ComponentType, string>>
  >({});

  const [results, setResults] = useState<BuildAssessment | null>(null);

  function handleValidate() {
    const selectedBuild = componentTypes.flatMap((type) => {
      const selectedId = selectedIds[type];

      if (!selectedId) return [];

      const component = componentOptions[type].find(
        (option) => option.id === Number(selectedId),
      );

      return component ? [component] : [];
    });

    const build = selectedBuild.reduce<BUILD>(buildWithCandidate, {
      STORAGE: [],
    });
    setResults(assessBuild(build));
  }

  return (
    <main>
      <h1>Build Compatibility Tester</h1>

      {componentTypes.map((type) => (
        <label key={type} style={{ display: "block", marginBottom: 12 }}>
          {type}:{" "}
          <select
            className="rounded-md border border-slate-700 bg-black px-3 py-2 text-white scheme:dark"
            value={selectedIds[type] ?? ""}
            onChange={(event) =>
              setSelectedIds((current) => ({
                ...current,
                [type]: event.target.value,
              }))
            }
          >
            <option value="" className="bg-black text-white">
              Choose {type}
            </option>

            {componentOptions[type].map((component) => (
              <option
                key={`${type}-${component.id}`}
                value={component.id}
                className="bg-black text-white"
              >
                {component.name}
              </option>
            ))}
          </select>
        </label>
      ))}

      <button type="button" onClick={handleValidate}>
        Validate Build
      </button>

      {results && (
        <section>
          <h2>Results</h2>

          <PowerSummary power={results.power} />
          {results.issues.length === 0 ? (
            <p>
              No supported compatibility issues found in the selected parts.
            </p>
          ) : (
            <ul>
              {results.issues.map((issue) => (
                <li
                  key={issue.key}
                  className={
                    issue.type === "error" ? "text-danger" : "text-amber-600"
                  }
                >
                  {issue.type}: {issue.compatibilityIssue}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
