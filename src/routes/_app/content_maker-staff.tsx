import { createFileRoute } from "@tanstack/react-router";
import { RoleStaffPage } from "@/components/layout/RoleStaffPage";

export const Route = createFileRoute("/_app/content_maker-staff")({ component: ContentMakerStaffPage });

function ContentMakerStaffPage() {
  return <RoleStaffPage staffRole="content_maker" />;
}
