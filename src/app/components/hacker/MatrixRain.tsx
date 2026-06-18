import { useEffect, useRef } from "react";

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトハヒフヘホマミムメモヤユヨラリルレロワヲン<>[]{}*#@$%&";

export function MatrixRain({ opacity = 0.15 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    const fontSize = 16;
    let columns = 0;
    let drops: { y: number; speed: number; chars: string[] }[] = [];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize) + 1;
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops.push({
          y: Math.random() * -100, // random start y (offscreen)
          speed: 0.8 + Math.random() * 1.5, // random speed
          chars: Array.from({ length: 22 }, () => CHARS[Math.floor(Math.random() * CHARS.length)])
        });
      }
    };

    const draw = () => {
      ctx.shadowBlur = 0; // reset shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        const x = i * fontSize;
        const yIndex = Math.floor(drop.y);

        // Update characters occasionally for dynamic look
        if (Math.random() > 0.94) {
          drop.chars.unshift(CHARS[Math.floor(Math.random() * CHARS.length)]);
          drop.chars.pop();
        }

        // Draw trail
        for (let j = 0; j < drop.chars.length; j++) {
          const charY = (yIndex - j) * fontSize;
          if (charY < 0 || charY > canvas.height + fontSize) continue;

          // The head is bright white, tail fades out
          if (j === 0) {
            ctx.fillStyle = "#ffffff";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#ff0000";
          } else {
            ctx.shadowBlur = 0;
            const alpha = 1 - j / drop.chars.length;
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.7})`;
          }

          ctx.fillText(drop.chars[j], x, charY);
        }

        // Move drop down
        drop.y += drop.speed;

        // Reset drop to top of screen when it goes offscreen
        if ((yIndex - drop.chars.length) * fontSize > canvas.height) {
          if (Math.random() > 0.98) {
            drop.y = -20;
            drop.speed = 0.8 + Math.random() * 1.5;
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    init();
    draw();

    const handleResize = () => {
      init();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="hacker-matrix-rain"
      aria-hidden="true"
      style={{ opacity, mixBlendMode: "screen" }}
    />
  );
}
