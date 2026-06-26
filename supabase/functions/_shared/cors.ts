const DEFAULT_ORIGINS = [
  "http://localhost:5173",
  "https://idokon-course.vercel.app",
];

function getAllowedOrigins(): string[] {
  const fromEnv = Deno.env.get("FRONTEND_ORIGIN");
  if (!fromEnv) return DEFAULT_ORIGINS;
  return fromEnv.split(",").map((s) => s.trim()).filter(Boolean);
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = getAllowedOrigins();
  const allowOrigin =
    !origin || allowed.length === 0 || allowed.includes(origin)
      ? origin || allowed[0] || "*"
      : allowed[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }
  return null;
}

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
    },
  });
}
