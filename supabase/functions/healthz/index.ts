import { handleCors, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  return jsonResponse(req, {
    ok: true,
    service: "quiz-telegram",
    platform: "supabase-edge",
    time: new Date().toISOString(),
  });
});
