"use client";
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { Save, FileText, AlertCircle } from "lucide-react";

export default function PromptBuilder() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadPrompt();
  }, [loadPrompt]);

  async function loadPrompt() {
    try {
      setLoading(true);
      const res = await fetch("/api/questionnaire-prompt-builder", {
        cache: "no-store",
      });
      const json = await res.json();
      setValue(json?.prompt ?? "");
    } catch {
      addToast({
        type: "error",
        title: "Failed to load prompt",
        description: "Could not fetch the current prompt from the server",
      });
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    try {
      setSaving(true);
      const res = await fetch("/api/questionnaire-prompt-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      addToast({
        type: "success",
        title: "Prompt saved successfully",
        description: "Your interview instructions have been updated",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to save prompt",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="space-y-4 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-neutral-600 dark:text-neutral-400">
              Loading prompt...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Interview Prompt Builder
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Create and customize interview instructions for your AI agents
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-primary-500 flex h-10 w-10 items-center justify-center rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>Interview Instructions</CardTitle>
                <CardDescription>
                  Define how the AI agent should conduct interviews
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea
              label="Prompt Content"
              placeholder="Enter your interview instructions here..."
              value={value}
              onChange={e => setValue(e.target.value)}
              className="min-h-[300px] resize-none"
              helperText="The AI agent will use these instructions to conduct interviews. Be specific about the interview style, questions to ask, and how to interact with participants."
            />

            <div className="flex items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <div className="text-sm text-neutral-500 dark:text-neutral-400">
                <p>Character count: {value.length}</p>
                <p>
                  Agent will fetch from{" "}
                  <code className="rounded bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-800">
                    /api/questionnaire-prompt-builder
                  </code>
                </p>
              </div>

              <Button
                onClick={save}
                disabled={saving || !value.trim()}
                className="min-w-[120px]"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Prompt
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="text-info-500 h-5 w-5" />
              <span>Tips for Effective Prompts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                  Structure
                </h4>
                <ul className="space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>• Start with a greeting</li>
                  <li>• Define interview objectives</li>
                  <li>• Set conversation tone</li>
                  <li>• Include closing instructions</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                  Best Practices
                </h4>
                <ul className="space-y-1 text-neutral-600 dark:text-neutral-400">
                  <li>• Be specific and clear</li>
                  <li>• Include follow-up questions</li>
                  <li>• Set time expectations</li>
                  <li>• Define success criteria</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
