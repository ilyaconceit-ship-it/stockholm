import { motion } from "framer-motion";
import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="font-display text-4xl font-light text-glow">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-white/40">{subtitle}</p>}
      </motion.div>
      {action}
    </div>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass rounded-2xl p-6 hover-lift ${className}`}>{children}</div>
  );
}
