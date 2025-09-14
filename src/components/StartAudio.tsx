"use client";
import { useEffect, useState } from "react";
import { Room, RoomEvent } from "livekit-client";
import { Button } from "@/components/ui/Button";
import { Volume2, VolumeX } from "lucide-react";

interface StartAudioProps {
  room: Room | null;
  onAudioEnabled?: () => void;
}

/**
 * StartAudio component to handle browser autoplay restrictions
 *
 * This component provides a user-friendly way to enable audio playback
 * when browsers block autoplay. It listens for the audioPlaybackChanged
 * event and shows a button when audio is blocked.
 */
export function StartAudio({ room, onAudioEnabled }: StartAudioProps) {
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    if (!room) return;

    const handleAudioPlaybackChanged = (enabled: boolean) => {
      console.log(`🔊 Audio playback ${enabled ? "enabled" : "blocked"}`);
      setAudioBlocked(!enabled);
      setAudioEnabled(enabled);

      if (enabled && onAudioEnabled) {
        onAudioEnabled();
      }
    };

    // Listen for audio playback changes
    room.on(RoomEvent.AudioPlaybackChanged, handleAudioPlaybackChanged);

    // Check initial state
    setAudioBlocked(!room.canPlayAudio);
    setAudioEnabled(room.canPlayAudio);

    return () => {
      room.off(RoomEvent.AudioPlaybackChanged, handleAudioPlaybackChanged);
    };
  }, [room, onAudioEnabled]);

  const handleStartAudio = async () => {
    if (!room) return;

    try {
      // This will trigger a user gesture to enable audio
      await room.startAudio();
      console.log("✅ Audio playback started");
    } catch (error) {
      console.error("❌ Failed to start audio:", error);
    }
  };

  // Don't render anything if audio is already enabled
  if (audioEnabled) {
    return null;
  }

  return (
    <div className="bg-warn/10 border-warn/20 text-warn rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="bg-warn/20 flex h-8 w-8 items-center justify-center rounded-lg">
          {audioBlocked ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">
            {audioBlocked ? "Audio Blocked" : "Enable Audio"}
          </h3>
          <p className="text-warn/80 mt-1 text-sm">
            {audioBlocked
              ? "Your browser has blocked audio playback. Click the button below to enable it."
              : "Click the button below to enable audio playback for the interview."}
          </p>
        </div>
        <Button
          onClick={handleStartAudio}
          size="sm"
          variant="outline"
          icon={<Volume2 className="h-4 w-4" />}
          iconPosition="left"
        >
          Enable Audio
        </Button>
      </div>
    </div>
  );
}
