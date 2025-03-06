import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next|api).*)", // Don't run middleware on static files or API routes
    "/(api|trpc)(.*)" // Run middleware on API routes
  ],
}