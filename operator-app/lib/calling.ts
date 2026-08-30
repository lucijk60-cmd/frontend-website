export type CallState = "offline" | "connecting" | "ringing" | "connected" | "ended" | "error";

type Signal = { type: string; payload?: unknown };

type CallClientOptions = {
  baseUrl: string;
  callId: string;
  operatorToken: string;
  onSignal?: (signal: Signal) => void;
  onState?: (state: CallState) => void;
};

export function createOperatorCallClient(options: CallClientOptions) {
  let socket: WebSocket | null = null;
  const setState = (state: CallState) => options.onState?.(state);

  return {
    connect() {
      const url = new URL(options.baseUrl);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      url.pathname = "/api/call-signaling";
      url.search = new URLSearchParams({ callId: options.callId, role: "operator", token: options.operatorToken }).toString();
      setState("connecting");
      socket = new WebSocket(url.toString());
      socket.onopen = () => setState("ringing");
      socket.onmessage = event => {
        try {
          const signal = JSON.parse(String(event.data)) as Signal;
          if (signal.type === "answer") setState("connected");
          if (signal.type === "end" || signal.type === "reject") setState("ended");
          options.onSignal?.(signal);
        } catch {
          setState("error");
        }
      };
      socket.onerror = () => setState("error");
      socket.onclose = () => { socket = null; setState("ended"); };
    },
    send(signal: Signal) {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(signal));
    },
    disconnect() {
      socket?.close();
      socket = null;
    },
  };
}
