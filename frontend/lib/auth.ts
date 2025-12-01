import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Check if we're in development mode
const isDev = process.env.NODE_ENV !== "production";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  cookies: {
    pkceCodeVerifier: {
      name: isDev
        ? "next-auth.pkce.code_verifier"
        : "__Secure-next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "none",
        path: "/",
        secure: !isDev,
        maxAge: 60 * 15, // 15 minutes
      },
    },
    callbackUrl: {
      name: isDev
        ? "next-auth.callback-url"
        : "__Secure-next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !isDev,
      },
    },
    csrfToken: {
      name: isDev ? "next-auth.csrf-token" : "__Secure-next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !isDev,
      },
    },
    state: {
      name: isDev ? "next-auth.state" : "__Secure-next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: !isDev,
        maxAge: 60 * 15, // 15 minutes
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google") {
          // Send the ID token to the backend
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: account.id_token, // Send the ID token as expected by backend
              }),
            }
          );

          const data = await response.json();

          if (response.ok && data.access_token) {
            (user as any).accessToken = data.access_token;
            (user as any).user = data.user;
            return true;
          }
          console.error("Backend auth failed:", data);
          return false;
        }
        return true;
      } catch (error) {
        console.error("Backend auth error:", error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        console.log("JWT Callback - User Role:", (user as any).user?.role);
        token.accessToken = (user as any).accessToken;
        token.user = (user as any).user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken;
        (session as any).user = token.user;
        // Explicitly map role and subscription_type to session.user for easier access
        if ((token.user as any)?.role) {
          (session.user as any).role = (token.user as any).role;
        }
        if ((token.user as any)?.subscription_type) {
          (session.user as any).subscription_type = (
            token.user as any
          ).subscription_type;
        }
        console.log("Session Callback - User Role:", (token.user as any)?.role);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for development
});
