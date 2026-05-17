import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Petals, AmbientGlow } from "@/components/effects/Petals";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const errorMessages: Record<string, string> = {
        "Invalid login credentials": "Неверные данные для входа",
        "Email not confirmed": "Email не подтвержден",
        "User not found": "Пользователь не найден",
        "Invalid email or password": "Неверный email или пароль",
      };
      return toast.error(errorMessages[error.message] || error.message);
    }
    navigate({ to: "/dashboard" });
  };

  const loginWithDiscord = async () => {
    setDiscordLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        scopes: "identify guilds guilds.members.read",
        redirectTo: window.location.origin + "/auth/callback",
      },
    });
    if (error) {
      toast.error("Ошибка авторизации через Discord");
      setDiscordLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4">
      <AmbientGlow />
      <Petals count={14} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-strong rounded-2xl p-10 shadow-2xl">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/20 glow-white">
              <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-light text-glow">Stockholm Broadcasters</h1>
            <p className="mt-1 font-display text-xs tracking-[0.4em] text-white/40">Алко, трава, заны, никотин - во мне все четыре</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Почта</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.06] focus:outline-none"
                placeholder="email@gmail.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">Пароль</label>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.06] focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="group relative mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-medium text-black transition-all hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Войти"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0a0a] px-2 text-white/40">или</span>
            </div>
          </div>

          <button
            onClick={loginWithDiscord}
            disabled={discordLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5865F2] px-4 py-3 font-medium text-white transition-all hover:bg-[#4752C4] disabled:opacity-50"
          >
            {discordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Войти через Discord
              </>
            )}
          </button>

          <p className="mt-6 text-center text-sm text-white/40">
            Нет аккаунта?{" "}
            <Link to="/register" className="text-white underline-offset-4 hover:underline">Запросить доступ</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
