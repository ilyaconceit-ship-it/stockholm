import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { checkDiscordRole, autoApproveDiscordUser } from "@/lib/discord";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/callback")({ component: AuthCallback });

function AuthCallback() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!session) {
          toast.error("Ошибка авторизации");
          navigate({ to: "/login" });
          return;
        }

        // Check if Discord OAuth
        const provider = session.user.app_metadata.provider;
        if (provider === "discord") {
          const accessToken = session.provider_token;
          const userId = session.user.id;

          if (accessToken) {
            // Check ALL staff roles the user has on Discord
            const staffRoles = await checkDiscordRole(accessToken, userId);

            if (staffRoles.length > 0) {
              const username = await autoApproveDiscordUser(
                userId,
                session.user.user_metadata,
                staffRoles
              );
              toast.success(`Добро пожаловать, ${username}!`);
            } else {
              toast.error("У вас нет необходимой роли на сервере Discord");
              await supabase.auth.signOut();
              navigate({ to: "/login" });
              return;
            }
          }
        }

        navigate({ to: "/dashboard" });
      } catch (error: any) {
        console.error("Auth callback error:", error);
        toast.error("Ошибка авторизации");
        navigate({ to: "/login" });
      } finally {
        setChecking(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white/60">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  return null;
}
