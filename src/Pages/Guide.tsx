import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { guides } from "@/data/guides";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { HardwareImage } from "@/components/HardwarePhoto";
import { guideArtwork } from "@/data/guideArtwork";
export function Guide() {
  const [level, setLevel] = useState("All");
  const [search, setSearch] = useState("");
  const visible = guides.filter(
    (guide) =>
      (level === "All" || guide.level === level) &&
      `${guide.title} ${guide.description} ${guide.topics.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <main className="editorial-page">
      <NavBar variant="guides" />
      <div className="page-gutter">
        <section className="editorial-intro">
          <h1>
            Less mystery.
            <br />
            More “aha.”
          </h1>
          <p>
            Get to know your computer, one good question at a time. Practical
            guides for your first build and your next big idea.
          </p>
        </section>
        <div className="guide-controls">
          <div role="group" aria-label="Guide difficulty">
            {["All", "Beginner", "Advanced"].map((value) => (
              <button
                key={value}
                aria-pressed={level === value}
                onClick={() => setLevel(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <label>
            Find a guide
            <input
              type="search"
              placeholder="Try memory or cooling"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
        <section className="guide-gallery" aria-label="PC building guides">
          {visible.map((guide) => {
            return (
              <article className="guide-item" key={guide.slug}>
                <Link to={`/guides/${guide.slug}`}>
                  <div className="guide-image">
                    <HardwareImage
                      kind={guideArtwork[guide.slug] ?? "assembly"}
                      sizes="(max-width: 700px) 90vw, (max-width: 1000px) 44vw, 28vw"
                      decorative
                    />
                  </div>
                  <div className="guide-item-meta">
                    <span>{guide.level}</span>
                    <span>{guide.readingMinutes} min read</span>
                  </div>
                  <h2>{guide.title}</h2>
                  <p>{guide.description}</p>
                  <span className="guide-open">
                    Open guide <ArrowUpRight size={17} />
                  </span>
                </Link>
              </article>
            );
          })}
        </section>
        {visible.length === 0 && (
          <p className="guide-empty">
            No guides match that search. Try another topic or choose All.
          </p>
        )}
      </div>
      <Footer variant="guides" />
    </main>
  );
}
