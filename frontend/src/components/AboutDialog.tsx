import { Dialog, DialogHeader, DialogContent } from "./ui/dialog";
import { Badge } from "./ui/badge";
import {
  Upload,
  Cpu,
  Grid3X3,
  CheckCircle,
  XCircle,
  RefreshCw,
  Pause,
  Search,
  Tag,
  Keyboard,
  Sparkles,
  Copy,
  BookmarkCheck,
  Moon,
  Zap,
  History,
} from "lucide-react";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>About RapidPhotoFlow</DialogHeader>
      <DialogContent className="space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Project Overview */}
        <section>
          <h3 className="font-semibold text-base mb-2">Project Overview</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            RapidPhotoFlow is a lightweight photo upload, processing, and review
            workflow application built for the TeamFront AI Hackathon (November
            2025). This project demonstrates AI-first engineering principles,
            where the entire codebase was generated using AI tools.
          </p>
        </section>

        {/* Features */}
        <section>
          <h3 className="font-semibold text-base mb-3">Features</h3>
          <div className="grid gap-3">
            <FeatureItem
              icon={Upload}
              title="Multi-Photo Upload"
              description="Drag-and-drop upload with automatic image compression and batch processing (30 files at a time)"
            />
            <FeatureItem
              icon={Cpu}
              title="Async Processing Pipeline"
              description="Simulated async processing with real-time status updates and configurable processing speed"
            />
            <FeatureItem
              icon={Pause}
              title="Processing Control"
              description="Pause and resume the processing pipeline on demand"
            />
            <FeatureItem
              icon={Grid3X3}
              title="Photo Gallery"
              description="Visual gallery with status-based tabs, pagination, and thumbnail previews"
            />
            <FeatureItem
              icon={Search}
              title="Search & Filter"
              description="Search by filename or tag with autocomplete suggestions and multi-tag filtering"
            />
            <FeatureItem
              icon={Tag}
              title="Photo Tagging"
              description="Add, edit, and remove tags on individual photos for easy organization"
            />
            <FeatureItem
              icon={Sparkles}
              title="AI Auto-Tagging"
              description="Automatic tag generation using OpenAI GPT-4o-mini vision API (optional, disabled by default)"
            />
            <FeatureItem
              icon={CheckCircle}
              title="Review Workflow"
              description="Approve or reject processed photos with quick actions and visual feedback"
            />
            <FeatureItem
              icon={RefreshCw}
              title="Retry Failed Photos"
              description="Retry failed photos for reprocessing with a single click"
            />
            <FeatureItem
              icon={XCircle}
              title="Bulk Actions"
              description="Select multiple photos and perform bulk approve, reject, or retry operations"
            />
            <FeatureItem
              icon={Keyboard}
              title="Keyboard Shortcuts"
              description="Full keyboard navigation: J/K to navigate, A to approve, R to reject, Space to select"
            />
            <FeatureItem
              icon={BookmarkCheck}
              title="Saved Views"
              description="Save custom filter combinations as views for quick access to common workflows"
            />
            <FeatureItem
              icon={Copy}
              title="Duplicate Detection"
              description="Automatically detect and remove duplicate photos based on file hash"
            />
            <FeatureItem
              icon={History}
              title="Event Log"
              description="Real-time activity feed showing all photo events with clickable navigation"
            />
            <FeatureItem
              icon={Zap}
              title="Status Dashboard"
              description="Live status counts with clickable navigation to filtered gallery views"
            />
            <FeatureItem
              icon={Moon}
              title="Dark Mode"
              description="Full dark mode support with system preference detection"
            />
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h3 className="font-semibold text-base mb-2">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">React 19</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">Vite</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
            <Badge variant="secondary">Spring Boot</Badge>
            <Badge variant="secondary">Java 21</Badge>
            <Badge variant="secondary">OpenAI API</Badge>
          </div>
        </section>

        {/* Footer */}
        <section className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Built with AI assistance for the TeamFront AI Hackathon
          </p>
        </section>
      </DialogContent>
    </Dialog>
  );
}

interface FeatureItemProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureItem({ icon: Icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
}
