"use client";

import Link from "next/link";
import {
  FiCheck,
  FiArrowRight,
  FiBookOpen,
  FiClock,
  FiTrendingUp,
} from "react-icons/fi";

export default function AboutPage() {
  const features = [
    {
      icon: <FiBookOpen className="w-6 h-6 text-indigo-600" />,
      title: "Complete Curriculum System",
      description:
        "Pre-loaded CBC curricula (Grades 1-10) with strands, sub-strands, learning outcomes, core competencies, and detailed tracking.",
    },
    {
      icon: <FiClock className="w-6 h-6 text-green-600" />,
      title: "Smart Timetable Management",
      description:
        "Drag-and-drop weekly schedules, automatic conflict detection, mobile swipe navigation, and intelligent rescheduling.",
    },
    {
      icon: <FiTrendingUp className="w-6 h-6 text-blue-600" />,
      title: "Advanced Analytics Dashboard",
      description:
        "11 customizable widgets: curriculum progress, attendance, teaching insights, trend graphs, deadlines, performance metrics, and resource center.",
    },
  ];

  const benefits = [
    "Track curriculum progress with visual milestones and completion percentages",
    "Create and manage weekly timetables with drag-and-drop functionality",
    "Generate AI-powered lesson plans aligned with CBC strands and learning outcomes",
    "Create professional schemes of work and records of work with PDF export",
    "Monitor student attendance with quick entry and performance analytics",
    "Access 11 dashboard widgets: weekly calendar, quick stats, trend graphs, and more",
    "View teaching insights: peak hours, subject distribution, and weekly comparisons",
    "Track upcoming deadlines for schemes, assessments, and progress reports",
    "Manage resource center with lesson plans, materials, and shared documents",
    "Export all professional records to print-ready PDF formats",
    "Access your complete teaching data anywhere, anytime on any device",
    "Customize dashboard layout and toggle widgets based on your preferences",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-cyan-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About TeachTrack CBC
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Designed by teachers, for teachers. TeachTrack CBC is Kenya's most
              comprehensive teaching management platform, combining curriculum
              tracking, timetable management, professional records, attendance
              monitoring, and advanced analytics in one powerful system.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Our Mission
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              To empower Kenyan educators with an all-in-one digital platform
              that simplifies CBC curriculum management, streamlines
              timetabling, automates professional documentation, and provides
              actionable insights. We reduce administrative burden by up to 70%,
              giving teachers more time to focus on what matters most—teaching
              and student engagement.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built for Modern Teaching
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every feature is designed with the real challenges of CBC
              implementation in mind.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Teachers Choose TeachTrack CBC
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Developed with input from experienced CBC teachers across Kenya,
                TeachTrack combines curriculum tracking, timetable management,
                professional documentation, and analytics into one seamless
                platform. Everything you need, nothing you don't.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <FiCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-cyan-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-indigo-100 mb-6">
                Join Kenyan teachers using TeachTrack CBC's comprehensive
                platform to manage curriculum, timetables, lesson plans,
                attendance, and analytics—all in one place. Save up to 10+ hours
                per week on administrative tasks.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center space-x-2 bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                <span>Start Free Today</span>
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Questions About TeachTrack CBC?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            We're here to help you succeed with CBC implementation. Reach out
            with any questions or feedback.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@teachtrack.co.ke"
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Contact Support
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-indigo-600 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Try TeachTrack Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
