import { useEffect, useState } from "react";

const SPRITES = [
  "https://spkecqqqjqpyzauwvcvp.supabase.co/storage/v1/object/public/assets/iconshugy.svg",
  "https://spkecqqqjqpyzauwvcvp.supabase.co/storage/v1/object/public/assets/icons8-squdward.svg",
];

const SIZE = 36;       // px — одинаковый размер
const BOTTOM = 24;     // px от низа экрана — одна высота
const SPEED = 120;     // px/s — одна скорость
const GAP = 2200;      // ms между спавнами

interface Runner {
  id: number;
  src: string;
  flipped: boolean;
}

let nextId = 0;

export function RunningCharacters() {
  const [runners, setRunners] = useState<Runner[]>([]);

  useEffect(() => {
    const spawn = () => {
      const flipped = Math.random() > 0.5;
      setRunners((prev) => [
        ...prev.slice(-6),
        { id: nextId++, src: SPRITES[Math.floor(Math.random() * SPRITES.length)], flipped },
      ]);
    };

    spawn();
    const interval = setInterval(spawn, GAP);
    return () => clearInterval(interval);
  }, []);

  const remove = (id: number) =>
    setRunners((prev) => prev.filter((r) => r.id !== id));

  // Duration based on content area width (screen minus sidebar) at constant speed
  const contentW = typeof window !== "undefined" ? window.innerWidth - 256 : 1184;
  const duration = (contentW + SIZE * 2) / SPEED;

  return (
    <>
      <div
        className="pointer-events-none fixed right-0 z-50 overflow-hidden md:left-64"
        style={{ bottom: BOTTOM, height: SIZE, left: 0 }}
      >
        {runners.map((r) => (
          <img
            key={r.id}
            src={r.src}
            alt=""
            draggable={false}
            className="absolute select-none"
            style={{
              width: SIZE,
              height: SIZE,
              bottom: 0,
              transform: r.flipped ? "scaleX(-1)" : "scaleX(1)",
              animation: `char-${r.flipped ? "rtl" : "ltr"} ${duration}s linear forwards`,
            }}
            onAnimationEnd={() => remove(r.id)}
          />
        ))}
      </div>

      <style>{`
        @keyframes char-ltr {
          from { left: -${SIZE}px; }
          to   { left: 100%; }
        }
        @keyframes char-rtl {
          from { left: 100%; }
          to   { left: -${SIZE}px; }
        }
      `}</style>
    </>
  );
}
