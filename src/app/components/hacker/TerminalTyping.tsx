import { useEffect, useState } from "react";

type TerminalTypingProps = {
  lines: string[];
  speed?: number;
  lineDelay?: number;
  className?: string;
};

export function TerminalTyping({
  lines,
  speed = 28,
  lineDelay = 400,
  className = "",
}: TerminalTypingProps) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (currentLine >= lines.length) {
      setDone(true);
      return;
    }

    const line = lines[currentLine];

    if (currentChar < line.length) {
      const timer = window.setTimeout(() => {
        setDisplayed((prev) => {
          const next = [...prev];
          next[currentLine] = line.slice(0, currentChar + 1);
          return next;
        });
        setCurrentChar((c) => c + 1);
      }, speed);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      setCurrentLine((l) => l + 1);
      setCurrentChar(0);
    }, lineDelay);

    return () => window.clearTimeout(timer);
  }, [currentLine, currentChar, lines, speed, lineDelay]);

  return (
    <div className={`hacker-terminal ${className}`}>
      {lines.map((line, i) => (
        <div key={i} className="hacker-terminal__line">
          {displayed[i] ?? (i < currentLine ? line : "")}
        </div>
      ))}
      {!done && <span className="hacker-terminal__cursor">█</span>}
    </div>
  );
}
