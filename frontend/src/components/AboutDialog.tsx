import { Dialog, DialogHeader, DialogContent } from "./ui/dialog";
import { Badge } from "./ui/badge";
import {
  Upload,
  Grid3X3,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Tag,
  Keyboard,
  Sparkles,
  Copy,
  BookmarkCheck,
  Moon,
  Zap,
  History,
  Shield,
  Cloud,
  Smartphone,
  Share2,
  FolderTree,
  Image,
  Users,
  ClipboardList,
  Lock,
  Eye,
  Download,
  LayoutDashboard,
  Camera,
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
            RapidPhotoFlow is a production-ready photo management platform with
            AI-powered tagging, review workflows, photo sharing, and admin controls.
            Built for the TeamFront AI Hackathon (November 2025), the entire codebase
            was generated using Claude Code, demonstrating AI-first engineering principles.
          </p>
        </section>

        {/* Core Features */}
        <section>
          <h3 className="font-semibold text-base mb-3">Core Features</h3>
          <div className="grid gap-3">
            <FeatureItem
              icon={Upload}
              title="Batch Photo Upload"
              description="Drag-and-drop with progress tracking, batch processing (30 files), and format conversion"
            />
            <FeatureItem
              icon={Camera}
              title="RAW & HEIC Support"
              description="Full support for camera RAW formats (CR2, NEF, DNG, ARW) and Apple HEIC with preview generation"
            />
            <FeatureItem
              icon={Sparkles}
              title="AI Auto-Tagging"
              description="GPT-4 Vision powered tagging with batch processing, smart scene detection, and cost optimization"
            />
            <FeatureItem
              icon={Grid3X3}
              title="Photo Gallery"
              description="Visual gallery with status tabs, pagination, full-screen preview, and keyboard navigation"
            />
            <FeatureItem
              icon={CheckCircle}
              title="Review Workflow"
              description="Approve, reject, or retry photos with individual and bulk actions"
            />
            <FeatureItem
              icon={FolderTree}
              title="Folder Organization"
              description="Hierarchical folder structure with drag-and-drop organization and breadcrumb navigation"
            />
            <FeatureItem
              icon={Image}
              title="Album Collections"
              description="Create albums to group photos with custom cover images and descriptions"
            />
          </div>
        </section>

        {/* Sharing Features */}
        <section>
          <h3 className="font-semibold text-base mb-3">Photo Sharing</h3>
          <div className="grid gap-3">
            <FeatureItem
              icon={Share2}
              title="Shareable Links"
              description="Generate public links for photos, albums, or folders with customizable access"
            />
            <FeatureItem
              icon={Lock}
              title="Access Controls"
              description="Password protection, expiration dates, and view limits for shared content"
            />
            <FeatureItem
              icon={Download}
              title="Download Options"
              description="Control whether recipients can download original files or view only"
            />
            <FeatureItem
              icon={Eye}
              title="Share Analytics"
              description="Track view counts, download counts, and last access timestamps"
            />
          </div>
        </section>

        {/* Search & Organization */}
        <section>
          <h3 className="font-semibold text-base mb-3">Search & Organization</h3>
          <div className="grid gap-3">
            <FeatureItem
              icon={Search}
              title="Advanced Search"
              description="Search by filename or tags with autocomplete and multi-tag filtering"
            />
            <FeatureItem
              icon={Tag}
              title="Smart Tagging"
              description="AI-generated and manual tags with easy add/remove interface"
            />
            <FeatureItem
              icon={BookmarkCheck}
              title="Saved Views"
              description="Save custom filter combinations for quick access to common workflows"
            />
            <FeatureItem
              icon={Copy}
              title="Duplicate Detection"
              description="Content-hash based duplicate removal to keep your library clean"
            />
          </div>
        </section>

        {/* Admin Features */}
        <section>
          <h3 className="font-semibold text-base mb-3">Admin Panel</h3>
          <div className="grid gap-3">
            <FeatureItem
              icon={LayoutDashboard}
              title="Admin Dashboard"
              description="System statistics, user counts, storage usage, and upload activity tracking"
            />
            <FeatureItem
              icon={Users}
              title="User Management"
              description="View all users, suspend/reactivate accounts, and manage AI tagging permissions"
            />
            <FeatureItem
              icon={ClipboardList}
              title="Audit Logging"
              description="Complete history of all admin actions with search and pagination"
            />
          </div>
        </section>

        {/* Power User Features */}
        <section>
          <h3 className="font-semibold text-base mb-3">Power User Features</h3>
          <div className="grid gap-3">
            <FeatureItem
              icon={Keyboard}
              title="Keyboard Shortcuts"
              description="J/K to navigate, A/R/D to approve/reject/delete, Space to select, ? for help"
            />
            <FeatureItem
              icon={XCircle}
              title="Bulk Actions"
              description="Select multiple photos for bulk approve, reject, delete, or AI tag operations"
            />
            <FeatureItem
              icon={RefreshCw}
              title="Retry Failed"
              description="Retry failed photos for reprocessing with a single click"
            />
            <FeatureItem
              icon={History}
              title="Event Log"
              description="Real-time activity feed showing all photo events with clickable navigation"
            />
          </div>
        </section>

        {/* Platform Features */}
        <section>
          <h3 className="font-semibold text-base mb-3">Platform</h3>
          <div className="grid gap-3">
            <FeatureItem
              icon={Shield}
              title="Secure Authentication"
              description="AWS Cognito with email verification, password reset, and JWT tokens"
            />
            <FeatureItem
              icon={Cloud}
              title="Cloud Native"
              description="AWS S3 storage, CloudFront CDN, ECS Fargate, and RDS PostgreSQL"
            />
            <FeatureItem
              icon={Smartphone}
              title="Responsive Design"
              description="Fully responsive interface optimized for phones, tablets, and desktops"
            />
            <FeatureItem
              icon={Moon}
              title="Dark Mode"
              description="Full dark mode support with automatic system preference detection"
            />
            <FeatureItem
              icon={Zap}
              title="Smart Polling"
              description="Adaptive data refresh that speeds up during processing and slows when stable"
            />
          </div>
        </section>

        {/* Tech Stack */}
        <section>
          <h3 className="font-semibold text-base mb-2">Tech Stack</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Frontend</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">React 19</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">Vite 7</Badge>
                <Badge variant="secondary">Tailwind CSS 4</Badge>
                <Badge variant="secondary">shadcn/ui</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Backend</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">Spring Boot 3.2</Badge>
                <Badge variant="secondary">Java 21</Badge>
                <Badge variant="secondary">PostgreSQL</Badge>
                <Badge variant="secondary">Spring Data JPA</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">AI Service</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">Node.js</Badge>
                <Badge variant="secondary">Express</Badge>
                <Badge variant="secondary">OpenAI GPT-4o-mini</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">AWS Infrastructure</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">ECS Fargate</Badge>
                <Badge variant="secondary">API Gateway</Badge>
                <Badge variant="secondary">S3</Badge>
                <Badge variant="secondary">CloudFront</Badge>
                <Badge variant="secondary">RDS</Badge>
                <Badge variant="secondary">Cognito</Badge>
                <Badge variant="secondary">Terraform</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Formats */}
        <section>
          <h3 className="font-semibold text-base mb-2">Supported Image Formats</h3>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Native Support</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">JPEG</Badge>
                <Badge variant="outline">PNG</Badge>
                <Badge variant="outline">GIF</Badge>
                <Badge variant="outline">WebP</Badge>
                <Badge variant="outline">BMP</Badge>
                <Badge variant="outline">SVG</Badge>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Extended Support (with preview)</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline">CR2</Badge>
                <Badge variant="outline">NEF</Badge>
                <Badge variant="outline">DNG</Badge>
                <Badge variant="outline">ARW</Badge>
                <Badge variant="outline">RAF</Badge>
                <Badge variant="outline">ORF</Badge>
                <Badge variant="outline">HEIC</Badge>
                <Badge variant="outline">HEIF</Badge>
                <Badge variant="outline">TIFF</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="pt-2 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Built entirely with Claude Code for the TeamFront AI Hackathon
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
