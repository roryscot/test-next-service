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
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Users,
  Hash,
  User,
  FileText,
  Plus,
} from "lucide-react";

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
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<string>("");
  const [availableQuestionnaires, setAvailableQuestionnaires] = useState<
    Array<{ id: string; name: string; description?: string; content: string }>
  >([]);
  const [agentAudioUrl, setAgentAudioUrl] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);
  const micRef = useRef<LocalAudioTrack | null>(null);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (agentAudioUrl) {
        URL.revokeObjectURL(agentAudioUrl);
      }
    };
  }, [agentAudioUrl]);

  // Load available prompts on component mount
  useEffect(() => {
    loadAvailableQuestionnaires();
  }, []);

  // Load available prompts from the API
  async function loadAvailableQuestionnaires() {
    try {
      const response = await fetch("/api/questionnaires");
      if (response.ok) {
        const data = await response.json();
        setAvailableQuestionnaires(data.questionnaires);

        // Set the first questionnaire as default
        if (data.questionnaires.length > 0) {
          setSelectedQuestionnaire(data.questionnaires[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load questionnaires:", error);
      toast.error("Failed to load questionnaires");
    }
  }

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

      // Save room-specific questionnaire if needed
      const selectedQuestionnaireData = availableQuestionnaires.find(
        q => q.id === selectedQuestionnaire
      );
      if (selectedQuestionnaireData) {
        console.log("💾 Starting agent with selected questionnaire...");
        await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName,
            action: "start",
            questionnaireId: selectedQuestionnaireData.id,
            questionnaireContent: selectedQuestionnaireData.content,
          }),
        });
      }

      // Get LiveKit URL and token
      console.log("📡 Fetching LiveKit credentials...");
      const [urlResponse, tokenResponse] = await Promise.all([
        fetch("/api/livekit/url"),
        fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName,
            identity,
          }),
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

      // Fetch and play agent audio
      await playAgentAudio();
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

  async function playAgentAudio() {
    try {
      console.log("🎵 Triggering agent to speak...");

      // First, trigger the agent to speak
      const speakResponse = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "speak",
          text: "Hello! Welcome to the interview. I am your AI interviewer.",
        }),
      });

      if (speakResponse.ok) {
        console.log("🎵 Agent speech triggered, fetching audio...");

        // Wait a moment for audio generation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch audio from agent
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getAudio" }),
        });

        if (response.ok) {
          // Create blob URL for audio
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          setAgentAudioUrl(audioUrl);

          // Play the audio
          const audio = new Audio(audioUrl);
          audio.play().catch(error => {
            console.error("Failed to play agent audio:", error);
          });

          console.log("🎵 Agent audio playing...");
        } else {
          console.log("No agent audio available yet");
        }
      } else {
        console.log("Failed to trigger agent speech");
      }
    } catch (error) {
      console.error("Failed to fetch agent audio:", error);
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
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                  AI Interview Session
                </CardTitle>
                <CardDescription className="mt-1 text-gray-600">
                  Connect with our AI interviewer for a personalized interview
                  experience
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
                <div>
                  <label className="text-fg mb-2 block text-sm font-medium">
                    Interview Questionnaire
                  </label>
                  <div className="space-y-2">
                    <select
                      value={selectedQuestionnaire}
                      onChange={e => setSelectedQuestionnaire(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    >
                      {availableQuestionnaires.map(questionnaire => (
                        <option key={questionnaire.id} value={questionnaire.id}>
                          {questionnaire.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          window.open("/questionnaire-prompt-builder", "_blank")
                        }
                        size="sm"
                        variant="outline"
                        icon={<Plus className="h-3 w-3" />}
                        className="text-xs"
                      >
                        New Questionnaire
                      </Button>
                      <Button
                        onClick={() =>
                          window.open("/questionnaire-prompt-builder", "_blank")
                        }
                        size="sm"
                        variant="outline"
                        icon={<FileText className="h-3 w-3" />}
                        className="text-xs"
                      >
                        Edit Prompts
                      </Button>
                    </div>
                  </div>
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
                  <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 text-sm text-blue-700 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                      <div>
                        <div className="font-medium">
                          Connecting to AI Interviewer...
                        </div>
                        <div className="mt-1 text-xs text-blue-600">
                          Setting up your interview session
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {status !== "connected" ? (
                  <Button
                    onClick={connect}
                    size="lg"
                    icon={<Phone className="h-5 w-5" />}
                    iconPosition="left"
                    className="w-full transform rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-green-600 hover:to-emerald-700 hover:shadow-xl"
                    disabled={status === "connecting"}
                    loading={status === "connecting"}
                  >
                    {status === "connecting"
                      ? "Connecting to AI Interviewer..."
                      : "🎤 Start AI Interview"}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Audio Controls */}
                    <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
                          <div>
                            <div className="font-medium text-green-800">
                              Connected to AI Interviewer
                            </div>
                            <div className="text-sm text-green-600">
                              Ready for your interview
                            </div>
                          </div>
                        </div>
                        <Button
                          variant={muted ? "secondary" : "primary"}
                          onClick={toggleMute}
                          size="lg"
                          icon={
                            muted ? (
                              <MicOff className="h-5 w-5" />
                            ) : (
                              <Mic className="h-5 w-5" />
                            )
                          }
                          className={`rounded-xl px-6 py-3 font-semibold transition-all duration-200 ${
                            muted
                              ? "border-red-300 bg-red-100 text-red-700 hover:bg-red-200"
                              : "border-green-300 bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {muted ? "Unmute" : "Muted"}
                        </Button>
                      </div>
                    </div>

                    {/* Disconnect Button */}
                    <Button
                      variant="danger"
                      onClick={disconnect}
                      size="lg"
                      icon={<PhoneOff className="h-5 w-5" />}
                      iconPosition="left"
                      className="w-full rounded-xl border-red-200 py-3 font-semibold text-red-600 transition-all duration-200 hover:border-red-300 hover:bg-red-50"
                    >
                      End Interview
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-border mt-8 border-t pt-6">
              <div className="mb-4 flex items-center gap-2">
                <Users className="text-muted-foreground h-5 w-5" />
                <span className="text-fg text-lg font-semibold">
                  Interview Status
                </span>
              </div>

              <div className="space-y-4">
                {/* Connection Status */}
                <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        status === "connected"
                          ? "animate-pulse bg-green-500"
                          : status === "connecting"
                            ? "animate-pulse bg-blue-500"
                            : "bg-gray-400"
                      }`}
                    ></div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {status === "connected"
                          ? "Connected"
                          : status === "connecting"
                            ? "Connecting..."
                            : status === "failed"
                              ? "Connection Failed"
                              : "Disconnected"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {status === "connected"
                          ? "AI Interviewer is ready"
                          : status === "connecting"
                            ? "Setting up your session"
                            : status === "failed"
                              ? "Please try again"
                              : "Click to start"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-800">
                      {participants.length}
                    </div>
                    <div className="text-sm text-gray-600">Participants</div>
                  </div>
                </div>

                {/* Participants List */}
                <div className="space-y-2">
                  <div className="text-fg text-sm font-medium">
                    Active Participants
                  </div>
                  <div className="space-y-2">
                    {participants.length > 0 ? (
                      participants.map(p => (
                        <div
                          key={p}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{p}</div>
                            <div className="text-sm text-gray-600">
                              {p.includes("agent")
                                ? "AI Interviewer"
                                : "Interview Candidate"}
                            </div>
                          </div>
                          <div className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-500">
                            {p.includes("agent") ? "AI" : "Human"}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                        <div className="font-medium">
                          No participants connected
                        </div>
                        <div className="text-sm">
                          Start the interview to begin
                        </div>
                      </div>
                    )}
                  </div>
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
