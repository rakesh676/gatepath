import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Link as LinkIcon, ExternalLink, Share2, Search, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/shared-resources")({
  component: SharedResourcesPage,
});

const CATEGORIES = [
  "Engineering Mathematics", "Discrete Mathematics", "Linear Algebra", "Calculus", "Probability & Statistics",
  "Digital Logic", "Computer Organization & Architecture", "Programming & Data Structures", "Algorithms",
  "Theory of Computation", "Compiler Design", "Operating Systems", "DBMS", "Computer Networks", "General Aptitude",
  "PYQ's", "Other Resources"
];

function SharedResourcesPage() {
  const { user } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ["shared-links"],
    queryFn: async () => {
      // Simplified query to avoid join errors if profiles table is missing
      const { data, error } = await supabase
        .from("shared_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addLink = useMutation({
    mutationFn: async (payload: { title: string; link: string; subject: string }) => {
      const { error } = await supabase.from("shared_links").insert({
        ...payload,
        user_id: uid,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared-links"] });
      setOpen(false);
      toast.success("Resource shared successfully!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shared_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared-links"] });
      toast.success("Resource removed");
    },
  });

  const filtered = resources.filter((r: any) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                         r.link.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || r.subject === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Shared Resources</h1>
          <p className="text-sm text-muted-foreground">PYQs, Notes, and Community links for GATE.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" /> Share a Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share New Resource</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const title = String(f.get("title"));
                const link = String(f.get("link"));
                const subject = String(f.get("subject"));

                if (!link.startsWith("http")) {
                  return toast.error("Please provide a valid URL starting with http:// or https://");
                }

                addLink.mutate({ title, link, subject });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Title / Description</Label>
                <Input name="title" placeholder="e.g. 2023 CS PYQ Solutions" required />
              </div>
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input name="link" placeholder="https://..." required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select name="subject" defaultValue="PYQ's">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-accent/50 p-3 flex gap-2 items-start">
                <Share2 className="h-4 w-4 text-primary mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Share direct links to high-quality GATE resources. Only links are accepted.
                </p>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addLink.isPending}>
                  {addLink.isPending ? "Sharing..." : "Post Resource"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border border-primary/5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search resources..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Card key={i} className="h-32 animate-pulse bg-accent/10" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-20 text-center">
          <LinkIcon className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No resources shared yet. Be the first!</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r: any) => (
            <Card key={r.id} className="group relative p-5 hover:border-primary/30 transition-all bg-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 text-foreground">
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold">{r.subject}</Badge>
                  {r.user_id === uid && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteLink.mutate(r.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <h3 className="font-bold line-clamp-2 mb-1 text-foreground">{r.title}</h3>
                <p className="text-[10px] text-muted-foreground mb-4 font-medium uppercase">
                  Added {format(parseISO(r.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full rounded-lg hover:bg-primary/10 hover:text-primary transition-all">
                <a href={r.link} target="_blank" rel="noopener noreferrer">
                  Access Resource <ExternalLink className="ml-2 h-3.5 w-3.5" />
                </a>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ children, variant = "default", className = "" }: { children: React.ReactNode; variant?: "default" | "secondary" | "outline"; className?: string }) {
  const styles = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "text-foreground border border-border"
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
