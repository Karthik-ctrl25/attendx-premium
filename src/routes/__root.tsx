import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ClassSpaceProvider } from "../lib/class-store";
import { AppDataProvider, useApp } from "../lib/store";
import { AppShell } from "../components/attendx/AppShell";
import { Onboarding } from "../components/attendx/Onboarding";
import { Toaster } from "../components/ui/sonner";
import { registerServiceWorker } from "../lib/register-sw";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <h1 className="font-display text-6xl font-semibold tracking-tight">404</h1>
        <h2 className="mt-3 text-lg font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This screen doesn't exist in AttendX yet.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-2xl bg-ink px-5 py-2.5 text-sm font-medium text-ink-foreground"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-2xl bg-ink px-5 py-2.5 text-sm font-medium text-ink-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-2xl border border-white/70 bg-white/60 px-5 py-2.5 text-sm font-medium"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "AttendX — Smart Attendance & Timetable" },
      {
        name: "description",
        content:
          "AttendX turns your CMR University ERP screenshots into a smart timetable and offline attendance tracker.",
      },
      { name: "theme-color", content: "#1A1D21" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "AttendX" },
      { property: "og:title", content: "AttendX — Smart Attendance & Timetable" },
      {
        property: "og:description",
        content: "Premium offline attendance tracking and smart timetable for CMR University.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap",
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.png" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function SetupGate() {
  const { ready, meta } = useApp();
  const session = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Theme is applied app-wide — auth and onboarding included.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", (meta.theme ?? "dark") !== "light");
  }, [meta.theme]);

  // Password recovery must stay reachable without a completed profile.
  if (pathname === "/reset-password") return <Outlet />;

  if (!ready || session === undefined) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="glass size-16 animate-pulse rounded-3xl" />
      </div>
    );
  }

  // Without a live session every server call (roles, admin, sync) is
  // unauthorized — send the user back to sign-in instead of rendering a
  // half-working shell from stale local data.
  if (!session || !meta.setupComplete) return <Onboarding />;


  return (
    <ClassSpaceProvider>
      <AppShell>
        {/* Required: nested routes render here. */}
        <Outlet />
      </AppShell>
    </ClassSpaceProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AppDataProvider>
        <SetupGate />
        <Toaster position="top-center" />
      </AppDataProvider>
    </QueryClientProvider>
  );
}
