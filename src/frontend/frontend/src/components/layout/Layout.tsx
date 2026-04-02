import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import Sidebar from "./Sidebar";

export default function Layout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "N") {
        e.preventDefault();
        navigate({ to: "/patients" });
        setTimeout(
          () => window.dispatchEvent(new CustomEvent("shortcut:new-patient")),
          100,
        );
      }
      if (e.shiftKey && e.key === "V") {
        e.preventDefault();
        navigate({ to: "/visits" });
        setTimeout(
          () => window.dispatchEvent(new CustomEvent("shortcut:new-visit")),
          100,
        );
      }
      if (e.shiftKey && e.key === "B") {
        e.preventDefault();
        navigate({ to: "/billing" });
        setTimeout(
          () => window.dispatchEvent(new CustomEvent("shortcut:new-bill")),
          100,
        );
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-border flex items-center justify-end px-6 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground leading-tight">
                {user?.name}
              </p>
              <Badge
                className="text-xs px-1.5 py-0 h-4"
                style={
                  user?.role === "Admin"
                    ? { background: "oklch(0.42 0.12 152)", color: "white" }
                    : { background: "oklch(0.7 0.1 200)", color: "white" }
                }
              >
                {user?.role}
              </Badge>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarFallback
                className="text-white text-xs font-semibold"
                style={{ background: "oklch(0.42 0.12 152)" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              data-ocid="layout.logout_button"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto no-print">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
