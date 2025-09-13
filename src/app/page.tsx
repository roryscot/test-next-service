import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Mic, Users, Zap, ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <AppShell title="AI-Powered Interview Platform">
      <div className="space-y-20">
        {/* Hero Section */}
        <div className="animate-fade-in space-y-8 text-center">
          <div className="space-y-4">
            <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Interviews
            </div>
            <h1 className="from-fg to-fg-secondary bg-gradient-to-r bg-clip-text text-5xl leading-tight font-extrabold text-transparent">
              Conduct Professional Interviews
              <br />
              <span className="text-primary">with AI Agents</span>
            </h1>
            <p className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed">
              Create custom interview prompts, engage in real-time voice
              conversations, and leverage the power of OpenAI and LiveKit for
              seamless AI-driven interviews.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/questionnaire-prompt-builder">
              <Button size="lg" icon={<FileText />} iconPosition="left">
                Build Prompts
              </Button>
            </Link>
            <Link href="/call">
              <Button
                size="lg"
                variant="outline"
                icon={<Mic />}
                iconPosition="left"
              >
                Start Interview
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card hover className="animate-slide-up text-center">
            <CardContent className="pt-6">
              <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <FileText className="text-primary h-6 w-6" />
              </div>
              <CardTitle className="mb-2 text-lg">Smart Prompts</CardTitle>
              <CardDescription>
                Create intelligent interview instructions that adapt to
                different scenarios
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            hover
            className="animate-slide-up text-center"
            style={{ animationDelay: "100ms" }}
          >
            <CardContent className="pt-6">
              <div className="bg-accent/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <Mic className="text-accent h-6 w-6" />
              </div>
              <CardTitle className="mb-2 text-lg">Real-time Voice</CardTitle>
              <CardDescription>
                Natural voice conversations with AI agents powered by LiveKit
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            hover
            className="animate-slide-up text-center"
            style={{ animationDelay: "200ms" }}
          >
            <CardContent className="pt-6">
              <div className="bg-success/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <Users className="text-success h-6 w-6" />
              </div>
              <CardTitle className="mb-2 text-lg">Multi-participant</CardTitle>
              <CardDescription>
                Support for multiple participants in interview sessions
              </CardDescription>
            </CardContent>
          </Card>

          <Card
            hover
            className="animate-slide-up text-center"
            style={{ animationDelay: "300ms" }}
          >
            <CardContent className="pt-6">
              <div className="bg-info/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                <Zap className="text-info h-6 w-6" />
              </div>
              <CardTitle className="mb-2 text-lg">AI-Powered</CardTitle>
              <CardDescription>
                Advanced AI models for intelligent conversation and analysis
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Link href="/questionnaire-prompt-builder">
            <Card interactive className="group animate-slide-up">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-primary/10 group-hover:bg-primary/20 duration-normal flex h-14 w-14 items-center justify-center rounded-xl transition-colors">
                    <FileText className="text-primary h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="mb-2 text-xl">
                      Build Interview Prompts
                    </CardTitle>
                    <CardDescription>
                      Create and customize interview instructions for AI agents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Design custom interview flows, set conversation guidelines,
                  and configure AI behavior for your specific use case. Build
                  prompts that adapt to different interview scenarios and
                  candidate types.
                </p>
                <Button
                  variant="secondary"
                  size="lg"
                  className="group-hover:bg-primary group-hover:text-primary-foreground duration-normal w-full transition-colors"
                >
                  <span>Open Prompt Builder</span>
                  <ArrowRight className="duration-fast h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/call">
            <Card
              interactive
              className="group animate-slide-up"
              style={{ animationDelay: "100ms" }}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="bg-accent/10 group-hover:bg-accent/20 duration-normal flex h-14 w-14 items-center justify-center rounded-xl transition-colors">
                    <Mic className="text-accent h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="mb-2 text-xl">
                      Start Interview
                    </CardTitle>
                    <CardDescription>
                      Join a LiveKit room and begin AI interview
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Connect to interview rooms, manage participants, and conduct
                  real-time voice conversations with AI agents. Experience
                  seamless audio quality and intelligent conversation flow.
                </p>
                <Button
                  size="lg"
                  className="group-hover:bg-accent group-hover:text-accent-foreground duration-normal w-full transition-colors"
                >
                  <span>Start Interview</span>
                  <ArrowRight className="duration-fast h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <div className="animate-fade-in space-y-4 text-center">
          <div className="text-muted-foreground inline-flex items-center gap-2 text-sm">
            <span>Powered by</span>
            <span className="text-fg font-medium">LiveKit</span>
            <span className="text-muted">•</span>
            <span className="text-fg font-medium">OpenAI</span>
            <span className="text-muted">•</span>
            <span className="text-fg font-medium">Next.js</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Built with modern web technologies for optimal performance and user
            experience
          </p>
        </div>
      </div>
    </AppShell>
  );
}
