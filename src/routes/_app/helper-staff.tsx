import { createFileRoute } from "@tanstack/react-router";
import { RoleStaffPage } from "@/components/layout/RoleStaffPage";

export const Route = createFileRoute("/_app/helper-staff")({ component: HelperStaffPage });

function HelperStaffPage() {
  return <RoleStaffPage staffRole="helper" />;
}
