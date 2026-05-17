import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore, type AppRole } from "@/lib/stores/auth";

export function useAuthInit() {
  const { set, reset } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId: string) => {
      const [{ data: profile }, { data: rolesData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("status, username")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

      if (!mounted) return;

      const allRoles: AppRole[] = rolesData?.map((r) => r.role as AppRole) ?? [];

      // Active role priority: super admin > branch admin > staff role
      let activeRole: AppRole = "broadcaster";
      if (allRoles.length > 0) {
        if (allRoles.includes("admin")) {
          activeRole = "admin";
        } else {
          // Prefer branch admin role over plain staff role if both exist
          const branchAdmin = allRoles.find((r) => r.startsWith("admin_"));
          activeRole = branchAdmin ?? allRoles[0];
        }
      }

      set({
        status: (profile?.status as any) ?? "pending",
        username: profile?.username ?? null,
        role: activeRole,
        allRoles,
        loading: false,
      });
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        set({ user: session.user, loading: true });
        setTimeout(() => loadProfile(session.user.id), 0);
      } else {
        reset();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        set({ user: session.user });
        loadProfile(session.user.id);
      } else {
        set({ loading: false });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [set, reset]);
}
