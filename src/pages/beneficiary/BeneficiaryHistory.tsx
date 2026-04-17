import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Package } from "lucide-react";
import { format } from "date-fns";

interface DistRow {
  id: string;
  created_at: string;
  items: Array<{ name: string; quantity: number; unit: string }>;
  events: { name: string; location: string } | null;
}

const BeneficiaryHistory = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<DistRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // get beneficiary id first
      const { data: b } = await supabase.from("beneficiaries").select("id").eq("user_id", user.id).maybeSingle();
      if (!b) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("distributions")
        .select("id, created_at, items, events(name, location)")
        .eq("beneficiary_id", b.id)
        .order("created_at", { ascending: false });
      setRows((data as any) ?? []);
      setLoading(false);
    };
    load();
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
      <h1 className="text-2xl font-bold">Claim history</h1>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No distributions yet.</p>
          </CardContent>
        </Card>
      ) : (
        rows.map((r) => (
          <Card key={r.id}>
            <CardContent className="py-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{r.events?.name ?? "Event"}</p>
                  <p className="text-xs text-muted-foreground">{r.events?.location}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(r.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.items.map((it, i) => (
                  <span key={i} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-md">
                    {it.quantity} {it.unit} {it.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default BeneficiaryHistory;
