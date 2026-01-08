import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Gavel,
  Loader2,
  Scale,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RoleCategory =
  | "judiciary"
  | "legal_practitioner"
  | "public_party"
  | "police";

const roleConfig = {
  judiciary: {
    title: "Judiciary Portal",
    subtitle: "Judges & Administrators",
    icon: Gavel,
    theme: "text-amber-400",
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  legal_practitioner: {
    title: "Legal Practitioner Portal",
    subtitle: "Lawyers & Clerks",
    icon: Scale,
    theme: "text-primary",
    border: "border-primary/30",
    bg: "bg-primary/10",
  },
  public_party: {
    title: "Public Portal",
    subtitle: "Plaintiffs, Defendants & Citizens",
    icon: Users,
    theme: "text-slate-400",
    border: "border-slate-500/30",
    bg: "bg-slate-500/10",
  },
  police: {
    title: "Police Portal",
    subtitle: "Investigating Officers & Station Admins",
    icon: Shield,
    theme: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
  },
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, __devSetAuth } = useAuth();
  const {
    address,
    isConnected,
    isConnecting,
    connect,
    signMessage,
    isSigning,
  } = useWeb3();
  const [authInitiated, setAuthInitiated] = useState(false);

  const roleParam = searchParams.get("role") as RoleCategory | null;
  const role: RoleCategory = roleParam && roleConfig[roleParam]
    ? roleParam
    : "public_party";
  const config = roleConfig[role];
  const Icon = config.icon;

  // 1. Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // 2. Silent Connection Check (Does NOT open popup, just checks if already connected)
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (isConnected) return;

      // Type assertion for window.ethereum
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          // eth_accounts returns currently connected accounts without triggering a popup
          const accounts = await (window as any).ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            connect(); // Syncs the internal state
          }
        } catch (err) {
          console.error("Error checking existing connection", err);
        }
      }
    };
    checkExistingConnection();
  }, [isConnected, connect]);

  // REMOVED: The useEffect that auto-triggered handleAuth() has been deleted.
  // This prevents the MetaMask "Sign Request" from popping up automatically.

  // 3. Main Authentication Logic
  const handleAuth = async () => {
    if (!isConnected || !address) return;
    setAuthInitiated(true);

    try {
      const walletEmail = `${address.toLowerCase()}@wallet.nyaysutra.court`;
      const message =
        `Sign in to NyaySutra\nWallet: ${address}\nTimestamp: ${Date.now()}`;

      // This will trigger the Popup only when user CLICKS the button
      const signature = await signMessage(message);
      if (!signature) {
        setAuthInitiated(false);
        return;
      }

      const derivedPassword = `ns_wallet_${signature.slice(0, 32)}`;

      const { data: signInData, error: signInError } = await supabase.auth
        .signInWithPassword({
          email: walletEmail,
          password: derivedPassword,
        });

      // --- SUCCESSFUL SIGN IN ---
      if (!signInError && signInData.session) {
        toast.success("Wallet authenticated successfully!");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("role_category")
          .eq("user_id", signInData.user?.id)
          .maybeSingle();

        if (profileData?.role_category === "police") {
          navigate("/police/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
        return;
      }

      // --- ACCOUNT NOT FOUND -> SIGN UP ---
      if (signInError?.message?.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } = await supabase.auth
          .signUp({
            email: walletEmail,
            password: derivedPassword,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
              data: {
                full_name: `Wallet ${address.slice(0, 6)}...${
                  address.slice(-4)
                }`,
                role_category: role,
                wallet_address: address,
              },
            },
          });

        if (signUpError) {
          if (import.meta.env.DEV && __devSetAuth) {
            const devUser = { id: `dev-${Date.now()}`, email: walletEmail };
            const devProfile = {
              id: `devp-${Date.now()}`,
              email: walletEmail,
              full_name: `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
              role_category: role,
              wallet_address: address,
            };
            __devSetAuth(devUser, devProfile as any);
            navigate("/dashboard", { replace: true });
            return;
          }

          toast.error(signUpError.message ?? "Authentication failed");
          setAuthInitiated(false);
          return;
        }

        toast.success("Wallet connected & account created!");

        if (!signUpData.session) {
          const { error: postSignUpError } = await supabase.auth
            .signInWithPassword({
              email: walletEmail,
              password: derivedPassword,
            });

          if (postSignUpError) {
            toast.error("Sign-in failed after creation. Please try again.");
            setAuthInitiated(false);
            return;
          }
        }

        if (role === "police") {
          navigate("/police/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } else if (signInError) {
        toast.error(signInError.message);
        setAuthInitiated(false);
      }
    } catch (err: any) {
      console.error("Wallet auth error:", err);
      toast.error(err?.message ?? "Authentication failed");
      setAuthInitiated(false);
    }
  };

  const handleConnectWallet = () => {
    connect();
  };

  const buttonClass = cn(
    "w-full h-14 text-lg font-semibold rounded-xl transition-all relative overflow-hidden",
    "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
    "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 grid-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Role Selection
        </Button>

        <div
          className={cn("glass-card p-8 rounded-2xl border-2", config.border)}
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div
                  className={cn(
                    "absolute inset-0 blur-xl rounded-full opacity-50",
                    config.theme.replace("text-", "bg-"),
                  )}
                />
                <div className="relative w-16 h-16 rounded-xl bg-background/50 border border-white/10 flex items-center justify-center">
                  <Icon className={cn("w-8 h-8", config.theme)} />
                </div>
              </div>
            </div>
            <h1 className={cn("text-2xl font-bold", config.theme)}>
              {config.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {config.subtitle}
            </p>
          </div>

          <div className="space-y-6">
            {isConnected && address
              ? (
                // STATE 2: Wallet Connected -> Show Verification Button
                <Button
                  onClick={handleAuth}
                  disabled={isSigning || authInitiated}
                  className={cn(
                    buttonClass,
                    "border border-primary/50 flex justify-between items-center px-6",
                  )}
                >
                  {isSigning || authInitiated
                    ? (
                      <div className="flex items-center justify-center w-full">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Verifying Identity...
                      </div>
                    )
                    : (
                      <>
                        {/* LEFT: Text */}
                        <span className="font-semibold text-lg">
                          Verify Wallet
                        </span>

                        {/* RIGHT: Icon/Address */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono hidden sm:inline-block">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </span>
                          <div className="bg-green-500/20 p-1 rounded-full">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          </div>
                        </div>
                      </>
                    )}
                </Button>
              )
              : (
                // STATE 1: Not Connected -> Show Connect Button
                <Button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className={buttonClass}
                >
                  {isConnecting
                    ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    )
                    : (
                      <>
                        <Wallet className="w-5 h-5 mr-2" />
                        Connect Wallet
                      </>
                    )}
                </Button>
              )}

            <p className="text-xs text-center text-muted-foreground">
              Connect your MetaMask or compatible wallet to authenticate
              securely using blockchain verification.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
