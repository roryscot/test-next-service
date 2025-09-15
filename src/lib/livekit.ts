// src/lib/livekit.ts
import { AccessToken } from "livekit-server-sdk";
import { serverEnv } from "./env";

export async function createAccessToken({
  roomName,
  identity,
}: {
  roomName: string;
  identity: string;
}) {
  const at = new AccessToken(
    serverEnv.LIVEKIT_API_KEY,
    serverEnv.LIVEKIT_API_SECRET,
    {
      identity,
      ttl: 60 * 10, // 10 minutes
    }
  );
  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });
  return at.toJwt();
}

export function livekitWsUrl() {
  return serverEnv.LIVEKIT_URL; // exposed to client via fetch, not env directly
}
