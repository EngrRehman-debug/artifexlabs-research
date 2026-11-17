import NotFoundCard from "@/components/dashboard/NotFoundCard";

/** 404 for any unknown URL. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh">
      <NotFoundCard />
    </main>
  );
}
