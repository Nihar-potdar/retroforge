import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { HardwarePhoto } from "@/components/HardwarePhoto";
import { partLessons } from "@/data/partLessons";

export function Home() {
  const [selected, setSelected] = useState(0);
  const part = partLessons[selected]!;
  return (
    <div className="exhibition-home">
      <NavBar variant="home" />
      <main>
        <section
          className="redline-hero page-gutter"
          aria-labelledby="main-content"
        >
          <div className="hero-intro">
            <h1 id="main-content">
              Your next PC.
              <br />
              Built different.
            </h1>
            <div className="hero-copy">
              <p>
                Get to know the parts. See how they fit together. Build a PC
                that feels like you.
              </p>
              <Link to="/build" className="exhibit-button">
                Start building <ArrowUpRight size={20} />
              </Link>
              <a href="#parts" className="subtle-link">
                New to PCs? Meet the parts ↓
              </a>
            </div>
          </div>
          <HardwarePhoto
            kind="gpu"
            eager
            sizes="(max-width: 700px) 90vw, 80vw"
          />
        </section>
        <section
          id="parts"
          className="parts-exhibition page-gutter"
          aria-labelledby="parts-title"
        >
          <div className="section-intro">
            <h2 id="parts-title">Know your hardware.</h2>
            <p>A computer is a team. Pick a part to see what it brings.</p>
          </div>
          <div
            className="part-picker"
            role="group"
            aria-label="Explore computer parts"
          >
            {partLessons.map((item, i) => (
              <button
                key={item.id}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="part-exhibit">
            <HardwarePhoto key={part.id} kind={part.id} />
            <div className="part-story" aria-live="polite" aria-atomic="true">
              <h3>{part.title}</h3>
              <p>{part.description}</p>
              <p className="part-analogy">{part.analogy}</p>
              <details className="part-fit-note">
                <summary>Before you pick one</summary>
                <p>{part.check}</p>
              </details>
              <div className="part-story-actions">
                <Link className="text-action" to={`/build?category=${part.id}`}>
                  Explore {part.name.toLowerCase()} <ArrowUpRight size={18} />
                </Link>
                <Link to={`/guides/${part.guide}`} className="subtle-link">
                  Read the guide
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section
          className="next-steps page-gutter"
          aria-labelledby="next-steps-title"
        >
          <div>
            <h2 id="next-steps-title">Find your starting point.</h2>
            <p>
              Pick parts, explore the assembly in 3D, and review compatibility
              guidance. Save your ideas in this browser and come back anytime.
            </p>
          </div>
          <div className="next-step-links">
            <Link to="/prebuilts">
              <strong>A head start.</strong>
              <span>
                Explore ready-made builds <ArrowUpRight size={20} />
              </span>
            </Link>
            <Link to="/guides">
              <strong>A little know-how.</strong>
              <span>
                Read the building guides <ArrowUpRight size={20} />
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer variant="home" selectedComponent={part.name} />
    </div>
  );
}
