import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">AI Interview App</h1>
      <p className="text-center text-neutral-400">
        Build interview prompts and conduct AI-powered interviews with LiveKit
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/questionnaire-prompt-builder"
          className="p-6 rounded-2xl bg-neutral-900 ring-1 ring-neutral-700 hover:ring-emerald-500 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">📝 Prompt Builder</h2>
          <p className="text-neutral-400">
            Create and edit interview instructions for the AI agent
          </p>
        </Link>

        <Link
          href="/call"
          className="p-6 rounded-2xl bg-neutral-900 ring-1 ring-neutral-700 hover:ring-emerald-500 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">🎤 Start Interview</h2>
          <p className="text-neutral-400">
            Join a LiveKit room and begin the AI interview
          </p>
        </Link>
      </div>

      <div className="text-center text-sm text-neutral-500">
        <p>Good luck! 🚀</p>
      </div>
    </main>
  );
}
