import { useMemo } from "react";

export function Petals({ count = 18 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 20,
        duration: 18 + Math.random() * 22,
        size: 8 + Math.random() * 14,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    [count],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {petals.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        >
          <svg viewBox="0 0 24 24" fill="white">
            <path d="M12 2 C 14 8, 20 10, 22 12 C 20 14, 14 16, 12 22 C 10 16, 4 14, 2 12 C 4 10, 10 8, 12 2 Z" opacity="0.85"/>
          </svg>
        </div>
      ))}
    </div>
  );
}

export function AmbientGlow() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, oklch(1 0 0 / 0.05), transparent 70%)" }}
      />
      <div
        className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, oklch(1 0 0 / 0.03), transparent 70%)" }}
      />
    </div>
  );
}
