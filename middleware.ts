import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only protect the OLD Clerk-based dashboard routes.
// Our new custom routes (/login, /user-dashboard, /super-admin, /admin)
// handle their own auth via JWT in localStorage.
const isClerkProtectedRoute = createRouteMatcher([
  // "/dashboard(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isClerkProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files with extensions (.txt, .png, .ico, etc.)
    '/((?!_next|[^?]*\\.[\\w]+$).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
