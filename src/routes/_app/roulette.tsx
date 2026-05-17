import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/lib/stores/auth";
import { isBranchAdmin } from "@/lib/discord";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Music, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/roulette")({ component: RoulettePage });

// All available tracks — добавляй сюда новые треки
const TRACKS = [
  {
    name: "7 литров пива",
    url: "https://spkecqqqjqpyzauwvcvp.supabase.co/storage/v1/object/public/assets/litrpiva.mp3",
    emoji: "🍺",
  },
  {
    name: "Сакин кок",
    url: "https://spkecqqqjqpyzauwvcvp.supabase.co/storage/v1/object/public/assets/sakinkok.mp3",
    emoji: "🥥",
  },
  {
    name: "Игрок",
    url: "https://spkecqqqjqpyzauwvcvp.supabase.co/storage/v1/object/public/assets/player.mp3",
    emoji: "🤡",
  },
  {
    name: "Анимешник",
    url: "https://spkecqqqjqpyzauwvcvp.supabase.co/storage/v1/object/public/assets/animeshnik.mp3",
    emoji: "🦸",
  },
  {
    name: "Виски с молоком",
    url: "https://spkecqqqjqpyzauwvcvp.supabase.co/storage/v1/object/public/assets/vickicmolokom.mp3",
    emoji: "🥛",
  },
  {
    name: "Бр-бр-бр патапим",
    url: "https://spkecqqqjqpyzauwvcvp.supabase.co/storage/v1/object/public/assets/brbrbrpatappim.mp3",
    emoji: "🎶",
  },
];

const COOLDOWN_DAYS = 0; // Временно отключен для тестирования

