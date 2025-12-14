import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Film, Plus, Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: projects, isLoading } = trpc.projects.list.useQuery();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      NEW: { label: "New", variant: "secondary", icon: Clock },
      INGESTION_STARTED: { label: "Parsing", variant: "default", icon: Loader2 },
      PARSING_COMPLETE: { label: "Parsed", variant: "default", icon: CheckCircle2 },
      PLANNING_COMPLETE: { label: "Planned", variant: "default", icon: CheckCircle2 },
      IMAGE_GEN_IN_PROGRESS: { label: "Generating Images", variant: "default", icon: Loader2 },
      IMAGES_COMPLETE: { label: "Images Done", variant: "default", icon: CheckCircle2 },
      VIDEO_GEN_IN_PROGRESS: { label: "Generating Videos", variant: "default", icon: Loader2 },
      VIDEOS_COMPLETE: { label: "Videos Done", variant: "default", icon: CheckCircle2 },
      AUDIO_GEN_IN_PROGRESS: { label: "Generating Audio", variant: "default", icon: Loader2 },
      AUDIO_COMPLETE: { label: "Audio Done", variant: "default", icon: CheckCircle2 },
      ASSEMBLY_IN_PROGRESS: { label: "Assembling", variant: "default", icon: Loader2 },
      DELIVERED: { label: "Complete", variant: "default", icon: CheckCircle2 },
      NEEDS_REVIEW: { label: "Needs Review", variant: "outline", icon: AlertCircle },
      FAILED: { label: "Failed", variant: "destructive", icon: AlertCircle },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" as const, icon: Clock };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`w-3 h-3 ${config.icon === Loader2 ? 'animate-spin' : ''}`} />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Film className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                StudioZero
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user?.name}</span>
            <Link href="/create">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Projects</h1>
          <p className="text-gray-400">Manage and track your film generation projects</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="bg-gray-900/50 border-gray-800 hover:border-purple-500/50 transition-colors cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl line-clamp-1">{project.sourceTitle}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardDescription className="text-gray-400 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{project.format.replace(/_/g, " ")}</span>
                        <span>{project.targetRuntimeMinutes} min</span>
                      </div>
                      <div className="text-sm capitalize">{project.stylePreset.replace(/_/g, " ")}</div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatDate(project.createdAt)}</span>
                      {project.totalCost > 0 && (
                        <span className="text-purple-400">{formatCost(project.totalCost)}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-12 text-center space-y-4">
              <Film className="w-16 h-16 text-gray-600 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No projects yet</h3>
                <p className="text-gray-400">Create your first film to get started</p>
              </div>
              <Link href="/create">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
