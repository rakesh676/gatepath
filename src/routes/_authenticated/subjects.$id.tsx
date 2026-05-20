import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, RotateCw, Trash2, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { calculateAttemptMarks } from "@/utils/marks";


export const Route = createFileRoute("/_authenticated/subjects/$id")({
  component: SubjectDetail,
});

type Conf = "low" | "medium" | "high";

function SubjectDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: subject } = useQuery({
    queryKey: ["subject", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: topics = [] } = useQuery({
    queryKey: ["topics", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("topics").select("*").eq("subject_id", id).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ["attempts-subject", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("test_attempts").select("*").eq("user_id", uid).eq("subject_id", id);
      if (error) throw error;
      return data ?? [];
    },
  });


  const IMPORT_TOPICS: Record<string, string[]> = {
  "Engineering Mathematics": [
    "Discrete Mathematics",
    "Linear Algebra",
    "Calculus",
    "Probability & Statistics"
  ],

  "Discrete Mathematics": [
    "Propositional Logic",
    "Predicate Logic",
    "Set Theory",
    "Relations & Functions",
    "Equivalence Relations",
    "Partial Orders",
    "Combinatorics",
    "Pigeonhole Principle",
    "Graph Theory",
    "Trees",
    "Boolean Algebra",
    "Groups",
    "Rings & Fields",
    "Recurrence Relations",
    "Mathematical Induction"
  ],

  "Linear Algebra": [
    "Matrices",
    "Determinants",
    "Eigenvalues & Eigenvectors",
    "Rank of Matrix",
    "System of Linear Equations",
    "Vector Spaces",
    "Linear Dependence & Independence"
  ],

  "Calculus": [
    "Limits",
    "Continuity",
    "Differentiability",
    "Partial Derivatives",
    "Maxima & Minima",
    "Mean Value Theorem",
    "Integration"
  ],

  "Probability & Statistics": [
    "Conditional Probability",
    "Bayes Theorem",
    "Random Variables",
    "Probability Distributions",
    "Binomial Distribution",
    "Poisson Distribution",
    "Normal Distribution",
    "Mean, Median & Mode",
    "Variance & Standard Deviation"
  ],

  "Digital Logic": [
    "Boolean Algebra",
    "Logic Gates",
    "Number Systems",
    "K-Maps",
    "Combinational Circuits",
    "Multiplexers & Demultiplexers",
    "Encoders & Decoders",
    "Adders & Subtractors",
    "Sequential Circuits",
    "Flip-Flops",
    "Registers",
    "Counters",
    "Finite State Machines",
    "Memory Units"
  ],

  "Computer Organization & Architecture": [
    "Instruction Formats",
    "Addressing Modes",
    "Machine Instructions",
    "ALU Operations",
    "Computer Arithmetic",
    "Floating Point Arithmetic",
    "Processor Organization",
    "Control Unit Design",
    "Pipelining",
    "Pipeline Hazards",
    "RISC vs CISC",
    "Memory Hierarchy",
    "Cache Memory",
    "Virtual Memory",
    "Paging & Segmentation",
    "I/O Interface",
    "Interrupts",
    "DMA"
  ],

  "Programming & Data Structures": [
    "Programming Concepts",
    "Recursion",
    "Arrays",
    "Linked Lists",
    "Stacks",
    "Queues",
    "Hash Tables",
    "Trees",
    "Binary Search Trees",
    "AVL Trees",
    "Heaps",
    "B-Trees",
    "Graphs",
    "Searching Algorithms",
    "Sorting Algorithms",
    "Hashing",
    "Priority Queues"
  ],

  "Algorithms": [
    "Asymptotic Analysis",
    "Time & Space Complexity",
    "Big O, Theta & Omega",
    "Recurrence Relations",
    "Divide & Conquer",
    "Greedy Algorithms",
    "Dynamic Programming",
    "Backtracking",
    "Branch & Bound",
    "Sorting Algorithms",
    "Searching Algorithms",
    "Graph Algorithms",
    "BFS & DFS",
    "Shortest Path Algorithms",
    "Minimum Spanning Tree",
    "Topological Sorting",
    "NP-Completeness",
    "Approximation Algorithms"
  ],

  "Theory of Computation": [
    "Finite Automata",
    "DFA & NFA",
    "Regular Expressions",
    "Regular Languages",
    "Pumping Lemma",
    "Context-Free Grammars",
    "Pushdown Automata",
    "Parse Trees",
    "Ambiguity",
    "Turing Machines",
    "Decidability",
    "Undecidability",
    "Recursive & Recursively Enumerable Languages",
    "Halting Problem"
  ],

  "Compiler Design": [
    "Lexical Analysis",
    "Tokens & Lexemes",
    "Finite Automata for Lexical Analysis",
    "Parsing",
    "Top-Down Parsing",
    "Bottom-Up Parsing",
    "LL Parsing",
    "LR Parsing",
    "Syntax Directed Translation",
    "Intermediate Code Generation",
    "Runtime Environment",
    "Symbol Tables",
    "Error Handling",
    "Code Optimization",
    "Peephole Optimization",
    "Loop Optimization"
  ],

  "Operating Systems": [
    "Processes & Threads",
    "CPU Scheduling",
    "Process Synchronization",
    "Semaphores & Monitors",
    "Inter-Process Communication",
    "Deadlocks",
    "Memory Management",
    "Paging",
    "Segmentation",
    "Virtual Memory",
    "Page Replacement Algorithms",
    "File Systems",
    "Disk Scheduling",
    "I/O Systems"
  ],

  "DBMS": [
    "ER Model",
    "Relational Model",
    "Relational Algebra",
    "Tuple & Domain Calculus",
    "SQL",
    "Joins & Nested Queries",
    "Functional Dependencies",
    "Normalization",
    "1NF, 2NF, 3NF, BCNF",
    "Transactions",
    "ACID Properties",
    "Concurrency Control",
    "Serializability",
    "Recovery Systems",
    "Indexing",
    "B-Trees & B+ Trees",
    "Hash Indexing"
  ],

  "Computer Networks": [
    "OSI Model",
    "TCP/IP Model",
    "Physical Layer",
    "Data Link Layer",
    "Error Detection",
    "Flow Control",
    "Ethernet",
    "Switching",
    "Network Layer",
    "IP Addressing",
    "Subnetting",
    "Routing Algorithms",
    "Transport Layer",
    "TCP",
    "UDP",
    "Congestion Control",
    "Application Layer",
    "HTTP",
    "DNS",
    "SMTP",
    "FTP",
    "Network Security Basics",
    "Cryptography Basics",
    "Firewalls"
  ],

  "General Aptitude": [
    "Grammar",
    "Vocabulary",
    "Sentence Completion",
    "Reading Comprehension",
    "Percentages",
    "Ratio & Proportion",
    "Profit & Loss",
    "Time & Work",
    "Permutation & Combination",
    "Probability",
    "Data Interpretation",
    "Logical Reasoning"
  ]
};

  const seedTopics = useMutation({
    mutationFn: async () => {
      const subjectName = subject?.name || "";
      const presetTopics = IMPORT_TOPICS[subjectName] || [];
      if (!presetTopics.length) {
        toast.info("No preset topics found for this subject name. You can still add topics manually.");
        return;
      }
      const existing = new Set(topics.map((t) => t.topic_name));
      const toInsert = presetTopics
        .filter((t) => !existing.has(t))
        .map((topic_name) => ({ user_id: uid, subject_id: id, topic_name }));

      if (!toInsert.length) {
        toast.info("All important topics are already in your list.");
        return;
      }
      const { error } = await supabase.from("topics").insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics", id] });
      toast.success("Important topics added to your checklist!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addTopic = useMutation({
    mutationFn: async (topic_name: string) => {
      const { error } = await supabase.from("topics").insert({ user_id: uid, subject_id: id, topic_name });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics", id] });
      setOpen(false);
    },
  });

  const updateTopic = useMutation({
    mutationFn: async (vals: { id: string; patch: Partial<{ completed: boolean; confidence: Conf; notes: string; revision_count: number }> }) => {
      const { error } = await supabase.from("topics").update(vals.patch).eq("id", vals.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics", id] }),
  });

  const delTopic = useMutation({
    mutationFn: async (tid: string) => {
      const { error } = await supabase.from("topics").delete().eq("id", tid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["topics", id] }),
  });

  const updateSubject = useMutation({
    mutationFn: async (patch: Partial<{ confidence: Conf; revision_count: number }>) => {
      const { error } = await supabase.from("subjects").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subject", id] });
      qc.invalidateQueries({ queryKey: ["subjects", uid] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createGoal = useMutation({

    mutationFn: async (topicName: string) => {
      const { error } = await supabase.from("goals").insert({
        user_id: uid,
        title: `Complete ${topicName}`,
        description: `Reviewing ${topicName} from ${subject?.name}`,
        priority: "medium",
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals", uid] });
      toast.success("Added to your daily goals!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!subject) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const done = topics.filter((t) => t.completed).length;
  const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;

  let avgScoreStr = "";
  if (attempts.length > 0) {
    let totalEarned = 0;
    let totalMax = 0;
    let sumScore = 0;
    attempts.forEach((a) => {
      const { earnedMarks, totalMarks } = calculateAttemptMarks(a.answers as any);
      totalEarned += earnedMarks;
      totalMax += totalMarks;
      sumScore += Number(a.score);
    });
    const avgEarned = totalEarned / attempts.length;
    const avgMax = totalMax / attempts.length;
    const avgPct = sumScore / attempts.length;
    avgScoreStr = ` · Avg mock: ${avgPct.toFixed(0)}% (${avgEarned.toFixed(2)}/${avgMax.toFixed(1)} M)`;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/subjects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All subjects
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{subject.name}</h1>
            <p className="text-sm text-muted-foreground">
              {done} of {topics.length} topics completed · {pct}%{avgScoreStr}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Confidence</Label>
              <Select value={subject.confidence} onValueChange={(v) => updateSubject.mutate({ confidence: v as Conf })}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => updateSubject.mutate({ revision_count: (subject.revision_count ?? 0) + 1 })}>
              <RotateCw className="mr-2 h-4 w-4" /> Revised ({subject.revision_count})
            </Button>
          </div>
        </div>
        <Progress value={pct} className="mt-4" />
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold">Topics Checklist</h2>
          <Button variant="outline" size="sm" onClick={() => seedTopics.mutate()} disabled={seedTopics.isPending}>
            <Sparkles className="mr-2 h-3.5 w-3.5 text-warning" />
            Seed Important Topics
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add topic
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New topic</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                addTopic.mutate(String(f.get("topic_name")));
              }}
              className="space-y-4"
            >
              <div>
                <Label>Topic name</Label>
                <Input name="topic_name" required autoFocus />
              </div>
              <DialogFooter>
                <Button type="submit">Add</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {topics.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          No topics yet. Click "Seed Important Topics" to get started or add your own.
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {topics.map((t) => (
            <Card key={t.id} className="p-4 transition-colors hover:bg-accent/5">
              <div className="flex items-start gap-3">
                <Checkbox checked={t.completed} onCheckedChange={(v) => updateTopic.mutate({ id: t.id, patch: { completed: !!v } })} className="mt-1" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`font-medium ${t.completed ? "text-muted-foreground line-through" : ""}`}>{t.topic_name}</p>
                    <div className="flex items-center gap-1">
                      <Select value={t.confidence} onValueChange={(v) => updateTopic.mutate({ id: t.id, patch: { confidence: v as Conf } })}>
                        <SelectTrigger className="h-7 w-22 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateTopic.mutate({ id: t.id, patch: { revision_count: (t.revision_count ?? 0) + 1 } })}
                        title="Mark revised"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs text-muted-foreground">{t.revision_count}x</span>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:bg-primary/10" onClick={() => createGoal.mutate(t.topic_name)} title="Make Goal">
                        <Target className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => delTopic.mutate(t.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Notes…"
                    defaultValue={t.notes ?? ""}
                    onBlur={(e) => {
                      if ((e.target.value ?? "") !== (t.notes ?? "")) updateTopic.mutate({ id: t.id, patch: { notes: e.target.value } });
                    }}
                    rows={1}
                    className="mt-2 min-h-[40px] resize-none text-sm"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
