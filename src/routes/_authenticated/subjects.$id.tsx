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
import { ArrowLeft, Plus, RotateCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

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

  const addTopic = useMutation({
    mutationFn: async (topic_name: string) => {
      const { error } = await supabase.from("topics").insert({ user_id: uid, subject_id: id, topic_name });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["topics", id] }); setOpen(false); },
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subject", id] }),
  });

  if (!subject) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const done = topics.filter((t) => t.completed).length;
  const pct = topics.length ? Math.round((done / topics.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/subjects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All subjects
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{subject.name}</h1>
            <p className="text-sm text-muted-foreground">{done} of {topics.length} topics completed · {pct}%</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Confidence</Label>
              <Select value={subject.confidence} onValueChange={(v) => updateSubject.mutate({ confidence: v as Conf })}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
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
        <h2 className="font-semibold">Topics</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add topic</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New topic</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                addTopic.mutate(String(f.get("topic_name")));
              }}
              className="space-y-4"
            >
              <div><Label>Topic name</Label><Input name="topic_name" required autoFocus /></div>
              <DialogFooter><Button type="submit">Add</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {topics.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">No topics yet.</Card>
      ) : (
        <div className="space-y-2">
          {topics.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox checked={t.completed} onCheckedChange={(v) => updateTopic.mutate({ id: t.id, patch: { completed: !!v } })} className="mt-1" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`font-medium ${t.completed ? "text-muted-foreground line-through" : ""}`}>{t.topic_name}</p>
                    <div className="flex items-center gap-2">
                      <Select value={t.confidence} onValueChange={(v) => updateTopic.mutate({ id: t.id, patch: { confidence: v as Conf } })}>
                        <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="icon" variant="ghost" onClick={() => updateTopic.mutate({ id: t.id, patch: { revision_count: (t.revision_count ?? 0) + 1 } })} title="Mark revised">
                        <RotateCw className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs text-muted-foreground">{t.revision_count}x</span>
                      <Button size="icon" variant="ghost" onClick={() => delTopic.mutate(t.id)}>
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
                    rows={2}
                    className="mt-2"
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
