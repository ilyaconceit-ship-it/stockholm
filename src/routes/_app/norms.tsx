import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList } from "@/lib/hooks/useTable";

export const Route = createFileRoute("/_app/norms")({ component: NormsPage });

function NormsPage() {
  const { data: allStaff = [] } = useList<any>("staff_members");
  const staff = allStaff.filter((s) => s.category === "broadcaster");
  const { data: norms = [] } = useList<any>("norms");

  return (
    <div>
      <PageHeader title="Норма" subtitle="Показывает норму бродкастеров на трибуну за 2 недели" />
      <GlassCard>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
            <th className="px-4 py-2 text-left font-normal">Ник</th>
            <th className="px-4 py-2 text-left font-normal">ID</th>
            <th className="px-4 py-2 text-center font-normal">1 неделя</th>
            <th className="px-4 py-2 text-center font-normal">2 неделя</th>
            <th className="px-4 py-2 text-center font-normal">Статус</th>
          </tr></thead>
          <tbody>
            {staff.map((m)=>{
              const my = norms.filter((n)=>n.staff_id===m.id);
              const w1 = my.filter((n)=>n.week===1 && n.completed).length;
              const w2 = my.filter((n)=>n.week===2 && n.completed).length;
              const ok = (w1+w2) >= 1;
              return (
                <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-4 py-3 text-white">{m.nickname}</td>
                  <td className="px-4 py-3 text-xs text-white/40">&lt;@{m.discord_id}&gt;</td>
                  <td className="px-4 py-3 text-center text-white/70">{w1}</td>
                  <td className="px-4 py-3 text-center text-white/70">{w2}</td>
                  <td className="px-4 py-3 text-center"><span className={`rounded-md px-2 py-0.5 text-xs ${ok?"bg-emerald-500/10 text-emerald-300":"bg-red-500/10 text-red-300"}`}>{ok?"✓ выполнено":"не выполнено"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
