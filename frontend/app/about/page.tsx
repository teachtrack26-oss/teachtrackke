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
      title: "CBC Curriculum Tracking",
      description:
        "Seamlessly track your Competency-Based Curriculum progress across all subjects and grade levels.",
    },
    {
      icon: <FiClock className="w-6 h-6 text-green-600" />,
      title: "Time-Saving Tools",
      description:
        "Automated lesson planning and progress tracking saves you hours every week.",
    },
    {
      icon: <FiTrendingUp className="w-6 h-6 text-blue-600" />,
      title: "Student Progress Insights",
      description:
        "Visual dashboards help you identify student needs and adjust teaching strategies.",
    },
  ];

  const benefits = [
    "Track lesson completion across all subjects",
    "Organize and access teaching notes instantly",
    "Generate progress reports for parents and administration",
    "Plan lessons with CBC strand alignment",
    "Manage multiple classes and subjects efficiently",
    "Access your data anywhere, anytime",
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
              Designed by teachers, for teachers. TeachTrack CBC is the
              comprehensive solution for managing Competency-Based Curriculum
              implementation in Kenyan schools.
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
              To empower Kenyan educators with intuitive digital tools that
              simplify CBC curriculum management, reduce administrative burden,
              and enhance teaching effectiveness. We believe technology should
              work for teachers, not against them.
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
                TeachTrack addresses the real pain points of curriculum
                management.
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
                Join hundreds of teachers already using TeachTrack CBC to
                streamline their curriculum management and focus on what matters
                most - teaching.
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
