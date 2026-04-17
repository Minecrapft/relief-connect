import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Clock, XCircle } from "lucide-react";

interface Beneficiary {
  id: string;
  full_name: string;
  status: "pending" | "approved" | "rejected";
  qr_token: string | null;
  household_size: number;
  rejection_reason: string | null;
}

const BeneficiaryHome = () => {
  const { user } = useAuth();
  const [b, setB] = useState<Beneficiary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("beneficiaries")
        .select("id, full_name, status, qr_token, household_size, rejection_reason")
        .eq("user_id", user.id)
        .maybeSingle();
      setB(data as Beneficiary | null);
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

  if (!b) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No beneficiary record found. Please contact an administrator.</p>
        </CardContent>
      </Card>
    );
  }

  if (b.status === "pending") {
    return (
      <div className="space-y-4 pt-4">
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-warning/15 text-warning flex items-center justify-center">
              <Clock className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold">Awaiting approval</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Hi {b.full_name}, your account is being reviewed. You'll get your QR code as soon as an admin approves you.
            </p>
            <Badge variant="outline" className="border-warning text-warning">Pending</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (b.status === "rejected") {
    return (
      <Card className="mt-4">
        <CardContent className="py-8 text-center space-y-3">
          <div className="mx-auto h-14 w-14 rounded-full bg-destructive/15 text-destructive flex items-center justify-center">
            <XCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold">Application rejected</h2>
          {b.rejection_reason && (
            <p className="text-sm text-muted-foreground">{b.rejection_reason}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div>
        <h1 className="text-2xl font-bold">My QR Code</h1>
        <p className="text-sm text-muted-foreground mt-1">Show this at distribution events.</p>
      </div>

      <Card className="overflow-hidden border-0 shadow-elegant">
        <div className="gradient-primary px-5 py-4 text-primary-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-sm font-medium">Verified Beneficiary</span>
          </div>
          <p className="text-lg font-semibold mt-1">{b.full_name}</p>
          <p className="text-xs opacity-90">Household of {b.household_size}</p>
        </div>
        <CardContent className="bg-card flex flex-col items-center py-8">
          {b.qr_token ? (
            <div className="bg-white p-4 rounded-2xl shadow-md">
              <QRCodeSVG value={b.qr_token} size={240} level="H" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">QR code unavailable</p>
          )}
          <p className="text-[11px] text-muted-foreground mt-4 font-mono break-all text-center max-w-xs">
            {b.qr_token}
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        This QR works offline. Keep your phone brightness up at distribution events.
      </p>
    </div>
  );
};

export default BeneficiaryHome;
