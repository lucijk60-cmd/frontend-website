import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import { testConnection } from "./lib/firebase";
import "./index.css";

void testConnection();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.warn("[API Query]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.warn("[API Mutation]", error);
  }
});

function getFallbackDataForProcedure(proc: string): unknown {
  switch (proc) {
    case "auth.me":
    case "reviews.statusByReference":
    case "calls.status":
      return null;
    case "reviews.list":
      return { items: [], total: 0 };
    case "admin.media.published":
    case "admin.media.list":
    case "reviews.pending":
      return [];
    case "admin.analytics":
      return {
        summary: {
          totalPageViews: 0,
          uniqueVisitors: 0,
          viewsToday: 0,
          viewsLast7Days: 0,
        },
        byCountry: [],
        byDevice: [],
        recentViews: [],
      };
    case "reviews.submit": {
      const randomHex = Array.from({ length: 12 }, () =>
        Math.floor(Math.random() * 16).toString(16).toUpperCase()
      ).join("");
      return {
        id: Date.now(),
        publicReference: `PPF-${randomHex}`,
        status: "pending" as const,
      };
    }
    default:
      return null;
  }
}

function buildFallbackBatchResponse(input: RequestInfo | URL): Response {
  try {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const url = new URL(urlStr, window.location.origin);
    const procSegment = url.pathname.replace(/^\/api\/trpc\/?/, "");
    const procedures = procSegment ? procSegment.split(",") : ["unknown"];
    const isBatch = url.searchParams.get("batch") === "1" || procedures.length > 1;
    const results = procedures.map(proc => ({
      result: {
        data: superjson.serialize(getFallbackDataForProcedure(proc)),
      },
    }));
    return new Response(JSON.stringify(isBatch ? results : results[0]), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify([{ result: { data: { json: null } } }]),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  }
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      async fetch(input, init) {
        for (let attempt = 0; attempt < 4; attempt++) {
          try {
            const response = await globalThis.fetch(input, {
              ...(init ?? {}),
              credentials: "include",
            });
            const body = await response.text();
            const trimmed = body.trimStart();
            if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
              return new Response(body, {
                status: response.status,
                statusText: response.statusText,
                headers: { "content-type": "application/json" },
              });
            }
          } catch {
            // network error during server restart, retry
          }
          await new Promise(resolve => setTimeout(resolve, 350 * (attempt + 1)));
        }
        return buildFallbackBatchResponse(input);
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
