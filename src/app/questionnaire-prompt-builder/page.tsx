"use client";
import { useEffect, useState } from "react";

export default function PromptBuilder() {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/questionnaire-prompt-builder", {
        cache: "no-store",
      });
      const json = await res.json();
      setValue(json?.prompt ?? "");
    })();
  }, []);

  async function save() {
    try {
      setSaving(true);
      setStatus(null);
      const res = await fetch("/api/questionnaire-prompt-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: value }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("Saved");
    } catch (error: unknown) {
      setStatus(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Questionnaire Prompt Builder</h1>
      <textarea
        className="w-full h-64 p-3 rounded-2xl bg-neutral-900 text-neutral-100 outline-none ring-1 ring-neutral-700"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter your interview instructions here..."
      />
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-2xl bg-emerald-600 disabled:opacity-50 text-white font-medium"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {status && <span className="text-sm text-neutral-400">{status}</span>}
      </div>
      <p className="text-sm text-neutral-400">
        Agent will fetch from{" "}
        <code className="bg-neutral-800 px-2 py-1 rounded">
          /api/questionnaire-prompt-builder
        </code>
        .
      </p>
    </main>
  );
}
