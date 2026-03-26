'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Map } from 'lucide-react';
import Image from 'next/image';

// ── Auth-aware nav button ─────────────────────────────────────────
function NavCTA({ isLoggedIn, role }: {isLoggedIn: boolean, role: string | null}) {
  if (isLoggedIn) {
    const href = role === 'worker' ? '/dashboard/worker' : '/dashboard/customer';
    return (
      <Link href={href} className="px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-all active:scale-95 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent-foreground/80 animate-pulse" />
        Dashboard
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="hidden sm:block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        Sign in
      </Link>
      <Link href="/register" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-white hover:bg-primary/90 transition-all active:scale-95">
        Get started free
      </Link>
    </div>
  );
}

// ── Animated counter ─────────────────────────────────────────────
function Counter({ target, prefix = '', suffix = '', duration = 2000 } : {target: any, prefix: string, suffix: string, duration?: number}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ── Main landing page ─────────────────────────────────────────────
export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [dashTab, setDashTab] = useState('worker');
  // const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setIsLoggedIn(true);
          setUserRole(d.data.user.role);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Testimonial data
  const testimonials = [
    { name: 'Chukwuemeka Obi', role: 'Mechanic · Lagos', text: 'Before StreetCred, I had no way to prove my income. Now banks can see 3 years of verified payments. I just got my first business loan.', avatar: 'CO' },
    { name: 'Ngozi Adeyemi', role: 'Tailor · Abuja', text: 'My trust score went from 0 to 84 in 6 months. Customers now hire me without hesitation because they can see my verified history.', avatar: 'NA' },
    { name: 'Emeka Hassan', role: 'Electrician · Port Harcourt', text: 'StreetCred changed everything for me. The secure payment system means I always get paid, and every job builds my financial record.', avatar: 'EH' },
  ];

  return (
    <>
      <div className="min-h-screen">

        {/* ── NAVBAR ─────────────────────────────────────────────── */}
        <motion.header
          className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[rgba(249,250,251)] dark:bg-background border-b border-[hsl(213 27% 84%)] shadow-lg"
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          // style={{
          //   background: scrolled ? 'rgba(249,250,251,0.95)' : 'transparent',
          //   backdropFilter: scrolled ? 'blur(12px)' : 'none',
          //   borderBottom: scrolled ? '1px solid hsl(213 27% 84%)' : 'none',
          // }}
        >
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1 md:gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(221 66% 47%), hsl(221 68% 38%))' }}>
                <Map size={16} className='text-white' />
              </div>
              <span className="font-bold text-base md:text-lg text-foreground tracking-tight">StreetCred</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              {['How it works', 'Features', 'Preview'].map(label => (
                <Link key={label} href={`#${label.toLowerCase().replace(' ', '-')}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <NavCTA isLoggedIn={isLoggedIn} role={userRole} />
              {/* <button className="md:hidden p-2 text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button> */}
            </div>
          </div>

          {/* {mobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-md">
              {['How it works', 'Features', 'Dashboard', 'Testimonials'].map(label => (
                <Link key={label} href={`#${label.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileMenuOpen(false)} className="block px-5 py-3 text-sm font-medium text-foreground border-b border-border last:border-0">
                  {label}
                </Link>
              ))}
            </div>
          )} */}
        </motion.header>

        {/* ── HERO ───────────────────────────────────────────────── */}
        <motion.section
          className="hero-bg pt-32 px-5 relative overflow-hidden"
          style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left — headline */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground mb-6">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Build your financial identity today
                </div>

                <h1 className="font-display hero-headline mb-6 leading-[1.05]" style={{ fontSize: 'clamp(2.8rem, 4.5vw, 4.2rem)' }}>
                  The Trusted Financial Identity for <em className="text-accent gradient-text not-italic">Every Worker</em>
                </h1>

                <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8" style={{ fontFamily: 'var(--font-body)' }}>
                  StreetCred turns every job, every payment, every review into a verified financial identity — giving Nigeria's informal workers access to the financial system they've always deserved.
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  <Link href={isLoggedIn ? (userRole === 'worker' ? '/dashboard/worker' : '/dashboard/customer') : '/register'} className="group px-6 py-3.5 rounded-full text-sm font-semibold text-white btn-pulse inline-flex items-center gap-2 transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 30%))' }}>
                    {isLoggedIn ? 'Go to Dashboard' : 'Build my identity free'}
                    <ArrowRight size={16} className='group-hover:translate-x-2 duration-300 transition-all' />
                  </Link>
                  <Link href="#how-it-works" className="px-6 py-3.5 rounded-full text-sm font-semibold border border-border bg-card text-foreground hover:border-primary transition-all inline-flex items-center gap-2">
                    See how it works
                  </Link>
                </div>

                {/* <div className="flex items-center gap-6">
                  <div className="flex -space-x-2">
                    {['CE', 'NA', 'BL', 'TO', 'GF'].map((init, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white" style={{ background: `hsl(${220 + i * 15} 60% ${35 + i * 8}%)` }}>
                        {init}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Trusted by 12,000+ workers</p>
                    <p className="text-xs text-muted-foreground">across Lagos, Abuja, PH & beyond</p>
                  </div>
                </div> */}
              </div>

              {/* Right — hero visual */}
              <div className="relative hidden lg:block">
                {/* Main card */}
                <div className="float relative z-10">
                  <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Trust Score</p>
                        <p className="text-3xl font-extrabold text-foreground">84 <span className="text-sm text-muted-foreground font-normal">/100</span></p>
                      </div>
                      <div className="relative w-16 h-16">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r="24" fill="none" stroke="hsl(214 32% 91%)" strokeWidth="6" />
                          <circle cx="30" cy="30" r="24" fill="none" stroke="hsl(160 84% 39%)" strokeWidth="6" strokeDasharray="127 150.8" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-accent">84%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {[
                        { label: 'Completed jobs', value: '41', pct: 82 },
                        { label: 'Verified payments', value: '₦1.2M', pct: 76 },
                        { label: 'Avg rating', value: '4.9★', pct: 98 },
                      ].map(s => (
                        <div key={s.label}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{s.label}</span>
                            <span className="font-semibold text-foreground">{s.value}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.pct}%`, background: 'hsl(160 84% 39%)' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                 {/* Floating payment pill */}
                 <div className="float-delay absolute -bottom-4 -left-8 bg-card border border-border rounded-xl px-4 py-3 shadow-lg z-20">
                   <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center">
                       <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                       </svg>
                     </div>
                     <div>
                       <p className="text-xs font-semibold text-foreground">Payment verified</p>
                       <p className="text-[10px] text-muted-foreground">₦45,000 · Engine repair job</p>
                     </div>
                   </div>
                 </div>

                 {/* Floating review pill */}
                 <div className="float absolute -top-4 -right-4 bg-card border border-border rounded-xl px-4 py-3 shadow-lg z-20"
                   style={{ animationDelay: '0.7s' }}>
                   <div className="flex items-center gap-2">
                     <div className="flex">
                       {[1,2,3,4,5].map(s => (
                         <svg key={s} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                           <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                         </svg>
                       ))}
                     </div>
                     <p className="text-[10px] text-foreground font-medium">"Excellent work!"</p>
                   </div>
                 </div>                
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── STATS ──────────────────────────────────────────────── */}
        {/* <motion.section
          className="py-16 px-5 border-y border-border bg-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 12000, prefix: '', suffix: '+', label: 'Active Workers' },
              { value: 2.4, prefix: '₦', suffix: 'B+', label: 'Payments Processed', isDecimal: true },
              { value: 48000, prefix: '', suffix: '+', label: 'Jobs Completed' },
              { value: 98, prefix: '', suffix: '%', label: 'Satisfaction Rate' },
            ].map((stat, i) => (
              <motion.div key={i} className="reveal" style={{ transitionDelay: `${i * 0.1}s` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-3xl md:text-4xl font-extrabold text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {stat.isDecimal
                    ? <>{stat.prefix}{stat.value}{stat.suffix}</>
                    : <Counter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  }
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.section> */}

        {/* ── HOW IT WORKS ───────────────────────────────────────── */}
        <motion.section
          id="how-it-works"
          className="py-24 px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">How it works</p>
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Three steps to your <span className="gradient-text text-accent">financial identity</span>
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                From invisible worker to credible entrepreneur — the journey starts with a single job.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
              {/* Connector line */}
              <div className="hidden -z-10 md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-linear-to-r from-transparent via-border to-transparent" />

              {[
                {
                  step: '01',
                  title: 'Create your profile',
                  desc: 'Sign up as a worker in under 3 minutes. Add your profession, skills, and bank account.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ),
                },
                {
                  step: '02',
                  title: 'Complete verified jobs',
                  desc: 'Customers find you, hire you, and pay securely through Interswitch. Every transaction is recorded.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                },
                {
                  step: '03',
                  title: 'Build your credit score',
                  desc: 'Each payment and review grows your Trust Score — your verified financial identity for loan access.',
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ),
                },
              ].map((step, i) => (
                <motion.div key={i} className={`feature-card bg-card border border-border rounded-2xl p-7 transition-all duration-300 cursor-default`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="feature-icon w-12 h-12 rounded-xl bg-primary/8 text-primary flex items-center justify-center transition-all duration-300" style={{ background: 'hsl(221 66% 47% / 0.08)' }}>
                      {step.icon}
                    </div>
                    <span className="text-xs font-bold text-muted-foreground font-mono">{step.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── FEATURES ───────────────────────────────────────────── */}
        <motion.section
          id="features"
          className="py-24 px-5 bg-card border-y border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Built for the trade</p>
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                Everything you need to <span className="gradient-text">grow</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: '🏆', title: 'Financial Identity', desc: 'Your trust score is your greatest asset. Build a verifiable financial history that banks and lenders can trust.', tag: 'Core feature' },
                { icon: '✅', title: 'Verified Reviews', desc: 'Only customers who actually hired and paid you can leave reviews. Every star you earn is real.', tag: 'Trust' },
                { icon: '💳', title: 'Secure Payments', desc: "Interswitch-powered payments mean you always get paid. No cash disputes, no chasing clients.", tag: 'Payments' },
                { icon: '📊', title: 'Earnings Analytics', desc: 'See your income trends, monthly breakdowns, and projected credit eligibility at a glance.', tag: 'Analytics' },
                { icon: '🔒', title: 'Phone Verification', desc: 'OTP-verified accounts mean every worker on StreetCred is who they say they are.', tag: 'Security' },
                { icon: '🚀', title: 'Credit Pathway', desc: 'Workers with 80+ trust scores are eligible for micro-credit assessments through our banking partners.', tag: 'Coming soon' },
              ].map((f, i) => (
                <motion.div key={i} className={`feature-card bg-background border border-border rounded-2xl p-6 transition-all duration-300 cursor-default`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: (i % 3) * 0.2 }}>
                  <div className="text-2xl mb-4">{f.icon}</div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-primary/8 text-primary whitespace-nowrap shrink-0">{f.tag}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── DASHBOARD PREVIEW ──────────────────────────────────── */}
        <motion.section
          id="preview"
          className="py-24 px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Platform preview</p>
              <h2 className="text-3xl md:text-4xl font-display mb-4">
                A dashboard built for <span className="gradient-text">real work</span>
              </h2>
              <p className="text-muted-foreground max-w-sm mx-auto text-sm">
                See what workers and customers experience every day on StreetCred.
              </p>
            </div>

            {/* Toggle */}
            <div className="flex justify-center mb-8">
              <div className="flex p-1 bg-muted rounded-full">
                {(['worker', 'customer'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDashTab(tab)}
                    className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 capitalize cursor-pointer
                      ${dashTab === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {tab === 'worker' ? '🔧 Worker' : '👤 Customer'}
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="reveal">
              <div className="dash-panel" style={{ animation: 'fadeIn 0.3s ease' }}>
                {dashTab === 'worker' ? (
                  <div className='border-2 rounded-4xl'>
                    <div className="hidden dark:block">
                      <Image src={"/worker-darkmode.png"} width={1200} height={800} alt='Worker Dashboard - darkmode' className='rounded-4xl' />
                    </div>
                    <div className="dark:hidden">
                      <Image src={"/worker-lightmode.png"} width={1200} height={800} alt='Worker Dashboard - lightmode' className='rounded-4xl' />
                    </div>
                  </div>
                  ) : (
                  <div className='border-2 rounded-4xl'>
                    <div className="hidden dark:block">
                      <Image src={"/customer-darkmode.png"} width={1200} height={800} alt='Customer Dashboard - darkmode' className='rounded-4xl' />
                    </div>
                    <div className="dark:hidden">
                      <Image src={"/customer-lightmode.png"} width={1200} height={800} alt='Customer Dashboard - lightmode' className='rounded-4xl' />
                    </div>
                  </div>
                  )}
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href={isLoggedIn ? (userRole === 'worker' ? '/dashboard/worker' : '/dashboard/customer') : '/register'} className="group inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border border-border bg-card hover:border-primary transition-all">
                {isLoggedIn ? (
                  <div className="flex items-center gap-1">
                    Open my dashboard
                    <ArrowRight size={16} className='group-hover:translate-x-2 duration-300 transition-all' />
                  </div>
                ) : 'Start your free account →'}
              </Link>
            </div>
          </div>
        </motion.section>

        {/* ── TESTIMONIALS ───────────────────────────────────────── */}
        {/* <motion.section
          id="testimonials"
          className="py-24 px-5 bg-card border-y border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold text-accent uppercase tracking-widest mb-3">Real stories</p>
              <h2 className="text-3xl md:text-4xl font-display">
                From the <span className="gradient-text font-display italic">front lines</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div key={i} className={`testimonial-card bg-background border border-border rounded-2xl p-6 transition-all duration-300 cursor-default`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.2 }}>
                  <div className="flex gap-0.5 mb-4">
                    {[1, 2, 3, 4, 5].map(s => (
                      <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed mb-5 font-medium">
                    “{t.text}”
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: `hsl(${220 + i * 20} 60% 40%)` }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section> */}

        {/* ── CTA BANNER ─────────────────────────────────────────── */}
        <motion.section
          className="py-24 px-5 noise relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(221 73% 22%) 0%, hsl(221 68% 38%) 60%, hsl(160 84% 25%) 100%)'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-display text-white mb-4">
              Ready to build your credit?
            </h2>
            <p className="text-white/70 mb-8 text-base md:text-lg max-w-lg mx-auto">
              Join the thousands of professionals who are taking control of their financial future. Sign up free and be earning in less than 3 minutes.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href={isLoggedIn ? (userRole === 'worker' ? '/dashboard/worker' : '/dashboard/customer') : '/register?role=worker'} className="group px-6 py-3.5 rounded-full text-sm font-bold bg-card text-white active:scale-95 transition-all inline-flex items-center gap-2" style={{ background: 'linear-gradient(135deg, hsl(160 84% 39%), hsl(160 84% 30%))' }}>
                {isLoggedIn ? 
                (
                  <div className="flex items-center gap-1">
                    <ArrowRight size={16} className='group-hover:-translate-x-2 duration-300 transition-all' />
                    Dashboard
                  </div>

                ) : 'Start as a Worker'
                }
                {!isLoggedIn && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
              </Link>
              {!isLoggedIn && (
                <Link href="/workers" className="px-6 py-3.5 rounded-full text-white text-sm font-bold border border-white/30 hover:bg-white/10 active:scale-95 transition-all">
                  Hire a Worker
                </Link>
              )}
            </div>
            <p className="text-white/40 text-xs mt-4">
              No credit card required · Free to join · Instant verification
            </p>
          </div>
        </motion.section>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer className="py-12 px-5 border-t border-border bg-card">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              {/* Brand */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(221 66% 47%), hsl(221 68% 38%))' }}>
                    {/* <span className="text-white font-bold text-xs">S</span> */}
                    <Map size={16} className='text-white' />
                  </div>
                  <span className="font-bold text-foreground">StreetCred</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                  Turning Nigeria's invisible workers into financially visible entrepreneurs.
                </p>
              </div>

              {/* Links */}
              {[
                {
                  heading: 'Platform',
                  links: ['How it works', 'Features', 'Pricing', 'Security'],
                },
                {
                  heading: 'Company',
                  links: ['About', 'Blog', 'Careers', 'Press'],
                },
                {
                  heading: 'Legal',
                  links: ['Privacy', 'Terms', 'Cookies', 'Contact'],
                },
              ].map((col) => (
                <div key={col.heading}>
                  <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-3">{col.heading}</p>
                  <ul className="space-y-2">
                    {col.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} StreetCred by GeniusLab. All rights reserved.
              </p>
              <p className="text-xs text-muted-foreground">
                Built for Nigeria's informal workers 🇳🇬
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}