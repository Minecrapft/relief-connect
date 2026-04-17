import { Card, CardContent } from "@/components/ui/card";
import { ScanLine } from "lucide-react";

const StaffScan = () => {
  return (
    <div className="space-y-3 pt-2">
      <h1 className="text-2xl font-bold">Scan</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <ScanLine className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">QR scanner coming next — will use phone camera to verify beneficiaries.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffScan;
