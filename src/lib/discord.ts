import { supabase } from "@/integrations/supabase/client";

const GUILD_ID = "935695524831567972";

export type StaffRole =
  | "broadcaster"
  | "support"
  | "control"
  | "closemod"
  | "eventsmod"
  | "moderator"
  | "content_maker"
  | "helper";

// Branch admin roles — same branches, but with admin rights over their branch
export type BranchAdminRole =
  | "admin_broadcaster"
  | "admin_support"
  | "admin_control"
  | "admin_closemod"
  | "admin_eventsmod"
  | "admin_moderator"
  | "admin_content_maker"
  | "admin_helper";

// Discord role ID → app role name
export const DISCORD_ROLE_MAP: Record<string, StaffRole> = {
  "993885878491549848": "broadcaster",
  "993642256856789082": "support",
  "993642219397460079": "control",
  "1097305941386461184": "closemod",
  "993642202842529792": "eventsmod",
  "1097305667804594277": "moderator",
  "1015681838062239906": "content_maker",
  "1341205509977542679": "helper",
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  broadcaster: "Broadcaster",
  support: "Support",
  control: "Control",
  closemod: "Closemod",
  eventsmod: "Eventsmod",
  moderator: "Moderator",
  content_maker: "Content Maker",
  helper: "Helper",
};

// Russian display names for the topbar / settings
export const STAFF_ROLE_LABELS_RU: Record<StaffRole, string> = {
  broadcaster: "Бродкастер",
  support: "Саппорт",
  control: "Контрол",
  closemod: "Клоз Мод",
  eventsmod: "Ивент Мод",
  moderator: "Модератор",
  content_maker: "Контент Мейкер",
  helper: "Хелпер",
};

// Given any app role, return which branch it belongs to
export function getBranch(role: string): StaffRole | null {
  if (role === "admin") return null; // super admin — no specific branch
  if (role.startsWith("admin_")) {
    const branch = role.replace("admin_", "") as StaffRole;
    return branch in STAFF_ROLE_LABELS ? branch : null;
  }
  return role in STAFF_ROLE_LABELS ? (role as StaffRole) : null;
}

// Whether the role has admin rights (can edit/add/delete in their branch)
export function isBranchAdmin(role: string): boolean {
  return role === "admin" || role.startsWith("admin_");
}

// Returns ALL matched StaffRoles (user may have multiple Discord roles)
export async function checkDiscordRole(
  accessToken: string,
  userId: string
): Promise<StaffRole[]> {
  try {
    const guildsResponse = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const guilds = await guildsResponse.json();

    const isInGuild = guilds.some((g: any) => g.id === GUILD_ID);
    if (!isInGuild) return [];

    const memberResponse = await fetch(
      `https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const member = await memberResponse.json();
    const memberRoles: string[] = member.roles ?? [];

    // Collect ALL matching staff roles
    const matched: StaffRole[] = [];
    for (const [discordRoleId, appRole] of Object.entries(DISCORD_ROLE_MAP)) {
      if (memberRoles.includes(discordRoleId)) {
        matched.push(appRole);
      }
    }

    return matched;
  } catch (error) {
    console.error("Error checking Discord role:", error);
    return [];
  }
}

export async function autoApproveDiscordUser(
  userId: string,
  discordData: any,
  staffRoles: StaffRole[]   // now accepts array
) {
  try {
    const username =
      discordData.full_name ||
      discordData.name ||
      discordData.custom_claims?.global_name;
    const discordId = discordData.provider_id;
    const avatarUrl = discordData.avatar_url || discordData.picture;
    const avatarHash = avatarUrl ? avatarUrl.split("/").pop()?.split(".")[0] : null;

    // Update profile
    await supabase
      .from("profiles")
      .update({
        status: "approved",
        username,
        discord_id: discordId,
        discord_avatar: avatarHash,
      })
      .eq("id", userId);

    // Delete existing roles for this user and re-insert all current ones
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert(
      staffRoles.map((role) => ({ user_id: userId, role: role as any }))
    );

    // Upsert staff_members — use primary role (first) as category
    const primaryRole = staffRoles[0];
    const { data: existing } = await supabase
      .from("staff_members")
      .select("id")
      .eq("discord_id", discordId)
      .single();

    if (!existing) {
      await supabase.from("staff_members").insert({
        nickname: username,
        discord_id: discordId,
        avatar: avatarHash,
        category: primaryRole,
        join_date: new Date().toISOString().split("T")[0],
        warnings: "0",
        vacation: false,
        active: true,
      });
    } else {
      await supabase
        .from("staff_members")
        .update({ nickname: username, avatar: avatarHash })
        .eq("discord_id", discordId);
    }

    return username;
  } catch (error) {
    console.error("Error auto-approving user:", error);
    return null;
  }
}

export function getDiscordAvatarUrl(userId: string, avatarHash: string): string {
  if (!avatarHash) return "/logo.png";
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png?size=128`;
}
