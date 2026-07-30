import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Clerk Security Middleware
 * 
 * Why it is needed:
 * - Secures dashboard paths, settings, and backend API routes.
 * - Restricts access to authenticated users only, while keeping pages like the landing page public.
 * 
 * How it works:
 * - `createRouteMatcher` defines glob matchers for public pages.
 * - `auth.protect()` automatically redirects unauthorized requests to the sign-in page.
 * - The exported `config.matcher` tells Next.js which paths should be intercepted by the middleware.
 * 
 * Connections:
 * - Intercepts every HTTP request in the Next.js lifecycle.
 */

// Define public route matchers (Landing page, Sign in, Sign up)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)"
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    // If the path is not public, enforce authentication
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Intercept all routes except static assets (_next/static, favicon, etc.)
    "/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico).*)",
    // Always run for API and TRPC routes
    "/(api|trpc)(.*)",
  ],
};
