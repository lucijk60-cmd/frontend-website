const FULL_STACK_SITE_URL = "https://frontendweb-ewq8pgsm.manus.space";
const REVIEW_SERVICE_ERROR = `This static website cannot save reviews. Please use the full-stack PPFStudio website: ${FULL_STACK_SITE_URL}`;

function looksLikeJson(body: string) {
  const trimmed = body.trimStart();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

export async function normalizeTrpcResponse(response: Response) {
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (body.trim() && (contentType.includes("json") || looksLikeJson(body))) {
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  return new Response(
    JSON.stringify([
      {
        error: {
          json: {
            message: REVIEW_SERVICE_ERROR,
            code: -32603,
            data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
          },
        },
      },
    ]),
    {
      status: 500,
      headers: { "content-type": "application/json" },
    },
  );
}

export { REVIEW_SERVICE_ERROR };
