import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, BookOpen, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/subjects")({
  component: SubjectsPage,
});

const PRESETS = ["Operating Systems", "DBMS", "Computer Networks", "Algorithms", "Aptitude", "TOC", "Compiler Design", "Digital Logic", "Discrete Math", "COA"];

function SubjectsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").eq("user_id", uid).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: topics = [] } = useQuery({
    queryKey: ["topics-all", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("topics").select("id, subject_id, completed").eq("user_id", uid);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("subjects").insert({ user_id: uid, name });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects", uid] }); setOpen(false); toast.success("Subject added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects", uid] }),
  });

  const seed = useMutation({
    mutationFn: async () => {
      const existing = new Set(subjects.map((s) => s.name));
      const toInsert = PRESETS.filter((n) => !existing.has(n)).map((name) => ({ user_id: uid, name }));
      if (!toInsert.length) return;
      const { error } = await supabase.from("subjects").insert(toInsert);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["subjects", uid] }); toast.success("GATE subjects added"); },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Subjects</h1>
          <p className="text-sm text-muted-foreground">Track topics, confidence and revisions per subject.</p>
        </div>
        <div className="flex gap-2">
          {subjects.length === 0 && <Button variant="outline" onClick={() => seed.mutate()}>Add GATE CS preset</Button>}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New subject</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New subject</DialogTitle></DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  create.mutate(String(f.get("name")));
                }}
                className="space-y-4"
              >
                <div><Label>Name</Label><Input name="name" required autoFocus /></div>
                <DialogFooter><Button type="submit">Add</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {subjects.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No subjects yet. Add the GATE preset or create your own.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((s) => {
            const subTopics = topics.filter((t) => t.subject_id === s.id);
            const done = subTopics.filter((t) => t.completed).length;
            const pct = subTopics.length ? Math.round((done / subTopics.length) * 100) : 0;
            return (
              <Card key={s.id} className="group p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-xs text-muted-foreground">{subTopics.length} topics · {s.revision_count} revisions</p>
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100" onClick={() => remove.mutate(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span><span>{pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${
                    s.confidence === "high" ? "bg-success/20 text-success" : s.confidence === "low" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                  }`}>Confidence: {s.confidence}</span>
                  <Link to="/subjects/$id" params={{ id: s.id }} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    Open <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
