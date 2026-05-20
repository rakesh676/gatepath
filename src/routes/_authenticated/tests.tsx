import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, FileText, Trash2, ListFilter, CheckCircle2, RotateCcw, Clock, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { ALL_QUESTIONS } from "@/data/questions";
import { calculateAttemptMarks } from "@/utils/marks";


export const Route = createFileRoute("/_authenticated/tests")({
  component: TestsPage,
});

function TestsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const [testState, setTestState] = useState<TestState | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [count, setCount] = useState(5);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", uid],
    queryFn: async () => (await supabase.from("subjects").select("*").eq("user_id", uid).order("name")).data ?? [],
  });
  
  const { data: attempts = [] } = useQuery({
    queryKey: ["attempts", uid],
    queryFn: async () => (await supabase.from("test_attempts").select("*").eq("user_id", uid).order("created_at", { ascending: false })).data ?? [],
  });

  const masteredIds = useMemo(() => {
    const ids = new Set<string>();
    attempts.forEach(a => {
      const details = (a.answers as any[]) || [];
      details.forEach(d => {
        if (d.isCorrect) ids.add(d.id);
      });
    });
    return ids;
  }, [attempts]);

  const availableTopics = useMemo(() => {
    if (selectedSubjects.length === 0) return [];
    const topics = new Set<string>();
    ALL_QUESTIONS.forEach(q => {
      if (selectedSubjects.includes(q.subject) && q.topic) {
        topics.add(q.topic);
      }
    });
    return Array.from(topics).sort();
  }, [selectedSubjects]);

  const pool = useMemo(() => {
    let filtered = ALL_QUESTIONS;
    if (selectedSubjects.length > 0) {
      filtered = filtered.filter(q => selectedSubjects.includes(q.subject));
    }
    if (selectedTopics.length > 0) {
      filtered = filtered.filter(q => q.topic && selectedTopics.includes(q.topic));
    }

    const unmastered = filtered.filter(q => !masteredIds.has(q.id));
    return unmastered.length > 0 ? unmastered : filtered;
  }, [selectedSubjects, selectedTopics, masteredIds]);

  const startTest = () => {
    if (pool.length === 0) return toast.error("No questions found for the selected filters.");
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
    const selectedSubObj = selectedSubjects.length === 1 ? subjects.find(s => s.name === selectedSubjects[0]) : null;

    setTestState({ 
      questions: shuffled, 
      answers: {}, 
      startedAt: Date.now(), 
      subjectId: selectedSubObj ? selectedSubObj.id : "Multiple"
    });
  };

  if (testState) return <RunTest state={testState} onExit={() => setTestState(null)} uid={uid} qc={qc} />;

  const SUBJECT_LIST = ["Engineering Mathematics","Discrete Mathematics","Linear Algebra","Calculus","Probability & Statistics","Digital Logic","Computer Organization & Architecture","Programming and Data Structures","Algorithms","Theory of Computation","Compiler Design","Operating Systems","DBMS","Computer Networks","General Aptitude"];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mock tests</h1>
          <p className="text-sm text-muted-foreground">GATE-style tests with negative marking for MCQs.</p>
        </div>
      </div>

      <Tabs defaultValue="run">
        <TabsList>
          <TabsTrigger value="run">Run a test</TabsTrigger>
          <TabsTrigger value="history">History ({attempts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="run" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="p-6 lg:col-span-3">
              <h3 className="mb-4 flex items-center gap-2 font-semibold text-lg">
                <ListFilter className="h-5 w-5 text-primary" /> Configure Test
              </h3>
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block text-sm font-medium">1. Select Subjects</Label>
                  <ScrollArea className="h-[180px] rounded-lg border bg-accent/10 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {SUBJECT_LIST.map((s) => (
                        <div key={s} className="flex items-center space-x-2">
                          <Checkbox id={`subj-${s}`} checked={selectedSubjects.includes(s)} onCheckedChange={() => setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} />
                          <Label htmlFor={`subj-${s}`} className="cursor-pointer text-sm leading-none">{s}</Label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                {availableTopics.length > 0 && (
                  <div>
                    <Label className="mb-3 block text-sm font-medium">2. Filter by Topics</Label>
                    <ScrollArea className="h-[150px] rounded-lg border bg-accent/5 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {availableTopics.map((t) => (
                          <div key={t} className="flex items-center space-x-2">
                            <Checkbox id={`topic-${t}`} checked={selectedTopics.includes(t)} onCheckedChange={() => setSelectedTopics(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])} />
                            <Label htmlFor={`topic-${t}`} className="cursor-pointer text-sm leading-none">{t}</Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium">3. Question Count</Label>
                  <Input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Number(e.target.value))} />
                </div>
              </div>
              <Button onClick={startTest} className="mt-8 w-full h-12 text-lg" disabled={pool.length === 0}>
                <Play className="mr-2 h-5 w-5 fill-current" /> Start Test ({Math.min(count, pool.length)} Qs)
              </Button>
            </Card>

            <Card className="p-6 lg:col-span-2 bg-primary/5 border-primary/10">
              <h3 className="mb-4 font-semibold text-lg">Marking Scheme</h3>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between p-2 rounded-lg bg-background border">
                  <span>MCQ (Single Correct)</span>
                  <span className="font-bold text-success">+1 / <span className="text-destructive">-0.33</span></span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-background border">
                  <span>MSQ (Multi Correct)</span>
                  <span className="font-bold text-success">+2 / <span className="text-muted-foreground">0</span></span>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg text-[10px] leading-relaxed text-muted-foreground">
                  Correct MSQs require all correct options to be selected and NO incorrect ones (no partial marking).
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6 space-y-2">
          {attempts.map((a) => {
            const { earnedMarks, totalMarks } = calculateAttemptMarks(a.answers as any);
            return (
              <Card key={a.id} className="flex items-center justify-between p-4 bg-card/50">
                <div>
                  <p className="font-semibold">{format(parseISO(a.created_at), "MMM d, yyyy · p")}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.correct_count}/{a.total_questions} correct · {earnedMarks} / {totalMarks} marks · {Math.floor((a.duration_seconds || 0) / 60)}m
                  </p>
                </div>
                <div className={`text-2xl font-bold ${Number(a.score) >= 70 ? "text-success" : "text-destructive"}`}>
                  {Number(a.score).toFixed(0)}%
                </div>
              </Card>
            );
          })}
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ correct: number; total: number; score: number; details: any[]; earnedMarks: number; totalMarks: number } | null>(null);
  const [elapsed, setElapsed] = useState(0);


  useEffect(() => {
    if (result) return;
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [result]);

  const submit = async () => {
    let totalMarks = 0;
    let earnedMarks = 0;

    const details = state.questions.map((q) => {
      const userAns = (answers[q.id] || "").split(",").filter(Boolean).sort().join(",");
      const correctAns = q.correct_answer.split(",").filter(Boolean).sort().join(",");
      const isCorrect = userAns === correctAns;
      
      const qMax = q.type === "MSQ" ? 2 : 1;
      totalMarks += qMax;

      if (isCorrect) {
        earnedMarks += qMax;
      } else if (userAns !== "" && q.type === "MCQ") {
        earnedMarks -= 0.33; // Negative marking for MCQ
      }

      return { id: q.id, chosen: userAns, correct: correctAns, isCorrect, type: q.type };
    });

    const correctCount = details.filter(d => d.isCorrect).length;
    const score = Math.max(0, (earnedMarks / totalMarks) * 100);
    
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(state.subjectId || "");
    
    const { error } = await supabase.from("test_attempts").insert({
      user_id: uid,
      subject_id: isValidUUID ? state.subjectId : null,
      total_questions: state.questions.length,
      correct_count: correctCount,
      score,
      duration_seconds: elapsed,
      answers: details,
    });
    
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["attempts", uid] });
    setResult({
      correct: correctCount,
      total: state.questions.length,
      score,
      details,
      earnedMarks: Math.max(0, Number(earnedMarks.toFixed(2))),
      totalMarks
    });
  };


  const toggleAnswer = (qId: string, opt: string) => {
    setAnswers(prev => {
      const current = prev[qId] ? prev[qId].split(",") : [];
      let next;
      if (current.includes(opt)) {
        next = current.filter(x => x !== opt);
      } else {
        next = [...current, opt];
      }
      return { ...prev, [qId]: next.sort().join(",") };
    });
  };

  if (result) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-20">
        <Card className="p-8 text-center bg-card shadow-lg">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Test Complete</p>
          <p className={`mt-4 text-7xl font-black ${result.score >= 70 ? "text-success" : "text-destructive"}`}>
            {result.score.toFixed(1)}%
          </p>
          <p className="text-xl font-bold mt-2 text-primary">
            Marks: {result.earnedMarks} / {result.totalMarks}
          </p>
          <p className="mt-2 font-medium text-xs text-muted-foreground">Time Taken: {Math.floor(elapsed / 60)}m {elapsed % 60}s</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" onClick={onExit} variant="outline">Exit</Button>

            <Button size="lg" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </Card>

        <div className="space-y-4">
          <h3 className="font-bold text-lg px-2">Review Solutions</h3>
          {state.questions.map((q, i) => (
            <Card key={q.id} className={`p-6 border-l-4 ${result.details[i].isCorrect ? "border-success" : "border-destructive"}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Badge variant="outline" className="mr-2">{q.type}</Badge>
                  <span className="text-xs text-muted-foreground font-mono">{q.id}</span>
                </div>
                <ObjectionDialog questionId={q.id} uid={uid} />
              </div>
              <p className="font-bold text-lg mb-6">{i + 1}. {q.question}</p>
              <div className="grid gap-3">
                {Object.entries(q.options || {}).map(([key, val]) => {
                  const isCorrectOpt = q.correct_answer.split(",").includes(key);
                  const isChosenOpt = (answers[q.id] || "").split(",").includes(key);
                  return (
                    <div key={key} className={`text-sm p-4 rounded-xl border-2 transition-all ${
                      isCorrectOpt ? "bg-success/5 border-success text-success font-bold" : 
                      isChosenOpt ? "bg-destructive/5 border-destructive text-destructive" : "bg-accent/20 border-transparent opacity-60"
                    }`}>
                      <div className="flex justify-between items-center">
                        <span><span className="uppercase font-black mr-4">{key}</span> {val as string}</span>
                        {isCorrectOpt && <CheckCircle2 className="h-4 w-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
              {q.explanation && (
                <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm">
                  <p className="text-[10px] font-black uppercase text-primary mb-1">Explanation</p>
                  <p className="text-muted-foreground italic leading-relaxed">{q.explanation}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const q = state.questions[currentIndex];
  const currentAnswers = (answers[q.id] || "").split(",").filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      <div className="sticky top-0 bg-background/80 backdrop-blur-md py-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black">
            {currentIndex + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold">Question {currentIndex + 1}</h1>
              <Badge variant="secondary" className="text-[10px]">{q.type}</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{q.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-black text-lg">
          <Clock className="h-4 w-4" />
          {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, "0")}
        </div>
      </div>

      <Card className="p-8 shadow-2xl border-primary/5">
        <p className="text-xl font-medium leading-relaxed mb-10 whitespace-pre-wrap">{q.question}</p>
        
        {q.type === "MCQ" ? (
          <RadioGroup className="space-y-4" value={answers[q.id]} onValueChange={(v) => setAnswers(p => ({ ...p, [q.id]: v }))}>
            {Object.entries(q.options || {}).map(([opt, val]) => (
              <label key={opt} className="group flex cursor-pointer items-center gap-4 rounded-2xl border-2 border-transparent bg-accent/30 p-5 transition-all hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                <span className="font-extrabold uppercase text-muted-foreground group-hover:text-primary">{opt}</span>
                <span className="flex-1 font-medium">{val as string}</span>
              </label>
            ))}
          </RadioGroup>
        ) : (
          <div className="space-y-4">
            {Object.entries(q.options || {}).map(([opt, val]) => (
              <label key={opt} className={`flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-5 transition-all outline-none ${
                currentAnswers.includes(opt) ? "border-primary bg-primary/5 shadow-md shadow-primary/5" : "border-transparent bg-accent/30 hover:bg-accent/50"
              }`}>
                <Checkbox checked={currentAnswers.includes(opt)} onCheckedChange={() => toggleAnswer(q.id, opt)} />
                <span className={`font-extrabold uppercase ${currentAnswers.includes(opt) ? "text-primary" : "text-muted-foreground"}`}>{opt}</span>
                <span className="flex-1 font-medium">{val as string}</span>
              </label>
            ))}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" size="lg" onClick={() => setCurrentIndex(c => c - 1)} disabled={currentIndex === 0} className="rounded-2xl px-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        {currentIndex === state.questions.length - 1 ? (
          <Button onClick={submit} size="lg" className="rounded-2xl px-12 bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
            Submit Final Test
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex(c => c + 1)} size="lg" className="rounded-2xl px-10">
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex justify-center gap-2 mt-12">
        {state.questions.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${
            i === currentIndex ? "w-8 bg-primary" : answers[state.questions[i].id] ? "w-4 bg-primary/40" : "w-2 bg-accent"
          }`} />
        ))}
      </div>
    </div>
  );
}

function ObjectionDialog({ questionId, uid }: { questionId: string; uid: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return toast.error("Please provide a reason.");
    setLoading(true);
    const { error } = await supabase.from("question_objections").insert({
      user_id: uid,
      question_id: questionId,
      reason: reason.trim()
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Objection submitted for review.");
      setOpen(false);
      setReason("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground hover:text-destructive">
          <AlertCircle className="h-3 w-3 mr-1" /> Objection?
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise an Objection</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <p className="text-xs text-muted-foreground italic">If you believe there is an error in the question or the answer key, please explain why. Our admin team will review it.</p>
          <Textarea 
            placeholder="e.g., Option B is also correct because..." 
            value={reason} 
            onChange={e => setReason(e.target.value)}
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Submitting..." : "Submit Objection"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
