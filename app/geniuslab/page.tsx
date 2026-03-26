'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// ── Auth-aware nav button ─────────────────────────────────────────
function NavCTA() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        Sign in
      </Link>
      <Link href="/register" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95">
        Get started free
      </Link>
    </div>
  );
}

// ── Main landing page ─────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-background">

        {/* ── NAVBAR ─────────────────────────────────────────────── */}
        <motion.header
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: scrolled ? 'rgba(249,250,251,0.95)' : 'transparent',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            borderBottom: scrolled ? '1px solid hsl(213 27% 84%)' : 'none',
          }}
        >
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(221 66% 47%), hsl(221 68% 38%))' }}>
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-lg text-foreground tracking-tight">StreetCred</span>
            </Link>
            <NavCTA />
          </div>
        </motion.header>

        {/* ── HERO ───────────────────────────────────────────────── */}
        <motion.section
          className="hero-bg pt-32 pb-20 px-5 relative flex flex-col justify-center items-center"
          style={{ minHeight: '100vh' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display mb-6 text-4xl md:text-5xl text-center leading-tight">
            Build Your Financial Identity
          </h1>
          <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl">
            Join thousands of workers in Nigeria who are turning their skills into verified financial histories.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="px-6 py-3.5 rounded-full text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-all active:scale-95">
              Get Started Free
            </Link>
            <Link href="#how-it-works" className="px-6 py-3.5 rounded-full text-sm font-semibold border border-border bg-card text-foreground hover:border-primary transition-all">
              Learn How It Works
            </Link>
          </div>
        </motion.section>

        {/* ── HOW IT WORKS ───────────────────────────────────────── */}
        <motion.section
          id="how-it-works"
          className="py-24 px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-display mb-4">How It Works</h2>
            <p className="text-muted-foreground mb-12">
              It's simple to start your journey with us.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Create Your Profile',
                  desc: 'Sign up in under 3 minutes. Add your profession and skills.',
                  icon: '📄',
                },
                {
                  title: 'Complete Verified Jobs',
                  desc: 'Get hired and paid securely through our platform.',
                  icon: '✅',
                },
                {
                  title: 'Build Your Credit Score',
                  desc: 'Every job completed increases your financial credibility.',
                  icon: '📈',
                },
              ].map((step, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center">
                  <div className="text-3xl mb-4">{step.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── CTA BANNER ─────────────────────────────────────────── */}
        <motion.section
          className="py-24 px-5 bg-gradient-to-r from-primary to-accent text-white text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-display mb-4">Ready to Get Started?</h2>
          <p className="mb-8 text-lg">Join the community and take control of your financial future.</p>
          <Link href="/register" className="px-6 py-3.5 rounded-full text-sm font-bold bg-white text-primary hover:bg-gray-100 transition-all">
            Start My Free Account
          </Link>
        </motion.section>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer className="py-12 px-5 border-t border-border bg-card">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} StreetCred. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">Built for Nigeria's informal workers 🇳🇬</p>
          </div>
        </footer>
      </div>
    </>
  );
}