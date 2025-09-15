"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Mic, MicOff, Play, Square } from "lucide-react";

export function AgentController() {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startAgent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: "demo-room",
          action: "start",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsActive(true);
        console.log("Agent started:", data);
      } else {
        console.error("Failed to start agent:", data);
      }
    } catch (error) {
      console.error("Error starting agent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopAgent = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "stop",
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setIsActive(false);
        console.log("Agent stopped:", data);
      } else {
        console.error("Failed to stop agent:", data);
      }
    } catch (error) {
      console.error("Error stopping agent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "speak",
          text,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Speech sent:", data);
      } else {
        console.error("Failed to speak:", data);
      }
    } catch (error) {
      console.error("Error speaking:", error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isActive ? (
            <Mic className="h-5 w-5 text-green-500" />
          ) : (
            <MicOff className="h-5 w-5 text-gray-400" />
          )}
          AI Agent Controller
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={startAgent}
            disabled={isLoading || isActive}
            className="flex-1"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Agent
          </Button>
          <Button
            onClick={stopAgent}
            disabled={isLoading || !isActive}
            variant="destructive"
            className="flex-1"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop Agent
          </Button>
        </div>

        {isActive && (
          <div className="space-y-2">
            <p className="text-sm text-green-600">
              ✅ Agent is active and listening
            </p>
            <div className="space-y-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => speakText("Hello! What's your age?")}
                className="w-full justify-start text-left"
              >
                Test: &quot;Hello! What&apos;s your age?&quot;
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => speakText("Tell me about yourself.")}
                className="w-full justify-start text-left"
              >
                Test: &quot;Tell me about yourself.&quot;
              </Button>
            </div>
          </div>
        )}

        {!isActive && (
          <p className="text-sm text-gray-500">
            Start the agent to begin conducting interviews
          </p>
        )}
      </CardContent>
    </Card>
  );
}
