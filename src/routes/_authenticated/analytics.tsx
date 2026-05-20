import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { format, parseISO, subDays } from "date-fns";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { user } = useAuth();
  const uid = user!.id;

  const { data } = useQuery({
    queryKey: ["analytics", uid],
    queryFn: async () => {
      const [subjects, topics, attempts, goals] = await Promise.all([
        supabase.from("subjects").select("*").eq("user_id", uid),
        supabase.from("topics").select("*").eq("user_id", uid),
        supabase.from("test_attempts").select("*").eq("user_id", uid).order("created_at"),
        supabase.from("goals").select("*").eq("user_id", uid),
      ]);
      return { subjects: subjects.data ?? [], topics: topics.data ?? [], attempts: attempts.data ?? [], goals: goals.data ?? [] };
    },
  });

  if (!data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const subjectProgress = data.subjects.map((s) => {
    const ts = data.topics.filter((t) => t.subject_id === s.id);
    return { name: s.name, completion: ts.length ? Math.round((ts.filter((t) => t.completed).length / ts.length) * 100) : 0 };
  });

  const scoreTrend = data.attempts.map((a) => ({ date: format(parseISO(a.created_at), "MMM d"), score: Number(a.score) }));

  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = subDays(new Date(), 13 - i);
    const key = format(d, "yyyy-MM-dd");
    return {
      day: format(d, "MMM d"),
      goals: data.goals.filter((g) => g.completed_at && format(parseISO(g.completed_at), "yyyy-MM-dd") === key).length,
      tests: data.attempts.filter((a) => format(parseISO(a.created_at), "yyyy-MM-dd") === key).length,
    };
  });

  const confidenceCounts = ["low", "medium", "high"].map((c) => ({
    confidence: c,
    topics: data.topics.filter((t) => t.confidence === c).length,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Visualize trends across subjects, tests and consistency.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Mock score trend</h2>
          {scoreTrend.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: "var(--color-primary)" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Subject completion</h2>
          {subjectProgress.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={subjectProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="completion" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Daily activity (14 days)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={days}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
              <Bar dataKey="goals" stackId="a" fill="var(--color-chart-1)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="tests" stackId="a" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Topic confidence</h2>
          {confidenceCounts.every((c) => c.topics === 0) ? <Empty /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={confidenceCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="confidence" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Bar dataKey="topics" fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

function Empty() { return <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">Not enough data yet.</div>; }
