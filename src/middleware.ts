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
]);

export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
    })
  : function middleware() {
      // Clerk keys not configured yet — allow the public site to load.
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
