import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

import * as serverEntryImport from "@tanstack/react-start/server-entry";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const serverEntry = ((serverEntryImport as unknown as { default?: ServerEntry }).default ??
  (serverEntryImport as unknown as ServerEntry)) as ServerEntry;

function brandedErrorResponse(error?: unknown): Response {
  const message = error instanceof Error ? error.message : String(error || "Unknown error");
  console.error("Critical SSR Error:", message);
  if (error instanceof Error && error.stack) {
    console.error("Stack trace:", error.stack);
  }
  
  // Ensure the message is never empty so it shows in the UI
  const finalMessage = message.trim() || "An unexpected error occurred during server-side rendering.";
  
  return new Response(renderErrorPage(finalMessage), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  const error = consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`);
  return brandedErrorResponse(error);
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

export default {
  async fetch(request: Request, env: any, ctx: unknown) {
    const url = new URL(request.url);
    
    // Early exit for common missing static files to avoid SSR overhead/errors
    if (
      url.pathname === "/favicon.ico" || 
      url.pathname === "/robots.txt" || 
      url.pathname.startsWith("/assets/")
    ) {
      return new Response(null, { status: 404 });
    }

    // CRITICAL: Inject env variables into process.env for the Supabase client
    if (env && typeof env === "object") {
      // Direct assignment for the most common keys to be 100% sure
      if (env.VITE_SUPABASE_URL) process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
      if (env.VITE_SUPABASE_PUBLISHABLE_KEY) process.env.VITE_SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (env.SUPABASE_URL) process.env.SUPABASE_URL = env.SUPABASE_URL;
      if (env.SUPABASE_PUBLISHABLE_KEY) process.env.SUPABASE_PUBLISHABLE_KEY = env.SUPABASE_PUBLISHABLE_KEY;
      
      // Batch sync all other keys
      Object.entries(env).forEach(([key, value]) => {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      });
    }

    try {
      const response = await serverEntry.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      return brandedErrorResponse(error);
    }
  },
};