function RouletteWheel({ spinning, result }: { spinning: boolean; result: typeof TRACKS[0] | null }) {
  return (
    <div className="relative flex h-48 items-center justify-center">
      {/* Outer ring */}
      <motion.div
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={spinning ? { duration: 0.6, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
        className="absolute h-44 w-44 rounded-full border-2 border-white/10"
        style={{
          background: "conic-gradient(from 0deg, rgba(255,255,255,0.03), rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
        }}
      />
      {/* Inner spinning dots */}
      <motion.div
        animate={spinning ? { rotate: -360 } : { rotate: 0 }}
        transition={spinning ? { duration: 0.4, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
        className="absolute h-32 w-32 rounded-full border border-white/5"
      >
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div
            key={deg}
            className="absolute h-1.5 w-1.5 rounded-full bg-white/20"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${deg}deg) translateY(-56px) translate(-50%, -50%)`,
            }}
          />
        ))}
      </motion.div>

      {/* Center */}
      <div className="relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-full border border-white/10 bg-black/60 backdrop-blur-sm">
        <AnimatePresence mode="wait">
          {spinning ? (
            <motion.div
              key="spinning"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <RefreshCw className="h-8 w-8 animate-spin text-white/40" />
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="text-3xl">{result.emoji}</div>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Music className="h-8 w-8 text-white/20" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pointer */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <div className="h-3 w-0.5 bg-white/30" />
        <div className="mx-auto h-0 w-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/30" />
      </div>
    </div>
  );
}

function RoulettePage() {
  const { role, username } = useAuthStore();
  const canSpin = isBranchAdmin(role ?? "");

  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<typeof TRACKS[0] | null>(null);
  const [lastSpun, setLastSpun] = useState<Date | null>(null);
  const [currentTrack, setCurrentTrack] = useState<typeof TRACKS[0] | null>(null);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load current active track and last spin time
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("music_roulette" as any)
        .select("*")
        .order("spun_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        const d = data as any;
        const track = TRACKS.find((t) => t.url === d.track_url) ?? {
          name: d.track_name,
          url: d.track_url,
          emoji: "🎵",
        };
        setCurrentTrack(track);
        setLastSpun(new Date(d.spun_at));
      }
      setLoading(false);
    };
    load();
  }, []);

  // Cooldown check
  const canSpinNow = () => {
    if (!lastSpun) return true;
    const diff = Date.now() - lastSpun.getTime();
    return diff >= COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  };

  const cooldownLeft = () => {
    if (!lastSpun) return null;
    const diff = COOLDOWN_DAYS * 24 * 60 * 60 * 1000 - (Date.now() - lastSpun.getTime());
    if (diff <= 0) return null;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours >= 24) return `${Math.floor(hours / 24)} дн. ${hours % 24} ч.`;
    return `${hours} ч. ${mins} мин.`;
  };

  const spin = async () => {
    if (spinning || !canSpinNow()) return;

    setSpinning(true);
    setResult(null);
    audioRef.current?.pause();

    // Animate for 3 seconds, pick random track
    await new Promise((r) => setTimeout(r, 3000));

    const picked = TRACKS[Math.floor(Math.random() * TRACKS.length)];
    setResult(picked);
    setSpinning(false);

    // Save to DB
    const { error } = await supabase.from("music_roulette" as any).insert({
      track_url: picked.url,
      track_name: picked.name,
      spun_by: username ?? "admin",
    });

    if (error) {
      toast.error("Ошибка сохранения: " + error.message);
      return;
    }

    setCurrentTrack(picked);
    setLastSpun(new Date());

    // Reset session so music plays on next page load
    sessionStorage.removeItem("admin_music_played");

    // Preview the track
    const audio = new Audio(picked.url);
    audio.volume = 0.4;
    audioRef.current = audio;
    audio.play().catch(() => {});

    toast.success(`Новый трек: ${picked.name} 🎵`);
  };

  if (!canSpin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-white/20" />
          <p className="text-white/40">Доступ только для администраторов</p>
        </div>
      </div>
    );
  }

  const cooldown = cooldownLeft();

  return (
    <div>
      <PageHeader title="Рулетка" subtitle="Крутить можно раз в 3 дня" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wheel */}
        <GlassCard>
          <div className="flex flex-col items-center gap-6">
            <RouletteWheel spinning={spinning} result={result} />

            {/* Result name */}
            <AnimatePresence>
              {result && !spinning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <p className="text-xs uppercase tracking-wider text-white/40">Выпало</p>
                  <p className="mt-1 font-display text-2xl text-white">{result.name}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Spin button */}
            <button
              onClick={spin}
              disabled={spinning || !!cooldown}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-medium transition-all ${
                spinning || cooldown
                  ? "cursor-not-allowed bg-white/5 text-white/30"
                  : "bg-white text-black hover:bg-white/90 active:scale-95"
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
              {spinning ? "Крутится..." : cooldown ? "Недоступно" : "Крутить"}
            </button>

            {/* Cooldown */}
            {cooldown && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-xs text-white/40"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>Следующий спин через {cooldown}</span>
              </motion.div>
            )}
          </div>
        </GlassCard>

        {/* Current track info */}
        <div className="space-y-4">
          <GlassCard>
            <h2 className="mb-4 font-display text-xl">Сейчас играет у всех</h2>
            {loading ? (
              <p className="text-sm text-white/30">Загрузка...</p>
            ) : currentTrack ? (
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-3xl">
                  {currentTrack.emoji}
                </div>
                <div>
                  <p className="font-medium text-white">{currentTrack.name}</p>
                  {lastSpun && (
                    <p className="mt-0.5 text-xs text-white/40">
                      Поставлено {lastSpun.toLocaleDateString("ru-RU")} в {lastSpun.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-white/30">Нет активного трека</p>
            )}
          </GlassCard>

          <GlassCard>
            <h2 className="mb-3 font-display text-xl">Доступные треки</h2>
            <div className="space-y-2">
              {TRACKS.map((t) => (
                <div
                  key={t.url}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                    currentTrack?.url === t.url
                      ? "border-white/20 bg-white/[0.06] text-white"
                      : "border-white/5 bg-white/[0.02] text-white/50"
                  }`}
                >
                  <span className="text-xl">{t.emoji}</span>
                  <span>{t.name}</span>
                  {currentTrack?.url === t.url && (
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">активный</span>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
