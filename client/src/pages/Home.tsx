import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Film, Sparkles, Zap, Shield, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Film className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              StudioZero
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <span className="text-sm text-gray-400">{user?.name}</span>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <a href={getLoginUrl()}>Sign In</a>
                </Button>
                <Button asChild>
                  <a href={getLoginUrl()}>Get Started</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Agentic AI Film Studio</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold leading-tight">
            Transform Books Into
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Cinematic Films
            </span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload a book or script and receive a fully produced, cinematic-quality film with strict visual and narrative continuity—powered by autonomous AI agents.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href="/create">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6">
                  Create Your Film
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-6" asChild>
                <a href={getLoginUrl()}>
                  Start Creating
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
            )}
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-gray-700 hover:bg-gray-800">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why StudioZero?</h2>
          <p className="text-gray-400 text-lg">Traditional filmmaking meets autonomous AI orchestration</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle>Autonomous Generation</CardTitle>
              <CardDescription className="text-gray-400">
                Multi-agent AI system handles everything from scene planning to final render
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-pink-500/10 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-pink-400" />
              </div>
              <CardTitle>Visual Continuity</CardTitle>
              <CardDescription className="text-gray-400">
                Strict identity locking and consistency validation across every scene
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                <Film className="w-6 h-6 text-blue-400" />
              </div>
              <CardTitle>Cinematic Quality</CardTitle>
              <CardDescription className="text-gray-400">
                Studio-grade output with professional cinematography and pacing
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Style Presets */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Choose Your Style</h2>
          <p className="text-gray-400 text-lg">Select from cinematic presets or create your own</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              name: "Rocky 70s Grit",
              description: "Gritty realism with grainy film texture",
              gradient: "from-amber-900 to-orange-800"
            },
            {
              name: "A24 Drama",
              description: "Modern indie with natural lighting",
              gradient: "from-slate-700 to-slate-900"
            },
            {
              name: "Pixar-Like",
              description: "Vibrant 3D animation style",
              gradient: "from-blue-500 to-purple-600"
            },
            {
              name: "Anime Noir",
              description: "Japanese animation with high contrast",
              gradient: "from-red-900 to-black"
            }
          ].map((style, i) => (
            <Card key={i} className="bg-gray-900/50 border-gray-800 overflow-hidden group cursor-pointer hover:border-purple-500/50 transition-colors">
              <div className={`h-32 bg-gradient-to-br ${style.gradient}`} />
              <CardHeader>
                <CardTitle className="text-lg">{style.name}</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  {style.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 text-lg">From book to film in four simple steps</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "1", title: "Upload", description: "Paste your book or script text", icon: BookOpen },
            { step: "2", title: "Configure", description: "Choose style, format, and runtime", icon: Sparkles },
            { step: "3", title: "Generate", description: "AI agents create your film autonomously", icon: Zap },
            { step: "4", title: "Download", description: "Receive your cinematic production", icon: Film }
          ].map((item, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border-2 border-purple-500 flex items-center justify-center mx-auto">
                <item.icon className="w-8 h-8 text-purple-400" />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-purple-400 font-semibold">Step {item.step}</div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-24">
        <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/20">
          <CardContent className="p-12 text-center space-y-6">
            <h2 className="text-4xl font-bold">Ready to Create Your Film?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join the future of filmmaking. Transform your stories into cinematic experiences with AI.
            </p>
            {isAuthenticated ? (
              <Link href="/create">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6">
                  Start Your Project
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 py-6" asChild>
                <a href={getLoginUrl()}>
                  Get Started Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black/50">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400 text-sm">
          <p>© 2024 StudioZero. Powered by autonomous AI agents.</p>
        </div>
      </footer>
    </div>
  );
}
