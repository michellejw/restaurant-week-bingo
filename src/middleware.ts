import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Match all routes that don't start with _ or .
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};