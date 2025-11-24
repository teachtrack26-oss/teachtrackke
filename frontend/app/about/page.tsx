"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FiCheck,
  FiArrowRight,
  FiBookOpen,
  FiClock,
  FiTrendingUp,
  FiUsers,
  FiTarget,
  FiHeart,
  FiAward,
} from "react-icons/fi";

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * end));
      
      if (progress === 1) clearInterval(timer);
    }, 20);

    return () => clearInterval(timer);
  }, [end, duration, isVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.3 }
    );

    const element = document.getElementById('about-stats');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return <span>{count}{suffix}</span>;
}

export default function AboutPage() {
  const features = [
    {
      icon: <FiBookOpen className="w-8 h-8 text-white" />,
      title: "Complete Curriculum",
      description: "Pre-loaded CBC curricula (Grades 1-10) with strands, sub-strands, learning outcomes, core competencies, and detailed tracking.",
      color: "from-indigo-500 to-purple-600",
    },
    {
      icon: <FiClock className="w-8 h-8 text-white" />,
      title: "Smart Timetabling",
      description: "Drag-and-drop weekly schedules, automatic conflict detection, mobile swipe navigation, and intelligent rescheduling.",
      color: "from-green-500 to-emerald-600",
    },
    {
      icon: <FiTrendingUp className="w-8 h-8 text-white" />,
      title: "Advanced Analytics",
      description: "11 customizable widgets: curriculum progress, attendance, teaching insights, trend graphs, deadlines, and performance metrics.",
      color: "from-amber-500 to-orange-600",
    },
  ];

  const values = [
    {
      icon: <FiUsers className="w-6 h-6" />,
      title: "Teacher-Centric",
      description: "Every feature is built based on feedback from real Kenyan educators.",
    },
    {
      icon: <FiTarget className="w-6 h-6" />,
      title: "CBC Focused",
      description: "Specifically designed for the Competency Based Curriculum structure.",
    },
    {
      icon: <FiHeart className="w-6 h-6" />,
      title: "Passion for Education",
      description: "We believe technology should empower teachers, not replace them.",
    },
    {
      icon: <FiAward className="w-6 h-6" />,
      title: "Excellence",
      description: "Committed to providing world-class tools for Kenyan schools.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 opacity-90" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-1.5 mb-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-indigo-300 font-medium text-sm animate-fade-in">
            👋 Empowering Kenyan Educators
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">TeachTrack</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to simplify teaching administration so educators can focus on what truly matters: inspiring the next generation.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section id="about-stats" className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Teachers", value: 500, suffix: "+" },
              { label: "Schools", value: 50, suffix: "+" },
              { label: "Lessons Planned", value: 15000, suffix: "+" },
              { label: "Hours Saved", value: 2500, suffix: "+" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <div className="prose prose-lg text-gray-600">
                <p className="mb-6">
                  TeachTrack was born from a simple observation: Kenyan teachers spend too much time on paperwork and not enough time with their students.
                </p>
                <p className="mb-6">
                  With the introduction of CBC, the administrative burden increased significantly. We built TeachTrack to solve this problem—a comprehensive digital platform designed specifically for the Kenyan education system.
                </p>
                <p>
                  Our goal is to reduce administrative tasks by 70%, giving every teacher back 10+ hours a week to focus on lesson delivery, student engagement, and personal well-being.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built for Modern Teaching
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A complete ecosystem for the modern Kenyan educator
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 rounded-bl-full transition-transform group-hover:scale-150 duration-700`} />
                
                <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">
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

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-16 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Transform Your Teaching?
              </h2>
              <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
                Join hundreds of Kenyan teachers who have already switched to a smarter, more efficient way of managing their classrooms.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-bold rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  Start Free Trial
                  <FiArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-indigo-700/50 backdrop-blur-sm text-white font-bold rounded-xl border border-white/20 hover:bg-indigo-700/70 transition-all duration-300"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
