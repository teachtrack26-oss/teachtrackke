"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // Only refetch every 5 minutes instead of constantly
      refetchOnWindowFocus={false} // Don't refetch on window focus
      refetchWhenOffline={false} // Don't refetch when offline
    >
      {children}
    </SessionProvider>
  );
}
