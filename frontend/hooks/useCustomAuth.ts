import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

export function useCustomAuth(requireAuth = true) {
  const { data: session, status: nextAuthStatus } = useSession();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Allow other parts of the app (e.g., login page) to force an auth re-check
  // without relying solely on route changes.
  useEffect(() => {
    const handler = () => {
      setLoading(true);
      setRefreshCounter((c) => c + 1);
    };

    window.addEventListener("teachtrack:authChanged", handler);
    return () => window.removeEventListener("teachtrack:authChanged", handler);
  }, []);

  const refreshAuth = useCallback(() => {
    setLoading(true);
    setRefreshCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // Always try backend cookie auth first (email/password + HttpOnly cookie).
      try {
        const res = await axios.get("/api/v1/auth/me", {
          withCredentials: true,
        });

        if (res.data) {
          setUser(res.data);
          setIsAuthenticated(true);
          setLoading(false);
          return;
        }
      } catch (error) {
        // Backend cookie auth failed, check NextAuth session
        console.log("Backend auth check failed, checking NextAuth session...");
      }

      // If NextAuth is still loading, don't conclude unauthenticated yet.
      // This prevents premature redirects/locked UI while the session endpoint is resolving.
      if (nextAuthStatus === "loading") {
        return;
      }

      // If backend failed but NextAuth is authenticated, try to sync with backend
      if (nextAuthStatus === "authenticated" && session) {
        try {
          // Get the access token from session and call backend to set cookie
          const accessToken = (session as any).accessToken;
          if (accessToken) {
            // Try to get user info with the access token in header
            const res = await axios.get("/api/v1/auth/me", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              withCredentials: true,
            });

            if (res.data) {
              setUser(res.data);
              setIsAuthenticated(true);
              setLoading(false);
              return;
            }
          }

          // Fallback to session user data
          const sessionUser = (session as any).user;
          if (sessionUser) {
            setUser(sessionUser);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Failed to sync NextAuth with backend:", error);
        }
      }

      // No authentication found
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);

      if (requireAuth) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [nextAuthStatus, session, requireAuth, router, pathname, refreshCounter]);

  const logout = useCallback(async () => {
    try {
      // Call backend logout to clear cookie
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      console.error("Backend logout failed", e);
    }

    // Clear session storage
    sessionStorage.clear();

    // Clear NextAuth session
    try {
      await signOut({ redirect: false });
    } catch (e) {
      // NextAuth not available or no session
    }

    setUser(null);
    setIsAuthenticated(false);

    toast.success("Logged out successfully");
    window.location.href = "/";
  }, []);

  return { user, loading, isAuthenticated, logout, refreshAuth };
}
