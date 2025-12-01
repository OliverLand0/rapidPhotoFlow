import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Shield,
  Image,
  HardDrive,
  Sparkles,
  Calendar,
  Clock,
  Save,
  Activity,
  History,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { adminClient } from "../../lib/api/client";
import type {
  AdminUserDetail,
  AdminAuditLog,
  UserRole,
  UserStatus,
  UpdateUserSettingsRequest,
} from "../../lib/api/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formRole, setFormRole] = useState<UserRole>("USER");
  const [formStatus, setFormStatus] = useState<UserStatus>("ACTIVE");
  const [formMaxStorageGB, setFormMaxStorageGB] = useState("");
  const [formMaxPhotos, setFormMaxPhotos] = useState("");
  const [formAiTagging, setFormAiTagging] = useState(true);
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!userId) return;
      try {
        setLoading(true);
        const [userData, logs] = await Promise.all([
          adminClient.getUserDetail(userId),
          adminClient.getUserAuditLog(userId),
        ]);
        setUser(userData);
        setAuditLogs(logs);

        // Initialize form state
        setFormRole(userData.role);
        setFormStatus(userData.status);
        setFormMaxStorageGB(
          userData.maxStorageBytes
            ? String(Math.round(userData.maxStorageBytes / (1024 * 1024 * 1024)))
            : "10"
        );
        setFormMaxPhotos(
          userData.maxPhotos !== null ? String(userData.maxPhotos) : "10000"
        );
        setFormAiTagging(userData.aiTaggingEnabled ?? true);
        setFormNotes(userData.accountNotes || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId]);

  async function handleSave() {
    if (!userId) return;
    try {
      setSaving(true);
      const request: UpdateUserSettingsRequest = {
        role: formRole,
        status: formStatus,
        maxStorageBytes: parseInt(formMaxStorageGB) * 1024 * 1024 * 1024,
        maxPhotos: parseInt(formMaxPhotos),
        aiTaggingEnabled: formAiTagging,
        accountNotes: formNotes || undefined,
      };
      const updatedUser = await adminClient.updateUserSettings(userId, request);
      setUser(updatedUser);
      // Refresh audit log
      const logs = await adminClient.getUserAuditLog(userId);
      setAuditLogs(logs);
      alert("User settings saved successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive font-medium">
            Error: {error || "User not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/admin/users"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Users
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
            {user.role === "ADMIN" && <Shield className="h-3 w-3 mr-1" />}
            {user.role}
          </Badge>
          <Badge
            variant={
              user.status === "ACTIVE"
                ? "default"
                : user.status === "SUSPENDED"
                ? "destructive"
                : "secondary"
            }
          >
            {user.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Image className="h-4 w-4 text-muted-foreground" />
                Photos Uploaded
              </div>
              <span className="font-medium">
                {user.usageStats.totalPhotosUploaded}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                Storage Used
              </div>
              <span className="font-medium">
                {formatBytes(user.usageStats.totalStorageBytes)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                AI Tagging Events
              </div>
              <span className="font-medium">
                {user.usageStats.aiTaggingUsageCount}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Last Upload
              </div>
              <span className="font-medium">
                {user.usageStats.lastUploadAt
                  ? new Date(user.usageStats.lastUploadAt).toLocaleDateString()
                  : "Never"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Account Created
              </div>
              <span className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formRole}
                  onValueChange={(v) => setFormRole(v as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formStatus}
                  onValueChange={(v) => setFormStatus(v as UserStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Max Storage (GB)</Label>
                <Input
                  type="number"
                  value={formMaxStorageGB}
                  onChange={(e) => setFormMaxStorageGB(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Photos</Label>
                <Input
                  type="number"
                  value={formMaxPhotos}
                  onChange={(e) => setFormMaxPhotos(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>AI Tagging</Label>
              <Select
                value={formAiTagging ? "enabled" : "disabled"}
                onValueChange={(v) => setFormAiTagging(v === "enabled")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Enabled</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Account Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Internal notes about this account..."
                rows={3}
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No activity recorded for this user
            </p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.actionType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        by {log.adminEmail}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {log.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
