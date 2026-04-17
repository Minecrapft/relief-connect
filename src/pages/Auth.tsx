import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ShieldCheck, QrCode } from "lucide-react";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(128),
});

const signUpSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email" }).max(255),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(128),
  full_name: z.string().trim().min(2, { message: "Name required" }).max(100),
  contact_number: z.string().trim().min(5).max(30),
  household_size: z.coerce.number().int().min(1).max(50),
  address: z.string().trim().min(5).max(500),
  government_id: z.string().trim().min(3).max(50),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  // Sign in
  const [siEmail, setSiEmail] = useState("");
  const [siPassword, setSiPassword] = useState("");

  // Sign up
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suName, setSuName] = useState("");
  const [suContact, setSuContact] = useState("");
  const [suHousehold, setSuHousehold] = useState("1");
  const [suAddress, setSuAddress] = useState("");
  const [suGovId, setSuGovId] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      const home = role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/me";
      navigate(home, { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email: siEmail, password: siPassword });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({
      email: suEmail,
      password: suPassword,
      full_name: suName,
      contact_number: suContact,
      household_size: suHousehold,
      address: suAddress,
      government_id: suGovId,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: parsed.data.full_name,
          contact_number: parsed.data.contact_number,
        },
      },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    if (data.user) {
      // Create beneficiary record (pending approval)
      const { error: bErr } = await supabase.from("beneficiaries").insert({
        user_id: data.user.id,
        full_name: parsed.data.full_name,
        contact_number: parsed.data.contact_number,
        household_size: parsed.data.household_size,
        address: parsed.data.address,
        government_id: parsed.data.government_id,
      });
      if (bErr) {
        console.error(bErr);
        toast.error("Account created but couldn't save details: " + bErr.message);
      }
      // Assign beneficiary role
      const { error: rErr } = await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: "beneficiary",
      });
      if (rErr) console.error(rErr);
    }
    setLoading(false);
    toast.success("Account created! Awaiting admin approval.");
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 text-primary-foreground">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10 backdrop-blur mb-3">
            <QrCode className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold">QRelief</h1>
          <p className="text-sm opacity-90 mt-1">Disaster relief, faster &amp; fairer</p>
        </div>

        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-4">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in or create a beneficiary account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-3 mt-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="si-email">Email</Label>
                    <Input id="si-email" type="email" inputMode="email" autoComplete="email" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="si-password">Password</Label>
                    <Input id="si-password" type="password" autoComplete="current-password" value={siPassword} onChange={(e) => setSiPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-3 mt-4">
                  <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground flex gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                    <span>Beneficiary signups need admin approval before you receive your QR code.</span>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-name">Full name</Label>
                    <Input id="su-name" value={suName} onChange={(e) => setSuName(e.target.value)} required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="su-contact">Contact</Label>
                      <Input id="su-contact" inputMode="tel" value={suContact} onChange={(e) => setSuContact(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-house">Household</Label>
                      <Input id="su-house" type="number" min={1} value={suHousehold} onChange={(e) => setSuHousehold(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-address">Address</Label>
                    <Input id="su-address" value={suAddress} onChange={(e) => setSuAddress(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-govid">Government ID #</Label>
                    <Input id="su-govid" value={suGovId} onChange={(e) => setSuGovId(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-email">Email</Label>
                    <Input id="su-email" type="email" inputMode="email" autoComplete="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="su-password">Password</Label>
                    <Input id="su-password" type="password" autoComplete="new-password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create beneficiary account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <p className="text-xs text-center text-muted-foreground mt-4">
              Staff &amp; admin accounts are created by administrators.
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-primary-foreground/80 hover:text-primary-foreground underline">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
