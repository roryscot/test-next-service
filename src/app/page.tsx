import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Mic, FileText, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
            AI-Powered Interview Platform
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-neutral-600 dark:text-neutral-400">
            Conduct professional interviews with AI agents powered by OpenAI and
            LiveKit. Create custom prompts and engage in real-time voice
            conversations.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-primary-100 dark:bg-primary-900 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <FileText className="text-primary-600 dark:text-primary-400 h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Prompt Builder</CardTitle>
              <CardDescription>
                Create and customize interview instructions for AI agents
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-info-100 dark:bg-info-900 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <Mic className="text-info-600 dark:text-info-400 h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Live Interviews</CardTitle>
              <CardDescription>
                Conduct real-time voice interviews with AI agents
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-success-100 dark:bg-success-900 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <Users className="text-success-600 dark:text-success-400 h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Multi-Participant</CardTitle>
              <CardDescription>
                Support for multiple participants in interview rooms
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="transition-shadow hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="bg-warning-100 dark:bg-warning-900 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                <Zap className="text-warning-600 dark:text-warning-400 h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Real-time AI</CardTitle>
              <CardDescription>
                Powered by OpenAI&apos;s latest real-time models
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link href="/questionnaire-prompt-builder">
            <Card className="border-primary-200 dark:border-primary-800 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-500 flex h-10 w-10 items-center justify-center rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Build Interview Prompts</CardTitle>
                    <CardDescription>
                      Create and edit interview instructions for AI agents
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Design custom interview flows, set conversation guidelines,
                  and configure AI behavior for your specific use case.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/call">
            <Card className="border-info-200 dark:border-info-800 cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-info-500 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Start Interview</CardTitle>
                    <CardDescription>
                      Join a LiveKit room and begin AI interview
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Connect to interview rooms, manage participants, and conduct
                  real-time voice conversations with AI agents.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          <p>Powered by LiveKit, OpenAI, and Next.js</p>
        </div>
      </div>
    </Layout>
  );
}
