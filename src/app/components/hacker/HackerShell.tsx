import { MatrixRain } from "./MatrixRain";

type HackerShellProps = {
  children: React.ReactNode;
  className?: string;
  rainOpacity?: number;
  showScanline?: boolean;
};

export function HackerShell({
  children,
  className = "",
  rainOpacity = 0.14,
  showScanline = true,
}: HackerShellProps) {
  return (
    <div className={`hacker-shell ${className}`}>
      <MatrixRain opacity={rainOpacity} />
      <div className="hacker-shell__grid" aria-hidden="true" />
      {showScanline && <div className="hacker-shell__scanline" aria-hidden="true" />}
      <div className="hacker-shell__vignette" aria-hidden="true" />
      <div className="hacker-shell__content">{children}</div>
    </div>
  );
}
