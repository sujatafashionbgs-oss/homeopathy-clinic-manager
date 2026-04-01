import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Leaf, Loader2, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400)); // brief UX delay
    const ok = login(email, password);
    setLoading(false);
    if (ok) {
      toast.success("Welcome back!");
      navigate({ to: "/" });
    } else {
      toast.error("Invalid email or password");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "oklch(0.97 0.02 152)" }}
      data-ocid="login.page"
    >
      <div className="w-full max-w-md px-4">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div
            className="px-8 py-8 text-center"
            style={{ background: "oklch(0.42 0.12 152)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "oklch(0.55 0.14 152)" }}
            >
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-white">
              Dr. Sharma's Homeopathy
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Clinic Management System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                  className="pl-10"
                  required
                  data-ocid="login.email.input"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10"
                  required
                  data-ocid="login.password.input"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={loading}
              data-ocid="login.submit_button"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Demo Hint */}
            <div
              className="rounded-lg p-3 text-xs space-y-1"
              style={{ background: "oklch(0.97 0.02 152)" }}
            >
              <p className="font-semibold text-foreground">Demo credentials:</p>
              <p className="text-muted-foreground">
                Admin: <span className="font-mono">admin@clinic.com</span> /{" "}
                <span className="font-mono">admin123</span>
              </p>
              <p className="text-muted-foreground">
                Reception:{" "}
                <span className="font-mono">reception@clinic.com</span> /{" "}
                <span className="font-mono">reception123</span>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()}. Built with ❤ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
