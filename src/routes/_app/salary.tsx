import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList } from "@/lib/hooks/useTable";

export const Route = createFileRoute("/_app/salary")({ component: SalaryPage });

function SalaryPage() {
  const { data: allStaff = [] } = useList<any>("staff_members");
  const staff = allStaff.filter((s) => s.category === "broadcaster");
  const { data: salaries = [] } = useList<any>("salaries");
  const total = salaries.reduce((a,s)=>a+(s.amount||0)+(s.bonus||0)-(s.penalty||0),0);

  return (
    <div>
      <PageHeader title="ЗП" subtitle="Отслеживание зарплаты" />
      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <GlassCard><p className="text-xs uppercase tracking-wider text-white/40">Итог ЗП</p><p className="mt-2 font-display text-4xl text-glow">{total.toLocaleString()}</p></GlassCard>
        <GlassCard><p className="text-xs uppercase tracking-wider text-white/40">Записей</p><p className="mt-2 font-display text-4xl">{salaries.length}</p></GlassCard>
        <GlassCard><p className="text-xs uppercase tracking-wider text-white/40">Активные</p><p className="mt-2 font-display text-4xl">{staff.filter((s)=>s.active).length}</p></GlassCard>
      </div>
      <GlassCard>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
            <th className="px-4 py-2 text-left font-normal">Ник</th><th className="px-4 py-2 text-left font-normal">ID</th>
            <th className="px-4 py-2 text-center font-normal">Трибуны</th><th className="px-4 py-2 text-right font-normal">ЗП</th>
          </tr></thead>
          <tbody>
            {staff.map((m)=>{
              const s = salaries.find((x)=>x.staff_id===m.id);
              const amt = (s?.amount||0)+(s?.bonus||0)-(s?.penalty||0);
              return (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-white">{m.nickname}</td>
                  <td className="px-4 py-3 text-xs text-white/40">&lt;@{m.discord_id}&gt;</td>
                  <td className="px-4 py-3 text-center text-white/70">{s?.tribunes_count || 0}</td>
                  <td className="px-4 py-3 text-right font-display text-lg text-white">{amt.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
