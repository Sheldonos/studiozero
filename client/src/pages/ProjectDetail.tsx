import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Film, Loader2, ArrowLeft, Download, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Link, useParams } from "wouter";
import { useEffect } from "react";

export default function ProjectDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const projectId = parseInt(id || "0");

  const { data, isLoading, refetch } = trpc.projects.getDetails.useQuery({ id: projectId });

  // Auto-refresh every 5 seconds if project is not complete
  useEffect(() => {
    if (!data?.project) return;
    
    const isProcessing = !["DELIVERED", "FAILED", "NEEDS_REVIEW"].includes(data.project.status);
    
    if (isProcessing) {
      const interval = setInterval(() => {
        refetch();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [data?.project?.status, refetch]);

  const getProgress = (status: string): number => {
    const progressMap: Record<string, number> = {
      NEW: 0,
      INGESTION_STARTED: 10,
      PARSING_COMPLETE: 20,
      PLANNING_COMPLETE: 30,
      IMAGE_GEN_IN_PROGRESS: 50,
      IMAGES_COMPLETE: 60,
      VIDEO_GEN_IN_PROGRESS: 75,
      VIDEOS_COMPLETE: 85,
      AUDIO_GEN_IN_PROGRESS: 90,
      AUDIO_COMPLETE: 95,
      ASSEMBLY_IN_PROGRESS: 98,
      DELIVERED: 100,
      FAILED: 0,
      NEEDS_REVIEW: 0,
    };
    return progressMap[status] || 0;
  };

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Project not found</h2>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { project, storyGraph, scenes, stats } = data;
  const progress = getProgress(project.status);
  const isComplete = project.status === "DELIVERED";
  const isFailed = project.status === "FAILED" || project.status === "NEEDS_REVIEW";

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
            <Link href="/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <span className="text-sm text-gray-400">{user?.name}</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{project.sourceTitle}</h1>
              <div className="flex items-center gap-4 text-gray-400">
                <span className="capitalize">{project.format.replace(/_/g, " ")}</span>
                <span>•</span>
                <span className="capitalize">{project.stylePreset.replace(/_/g, " ")}</span>
                <span>•</span>
                <span>{project.targetRuntimeMinutes} minutes</span>
              </div>
            </div>
            {isComplete && project.finalRenderUrl && (
              <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                <a href={project.finalRenderUrl} download>
                  <Download className="w-4 h-4 mr-2" />
                  Download Film
                </a>
              </Button>
            )}
          </div>

          {/* Progress */}
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : isFailed ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    )}
                    <span className="font-semibold">
                      {project.status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">{progress}% Complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">Scenes</CardDescription>
              <CardTitle className="text-3xl">{stats.totalScenes}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">Shots</CardDescription>
              <CardTitle className="text-3xl">{stats.totalShots}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">Completed</CardDescription>
              <CardTitle className="text-3xl">{stats.completedShots}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader className="pb-3">
              <CardDescription className="text-gray-400">Cost</CardDescription>
              <CardTitle className="text-3xl">{formatCost(stats.totalCost)}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Story Graph */}
        {storyGraph && (
          <Card className="bg-gray-900/50 border-gray-800 mb-8">
            <CardHeader>
              <CardTitle>Story Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Characters */}
              <div>
                <h3 className="font-semibold mb-3">Characters</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {storyGraph.characters?.map((char, i) => (
                    <Card key={i} className="bg-gray-800/50 border-gray-700">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{char.name}</CardTitle>
                        <CardDescription className="text-xs text-gray-400">
                          {char.role}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <h3 className="font-semibold mb-3">Locations</h3>
                <div className="flex flex-wrap gap-2">
                  {storyGraph.locations?.map((loc, i) => (
                    <Badge key={i} variant="secondary">{loc}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scenes */}
        {scenes && scenes.length > 0 && (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle>Scenes & Shots</CardTitle>
              <CardDescription className="text-gray-400">
                {stats.completedShots} of {stats.totalShots} shots completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {scenes.map((scene) => (
                <div key={scene.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{scene.sceneId}: {scene.sceneSummary}</h3>
                      <p className="text-sm text-gray-400">
                        {scene.location} • {scene.emotion}
                      </p>
                    </div>
                    <Badge variant="secondary">{scene.shots.length} shots</Badge>
                  </div>
                  
                  {/* Shots Grid */}
                  <div className="grid md:grid-cols-4 gap-3">
                    {scene.shots.map((shot) => (
                      <Card key={shot.id} className="bg-gray-800/50 border-gray-700">
                        <CardContent className="p-3 space-y-2">
                          {shot.imageUrl ? (
                            <img 
                              src={shot.imageUrl} 
                              alt={shot.shotId} 
                              className="w-full aspect-video object-cover rounded"
                            />
                          ) : (
                            <div className="w-full aspect-video bg-gray-700 rounded flex items-center justify-center">
                              {shot.status === "IMAGE_GENERATING" ? (
                                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                              ) : (
                                <Clock className="w-6 h-6 text-gray-500" />
                              )}
                            </div>
                          )}
                          <div className="text-xs">
                            <div className="font-semibold">{shot.shotId}</div>
                            <div className="text-gray-400 capitalize">{shot.shotType}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
