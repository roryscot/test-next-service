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
import { Textarea } from "@/components/ui/Textarea";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Users,
  Hash,
  User,
  FileText,
  Save,
} from "lucide-react";
import { toast } from "sonner";

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
  // State for user speech detection
  const [isListening, setIsListening] = useState(false);
  const [userSpeech, setUserSpeech] = useState<string>("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [agentAudioUrl, setAgentAudioUrl] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  // Prompt builder state
  const [promptTitle, setPromptTitle] = useState("");
  const [promptContent, setPromptContent] = useState("");
  const [promptLoading, setPromptLoading] = useState(true);
  const [promptSaving, setPromptSaving] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const micRef = useRef<LocalAudioTrack | null>(null);
  const audioCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (agentAudioUrl) {
        URL.revokeObjectURL(agentAudioUrl);
      }
    };
  }, []);

  // Load current prompt on mount
  useEffect(() => {
    loadCurrentPrompt();
  }, []);

  async function loadCurrentPrompt() {
    try {
      const res = await fetch("/api/questionnaire-prompt-builder", {
        cache: "no-store",
      });
      const json = await res.json();
      setPromptTitle(json.title || "");
      setPromptContent(json.prompt || "");
    } catch {
      toast.error("Failed to load current prompt");
    } finally {
      setPromptLoading(false);
    }
  }

  async function savePrompt() {
    if (!promptContent.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setPromptSaving(true);
    try {
      const res = await fetch("/api/questionnaire-prompt-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: promptTitle.trim() || "Current Interview Prompt",
          prompt: promptContent.trim(),
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
      setPromptSaving(false);
    }
  }

  // Enable audio playback (required for browser autoplay policies)
  async function enableAudio() {
    try {
      if (roomRef.current) {
        await roomRef.current.startAudio();
        setAudioEnabled(true);
        console.log("🔊 Audio enabled");
      }
    } catch (error) {
      console.error("Failed to enable audio:", error);
    }
  }

  async function connect() {
    if (status === "connecting" || status === "connected") return;

    try {
      setStatus("connecting");
      setConnectionError(null);

      // Start agent with current prompt
      console.log("💾 Starting agent with current prompt...");
      await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName,
          action: "start",
        }),
      });

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
        throw new Error("Failed to get LiveKit credentials");
      }

      const { url } = await urlResponse.json();
      const { token } = await tokenResponse.json();

      console.log("✅ Got credentials:", { url, tokenLength: token.length });

      // Create room and connect
      const room = new Room();
      roomRef.current = room;

      // Set up event handlers
      room.on(RoomEvent.Connected, () => {
        console.log("✅ Connected to room successfully");
        setStatus("connected");
        setConnectionError(null);
      });

      room.on(RoomEvent.Disconnected, reason => {
        console.log("❌ Disconnected from room:", reason);
        setStatus("disconnected");
      });

      room.on(RoomEvent.ParticipantConnected, () => {
        refreshParticipants();
      });

      room.on(RoomEvent.ParticipantDisconnected, () => {
        refreshParticipants();
      });

      // Handle track subscriptions for agent audio
      room.on(RoomEvent.TrackSubscribed, (track, participant) => {
        console.log(
          `🎵 Track subscribed: ${track.kind} from ${participant.identity}`
        );
        if (track.kind === Track.Kind.Audio) {
          // Check if this is from the AI agent
          if (participant.identity.startsWith("agent-")) {
            console.log(`🤖 Agent audio track subscribed: ${track.name}`);
            const audioElement = track.attach();
            audioElement.play().catch(error => {
              console.log("Agent audio play failed:", error);
            });
          } else {
            // Handle other participants' audio
            const audioElement = track.attach();
            audioElement.play();
          }
        }
      });

      // Connect to room
      console.log("🔌 Connecting to LiveKit room...");
      console.log("🔍 Connection details:", {
        url,
        token: token.substring(0, 20) + "...",
      });

      await room.connect(url, token);

      // Create audio track
      console.log("🎤 Creating audio track...");
      const audioTrack = await createLocalAudioTrack();
      micRef.current = audioTrack;

      // Publish audio track
      await room.localParticipant.publishTrack(audioTrack);

      console.log("🎉 Connection complete!");

      // Enable audio and start polling for agent audio
      await enableAudio();

      // Start polling for agent audio (hybrid approach with LiveKit coordination)
      audioCheckIntervalRef.current = setInterval(checkAndPlayAgentAudio, 5000);
    } catch (error) {
      console.error("❌ Connection failed:", error);
      setStatus("failed");
      setConnectionError(
        error instanceof Error ? error.message : "Connection failed"
      );
    }
  }

  async function checkAndPlayAgentAudio() {
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getAudio" }),
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Revoke previous URL to prevent memory leaks
        if (agentAudioUrl) {
          URL.revokeObjectURL(agentAudioUrl);
        }

        setAgentAudioUrl(audioUrl);

        // Play the audio
        const audio = new Audio(audioUrl);
        audio.play().catch(error => {
          console.log("Audio play failed:", error);
        });

        console.log("🎵 Playing new agent audio");

        // Start listening for user response after agent finishes speaking
        audio.addEventListener("ended", () => {
          console.log(
            "🎵 Agent finished speaking, starting to listen for user..."
          );
          startListeningForUser();
        });
      } else if (response.status === 404) {
        // No new audio available - this is normal, don't log as error
        console.log("🔇 No new audio from agent (conversation in progress)");
      } else {
        console.log(`⚠️ Audio request failed: ${response.status}`);
      }
    } catch (error) {
      console.log("Audio request error:", error);
    }
  }

  async function startListeningForUser() {
    try {
      console.log("🎤 Starting to listen for user speech...");
      setIsListening(true);

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("🎤 Recording stopped, processing user speech...");

        // Create audio blob (for future STT processing)
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        console.log(`🎤 Recorded ${audioBlob.size} bytes of audio`);

        // Send to agent for processing
        await sendUserSpeechToAgent();

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false);
      };

      // Start recording
      mediaRecorder.start();

      // Stop recording after 5 seconds (simulate user speaking)
      setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      }, 5000);
    } catch (error) {
      console.error("Failed to start listening:", error);
      setIsListening(false);
    }
  }

  async function sendUserSpeechToAgent() {
    try {
      console.log("📤 Sending user speech to agent...");

      // For now, simulate user response
      const simulatedResponse = "I'm doing well, thank you for asking!";
      setUserSpeech(simulatedResponse);

      // Send user response to agent
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "userResponse",
          transcript: simulatedResponse,
        }),
      });

      if (response.ok) {
        console.log("✅ User response sent to agent");
      } else {
        console.log("❌ Failed to send user response");
      }
    } catch (error) {
      console.error("Error sending user speech:", error);
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
    // Clear audio check interval
    if (audioCheckIntervalRef.current) {
      clearInterval(audioCheckIntervalRef.current);
      audioCheckIntervalRef.current = null;
    }

    if (roomRef.current) {
      await roomRef.current.disconnect();
      setStatus("disconnected");
    }

    // Stop agent
    await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
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
      // Clear audio check interval
      if (audioCheckIntervalRef.current) {
        clearInterval(audioCheckIntervalRef.current);
      }

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
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                  AI Interview Call
                </CardTitle>
                <CardDescription className="mt-1 text-gray-600">
                  Connect to start your AI-powered interview
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {status === "disconnected" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                      Your Name
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
                      <strong>Connection Error:</strong> {connectionError}
                    </div>
                  )}

                  {/* Start Interview Button */}
                  <Button
                    onClick={connect}
                    disabled={status === "connecting"}
                    loading={status === "connecting"}
                    icon={<Phone className="h-4 w-4" />}
                    iconPosition="left"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-green-600 hover:to-emerald-700 hover:shadow-xl"
                  >
                    {status === "connecting"
                      ? "Connecting..."
                      : "Start AI Interview"}
                  </Button>

                  {/* Connecting Status */}
                  {status === "connecting" && (
                    <div className="text-center">
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                          <span className="font-medium">
                            Connecting to AI Interviewer...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {status === "connected" && (
              <div className="space-y-6">
                {/* Audio Control Panel */}
                <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="font-medium text-green-800">
                        Connected
                      </span>
                      {isListening && (
                        <span className="text-sm text-blue-500">
                          🎤 Listening...
                        </span>
                      )}
                      {userSpeech && (
                        <span className="text-sm text-green-500">
                          💬 &quot;{userSpeech}&quot;
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!audioEnabled && (
                        <Button
                          onClick={enableAudio}
                          size="sm"
                          className="bg-green-600 text-white hover:bg-green-700"
                        >
                          Enable Audio
                        </Button>
                      )}
                      <Button
                        onClick={toggleMute}
                        variant={muted ? "destructive" : "outline"}
                        size="sm"
                        icon={
                          muted ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )
                        }
                      >
                        {muted ? "Unmute" : "Mute"}
                      </Button>
                      <Button
                        onClick={disconnect}
                        variant="destructive"
                        size="sm"
                        icon={<PhoneOff className="h-4 w-4" />}
                      >
                        End Interview
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Interview Status */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Interview Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className="text-sm font-medium text-green-600">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Audio:</span>
                          <span
                            className={`text-sm font-medium ${audioEnabled ? "text-green-600" : "text-yellow-600"}`}
                          >
                            {audioEnabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Participants
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {participants.map((participant, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${participant === identity ? "bg-blue-500" : "bg-green-500"}`}
                            ></div>
                            <span className="text-sm">
                              {participant === identity ? "You" : participant}
                            </span>
                            <span className="text-xs text-gray-500">
                              {participant === identity
                                ? "(Host)"
                                : "(AI Agent)"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prompt Builder Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-2xl font-bold text-transparent">
                  Interview Setup
                </CardTitle>
                <CardDescription className="mt-1 text-gray-600">
                  Configure the AI interviewer&apos;s behavior and questions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {promptLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                <span className="ml-2 text-gray-600">Loading prompt...</span>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-fg mb-2 block text-sm font-medium">
                    Interview Title
                  </label>
                  <Input
                    value={promptTitle}
                    onChange={e => setPromptTitle(e.target.value)}
                    placeholder="Enter interview title (e.g., Technical Interview, Behavioral Assessment)"
                  />
                </div>

                <div>
                  <label className="text-fg mb-2 block text-sm font-medium">
                    Interview Prompt & Questions
                  </label>
                  <Textarea
                    value={promptContent}
                    onChange={e => setPromptContent(e.target.value)}
                    placeholder="Enter your interview prompt and questions here...

Example:
You are a friendly AI interviewer conducting a technical interview.

Start with: 'Hello! Welcome to the interview. How are you doing today?'

Then ask these questions:
1. 'Can you tell me about your experience with React?'
2. 'How do you handle state management in large applications?'
3. 'What's your approach to testing frontend components?'
4. 'Do you have any questions about the role or our team?'

Be conversational and encouraging throughout the interview."
                    rows={12}
                    className="resize-none"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    This prompt will be used by the AI interviewer to conduct
                    interviews. Include specific questions, greetings, and
                    instructions for the interviewer. The AI will ask each
                    question and wait for your response before moving to the
                    next one.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={savePrompt}
                    disabled={promptSaving || !promptContent.trim()}
                    loading={promptSaving}
                    icon={<Save className="h-4 w-4" />}
                    iconPosition="left"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-green-600 hover:to-emerald-700 hover:shadow-xl"
                  >
                    {promptSaving ? "Saving..." : "Save Interview Setup"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
