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
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { Mic, MicOff, Phone, PhoneOff, Users, Hash, User } from "lucide-react";

// Extend Window interface to include our permission request resolve function
declare global {
  interface Window {
    permissionRequestResolve?: (granted: boolean) => void;
  }
}

export default function CallPage() {
  const [status, setStatus] = useState<
    "disconnected" | "connecting" | "connected" | "failed"
  >("disconnected");
  const [roomName, setRoomName] = useState("demo-room");
  const [identity, setIdentity] = useState(
    () => `host-${Math.random().toString(36).slice(2, 8)}`
  );
  const [participants, setParticipants] = useState<string[]>([]);
  const [muted, setMuted] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const micRef = useRef<LocalAudioTrack | null>(null);

  // Check microphone permission
  async function checkMicrophonePermission(): Promise<
    "granted" | "denied" | "prompt"
  > {
    try {
      const result = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      return result.state === "granted"
        ? "granted"
        : result.state === "denied"
          ? "denied"
          : "prompt";
    } catch {
      // Fallback for browsers that don't support permissions API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach(track => track.stop());
        return "granted";
      } catch {
        return "denied";
      }
    }
  }

  // Request microphone permission
  async function requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setShowPermissionPrompt(false);
      return true;
    } catch (error) {
      console.error("Microphone permission denied:", error);
      setShowPermissionPrompt(false);
      toast.error("Microphone permission denied");
      return false;
    }
  }

  async function connect() {
    setStatus("connecting");
    setConnectionError(null);

    try {
      console.log("🔗 Starting connection process...");

      // Check microphone permission first
      const permission = await checkMicrophonePermission();
      if (permission === "denied") {
        setShowPermissionPrompt(true);
        setStatus("disconnected");
        return;
      }

      if (permission === "prompt") {
        const granted = await requestMicrophonePermission();
        if (!granted) {
          setStatus("disconnected");
          return;
        }
      }

      // Get LiveKit URL and token
      console.log("📡 Fetching LiveKit credentials...");
      const [urlResponse, tokenResponse] = await Promise.all([
        fetch("/api/livekit/url"),
        fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName, identity }),
        }),
      ]);

      if (!urlResponse.ok || !tokenResponse.ok) {
        const errorText = await urlResponse.text().catch(() => "Unknown error");
        throw new Error(`Failed to get LiveKit credentials: ${errorText}`);
      }

      const { url } = await urlResponse.json();
      const { token } = await tokenResponse.json();

      console.log("✅ Got credentials:", { url, tokenLength: token.length });

      // Note: LiveKit client expects wss:// URLs, but we'll handle the connection gracefully
      // The server will handle the actual protocol negotiation

      const room = new Room();
      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.ParticipantConnected, refreshParticipants);
      room.on(RoomEvent.ParticipantDisconnected, refreshParticipants);
      room.on(RoomEvent.Connected, () => {
        console.log("✅ Connected to room successfully");
        setStatus("connected");
        setConnectionError(null);
      });
      room.on(RoomEvent.Disconnected, reason => {
        console.log("❌ Disconnected from room:", reason);
        setStatus("disconnected");
      });
      room.on(RoomEvent.ConnectionStateChanged, state => {
        console.log("🔄 Connection state changed:", state);
      });

      console.log("🔌 Connecting to LiveKit room...");
      console.log("🔍 Connection details:", {
        url,
        token: token.substring(0, 20) + "...",
      });

      // Add connection options to ensure proper WebSocket connection
      const connectionOptions = {
        autoSubscribe: true,
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          audioPreset: {
            maxBitrate: 16000,
          },
        },
        // Allow insecure connections for localhost development
        allowInsecureConnections: true,
        // Force WebSocket connection without HTTPS upgrade
        forceRelay: false,
      };

      await room.connect(url, token, connectionOptions);

      console.log("🎤 Creating audio track...");
      const track = await createLocalAudioTrack();
      micRef.current = track;
      await room.localParticipant.publishTrack(track);
      setMuted(false);
      refreshParticipants();

      console.log("🎉 Connection complete!");
    } catch (error) {
      console.error("❌ Connection failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown connection error";

      // Provide more specific error messages
      let userMessage = errorMessage;
      if (errorMessage.includes("ERR_CONNECTION_RESET")) {
        userMessage =
          "Connection was reset. Please check if LiveKit server is running and try again.";
      } else if (errorMessage.includes("Failed to fetch")) {
        userMessage =
          "Network error. Please check your connection and try again.";
      } else if (errorMessage.includes("WebSocket")) {
        userMessage = "WebSocket connection failed. Please try again.";
      }

      setConnectionError(userMessage);
      setStatus("failed");
      toast.error(`Connection failed: ${userMessage}`);
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
                {/* Connection Error Display */}
                {connectionError && (
                  <div className="bg-danger/10 border-danger/20 text-danger rounded-lg border p-3 text-sm">
                    <div className="font-medium">Connection Failed</div>
                    <div className="text-danger/80 mt-1">{connectionError}</div>
                    <Button
                      onClick={connect}
                      size="sm"
                      variant="outline"
                      className="mt-2 w-full"
                    >
                      Retry Connection
                    </Button>
                  </div>
                )}

                {/* Connection Status */}
                {status === "connecting" && (
                  <div className="bg-info/10 border-info/20 text-info rounded-lg border p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                      <span>Connecting to room...</span>
                    </div>
                  </div>
                )}

                {status !== "connected" ? (
                  <Button
                    onClick={connect}
                    size="lg"
                    icon={<Phone className="h-4 w-4" />}
                    iconPosition="left"
                    className="w-full"
                    disabled={status === "connecting"}
                    loading={status === "connecting"}
                  >
                    {status === "connecting"
                      ? "Connecting..."
                      : "Connect to Room"}
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

        {/* Microphone Permission Prompt */}
        {showPermissionPrompt && (
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mic className="text-warn h-5 w-5" />
                <div>
                  <CardTitle>Microphone Permission Required</CardTitle>
                  <CardDescription>
                    We need access to your microphone to conduct the interview
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Please allow microphone access to continue with the interview.
                  You can change this permission later in your browser settings.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowPermissionPrompt(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={requestMicrophonePermission}
                    icon={<Mic />}
                    iconPosition="left"
                  >
                    Allow Microphone
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
