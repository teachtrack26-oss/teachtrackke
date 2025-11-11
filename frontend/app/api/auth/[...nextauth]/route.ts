import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Type augmentation interface (minimal) to quiet any typing mismatches
interface AuthUser {
  id: string;
  email: string;
  name?: string;
  accessToken?: string;
}

const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

          // Call the backend API to login
          const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            console.error(
              "Login failed:",
              response.status,
              await response.text()
            );
            return null;
          }

          const data = await response.json();

          // Get user info using the access token
          const userResponse = await fetch(`${apiUrl}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
          });

          if (!userResponse.ok) {
            console.error("Get user failed:", userResponse.status);
            return null;
          }

          const user = await userResponse.json();

          return {
            id: String(user.id),
            email: user.email,
            name: user.full_name,
            accessToken: data.access_token,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
    signOut: "/",
  },
  callbacks: {
    async jwt({ token, user, trigger }: any) {
      // Handle logout - clear the token
      if (trigger === "signOut") {
        return {};
      }

      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }: any) {
      // Clear any server-side session data
      token = {};
    },
  },
  debug: false, // Disable debug logs in production
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 60, // 30 minutes (matches backend token expiry)
  },
  secret: process.env.NEXTAUTH_SECRET || "your-secret-key-change-in-production",
};

// NextAuth v5 returns an object with handlers for GET/POST
const { handlers } = NextAuth(authOptions as any);

export const GET = handlers.GET;
export const POST = handlers.POST;
