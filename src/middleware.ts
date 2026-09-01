import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim()
);

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",
  "/saves(.*)",
  "/scenes(.*)",
  "/drafts(.*)",
  "/settings(.*)",
  "/me",
  "/jobs/post(.*)",
  "/events/post(.*)",
  "/feature(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

function adminUserIds() {
  return new Set(
    (process.env.ADMIN_CLERK_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      if (!isProtectedRoute(req)) return;

      await auth.protect();

      if (isAdminRoute(req)) {
        const { userId } = await auth();
        const allow = adminUserIds();
        // Fail closed: empty allowlist → nobody reaches /admin.
        if (allow.size === 0 || !userId || !allow.has(userId)) {
          return NextResponse.redirect(new URL("/", req.url));
        }
      }
    })
  : function middleware() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
