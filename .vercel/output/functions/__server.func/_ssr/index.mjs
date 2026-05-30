let lastCapturedError;
const TTL_MS = 5e3;
function record(error) {
  lastCapturedError = { error, at: Date.now() };
}
if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record(event.error ?? event));
  globalThis.addEventListener(
    "unhandledrejection",
    (event) => record(event.reason)
  );
}
function consumeLastCapturedError() {
  if (!lastCapturedError) return void 0;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = void 0;
    return void 0;
  }
  const { error } = lastCapturedError;
  lastCapturedError = void 0;
  return error;
}
function renderErrorPage(errorMessage) {
  const displayError = errorMessage ? `<div style="margin-top: 1rem; padding: 0.5rem; background: #fee2e2; color: #991b1b; border-radius: 0.25rem; font-family: monospace; font-size: 0.75rem; text-align: left; overflow-x: auto;">
        <strong>Error:</strong> ${errorMessage}
      </div>` : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      ${displayError}
      <div class="actions" style="margin-top: 1.5rem;">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
let serverEntryPromise;
async function getServerEntry() {
  if (!serverEntryPromise) {
    serverEntryPromise = import("./server-CxMijKGk.mjs").then((n) => n.s).then(
      (m) => m.default ?? m
    );
  }
  return serverEntryPromise;
}
function brandedErrorResponse(error) {
  const message = error instanceof Error ? error.message : String(error || "Unknown error");
  console.error("Critical SSR Error:", message);
  if (error instanceof Error && error.stack) {
    console.error("Stack trace:", error.stack);
  }
  const finalMessage = message.trim() || "An unexpected error occurred during server-side rendering.";
  return new Response(renderErrorPage(finalMessage), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
async function normalizeCatastrophicSsrResponse(response) {
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
function isCatastrophicSsrErrorBody(body, responseStatus) {
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }
  const fields = payload;
  const expectedKeys = /* @__PURE__ */ new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }
  return fields.unhandled === true && fields.message === "HTTPError" && (fields.status === void 0 || fields.status === responseStatus);
}
const server = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/favicon.ico" || url.pathname === "/robots.txt" || url.pathname.startsWith("/assets/")) {
      return new Response(null, { status: 404 });
    }
    if (env && typeof env === "object") {
      if (env.VITE_SUPABASE_URL) process.env.VITE_SUPABASE_URL = env.VITE_SUPABASE_URL;
      if (env.VITE_SUPABASE_PUBLISHABLE_KEY) process.env.VITE_SUPABASE_PUBLISHABLE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;
      if (env.SUPABASE_URL) process.env.SUPABASE_URL = env.SUPABASE_URL;
      if (env.SUPABASE_PUBLISHABLE_KEY) process.env.SUPABASE_PUBLISHABLE_KEY = env.SUPABASE_PUBLISHABLE_KEY;
      Object.entries(env).forEach(([key, value]) => {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      });
    }
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      return brandedErrorResponse(error);
    }
  }
};
export {
  server as default,
  renderErrorPage as r
};
