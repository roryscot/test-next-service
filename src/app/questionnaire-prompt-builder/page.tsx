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
import { Save, FileText, Plus } from "lucide-react";

type Prompt = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export default function PromptBuilder() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    try {
      const res = await fetch("/api/questionnaire-prompt-builder?list=true", {
        cache: "no-store",
      });
      const json = await res.json();
      setPrompts(json?.prompts ?? []);

      // Select the first prompt if available
      if (json?.prompts?.length > 0) {
        setSelectedPromptId(json.prompts[0].id);
        setTitle(json.prompts[0].title);
        setContent(json.prompts[0].content);
      }
    } catch {
      toast.error("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }

  function selectPrompt(prompt: Prompt) {
    setSelectedPromptId(prompt.id);
    setTitle(prompt.title);
    setContent(prompt.content);
  }

  function createNewPrompt() {
    setSelectedPromptId("");
    setTitle("");
    setContent("");
  }

  async function save() {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter content");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/questionnaire-prompt-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          prompt: content.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Prompt saved successfully");
      await loadPrompts(); // Reload prompts
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Questionnaire Prompt Builder">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Prompts List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                  <FileText className="text-primary h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Saved Prompts</CardTitle>
                  <CardDescription>
                    Manage your interview questionnaires
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={createNewPrompt}
                icon={<Plus />}
                iconPosition="left"
                variant="outline"
              >
                New Prompt
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner label="Loading prompts…" />
              </div>
            ) : (
              <div className="space-y-2">
                {prompts.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
                    <p>No prompts saved yet</p>
                    <p className="text-sm">
                      Create your first prompt to get started
                    </p>
                  </div>
                ) : (
                  prompts.map(prompt => (
                    <div
                      key={prompt.id}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        selectedPromptId === prompt.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-border-hover"
                      }`}
                      onClick={() => selectPrompt(prompt)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{prompt.title}</h3>
                          <p className="text-muted-foreground text-sm">
                            {prompt.content.substring(0, 100)}...
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            Updated:{" "}
                            {new Date(prompt.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prompt Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <FileText className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle>
                  {selectedPromptId ? "Edit Prompt" : "Create New Prompt"}
                </CardTitle>
                <CardDescription>
                  {selectedPromptId
                    ? "Modify the selected prompt"
                    : "Create a new interview questionnaire"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-fg mb-2 block text-sm font-medium">
                  Prompt Title
                </label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Enter a title for this prompt..."
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-fg mb-2 block text-sm font-medium">
                  Interview Instructions
                </label>
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="h-72"
                  placeholder="Enter your interview instructions here..."
                />
              </div>

              <div className="border-border flex items-center justify-between border-t pt-4">
                <div className="text-muted-foreground text-sm">
                  💡 Keep it concise and action-oriented for best results
                </div>
                <Button
                  onClick={save}
                  loading={saving}
                  icon={<Save />}
                  iconPosition="left"
                >
                  {selectedPromptId ? "Update Prompt" : "Save New Prompt"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
