import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, BookOpen, Flame, TrendingUp, FileText, ArrowRight } from "lucide-react";
import { format, subDays, parseISO, startOfDay } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const uid = user!.id;

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", uid],
    queryFn: async () => {
      const since = subDays(new Date(), 89).toISOString();
      const [goals, subjects, topics, attempts] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", uid),
        supabase.from("subjects").select("*").eq("user_id", uid),
        supabase.from("topics").select("*").eq("user_id", uid),
        supabase.from("test_attempts").select("*").eq("user_id", uid).gte("created_at", since).order("created_at", { ascending: false }),
      ]);
      return {
        goals: goals.data ?? [],
        subjects: subjects.data ?? [],
        topics: topics.data ?? [],
        attempts: attempts.data ?? [],
      };
    },
  });

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading your dashboard…</div>;
  }

  const completedGoals = data.goals.filter((g) => g.status === "completed").length;
  const totalGoals = data.goals.length;
  const subjectStats = data.subjects.map((s) => {
    const subTopics = data.topics.filter((t) => t.subject_id === s.id);
    const done = subTopics.filter((t) => t.completed).length;
    const pct = subTopics.length ? Math.round((done / subTopics.length) * 100) : 0;
    return { ...s, total: subTopics.length, done, pct };
  });
  const weakSubjects = subjectStats.filter((s) => s.confidence === "low").slice(0, 3);
  const avgScore = data.attempts.length
    ? Math.round((data.attempts.reduce((a, t) => a + Number(t.score), 0) / data.attempts.length) * 10) / 10
    : 0;

  // streak
  const goalDays = new Set(
    data.goals.filter((g) => g.completed_at).map((g) => format(startOfDay(parseISO(g.completed_at!)), "yyyy-MM-dd"))
  );
  const attemptDays = new Set(
    data.attempts.map((a) => format(startOfDay(parseISO(a.created_at)), "yyyy-MM-dd"))
  );
  const activeDays = new Set([...goalDays, ...attemptDays]);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (activeDays.has(d)) streak++;
    else if (i > 0) break;
  }

  // Heatmap data (last 90 days)
  const days = Array.from({ length: 90 }).map((_, i) => {
    const d = subDays(new Date(), 89 - i);
    const key = format(d, "yyyy-MM-dd");
    const goalsCount = data.goals.filter((g) => g.completed_at && format(parseISO(g.completed_at), "yyyy-MM-dd") === key).length;
    const testsCount = data.attempts.filter((a) => format(parseISO(a.created_at), "yyyy-MM-dd") === key).length;
    return { date: d, count: goalsCount + testsCount };
  });

  const cards = [
    { label: "Goals completed", value: completedGoals, sub: `of ${totalGoals}`, icon: Target },
    { label: "Subjects tracked", value: data.subjects.length, sub: `${data.topics.length} topics`, icon: BookOpen },
    { label: "Daily streak", value: streak, sub: streak === 1 ? "day" : "days", icon: Flame },
    { label: "Avg mock score", value: `${avgScore}%`, sub: `${data.attempts.length} attempts`, icon: TrendingUp },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back 👋</h1>
        <p className="text-sm text-muted-foreground">Here's your GATE prep at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Consistency</h2>
            <span className="text-xs text-muted-foreground">Last 90 days</span>
          </div>
          <Heatmap days={days} />
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent mock tests</h2>
            <Link to="/tests" className="text-xs text-primary hover:underline">View all</Link>
          </div>
          {data.attempts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempts yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.attempts.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{format(parseISO(a.created_at), "MMM d, p")}</p>
                    <p className="text-xs text-muted-foreground">{a.correct_count}/{a.total_questions} correct</p>
                  </div>
                  <span className="font-semibold">{Number(a.score).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Subject progress</h2>
            <Link to="/subjects" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {subjectStats.length === 0 ? (
            <EmptyState icon={BookOpen} title="No subjects yet" cta="Add subjects" to="/subjects" />
          ) : (
            <div className="space-y-4">
              {subjectStats.map((s) => (
                <div key={s.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground">{s.done}/{s.total} · {s.pct}%</span>
                  </div>
                  <Progress value={s.pct} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Weak areas</h2>
          {weakSubjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing flagged. Keep going!</p>
          ) : (
            <ul className="space-y-2">
              {weakSubjects.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                  <span>{s.name}</span>
                  <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">Low</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function Heatmap({ days }: { days: { date: Date; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const cell = (count: number) => {
    if (count === 0) return "bg-muted";
    const lvl = Math.min(4, Math.ceil((count / max) * 4));
    return ["bg-primary/25", "bg-primary/45", "bg-primary/70", "bg-primary"][lvl - 1];
  };
  // group by week (columns of 7)
  const weeks: { date: Date; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return (
    <div className="flex gap-1 overflow-x-auto">
      {weeks.map((w, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {w.map((d) => (
            <div key={d.date.toISOString()} title={`${format(d.date, "MMM d")} · ${d.count} activities`} className={`h-3 w-3 rounded-sm ${cell(d.count)}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, cta, to }: { icon: any; title: string; cta: string; to: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
      <Icon className="mb-2 h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{title}</p>
      <Link to={to} className="mt-3 text-sm text-primary hover:underline">{cta}</Link>
    </div>
  );
}
