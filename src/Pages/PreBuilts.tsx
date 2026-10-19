import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { prebuilts } from "@/data/PreBuilds";
import type { preBuild } from "@/data/type";
import { useBuildStore } from "@/stores/BuildStore";
import { assessBuild } from "@/Logic/Compatibility/BuildAssessment";
import { HardwareImage } from "@/components/HardwarePhoto";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { toast } from "sonner";
function getBuildPrice(prebuilt: preBuild) {
  const { build } = prebuilt;
  return (
    [
      build.CPU,
      build.GPU,
      build.RAM,
      build.MOTHERBOARD,
      build.PSU,
      build.CASE,
    ].reduce((sum, part) => sum + (part?.price ?? 0), 0) +
    build.STORAGE.reduce((sum, drive) => sum + drive.product.price, 0)
  );
}
export function Prebuilts() {
  const navigate = useNavigate();
  const setBuild = useBuildStore((state) => state.setBuild);
  function choose(prebuilt: preBuild) {
    const conflict = assessBuild(prebuilt.build).issues.find(
      (issue) => issue.type === "error",
    );
    if (conflict) {
      toast.error(conflict.compatibilityIssue);
      return;
    }
    setBuild(prebuilt.build, "load");
    toast.success(`${prebuilt.name} loaded`);
    navigate("/build");
  }
  return (
    <main className="editorial-page">
      <NavBar variant="prebuilts" />
      <div className="page-gutter">
        <section className="editorial-intro">
          <h1>
            A starting point.
            <br />
            Not a finishing line.
          </h1>
          <p>
            Skip the blank page. Pick a configuration, open it in 3D, and change
            anything. The fun part is making it yours.
          </p>
        </section>
        <section
          className="prebuilt-gallery"
          aria-label="Preconfigured PC builds"
        >
          {prebuilts.map((prebuilt) => (
            <article className="prebuilt-card" key={prebuilt.id}>
              <div className="prebuilt-art">
                <span>{prebuilt.tier} build</span>
                <HardwareImage kind="assembly" />
                <small>Example PC · configurations below vary</small>
              </div>
              <div className="prebuilt-card-body">
                <h2>{prebuilt.name}</h2>
                <p>{prebuilt.description}</p>
                <dl className="prebuilt-specs">
                  <div>
                    <dt>Processor</dt>
                    <dd>{prebuilt.build.CPU?.name ?? "Not configured"}</dd>
                  </div>
                  <div>
                    <dt>Graphics</dt>
                    <dd>{prebuilt.build.GPU?.name ?? "Not configured"}</dd>
                  </div>
                  <div>
                    <dt>Memory</dt>
                    <dd>
                      {prebuilt.build.RAM
                        ? `${prebuilt.build.RAM.capacity}GB ${prebuilt.build.RAM.type}`
                        : "Not configured"}
                    </dd>
                  </div>
                  <div>
                    <dt>Storage</dt>
                    <dd>
                      {prebuilt.build.STORAGE.map(
                        (drive) => drive.product.name,
                      ).join(", ") || "Not configured"}
                    </dd>
                  </div>
                </dl>
                <div className="prebuilt-card-bottom">
                  <div>
                    <small>Sample parts total</small>
                    <strong>${getBuildPrice(prebuilt).toFixed(2)}</strong>
                  </div>
                  <button onClick={() => choose(prebuilt)}>
                    Use build <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
        <p className="prebuilt-note">
          Prices are sample catalogue data, not live offers. Previews are
          illustrative. Compatibility checks stay active while you customize;
          verify specifications with the manufacturer before purchasing.
        </p>
      </div>
      <Footer variant="guides" />
    </main>
  );
}
