"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiSettings,
  FiChevronDown,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check authentication status on every route change
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      const userData = localStorage.getItem("user");

      if (token && userData) {
        setUser(JSON.parse(userData));
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, [pathname]); // Re-check when route changes

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    async function fetchNextLesson() {
      if (!isLoggedIn) return;
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(
          "http://localhost:8000/api/v1/timetable/entries/next",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        if (data.has_next_lesson && data.entry) {
          setNextLesson(data.entry);
          updateCountdown(data.entry.time_slot.start_time);
          timer = setInterval(
            () => updateCountdown(data.entry.time_slot.start_time),
            1000
          );
        } else {
          setNextLesson(null);
          setCountdown("");
        }
      } catch {
        setNextLesson(null);
        setCountdown("");
      }
    }
    function updateCountdown(startTime: string) {
      const now = new Date();
      const [h, m] = startTime.split(":").map(Number);
      const lessonTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        h,
        m,
        0
      );
      const diff = lessonTime.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("Starting now");
        clearInterval(timer);
        return;
      }
      const hours = Math.floor(diff / 1000 / 60 / 60);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setCountdown(`${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds}s`);
    }
    fetchNextLesson();
    return () => clearInterval(timer);
  }, [isLoggedIn]);

  const handleLogout = async () => {
    setIsAccountDropdownOpen(false);
    // Clear localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    // Clear all possible session storage
    sessionStorage.clear();

    // Clear NextAuth session (if using OAuth)
    try {
      const { signOut } = await import("next-auth/react");
      await signOut({ redirect: false, callbackUrl: "/" });
    } catch (e) {
      // NextAuth not available or no session
    }

    setUser(null);
    setIsLoggedIn(false);

    // Force a hard navigation to clear any cached state
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  const navLinks = [
    { name: "Home", href: "/", public: true },
    { name: "About", href: "/about", public: true },
    { name: "Dashboard", href: "/dashboard", public: false },
    // { name: "Notes", href: "/notes", public: false }, // Temporarily hidden
    { name: "Curriculum", href: "/curriculum", public: false },
    { name: "Timetable", href: "/timetable", public: false },
    {
      name: "Professional Records",
      href: "/professional-records",
      public: false,
    },
  ];

  const isActiveLink = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  const handleProtectedRoute = (href: string, isPublic: boolean) => {
    if (!isPublic && !isLoggedIn) {
      toast.error("Please login to access this page");
      router.push("/login");
      return;
    }
    router.push(href);
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="text-2xl font-bold text-indigo-600">
                TeachTrack
              </div>
              <span className="ml-2 text-sm text-gray-500 font-medium">
                CBC
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleProtectedRoute(link.href, link.public)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActiveLink(link.href)
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                } ${
                  !link.public && !isLoggedIn
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={!link.public && !isLoggedIn}
              >
                {link.name}
                {!link.public && !isLoggedIn && (
                  <span className="ml-1 text-xs">🔒</span>
                )}
              </button>
            ))}

            {/* Auth Section */}
            <div className="flex items-center space-x-4 ml-6 border-l border-gray-300 pl-6">
              {isLoggedIn ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() =>
                      setIsAccountDropdownOpen(!isAccountDropdownOpen)
                    }
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="font-medium">
                      {user?.name || "Account"}
                    </span>
                    <FiChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isAccountDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isAccountDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email}
                        </p>
                      </div>

                      {/* Next Lesson Info */}
                      {nextLesson && (
                        <div className="px-4 py-2 border-b border-gray-100 bg-indigo-50 rounded-t">
                          <div className="text-xs text-gray-700 mb-1">
                            Next lesson:
                          </div>
                          <div className="font-semibold text-sm text-indigo-700">
                            {nextLesson.subject.subject_name} (
                            {nextLesson.time_slot.label})
                          </div>
                          <div className="text-xs text-gray-600">
                            Starts at {nextLesson.time_slot.start_time}
                          </div>
                          <div className="text-xs text-indigo-600 font-bold">
                            Countdown: {countdown}
                          </div>
                        </div>
                      )}

                      {/* Menu Items */}
                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <FiUser className="w-4 h-4" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        href="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsAccountDropdownOpen(false)}
                      >
                        <FiSettings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>

                      <div className="border-t border-gray-200 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <FiLogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-sm text-gray-700 hover:text-indigo-600 font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              {isMenuOpen ? (
                <FiX className="block h-6 w-6" />
              ) : (
                <FiMenu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleProtectedRoute(link.href, link.public)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActiveLink(link.href)
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                } ${
                  !link.public && !isLoggedIn
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={!link.public && !isLoggedIn}
              >
                {link.name}
                {!link.public && !isLoggedIn && (
                  <span className="ml-1 text-xs">🔒</span>
                )}
              </button>
            ))}

            {/* Mobile Auth Section */}
            <div className="pt-4 border-t border-gray-200">
              {isLoggedIn ? (
                <div className="space-y-2">
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiUser className="w-5 h-5" />
                    <span>{user?.name || "Dashboard"}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <FiLogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="block px-3 py-2 text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
