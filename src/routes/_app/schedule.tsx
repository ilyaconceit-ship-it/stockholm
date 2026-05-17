import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/layout/PageHeader";
import { useList, useInsert, useDelete } from "@/lib/hooks/useTable";
import { useAuthStore } from "@/lib/stores/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/schedule")({ component: SchedulePage });

function SchedulePage() {
  const { role } = useAuthStore();
  const isAdmin = role === "admin" || role === "admin_broadcaster";
  const { data = [] } = useList<any>("schedules", { col: "date", asc: true });
  const ins = useInsert("schedules"); const del = useDelete("schedules");
  const [draft, setDraft] = useState({ date: "", tribune_type: "", time: "", host1_first: "", host2_first: "", host1_second: "", host2_second: "", ad_branches: "" });

  return (
    <div>
      <PageHeader title="Расписание трибун" subtitle="Заполняется мастерами и выше" />
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <th className="px-3 py-2 font-normal">Дата</th><th className="px-3 py-2 font-normal">Трибуна</th><th className="px-3 py-2 font-normal">Время</th>
              <th className="px-3 py-2 font-normal">Ведущий 1</th><th className="px-3 py-2 font-normal">Ведущий 2</th>
              <th className="px-3 py-2 font-normal">Ведущий 3</th><th className="px-3 py-2 font-normal">Ведущий 4</th>
              <th className="px-3 py-2 font-normal">Реклам</th>{isAdmin && <th></th>}
            </tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                  <td className="px-3 py-2 text-white/80">{new Date(r.date).toLocaleDateString("ru-RU")}</td>
                  <td className="px-3 py-2"><span className="rounded-md bg-white/5 px-2 py-0.5 text-xs">{r.tribune_type}</span></td>
                  <td className="px-3 py-2 text-white/70">{r.time}</td>
                  <td className="px-3 py-2 text-white/70">{r.host1_first}</td><td className="px-3 py-2 text-white/70">{r.host2_first}</td>
                  <td className="px-3 py-2 text-white/70">{r.host1_second}</td><td className="px-3 py-2 text-white/70">{r.host2_second}</td>
                  <td className="px-3 py-2 text-xs text-white/50">{r.ad_branches}</td>
                  {isAdmin && <td className="px-3 py-2"><button onClick={() => del.mutate(r.id)} className="text-white/40 hover:text-red-400"><Trash2 className="h-4 w-4" /></button></td>}
                </tr>
              ))}
              {isAdmin && (
                <tr className="bg-white/[0.03]">
                  <td className="px-2 py-2"><input type="date" placeholder="Дата" value={draft.date} onChange={(e)=>setDraft({...draft,date:e.target.value})} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                  <td className="px-2 py-2"><input type="text" placeholder="Тип трибуны" value={draft.tribune_type} onChange={(e)=>setDraft({...draft,tribune_type:e.target.value})} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                  <td className="px-2 py-2"><input type="text" placeholder="Время" value={draft.time} onChange={(e)=>setDraft({...draft,time:e.target.value})} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                  <td className="px-2 py-2"><input type="text" placeholder="Ведущий 1" value={draft.host1_first} onChange={(e)=>setDraft({...draft,host1_first:e.target.value})} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                  <td className="px-2 py-2"><input type="text" placeholder="Ведущий 2" value={draft.host2_first} onChange={(e)=>setDraft({...draft,host2_first:e.target.value})} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                  <td className="px-2 py-2"><input type="text" placeholder="Ведущий 3" value={draft.host1_second} onChange={(e)=>setDraft({...draft,host1_second:e.target.value})} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                  <td className="px-2 py-2"><input type="text" placeholder="Ведущий 4" value={draft.host2_second} onChange={(e)=>setDraft({...draft,host2_second:e.target.value})} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                  <td className="px-2 py-2"><input type="text" placeholder="Реклам" value={draft.ad_branches} onChange={(e)=>setDraft({...draft,ad_branches:e.target.value})} className="w-full rounded bg-white/5 px-2 py-1 text-xs focus:outline-none" /></td>
                  <td className="px-2"><button onClick={()=>{ if(!draft.date)return; ins.mutate(draft,{onSuccess:()=>{setDraft({date:"",tribune_type:"",time:"",host1_first:"",host2_first:"",host1_second:"",host2_second:"",ad_branches:""});toast.success("Добавлено");}}); }} className="rounded bg-white/10 p-1.5 hover:bg-white/20"><Plus className="h-4 w-4"/></button></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
