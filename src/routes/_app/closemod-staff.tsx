import { createFileRoute } from "@tanstack/react-router";
import { RoleStaffPage } from "@/components/layout/RoleStaffPage";

export const Route = createFileRoute("/_app/closemod-staff")({ component: ClosemodStaffPage });

function ClosemodStaffPage() {
  return <RoleStaffPage staffRole="closemod" />;
}
