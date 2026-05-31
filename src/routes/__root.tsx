import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts, Link, useRouter } from "@tanstack/react-router";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/AppShell";
import { PixelCursor } from "@/components/PixelCursor";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OpenBuilder" },
      { name: "description", content: "OpenBuilder is the social ecosystem for student builders. Ship projects, post build logs, find collaborators." },
      { property: "og:title", content: "OpenBuilder" },
      { property: "og:description", content: "Build publicly. Collaborate openly." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/logo.webp" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/logo.webp" },
    ],
    links: [
      { rel: "icon", href: "/logo.webp", type: "image/webp" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-8 text-center">
      <div>
        <div className="font-display text-7xl font-black">404</div>
        <p className="mt-2 text-muted-foreground font-mono uppercase text-xs">page not found</p>
        <Link to="/" className="brutal-btn mt-4 inline-flex">Back to feed</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="min-h-screen grid place-items-center p-8 text-center">
        <div>
          <div className="font-display text-3xl font-black">Something broke</div>
          <p className="mt-2 text-muted-foreground font-mono text-xs">{error.message}</p>
          <button onClick={() => { router.invalidate(); reset(); }} className="brutal-btn mt-4">Retry</button>
        </div>
      </div>
    );
  },
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const hasSupabaseConfig = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen grid place-items-center p-8 text-center">
        <div>
          <div className="font-display text-3xl font-black">OpenBuilder is deploying</div>
          <p className="mt-2 text-muted-foreground font-mono text-xs">
            Missing Supabase environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in
            Vercel, then redeploy.
          </p>
          <button onClick={() => location.reload()} className="brutal-btn mt-4">
            Reload
          </button>
        </div>
      </div>
    );
  }
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PixelCursor />
        <Toaster theme="dark" position="bottom-right" />
        <AppShell><Outlet /></AppShell>
      </AuthProvider>
    </QueryClientProvider>
  );
}
