import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

// Cache duration in milliseconds (5 minutes)
const AUTH_CACHE_DURATION = 5 * 60 * 1000;

// Global cache to persist auth state across hook instances
let globalAuthCache: {
  user: any;
  timestamp: number;
} | null = null;

export function useCustomAuth(requireAuth = true) {
  const { data: session, status: nextAuthStatus } = useSession();
  const [user, setUser] = useState<any>(globalAuthCache?.user ?? null);
  const [loading, setLoading] = useState(!globalAuthCache?.user);
  const [isAuthenticated, setIsAuthenticated] = useState(!!globalAuthCache?.user);
  const router = useRouter();
  const pathname = usePathname();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const hasCheckedRef = useRef(false);

  // Allow other parts of the app (e.g., login page) to force an auth re-check
  useEffect(() => {
    const handler = () => {
      // Clear cache on forced refresh
      globalAuthCache = null;
      hasCheckedRef.current = false;
      setLoading(true);
      setRefreshCounter((c) => c + 1);
    };

    window.addEventListener("teachtrack:authChanged", handler);
    return () => window.removeEventListener("teachtrack:authChanged", handler);
  }, []);

  const refreshAuth = useCallback(() => {
    globalAuthCache = null;
    hasCheckedRef.current = false;
    setLoading(true);
    setRefreshCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // If we have valid cached data, use it
      if (globalAuthCache && Date.now() - globalAuthCache.timestamp < AUTH_CACHE_DURATION) {
        setUser(globalAuthCache.user);
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      // Prevent duplicate checks in the same render cycle
      if (hasCheckedRef.current && refreshCounter === 0) {
        return;
      }

      // Always try backend cookie auth first (email/password + HttpOnly cookie).
      try {
        const res = await axios.get("/api/v1/auth/me", {
          withCredentials: true,
        });

        if (res.data) {
          // Update global cache
          globalAuthCache = {
            user: res.data,
            timestamp: Date.now(),
          };
          setUser(res.data);
          setIsAuthenticated(true);
          setLoading(false);
          hasCheckedRef.current = true;
          return;
        }
      } catch (error: any) {
        // Only treat 401 as "not authenticated"
        // 403 means authenticated but not authorized - don't logout
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.log("Backend returned 401 - session expired or not logged in");
        } else if (axios.isAxiosError(error) && error.response?.status === 403) {
          // 403 = authenticated but forbidden - this shouldn't happen on /me
          console.log("Backend returned 403 - unexpected on /auth/me");
        } else {
          console.log("Backend auth check failed, checking NextAuth session...");
        }
      }

      // If NextAuth is still loading, don't conclude unauthenticated yet.
      if (nextAuthStatus === "loading") {
        return;
      }

      // If backend failed but NextAuth is authenticated, try to sync with backend
      if (nextAuthStatus === "authenticated" && session) {
        try {
          const accessToken = (session as any).accessToken;
          if (accessToken) {
            const res = await axios.get("/api/v1/auth/me", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              withCredentials: true,
            });

            if (res.data) {
              globalAuthCache = {
                user: res.data,
                timestamp: Date.now(),
              };
              setUser(res.data);
              setIsAuthenticated(true);
              setLoading(false);
              hasCheckedRef.current = true;
              return;
            }
          }

          // Fallback to session user data
          const sessionUser = (session as any).user;
          if (sessionUser) {
            setUser(sessionUser);
            setIsAuthenticated(true);
            setLoading(false);
            hasCheckedRef.current = true;
            return;
          }
        } catch (error) {
          console.error("Failed to sync NextAuth with backend:", error);
        }
      }

      // No authentication found
      globalAuthCache = null;
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      hasCheckedRef.current = true;

      if (requireAuth) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [nextAuthStatus, session, requireAuth, router, refreshCounter]);

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

    // Clear all caches
    globalAuthCache = null;
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

