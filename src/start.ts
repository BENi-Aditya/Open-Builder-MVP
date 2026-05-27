import { createStart, createMiddleware } from "@tanstack/react-start";
import { attachSupabaseAuth } from "./integrations/supabase/auth-attacher";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      // If it's a 404 or other expected status code, let it pass through
      if ((error as any).statusCode === 404) {
        return next();
      }
      throw error;
    }
    
    // Log the actual error for Vercel logs
    console.error("Server-side error caught by middleware:", error);
    
    const message = error instanceof Error ? error.message : String(error);
    
    return new Response(renderErrorPage(message), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
  functionMiddleware: [attachSupabaseAuth],
}));
