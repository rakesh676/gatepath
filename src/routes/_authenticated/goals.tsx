import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Target } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/goals")({
  component: GoalsPage,
});

type Status = "pending" | "completed";
type Priority = "low" | "medium" | "high";

const priorityColors: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning-foreground",
  high: "bg-destructive/15 text-destructive",
};

function GoalsPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [open, setOpen] = useState(false);

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("goals").select("*").eq("user_id", uid).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createGoal = useMutation({
    mutationFn: async (payload: { title: string; description: string; priority: Priority; due_date: string | null }) => {
      const { error } = await supabase.from("goals").insert({ ...payload, user_id: uid });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals", uid] }); setOpen(false); toast.success("Goal added"); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (g: typeof goals[number]) => {
      const next = g.status === "completed" ? "pending" : "completed";
      const { error } = await supabase.from("goals").update({
        status: next,
        completed_at: next === "completed" ? new Date().toISOString() : null,
      }).eq("id", g.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals", uid] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals", uid] }); toast.success("Deleted"); },
  });

  const filtered = goals.filter((g) => filter === "all" || g.status === filter);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Daily goals</h1>
          <p className="text-sm text-muted-foreground">Plan your study targets and check them off.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New goal</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                createGoal.mutate({
                  title: String(f.get("title")),
                  description: String(f.get("description") ?? ""),
                  priority: f.get("priority") as Priority,
                  due_date: (f.get("due_date") as string) || null,
                });
              }}
              className="space-y-4"
            >
              <div><Label>Title</Label><Input name="title" required /></div>
              <div><Label>Description</Label><Textarea name="description" rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Due date</Label><Input name="due_date" type="date" /></div>
              </div>
              <DialogFooter><Button type="submit" disabled={createGoal.isPending}>Add goal</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({goals.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({goals.filter((g) => g.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({goals.filter((g) => g.status === "completed").length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <Target className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No goals here yet. Add your first one.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => (
            <Card key={g.id} className="flex items-start gap-3 p-4">
              <Checkbox checked={g.status === "completed"} onCheckedChange={() => toggle.mutate(g)} className="mt-1" />
              <div className="flex-1">
                <p className={`font-medium ${g.status === "completed" ? "text-muted-foreground line-through" : ""}`}>{g.title}</p>
                {g.description && <p className="mt-0.5 text-sm text-muted-foreground">{g.description}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${priorityColors[g.priority as Priority]}`}>{g.priority}</span>
                  {g.due_date && <span className="text-muted-foreground">Due {format(new Date(g.due_date), "MMM d")}</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(g.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
