"use client";
import { useEffect, useRef, useState } from "react";
import { Room, RoomEvent, createLocalAudioTrack } from "livekit-client";

export default function CallPage() {
  const [status, setStatus] = useState("disconnected");
  const [roomName, setRoomName] = useState("demo-room");
  const [identity, setIdentity] = useState(
    () => `host-${Math.random().toString(36).slice(2, 8)}`
  );
  const [participants, setParticipants] = useState<string[]>([]);
  const [livekitUrl, setLivekitUrl] = useState("");
  const roomRef = useRef<Room | undefined>(undefined);

  // Fetch LiveKit URL from server
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/livekit/url");
        if (res.ok) {
          const { url } = await res.json();
          setLivekitUrl(url);
        }
      } catch (e) {
        console.warn("Could not fetch LiveKit URL:", e);
      }
    })();
  }, []);

  async function connect() {
    setStatus("connecting");
    try {
      // Get token from our API
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, identity }),
      });
      if (!res.ok) {
        setStatus("failed");
        return;
      }
      const { token } = await res.json();

      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.ParticipantConnected, () => refreshParticipants());
      room.on(RoomEvent.ParticipantDisconnected, () => refreshParticipants());
      room.on(RoomEvent.Connected, () => setStatus("connected"));
      room.on(RoomEvent.Disconnected, () => setStatus("disconnected"));

      // Use environment variable or fallback
      const wsUrl =
        process.env.NEXT_PUBLIC_LIVEKIT_URL ||
        livekitUrl ||
        "wss://localhost:7880";
      await room.connect(wsUrl, token);

      // Publish mic
      const track = await createLocalAudioTrack();
      await room.localParticipant.publishTrack(track);

      refreshParticipants();
    } catch (error) {
      console.error("Connection failed:", error);
      setStatus("failed");
    }
  }

  function refreshParticipants() {
    const room = roomRef.current;
    if (!room) return;
    const ids = [
      room.localParticipant.identity,
      ...Array.from(room.remoteParticipants.values()).map((p) => p.identity),
    ];
    setParticipants(ids.filter(Boolean) as string[]);
  }

  async function disconnect() {
    await roomRef.current?.disconnect();
    setStatus("disconnected");
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Interview Call</h1>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-sm mb-1 text-neutral-300">
            Room Name
          </label>
          <input
            className="w-full p-2 rounded-2xl bg-neutral-900 ring-1 ring-neutral-700 text-neutral-100"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm mb-1 text-neutral-300">
            Identity
          </label>
          <input
            className="w-full p-2 rounded-2xl bg-neutral-900 ring-1 ring-neutral-700 text-neutral-100"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
          />
        </div>
        {status !== "connected" ? (
          <button
            onClick={connect}
            className="px-4 py-2 rounded-2xl bg-emerald-600 text-white font-medium"
          >
            Connect
          </button>
        ) : (
          <button
            onClick={disconnect}
            className="px-4 py-2 rounded-2xl bg-rose-600 text-white font-medium"
          >
            Disconnect
          </button>
        )}
      </div>

      <div className="rounded-2xl p-4 ring-1 ring-neutral-700">
        <div className="text-sm mb-2 text-neutral-300">
          Status: <span className="font-mono text-emerald-400">{status}</span>
        </div>
        <div className="text-sm text-neutral-300 mb-2">Participants:</div>
        <ul className="list-disc ml-6 text-neutral-400">
          {participants.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl p-4 bg-neutral-900 ring-1 ring-neutral-700">
        <h3 className="text-sm font-medium text-neutral-300 mb-2">
          Agent Instructions
        </h3>
        <p className="text-sm text-neutral-400 mb-2">
          To start the AI interview agent, run this command in another terminal:
        </p>
        <code className="block text-xs bg-neutral-800 p-2 rounded text-neutral-300 overflow-x-auto">
          SERVER_ORIGIN=http://localhost:3000 LIVEKIT_URL=
          {livekitUrl || "wss://your-livekit-domain"} LIVEKIT_API_KEY=your-key
          LIVEKIT_API_SECRET=your-secret OPENAI_API_KEY=your-openai-key ts-node
          src/agents/interview-strella-agent.ts {roomName}
        </code>
      </div>
    </main>
  );
}
