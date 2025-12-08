"use client";

import React, { useEffect, useState } from "react";

interface SecurityWrapperProps {
  children: React.ReactNode;
  watermarkText?: string;
  className?: string;
  isSuperAdmin?: boolean;
}

export const SecurityWrapper: React.FC<SecurityWrapperProps> = ({
  children,
  watermarkText = "CONFIDENTIAL - DO NOT SHARE",
  className = "",
  isSuperAdmin = false,
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (isSuperAdmin) return;

    // Disable keyboard shortcuts for copy/print/save
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "C")) || // Copy
        (e.ctrlKey && (e.key === "p" || e.key === "P")) || // Print
        (e.ctrlKey && (e.key === "s" || e.key === "S")) || // Save
        (e.ctrlKey && (e.key === "u" || e.key === "U")) // View Source
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSuperAdmin]);

  if (!isClient || isSuperAdmin) return <>{children}</>;

  return (
    <div
      className={`relative select-none print:hidden ${className}`}
      onContextMenu={(e) => e.preventDefault()} // Disable right-click
      onCopy={(e) => e.preventDefault()} // Disable copy event
      onCut={(e) => e.preventDefault()} // Disable cut event
    >
      {/* Watermark Overlay */}
      <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden opacity-[0.03] flex flex-wrap content-center justify-center gap-12 select-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="transform -rotate-45 text-xl font-bold whitespace-nowrap text-black"
          >
            {watermarkText}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Print Warning (Only visible when printing) */}
      <div className="hidden print:block fixed inset-0 bg-white z-[100] flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Restricted Content
          </h1>
          <p className="text-gray-600">
            Printing this content is strictly prohibited.
          </p>
          <p className="text-sm text-gray-400 mt-2">IP Logged & Monitored</p>
        </div>
      </div>
    </div>
  );
};
