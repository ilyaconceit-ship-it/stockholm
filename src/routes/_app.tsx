import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Petals, AmbientGlow } from "@/components/effects/Petals";
import { RunningCharacters } from "@/components/effects/RunningCharacters";
import { useAuthInit } from "@/lib/hooks/useAuth";
import { useAdminMusic } from "@/lib/hooks/useAdminMusic";
import { useAuthStore } from "@/lib/stores/auth";
import { Loader2, Clock } from "lucide-react";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  useAuthInit();
  useAdminMusic();
  const { user, status, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-white/40" />
      </div>
    );
  }

  if (status !== "approved") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4">
        <AmbientGlow />
        <Petals count={10} />
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass-strong relative z-10 max-w-md rounded-2xl p-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/20">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-2xl text-glow">Ожидайте подтверждения администратора</h1>
          <p className="mt-3 text-sm text-white/50">
            Your registration is awaiting review. An administrator will grant you access soon.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <AmbientGlow />
      <Petals count={12} />
      <RunningCharacters />
      <Sidebar />
      <div className="md:pl-64">
        <Topbar />
        <main className="relative z-10 px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
