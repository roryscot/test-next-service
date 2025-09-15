"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Save, FileText } from "lucide-react";

export default function PromptBuilder() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCurrentPrompt();
  }, []);

  async function loadCurrentPrompt() {
    try {
      const res = await fetch("/api/questionnaire-prompt-builder", {
        cache: "no-store",
      });
      const json = await res.json();
      setTitle(json.title || "");
      setContent(json.prompt || "");
    } catch {
      toast.error("Failed to load current prompt");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!content.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/questionnaire-prompt-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Current Interview Prompt",
          prompt: content.trim(),
        }),
      });

      if (res.ok) {
        toast.success("Prompt saved successfully!");
      } else {
        toast.error("Failed to save prompt");
      }
    } catch {
      toast.error("Failed to save prompt");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Interview Prompt Builder">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Interview Prompt Builder">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                  Interview Prompt Builder
                </CardTitle>
                <CardDescription className="mt-1 text-gray-600">
                  Create and edit the interview prompt that will be used for all
                  interviews
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-fg mb-2 block text-sm font-medium">
                Prompt Title
              </label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter prompt title"
              />
            </div>

            <div>
              <label className="text-fg mb-2 block text-sm font-medium">
                Interview Prompt
              </label>
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Enter your interview prompt here..."
                rows={12}
                className="resize-none"
              />
              <p className="mt-2 text-sm text-gray-500">
                This prompt will be used by the AI interviewer to conduct
                interviews. Include specific questions, greetings, and
                instructions for the interviewer.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={save}
                disabled={saving || !content.trim()}
                loading={saving}
                icon={<Save className="h-4 w-4" />}
                iconPosition="left"
                className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-green-600 hover:to-emerald-700 hover:shadow-xl"
              >
                {saving ? "Saving..." : "Save Prompt"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
