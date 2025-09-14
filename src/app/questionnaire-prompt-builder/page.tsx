"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
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
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/questionnaire-prompt-builder", {
          cache: "no-store",
        });
        const json = await res.json();
        setValue(json?.prompt ?? "");
      } catch {
        toast.error("Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/questionnaire-prompt-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });
      if (!res.ok) throw new Error();
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Questionnaire Prompt Builder">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <FileText className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle>Interview Prompt Configuration</CardTitle>
                <CardDescription>
                  Agent reads from{" "}
                  <code className="bg-muted/30 rounded px-1 text-xs">
                    /api/questionnaire-prompt-builder
                  </code>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner label="Loading prompt…" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-fg mb-2 block text-sm font-medium">
                    Interview Instructions
                  </label>
                  <Textarea
                    value={value}
                    onChange={e => setValue(e.target.value)}
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
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
