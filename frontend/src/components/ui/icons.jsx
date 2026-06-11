import * as Lucide from "lucide-react";

// Convert kebab lucide names (used in the prototype) to PascalCase components.
const toPascal = (name) => name.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");

export function Icon({ name, size = 16, color, style }) {
  const Cmp = Lucide[toPascal(name)] || Lucide.Circle;
  return <Cmp size={size} color={color} style={{ flexShrink: 0, ...style }} strokeWidth={1.75} />;
}
