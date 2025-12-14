import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Film, ArrowRight, Sparkles, Music, Video, Image } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const suggestions = [
    {
      icon: Music,
      title: "Integrate ElevenLabs API to generate dialogue and narration for the film's audio track.",
      color: "text-orange-500"
    },
    {
      icon: Video,
      title: "Implement an assembly system using FFmpeg to combine video shots and audio into a final MP4 file.",
      color: "text-blue-500"
    },
    {
      icon: Image,
      title: "Add a feature to let users upload their own custom visual assets for the AI to use in film generation.",
      color: "text-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-blue-50 to-orange-100">
      {/* Minimal Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 py-6">
        <div className="container mx-auto flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Film className="w-6 h-6 text-gray-800" />
            <span className="text-xl font-semibold text-gray-900">StudioZero</span>
          </div>
          {isAuthenticated && (
            <Link href="/dashboard">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                Dashboard
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 pt-32 pb-16">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Hero Section */}
          <div className="space-y-6">
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 leading-tight">
              Build powerful films fast.
              <br />
              No code needed.
            </h1>
            <p className="text-xl text-gray-600">
              Your vision, without limits.
            </p>
          </div>

          {/* Main Input Card */}
          <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg p-8">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <textarea
                  placeholder="Describe your film idea or paste your book/script text..."
                  className="w-full min-h-[100px] bg-transparent border-none outline-none resize-none text-gray-900 placeholder:text-gray-400 text-lg"
                  defaultValue=""
                />
              </div>
              {isAuthenticated ? (
                <Link href="/create">
                  <Button 
                    size="lg" 
                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-full shadow-md"
                  >
                    Build now <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 rounded-full shadow-md"
                  onClick={() => window.location.href = '/api/oauth/login'}
                >
                  Build now <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              )}
            </div>
          </Card>

          {/* Suggestions Section */}
          <div className="space-y-6">
            <p className="text-gray-600 text-lg">
              Not sure where to start? Try one of these:
            </p>
            
            <div className="grid gap-4">
              {suggestions.map((suggestion, index) => (
                <Card 
                  key={index}
                  className="bg-white/60 backdrop-blur-sm border-gray-200 hover:bg-white/80 transition-all cursor-pointer group p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <suggestion.icon className={`w-6 h-6 ${suggestion.color}`} />
                    </div>
                    <p className="text-left text-gray-700 text-base flex-1">
                      {suggestion.title}
                    </p>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Start Templates */}
          <div className="pt-8">
            <p className="text-gray-500 text-sm mb-4">Quick start templates:</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Sparkles, label: "Rocky 70s Grit" },
                { icon: Film, label: "A24 Drama" },
                { icon: Video, label: "Pixar-Like" },
                { icon: Music, label: "Anime Noir" }
              ].map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="bg-white/60 backdrop-blur-sm border-gray-300 hover:bg-white/80 text-gray-700 rounded-full"
                >
                  <template.icon className="w-4 h-4 mr-2" />
                  {template.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
