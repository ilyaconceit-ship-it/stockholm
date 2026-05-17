import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useList<T = any>(table: string, order?: { col: string; asc?: boolean }) {
  return useQuery({
    queryKey: [table, order],
    queryFn: async () => {
      let q = supabase.from(table as any).select("*");
      if (order) q = q.order(order.col, { ascending: order.asc ?? true });
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useInsert(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: any) => {
      const { error } = await supabase.from(table as any).insert(row);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
    onError: (e: any) => {
      console.error("Insert error:", e);
    },
  });
}

export function useUpdate(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from(table as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

export function useDelete(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error, count } = await supabase
        .from(table as any)
        .delete({ count: "exact" })
        .eq("id", id);
      if (error) throw error;
      if (count === 0) throw new Error("RLS: удаление заблокировано политикой Supabase");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}
