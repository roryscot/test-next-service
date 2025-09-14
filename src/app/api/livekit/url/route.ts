import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Use ws:// for localhost development to avoid SSL issues
    // The LiveKit client should handle this properly in development mode
    const livekitUrl = "ws://localhost:7880";

    return NextResponse.json({ url: livekitUrl });
  } catch (error) {
    console.error("Failed to get LiveKit URL:", error);
    return NextResponse.json(
      { error: "Failed to get LiveKit URL" },
      { status: 500 }
    );
  }
}
