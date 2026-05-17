import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth";
import { isBranchAdmin } from "@/lib/discord";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "admin_music_played";

export function useAdminMusic() {
  const { role } = useAuthStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isAdmin = isBranchAdmin(role ?? "");

  useEffect(() => {
    if (!isAdmin) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    let cancelled = false;

    // Fetch the latest active track from DB
    const fetchAndPlay = async () => {
      const { data } = await supabase
        .from("music_roulette" as any)
        .select("track_url")
        .order("spun_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      const url = (data as any)?.track_url;
      if (!url) return;

      const audio = new Audio(url);
      audio.volume = 0.4;
      audioRef.current = audio;

      const play = () => {
        if (sessionStorage.getItem(STORAGE_KEY)) return;
        audio.play().then(() => {
          sessionStorage.setItem(STORAGE_KEY, "1");
        }).catch(() => {});
        document.removeEventListener("click", play);
        document.removeEventListener("keydown", play);
      };

      document.addEventListener("click", play);
      document.addEventListener("keydown", play);
    };

    fetchAndPlay();

    return () => {
      cancelled = true;
      audioRef.current?.pause();
    };
  }, [isAdmin]);
}
