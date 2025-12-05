import { useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import { Upload, Grid3X3, Info, User, LogIn, Share2, Shield } from "lucide-react";
import { cn } from "../lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { StatusSummaryBar } from "./shared/StatusSummaryBar";
import { TaggingProgressPanel } from "./shared/TaggingProgressPanel";
import { usePhotos } from "../lib/PhotosContext";
import { useAuth } from "../contexts/AuthContext";
import { AboutDialog } from "./AboutDialog";

const navItems = [
  { to: "/", icon: Upload, label: "Upload" },
  { to: "/review", icon: Grid3X3, label: "Review" },
  { to: "/shares", icon: Share2, label: "Shares" },
];

export function Layout() {
  const { photos, lastUpdated, uploadingCount } = usePhotos();
  const { user, isAuthenticated, isConfigured, isAdmin } = useAuth();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {/* Left side: Logo + Nav */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5">
              <Link
                to="/"
                className="font-semibold text-lg hover:text-primary transition-colors"
              >
                RapidPhotoFlow
              </Link>
              <button
                onClick={() => setAboutOpen(true)}
                className="p-1 rounded-md hover:bg-muted transition-colors"
                aria-label="About RapidPhotoFlow"
              >
                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
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
          {/* Right side: Admin + User + Theme Toggle */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            {isConfigured && (
              isAuthenticated && user ? (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-24 truncate">{user.username}</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* About Dialog */}
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* Status Summary Bar */}
      <StatusSummaryBar photos={photos} lastUpdated={lastUpdated} uploadingCount={uploadingCount} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <span>Build {__BUILD_VERSION__}</span>
          <span className="mx-2">|</span>
          <span>Last deployed: {new Date(__BUILD_DATE__).toLocaleString()}</span>
          {__GIT_BRANCH__ && __GIT_BRANCH__ !== 'main' && __GIT_BRANCH__ !== 'master' && (
            <>
              <span className="mx-2">|</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Branch: {__GIT_BRANCH__}
              </span>
            </>
          )}
        </div>
      </footer>

      {/* Global AI Tagging Progress Panel */}
      <TaggingProgressPanel />
    </div>
  );
}
