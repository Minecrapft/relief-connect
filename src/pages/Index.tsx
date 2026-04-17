import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QrCode, ShieldCheck, Package, ScanLine, Users, BarChart3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, role } = useAuth();
  const homeFor = role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/me";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="gradient-hero text-primary-foreground">
        <div className="max-w-5xl mx-auto px-5 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-9 w-9 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
              <QrCode className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">QRelief</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight max-w-2xl">
            Relief distribution that's fast, fair, and accountable.
          </h1>
          <p className="mt-4 text-base sm:text-lg opacity-90 max-w-xl">
            QR-powered beneficiary verification, real-time inventory, and offline-ready field tools — built for responders.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {user ? (
              <Link to={homeFor}>
                <Button size="lg" className="h-12 bg-accent hover:bg-accent/90 text-accent-foreground">
                  Open dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button size="lg" className="h-12 bg-accent hover:bg-accent/90 text-accent-foreground">
                    Get started
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="h-12 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                    Sign in
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 py-12 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Built for the field</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: ScanLine, title: "QR Scanning", desc: "Verify beneficiaries instantly with phone camera." },
            { icon: ShieldCheck, title: "Duplicate Prevention", desc: "Block double claims within each event automatically." },
            { icon: Package, title: "Live Inventory", desc: "Stock auto-decrements with each distribution." },
            { icon: Users, title: "Role-based Access", desc: "Admins, staff, and beneficiaries see only what they need." },
            { icon: BarChart3, title: "Real-time Reports", desc: "Track packages distributed, beneficiaries served, stock levels." },
            { icon: QrCode, title: "Offline Ready", desc: "Scan and log even without internet — syncs when back online." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <p>QRelief — every package counts.</p>
      </footer>
    </div>
  );
};

export default Index;
