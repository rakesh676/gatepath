import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Target, BookOpen, BarChart3, Flame, ArrowRight, GraduationCap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">GATE Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth"><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success" />
            Built for GATE 2026 aspirants
          </div>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">
            Track your <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">GATE prep</span><br />
            like a pro.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Daily goals, subject mastery, mock tests, and beautiful analytics — everything you need to stay consistent and reach your target rank.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="gap-2">Start tracking <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </div>
        </div>

        <div className="mt-24 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Target, title: "Daily goals", desc: "Plan, prioritize, and check off your study targets." },
            { icon: BookOpen, title: "Subject mastery", desc: "Track topics, confidence, and revisions per subject." },
            { icon: BarChart3, title: "Mock tests", desc: "Build your bank, simulate tests, analyze accuracy." },
            { icon: Flame, title: "Consistency", desc: "GitHub-style heatmap keeps your streak alive." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
