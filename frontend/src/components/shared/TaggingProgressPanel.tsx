import { Loader2, CheckCircle, AlertTriangle, XCircle, X, Sparkles } from "lucide-react";
import { Progress } from "../ui/progress";
import { useAIService, type TaggingSession } from "../../contexts/AIServiceContext";
import { formatRelativeTime } from "../../lib/utils";

function SessionCard({ session, onDismiss }: { session: TaggingSession; onDismiss: () => void }) {
  const isActive = session.status === 'in_progress';
  const hasFailed = session.failed > 0;

  return (
    <div className="p-3 border-b last:border-b-0 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isActive ? (
            <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
          ) : session.status === 'failed' ? (
            <XCircle className="h-3.5 w-3.5 text-red-500" />
          ) : hasFailed ? (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          )}
          <span className="text-xs font-medium">
            {isActive ? "Tagging in progress..." :
             session.status === 'failed' ? "Tagging failed" :
             `Tagged ${session.succeeded} photo${session.succeeded !== 1 ? 's' : ''}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(session.startedAt)}
          </span>
          <button
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Progress bar (only for active sessions) */}
      {isActive && (
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">
              {session.totalChunks > 1 ? `Batch ${session.currentChunk}/${session.totalChunks}` : "Progress"}
            </span>
            <span className="font-medium">
              {session.processed} / {session.total}
            </span>
          </div>
          <Progress
            value={(session.processed / session.total) * 100}
            className="h-1"
          />
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          <span className="font-medium">{session.succeeded}</span>
          <span className="text-muted-foreground">success</span>
        </div>
        {session.failed > 0 && (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <XCircle className="h-3 w-3" />
            <span className="font-medium">{session.failed}</span>
            <span className="text-muted-foreground">failed</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-muted-foreground ml-auto">
          <span>{session.total} total</span>
        </div>
      </div>
    </div>
  );
}

export function TaggingProgressPanel() {
  const { taggingSessions, dismissSession, clearTaggingSessions } = useAIService();

  if (taggingSessions.length === 0) return null;

  const hasActiveSessions = taggingSessions.some(s => s.status === 'in_progress');

  return (
    <div className="fixed bottom-4 left-4 z-50 w-80 bg-background border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          {hasActiveSessions ? (
            <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-amber-500" />
          )}
          <span className="font-medium text-sm">
            AI Tagging {hasActiveSessions ? "Active" : "History"}
          </span>
          <span className="text-xs text-muted-foreground">
            ({taggingSessions.length})
          </span>
        </div>
        <button
          onClick={clearTaggingSessions}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Sessions list (scrollable) */}
      <div className="max-h-64 overflow-y-auto">
        {taggingSessions.map(session => (
          <SessionCard
            key={session.id}
            session={session}
            onDismiss={() => dismissSession(session.id)}
          />
        ))}
      </div>
    </div>
  );
}
