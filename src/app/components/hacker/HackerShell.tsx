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
      <video
        autoPlay
        loop
        muted
        playsInline
        className="hacker-bg-video"
      >
        <source src="/user_background.mp4" type="video/mp4" />
      </video>
      <div className="hacker-bg-overlay" aria-hidden="true" />
      <MatrixRain opacity={rainOpacity} />
      <div className="hacker-shell__grid" aria-hidden="true" />
      {showScanline && <div className="hacker-shell__scanline" aria-hidden="true" />}
      <div className="hacker-shell__vignette" aria-hidden="true" />
      <div className="hacker-shell__content">{children}</div>
    </div>
  );
}
