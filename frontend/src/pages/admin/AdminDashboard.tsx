import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Image,
  HardDrive,
  TrendingUp,
  Calendar,
  Clock,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { adminClient } from "../../lib/api/client";
import type { AdminDashboardStats } from "../../lib/api/types";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await adminClient.getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-destructive font-medium">Error: {error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and statistics
        </p>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0
                ? `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% of total`
                : "No users yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <Users className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.suspendedUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Suspended accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Photo & Storage Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPhotos}</div>
            <p className="text-xs text-muted-foreground">
              Photos in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(stats.totalStorageBytes)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total storage consumption
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Activity */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Upload Activity</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.photosUploadedToday}</div>
              <p className="text-xs text-muted-foreground">Photos uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.photosUploadedThisWeek}</div>
              <p className="text-xs text-muted-foreground">Photos uploaded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.photosUploadedThisMonth}</div>
              <p className="text-xs text-muted-foreground">Photos uploaded</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Link to="/admin/users">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-base">Manage Users</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    View and manage user accounts
                  </p>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/admin/audit">
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-base">Audit Log</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    View admin action history
                  </p>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
