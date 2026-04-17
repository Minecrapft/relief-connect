import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, CalendarDays, ScanLine } from "lucide-react";
import { format } from "date-fns";

const StaffEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: assigns } = await supabase
        .from("staff_assignments")
        .select("event_id")
        .eq("staff_id", user.id);
      const ids = (assigns ?? []).map((a) => a.event_id);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("events")
        .select("*")
        .in("id", ids)
        .order("starts_at", { ascending: true });
      setEvents(data ?? []);
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
      <h1 className="text-2xl font-bold">Assigned events</h1>
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No events assigned yet.</p>
            <p className="text-xs text-muted-foreground mt-1">An admin will assign you to events.</p>
          </CardContent>
        </Card>
      ) : (
        events.map((e) => (
          <Card key={e.id} className="overflow-hidden">
            <CardContent className="py-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{e.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {e.location}
                  </p>
                </div>
                <Badge variant={e.status === "active" ? "default" : "outline"} className={e.status === "active" ? "bg-success text-success-foreground" : ""}>
                  {e.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(e.starts_at), "MMM d, h:mm a")} – {format(new Date(e.ends_at), "h:mm a")}
              </p>
              <Link to={`/staff/scan?event=${e.id}`} className="block">
                <button className="mt-2 w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg gradient-accent text-accent-foreground text-sm font-semibold">
                  <ScanLine className="h-4 w-4" /> Scan for this event
                </button>
              </Link>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default StaffEvents;
