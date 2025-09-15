import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";

export async function GET() {
  try {
    // Use the LiveKit URL from environment variables
    const livekitUrl = serverEnv.LIVEKIT_URL;

    return NextResponse.json({ url: livekitUrl });
  } catch (error) {
    console.error("Failed to get LiveKit URL:", error);
    return NextResponse.json(
      { error: "Failed to get LiveKit URL" },
      { status: 500 }
    );
  }
}
