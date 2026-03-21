import { HTMLAttributes } from "react";

type Classification = "CLASSIFIED" | "SECRET" | "TOP_SECRET" | "UNCLASSIFIED";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  classification?: Classification;
  scanline?: boolean;
  noPadding?: boolean;
}

const classificationConfig: Record<
  Classification,
  { label: string; color: string }
> = {
  UNCLASSIFIED: {
    label: "SIN CLASIFICAR",
    color: "text-matrix-green/60",
  },
  CLASSIFIED: {
    label: "CLASIFICADO",
    color: "text-neon-amber",
  },
  SECRET: {
    label: "SECRETO",
    color: "text-neon-red",
  },
  TOP_SECRET: {
    label: "TOP SECRET / SCI",
    color: "text-rank-elite",
  },
};

export default function Panel({
  title,
  classification,
  scanline = false,
  noPadding = false,
  children,
  className = "",
  ...props
}: PanelProps) {
  const classConfig = classification
    ? classificationConfig[classification]
    : null;

  return (
    <div
      className={[
        "panel-classified",
        scanline ? "scanline" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {(title || classConfig) && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-military-border/60">
          {title && (
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-matrix-green/80 font-medium">
              {title}
            </span>
          )}
          {classConfig && (
            <span
              className={`text-xs font-mono uppercase tracking-[0.3em] font-bold ${classConfig.color}`}
              style={{ textShadow: "0 0 6px currentColor" }}
            >
              // {classConfig.label} //
            </span>
          )}
        </div>
      )}
      <div className={noPadding ? "" : "p-4"}>{children}</div>
    </div>
  );
}
