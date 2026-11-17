import NotFoundCard from "@/components/dashboard/NotFoundCard";

/** 404 inside the dashboard (keeps the sidebar). */
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-dvh min-w-0 flex-1">
      <NotFoundCard />
    </div>
  );
}
