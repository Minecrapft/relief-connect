import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

const BeneficiaryProfile = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("beneficiaries")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setData(data);
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

  if (!data) return <p className="text-muted-foreground py-10 text-center">No profile found.</p>;

  const statusVariant =
    data.status === "approved" ? "border-success text-success" :
    data.status === "rejected" ? "border-destructive text-destructive" :
    "border-warning text-warning";

  return (
    <div className="space-y-3 pt-2">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card>
        <CardContent className="py-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{data.full_name}</p>
            <Badge variant="outline" className={statusVariant}>{data.status}</Badge>
          </div>
          <Field label="Email" value={user?.email ?? "—"} />
          <Field label="Contact" value={data.contact_number} />
          <Field label="Household size" value={String(data.household_size)} />
          <Field label="Address" value={data.address} />
          <Field label="Government ID" value={data.government_id} />
        </CardContent>
      </Card>
    </div>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-medium mt-0.5">{value}</p>
  </div>
);

export default BeneficiaryProfile;
