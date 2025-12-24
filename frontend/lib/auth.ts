import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function cleanClientId(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/\s+/g, "");
  return cleaned ? cleaned : undefined;
}

function cleanSecret(value: string | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

// Support both legacy env names (GOOGLE_*) and Auth.js v5 conventional names (AUTH_GOOGLE_*).
const googleClientId = cleanClientId(
  process.env.GOOGLE_CLIENT_ID ??
    process.env.AUTH_GOOGLE_ID ??
    process.env.AUTH_GOOGLE_CLIENT_ID ??
    process.env.GOOGLE_ID
);

const googleClientSecret = cleanSecret(
  process.env.GOOGLE_CLIENT_SECRET ??
    process.env.AUTH_GOOGLE_SECRET ??
    process.env.AUTH_GOOGLE_CLIENT_SECRET ??
    process.env.GOOGLE_SECRET
);

const authSecret = cleanSecret(
  process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
);

if (!googleClientId || !googleClientSecret) {
  console.error("[auth] Google OAuth env missing", {
    hasGoogleClientId: Boolean(googleClientId),
    hasGoogleClientSecret: Boolean(googleClientSecret),
    // Helpful for catching the classic newline/whitespace issue.
    rawGoogleClientIdLength: process.env.GOOGLE_CLIENT_ID?.length,
    rawAuthGoogleIdLength: process.env.AUTH_GOOGLE_ID?.length,
  });
}

if (!authSecret) {
  console.error("[auth] NextAuth secret missing", {
    hasAUTH_SECRET: Boolean(process.env.AUTH_SECRET),
    hasNEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  basePath: "/api/auth",
  trustHost: true,
  secret: authSecret,
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist Google's OIDC id_token so we can exchange it for a backend cookie.
      // (Auth.js types are permissive here; we keep it minimal.)
      if (account?.provider === "google" && (account as any).id_token) {
        (token as any).googleIdToken = (account as any).id_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose id_token to the client for backend sync.
      (session as any).googleIdToken = (token as any).googleIdToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
