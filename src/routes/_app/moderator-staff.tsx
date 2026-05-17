import { createFileRoute } from "@tanstack/react-router";
import { RoleStaffPage } from "@/components/layout/RoleStaffPage";

export const Route = createFileRoute("/_app/moderator-staff")({ component: ModeratorStaffPage });

function ModeratorStaffPage() {
  return <RoleStaffPage staffRole="moderator" />;
}
