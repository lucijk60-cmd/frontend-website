import type { CSSProperties } from "react";
import { embeddedImages } from "@/lib/embeddedImageAssets";

export type InlineBrandMarkProps = {
  className?: string;
  alt?: string;
  style?: CSSProperties;
};

/**
 * SVG wrapper for the embedded brand artwork. The artwork itself remains a
 * data URI so the detailed user-provided raster logo is not redrawn inaccurately.
 */
export function InlineBrandMark({ className, alt = "PPF Paint Protection Film logo", style }: InlineBrandMarkProps) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 640 640"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      focusable="false"
    >
      <image href={embeddedImages.mark} x="0" y="0" width="640" height="640" preserveAspectRatio="xMidYMid meet" />
    </svg>
  );
}
