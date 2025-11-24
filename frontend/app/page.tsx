"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FiCheckCircle, FiUpload, FiBarChart, FiBook, FiUsers, FiClock, FiAward, FiStar } from "react-icons/fi";
import { FeatureCard, Step } from "@/components/ui/card";

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

    const element = document.getElementById('stats-section');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return <span>{count}{suffix}</span>;
}

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const heroImages = ["/hero1.jpg", "/hero2.jpg"];

  useEffect(() => {
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
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push(isAdmin ? "/admin/dashboard" : "/dashboard");
    } else {
      router.push("/register");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - Enhanced */}
      <header className="relative h-[700px] md:h-[800px] overflow-hidden">
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
                className="object-cover scale-105 hover:scale-100 transition-transform duration-[10000ms]"
                quality={100}
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
            </div>
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-6 h-full flex flex-col justify-center items-center text-center">
          {/* Trust Badge */}
          <div className="mb-6 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium animate-fade-in">
            ✨ Built specifically for Kenyan CBC Teachers
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-white drop-shadow-2xl leading-tight">
            Complete Teaching<br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Management Platform
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-white/95 drop-shadow-lg leading-relaxed">
            Track curriculum, manage timetables, create AI-powered lesson plans, and generate
            professional reports. All in one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={handleGetStarted}
              className="group relative px-10 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-2xl text-lg font-bold shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
            >
              <span className="relative z-10">{isLoggedIn ? "Go to Dashboard" : "Get Started Free"}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl blur opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
            </button>
            
            <a
              href="#features"
              className="px-10 py-5 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white rounded-2xl text-lg font-semibold hover:bg-white/20 transition-all duration-300"
            >
              Learn More
            </a>
          </div>
          
          {!isLoggedIn && (
            <p className="mt-6 text-white/90 drop-shadow">
              🎁 No credit card required • Free for 2 subjects • Cancel anytime
            </p>
          )}

          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImage(index)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  index === currentImage
                    ? "bg-white w-12 shadow-lg shadow-white/50"
                    : "bg-white/40 w-2 hover:bg-white/70"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Animated Stats Section - NEW */}
      <section id="stats-section" className="py-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="text-5xl md:text-6xl font-bold mb-2">
                <AnimatedCounter end={500} suffix="+" />
              </div>
              <div className="text-lg opacity-90">Active Teachers</div>
            </div>
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="text-5xl md:text-6xl font-bold mb-2">
                <AnimatedCounter end={10} />
              </div>
              <div className="text-lg opacity-90">CBC Grade Levels</div>
            </div>
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="text-5xl md:text-6xl font-bold mb-2">
                <AnimatedCounter end={15000} suffix="+" />
              </div>
              <div className="text-lg opacity-90">Lessons Created</div>
            </div>
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="text-5xl md:text-6xl font-bold mb-2">
                <AnimatedCounter end={99} suffix="%" />
              </div>
              <div className="text-lg opacity-90">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Everything You Need
              </span> to Stay Organized
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed specifically for Kenyan CBC teachers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FiBook className="w-12 h-12" />,
                title: "Complete CBC Curriculum",
                description: "Pre-loaded curricula for Grades 1-10 with all strands, sub-strands, learning outcomes, and core competencies.",
                color: "from-indigo-500 to-purple-600",
                bgColor: "bg-indigo-50"
              },
              {
                icon: <FiCheckCircle className="w-12 h-12" />,
                title: "Smart Timetable Manager",
                description: "Create, manage, and track your weekly timetable. Drag-and-drop rescheduling with automatic conflict detection.",
                color: "from-green-500 to-emerald-600",
                bgColor: "bg-green-50"
              },
              {
                icon: <FiUpload className="w-12 h-12" />,
                title: "Professional Records",
                description: "Create lesson plans, schemes of work, and records of work. Export to PDF with professional templates.",
                color: "from-purple-500 to-pink-600",
                bgColor: "bg-purple-50"
              },
              {
                icon: <FiBarChart className="w-12 h-12" />,
                title: "Advanced Analytics",
                description: "Real-time dashboards with curriculum progress, attendance tracking, teaching insights, and performance metrics.",
                color: "from-amber-500 to-orange-600",
                bgColor: "bg-amber-50"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className={`group relative overflow-hidden rounded-3xl ${feature.bgColor} p-8 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2`}
              >
                <div className={`inline-block p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                
                {/* Decorative element */}
                <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-full transition-opacity duration-500`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - NEW */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Loved by Teachers Across Kenya
            </h2>
            <p className="text-xl text-gray-600">See what educators are saying about TeachTrack</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Sarah Wanjiru",
                role: "Grade 5 Teacher, Nairobi",
                content: "TeachTrack has transformed how I plan my lessons. The AI assistance saves me hours every week, and my students love the organized approach!",
                rating: 5
              },
              {
                name: "James Omondi",
                role: "CBC Coordinator, Mombasa",
                content: "Managing 8 different subjects was overwhelming. Now everything is in one place, and the curriculum tracking keeps me on schedule perfectly.",
                rating: 5
              },
              {
                name: "Faith Mutua",
                role: "Head Teacher, Kisumu",
                content: "The analytics dashboard gives me instant insights into teaching progress across all grades. It's a game-changer for school administration!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Enhanced */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Get Started in <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">4 Simple Steps</span>
            </h2>
            <p className="text-xl text-gray-600">From setup to success in minutes</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {[
              {
                number: "1",
                title: "Setup Your Teaching Profile",
                description: "Create your timetable, select CBC curricula for your subjects (Grades 1-10), and configure your teaching schedule with time slots and class sections.",
                icon: <FiUsers className="w-6 h-6" />
              },
              {
                number: "2",
                title: "Manage Daily Teaching",
                description: "View today's lessons on your dashboard, mark attendance, track curriculum progress, and access teaching resources. Drag-and-drop to reschedule lessons instantly.",
                icon: <FiClock className="w-6 h-6" />
              },
              {
                number: "3",
                title: "Create Professional Documents",
                description: "Generate lesson plans with AI assistance, create schemes of work, maintain records of work, and export everything to professional PDF formats.",
                icon: <FiBook className="w-6 h-6" />
              },
              {
                number: "4",
                title: "Monitor & Analyze",
                description: "Track curriculum completion, attendance rates, teaching insights, and performance metrics. View upcoming deadlines and resource center all in one place.",
                icon: <FiAward className="w-6 h-6" />
              }
            ].map((step, index) => (
              <div
                key={index}
                className="group relative flex items-start gap-6 p-8 bg-gradient-to-r from-gray-50 to-white rounded-3xl hover:shadow-xl transition-all duration-500 hover:-translate-x-2 border border-gray-100"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {step.number}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    <div className="text-indigo-600">{step.icon}</div>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-lg">{step.description}</p>
                </div>
                
                {/* Connection line (except last item) */}
                {index < 3 && (
                  <div className="absolute left-14 top-full w-0.5 h-6 bg-gradient-to-b from-indigo-300 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-400 rounded-full blur-3xl" />
        </div>
        
        <div className="relative container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-white drop-shadow-xl">
            Transform Your Teaching<br />Workflow Today
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-white/95 drop-shadow-lg max-w-3xl mx-auto leading-relaxed">
            Join hundreds of Kenyan teachers using TeachTrack for curriculum management,
            timetabling, lesson planning, and professional documentation
          </p>
          
          <button
            onClick={handleGetStarted}
            className="group relative px-12 py-6 bg-white text-indigo-700 rounded-2xl text-xl font-bold shadow-2xl hover:shadow-white/30 transition-all duration-300 hover:scale-105"
          >
            <span className="relative z-10">{isLoggedIn ? "Go to Dashboard" : "Start Free Trial"}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          </button>
          
          <p className="mt-6 text-white/90 text-lg">
            ✓ 14-day free trial &nbsp; • &nbsp; ✓ No credit card required &nbsp; • &nbsp; ✓ Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <h3 className="text-white text-xl font-bold mb-4">TeachTrack CBC</h3>
              <p className="text-gray-400 leading-relaxed">
                The complete teaching management platform built specifically for Kenyan CBC educators.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">&copy; 2025 TeachTrack CBC. Built with ❤️ for Kenyan Teachers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
