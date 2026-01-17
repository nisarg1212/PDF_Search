/**
 * PDF Selection Viewer - Landing Page
 * 
 * A stunning, animated landing page showcasing the product
 */

"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

// Fixed particle positions to avoid hydration mismatch
const PARTICLE_POSITIONS = [
  { left: 10, top: 20 }, { left: 85, top: 15 }, { left: 45, top: 80 },
  { left: 25, top: 60 }, { left: 70, top: 40 }, { left: 15, top: 85 },
  { left: 90, top: 70 }, { left: 55, top: 25 }, { left: 35, top: 55 },
  { left: 75, top: 90 }, { left: 5, top: 45 }, { left: 60, top: 10 },
];

// Floating particles component - client only
function FloatingParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLE_POSITIONS.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-violet-400/30 rounded-full"
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

// Animated gradient orb
function GradientOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
      }}
    />
  );
}

// Feature card component
function FeatureCard({ icon, title, description, gradient, delay }: {
  icon: string;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      className="relative group"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay } }
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300 h-full">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-2xl mb-4 shadow-lg`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// Step component for "How it works"
function Step({ number, title, description, delay }: {
  number: number;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      className="flex items-start gap-4"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        hidden: { opacity: 0, x: -30 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.5, delay } }
      }}
    >
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/30">
        {number}
      </div>
      <div>
        <h4 className="text-lg font-semibold text-white mb-1">{title}</h4>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  const features = [
    {
      icon: "📝",
      title: "Smart Text Selection",
      description: "Select any text from your PDF and get instant AI-powered explanations, summaries, or definitions.",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: "🖼️",
      title: "Image Analysis",
      description: "Ctrl+drag to select any region or diagram. Our AI can analyze images, charts, and visual content.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: "🧮",
      title: "Equation Solver",
      description: "Automatically detects mathematical equations and can solve them step-by-step with detailed explanations.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: "💬",
      title: "Contextual Chat",
      description: "Ask follow-up questions. The AI remembers your conversation and provides contextually relevant answers.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: "📌",
      title: "Annotations & Notes",
      description: "Mark selections as correct or wrong, add personal notes, and track your progress through the document.",
      gradient: "from-red-500 to-rose-500",
    },
    {
      icon: "💾",
      title: "Auto-Save Everything",
      description: "Your PDF, chat history, and annotations are automatically saved and persist across sessions.",
      gradient: "from-indigo-500 to-violet-500",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#0a0a14] text-white overflow-x-hidden" style={{ overflowY: 'auto', height: '100vh' }}>
      {/* Floating Orbs */}
      <GradientOrb className="w-[600px] h-[600px] bg-violet-600/30 -top-64 -left-64" />
      <GradientOrb className="w-[500px] h-[500px] bg-cyan-600/20 top-1/3 -right-64" delay={2} />
      <GradientOrb className="w-[400px] h-[400px] bg-purple-600/20 bottom-0 left-1/4" delay={4} />

      <FloatingParticles />

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/5"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.span
              className="text-2xl"
              whileHover={{ rotate: 10 }}
            >
              📄
            </motion.span>
            <span className="font-bold text-lg">PDF Selection Viewer</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/library"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              My Library
            </Link>
            <Link
              href="/viewer"
              className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-20"
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
      >
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-8"
              variants={fadeInUp}
            >
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-violet-300">AI-Powered PDF Analysis</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              variants={fadeInUp}
            >
              <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
                Transform How You
              </span>
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Study PDFs
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
              variants={fadeInUp}
            >
              Select text, images, or equations from any PDF and get instant AI explanations.
              Mark your progress, add notes, and learn faster.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex items-center justify-center gap-4 mb-16"
              variants={fadeInUp}
            >
              <Link
                href="/viewer"
                className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl font-semibold text-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start for Free
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>

              <a
                href="#features"
                className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-semibold text-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                Learn More
              </a>
            </motion.div>

            {/* Hero Image / Demo */}
            <motion.div
              className="relative max-w-4xl mx-auto"
              variants={scaleIn}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-cyan-600/30 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2 shadow-2xl">
                <div className="bg-[#0f0f1a] rounded-xl overflow-hidden">
                  {/* Mock browser bar */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/70" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                      <div className="w-3 h-3 rounded-full bg-green-500/70" />
                    </div>
                    <div className="flex-1 text-center text-xs text-slate-500">
                      pdf-selection-viewer.app
                    </div>
                  </div>

                  {/* Mock app interface */}
                  <div className="flex h-64 md:h-80">
                    {/* PDF side */}
                    <div className="flex-1 p-4 border-r border-white/10">
                      <div className="h-full bg-white/5 rounded-lg p-3 space-y-2">
                        <div className="h-3 w-3/4 bg-slate-700 rounded" />
                        <div className="h-3 w-full bg-slate-700 rounded" />
                        <div className="h-3 w-5/6 bg-slate-700 rounded" />
                        <div className="h-3 w-3/4 bg-yellow-500/30 rounded border border-yellow-500/50" />
                        <div className="h-3 w-full bg-slate-700 rounded" />
                        <div className="h-3 w-2/3 bg-slate-700 rounded" />
                        <div className="mt-4 space-y-2">
                          <div className="h-16 w-20 bg-blue-500/20 rounded border border-blue-500/30 mx-auto" />
                        </div>
                      </div>
                    </div>

                    {/* Chat side */}
                    <div className="flex-1 p-4">
                      <div className="h-full flex flex-col">
                        <div className="flex-1 space-y-3">
                          <div className="flex justify-end">
                            <div className="bg-violet-600/50 rounded-2xl rounded-br-sm px-4 py-2 max-w-[80%]">
                              <div className="h-2 w-24 bg-white/30 rounded" />
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[80%] space-y-1">
                              <div className="h-2 w-32 bg-white/20 rounded" />
                              <div className="h-2 w-28 bg-white/20 rounded" />
                              <div className="h-2 w-20 bg-white/20 rounded" />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <div className="flex-1 h-10 bg-white/5 rounded-xl border border-white/10" />
                          <div className="w-16 h-10 bg-violet-600/50 rounded-xl" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
            <motion.div
              className="w-1.5 h-1.5 bg-white rounded-full"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span
              className="inline-block px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-sm text-cyan-300 mb-4"
              variants={fadeInUp}
            >
              ✨ Features
            </motion.span>
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-4"
              variants={fadeInUp}
            >
              Everything you need to
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                master any PDF
              </span>
            </motion.h2>
            <motion.p
              className="text-slate-400 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Powered by advanced AI, designed for students, researchers, and professionals who want to learn faster.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                {...feature}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.span
              className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-sm text-purple-300 mb-4"
              variants={fadeInUp}
            >
              🚀 How it Works
            </motion.span>
            <motion.h2
              className="text-4xl md:text-5xl font-bold mb-4"
              variants={fadeInUp}
            >
              Get started in
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> seconds</span>
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Step
                number={1}
                title="Upload Your PDF"
                description="Drag and drop any PDF file. It's automatically saved for next time."
                delay={0}
              />
              <Step
                number={2}
                title="Select Content"
                description="Highlight text, or Ctrl+drag to select images, diagrams, or equations."
                delay={0.1}
              />
              <Step
                number={3}
                title="Get AI Insights"
                description="Click Explain, Summarize, or Calculate. AI responds in real-time."
                delay={0.2}
              />
              <Step
                number={4}
                title="Track Progress"
                description="Mark items as correct/wrong, add notes, and build your knowledge."
                delay={0.3}
              />
            </div>

            {/* Animated Demo */}
            <motion.div
              className="relative"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-2xl" />
              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                {/* Selection simulation */}
                <div className="space-y-3 mb-4">
                  <div className="h-4 w-full bg-slate-700 rounded" />
                  <motion.div
                    className="h-4 w-3/4 bg-yellow-500/30 rounded border-2 border-yellow-400"
                    animate={{ boxShadow: ["0 0 0 0 rgba(250,204,21,0)", "0 0 0 8px rgba(250,204,21,0.2)", "0 0 0 0 rgba(250,204,21,0)"] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="h-4 w-5/6 bg-slate-700 rounded" />
                </div>

                {/* Toolbar popup */}
                <motion.div
                  className="bg-slate-800/90 backdrop-blur-sm rounded-xl p-3 border border-white/10"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-2 text-xs mb-2">
                    <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded">TEXT</span>
                    <span className="text-slate-400 truncate">Selected text goes here...</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs">💡 Explain</div>
                    <div className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs">📋 Summarize</div>
                    <div className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs">🧮 Calculate</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              className="text-4xl md:text-6xl font-bold mb-6"
              variants={fadeInUp}
            >
              Ready to learn
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                smarter, not harder?
              </span>
            </motion.h2>

            <motion.p
              className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Join thousands of students and researchers using AI to understand PDFs faster than ever.
            </motion.p>

            <motion.div variants={fadeInUp}>
              <Link
                href="/viewer"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-violet-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                <span>Get Started Free</span>
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <span className="text-sm text-slate-400">PDF Selection Viewer</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2026 PDF Selection Viewer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
