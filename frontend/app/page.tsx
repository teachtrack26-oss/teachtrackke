"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FiCheckCircle, FiUpload, FiBarChart, FiBook } from "react-icons/fi";
import { FeatureCard, Step } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const heroImages = ["/hero1.jpg", "/hero2.jpg"];

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      setIsLoggedIn(true);
      try {
        const user = JSON.parse(userData);
        setIsAdmin(user.is_admin || false);
      } catch (e) {
        console.error("Error parsing user data", e);
      }
    }
  }, []);

  useEffect(() => {
    // Auto-slide images every 5 seconds
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      // Redirect to appropriate dashboard
      if (isAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/register");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header className="relative h-[600px] md:h-[700px] overflow-hidden">
        {/* Background Image Slider */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={image}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentImage ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={image}
                alt={`Hero ${index + 1}`}
                fill
                priority={index === 0}
                className="object-cover"
                quality={100}
                unoptimized
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 via-indigo-800/80 to-indigo-900/70" />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-2xl">
            Complete Teaching Management for CBC Educators
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white drop-shadow-lg">
            Comprehensive platform for Kenyan teachers: Track curriculum, manage
            timetables, create lesson plans, monitor attendance, and generate
            professional reports. Built specifically for CBC Grades 1-10.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-cyan-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-2xl hover:bg-cyan-600 inline-block transition-colors"
          >
            {isLoggedIn ? "Go to Dashboard" : "Get Started Free"}
          </button>
          {!isLoggedIn && (
            <p className="mt-4 text-sm text-white drop-shadow">
              No credit card required • Free for 2 subjects
            </p>
          )}

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentImage
                    ? "bg-white w-8"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Everything You Need to Stay Organized
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FiBook className="w-12 h-12 text-indigo-600" />}
              title="Complete CBC Curriculum"
              description="Pre-loaded curricula for Grades 1-10 with all strands, sub-strands, learning outcomes, and core competencies."
            />

            <FeatureCard
              icon={<FiCheckCircle className="w-12 h-12 text-green-500" />}
              title="Smart Timetable Manager"
              description="Create, manage, and track your weekly timetable. Drag-and-drop rescheduling with automatic conflict detection."
            />

            <FeatureCard
              icon={<FiUpload className="w-12 h-12 text-purple-600" />}
              title="Professional Records"
              description="Create lesson plans, schemes of work, and records of work. Export to PDF with professional templates."
            />

            <FeatureCard
              icon={<FiBarChart className="w-12 h-12 text-amber-500" />}
              title="Advanced Analytics"
              description="Real-time dashboards with curriculum progress, attendance tracking, teaching insights, and performance metrics."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How It Works
          </h2>

          <div className="max-w-3xl mx-auto space-y-8">
            <Step
              number="1"
              title="Setup Your Teaching Profile"
              description="Create your timetable, select CBC curricula for your subjects (Grades 1-10), and configure your teaching schedule with time slots and class sections."
            />
            <Step
              number="2"
              title="Manage Daily Teaching"
              description="View today's lessons on your dashboard, mark attendance, track curriculum progress, and access teaching resources. Drag-and-drop to reschedule lessons instantly."
            />
            <Step
              number="3"
              title="Create Professional Documents"
              description="Generate lesson plans with AI assistance, create schemes of work, maintain records of work, and export everything to professional PDF formats."
            />
            <Step
              number="4"
              title="Monitor & Analyze"
              description="Track curriculum completion, attendance rates, teaching insights, and performance metrics. View upcoming deadlines and resource center all in one place."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-900 text-white text-center"
        style={{
          background:
            "linear-gradient(to bottom right, #4338ca, #3730a3, #312e81)",
        }}
      >
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6 drop-shadow-xl text-white">
            Transform Your Teaching Workflow Today
          </h2>
          <p className="text-xl mb-8 text-white drop-shadow-lg">
            Join Kenyan teachers using TeachTrack's comprehensive platform for
            curriculum management, timetabling, lesson planning, and
            professional documentation
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-cyan-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-2xl hover:bg-cyan-600 inline-block transition-colors"
          >
            {isLoggedIn ? "Go to Dashboard" : "Start Free Trial"}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-6 text-center">
          <p>&copy; 2025 TeachTrack CBC. Built for Kenyan Teachers.</p>
          <div className="mt-4 space-x-4">
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
