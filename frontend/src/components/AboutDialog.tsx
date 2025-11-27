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
  Play,
} from "lucide-react";

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AboutDialog({ open, onClose }: AboutDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader onClose={onClose}>About RapidPhotoFlow</DialogHeader>
      <DialogContent className="space-y-6">
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

        {/* Why This Exists */}
        <section>
          <h3 className="font-semibold text-base mb-2">Why This Exists</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Over the next 900 days, more will change in engineering than the
            last 20 years combined. AI is rewriting the rules. The developers
            who thrive will be full-stack creators, architectural thinkers,
            AI-accelerated builders, and creative problem solvers.
          </p>
        </section>

        {/* Features */}
        <section>
          <h3 className="font-semibold text-base mb-3">Features</h3>
          <div className="grid gap-3">
            <FeatureItem
              icon={Upload}
              title="Multi-Photo Upload"
              description="Upload multiple photos concurrently with drag-and-drop support and automatic image optimization"
            />
            <FeatureItem
              icon={Cpu}
              title="Async Processing"
              description="Simulated async processing pipeline with real-time status updates and event logging"
            />
            <FeatureItem
              icon={Grid3X3}
              title="Photo Gallery"
              description="Visual gallery with filtering, sorting, and bulk selection capabilities"
            />
            <FeatureItem
              icon={CheckCircle}
              title="Review Workflow"
              description="Approve or reject processed photos with quick actions and keyboard shortcuts"
            />
            <FeatureItem
              icon={RefreshCw}
              title="Retry Failed Photos"
              description="Retry failed photos for reprocessing with a single click"
            />
            <FeatureItem
              icon={Pause}
              title="Processing Control"
              description="Pause and resume the processing pipeline on demand"
            />
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h3 className="font-semibold text-base mb-2">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">React</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">Vite</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
            <Badge variant="secondary">Spring Boot</Badge>
            <Badge variant="secondary">Java</Badge>
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
