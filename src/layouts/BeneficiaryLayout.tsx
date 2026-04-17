import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogOut, QrCode, History, User } from "lucide-react";

const tabs = [
  { to: "/me", label: "QR Code", icon: QrCode, end: true },
  { to: "/me/history", label: "History", icon: History },
  { to: "/me/profile", label: "Profile", icon: User },
];

const BeneficiaryLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur safe-top">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground">
              <QrCode className="h-4 w-4" />
            </div>
            <span className="font-bold">QRelief</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 pb-24">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur safe-bottom">
        <div className="max-w-2xl mx-auto grid grid-cols-3">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default BeneficiaryLayout;
