import { AlertTriangle, Check, ArrowUpRight } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { HardwarePhoto } from "@/components/HardwarePhoto";
import { Footer } from "@/components/Footer";
import { NavBar } from "@/components/NavBar";
import { guides } from "@/data/guides";
import { guideArtwork } from "@/data/guideArtwork";
export function GuideDetail() {
  const { slug } = useParams();
  const guide = guides.find((item) => item.slug === slug);
  if (!guide) return <Navigate to="/guides" replace />;
  return (
    <main className="reading-page editorial-page">
      <NavBar variant="guide-detail" moduleNumber={guide.number} />
      <article className="page-gutter reading-article">
        <header className="reading-header">
          <div>
            <p className="reading-meta">
              {guide.level}
              <span>{guide.readingMinutes} min read</span>
            </p>
            <h1>{guide.title}</h1>
            <p className="reading-description">{guide.description}</p>
          </div>
          <div className="reading-hardware">
            <HardwarePhoto
              kind={guideArtwork[guide.slug] ?? "assembly"}
              eager
            />
          </div>
        </header>
        <p className="reading-key-idea">{guide.keyIdea}</p>
        <div className="reading-layout">
          <nav className="reading-toc" aria-label="In this guide">
            <strong>In this guide</strong>
            {guide.sections.map((section, index) => (
              <a
                key={section.title}
                href={`#section-${index + 1}`}
                onClick={(event) => {
                  event.preventDefault();
                  const target = document.getElementById(
                    `section-${index + 1}`,
                  );
                  target?.scrollIntoView();
                  target?.focus({ preventScroll: true });
                }}
              >
                {section.title}
              </a>
            ))}
          </nav>
          <div className="reading-sections">
            {guide.sections.map((section, index) => (
              <section
                key={section.title}
                id={`section-${index + 1}`}
                tabIndex={-1}
              >
                <h2>{section.title}</h2>
                <p>{section.body}</p>
                {section.bullets && (
                  <ul>
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.actions && (
                  <div className="reading-actions">
                    {section.actions.map((action) => (
                      <Link
                        key={action.to}
                        to={action.to}
                        className="text-action"
                      >
                        {action.label}
                        <ArrowUpRight size={17} />
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            ))}
            <section className="reading-checklist">
              <h2>Quick check</h2>
              <ul>
                {guide.checklist.map((item) => (
                  <li key={item}>
                    <Check size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="reading-warning">
              <AlertTriangle size={23} />
              <div>
                <h2>Watch out</h2>
                <p>{guide.warning}</p>
              </div>
            </section>
            <section>
              <h2>Put this into practice</h2>
              <div className="reading-actions">
                {guide.actions.map((action) => (
                  <Link
                    className="exhibit-button secondary"
                    key={action.to}
                    to={action.to}
                  >
                    {action.label}
                    <ArrowUpRight size={17} />
                  </Link>
                ))}
              </div>
            </section>
            <section>
              <h2>Continue learning</h2>
              <ul className="reading-related">
                {guide.related.map((slug) => {
                  const related = guides.find((item) => item.slug === slug);
                  return (
                    related && (
                      <li key={slug}>
                        <Link to={`/guides/${slug}`}>
                          {related.title}
                          <ArrowUpRight size={17} />
                        </Link>
                      </li>
                    )
                  );
                })}
              </ul>
            </section>
            {guide.sources.length > 0 && (
              <section className="reading-sources">
                <h2>Manufacturer documentation</h2>
                <p>
                  These references explain the principles. Your exact product
                  manual and support list take precedence. Reviewed October
                  2026.
                </p>
                <ul>
                  {guide.sources.map((source) => (
                    <li key={source.url}>
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.label}
                        <ArrowUpRight size={15} />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </article>
      <Footer variant="guide-detail" moduleNumber={guide.number} />
    </main>
  );
}
