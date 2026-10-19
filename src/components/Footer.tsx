import { Link } from "react-router-dom";
import photos from "@/data/hardwarePhotos.json";
import assets from "@/models/assets.json";
type FooterProps =
  | { variant: "home"; selectedComponent: string }
  | { variant: "guides" }
  | { variant: "guide-detail"; moduleNumber: string };
export function Footer(props: FooterProps) {
  return (
    <footer className="site-footer page-gutter" data-surface={props.variant}>
      <Link to="/" className="footer-wordmark">
        RetroForge.
      </Link>
      <p>For the joy of figuring it out.</p>
      <nav aria-label="Footer navigation">
        <Link to="/build">Build a PC</Link>
        <Link to="/guides">Learn the parts</Link>
        <Link to="/prebuilts">Find a starting point</Link>
      </nav>
      <small>
        Compatibility guidance is a starting point. Verify manufacturer
        specifications before buying.
      </small>
      <details className="footer-credits">
        <summary>Hardware photography & model credits</summary>
        {Object.entries(photos).map(([kind, photo]) => (
          <p key={`photo-${kind}`}>
            <a href={photo.source} target="_blank" rel="noreferrer">
              {photo.title} — {photo.author}
            </a>{" "}
            ·{" "}
            <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
              {photo.license}
            </a>
            . Resized and converted to WebP. Educational examples; exact
            catalogue products vary.
          </p>
        ))}
        {Object.entries(assets).map(([kind, asset]) => (
          <a
            key={kind}
            href={asset.credits.source}
            target="_blank"
            rel="noreferrer"
          >
            {kind}: {asset.credits.author} · CC BY 4.0
          </a>
        ))}
      </details>
    </footer>
  );
}
