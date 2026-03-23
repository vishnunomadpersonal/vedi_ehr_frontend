import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

function middleware(req: NextRequest) {
  if (!isClerkEnabled) {
    return NextResponse.next();
  }
  // Clerk middleware handles auth when enabled
  return clerkMiddleware(async (auth, request: NextRequest) => {
    if (isProtectedRoute(request)) await auth.protect();
  })(req, {} as any);
}

export default middleware;
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};
