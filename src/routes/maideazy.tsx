import { createFileRoute, Link } from "@tanstack/react-router";
import { MaideazyForm } from "@/components/MaideazyForm";

export const Route = createFileRoute("/maideazy")({
  head: () => ({
    meta: [
      { title: "MAIDEAZY — Job Seeker Registration" },
      { name: "description", content: "Register with MAIDEAZY for maid, housekeeping, cooking, nanny and elderly care jobs." },
      { property: "og:title", content: "MAIDEAZY — Job Seeker Registration" },
      { property: "og:description", content: "Job seeker registration form for MAIDEAZY home services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MaideazyPage,
});

function MaideazyPage() {
  return (
    <div className="min-h-screen bg-me-bg px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="mb-4 inline-block text-sm text-white/70 underline hover:text-white">&larr; Back to HIRE-VIA form</Link>
        <MaideazyForm />
      </div>
    </div>
  );
}
