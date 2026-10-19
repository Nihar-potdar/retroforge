import { useState } from "react";
import { Maximize2 } from "lucide-react";
import photos from "@/data/hardwarePhotos.json";
import { AccessibleDialog } from "./AccessibleDialog";

export type HardwareKind = keyof typeof photos;

type ImageProps = {
  kind: HardwareKind;
  sizes?: string;
  eager?: boolean;
  decorative?: boolean;
};

export function HardwareImage({
  kind,
  sizes = "(max-width: 700px) 90vw, 45vw",
  eager = false,
  decorative = false,
}: ImageProps) {
  const photo = photos[kind];
  return (
    <img
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={sizes}
      alt={decorative ? "" : photo.alt}
      width={photo.width}
      height={photo.height}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
    />
  );
}

export function HardwarePhoto({
  kind,
  sizes,
  eager,
  inspect = true,
}: ImageProps & { inspect?: boolean }) {
  const [open, setOpen] = useState(false);
  const photo = photos[kind];
  return (
    <>
      <figure className={`hardware-photo photo-${kind}`}>
        <div className="hardware-photo-stage">
          <HardwareImage kind={kind} sizes={sizes} eager={eager} />
        </div>
        <figcaption>
          <span>
            {photo.title}
            <span className="photo-example">Educational example</span>
          </span>
          {inspect && (
            <button
              className="photo-inspect"
              onClick={() => setOpen(true)}
              aria-label={`Inspect ${photo.title} photo`}
            >
              <Maximize2 size={15} /> Inspect photo
            </button>
          )}
        </figcaption>
      </figure>
      {inspect && (
        <AccessibleDialog
          open={open}
          onClose={() => setOpen(false)}
          title={photo.title}
          className="photo-dialog"
        >
          {open && (
            <img
              src={photo.variants.at(-1)!.src}
              width={photo.variants.at(-1)!.width}
              height={photo.variants.at(-1)!.height}
              alt={photo.alt}
            />
          )}
          <p className="photo-attribution">
            Photo:{" "}
            <a href={photo.source} target="_blank" rel="noreferrer">
              {photo.author}
            </a>{" "}
            ·{" "}
            <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
              {photo.license}
            </a>
            . {photo.changes}
          </p>
        </AccessibleDialog>
      )}
    </>
  );
}
