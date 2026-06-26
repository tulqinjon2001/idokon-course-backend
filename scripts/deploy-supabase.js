/**
 * Barcha Edge Functions ni Supabase ga deploy qilish.
 *
 * Talab (.env):
 *   SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens
 *   SUPABASE_PROJECT_REF   — Project Reference ID
 *
 * Ishlatish: npm run supabase:deploy:local
 */
require("dotenv").config();

const { spawnSync } = require("child_process");

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN .env da yo'q.");
  console.error("https://supabase.com/dashboard/account/tokens dan oling.");
  process.exit(1);
}

if (!projectRef) {
  console.error("SUPABASE_PROJECT_REF .env da yo'q.");
  process.exit(1);
}

const functions = ["telegram-notify", "telegram-webhook", "healthz"];
const env = {
  ...process.env,
  SUPABASE_ACCESS_TOKEN: token,
};

for (const name of functions) {
  console.log(`\nDeploy: ${name}...`);
  const result = spawnSync(
    "npx",
    [
      "supabase",
      "functions",
      "deploy",
      name,
      "--project-ref",
      projectRef,
      "--no-verify-jwt",
    ],
    { stdio: "inherit", shell: true, env },
  );

  if (result.status !== 0) {
    console.error(`Deploy xato: ${name}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n✅ Barcha functionlar deploy qilindi.");
console.log(`Health: https://${projectRef}.supabase.co/functions/v1/healthz`);
