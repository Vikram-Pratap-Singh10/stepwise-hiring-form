import { createFileRoute } from "@tanstack/react-router";
import { HireForm } from "@/components/HireForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HIRE-VIA — Job Seeker Registration" },
      { name: "description", content: "Register with HIRE-VIA Manpower & Staffing Services for maid, driver, cook, nurse and other jobs." },
      { property: "og:title", content: "HIRE-VIA — Job Seeker Registration" },
      { property: "og:description", content: "Step-by-step job seeker registration for HIRE-VIA Manpower & Staffing Services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <header className="bg-hero px-4 pb-28 pt-12 text-center text-primary-foreground">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Manpower & Staffing Services</p>
        <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">HIRE-VIA</h1>
        <p className="mt-2 opacity-90">Job Seeker Registration Form</p>
      </header>
      <main className="mx-auto -mt-20 max-w-3xl px-4 pb-16">
        <HireForm />
      </main>
    </div>
  );
}
