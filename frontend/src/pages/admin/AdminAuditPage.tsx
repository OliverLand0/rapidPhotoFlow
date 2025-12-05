import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Activity,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { adminClient } from "../../lib/api/client";
import type { AdminAuditLog } from "../../lib/api/types";

function getActionBadgeVariant(
  actionType: string
): "default" | "secondary" | "destructive" | "outline" {
  if (actionType.includes("SUSPEND")) return "destructive";
  if (actionType.includes("REACTIVATE")) return "default";
  if (actionType.includes("UPDATE")) return "secondary";
  return "outline";
}

export function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const pageSize = 50;

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        const response = await adminClient.getAuditLog(page, pageSize);
        setLogs(response.logs);
        setTotalCount(response.totalCount);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit log");
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, [page]);

  const filteredLogs = logs.filter(
    (log) =>
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.targetUserEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false) ||
      (log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false)
  );

  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading && logs.length === 0) {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ClipboardList className="h-8 w-8" />
          Audit Log
        </h1>
        <p className="text-muted-foreground">
          Track all admin actions in the system
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions, users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">{totalCount} total entries</Badge>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Admin</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Target User
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="px-4 py-3 text-sm">
                  <div className="space-y-1">
                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div className="text-muted-foreground text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getActionBadgeVariant(log.actionType)}>
                    {log.actionType.replace(/_/g, " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{log.adminEmail}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {log.targetUserId ? (
                    <Link
                      to={`/admin/users/${log.targetUserId}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {log.targetUserEmail || "Unknown User"}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-muted-foreground max-w-xs truncate">
                    {log.description || "-"}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLogs.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {searchQuery
              ? "No audit logs found matching your search"
              : "No audit logs recorded yet"}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
