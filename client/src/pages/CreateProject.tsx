import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Film, Loader2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function CreateProject() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    sourceTitle: "",
    sourceType: "book" as "book" | "script",
    sourceText: "",
    format: "film_16x9" as "film_16x9" | "series_16x9" | "vertical_9x16",
    stylePreset: "rocky_70s_grit" as "rocky_70s_grit" | "a24_drama" | "pixar_like" | "anime_noir",
    castingOverrideMain: "",
    targetRuntimeMinutes: 10,
  });

  const createProject = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      toast.success("Project created! Generation started...");
      setLocation(`/project/${project.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.sourceText.length < 100) {
      toast.error("Source text must be at least 100 characters");
      return;
    }
    
    createProject.mutate(formData);
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
            <Link href="/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <span className="text-sm text-gray-400">{user?.name}</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Create New Project</h1>
          <p className="text-gray-400">Transform your story into a cinematic film</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription className="text-gray-400">
                Provide your source material and creative preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Rocky: The Beginning"
                  value={formData.sourceTitle}
                  onChange={(e) => setFormData({ ...formData, sourceTitle: e.target.value })}
                  required
                  className="bg-gray-800 border-gray-700"
                />
              </div>

              {/* Source Type */}
              <div className="space-y-2">
                <Label htmlFor="sourceType">Source Type *</Label>
                <Select
                  value={formData.sourceType}
                  onValueChange={(value: "book" | "script") => setFormData({ ...formData, sourceType: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="book">Book</SelectItem>
                    <SelectItem value="script">Script</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Source Text */}
              <div className="space-y-2">
                <Label htmlFor="sourceText">Source Text * (minimum 100 characters)</Label>
                <Textarea
                  id="sourceText"
                  placeholder="Paste your book or script text here..."
                  value={formData.sourceText}
                  onChange={(e) => setFormData({ ...formData, sourceText: e.target.value })}
                  required
                  rows={12}
                  className="bg-gray-800 border-gray-700 font-mono text-sm"
                />
                <p className="text-sm text-gray-500">
                  {formData.sourceText.length} characters
                </p>
              </div>

              {/* Format */}
              <div className="space-y-2">
                <Label htmlFor="format">Output Format *</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value: any) => setFormData({ ...formData, format: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="film_16x9">Film (16:9 Horizontal)</SelectItem>
                    <SelectItem value="series_16x9">Series (16:9 Horizontal)</SelectItem>
                    <SelectItem value="vertical_9x16">Vertical (9:16 for Social)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Style Preset */}
              <div className="space-y-2">
                <Label htmlFor="stylePreset">Visual Style *</Label>
                <Select
                  value={formData.stylePreset}
                  onValueChange={(value: any) => setFormData({ ...formData, stylePreset: value })}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rocky_70s_grit">Rocky 70s Grit</SelectItem>
                    <SelectItem value="a24_drama">A24 Drama</SelectItem>
                    <SelectItem value="pixar_like">Pixar-Like</SelectItem>
                    <SelectItem value="anime_noir">Anime Noir</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  {formData.stylePreset === "rocky_70s_grit" && "Gritty realism with grainy film texture"}
                  {formData.stylePreset === "a24_drama" && "Modern indie with natural lighting"}
                  {formData.stylePreset === "pixar_like" && "Vibrant 3D animation style"}
                  {formData.stylePreset === "anime_noir" && "Japanese animation with high contrast"}
                </p>
              </div>

              {/* Target Runtime */}
              <div className="space-y-2">
                <Label htmlFor="runtime">Target Runtime (minutes) *</Label>
                <Input
                  id="runtime"
                  type="number"
                  min={5}
                  max={30}
                  value={formData.targetRuntimeMinutes}
                  onChange={(e) => setFormData({ ...formData, targetRuntimeMinutes: parseInt(e.target.value) })}
                  required
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-sm text-gray-500">
                  MVP supports 5-30 minutes
                </p>
              </div>

              {/* Casting Override (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="casting">Main Character Casting Override (Optional)</Label>
                <Input
                  id="casting"
                  placeholder="e.g., Dwayne Johnson as Rocky"
                  value={formData.castingOverrideMain}
                  onChange={(e) => setFormData({ ...formData, castingOverrideMain: e.target.value })}
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-sm text-gray-500">
                  Specify a different actor for the main character
                </p>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                <div className="text-sm text-gray-400">
                  <p>Estimated generation time: 2-4 hours</p>
                  <p>Estimated cost: $18-$33</p>
                </div>
                <Button
                  type="submit"
                  disabled={createProject.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {createProject.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Project"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
