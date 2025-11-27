import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Upload, Grid3X3, Info } from "lucide-react";
import { cn } from "../lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { StatusSummaryBar } from "./shared/StatusSummaryBar";
import { usePhotos } from "../lib/PhotosContext";
import { AboutDialog } from "./AboutDialog";

const navItems = [
  { to: "/", icon: Upload, label: "Upload" },
  { to: "/review", icon: Grid3X3, label: "Review" },
];

export function Layout() {
  const { photos, lastUpdated } = usePhotos();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left side: Logo + Nav */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setAboutOpen(true)}
              className="font-semibold text-lg hover:text-primary transition-colors flex items-center gap-2"
            >
              RapidPhotoFlow
              <Info className="h-4 w-4 text-muted-foreground" />
            </button>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
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
          {/* Right side: Theme Toggle */}
          <div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* About Dialog */}
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* Status Summary Bar */}
      <StatusSummaryBar photos={photos} lastUpdated={lastUpdated} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
