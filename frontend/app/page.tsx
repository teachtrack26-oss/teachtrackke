import Link from "next/link";
import { FiCheckCircle, FiUpload, FiBarChart, FiBook } from "react-icons/fi";
import { FeatureCard, Step } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <header
        className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900"
        style={{
          background:
            "linear-gradient(to bottom right, #4f46e5, #4338ca, #312e81)",
        }}
      >
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-white drop-shadow-lg">
            TeachTrack CBC
          </div>
          <div className="space-x-4">
            <Link
              href="/login"
              className="text-white font-semibold hover:underline"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-white text-indigo-700 px-5 py-2.5 rounded-xl font-semibold shadow-xl hover:bg-gray-50 transition-colors"
            >
              Sign Up Free
            </Link>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white drop-shadow-2xl">
            Track Your CBC Curriculum Like Never Before
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white drop-shadow-lg">
            The smart way for Kenyan teachers to track progress, organize notes,
            and save hours every week. Built specifically for CBC Grades 1-10.
          </p>
          <Link
            href="/register"
            className="bg-cyan-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-2xl hover:bg-cyan-600 inline-block transition-colors"
          >
            Get Started Free
          </Link>
          <p className="mt-4 text-sm text-white drop-shadow">
            No credit card required • Free for 2 subjects
          </p>
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
              icon={<FiUpload className="w-12 h-12 text-indigo-600" />}
              title="Upload & Parse Curricula"
              description="Upload any CBC curriculum PDF and our AI automatically extracts all strands, sub-strands, and learning outcomes."
            />

            <FeatureCard
              icon={<FiCheckCircle className="w-12 h-12 text-green-500" />}
              title="Track Progress"
              description="Visual progress bars show exactly where you are. One-click to mark lessons complete."
            />

            <FeatureCard
              icon={<FiBook className="w-12 h-12 text-indigo-600" />}
              title="Organize Notes"
              description="Upload PowerPoints, PDFs, and Word docs. Auto-organized by subject and strand."
            />

            <FeatureCard
              icon={<FiBarChart className="w-12 h-12 text-amber-500" />}
              title="Generate Reports"
              description="Create professional progress reports for your headteacher in seconds."
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
              title="Upload Your Curriculum"
              description="Select your grade and subject, then upload the curriculum PDF. Our AI parses it in seconds."
            />
            <Step
              number="2"
              title="Track Your Progress"
              description="As you teach, mark lessons complete. See your progress visually across all subjects."
            />
            <Step
              number="3"
              title="Upload & Present Notes"
              description="Add your teaching notes and present them directly from the app - even offline."
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
            Ready to Save Hours Every Week?
          </h2>
          <p className="text-xl mb-8 text-white drop-shadow-lg">
            Join hundreds of Kenyan teachers already using TeachTrack CBC
          </p>
          <Link
            href="/register"
            className="bg-cyan-500 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-2xl hover:bg-cyan-600 inline-block transition-colors"
          >
            Start Free Trial
          </Link>
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
