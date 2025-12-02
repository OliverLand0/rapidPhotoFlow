import { NavLink, Link, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { cn } from "../lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../contexts/AuthContext";

const adminNavItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/audit", icon: ClipboardList, label: "Audit Log" },
];

export function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left side: Logo + Admin badge + Nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Link
                to="/admin"
                className="font-semibold text-lg hover:text-primary transition-colors flex items-center gap-2"
              >
                <Shield className="h-5 w-5 text-primary" />
                Admin Panel
              </Link>
            </div>
            <nav className="flex items-center gap-1">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
          {/* Right side: Back to app + User + Theme Toggle */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to App</span>
            </Link>
            {user && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <span className="hidden sm:inline max-w-24 truncate">
                  {user.username}
                </span>
              </div>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <span>Admin Panel</span>
          <span className="mx-2">|</span>
          <span>RapidPhotoFlow</span>
        </div>
      </footer>
    </div>
  );
}
