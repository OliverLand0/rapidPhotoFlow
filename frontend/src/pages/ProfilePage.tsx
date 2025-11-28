import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Calendar, LogOut, Save, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile } from "../lib/api/authApi";
import { getAccessToken } from "../lib/auth/cognitoConfig";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser, isConfigured } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setIsSaving(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Not authenticated");
        setIsSaving(false);
        return;
      }

      await updateProfile({ username }, token);
      await refreshUser();
      setSuccess(true);
      setIsEditing(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Authentication is not configured.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              User not found. Please sign in again.
            </p>
            <Button onClick={() => navigate("/login")} className="mt-4">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={user.email}
                  className="flex-1 px-4 py-2 border rounded-md bg-muted cursor-not-allowed"
                  disabled
                />
                {user.emailVerified && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Username
              </label>
              {isEditing ? (
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isSaving}
                  minLength={3}
                  maxLength={50}
                />
              ) : (
                <input
                  type="text"
                  value={user.username}
                  className="w-full px-4 py-2 border rounded-md bg-muted cursor-not-allowed"
                  disabled
                />
              )}
            </div>

            {/* User ID (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                User ID
              </label>
              <input
                type="text"
                value={user.sub}
                className="w-full px-4 py-2 border rounded-md bg-muted cursor-not-allowed text-xs font-mono"
                disabled
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-4">
              {isEditing ? (
                <>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setUsername(user.username);
                      setError(null);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </form>

          <hr className="my-6" />

          {/* Logout */}
          <div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
