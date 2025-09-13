import Link from "next/link";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Mic, FileText, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
            AI-Powered Interview Platform
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Conduct professional interviews with AI agents powered by OpenAI and LiveKit. 
            Create custom prompts and engage in real-time voice conversations.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <CardTitle className="text-lg">Prompt Builder</CardTitle>
              <CardDescription>
                Create and customize interview instructions for AI agents
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-info-100 dark:bg-info-900 rounded-lg flex items-center justify-center mb-4">
                <Mic className="h-6 w-6 text-info-600 dark:text-info-400" />
              </div>
              <CardTitle className="text-lg">Live Interviews</CardTitle>
              <CardDescription>
                Conduct real-time voice interviews with AI agents
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-success-100 dark:bg-success-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-success-600 dark:text-success-400" />
              </div>
              <CardTitle className="text-lg">Multi-Participant</CardTitle>
              <CardDescription>
                Support for multiple participants in interview rooms
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-warning-600 dark:text-warning-400" />
              </div>
              <CardTitle className="text-lg">Real-time AI</CardTitle>
              <CardDescription>
                Powered by OpenAI&apos;s latest real-time models
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/questionnaire-prompt-builder">
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-primary-200 dark:border-primary-800">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
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
                  Design custom interview flows, set conversation guidelines, and configure AI behavior for your specific use case.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/call">
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-info-200 dark:border-info-800">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-info-500 rounded-lg flex items-center justify-center">
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
                  Connect to interview rooms, manage participants, and conduct real-time voice conversations with AI agents.
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
