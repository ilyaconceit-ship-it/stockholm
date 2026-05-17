import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Petals, AmbientGlow } from "@/components/effects/Petals";
import { Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({ component: RegisterPage });

function RegisterPage() {
  const [username, setUsername] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username, discord_id: discordId },
      },
    });
    setLoading(false);
    if (error) {
      const errorMessages: Record<string, string> = {
        "User already registered": "Пользователь уже зарегистрирован",
        "Password should be at least 6 characters": "Пароль должен содержать минимум 6 символов",
        "Invalid email": "Неверный email",
        "Email rate limit exceeded": "Превышен лимит отправки email",
      };
      return toast.error(errorMessages[error.message] || error.message);
    }
    toast.success("Аккаунт создан. Ожидайте одобрения администратора.");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-12">
      <AmbientGlow />
      <Petals count={14} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-2xl p-10">
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/20 glow-white">
              <img src="/logo.png" alt="Logo" className="h-8 w-8" />
            </div>
            <h1 className="font-display text-3xl font-light text-glow">Запросить доступ</h1>
            <p className="mt-1 font-display text-xs tracking-[0.4em] text-white/40">РЕГИСТРАЦИЯ ТРЕБУЕТ ОДОБРЕНИЯ</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {[
              { label: "Ник в Discord", value: username, set: setUsername, type: "text", placeholder: "yournick" },
              { label: "Discord ID", value: discordId, set: setDiscordId, type: "text", placeholder: "1027100927578091551" },
              { label: "Почта", value: email, set: setEmail, type: "email", placeholder: "email@gmail.com" },
              { label: "Пароль", value: password, set: setPassword, type: "password", placeholder: "••••••••" },
            ].map((f) => (
              <div key={f.label}>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/50">{f.label}</label>
                <input
                  type={f.type} required value={f.value} onChange={(e) => f.set(e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.06] focus:outline-none"
                />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 font-medium text-black transition-all hover:bg-white/90 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Отправить запрос"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-white/40">
            Уже есть доступ?{" "}
            <Link to="/login" className="text-white underline-offset-4 hover:underline">Войти</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
