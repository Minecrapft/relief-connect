import { Card, CardContent } from "@/components/ui/card";

const Placeholder = ({ title, desc }: { title: string; desc: string }) => (
  <div className="space-y-3 pt-2">
    <h1 className="text-2xl font-bold">{title}</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  </div>
);

export const AdminEvents = () => <Placeholder title="Events" desc="Create and manage distribution events. Coming next." />;
export const AdminInventory = () => <Placeholder title="Inventory" desc="Manage relief items and stock levels. Coming next." />;
export const AdminBeneficiaries = () => <Placeholder title="Beneficiaries" desc="Approve signups and manage beneficiaries. Coming next." />;
export const AdminStaff = () => <Placeholder title="Staff" desc="Invite staff and assign them to events. Coming next." />;
