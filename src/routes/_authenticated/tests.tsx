import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Play, FileText, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/tests")({
  component: TestsPage,
});

type Diff = "easy" | "medium" | "hard";

function TestsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const [openQ, setOpenQ] = useState(false);
  const [testState, setTestState] = useState<TestState | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [count, setCount] = useState(5);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", uid],
    queryFn: async () => (await supabase.from("subjects").select("*").eq("user_id", uid).order("name")).data ?? [],
  });
  const { data: questions = [] } = useQuery({
    queryKey: ["questions", uid],
    queryFn: async () => (await supabase.from("questions").select("*").eq("user_id", uid).order("created_at", { ascending: false })).data ?? [],
  });
  const { data: attempts = [] } = useQuery({
    queryKey: ["attempts", uid],
    queryFn: async () => (await supabase.from("test_attempts").select("*").eq("user_id", uid).order("created_at", { ascending: false })).data ?? [],
  });

  const addQuestion = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from("questions").insert({ ...payload, user_id: uid });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["questions", uid] }); setOpenQ(false); toast.success("Question added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const delQuestion = useMutation({
    mutationFn: async (qid: string) => { const { error } = await supabase.from("questions").delete().eq("id", qid); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions", uid] }),
  });

  const pool = useMemo(() => subjectFilter === "all" ? questions : questions.filter((q) => q.subject_id === subjectFilter), [questions, subjectFilter]);

  const startTest = () => {
    if (pool.length === 0) return toast.error("Add questions first");
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
    setTestState({ questions: shuffled, answers: {}, startedAt: Date.now(), subjectId: subjectFilter === "all" ? null : subjectFilter });
  };

  if (testState) return <RunTest state={testState} onExit={() => setTestState(null)} uid={uid} qc={qc} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mock tests</h1>
        <p className="text-sm text-muted-foreground">Build your question bank, run timed tests, analyze accuracy.</p>
      </div>

      <Tabs defaultValue="run">
        <TabsList>
          <TabsTrigger value="run">Run a test</TabsTrigger>
          <TabsTrigger value="bank">Question bank ({questions.length})</TabsTrigger>
          <TabsTrigger value="history">History ({attempts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="mt-6">
          <Card className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Subject</Label>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Number of questions</Label>
                <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} />
              </div>
              <div className="flex items-end">
                <Button onClick={startTest} className="w-full"><Play className="mr-2 h-4 w-4" /> Start test</Button>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{pool.length} questions available for this filter.</p>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="mt-6 space-y-3">
          <div className="flex justify-end">
            <Dialog open={openQ} onOpenChange={setOpenQ}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New question</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>New question</DialogTitle></DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    addQuestion.mutate({
                      subject_id: (f.get("subject_id") as string) || null,
                      question: String(f.get("question")),
                      option_a: String(f.get("option_a")),
                      option_b: String(f.get("option_b")),
                      option_c: String(f.get("option_c")),
                      option_d: String(f.get("option_d")),
                      correct_answer: String(f.get("correct_answer")),
                      difficulty: f.get("difficulty") as Diff,
                      explanation: String(f.get("explanation") ?? ""),
                    });
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Subject</Label>
                      <Select name="subject_id">
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>{subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Difficulty</Label>
                      <Select name="difficulty" defaultValue="medium">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Question</Label><Textarea name="question" required rows={2} /></div>
                  {(["a", "b", "c", "d"] as const).map((opt) => (
                    <div key={opt}><Label>Option {opt.toUpperCase()}</Label><Input name={`option_${opt}`} required /></div>
                  ))}
                  <div>
                    <Label>Correct answer</Label>
                    <Select name="correct_answer" defaultValue="a">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["a", "b", "c", "d"] as const).map((o) => <SelectItem key={o} value={o}>{o.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Explanation (optional)</Label><Textarea name="explanation" rows={2} /></div>
                  <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          {questions.length === 0 ? (
            <Card className="p-10 text-center"><FileText className="mx-auto mb-2 h-6 w-6 text-muted-foreground" /><p className="text-sm text-muted-foreground">No questions yet. Add some to start testing.</p></Card>
          ) : questions.map((q) => (
            <Card key={q.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium">{q.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Correct: {q.correct_answer.toUpperCase()} · {q.difficulty}
                    {q.subject_id && ` · ${subjects.find((s) => s.id === q.subject_id)?.name ?? ""}`}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => delQuestion.mutate(q.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-2">
          {attempts.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">No attempts yet.</Card>
          ) : attempts.map((a) => (
            <Card key={a.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{format(parseISO(a.created_at), "MMM d, yyyy · p")}</p>
                <p className="text-xs text-muted-foreground">{a.correct_count}/{a.total_questions} correct{a.subject_id && ` · ${subjects.find((s) => s.id === a.subject_id)?.name ?? ""}`}</p>
              </div>
              <div className={`text-xl font-semibold ${Number(a.score) >= 70 ? "text-success" : Number(a.score) >= 40 ? "text-warning" : "text-destructive"}`}>
                {Number(a.score).toFixed(0)}%
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TestState {
  questions: any[];
  answers: Record<string, string>;
  startedAt: number;
  subjectId: string | null;
}

function RunTest({ state, onExit, uid, qc }: { state: TestState; onExit: () => void; uid: string; qc: ReturnType<typeof useQueryClient> }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ correct: number; total: number; score: number; details: any[] } | null>(null);

  const submit = async () => {
    const details = state.questions.map((q) => ({
      id: q.id,
      chosen: answers[q.id] ?? null,
      correct: q.correct_answer,
      isCorrect: answers[q.id] === q.correct_answer,
    }));
    const correct = details.filter((d) => d.isCorrect).length;
    const score = (correct / state.questions.length) * 100;
    const { error } = await supabase.from("test_attempts").insert({
      user_id: uid,
      subject_id: state.subjectId,
      total_questions: state.questions.length,
      correct_count: correct,
      score,
      duration_seconds: Math.floor((Date.now() - state.startedAt) / 1000),
      answers: details,
    });
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["attempts", uid] });
    setResult({ correct, total: state.questions.length, score, details });
  };

  if (result) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Your score</p>
          <p className={`mt-2 text-6xl font-bold ${result.score >= 70 ? "text-success" : result.score >= 40 ? "text-warning" : "text-destructive"}`}>
            {result.score.toFixed(0)}%
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{result.correct} of {result.total} correct</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button onClick={onExit}>Back to tests</Button>
          </div>
        </Card>
        <div className="space-y-2">
          {state.questions.map((q, i) => {
            const d = result.details[i];
            return (
              <Card key={q.id} className="p-4">
                <p className="font-medium">{i + 1}. {q.question}</p>
                <p className={`mt-2 text-sm ${d.isCorrect ? "text-success" : "text-destructive"}`}>
                  Your answer: {d.chosen?.toUpperCase() ?? "—"} · Correct: {d.correct.toUpperCase()}
                </p>
                {q.explanation && <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mock test in progress</h1>
        <Button variant="ghost" onClick={onExit}>Exit</Button>
      </div>
      {state.questions.map((q, i) => (
        <Card key={q.id} className="p-5">
          <p className="font-medium">{i + 1}. {q.question}</p>
          <RadioGroup
            className="mt-3 space-y-2"
            value={answers[q.id]}
            onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
          >
            {(["a", "b", "c", "d"] as const).map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 text-sm hover:bg-accent/50">
                <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                <span className="font-medium uppercase text-muted-foreground">{opt}.</span>
                <span>{q[`option_${opt}`]}</span>
              </label>
            ))}
          </RadioGroup>
        </Card>
      ))}
      <div className="flex justify-end">
        <Button onClick={submit} size="lg">Submit test</Button>
      </div>
    </div>
  );
}
