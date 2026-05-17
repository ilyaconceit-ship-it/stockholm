import { createFileRoute } from "@tanstack/react-router";
import { RoleStaffPage } from "@/components/layout/RoleStaffPage";

export const Route = createFileRoute("/_app/support-staff")({ component: SupportStaffPage });

function SupportStaffPage() {
  return <RoleStaffPage staffRole="support" />;
}
