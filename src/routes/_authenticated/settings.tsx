import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/use-theme";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const uid = user!.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", uid).maybeSingle()).data,
  });

  const update = useMutation({
    mutationFn: async (display_name: string) => {
      const { error } = await supabase.from("profiles").update({ display_name }).eq("id", uid);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["profile", uid] }); toast.success("Profile updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences.</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Profile</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            update.mutate(String(f.get("display_name")));
          }}
          className="space-y-4"
        >
          <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <div><Label>Display name</Label><Input name="display_name" defaultValue={profile?.display_name ?? ""} /></div>
          <Button type="submit" disabled={update.isPending}>Save changes</Button>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Dark mode</p>
            <p className="text-sm text-muted-foreground">Toggle between light and dark theme.</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggle} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold">Account</h2>
        <Button variant="destructive" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>Sign out</Button>
      </Card>
    </div>
  );
}
