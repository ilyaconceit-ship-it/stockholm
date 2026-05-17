import { createFileRoute } from "@tanstack/react-router";
import { RoleStaffPage } from "@/components/layout/RoleStaffPage";

export const Route = createFileRoute("/_app/eventsmod-staff")({ component: EventsmodStaffPage });

function EventsmodStaffPage() {
  return <RoleStaffPage staffRole="eventsmod" />;
}
