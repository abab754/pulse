import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { NextResponse } from "next/server";

// Lightweight auth check for middleware — no Prisma adapter here
// since middleware runs on the Edge Runtime which doesn't support Node.js APIs.
// The full auth config (with Prisma adapter) lives in src/lib/auth.ts.
const { auth } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api/metrics") ||
    pathname.startsWith("/api/explain") ||
    pathname.startsWith("/api/alerts") ||
    pathname.startsWith("/api/projects");

  if (isProtected && !isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/metrics/:path*",
    "/api/explain/:path*",
    "/api/alerts/:path*",
    "/api/projects/:path*",
  ],
};
