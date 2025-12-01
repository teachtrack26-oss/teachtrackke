"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiSettings,
  FiChevronDown,
  FiBell,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nextLesson, setNextLesson] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      const userData = localStorage.getItem("user");

      if (status === "authenticated" && session?.user) {
        // User is logged in via NextAuth (Google Sign-In)
        setUser(session.user);
        setIsLoggedIn(true);
      } else if (token && userData) {
        // User is logged in via email/password
        setUser(JSON.parse(userData));
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, [pathname, session, status]); // Re-check when route or session changes

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

  // Check if user is admin
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN";

  const navLinks = [
    { name: "Home", href: "/", public: true },
    { name: "About", href: "/about", public: true },
    { name: "Dashboard", href: "/dashboard", public: false },
    { name: "Notes", href: "/notes", public: false },
    { name: "Curriculum", href: "/curriculum", public: false },
    { name: "Timetable", href: "/timetable", public: false },
    {
      name: "Professional Records",
      href: "/professional-records",
      public: false,
    },
    {
      name: "Settings",
      href: "/settings/profile",
      public: false,
    },
    // Admin link - only visible to admins
    ...(isAdmin
      ? [
          {
            name: "Admin",
            href: "/admin/dashboard",
            public: false,
            adminOnly: true,
          },
        ]
      : []),
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
    <nav
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50"
          : "bg-white/80 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                T
              </div>
              <div className="ml-3 flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  TeachTrack
                </span>
                <span className="text-xs text-gray-500 font-medium tracking-wider">
                  CBC EDITION
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleProtectedRoute(link.href, link.public)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  (link as any).adminOnly
                    ? isActiveLink(link.href)
                      ? "text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md"
                      : "text-purple-600 bg-purple-50 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 hover:text-white border border-purple-200"
                    : isActiveLink(link.href)
                    ? "text-indigo-600 bg-indigo-50 shadow-sm"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                } ${
                  !link.public && !isLoggedIn
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={!link.public && !isLoggedIn}
              >
                {(link as any).adminOnly && <span className="mr-1">⚙️</span>}
                {link.name}
                {!link.public && !isLoggedIn && (
                  <span className="ml-1 text-xs opacity-70">🔒</span>
                )}
              </button>
            ))}

            {/* Auth Section */}
            <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
              {isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors relative">
                    <FiBell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>

                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() =>
                        setIsAccountDropdownOpen(!isAccountDropdownOpen)
                      }
                      className="flex items-center space-x-3 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50 transition-all duration-300 border border-transparent hover:border-gray-200"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
                        {(user?.name || user?.full_name || user?.email)
                          ?.charAt(0)
                          .toUpperCase() || "U"}
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-sm font-semibold text-gray-700 leading-none">
                          {user?.name ||
                            user?.full_name ||
                            user?.email?.split("@")[0] ||
                            "Account"}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {user?.role === "SUPER_ADMIN"
                            ? "Super Admin"
                            : user?.role === "SCHOOL_ADMIN"
                            ? "School Admin"
                            : "Teacher"}
                        </p>
                      </div>
                      <FiChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                          isAccountDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isAccountDropdownOpen && (
                      <div className="absolute right-0 mt-4 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in-up">
                        {/* User Info */}
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                          <p className="text-sm font-bold text-gray-900">
                            {user?.name ||
                              user?.full_name ||
                              user?.email?.split("@")[0] ||
                              "Account"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>

                        {/* Next Lesson Info */}
                        {nextLesson && (
                          <div className="mx-4 my-2 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                                Next Lesson
                              </span>
                              <span className="text-xs font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full shadow-sm">
                                {countdown}
                              </span>
                            </div>
                            <div className="font-bold text-sm text-gray-900">
                              {nextLesson.subject.subject_name}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              {nextLesson.time_slot.label} •{" "}
                              {nextLesson.time_slot.start_time}
                            </div>
                          </div>
                        )}

                        {/* Menu Items */}
                        <div className="px-2 py-2">
                          <Link
                            href="/dashboard"
                            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsAccountDropdownOpen(false)}
                          >
                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                              <FiUser className="w-4 h-4" />
                            </div>
                            <span className="font-medium">Dashboard</span>
                          </Link>

                          <Link
                            href="/settings"
                            className="flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 rounded-xl transition-all duration-200 group"
                            onClick={() => setIsAccountDropdownOpen(false)}
                          >
                            <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                              <FiSettings className="w-4 h-4" />
                            </div>
                            <span className="font-medium">Settings</span>
                          </Link>
                        </div>

                        <div className="border-t border-gray-100 mt-1 pt-2 px-2 pb-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
                          >
                            <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                              <FiLogOut className="w-4 h-4" />
                            </div>
                            <span className="font-medium">Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-indigo-600 font-semibold transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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
              className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none transition-colors"
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
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-xl absolute w-full">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleProtectedRoute(link.href, link.public)}
                className={`block w-full text-left px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  (link as any).adminOnly
                    ? isActiveLink(link.href)
                      ? "text-white bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md"
                      : "text-purple-600 bg-purple-50 border border-purple-200"
                    : isActiveLink(link.href)
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                } ${
                  !link.public && !isLoggedIn
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
                disabled={!link.public && !isLoggedIn}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {(link as any).adminOnly && (
                      <span className="mr-1">⚙️</span>
                    )}
                    {link.name}
                  </span>
                  {!link.public && !isLoggedIn && (
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      Locked
                    </span>
                  )}
                </div>
              </button>
            ))}

            {/* Mobile Auth Section */}
            <div className="pt-6 mt-6 border-t border-gray-100">
              {isLoggedIn ? (
                <div className="space-y-3">
                  <div className="px-4 flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {(user?.name || user?.full_name || user?.email)
                        ?.charAt(0)
                        .toUpperCase() || "U"}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">
                        {user?.name ||
                          user?.full_name ||
                          user?.email?.split("@")[0] ||
                          "Account"}
                      </div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FiUser className="w-5 h-5" />
                    <span>Dashboard</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 w-full px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <FiLogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 px-2">
                  <Link
                    href="/login"
                    className="flex items-center justify-center px-4 py-3 text-base font-bold text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center justify-center px-4 py-3 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-colors"
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
