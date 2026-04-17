import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, Package, CalendarDays, ClipboardList } from "lucide-react";

const AdminHome = () => {
  const [stats, setStats] = useState({ beneficiaries: 0, pending: 0, events: 0, distributions: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [b, bp, e, d, inv] = await Promise.all([
        supabase.from("beneficiaries").select("id", { count: "exact", head: true }),
        supabase.from("beneficiaries").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("events").select("id", { count: "exact", head: true }).in("status", ["upcoming", "active"]),
        supabase.from("distributions").select("id", { count: "exact", head: true }),
        supabase.from("inventory_items").select("stock, low_stock_threshold"),
      ]);
      const lowStock = (inv.data ?? []).filter((i: any) => i.stock <= i.low_stock_threshold).length;
      setStats({
        beneficiaries: b.count ?? 0,
        pending: bp.count ?? 0,
        events: e.count ?? 0,
        distributions: d.count ?? 0,
        lowStock,
      });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    { label: "Beneficiaries", value: stats.beneficiaries, icon: Users, color: "text-primary" },
    { label: "Pending approvals", value: stats.pending, icon: ClipboardList, color: "text-warning" },
    { label: "Active events", value: stats.events, icon: CalendarDays, color: "text-accent" },
    { label: "Distributions", value: stats.distributions, icon: Package, color: "text-success" },
  ];

  return (
    <div className="space-y-4 pt-2">
      <h1 className="text-2xl font-bold">Overview</h1>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="py-4">
              <Icon className={`h-5 w-5 ${color}`} />
              <p className="text-2xl font-bold mt-2">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {stats.lowStock > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="py-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-warning" />
            <div>
              <p className="font-semibold text-sm">{stats.lowStock} items below threshold</p>
              <p className="text-xs text-muted-foreground">Check inventory and restock soon.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminHome;
