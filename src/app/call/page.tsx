"use client";
import { useEffect, useRef, useState } from "react";
import {
  Room,
  RoomEvent,
  createLocalAudioTrack,
  LocalAudioTrack,
} from "livekit-client";
import { AppShell } from "@/components/app-shell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Mic, MicOff, Phone, PhoneOff, Users, Hash, User } from "lucide-react";

export default function CallPage() {
  const [status, setStatus] = useState("disconnected");
  const [roomName, setRoomName] = useState("demo-room");
  const [identity, setIdentity] = useState(
    () => `host-${Math.random().toString(36).slice(2, 8)}`
  );
  const [participants, setParticipants] = useState<string[]>([]);
  const [muted, setMuted] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const micRef = useRef<LocalAudioTrack | null>(null);
  const { push } = useToast();

  async function connect() {
    setStatus("connecting");
    try {
      const res = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, identity }),
      });
      if (!res.ok) throw new Error("Token error");
      const { token } = await res.json();

      const room = new Room();
      roomRef.current = room;
      room.on(RoomEvent.ParticipantConnected, refreshParticipants);
      room.on(RoomEvent.ParticipantDisconnected, refreshParticipants);
      room.on(RoomEvent.Connected, () => setStatus("connected"));
      room.on(RoomEvent.Disconnected, () => setStatus("disconnected"));

      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "", token);
      const track = await createLocalAudioTrack();
      micRef.current = track;
      await room.localParticipant.publishTrack(track);
      setMuted(false);
      refreshParticipants();
    } catch {
      setStatus("failed");
      push({ title: "Connection failed", variant: "danger" });
    }
  }

  function refreshParticipants() {
    const room = roomRef.current;
    if (!room) return;
    const ids = [
      room.localParticipant.identity,
      ...Array.from(room.remoteParticipants.values()).map(p => p.identity),
    ].filter(Boolean) as string[];
    setParticipants(ids);
  }

  async function disconnect() {
    await roomRef.current?.disconnect();
    setStatus("disconnected");
  }

  async function toggleMute() {
    if (!micRef.current) return;
    if (muted) {
      await micRef.current.unmute();
      setMuted(false);
    } else {
      await micRef.current.mute();
      setMuted(true);
    }
  }

  useEffect(
    () => () => {
      roomRef.current?.disconnect();
    },
    []
  );

  return (
    <AppShell title="Interview Call">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 flex h-10 w-10 items-center justify-center rounded-lg">
                <Mic className="text-accent h-5 w-5" />
              </div>
              <div>
                <CardTitle>Live Interview Session</CardTitle>
                <CardDescription>
                  Connect to a room and start your AI-powered interview
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="text-fg mb-2 block text-sm font-medium">
                    Room Name
                  </label>
                  <Input
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    icon={<Hash className="h-4 w-4" />}
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <label className="text-fg mb-2 block text-sm font-medium">
                    Your Identity
                  </label>
                  <Input
                    value={identity}
                    onChange={e => setIdentity(e.target.value)}
                    icon={<User className="h-4 w-4" />}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center space-y-4">
                {status !== "connected" ? (
                  <Button
                    onClick={connect}
                    size="lg"
                    icon={<Phone className="h-4 w-4" />}
                    iconPosition="left"
                    className="w-full"
                  >
                    Connect to Room
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant={muted ? "secondary" : "primary"}
                      onClick={toggleMute}
                      size="lg"
                      icon={
                        muted ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )
                      }
                      iconPosition="left"
                      className="w-full"
                    >
                      {muted ? "Unmute Microphone" : "Mute Microphone"}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={disconnect}
                      size="lg"
                      icon={<PhoneOff className="h-4 w-4" />}
                      iconPosition="left"
                      className="w-full"
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-border mt-8 border-t pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Users className="text-muted-foreground h-4 w-4" />
                <span className="text-fg text-sm font-medium">
                  Connection Status:
                  <span
                    className={`ml-2 rounded px-2 py-1 font-mono text-xs ${
                      status === "connected"
                        ? "bg-success/10 text-success"
                        : status === "connecting"
                          ? "bg-warn/10 text-warn"
                          : status === "failed"
                            ? "bg-danger/10 text-danger"
                            : "bg-muted/10 text-muted-foreground"
                    }`}
                  >
                    {status}
                  </span>
                </span>
              </div>

              <div>
                <div className="text-fg mb-2 text-sm font-medium">
                  Participants ({participants.length})
                </div>
                <div className="space-y-1">
                  {participants.length > 0 ? (
                    participants.map(p => (
                      <div
                        key={p}
                        className="text-muted-foreground flex items-center gap-2 text-sm"
                      >
                        <div className="bg-primary h-2 w-2 rounded-full" />
                        {p}
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      No participants connected
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
