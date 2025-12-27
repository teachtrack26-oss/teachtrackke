import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import posthog from "posthog-js";

// Cache duration in milliseconds (5 minutes)
const AUTH_CACHE_DURATION = 5 * 60 * 1000;

// Global cache to persist auth state across hook instances
let globalAuthCache: {
  user: any | null;
  timestamp: number;
} | null = null;

// Also cache the "not authenticated" state to avoid spamming /auth/me
// from multiple components (Navbar + pages) when the user is logged out.
let globalUnauthCache: {
  timestamp: number;
} | null = null;

export function useCustomAuth(requireAuth = true) {
  const [user, setUser] = useState<any>(globalAuthCache?.user ?? null);
  const [loading, setLoading] = useState(
    !globalAuthCache?.user && !globalUnauthCache
  );
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!globalAuthCache?.user
  );
  const router = useRouter();
  const pathname = usePathname();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const hasCheckedRef = useRef(false);

  // Allow other parts of the app (e.g., login page) to force an auth re-check
  useEffect(() => {
    const handler = () => {
      // Clear cache on forced refresh
      globalAuthCache = null;
      globalUnauthCache = null;
      hasCheckedRef.current = false;
      setLoading(true);
      setRefreshCounter((c) => c + 1);
    };

    window.addEventListener("teachtrack:authChanged", handler);
    return () => window.removeEventListener("teachtrack:authChanged", handler);
  }, []);

  const refreshAuth = useCallback(() => {
    globalAuthCache = null;
    globalUnauthCache = null;
    hasCheckedRef.current = false;
    setLoading(true);
    setRefreshCounter((c) => c + 1);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // If we have valid cached data, use it
      if (
        globalAuthCache &&
        Date.now() - globalAuthCache.timestamp < AUTH_CACHE_DURATION
      ) {
        setUser(globalAuthCache.user);
        setIsAuthenticated(true);
        setLoading(false);
        // Identify even on cache hit to ensure session continuity
        posthog.identify(String(globalAuthCache.user.id), {
            email: globalAuthCache.user.email,
            role: globalAuthCache.user.role,
            school_id: globalAuthCache.user.school_id
        });
        return;
      }

      // If we recently confirmed the user is not authenticated, reuse that
      if (
        globalUnauthCache &&
        Date.now() - globalUnauthCache.timestamp < AUTH_CACHE_DURATION
      ) {
        globalAuthCache = null;
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        hasCheckedRef.current = true;

        if (requireAuth) {
          router.push("/login");
        }
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
          // Identify User in PostHog
          posthog.identify(String(res.data.id), {
            email: res.data.email,
            role: res.data.role,
            school_id: res.data.school_id
          });

          // Update global cache
          globalAuthCache = {
            user: res.data,
            timestamp: Date.now(),
          };
          setUser(res.data);
          setIsAuthenticated(true);
          setLoading(false);
          hasCheckedRef.current = true;
          globalUnauthCache = null;
          return;
        }
      } catch (error: any) {
        // Only treat 401 as "not authenticated"
        // 403 means authenticated but not authorized - don't logout
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          // Expected when logged out; cache negative result to avoid repeated calls.
          globalUnauthCache = { timestamp: Date.now() };
        } else if (
          axios.isAxiosError(error) &&
          error.response?.status === 403
        ) {
          // 403 = authenticated but forbidden - this shouldn't happen on /me
          if (process.env.NODE_ENV !== "production") {
            console.log("Backend returned 403 - unexpected on /auth/me");
          }
        } else {
          if (process.env.NODE_ENV !== "production") {
            console.log("Backend auth check failed", error);
          }
        }
      }

      // No authentication found
      globalAuthCache = null;
      if (!globalUnauthCache) {
        globalUnauthCache = { timestamp: Date.now() };
      }
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      hasCheckedRef.current = true;
      posthog.reset(); // Key: Reset posthog if auth check fails

      if (requireAuth) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [requireAuth, router, refreshCounter]);

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
    globalUnauthCache = { timestamp: Date.now() };
    sessionStorage.clear();

    setUser(null);
    setIsAuthenticated(false);
    
    // Reset PostHog Session
    posthog.reset();

    toast.success("Logged out successfully");
    window.location.href = "/";
  }, []);

  return { user, loading, isAuthenticated, logout, refreshAuth };
}
