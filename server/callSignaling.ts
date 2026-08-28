import { createHash, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { URL } from "node:url";
import type { Server as HttpServer } from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { getCallSessionByCallId, updateCallSession } from "./db";
import { ENV } from "./_core/env";

const SIGNALING_PATH = "/api/call-signaling";
const MAX_SIGNAL_BYTES = 96 * 1024;
const SESSION_MAX_AGE_MS = 15 * 60 * 1000;
const VALID_MESSAGE_TYPES = new Set(["offer", "answer", "ice-candidate", "accept", "reject", "end", "ping"]);

type Role = "customer" | "operator";
type Peer = { socket: WebSocket; role: Role };
type SignalMessage = { type: string; payload?: unknown };

const peers = new Map<string, Map<Role, Peer>>();

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function send(socket: WebSocket, message: Record<string, unknown>) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function parseSignalMessage(raw: Buffer): SignalMessage | null {
  if (raw.byteLength > MAX_SIGNAL_BYTES) return null;
  try {
    const parsed = JSON.parse(raw.toString("utf8")) as SignalMessage;
    if (!parsed || typeof parsed.type !== "string" || !VALID_MESSAGE_TYPES.has(parsed.type)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function peerFor(callId: string, role: Role) {
  const callPeers = peers.get(callId);
  return callPeers?.get(role);
}

async function updateForMessage(callId: string, type: string) {
  if (type === "accept") await updateCallSession(callId, { status: "connecting", lastSignalAt: new Date() });
  else if (type === "answer") await updateCallSession(callId, { status: "connected", startedAt: new Date(), lastSignalAt: new Date() });
  else if (type === "end") await updateCallSession(callId, { status: "ended", endedAt: new Date(), lastSignalAt: new Date() });
  else if (type === "reject") await updateCallSession(callId, { status: "rejected", endedAt: new Date(), lastSignalAt: new Date() });
  else await updateCallSession(callId, { lastSignalAt: new Date() });
}

async function authorize(request: IncomingMessage) {
  const requestUrl = new URL(request.url ?? "", "http://localhost");
  const callId = requestUrl.searchParams.get("callId")?.trim() ?? "";
  const token = requestUrl.searchParams.get("token")?.trim() ?? "";
  const role = requestUrl.searchParams.get("role") as Role | null;
  if (!callId || !token || (role !== "customer" && role !== "operator")) return null;

  const session = await getCallSessionByCallId(callId);
  if (!session || Date.now() - session.createdAt.getTime() > SESSION_MAX_AGE_MS) return null;
  if (["ended", "rejected", "failed", "busy"].includes(session.status)) return null;
  if (role === "customer" && !safeEqual(hashToken(token), session.customerTokenHash)) return null;
  if (role === "operator" && (!ENV.operatorSignalingToken || token !== ENV.operatorSignalingToken)) return null;

  return { callId, role };
}

export function registerCallSignaling(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_SIGNAL_BYTES });
  server.on("upgrade", async (request, socket, head) => {
    const requestUrl = new URL(request.url ?? "", "http://localhost");
    if (requestUrl.pathname !== SIGNALING_PATH) return;

    const identity = await authorize(request).catch(() => null);
    if (!identity) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, ws => {
      const callPeers = peers.get(identity.callId) ?? new Map<Role, Peer>();
      const existing = callPeers.get(identity.role);
      existing?.socket.close(1008, "A newer connection replaced this one.");
      callPeers.set(identity.role, { socket: ws, role: identity.role });
      peers.set(identity.callId, callPeers);
      if (identity.role === "operator") void updateCallSession(identity.callId, { status: "ringing", operatorId: "PPFSTUDIO001", lastSignalAt: new Date() });
      send(ws, { type: "ready", callId: identity.callId, role: identity.role });

      ws.on("message", async raw => {
        const message = parseSignalMessage(Buffer.from(raw as Buffer));
        if (!message) {
          send(ws, { type: "error", code: "INVALID_SIGNAL" });
          return;
        }
        if (message.type === "ping") {
          send(ws, { type: "pong" });
          return;
        }
        const targetRole: Role = identity.role === "customer" ? "operator" : "customer";
        const target = peerFor(identity.callId, targetRole);
        await updateForMessage(identity.callId, message.type).catch(() => undefined);
        if (target) send(target.socket, { type: message.type, payload: message.payload });
      });

      ws.on("close", () => {
        const current = peers.get(identity.callId);
        if (current?.get(identity.role)?.socket === ws) current.delete(identity.role);
        if (current?.size === 0) peers.delete(identity.callId);
      });
    });
  });

  return { path: SIGNALING_PATH, close: () => wss.close() };
}

export { SIGNALING_PATH };
