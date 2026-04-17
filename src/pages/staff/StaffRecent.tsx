import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, History } from "lucide-react";
import { format } from "date-fns";

const StaffRecent = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("distributions")
      .select("id, created_at, items, beneficiaries(full_name), events(name)")
      .eq("staff_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <h1 className="text-2xl font-bold">Recent scans</h1>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <History className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No distributions logged yet.</p>
          </CardContent>
        </Card>
      ) : (
        rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{r.beneficiaries?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{r.events?.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, h:mm a")}</p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default StaffRecent;
