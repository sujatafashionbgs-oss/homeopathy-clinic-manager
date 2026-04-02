import { Badge } from "@/components/ui/badge";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Calendar,
  FlaskConical,
  Landmark,
  LayoutDashboard,
  Leaf,
  MessageCircle,
  Receipt,
  Settings,
  ShoppingCart,
  TrendingDown,
  Users,
} from "lucide-react";
import { useLowStockMedicines } from "../../hooks/useQueries";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/patients", icon: Users, label: "Patients" },
  { to: "/visits", icon: Calendar, label: "Visits" },
  { to: "/billing", icon: Receipt, label: "Billing" },
  { to: "/medicines", icon: FlaskConical, label: "Medicines" },
  { to: "/medicine-master", icon: BookOpen, label: "Med Master" },
  { to: "/vendors", icon: ShoppingCart, label: "Vendors" },
  { to: "/expenses", icon: TrendingDown, label: "Expenses" },
  { to: "/bank-import", icon: Landmark, label: "Bank Import" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
  { to: "/whatsapp", icon: MessageCircle, label: "WhatsApp" },
];

export default function Sidebar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { data: lowStock } = useLowStockMedicines();
  const lowStockCount = lowStock?.length ?? 0;

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-60 flex flex-col z-40 no-print"
      style={{ backgroundColor: "oklch(0.42 0.12 152)" }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-5 border-b shrink-0"
        style={{ borderColor: "oklch(0.35 0.09 152)" }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "oklch(0.55 0.14 152)" }}
        >
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-heading font-semibold text-sm leading-tight">
            Homeo Clinic
          </p>
          <p className="text-white/60 text-xs">Manager</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === "/" ? currentPath === "/" : currentPath.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              data-ocid={`nav.${label.toLowerCase().replace(/ /g, "-")}.link`}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? "text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
              style={isActive ? { backgroundColor: "oklch(0.35 0.1 152)" } : {}}
            >
              <div className="flex items-center gap-3">
                <Icon size={17} />
                <span className="text-sm font-medium">{label}</span>
              </div>
              {label === "Medicines" && lowStockCount > 0 && (
                <Badge className="bg-amber-400 text-amber-900 text-xs px-1.5 py-0 h-5">
                  {lowStockCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-5 py-4 border-t shrink-0"
        style={{ borderColor: "oklch(0.35 0.09 152)" }}
      >
        <p className="text-white/40 text-xs text-center">
          Shift+N &bull; Shift+V &bull; Shift+B
        </p>
      </div>
    </aside>
  );
}
