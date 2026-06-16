type GlitchTextProps = {
  children: string;
  as?: "h1" | "h2" | "span";
  className?: string;
};

export function GlitchText({ children, as: Tag = "span", className = "" }: GlitchTextProps) {
  return (
    <Tag className={`hacker-glitch ${className}`} data-text={children}>
      {children}
    </Tag>
  );
}
